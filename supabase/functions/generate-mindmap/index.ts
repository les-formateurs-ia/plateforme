// Génère une mindmap interactive pour une leçon : structure strictement fidèle
// au cours (jamais personnalisée), mais les exemples illustratifs à l'intérieur
// des nœuds peuvent refléter le métier/objectif de l'élève. Un seul appel texte
// (pas d'audio) donc pas de découpage nécessaire — la limite CPU des Edge
// Functions ne s'applique qu'au traitement de gros payloads binaires.
import { createClient } from "npm:@supabase/supabase-js@2.48.1";
import { CORS_HEADERS, jsonResponse } from "../_shared/podcast-utils.ts";

const GEMINI_TEXT_MODEL = "gemini-3.6-flash";

function buildMindmapPrompt(lessonTitle: string, lessonContent: string, objectifProfessionnel: string | null): string {
  return `Tu es un ingénieur pédagogique. Crée une mindmap interactive et détaillée pour la leçon "${lessonTitle}", à partir EXCLUSIVEMENT du cours ci-dessous.

RÈGLE ABSOLUE SUR LA STRUCTURE : les nœuds, titres et sous-titres de la mindmap doivent refléter fidèlement et intégralement le cours ci-dessous — n'invente aucun sujet qui n'y figure pas, n'en omets aucun point important. La structure est IDENTIQUE pour tous les élèves, elle ne doit jamais être adaptée au profil de l'élève.

RÈGLE SUR LES EXEMPLES : dans chaque nœud pertinent, donne 1 à 2 exemples concrets et actuels illustrant le concept. Quand c'est pertinent, ces exemples peuvent être adaptés au contexte professionnel de l'élève ci-dessous (SEULS les exemples, jamais la structure ni le contenu théorique).

=== COURS ===
${lessonContent}

=== CONTEXTE PROFESSIONNEL DE L'ÉLÈVE (pour les exemples uniquement) ===
${objectifProfessionnel?.trim() ? objectifProfessionnel : "Non renseigné — utilise des exemples professionnels généralistes et variés."}

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

    const { lessonId } = await req.json();
    if (!lessonId) return jsonResponse({ error: "lessonId manquant." }, 400);

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
      .from("lessons").select("id, title, reference_content").eq("id", lessonId).maybeSingle();
    if (lessonErr) return jsonResponse({ error: lessonErr.message }, 500);
    if (!lesson) return jsonResponse({ error: "Leçon introuvable ou accès refusé." }, 404);
    if (!lesson.reference_content) return jsonResponse({ error: "Cette leçon n'a pas encore de contenu de cours." }, 400);

    const { data: onboarding } = await supabase
      .from("student_onboarding").select("goal, goal_detail").eq("user_id", userId).maybeSingle();
    const objectifProfessionnel = onboarding?.goal_detail || onboarding?.goal || null;

    const prompt = buildMindmapPrompt(lesson.title, lesson.reference_content, objectifProfessionnel);
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

    await supabase.from("ai_generated_content").delete()
      .eq("user_id", userId).eq("lesson_id", lessonId).eq("content_type", "mindmap");
    const { error: insertErr } = await supabase.from("ai_generated_content").insert({
      user_id: userId,
      lesson_id: lessonId,
      content_type: "mindmap",
      source_prompt: "Structure fidèle au cours, exemples personnalisés (voir generate-mindmap).",
      content: { tree },
      model: GEMINI_TEXT_MODEL,
    });
    if (insertErr) return jsonResponse({ error: `Échec de l'enregistrement : ${insertErr.message}` }, 500);

    return jsonResponse({ tree });
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : "Erreur inconnue." }, 500);
  }
});
