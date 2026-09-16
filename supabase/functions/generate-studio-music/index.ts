// Module "Concevez vos propres musiques" (Le Studio) : pipeline en deux
// étapes avant l'appel Runware MiniMax Music 2.6 —
//   1) un appel Gemini (texte) restructure les paroles avec des tags de
//      section ([Intro]/[Verse]/[Chorus]/[Bridge]/[Outro]/[Inst], squelette
//      seul en mode instrumental), invente un titre, et rédige le prompt de
//      la pochette d'album (cf. generate-mindmap/index.ts pour le même motif
//      Gemini + responseMimeType "application/json") ;
//   2) deux tâches Runware sont soumises en parallèle : l'audio (modèle
//      tiers, cf. _shared/studio-music-models.ts) et la pochette (flux-dev,
//      natif Runware — fonctionne même sans solde crédité, cf.
//      _shared/studio-models.ts). La pochette est best-effort : un échec n'empêche
//      pas la génération musicale (cf. check-studio-music-status).
// Tourne avec le JWT de l'appelant (pas de service-role), comme
// generate-studio-image/generate-studio-video.
import { createClient } from "npm:@supabase/supabase-js@2.48.1";
import { CORS_HEADERS, jsonResponse } from "../_shared/podcast-utils.ts";
import { STUDIO_MUSIC_MODELS, MUSIC_MODEL_ID } from "../_shared/studio-music-models.ts";
import { STUDIO_MODELS } from "../_shared/studio-models.ts";
import { submitRunwareTask, uploadRunwareAsset } from "../_shared/runware.ts";
import { checkAiBudget, recordAiUsage } from "../_shared/ai-budget.ts";

const GEMINI_TEXT_MODEL = "gemini-3.6-flash";
// Pochette : modèle natif Runware (fonctionne sans solde crédité, cf.
// project memory "Runware wallet blocker") — contrairement au modèle
// musical tiers, qui restera en erreur thirdPartyInsufficientCredits tant
// que le compte n'est pas alimenté (https://my.runware.ai/wallet).
const COVER_MODEL_ID = "flux-dev";

