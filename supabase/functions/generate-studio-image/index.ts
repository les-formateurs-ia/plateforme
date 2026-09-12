// Soumet une génération d'image à l'API Runware (module "Créer vos images"
// du Studio — remplace Higgsfield). Tourne avec le JWT de l'appelant (pas de
// service-role) : RLS suffit — l'élève ne peut créer une ligne que pour
// lui-même (studio_images_insert_own), et lire/signer sa propre image source
// (studio_images_storage_read). La clé Runware reste côté serveur.
import { createClient } from "npm:@supabase/supabase-js@2.48.1";
import { CORS_HEADERS, jsonResponse } from "../_shared/podcast-utils.ts";
import { STUDIO_MODELS, ASPECT_RATIO_DIMENSIONS } from "../_shared/studio-models.ts";
import { submitRunwareTask, finalizeRunwareResult } from "../_shared/runware.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });

  try {
    const { model, aspectRatio, prompt, sourceImagePath } = await req.json();
    const trimmedPrompt = typeof prompt === "string" ? prompt.trim() : "";
    if (!trimmedPrompt) return jsonResponse({ error: "Le prompt est obligatoire." }, 400);
    if (trimmedPrompt.length > 2000) return jsonResponse({ error: "Le prompt est trop long (2000 caractères maximum)." }, 400);

    const modelConfig = STUDIO_MODELS[model];
    if (!modelConfig) return jsonResponse({ error: "Modèle inconnu." }, 400);
    const dims = ASPECT_RATIO_DIMENSIONS[aspectRatio];
    if (!dims) return jsonResponse({ error: "Format non supporté." }, 400);
    if (sourceImagePath && !modelConfig.supportsSourceImage) return jsonResponse({ error: "Ce modèle ne prend pas d'image source." }, 400);

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

    let sourceImageUrl: string | undefined;
    if (sourceImagePath) {
      const { data: signed, error: signError } = await userClient.storage
        .from("studio-images")
        .createSignedUrl(sourceImagePath, 3600);
      if (signError || !signed?.signedUrl) return jsonResponse({ error: "Impossible de lire l'image source." }, 400);
      sourceImageUrl = signed.signedUrl;
    }

    const apiKey = Deno.env.get("RUNWARE_API_KEY");
    if (!apiKey) return jsonResponse({ error: "Configuration Runware manquante." }, 500);

    const task = modelConfig.buildTask({ prompt: trimmedPrompt, width: dims.width, height: dims.height, sourceImageUrl });

    let submitted;
    try {
      submitted = await submitRunwareTask(apiKey, task);
    } catch (err) {
      return jsonResponse({ error: err instanceof Error ? err.message : "Runware a refusé la demande." }, 502);
    }

    const { data: row, error: insertError } = await userClient
      .from("studio_image_generations")
      .insert({
        user_id: userId,
        status: "pending",
        model,
        aspect_ratio: aspectRatio,
        prompt: trimmedPrompt,
        source_image_path: sourceImagePath ?? null,
        external_request_id: submitted.status === "pending" ? submitted.taskUUID : null,
      })
      .select("id")
      .single();
    if (insertError || !row) return jsonResponse({ error: insertError?.message ?? "Échec de l'enregistrement." }, 500);

    // Beaucoup de modèles Runware répondent dans la foulée (pas de polling
    // nécessaire) — on finalise tout de suite plutôt que de faire attendre
    // le client pour un premier check-studio-image-status inutile.
    if (submitted.status === "ready") {
      await finalizeRunwareResult(userClient, {
        bucket: "studio-images",
        pathPrefix: `${userId}/results/${row.id}`,
        url: submitted.url,
        table: "studio_image_generations",
        rowId: row.id,
        kind: "image",
      });
    }

    return jsonResponse({ id: row.id });
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : "Erreur inconnue." }, 500);
  }
});
