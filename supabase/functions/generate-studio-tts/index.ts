// Module "Du texte à l'audio" (Le Studio) : conversion texte -> voix via
// MiniMax Speech 2.8 (audioInference), un seul appel Runware, pas d'étape
// intermédiaire (contrairement à "Faites parler vos images", qui enchaîne
// TTS + avatar). Soumission asynchrone comme les autres modules Studio :
// submitRunwareTask renvoie déjà le résultat si Runware répond dans la
// foulée (texte court), sinon check-studio-tts-status prend le relais.
// Tourne avec le JWT de l'appelant (pas de service-role).
import { createClient } from "npm:@supabase/supabase-js@2.48.1";
import { CORS_HEADERS, jsonResponse } from "../_shared/podcast-utils.ts";
import { TTS_VOICES, DEFAULT_TTS_VOICE, TTS_MODEL_ID, buildTtsTask } from "../_shared/studio-tts-voices.ts";
import { submitRunwareTask, finalizeRunwareResult } from "../_shared/runware.ts";
import { checkAiBudget, recordAiUsage } from "../_shared/ai-budget.ts";

// Un type invalide (ex. une chaîne au lieu d'un nombre) est simplement
// ignoré plutôt que rejeté en 400 : buildTtsTask ramène de toute façon toute
// valeur numérique hors bornes dans l'intervalle Runware/MiniMax (cf.
// studio-tts-voices.ts), pas besoin de dupliquer cette validation ici.
function readNumberParam(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

// Plus généreux que "Faites parler vos images" (1000) : pas de rendu avatar
// à synchroniser derrière, MiniMax Speech accepte jusqu'à 50 000 caractères
// (cf. studio-doublage-models.ts pour les réserves sur ce catalogue) — on
// reste prudent pour garder un temps de génération raisonnable.
const SCRIPT_MAX_LENGTH = 4000;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });

  try {
    const { script, voice, speed, volume, pitch, emotion } = await req.json();
    const trimmedScript = typeof script === "string" ? script.trim() : "";
    if (!trimmedScript) return jsonResponse({ error: "Le texte à convertir est obligatoire." }, 400);
    if (trimmedScript.length > SCRIPT_MAX_LENGTH) return jsonResponse({ error: `Le texte est trop long (${SCRIPT_MAX_LENGTH} caractères maximum).` }, 400);

    const selectedVoice = TTS_VOICES.find((v) => v.id === voice) ?? TTS_VOICES.find((v) => v.id === DEFAULT_TTS_VOICE)!;
    const controls = {
      speed: readNumberParam(speed),
      volume: readNumberParam(volume),
      pitch: readNumberParam(pitch),
      emotion: typeof emotion === "string" && emotion ? emotion : undefined,
    };

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

    const apiKey = Deno.env.get("RUNWARE_API_KEY");
    if (!apiKey) return jsonResponse({ error: "Configuration Runware manquante." }, 500);

    let submitted;
    try {
      submitted = await submitRunwareTask(apiKey, buildTtsTask({ text: trimmedScript, voice: selectedVoice.id, ...controls }));
    } catch (err) {
      return jsonResponse({ error: err instanceof Error ? err.message : "La synthèse vocale a échoué." }, 502);
    }

    const { data: row, error: insertError } = await userClient
      .from("studio_tts_generations")
      .insert({
        user_id: userId,
        status: "pending",
        model: TTS_MODEL_ID,
        script_text: trimmedScript,
        voice: selectedVoice.id,
        language: selectedVoice.language,
        speed: controls.speed ?? null,
        volume: controls.volume ?? null,
        pitch: controls.pitch ?? null,
        emotion: controls.emotion ?? null,
        external_request_id: submitted.status === "pending" ? submitted.taskUUID : null,
      })
      .select("id")
      .single();
    if (insertError || !row) return jsonResponse({ error: insertError?.message ?? "Échec de l'enregistrement." }, 500);

    if (submitted.status === "ready") {
      await finalizeRunwareResult(userClient, {
        bucket: "studio-tts",
        pathPrefix: `${userId}/results/${row.id}`,
        url: submitted.url,
        table: "studio_tts_generations",
        rowId: row.id,
        kind: "audio",
        usage: { userId, mediaType: "audio", model: TTS_MODEL_ID, cost: submitted.cost, source: "studio_tts" },
      });
    }

    return jsonResponse({ id: row.id });
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : "Erreur inconnue." }, 500);
  }
});
