// Appelée en boucle courte par le client tant que status = "generating".
// Mode image : la tâche de fond d'evaluate-media-exercise finalise déjà tout
// (upload + status="ready") — on ne fait ici que relire la ligne. Mode vidéo :
// on poll les deux opérations Veo (original + corrigé) et, une fois les deux
// terminées, on télécharge et stocke les vidéos avant de passer status="ready".
import { createClient } from "npm:@supabase/supabase-js@2.48.1";
import { CORS_HEADERS, jsonResponse } from "../_shared/podcast-utils.ts";

const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta";

interface VeoOperation {
  done?: boolean;
  error?: { message?: string };
  response?: { generateVideoResponse?: { generatedSamples?: { video?: { uri?: string; mimeType?: string } }[] } };
}

async function pollVeoOperation(apiKey: string, operationName: string): Promise<VeoOperation> {
  const resp = await fetch(`${GEMINI_API_BASE}/${operationName}`, { headers: { "x-goog-api-key": apiKey } });
  if (!resp.ok) throw new Error(`Suivi de l'opération vidéo échoué : ${await resp.text()}`);
  return await resp.json();
}

async function downloadVeoVideo(apiKey: string, uri: string): Promise<Uint8Array> {
  const resp = await fetch(uri, { headers: { "x-goog-api-key": apiKey } });
  if (!resp.ok) throw new Error(`Téléchargement de la vidéo générée échoué (${resp.status}).`);
  return new Uint8Array(await resp.arrayBuffer());
}

async function signedUrl(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  path: string | null,
): Promise<string | null> {
  if (!path) return null;
  const { data } = await supabase.storage.from("media-exercise-outputs").createSignedUrl(path, 3600);
  return data?.signedUrl ?? null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });

  try {
    const { attemptId } = await req.json();
    if (!attemptId) return jsonResponse({ error: "attemptId manquant." }, 400);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return jsonResponse({ error: "Non authentifié." }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: row, error: rowErr } = await supabase
      .from("media_exercise_attempts")
      .select("*")
      .eq("id", attemptId)
      .maybeSingle();
    if (rowErr) return jsonResponse({ error: rowErr.message }, 500);
    if (!row) return jsonResponse({ error: "Tentative introuvable." }, 404);

    if (row.status !== "generating") {
      const originalUrl = await signedUrl(supabase, row.original_media_path);
      const correctedUrl = await signedUrl(supabase, row.corrected_media_path);
      return jsonResponse({ attempt: row, originalUrl, correctedUrl });
    }

    if (row.mode === "image") {
      // La tâche de fond n'a pas encore fini — rien à faire de plus ici.
      return jsonResponse({ attempt: row, originalUrl: null, correctedUrl: null });
    }

    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiApiKey) return jsonResponse({ error: "GEMINI_API_KEY non configurée côté serveur." }, 500);
    if (!row.original_operation_name || !row.corrected_operation_name) {
      return jsonResponse({ attempt: row, originalUrl: null, correctedUrl: null });
    }

    const [originalOp, correctedOp] = await Promise.all([
      pollVeoOperation(geminiApiKey, row.original_operation_name),
      pollVeoOperation(geminiApiKey, row.corrected_operation_name),
    ]);

    if (originalOp.error || correctedOp.error) {
      const errMsg = originalOp.error?.message || correctedOp.error?.message || "Échec de génération vidéo.";
      const { data: updated } = await supabase.from("media_exercise_attempts").update({ status: "failed", error: errMsg }).eq("id", attemptId).select().single();
      return jsonResponse({ attempt: updated ?? row, originalUrl: null, correctedUrl: null });
    }

    if (!originalOp.done || !correctedOp.done) {
      return jsonResponse({ attempt: row, originalUrl: null, correctedUrl: null });
    }

    const originalVideo = originalOp.response?.generateVideoResponse?.generatedSamples?.[0]?.video;
    const correctedVideo = correctedOp.response?.generateVideoResponse?.generatedSamples?.[0]?.video;
    if (!originalVideo?.uri || !correctedVideo?.uri) {
      const { data: updated } = await supabase.from("media_exercise_attempts").update({
        status: "failed", error: "Vidéo terminée mais aucun fichier retourné par Veo.",
      }).eq("id", attemptId).select().single();
      return jsonResponse({ attempt: updated ?? row, originalUrl: null, correctedUrl: null });
    }

    const [originalBytes, correctedBytes] = await Promise.all([
      downloadVeoVideo(geminiApiKey, originalVideo.uri),
      downloadVeoVideo(geminiApiKey, correctedVideo.uri),
    ]);

    const originalPath = `${row.user_id}/${attemptId}/original.mp4`;
    const correctedPath = `${row.user_id}/${attemptId}/corrected.mp4`;
    const [up1, up2] = await Promise.all([
      supabase.storage.from("media-exercise-outputs").upload(originalPath, originalBytes, { contentType: "video/mp4", upsert: true }),
      supabase.storage.from("media-exercise-outputs").upload(correctedPath, correctedBytes, { contentType: "video/mp4", upsert: true }),
    ]);
    if (up1.error || up2.error) return jsonResponse({ error: up1.error?.message || up2.error?.message || "Échec de l'upload vidéo." }, 500);

    const { data: updated, error: updateErr } = await supabase.from("media_exercise_attempts").update({
      status: "ready", original_media_path: originalPath, corrected_media_path: correctedPath,
    }).eq("id", attemptId).select().single();
    if (updateErr) return jsonResponse({ error: updateErr.message }, 500);

    const originalUrl = await signedUrl(supabase, originalPath);
    const correctedUrl = await signedUrl(supabase, correctedPath);
    return jsonResponse({ attempt: updated, originalUrl, correctedUrl });
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : "Erreur inconnue." }, 500);
  }
});
