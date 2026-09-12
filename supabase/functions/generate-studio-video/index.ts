// Soumet une génération vidéo à l'API Runware (module "Imaginez vos vidéos"
// du Studio — remplace Higgsfield). Même principe que generate-studio-image :
// JWT de l'appelant, pas de service-role (RLS suffit).
import { createClient } from "npm:@supabase/supabase-js@2.48.1";
import { CORS_HEADERS, jsonResponse } from "../_shared/podcast-utils.ts";
import { STUDIO_VIDEO_MODELS } from "../_shared/studio-video-models.ts";
import { submitRunwareTask, finalizeRunwareResult } from "../_shared/runware.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });

  try {
    const { model, prompt, sourceImagePath, options } = await req.json();
    const trimmedPrompt = typeof prompt === "string" ? prompt.trim() : "";
    if (!trimmedPrompt) return jsonResponse({ error: "Le prompt est obligatoire." }, 400);
    if (trimmedPrompt.length > 2000) return jsonResponse({ error: "Le prompt est trop long (2000 caractères maximum)." }, 400);

    const modelConfig = STUDIO_VIDEO_MODELS[model];
    if (!modelConfig) return jsonResponse({ error: "Modèle inconnu." }, 400);
    if (modelConfig.requiresSourceImage && !sourceImagePath) return jsonResponse({ error: "Ce modèle nécessite une image de référence." }, 400);
    if (sourceImagePath && !modelConfig.supportsSourceImage) return jsonResponse({ error: "Ce modèle ne prend pas d'image de référence." }, 400);

    const optionValues: Record<string, string> = {};
    for (const opt of modelConfig.options) {
      const provided = options?.[opt.key];
      optionValues[opt.key] = typeof provided === "string" && opt.choices.includes(provided) ? provided : opt.default;
    }

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
        .from("studio-videos")
        .createSignedUrl(sourceImagePath, 3600);
      if (signError || !signed?.signedUrl) return jsonResponse({ error: "Impossible de lire l'image de référence." }, 400);
      sourceImageUrl = signed.signedUrl;
    }

    const apiKey = Deno.env.get("RUNWARE_API_KEY");
    if (!apiKey) return jsonResponse({ error: "Configuration Runware manquante." }, 500);

    const task = modelConfig.buildTask({ prompt: trimmedPrompt, sourceImageUrl, optionValues });

    let submitted;
    try {
      submitted = await submitRunwareTask(apiKey, task);
    } catch (err) {
      return jsonResponse({ error: err instanceof Error ? err.message : "Runware a refusé la demande." }, 502);
    }

    const { data: row, error: insertError } = await userClient
      .from("studio_video_generations")
      .insert({
        user_id: userId,
        status: "pending",
        model,
        options: optionValues,
        prompt: trimmedPrompt,
        source_image_path: sourceImagePath ?? null,
        external_request_id: submitted.status === "pending" ? submitted.taskUUID : null,
      })
      .select("id")
      .single();
    if (insertError || !row) return jsonResponse({ error: insertError?.message ?? "Échec de l'enregistrement." }, 500);

    if (submitted.status === "ready") {
      await finalizeRunwareResult(userClient, {
        bucket: "studio-videos",
        pathPrefix: `${userId}/results/${row.id}`,
        url: submitted.url,
        table: "studio_video_generations",
        rowId: row.id,
        kind: "video",
      });
    }

    return jsonResponse({ id: row.id });
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : "Erreur inconnue." }, 500);
  }
});
