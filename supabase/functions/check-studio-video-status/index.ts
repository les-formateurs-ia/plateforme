// Poll unique du statut d'une génération vidéo Higgsfield (rappelé par le
// client toutes les ~8s — les vidéos rendent nettement plus lentement que
// les images). Même principe que check-studio-image-status : JWT de
// l'élève propriétaire, pas de service-role.
import { createClient } from "npm:@supabase/supabase-js@2.48.1";
import { CORS_HEADERS, jsonResponse } from "../_shared/podcast-utils.ts";

const HIGGSFIELD_BASE_URL = "https://api.higgsfield.ai";

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
      .from("studio_video_generations")
      .select("id, user_id, status, external_request_id, error_message, video_path")
      .eq("id", generationId)
      .single();
    if (rowError || !row) return jsonResponse({ error: "Génération introuvable." }, 404);
    if (row.user_id !== userId) return jsonResponse({ error: "Accès refusé." }, 403);

    if (row.status !== "pending") {
      return jsonResponse({ status: row.status, videoPath: row.video_path, error: row.error_message });
    }

    const keyId = Deno.env.get("HIGGSFIELD_API_ID");
    const keySecret = Deno.env.get("HIGGSFIELD_API_SECRET");
    if (!keyId || !keySecret) return jsonResponse({ error: "Configuration Higgsfield manquante." }, 500);

    const statusResp = await fetch(`${HIGGSFIELD_BASE_URL}/requests/${row.external_request_id}/status`, {
      headers: { Authorization: `Key ${keyId}:${keySecret}` },
    });
    const statusText = await statusResp.text();
    if (!statusResp.ok) return jsonResponse({ error: `Higgsfield: ${statusText}` }, 502);
    const statusJson = JSON.parse(statusText) as {
      status: string;
      error?: string | null;
      video?: { url: string };
    };

    if (statusJson.status === "queued" || statusJson.status === "in_progress") {
      return jsonResponse({ status: "pending" });
    }

    if (statusJson.status !== "completed" || !statusJson.video?.url) {
      const message = statusJson.error || `Génération ${statusJson.status === "nsfw" ? "refusée (contenu sensible)" : "échouée"}.`;
      await userClient.from("studio_video_generations").update({ status: "failed", error_message: message }).eq("id", generationId);
      return jsonResponse({ status: "failed", error: message });
    }

    const videoResp = await fetch(statusJson.video.url);
    if (!videoResp.ok) {
      await userClient.from("studio_video_generations").update({ status: "failed", error_message: "Téléchargement de la vidéo échoué." }).eq("id", generationId);
      return jsonResponse({ status: "failed", error: "Téléchargement de la vidéo échoué." });
    }
    const contentType = videoResp.headers.get("content-type") || "video/mp4";
    const bytes = new Uint8Array(await videoResp.arrayBuffer());
    const videoPath = `${userId}/results/${generationId}.mp4`;

    const { error: uploadError } = await userClient.storage
      .from("studio-videos")
      .upload(videoPath, bytes, { contentType, upsert: true });
    if (uploadError) return jsonResponse({ error: uploadError.message }, 500);

    const { error: updateError } = await userClient
      .from("studio_video_generations")
      .update({ status: "ready", video_path: videoPath, completed_at: new Date().toISOString() })
      .eq("id", generationId);
    if (updateError) return jsonResponse({ error: updateError.message }, 500);

    return jsonResponse({ status: "ready", videoPath });
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : "Erreur inconnue." }, 500);
  }
});
