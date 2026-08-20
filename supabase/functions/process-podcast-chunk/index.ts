// Traite UN morceau du script (quelques répliques) : synthèse vocale Gemini
// + décodage base64 → PCM brut, stocké tel quel (sans habillage WAV) dans un
// dossier temporaire. Appelée en HTTP séparé par generate-podcast-audio pour
// chaque morceau, afin que chaque appel bénéficie d'un budget CPU neuf (2s,
// fixe sur tous les plans Supabase) — un script entier dépasserait ce quota
// au moment de parser la réponse JSON/base64 de Gemini.
import { createClient } from "npm:@supabase/supabase-js@2.48.1";
import { CORS_HEADERS, jsonResponse, base64ToUint8Array } from "../_shared/podcast-utils.ts";

const GEMINI_TTS_MODEL = "gemini-3.1-flash-tts-preview";
const VOICE_A = "Puck";
const VOICE_B = "Kore";
const SPEAKER_A = "Alex";
const SPEAKER_B = "Sam";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });

  try {
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiApiKey) return jsonResponse({ error: "GEMINI_API_KEY non configurée côté serveur." }, 500);

    const { lessonId, chunkIndex, chunkText } = await req.json();
    if (!lessonId || chunkIndex === undefined || !chunkText) {
      return jsonResponse({ error: "lessonId, chunkIndex ou chunkText manquant." }, 400);
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return jsonResponse({ error: "Non authentifié." }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) return jsonResponse({ error: "Session invalide." }, 401);
    const userId = userData.user.id;

    const ttsResp = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
      method: "POST",
      headers: { "x-goog-api-key": geminiApiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: GEMINI_TTS_MODEL,
        input: chunkText,
        response_format: { type: "audio" },
        generation_config: {
          speech_config: [
            { speaker: SPEAKER_A, voice: VOICE_A },
            { speaker: SPEAKER_B, voice: VOICE_B },
          ],
        },
      }),
    });
    if (!ttsResp.ok) return jsonResponse({ error: `Gemini (audio) a échoué : ${await ttsResp.text()}` }, 502);
    const ttsJson = await ttsResp.json();
    type InteractionContent = { type: string; data?: string; sample_rate?: number; channels?: number };
    type InteractionStep = { type: string; content?: InteractionContent[] };
    const steps: InteractionStep[] = ttsJson?.steps ?? [];
    const audioContent = steps.flatMap((s) => s.content ?? []).find((c) => c.type === "audio" && c.data);
    if (!audioContent?.data) {
      return jsonResponse({ error: `Gemini n'a renvoyé aucun audio. Réponse : ${JSON.stringify(ttsJson).slice(0, 500)}` }, 502);
    }

    const pcmBytes = base64ToUint8Array(audioContent.data);
    const storagePath = `${userId}/tmp/${lessonId}/${chunkIndex}.pcm`;
    const { error: uploadErr } = await supabase.storage
      .from("lesson-podcasts")
      .upload(storagePath, pcmBytes, { contentType: "application/octet-stream", upsert: true });
    if (uploadErr) return jsonResponse({ error: `Échec de l'enregistrement du morceau : ${uploadErr.message}` }, 500);

    return jsonResponse({
      status: "ok",
      sampleRate: audioContent.sample_rate ?? 24000,
      channels: audioContent.channels ?? 1,
    });
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : "Erreur inconnue." }, 500);
  }
});
