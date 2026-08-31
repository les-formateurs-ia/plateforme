// Copilote IA de la leçon : répond UNIQUEMENT sur le sujet de la leçon et le
// métier/secteur de l'élève. Toute question hors périmètre est déclinée
// poliment (flag is_off_topic) plutôt que traitée comme une question générale.
import { createClient } from "npm:@supabase/supabase-js@2.48.1";
import { CORS_HEADERS, jsonResponse } from "../_shared/podcast-utils.ts";
import { parsePedagogyStyle, pedagogyStyleBlock } from "../_shared/pedagogy-style.ts";

const GEMINI_TEXT_MODEL = "gemini-3.6-flash";

function buildSystemPrompt(lessonTitle: string, lessonContent: string, profession: string | null, objectifProfessionnel: string | null, pedagogyStyle: string): string {
  return `Tu es le Copilote IA d'une plateforme de formation professionnelle à l'IA générative. Tu es UNIQUEMENT le formateur-mentor de l'élève pour la leçon en cours — pas un assistant généraliste.

=== PÉRIMÈTRE STRICT ===
Tu as le droit de répondre SEULEMENT à des questions qui portent sur :
1. Le contenu de cette leçon précise : "${lessonTitle}"
2. L'application de ce contenu au métier/secteur de l'élève (voir ci-dessous)

Toute autre question (actualité, autre matière, code sans rapport, vie privée, opinions générales, autre logiciel, etc.) est HORS PÉRIMÈTRE. Dans ce cas, décline poliment en une phrase, rappelle ton rôle, et propose de reformuler en lien avec la leçon ou son métier — ne réponds JAMAIS au fond d'une question hors périmètre, même partiellement.

=== COURS DE LA LEÇON ===
${lessonContent}

=== PROFIL DE L'ÉLÈVE ===
Métier : ${profession || "non renseigné"}
Objectif professionnel : ${objectifProfessionnel || "non renseigné"}

${pedagogyStyle}

=== TON ===
Pédagogue, concret, encourageant, tutoie l'élève. Réponses courtes (3-6 phrases sauf si la question demande plus de détail). Utilise des exemples liés à son métier quand c'est pertinent.

=== FORMAT DE SORTIE ===
Réponds UNIQUEMENT avec un objet JSON strict, sans texte autour : {"reply": "ta réponse ici", "offTopic": true ou false}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });

  try {
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiApiKey) return jsonResponse({ error: "GEMINI_API_KEY non configurée côté serveur." }, 500);

    const { lessonId, message } = await req.json();
    if (!lessonId || !message?.trim()) return jsonResponse({ error: "lessonId ou message manquant." }, 400);

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

    const { data: lesson, error: lessonErr } = await supabase
      .from("instance_lessons").select("id, title, reference_content").eq("id", lessonId).maybeSingle();
    if (lessonErr) return jsonResponse({ error: lessonErr.message }, 500);
    if (!lesson) return jsonResponse({ error: "Leçon introuvable." }, 404);

    const { data: onboarding } = await supabase
      .from("student_onboarding").select("profession, goal, goal_detail, ai_tutor_persona").eq("user_id", userId).maybeSingle();
    const objectifProfessionnel = onboarding?.goal_detail || onboarding?.goal || null;
    const pedagogyStyle = pedagogyStyleBlock(parsePedagogyStyle(onboarding?.ai_tutor_persona));

    const { data: historyRows } = await supabase
      .from("chat_messages").select("role, content").eq("user_id", userId).eq("lesson_id", lessonId)
      .order("created_at", { ascending: false }).limit(10);
    const history = (historyRows ?? []).reverse();

    const systemPrompt = buildSystemPrompt(lesson.title, lesson.reference_content ?? "(pas de contenu de référence pour cette leçon)", onboarding?.profession ?? null, objectifProfessionnel, pedagogyStyle);

    const contents = [
      { role: "user", parts: [{ text: systemPrompt }] },
      { role: "model", parts: [{ text: '{"reply":"Compris, je reste sur le sujet de la leçon et le métier de l\'élève.","offTopic":false}' }] },
      ...history.map((m) => ({ role: m.role === "ai" ? "model" : "user", parts: [{ text: m.content }] })),
      { role: "user", parts: [{ text: message.trim() }] },
    ];

    const geminiResp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_TEXT_MODEL}:generateContent`,
      {
        method: "POST",
        headers: { "x-goog-api-key": geminiApiKey, "Content-Type": "application/json" },
        body: JSON.stringify({ contents, generationConfig: { responseMimeType: "application/json" } }),
      },
    );
    if (!geminiResp.ok) return jsonResponse({ error: `Gemini a échoué : ${await geminiResp.text()}` }, 502);
    const geminiJson = await geminiResp.json();
    const rawText = geminiJson?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) return jsonResponse({ error: "Gemini n'a renvoyé aucune réponse." }, 502);

    let reply: string;
    let offTopic: boolean;
    try {
      const parsed = JSON.parse(rawText);
      reply = parsed.reply ?? "Je n'ai pas pu générer de réponse, réessaie.";
      offTopic = !!parsed.offTopic;
    } catch {
      reply = rawText;
      offTopic = false;
    }

    await supabase.from("chat_messages").insert({ user_id: userId, lesson_id: lessonId, role: "user", content: message.trim(), is_off_topic: false });
    await supabase.from("chat_messages").insert({ user_id: userId, lesson_id: lessonId, role: "ai", content: reply, is_off_topic: offTopic });

    return jsonResponse({ reply, offTopic });
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : "Erreur inconnue." }, 500);
  }
});
