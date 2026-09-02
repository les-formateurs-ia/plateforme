// Proxy Gemini Live pour l'onglet "Agent" (mentor vocal temps réel).
// Remplace l'ancien couple ElevenLabs elevenlabs-signed-url/configure-voice-agent.
//
// Le prompt système est verrouillé DANS le token éphémère (bidiGenerateContentSetup)
// plutôt qu'envoyé par le client dans son message de setup WebSocket : ainsi
// le navigateur ne voit jamais le texte du prompt (ni via le DOM, ni via
// l'onglet Network/WS des devtools) — seul un jeton à usage unique transite.
// Deux pièges rencontrés en testant contre l'API réelle (la doc publique
// décrit un schéma différent de ce qui fonctionne vraiment aujourd'hui) :
//   1. Le verrouillage de config n'existe que sur /v1alpha/auth_tokens, pas
//      /v1beta (qui renvoie "Unknown name ... at 'auth_token'").
//   2. Le champ est `bidiGenerateContentSetup` À PLAT sur le corps de la
//      requête (pas nested sous "config" ni sous "liveConnectConstraints").
//   3. Se connecter avec un token verrouillé nécessite l'endpoint WebSocket
//      *Constrained* (BidiGenerateContentConstrained), pas BidiGenerateContent
//      (sinon "Method doesn't allow unregistered callers").
// Vérifié empiriquement (curl + script Node) avant d'écrire ce code.
import { createClient } from "npm:@supabase/supabase-js@2.48.1";
import { CORS_HEADERS, jsonResponse } from "../_shared/podcast-utils.ts";
import { buildLockedSystemInstruction, type VoiceAgentVars } from "../_shared/voice-agent-prompt.ts";
import { buildStudentOverview } from "../_shared/student-overview.ts";

const HISTORY_WINDOW = 10;

async function buildRecentHistoryText(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  conversationId: string | undefined,
): Promise<string> {
  if (!conversationId) return "Aucun échange précédent dans cette conversation.";
  const { data } = await supabase
    .from("agent_messages").select("role, content").eq("conversation_id", conversationId)
    .order("created_at", { ascending: false }).limit(HISTORY_WINDOW);
  const rows = (data ?? []).reverse() as { role: string; content: string }[];
  if (rows.length === 0) return "Aucun échange précédent dans cette conversation.";
  return rows.map((m) => `${m.role === "ai" ? "Toi" : "Élève"} : ${m.content}`).join("\n");
}

// Modèle Live en env var (pas hardcodé) : Gemini Live est une surface API en
// évolution rapide, le nom exact du modèle preview peut changer sans lien
// avec une mise à jour de code — si Google renomme, il suffit de changer le
// secret, pas de redéployer.
const DEFAULT_LIVE_MODEL = "models/gemini-2.5-flash-native-audio-preview-09-2025";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });

  try {
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) return jsonResponse({ error: "GEMINI_API_KEY non configurée côté serveur." }, 500);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return jsonResponse({ error: "Non authentifié." }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) return jsonResponse({ error: "Session invalide." }, 401);

    const body = await req.json().catch(() => ({}));
    const userId = userData.user.id;
    const [{ text: overviewText }, recentHistory] = await Promise.all([
      buildStudentOverview(supabase, userId),
      buildRecentHistoryText(supabase, body.conversation_id),
    ]);
    const vars: VoiceAgentVars = {
      student_name: body.student_name || "l'élève",
      profession: body.profession || "non renseigné",
      objectif_professionnel: body.objectif_professionnel || "non renseigné",
      lesson_title: body.lesson_title || "cette leçon",
      lesson_content: body.lesson_content || "(pas de contenu de référence pour cette leçon)",
      depth_mode: body.depth_mode || "default",
      pedagogy_style: body.pedagogy_style || "soft",
      student_overview: overviewText,
      recent_history: recentHistory,
    };

    const model = Deno.env.get("GEMINI_LIVE_MODEL") || DEFAULT_LIVE_MODEL;
    const systemInstruction = buildLockedSystemInstruction(vars);

    const now = Date.now();
    const expireTime = new Date(now + 30 * 60 * 1000).toISOString();
    const newSessionExpireTime = new Date(now + 60 * 1000).toISOString();

    const resp = await fetch("https://generativelanguage.googleapis.com/v1alpha/auth_tokens", {
      method: "POST",
      headers: { "x-goog-api-key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        uses: 1,
        expireTime,
        newSessionExpireTime,
        bidiGenerateContentSetup: {
          model,
          systemInstruction: { parts: [{ text: systemInstruction }] },
          generationConfig: { responseModalities: ["AUDIO"] },
          realtimeInputConfig: { automaticActivityDetection: { disabled: true } },
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        },
      }),
    });
    if (!resp.ok) return jsonResponse({ error: `Gemini a échoué : ${await resp.text()}` }, 502);

    const json = await resp.json();
    const token = json.name as string | undefined;
    if (!token) return jsonResponse({ error: "Aucun token reçu de Gemini." }, 502);

    // Le client ne reçoit QUE le token — ni le modèle, ni le prompt, ni le
    // message d'accueil ne lui sont communiqués (cf. geminiVoice.ts).
    return jsonResponse({ token });
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : "Erreur inconnue." }, 500);
  }
});
