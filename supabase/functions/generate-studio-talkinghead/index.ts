// Module "Faites parler vos images" (Le Studio) : pipeline en deux étapes —
//   1) le script saisi par l'élève est converti en voix via MiniMax Speech
//      2.8 (audioInference), résolu de façon SYNCHRONE dans cette même
//      invocation (submitAndAwaitRunware, même helper que Rétro-ingénierie) ;
//   2) l'audio obtenu + la photo source sont soumis au modèle avatar choisi
//      (videoInference, asynchrone — suivi via external_request_id, comme
//      generate-studio-video).
// Tourne avec le JWT de l'appelant (pas de service-role), comme les autres
// modules du Studio.
import { createClient } from "npm:@supabase/supabase-js@2.48.1";
import { CORS_HEADERS, jsonResponse } from "../_shared/podcast-utils.ts";
import { STUDIO_TALKINGHEAD_MODELS, TTS_VOICES, DEFAULT_TTS_VOICE, buildTtsTask } from "../_shared/studio-talkinghead-models.ts";
import { submitAndAwaitRunware, submitRunwareTask, finalizeRunwareResult } from "../_shared/runware.ts";
import { checkAiBudget, recordAiUsage } from "../_shared/ai-budget.ts";

const SCRIPT_MAX_LENGTH = 1000;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });

  try {
    const { model, script, sourceImagePath, voice, language } = await req.json();
    const trimmedScript = typeof script === "string" ? script.trim() : "";
    if (!trimmedScript) return jsonResponse({ error: "Le texte à prononcer est obligatoire." }, 400);
    if (trimmedScript.length > SCRIPT_MAX_LENGTH) return jsonResponse({ error: `Le texte est trop long (${SCRIPT_MAX_LENGTH} caractères maximum).` }, 400);
    if (!sourceImagePath) return jsonResponse({ error: "Une photo est obligatoire." }, 400);

    const modelConfig = STUDIO_TALKINGHEAD_MODELS[model];
    if (!modelConfig) return jsonResponse({ error: "Modèle inconnu." }, 400);

    const selectedVoice = TTS_VOICES.find((v) => v.id === voice) ?? TTS_VOICES.find((v) => v.id === DEFAULT_TTS_VOICE)!;
    const selectedLanguage = typeof language === "string" && language ? language : selectedVoice.language;

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

    const budget = await checkAiBudget(userClient, userId);
    if (!budget.ok) return jsonResponse({ error: budget.error }, 402);

    const { data: signed, error: signError } = await userClient.storage
      .from("studio-talkinghead")
      .createSignedUrl(sourceImagePath, 3600);
    if (signError || !signed?.signedUrl) return jsonResponse({ error: "Impossible de lire la photo fournie." }, 400);
    const sourceImageUrl = signed.signedUrl;

    const apiKey = Deno.env.get("RUNWARE_API_KEY");
    if (!apiKey) return jsonResponse({ error: "Configuration Runware manquante." }, 500);

    // Étape 1 : texte -> voix (synchrone, la vidéo a besoin de l'URL audio).
    let ttsResult;
    try {
      ttsResult = await submitAndAwaitRunware(apiKey, buildTtsTask({ text: trimmedScript, voice: selectedVoice.id }));
    } catch (err) {
      return jsonResponse({ error: err instanceof Error ? err.message : "La synthèse vocale a échoué." }, 502);
    }
    await recordAiUsage(userClient, { userId, mediaType: "audio", model: "minimax:speech@2.8", cost: ttsResult.cost, source: "studio_talkinghead" });

    // Étape 2 : photo + audio -> vidéo avatar (asynchrone, suivie côté client).
    const videoTask = modelConfig.buildTask({ imageUrl: sourceImageUrl, audioUrl: ttsResult.url });
    let submitted;
    try {
      submitted = await submitRunwareTask(apiKey, videoTask);
    } catch (err) {
      return jsonResponse({ error: err instanceof Error ? err.message : "Runware a refusé la demande." }, 502);
    }

    const { data: row, error: insertError } = await userClient
      .from("studio_talkinghead_generations")
      .insert({
        user_id: userId,
        status: "pending",
        model,
        script_text: trimmedScript,
        voice: selectedVoice.id,
        language: selectedLanguage,
        source_image_path: sourceImagePath,
        external_request_id: submitted.status === "pending" ? submitted.taskUUID : null,
      })
      .select("id")
      .single();
    if (insertError || !row) return jsonResponse({ error: insertError?.message ?? "Échec de l'enregistrement." }, 500);

    if (submitted.status === "ready") {
      await finalizeRunwareResult(userClient, {
        bucket: "studio-talkinghead",
        pathPrefix: `${userId}/results/${row.id}`,
        url: submitted.url,
        table: "studio_talkinghead_generations",
        rowId: row.id,
        kind: "video",
        usage: { userId, mediaType: "video", model: modelConfig.runwareModel, cost: submitted.cost, source: "studio_talkinghead" },
      });
    }

    return jsonResponse({ id: row.id });
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : "Erreur inconnue." }, 500);
  }
});
