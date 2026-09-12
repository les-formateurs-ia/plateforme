// "Rétro-ingénierie" — au lancement de l'exercice, le système invente un
// prompt visuel (Gemini texte, inchangé) puis génère l'image cible
// correspondante via Runware (remplace Gemini image, cf. ticket "abandon
// Higgsfield" — Exercez-vous 2 est inclus dans le périmètre confirmé). Le
// prompt cible n'est jamais renvoyé au client : l'élève doit deviner en
// regardant l'image, pas en lisant le texte source.
import { createClient } from "npm:@supabase/supabase-js@2.48.1";
import { CORS_HEADERS, jsonResponse } from "../_shared/podcast-utils.ts";
import { submitAndAwaitRunware, downloadBytes } from "../_shared/runware.ts";

const GEMINI_TEXT_MODEL = "gemini-3.6-flash";
const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta";
const RUNWARE_IMAGE_MODEL = "runware:101@1"; // FLUX.1 dev — rapide, gratuit sur ce compte (cf. _shared/studio-models.ts)

const THEMES = [
  "un animal dans une situation insolite", "une nature morte", "un paysage futuriste",
  "un portrait stylisé", "une scène culinaire appétissante", "une architecture surprenante",
  "un objet du quotidien magnifié en gros plan", "une scène de science-fiction",
  "un décor fantastique", "une scène urbaine nocturne", "un jouet ou une figurine mise en scène",
  "une scène sous-marine", "un véhicule imaginaire",
];

async function inventTargetPrompt(apiKey: string): Promise<string> {
  const theme = THEMES[Math.floor(Math.random() * THEMES.length)];
  const metaPrompt = `Invente UNE description visuelle concrète et précise en français pour générer une image avec un générateur d'IA (type Midjourney/Imagen), sur le thème suivant : "${theme}". Donne uniquement la description finale (sujet, style, composition, éclairage), en 2-3 phrases maximum, prête à être utilisée telle quelle comme prompt de génération d'image. N'ajoute aucun texte avant ou après, uniquement le prompt.`;
  const resp = await fetch(`${GEMINI_API_BASE}/models/${GEMINI_TEXT_MODEL}:generateContent`, {
    method: "POST",
    headers: { "x-goog-api-key": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ parts: [{ text: metaPrompt }] }], generationConfig: { temperature: 1.15 } }),
  });
  if (!resp.ok) throw new Error(`Invention du prompt cible échouée : ${await resp.text()}`);
  const json = await resp.json();
  const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text?.trim()) throw new Error("Aucun prompt cible généré.");
  return text.trim();
}

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
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiApiKey) return jsonResponse({ error: "GEMINI_API_KEY non configurée côté serveur." }, 500);
    const runwareApiKey = Deno.env.get("RUNWARE_API_KEY");
    if (!runwareApiKey) return jsonResponse({ error: "RUNWARE_API_KEY non configurée côté serveur." }, 500);

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

    const targetPrompt = await inventTargetPrompt(geminiApiKey);

    const { data: session, error: insertErr } = await supabase
      .from("reverse_prompt_sessions")
      .insert({ user_id: userId, target_prompt: targetPrompt, status: "generating" })
      .select()
      .single();
    if (insertErr) return jsonResponse({ error: `Échec de l'enregistrement : ${insertErr.message}` }, 500);
    const sessionId = session.id as string;

    try {
      const imageBytes = await generateImageBytes(runwareApiKey, targetPrompt);
      const targetPath = `${userId}/${sessionId}/target.png`;
      const { error: uploadErr } = await supabase.storage.from("reverse-prompt-images").upload(targetPath, imageBytes, { contentType: "image/png", upsert: true });
      if (uploadErr) throw new Error(uploadErr.message);

      await supabase.from("reverse_prompt_sessions").update({ status: "ready", target_image_path: targetPath }).eq("id", sessionId);

      const { data: signed } = await supabase.storage.from("reverse-prompt-images").createSignedUrl(targetPath, 3600);
      return jsonResponse({ sessionId, targetImageUrl: signed?.signedUrl ?? null });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur de génération inconnue.";
      await supabase.from("reverse_prompt_sessions").update({ status: "failed", error: message }).eq("id", sessionId);
      return jsonResponse({ error: message }, 502);
    }
  } catch (err) {
    console.error("generate-reverse-prompt-target:", err);
    return jsonResponse({ error: "Erreur inattendue." }, 500);
  }
});
