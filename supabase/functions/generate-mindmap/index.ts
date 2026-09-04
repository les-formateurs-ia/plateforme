// Génère une mindmap interactive pour une leçon : structure strictement fidèle
// au cours (jamais personnalisée), mais les exemples illustratifs à l'intérieur
// des nœuds peuvent refléter le métier/objectif de l'élève. Un seul appel texte
// (pas d'audio) donc pas de découpage nécessaire — la limite CPU des Edge
// Functions ne s'applique qu'au traitement de gros payloads binaires.
import { createClient } from "npm:@supabase/supabase-js@2.48.1";
import { CORS_HEADERS, jsonResponse, getCallerRole, isStaffRole } from "../_shared/podcast-utils.ts";
import { parsePedagogyStyle, pedagogyStyleBlock } from "../_shared/pedagogy-style.ts";

const GEMINI_TEXT_MODEL = "gemini-3.6-flash";

function buildMindmapPrompt(lessonTitle: string, lessonContent: string, objectifProfessionnel: string | null, pedagogyStyle: string): string {
  return `Tu es un ingénieur pédagogique. Crée une mindmap interactive et détaillée pour la leçon "${lessonTitle}", à partir EXCLUSIVEMENT du cours ci-dessous.

RÈGLE ABSOLUE SUR LA STRUCTURE : les nœuds, titres et sous-titres de la mindmap doivent refléter fidèlement et intégralement le cours ci-dessous — n'invente aucun sujet qui n'y figure pas, n'en omets aucun point important. La structure (nombre de nœuds, organisation, titres) est IDENTIQUE pour tous les élèves, elle ne doit JAMAIS être adaptée au profil ni au style pédagogique de l'élève.

RÈGLE SUR LES EXEMPLES : dans chaque nœud pertinent, donne 1 à 2 exemples concrets et actuels illustrant le concept. Quand c'est pertinent, ces exemples peuvent être adaptés au contexte professionnel de l'élève ci-dessous (SEULS les exemples, jamais la structure ni le contenu théorique).

RÈGLE SUR LA RÉDACTION DES "summary" : c'est le seul endroit où le style pédagogique ci-dessous s'applique — la longueur, la simplicité et la terminologie de chaque "summary" en tiennent compte (jamais la structure).

=== COURS ===
${lessonContent}

=== CONTEXTE PROFESSIONNEL DE L'ÉLÈVE (pour les exemples uniquement) ===
${objectifProfessionnel?.trim() ? objectifProfessionnel : "Non renseigné — utilise des exemples professionnels généralistes et variés."}

${pedagogyStyle}

=== FORMAT DE SORTIE ===
Réponds UNIQUEMENT avec un objet JSON strict, sans texte autour, de cette forme exacte :
{
  "title": "Titre de la mindmap",
  "children": [
    {
      "label": "Titre du nœud (court)",
      "summary": "1-2 phrases d'explication claire et pédagogique",
      "examples": ["exemple concret 1", "exemple concret 2"],
      "children": [ /* sous-nœuds, même structure, récursif, optionnel */ ]
    }
  ]
}
Structure la mindmap en 3 à 6 branches principales, chacune pouvant avoir 0 à 4 sous-nœuds. "examples" peut être un tableau vide si non pertinent pour ce nœud.`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });

  try {
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiApiKey) return jsonResponse({ error: "GEMINI_API_KEY non configurée côté serveur." }, 500);

    // templateLessonId : génère la mindmap de RÉFÉRENCE (niveau template,
    // lessons) au lieu de la mindmap personnalisée d'un duplicata élève
    // (lessonId, instance_lessons) — utilisé par la génération groupée à la
    // publication d'un cours (cf. 0042_lesson_reference_mindmaps.sql).
    const { lessonId, templateLessonId } = await req.json();
    if (!lessonId && !templateLessonId) return jsonResponse({ error: "lessonId manquant." }, 400);
    const isTemplate = !!templateLessonId;
    const targetId = isTemplate ? templateLessonId : lessonId;

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

    if (!isStaffRole(await getCallerRole(supabase, userId))) {
      return jsonResponse({ error: "Seuls un admin ou un formateur peuvent générer une mindmap." }, 403);
    }

    const { data: lesson, error: lessonErr } = await supabase
      .from(isTemplate ? "lessons" : "instance_lessons").select("id, title, reference_content").eq("id", targetId).maybeSingle();
    if (lessonErr) return jsonResponse({ error: lessonErr.message }, 500);
    if (!lesson) return jsonResponse({ error: "Leçon introuvable ou accès refusé." }, 404);
    if (!lesson.reference_content) return jsonResponse({ error: "Cette leçon n'a pas encore de contenu de cours." }, 400);

    // Une mindmap de référence n'a pas d'élève précis derrière elle — pas de
    // personnalisation possible, on reste sur les exemples génériques.
    let objectifProfessionnel: string | null = null;
    let pedagogyStyle = pedagogyStyleBlock(parsePedagogyStyle(null));
    if (!isTemplate) {
      const { data: onboarding } = await supabase
        .from("student_onboarding").select("goal, goal_detail, ai_tutor_persona").eq("user_id", userId).maybeSingle();
      objectifProfessionnel = onboarding?.goal_detail || onboarding?.goal || null;
      pedagogyStyle = pedagogyStyleBlock(parsePedagogyStyle(onboarding?.ai_tutor_persona));
    }

    const prompt = buildMindmapPrompt(lesson.title, lesson.reference_content, objectifProfessionnel, pedagogyStyle);
    const geminiResp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_TEXT_MODEL}:generateContent`,
      {
        method: "POST",
        headers: { "x-goog-api-key": geminiApiKey, "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json" } }),
      },
    );
    if (!geminiResp.ok) return jsonResponse({ error: `Gemini a échoué : ${await geminiResp.text()}` }, 502);
    const geminiJson = await geminiResp.json();
    const rawText = geminiJson?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) return jsonResponse({ error: "Gemini n'a renvoyé aucune mindmap." }, 502);

    let tree: unknown;
    try {
      tree = JSON.parse(rawText);
    } catch {
      return jsonResponse({ error: "Réponse Gemini invalide (JSON non parsable)." }, 502);
    }

    if (isTemplate) {
      await supabase.from("lesson_reference_mindmaps").delete().eq("lesson_id", targetId);
      const { error: insertErr } = await supabase.from("lesson_reference_mindmaps").insert({
        lesson_id: targetId,
        content: { tree },
        model: GEMINI_TEXT_MODEL,
        generated_by: userId,
      });
      if (insertErr) return jsonResponse({ error: `Échec de l'enregistrement : ${insertErr.message}` }, 500);
    } else {
      await supabase.from("ai_generated_content").delete()
        .eq("user_id", userId).eq("lesson_id", targetId).eq("content_type", "mindmap");
      const { error: insertErr } = await supabase.from("ai_generated_content").insert({
        user_id: userId,
        lesson_id: targetId,
        content_type: "mindmap",
        source_prompt: "Structure fidèle au cours, exemples personnalisés (voir generate-mindmap).",
        content: { tree },
        model: GEMINI_TEXT_MODEL,
      });
      if (insertErr) return jsonResponse({ error: `Échec de l'enregistrement : ${insertErr.message}` }, 500);
    }

    return jsonResponse({ tree });
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : "Erreur inconnue." }, 500);
  }
});
