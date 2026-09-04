// Agent IA unifié par élève (remplace lesson-chat, scopé par leçon).
// Une conversation (agent_conversations) appartient à un élève, optionnellement
// rattachée à une formation ("projet") — jamais à une leçon précise : l'agent a
// toujours la vue d'ensemble du parcours de l'élève, en plus du contenu de la
// formation du projet actif le cas échéant.
import { createClient } from "npm:@supabase/supabase-js@2.48.1";
import { CORS_HEADERS, jsonResponse } from "../_shared/podcast-utils.ts";
import { parsePedagogyStyle, pedagogyStyleBlock } from "../_shared/pedagogy-style.ts";
import { buildCourseContext } from "../_shared/course-context.ts";
import { buildStudentOverview } from "../_shared/student-overview.ts";
import { getStudentMemoryText, scheduleStudentMemoryUpdate } from "../_shared/student-memory.ts";

const GEMINI_TEXT_MODEL = "gemini-3.6-flash";
const HISTORY_WINDOW = 40;

function buildSystemPrompt(opts: {
  courseTitle: string | null;
  courseContent: string;
  profession: string | null;
  objectifProfessionnel: string | null;
  pedagogyStyle: string;
  overviewText: string;
  memoryText: string;
}): string {
  return `Tu es l'Agent IA d'une plateforme de formation professionnelle à l'IA générative. Tu es LE mentor unique de l'élève : un seul agent qui le suit sur toute sa formation, avec une mémoire continue de toutes ses conversations passées avec toi (pas seulement celle-ci) — pas un chatbot différent par leçon.

=== PÉRIMÈTRE ===
Tu réponds sur : (1) le contenu de${opts.courseTitle ? ` la formation "${opts.courseTitle}"` : " ses formations"}, (2) l'application de ce contenu à son métier, (3) sa progression et ses résultats. Toute autre question (actualité, autre matière, vie privée, opinions générales, etc.) est HORS PÉRIMÈTRE : décline poliment en une phrase, rappelle ton rôle, propose de reformuler — ne réponds JAMAIS au fond d'une question hors périmètre.

=== CE QUE TU SAIS DÉJÀ DE CET ÉLÈVE (mémoire long terme, issue de vos échanges passés) ===
${opts.memoryText}

=== VUE D'ENSEMBLE DE L'ÉLÈVE (toutes formations actives) ===
${opts.overviewText}
${opts.courseContent ? `\n=== CONTENU DE RÉFÉRENCE — ${opts.courseTitle} ===\n${opts.courseContent}` : ""}

=== PROFIL DE L'ÉLÈVE ===
Métier : ${opts.profession || "non renseigné"}
Objectif professionnel : ${opts.objectifProfessionnel || "non renseigné"}

${opts.pedagogyStyle}

=== TON ===
Pédagogue, concret, encourageant, tutoie l'élève. Réponses courtes (3-6 phrases sauf si la question demande plus de détail). Utilise des exemples liés à son métier quand c'est pertinent. Tu peux t'appuyer sur ses résultats/sa progression ci-dessus pour personnaliser tes réponses (ex: revenir sur une notion mal maîtrisée).

=== FORMAT DE SORTIE ===
Réponds UNIQUEMENT avec un objet JSON strict, sans texte autour : {"reply": "ta réponse ici", "offTopic": true ou false}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });

  try {
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiApiKey) return jsonResponse({ error: "GEMINI_API_KEY non configurée côté serveur." }, 500);

    const { conversationId, formationInstanceId, message } = await req.json();
    if (!message?.trim()) return jsonResponse({ error: "message manquant." }, 400);

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

    // Résout la conversation : existante (l'élève a pu commencer en vocal, ou
    // reprendre une conversation passée) ou nouvelle, rattachée au projet actif.
    let resolvedConversationId: string = conversationId ?? "";
    let resolvedInstanceId: string | null = formationInstanceId ?? null;
    if (resolvedConversationId) {
      const { data: conv, error: convErr } = await supabase
        .from("agent_conversations").select("id, formation_instance_id").eq("id", resolvedConversationId).maybeSingle();
      if (convErr) return jsonResponse({ error: convErr.message }, 500);
      if (!conv) return jsonResponse({ error: "Conversation introuvable." }, 404);
      resolvedInstanceId = conv.formation_instance_id;
    } else {
      const { data: created, error: createErr } = await supabase
        .from("agent_conversations").insert({ user_id: userId, formation_instance_id: resolvedInstanceId }).select("id").single();
      if (createErr) return jsonResponse({ error: createErr.message }, 500);
      resolvedConversationId = created.id;
    }

    const { data: onboarding } = await supabase
      .from("student_onboarding").select("profession, goal, goal_detail, ai_tutor_persona").eq("user_id", userId).maybeSingle();
    const objectifProfessionnel = onboarding?.goal_detail || onboarding?.goal || null;
    const pedagogyStyle = pedagogyStyleBlock(parsePedagogyStyle(onboarding?.ai_tutor_persona));

    const [{ text: overviewText }, memoryText] = await Promise.all([
      buildStudentOverview(supabase, userId),
      getStudentMemoryText(supabase, userId),
    ]);

    let courseTitle: string | null = null;
    let courseContent = "";
    if (resolvedInstanceId) {
      const { data: instance } = await supabase
        .from("formation_instances").select("name").eq("id", resolvedInstanceId).maybeSingle();
      courseTitle = instance?.name ?? null;

      const { data: sections } = await supabase
        .from("instance_sections").select("id").eq("instance_id", resolvedInstanceId);
      const sectionIds = (sections ?? []).map((s: { id: string }) => s.id);
      if (sectionIds.length > 0) {
        const { data: lessons } = await supabase
          .from("instance_lessons").select("title, reference_content").in("section_id", sectionIds);
        courseContent = buildCourseContext(lessons ?? []);
      }
    }

    const { data: historyRows } = await supabase
      .from("agent_messages").select("role, content").eq("conversation_id", resolvedConversationId)
      .order("created_at", { ascending: false }).limit(HISTORY_WINDOW);
    const history = (historyRows ?? []).reverse();

    const systemPrompt = buildSystemPrompt({ courseTitle, courseContent, profession: onboarding?.profession ?? null, objectifProfessionnel, pedagogyStyle, overviewText, memoryText });

    const contents = [
      { role: "user", parts: [{ text: systemPrompt }] },
      { role: "model", parts: [{ text: '{"reply":"Compris, je reste sur le périmètre de la formation et le métier de l\'élève.","offTopic":false}' }] },
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

    await supabase.from("agent_messages").insert({ conversation_id: resolvedConversationId, role: "user", content: message.trim(), modality: "text", is_off_topic: false });
    await supabase.from("agent_messages").insert({ conversation_id: resolvedConversationId, role: "ai", content: reply, modality: "text", is_off_topic: offTopic });
    scheduleStudentMemoryUpdate(supabase, userId);

    return jsonResponse({ conversationId: resolvedConversationId, reply, offTopic });
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : "Erreur inconnue." }, 500);
  }
});
