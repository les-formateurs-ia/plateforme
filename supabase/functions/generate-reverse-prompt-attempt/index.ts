// "Rétro-ingénierie" — l'élève soumet son propre prompt pour tenter de
// reproduire l'image cible de sa session ; on génère son image via Runware
// (même modèle que la cible, cf. generate-reverse-prompt-target) pour
// affichage côte à côte côté client. Pas de scoring automatique : la
// comparaison visuelle est laissée à l'élève.
import { createClient } from "npm:@supabase/supabase-js@2.48.1";
import { CORS_HEADERS, jsonResponse } from "../_shared/podcast-utils.ts";
import { submitAndAwaitRunware, downloadBytes } from "../_shared/runware.ts";

const RUNWARE_IMAGE_MODEL = "runware:101@1"; // FLUX.1 dev — cf. generate-reverse-prompt-target

async function generateImageBytes(runwareApiKey: string, prompt: string): Promise<Uint8Array> {
  const url = await submitAndAwaitRunware(runwareApiKey, {
    taskType: "imageInference",
    model: RUNWARE_IMAGE_MODEL,
    positivePrompt: prompt,
    width: 1024,
    height: 1024,
  });
  const { bytes } = await downloadBytes(url);
  return bytes;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });

  try {
    const runwareApiKey = Deno.env.get("RUNWARE_API_KEY");
    if (!runwareApiKey) return jsonResponse({ error: "RUNWARE_API_KEY non configurée côté serveur." }, 500);

    const { sessionId, promptText } = await req.json();
    if (typeof sessionId !== "string" || !/^[0-9a-f-]{36}$/i.test(sessionId)) return jsonResponse({ error: "sessionId manquant ou invalide." }, 400);
    if (typeof promptText !== "string" || !promptText.trim()) return jsonResponse({ error: "promptText manquant." }, 400);
    if (promptText.length > 2000) return jsonResponse({ error: "Ce prompt est trop long (2000 caractères max)." }, 400);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return jsonResponse({ error: "Non authentifié." }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) return jsonResponse({ error: "Session invalide." }, 401);
    const userId = userData.user.id;

    const { data: sessionRow, error: sessionErr } = await supabase
      .from("reverse_prompt_sessions")
      .select("id")
      .eq("id", sessionId)
      .eq("user_id", userId)
      .maybeSingle();
    if (sessionErr || !sessionRow) return jsonResponse({ error: "Session introuvable." }, 404);

    const { data: previousAttempts } = await supabase
      .from("reverse_prompt_attempts")
      .select("attempt_number")
      .eq("session_id", sessionId)
      .order("attempt_number", { ascending: false })
      .limit(1);
    const attemptNumber = (previousAttempts?.[0]?.attempt_number ?? 0) + 1;

    const { data: inserted, error: insertErr } = await supabase
      .from("reverse_prompt_attempts")
      .insert({ session_id: sessionId, user_id: userId, attempt_number: attemptNumber, prompt_text: promptText.trim(), status: "generating" })
      .select()
      .single();
    if (insertErr) return jsonResponse({ error: `Échec de l'enregistrement : ${insertErr.message}` }, 500);
    const attemptId = inserted.id as string;

    try {
      const imageBytes = await generateImageBytes(runwareApiKey, promptText.trim());
      const attemptPath = `${userId}/${sessionId}/attempt-${attemptNumber}.png`;
      const { error: uploadErr } = await supabase.storage.from("reverse-prompt-images").upload(attemptPath, imageBytes, { contentType: "image/png", upsert: true });
      if (uploadErr) throw new Error(uploadErr.message);

      await supabase.from("reverse_prompt_attempts").update({ status: "ready", generated_image_path: attemptPath }).eq("id", attemptId);

      const { data: signed } = await supabase.storage.from("reverse-prompt-images").createSignedUrl(attemptPath, 3600);
      return jsonResponse({ attemptId, attemptNumber, imageUrl: signed?.signedUrl ?? null });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur de génération inconnue.";
      await supabase.from("reverse_prompt_attempts").update({ status: "failed", error: message }).eq("id", attemptId);
      return jsonResponse({ error: message }, 502);
    }
  } catch (err) {
    console.error("generate-reverse-prompt-attempt:", err);
    return jsonResponse({ error: "Erreur inattendue." }, 500);
  }
});
