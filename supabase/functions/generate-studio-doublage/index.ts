// Module "Parlez n'importe quelle langue" (Le Studio) : pipeline en trois
// étapes —
//   1) Gemini (multimodal) écoute l'audio de la vidéo uploadée et transcrit
//      + traduit directement vers la langue cible choisie par l'élève —
//      Runware n'a AUCUNE capacité de transcription audio (confirmé sur sa
//      doc/FAQ le 2026-09-19), Gemini est donc la seule brique hors Runware
//      de ce module (cf. _shared/gemini-video.ts). L'élève ne saisit plus
//      aucun texte à la main : juste la langue d'origine de la vidéo et la
//      langue cible ;
//   2) le texte traduit est converti en voix via MiniMax Speech 2.8
//      (audioInference, Runware), synchrone ;
//   3) la vidéo source uploadée + l'audio traduit sont soumis au modèle de
//      lip-sync choisi (videoInference, Runware, asynchrone — suivi via
//      external_request_id, comme generate-studio-talkinghead).
// Tourne avec le JWT de l'appelant (pas de service-role).
import { createClient } from "npm:@supabase/supabase-js@2.48.1";
import { CORS_HEADERS, jsonResponse } from "../_shared/podcast-utils.ts";
import { TTS_MODEL_ID, buildTtsTask } from "../_shared/studio-tts-voices.ts";
import { STUDIO_DOUBLAGE_MODELS, DEFAULT_DOUBLAGE_MODEL, DOUBLAGE_LANGUAGES, DEFAULT_DOUBLAGE_LANGUAGE } from "../_shared/studio-doublage-models.ts";
import { transcribeAndTranslateVideo } from "../_shared/gemini-video.ts";
import { submitAndAwaitRunware, submitRunwareTask, finalizeRunwareResult } from "../_shared/runware.ts";
import { checkAiBudget, recordAiUsage } from "../_shared/ai-budget.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });

  try {
    const { model, sourceVideoPath, sourceLanguage, targetLanguage } = await req.json();
    if (!sourceVideoPath) return jsonResponse({ error: "Une vidéo source est obligatoire." }, 400);

    const modelConfig = STUDIO_DOUBLAGE_MODELS[model] ?? STUDIO_DOUBLAGE_MODELS[DEFAULT_DOUBLAGE_MODEL];
    const modelId = STUDIO_DOUBLAGE_MODELS[model] ? model : DEFAULT_DOUBLAGE_MODEL;
    const sourceLang = DOUBLAGE_LANGUAGES.find((l) => l.code === sourceLanguage) ?? DOUBLAGE_LANGUAGES.find((l) => l.code === DEFAULT_DOUBLAGE_LANGUAGE)!;
    const targetLang = DOUBLAGE_LANGUAGES.find((l) => l.code === targetLanguage) ?? DOUBLAGE_LANGUAGES.find((l) => l.code === DEFAULT_DOUBLAGE_LANGUAGE)!;

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

    // Octets bruts pour Gemini (upload direct, pas de re-passage par une URL
    // signée pour cette étape) + URL signée séparée pour Runware à l'étape 3
    // (Runware va la récupérer lui-même côté serveur, pas d'octets à lui envoyer).
    const { data: videoBlob, error: downloadError } = await userClient.storage.from("studio-doublage").download(sourceVideoPath);
    if (downloadError || !videoBlob) return jsonResponse({ error: "Impossible de lire la vidéo fournie." }, 400);
    const videoBytes = new Uint8Array(await videoBlob.arrayBuffer());
    const videoMimeType = videoBlob.type || "video/mp4";

    const { data: signed, error: signError } = await userClient.storage
      .from("studio-doublage")
      .createSignedUrl(sourceVideoPath, 3600);
    if (signError || !signed?.signedUrl) return jsonResponse({ error: "Impossible de lire la vidéo fournie." }, 400);
    const sourceVideoUrl = signed.signedUrl;

    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiApiKey) return jsonResponse({ error: "GEMINI_API_KEY non configurée côté serveur." }, 500);
    const runwareApiKey = Deno.env.get("RUNWARE_API_KEY");
    if (!runwareApiKey) return jsonResponse({ error: "Configuration Runware manquante." }, 500);

    // Étape 1 : Gemini transcrit l'audio de la vidéo et traduit directement
    // vers la langue cible (seule brique hors Runware de ce module).
    let translatedText: string;
    try {
      translatedText = await transcribeAndTranslateVideo(geminiApiKey, {
        bytes: videoBytes, mimeType: videoMimeType,
        sourceLanguageLabel: sourceLang.label, targetLanguageLabel: targetLang.label,
      });
    } catch (err) {
      return jsonResponse({ error: err instanceof Error ? err.message : "La transcription/traduction a échoué." }, 502);
    }

    // Étape 2 : texte traduit -> voix (Runware).
    let ttsResult;
    try {
      ttsResult = await submitAndAwaitRunware(runwareApiKey, buildTtsTask({ text: translatedText, voice: targetLang.voiceId }));
    } catch (err) {
      return jsonResponse({ error: err instanceof Error ? err.message : "La synthèse vocale a échoué." }, 502);
    }
    await recordAiUsage(userClient, { userId, mediaType: "audio", model: TTS_MODEL_ID, cost: ttsResult.cost, source: "studio_doublage" });

    // Étape 3 : vidéo + audio traduit -> lip-sync (Runware, asynchrone).
    const lipsyncTask = modelConfig.buildTask({ videoUrl: sourceVideoUrl, audioUrl: ttsResult.url });
    let submitted;
    try {
      submitted = await submitRunwareTask(runwareApiKey, lipsyncTask);
    } catch (err) {
      return jsonResponse({ error: err instanceof Error ? err.message : "Runware a refusé la demande." }, 502);
    }

    const { data: row, error: insertError } = await userClient
      .from("studio_doublage_generations")
      .insert({
        user_id: userId,
        status: "pending",
        model: modelId,
        source_language: sourceLang.code,
        translated_text: translatedText,
        target_voice: targetLang.voiceId,
        target_language: targetLang.code,
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
