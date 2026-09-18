// Poll unique du statut d'une génération avatar Runware (rappelé par le
// client toutes les ~6s). L'étape audio (TTS) est déjà résolue de façon
// synchrone dans generate-studio-talkinghead — seule la vidéo est ici
// suivie, comme check-studio-video-status.
import { createClient } from "npm:@supabase/supabase-js@2.48.1";
import { CORS_HEADERS, jsonResponse } from "../_shared/podcast-utils.ts";
import { pollRunwareTask, finalizeRunwareResult } from "../_shared/runware.ts";
import { STUDIO_TALKINGHEAD_MODELS } from "../_shared/studio-talkinghead-models.ts";

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
      .from("studio_talkinghead_generations")
      .select("id, user_id, status, external_request_id, error_message, video_path, model")
      .eq("id", generationId)
      .single();
    if (rowError || !row) return jsonResponse({ error: "Génération introuvable." }, 404);
    if (row.user_id !== userId) return jsonResponse({ error: "Accès refusé." }, 403);

    if (row.status !== "pending") {
      return jsonResponse({ status: row.status, videoPath: row.video_path, error: row.error_message });
    }
    if (!row.external_request_id) return jsonResponse({ status: "pending" });

    const apiKey = Deno.env.get("RUNWARE_API_KEY");
    if (!apiKey) return jsonResponse({ error: "Configuration Runware manquante." }, 500);

    const polled = await pollRunwareTask(apiKey, row.external_request_id);
    if (polled.status === "pending") return jsonResponse({ status: "pending" });
    if (polled.status === "failed") {
      await userClient.from("studio_talkinghead_generations").update({ status: "failed", error_message: polled.error }).eq("id", generationId);
      return jsonResponse({ status: "failed", error: polled.error });
    }

    const runwareModel = STUDIO_TALKINGHEAD_MODELS[row.model]?.runwareModel ?? row.model;
    const result = await finalizeRunwareResult(userClient, {
      bucket: "studio-talkinghead",
      pathPrefix: `${userId}/results/${generationId}`,
      url: polled.url,
      table: "studio_talkinghead_generations",
      rowId: generationId,
      kind: "video",
      usage: { userId, mediaType: "video", model: runwareModel, cost: polled.cost, source: "studio_talkinghead" },
    });
    if (!result.ok) return jsonResponse({ status: "failed", error: result.error });
    return jsonResponse({ status: "ready", videoPath: result.path });
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : "Erreur inconnue." }, 500);
  }
});
