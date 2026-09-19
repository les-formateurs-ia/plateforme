// Module "Parlez n'importe quelle langue" (Le Studio) : pipeline en trois
// étapes —
//   1) le texte fourni par l'élève (ce qui est dit dans la vidéo) est
//      traduit dans la langue cible via un LLM (textInference, Claude Opus 5
//      via Runware — même chemin que Battle Ground), résolu de façon
//      SYNCHRONE dans cette invocation ;
//   2) le texte traduit est converti en voix via MiniMax Speech 2.8
//      (audioInference), également synchrone (submitAndAwaitRunware, même
//      helper que Rétro-ingénierie/talking-head) ;
//   3) la vidéo source uploadée + l'audio traduit sont soumis au modèle de
//      lip-sync choisi (videoInference, asynchrone — suivi via
//      external_request_id, comme generate-studio-talkinghead).
// Pas de transcription automatique (Runware n'a pas de modèle
// speech-to-text, cf. _shared/studio-doublage-models.ts) : l'élève fournit
// le texte source, la "traduction intelligente" vient de l'étape 1.
// Tourne avec le JWT de l'appelant (pas de service-role).
import { createClient } from "npm:@supabase/supabase-js@2.48.1";
import { CORS_HEADERS, jsonResponse } from "../_shared/podcast-utils.ts";
import { TTS_VOICES, DEFAULT_TTS_VOICE, TTS_MODEL_ID, buildTtsTask } from "../_shared/studio-tts-voices.ts";
import { STUDIO_DOUBLAGE_MODELS, DEFAULT_DOUBLAGE_MODEL, TRANSLATION_MODEL, buildTranslationPrompt } from "../_shared/studio-doublage-models.ts";
import { submitAndAwaitRunware, submitAndAwaitRunwareText, submitRunwareTask, finalizeRunwareResult } from "../_shared/runware.ts";
import { checkAiBudget, recordAiUsage } from "../_shared/ai-budget.ts";

const SCRIPT_MAX_LENGTH = 1000;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });

  try {
    const { model, script, sourceVideoPath, voice } = await req.json();
    const trimmedScript = typeof script === "string" ? script.trim() : "";
    if (!trimmedScript) return jsonResponse({ error: "Le texte prononcé dans la vidéo est obligatoire." }, 400);
    if (trimmedScript.length > SCRIPT_MAX_LENGTH) return jsonResponse({ error: `Le texte est trop long (${SCRIPT_MAX_LENGTH} caractères maximum).` }, 400);
    if (!sourceVideoPath) return jsonResponse({ error: "Une vidéo source est obligatoire." }, 400);

    const modelConfig = STUDIO_DOUBLAGE_MODELS[model] ?? STUDIO_DOUBLAGE_MODELS[DEFAULT_DOUBLAGE_MODEL];
    const modelId = STUDIO_DOUBLAGE_MODELS[model] ? model : DEFAULT_DOUBLAGE_MODEL;
    const selectedVoice = TTS_VOICES.find((v) => v.id === voice) ?? TTS_VOICES.find((v) => v.id === DEFAULT_TTS_VOICE)!;

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
      .from("studio-doublage")
      .createSignedUrl(sourceVideoPath, 3600);
    if (signError || !signed?.signedUrl) return jsonResponse({ error: "Impossible de lire la vidéo fournie." }, 400);
    const sourceVideoUrl = signed.signedUrl;

    const apiKey = Deno.env.get("RUNWARE_API_KEY");
    if (!apiKey) return jsonResponse({ error: "Configuration Runware manquante." }, 500);

    // Étape 1 : traduction intelligente vers la langue de la voix cible.
    let translatedText: string;
    try {
      const translation = await submitAndAwaitRunwareText(apiKey, {
        taskType: "textInference",
        model: TRANSLATION_MODEL,
        messages: [{ role: "user", content: buildTranslationPrompt(trimmedScript, selectedVoice.languageLabel) }],
        settings: { maxTokens: 1024 },
      }, { timeoutMs: 45000 });
      translatedText = translation.text.trim();
      if (!translatedText) throw new Error("La traduction n'a renvoyé aucun texte.");
      await recordAiUsage(userClient, { userId, mediaType: "text", model: TRANSLATION_MODEL, cost: translation.cost, source: "studio_doublage" });
    } catch (err) {
      return jsonResponse({ error: err instanceof Error ? err.message : "La traduction a échoué." }, 502);
    }

    // Étape 2 : texte traduit -> voix.
    let ttsResult;
    try {
      ttsResult = await submitAndAwaitRunware(apiKey, buildTtsTask({ text: translatedText, voice: selectedVoice.id, language: selectedVoice.language }));
    } catch (err) {
      return jsonResponse({ error: err instanceof Error ? err.message : "La synthèse vocale a échoué." }, 502);
    }
    await recordAiUsage(userClient, { userId, mediaType: "audio", model: TTS_MODEL_ID, cost: ttsResult.cost, source: "studio_doublage" });

    // Étape 3 : vidéo + audio traduit -> lip-sync (asynchrone, suivi côté client).
    const lipsyncTask = modelConfig.buildTask({ videoUrl: sourceVideoUrl, audioUrl: ttsResult.url });
    let submitted;
    try {
      submitted = await submitRunwareTask(apiKey, lipsyncTask);
    } catch (err) {
      return jsonResponse({ error: err instanceof Error ? err.message : "Runware a refusé la demande." }, 502);
    }

    const { data: row, error: insertError } = await userClient
      .from("studio_doublage_generations")
      .insert({
        user_id: userId,
        status: "pending",
        model: modelId,
        script_text: trimmedScript,
        translated_text: translatedText,
        target_voice: selectedVoice.id,
        target_language: selectedVoice.language,
        source_video_path: sourceVideoPath,
        external_request_id: submitted.status === "pending" ? submitted.taskUUID : null,
      })
      .select("id")
      .single();
    if (insertError || !row) return jsonResponse({ error: insertError?.message ?? "Échec de l'enregistrement." }, 500);

    if (submitted.status === "ready") {
      await finalizeRunwareResult(userClient, {
        bucket: "studio-doublage",
        pathPrefix: `${userId}/results/${row.id}`,
        url: submitted.url,
        table: "studio_doublage_generations",
        rowId: row.id,
        kind: "video",
        usage: { userId, mediaType: "video", model: modelConfig.runwareModel, cost: submitted.cost, source: "studio_doublage" },
      });
    }

    return jsonResponse({ id: row.id, translatedText });
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : "Erreur inconnue." }, 500);
  }
});
