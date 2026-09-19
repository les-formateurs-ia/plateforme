// Poll unique du statut d'une génération TTS Runware (rappelé par le client
// toutes les ~4s) — mêmes contrats que check-studio-talkinghead-status, mais
// un seul actif (audio) et pas de modèle avatar en aval.
import { createClient } from "npm:@supabase/supabase-js@2.48.1";
import { CORS_HEADERS, jsonResponse } from "../_shared/podcast-utils.ts";
import { pollRunwareTask, finalizeRunwareResult } from "../_shared/runware.ts";
import { TTS_MODEL_ID } from "../_shared/studio-tts-voices.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });

  try {
    const { generationId } = await req.json();
    if (!generationId) return jsonResponse({ error: "generationId manquant." }, 400);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return jsonResponse({ error: "Non authentifié." }, 401);

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) return jsonResponse({ error: "Session invalide." }, 401);
    const userId = userData.user.id;

    const { data: row, error: rowError } = await userClient
      .from("studio_tts_generations")
      .select("id, user_id, status, external_request_id, error_message, audio_path")
      .eq("id", generationId)
      .single();
    if (rowError || !row) return jsonResponse({ error: "Génération introuvable." }, 404);
    if (row.user_id !== userId) return jsonResponse({ error: "Accès refusé." }, 403);

    if (row.status !== "pending") {
      return jsonResponse({ status: row.status, audioPath: row.audio_path, error: row.error_message });
    }
    if (!row.external_request_id) return jsonResponse({ status: "pending" });

    const apiKey = Deno.env.get("RUNWARE_API_KEY");
    if (!apiKey) return jsonResponse({ error: "Configuration Runware manquante." }, 500);

    const polled = await pollRunwareTask(apiKey, row.external_request_id);
    if (polled.status === "pending") return jsonResponse({ status: "pending" });
    if (polled.status === "failed") {
      await userClient.from("studio_tts_generations").update({ status: "failed", error_message: polled.error }).eq("id", generationId);
      return jsonResponse({ status: "failed", error: polled.error });
    }

    const result = await finalizeRunwareResult(userClient, {
      bucket: "studio-tts",
      pathPrefix: `${userId}/results/${generationId}`,
      url: polled.url,
      table: "studio_tts_generations",
      rowId: generationId,
      kind: "audio",
      usage: { userId, mediaType: "audio", model: TTS_MODEL_ID, cost: polled.cost, source: "studio_tts" },
    });
    if (!result.ok) return jsonResponse({ status: "failed", error: result.error });
    return jsonResponse({ status: "ready", audioPath: result.path });
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : "Erreur inconnue." }, 500);
  }
});
