// Soumet une génération vidéo à l'API Higgsfield (module "Imaginez vos
// vidéos" du Studio). Même principe que generate-studio-image : JWT de
// l'appelant, pas de service-role (RLS suffit).
import { createClient } from "npm:@supabase/supabase-js@2.48.1";
import { CORS_HEADERS, jsonResponse } from "../_shared/podcast-utils.ts";
import { STUDIO_VIDEO_MODELS } from "../_shared/studio-video-models.ts";

const HIGGSFIELD_BASE_URL = "https://api.higgsfield.ai";

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

    const keyId = Deno.env.get("HIGGSFIELD_API_ID");
    const keySecret = Deno.env.get("HIGGSFIELD_API_SECRET");
    if (!keyId || !keySecret) return jsonResponse({ error: "Configuration Higgsfield manquante." }, 500);

    const path = modelConfig.pathFor(!!sourceImageUrl);
    const submitResp = await fetch(`${HIGGSFIELD_BASE_URL}${path}`, {
      method: "POST",
      headers: { Authorization: `Key ${keyId}:${keySecret}`, "Content-Type": "application/json" },
      body: JSON.stringify(modelConfig.buildBody({ prompt: trimmedPrompt, sourceImageUrl, optionValues })),
    });
    const submitText = await submitResp.text();
    if (!submitResp.ok) return jsonResponse({ error: `Higgsfield a refusé la demande : ${submitText}` }, 502);

    const submitJson = JSON.parse(submitText) as { request_id?: string; status?: string; error?: string | null };
    if (!submitJson.request_id) return jsonResponse({ error: "Réponse Higgsfield inattendue (pas de request_id)." }, 502);
    if (submitJson.status === "failed" || submitJson.status === "nsfw") {
      return jsonResponse({ error: submitJson.error || "Génération refusée par Higgsfield." }, 400);
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
        external_request_id: submitJson.request_id,
      })
      .select("id")
      .single();
    if (insertError || !row) return jsonResponse({ error: insertError?.message ?? "Échec de l'enregistrement." }, 500);

    return jsonResponse({ id: row.id });
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : "Erreur inconnue." }, 500);
  }
});
