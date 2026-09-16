// Poll du statut d'une génération musicale (rappelé par le client, cf.
// pollMusicGenerationStatus côté studioMusic.ts). Contrairement à
// check-studio-image-status/check-studio-video-status, une ligne porte DEUX
// actifs Runware indépendants (audio + pochette) — la pochette est
// best-effort : si elle échoue, on abandonne silencieusement (cover_path
// reste null, l'UI affiche un visuel de repli) sans faire échouer tout le
// morceau, qui ne dépend que de l'audio pour passer "ready".
import { createClient } from "npm:@supabase/supabase-js@2.48.1";
import { CORS_HEADERS, jsonResponse } from "../_shared/podcast-utils.ts";
import { pollRunwareTask, uploadRunwareAsset } from "../_shared/runware.ts";
import { STUDIO_MUSIC_MODELS, MUSIC_MODEL_ID } from "../_shared/studio-music-models.ts";
import { STUDIO_MODELS } from "../_shared/studio-models.ts";
import { recordAiUsage } from "../_shared/ai-budget.ts";

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
      .from("studio_music_generations")
      .select("id, user_id, status, audio_path, cover_image_path, audio_external_id, cover_external_id, error_message")
      .eq("id", generationId)
      .single();
    if (rowError || !row) return jsonResponse({ error: "Génération introuvable." }, 404);
    if (row.user_id !== userId) return jsonResponse({ error: "Accès refusé." }, 403);

    if (row.status !== "pending") {
      return jsonResponse({ status: row.status, audioPath: row.audio_path, coverImagePath: row.cover_image_path, error: row.error_message });
    }

    const apiKey = Deno.env.get("RUNWARE_API_KEY");
    if (!apiKey) return jsonResponse({ error: "Configuration Runware manquante." }, 500);

    let audioPath: string | null = row.audio_path;
    let audioFailedError: string | null = null;

    if (!audioPath && row.audio_external_id) {
      const polled = await pollRunwareTask(apiKey, row.audio_external_id);
      if (polled.status === "ready") {
        const musicConfig = STUDIO_MUSIC_MODELS[MUSIC_MODEL_ID];
        const uploaded = await uploadRunwareAsset(userClient, {
          bucket: "studio-music",
          path: `${userId}/results/${generationId}-audio.mp3`,
          url: polled.url,
        });
        if ("path" in uploaded) {
          audioPath = uploaded.path;
          await userClient.from("studio_music_generations").update({ audio_path: audioPath, audio_external_id: null }).eq("id", generationId);
          await recordAiUsage(userClient, { userId, mediaType: "audio", model: musicConfig.runwareModel, cost: polled.cost, source: "studio_music" });
        } else {
          audioFailedError = uploaded.error;
        }
      } else if (polled.status === "failed") {
        audioFailedError = polled.error;
      }
    }

    if (audioFailedError) {
      await userClient.from("studio_music_generations").update({ status: "failed", error_message: audioFailedError }).eq("id", generationId);
      return jsonResponse({ status: "failed", error: audioFailedError });
    }

    let coverImagePath: string | null = row.cover_image_path;
    if (!coverImagePath && row.cover_external_id) {
      const polledCover = await pollRunwareTask(apiKey, row.cover_external_id);
      if (polledCover.status === "ready") {
        const coverConfig = STUDIO_MODELS["flux-dev"];
        const uploadedCover = await uploadRunwareAsset(userClient, {
          bucket: "studio-music",
          path: `${userId}/results/${generationId}-cover.jpg`,
          url: polledCover.url,
        });
        if ("path" in uploadedCover) {
          coverImagePath = uploadedCover.path;
          await userClient.from("studio_music_generations").update({ cover_image_path: coverImagePath, cover_external_id: null }).eq("id", generationId);
          await recordAiUsage(userClient, { userId, mediaType: "image", model: coverConfig.runwareModel, cost: polledCover.cost, source: "studio_music" });
        }
      } else if (polledCover.status === "failed") {
        // Best-effort : on abandonne la pochette sans faire échouer le morceau.
        await userClient.from("studio_music_generations").update({ cover_external_id: null }).eq("id", generationId);
      }
    }

    if (!audioPath) return jsonResponse({ status: "pending" });

    await userClient.from("studio_music_generations").update({ status: "ready", completed_at: new Date().toISOString() }).eq("id", generationId);
    return jsonResponse({ status: "ready", audioPath, coverImagePath });
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : "Erreur inconnue." }, 500);
  }
});