function buildMusicPrompt(stylePrompt: string, instrumental: boolean, rawLyrics: string): string {
  return `Tu es un parolier et directeur artistique. À partir de la description de style musical ci-dessous, prépare le nécessaire pour générer un morceau avec l'API MiniMax Music 2.6.

=== DESCRIPTION DU STYLE (prompt de l'élève) ===
${stylePrompt}

${instrumental
    ? "=== MODE INSTRUMENTAL ===\nAucune parole ne doit être chantée."
    : `=== PAROLES OU IDÉES FOURNIES PAR L'ÉLÈVE (peut être vide) ===\n${rawLyrics || "Aucune parole fournie — invente des paroles cohérentes avec le style et le thème décrits."}`}

=== CONSIGNES ===
1. "title" : invente un titre de morceau accrocheur et original, cohérent avec le style/thème décrit.
2. "lyrics" : structure STRICTEMENT le texte avec des tags de section entre crochets, un par ligne suivi du texte de la section — utilise UNIQUEMENT ces tags, selon ce qui convient au morceau : [Intro], [Verse], [Chorus], [Bridge], [Outro], [Inst]. ${instrumental
      ? "Mode instrumental : ne mets AUCUNE parole, uniquement les tags de section qui composent la structure du morceau (ex. \"[Intro]\\n[Verse]\\n[Chorus]\\n[Outro]\")."
      : "Reprends et améliore les paroles fournies si elles existent, sinon invente-les entièrement à partir du style décrit."}
3. "coverImagePrompt" : rédige, en anglais, un prompt riche et visuel pour générer une pochette d'album carrée cohérente avec le thème, l'ambiance et le style du morceau. Ne demande jamais de texte ni de typographie dans l'image.

=== FORMAT DE SORTIE ===
Réponds UNIQUEMENT avec un objet JSON strict, sans texte autour, de cette forme exacte :
{
  "title": "...",
  "lyrics": "...",
  "coverImagePrompt": "..."
}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });

  try {
    const { prompt, instrumental, lyrics } = await req.json();
    const trimmedPrompt = typeof prompt === "string" ? prompt.trim() : "";
    if (!trimmedPrompt) return jsonResponse({ error: "La description du style est obligatoire." }, 400);
    if (trimmedPrompt.length > 2000) return jsonResponse({ error: "La description est trop longue (2000 caractères maximum)." }, 400);
    const isInstrumental = !!instrumental;
    const rawLyrics = typeof lyrics === "string" ? lyrics.trim() : "";

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

    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiApiKey) return jsonResponse({ error: "GEMINI_API_KEY non configurée côté serveur." }, 500);

    const geminiResp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_TEXT_MODEL}:generateContent`,
      {
        method: "POST",
        headers: { "x-goog-api-key": geminiApiKey, "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: buildMusicPrompt(trimmedPrompt, isInstrumental, rawLyrics) }] }],
          generationConfig: { responseMimeType: "application/json" },
        }),
      },
    );
    if (!geminiResp.ok) return jsonResponse({ error: `Gemini a échoué : ${await geminiResp.text()}` }, 502);
    const geminiJson = await geminiResp.json();
    const rawText = geminiJson?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) return jsonResponse({ error: "Gemini n'a renvoyé aucun résultat." }, 502);

    let structured: { title?: string; lyrics?: string; coverImagePrompt?: string };
    try {
      structured = JSON.parse(rawText);
    } catch {
      return jsonResponse({ error: "Réponse Gemini invalide (JSON non parsable)." }, 502);
    }
    const title = structured.title?.trim() || "Sans titre";
    const structuredLyrics = structured.lyrics?.trim() || "";
    const coverImagePrompt = structured.coverImagePrompt?.trim() || trimmedPrompt;

    const apiKey = Deno.env.get("RUNWARE_API_KEY");
    if (!apiKey) return jsonResponse({ error: "Configuration Runware manquante." }, 500);

    const musicConfig = STUDIO_MUSIC_MODELS[MUSIC_MODEL_ID];
    const audioTask = musicConfig.buildTask({
      prompt: trimmedPrompt,
      instrumental: isInstrumental,
      lyrics: isInstrumental ? undefined : (structuredLyrics || undefined),
    });

    let audioSubmitted;
    try {
      audioSubmitted = await submitRunwareTask(apiKey, audioTask);
    } catch (err) {
      return jsonResponse({ error: err instanceof Error ? err.message : "Runware a refusé la demande de musique." }, 502);
    }

    // Pochette best-effort : un échec de soumission ne bloque pas la musique.
    const coverConfig = STUDIO_MODELS[COVER_MODEL_ID];
    const coverTask = coverConfig.buildTask({ prompt: coverImagePrompt, width: 1024, height: 1024 });
    let coverSubmitted: Awaited<ReturnType<typeof submitRunwareTask>> | null = null;
    try {
      coverSubmitted = await submitRunwareTask(apiKey, coverTask);
    } catch {
      coverSubmitted = null;
    }

    const { data: row, error: insertError } = await userClient
      .from("studio_music_generations")
      .insert({
        user_id: userId,
        status: "pending",
        model: musicConfig.runwareModel,
        prompt: trimmedPrompt,
        instrumental: isInstrumental,
        lyrics_input: rawLyrics || null,
        title,
        lyrics_structured: structuredLyrics || null,
        cover_prompt: coverImagePrompt,
        audio_external_id: audioSubmitted.status === "pending" ? audioSubmitted.taskUUID : null,
        cover_external_id: coverSubmitted?.status === "pending" ? coverSubmitted.taskUUID : null,
      })
      .select("id")
      .single();
    if (insertError || !row) return jsonResponse({ error: insertError?.message ?? "Échec de l'enregistrement." }, 500);

    if (audioSubmitted.status === "ready") {
      const uploaded = await uploadRunwareAsset(userClient, {
        bucket: "studio-music",
        path: `${userId}/results/${row.id}-audio.mp3`,
        url: audioSubmitted.url,
      });
      if ("path" in uploaded) {
        await userClient.from("studio_music_generations")
          .update({ audio_path: uploaded.path, status: "ready", completed_at: new Date().toISOString() })
          .eq("id", row.id);
        await recordAiUsage(userClient, { userId, mediaType: "audio", model: musicConfig.runwareModel, cost: audioSubmitted.cost, source: "studio_music" });
      } else {
        await userClient.from("studio_music_generations").update({ status: "failed", error_message: uploaded.error }).eq("id", row.id);
        return jsonResponse({ id: row.id });
      }
    }

    if (coverSubmitted?.status === "ready") {
      const uploadedCover = await uploadRunwareAsset(userClient, {
        bucket: "studio-music",
        path: `${userId}/results/${row.id}-cover.jpg`,
        url: coverSubmitted.url,
      });
      if ("path" in uploadedCover) {
        await userClient.from("studio_music_generations").update({ cover_image_path: uploadedCover.path }).eq("id", row.id);
        await recordAiUsage(userClient, { userId, mediaType: "image", model: coverConfig.runwareModel, cost: coverSubmitted.cost, source: "studio_music" });
      }
    }

    return jsonResponse({ id: row.id });
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : "Erreur inconnue." }, 500);
  }
});
