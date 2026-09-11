// Poll unique du statut d'une génération Higgsfield (rappelé par le client
// toutes les ~4s, cf. pollGenerationStatus côté studioImages.ts — même
// logique que check-avatar-video-status). Tourne avec le JWT de l'élève
// propriétaire : RLS suffit, pas de service-role nécessaire (l'upload du
// résultat final dans son propre dossier passe la policy
// studio_images_storage_write).
import { createClient } from "npm:@supabase/supabase-js@2.48.1";
import { CORS_HEADERS, jsonResponse } from "../_shared/podcast-utils.ts";
import { HIGGSFIELD_BASE_URL } from "../_shared/studio-models.ts";

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
      .from("studio_image_generations")
      .select("id, user_id, status, external_request_id, error_message, image_path")
      .eq("id", generationId)
      .single();
    if (rowError || !row) return jsonResponse({ error: "Génération introuvable." }, 404);
    if (row.user_id !== userId) return jsonResponse({ error: "Accès refusé." }, 403);

    if (row.status !== "pending") {
      return jsonResponse({ status: row.status, imagePath: row.image_path, error: row.error_message });
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
      images?: { url: string }[];
    };

    if (statusJson.status === "queued" || statusJson.status === "in_progress") {
      return jsonResponse({ status: "pending" });
    }

    if (statusJson.status !== "completed" || !statusJson.images?.length) {
      const message = statusJson.error || `Génération ${statusJson.status === "nsfw" ? "refusée (contenu sensible)" : "échouée"}.`;
      await userClient.from("studio_image_generations").update({ status: "failed", error_message: message }).eq("id", generationId);
      return jsonResponse({ status: "failed", error: message });
    }

    const imageResp = await fetch(statusJson.images[0].url);
    if (!imageResp.ok) {
      await userClient.from("studio_image_generations").update({ status: "failed", error_message: "Téléchargement de l'image échoué." }).eq("id", generationId);
      return jsonResponse({ status: "failed", error: "Téléchargement de l'image échoué." });
    }
    const contentType = imageResp.headers.get("content-type") || "image/jpeg";
    const ext = contentType.includes("png") ? "png" : "jpg";
    const bytes = new Uint8Array(await imageResp.arrayBuffer());
    const imagePath = `${userId}/results/${generationId}.${ext}`;

    const { error: uploadError } = await userClient.storage
      .from("studio-images")
      .upload(imagePath, bytes, { contentType, upsert: true });
    if (uploadError) return jsonResponse({ error: uploadError.message }, 500);

    const { error: updateError } = await userClient
      .from("studio_image_generations")
      .update({ status: "ready", image_path: imagePath, completed_at: new Date().toISOString() })
      .eq("id", generationId);
    if (updateError) return jsonResponse({ error: updateError.message }, 500);

    return jsonResponse({ status: "ready", imagePath });
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : "Erreur inconnue." }, 500);
  }
});
