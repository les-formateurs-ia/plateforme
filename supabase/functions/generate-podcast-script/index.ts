// Étape 1/2 de la génération de podcast : script du dialogue personnalisé.
// Séparée de la synthèse audio (generate-podcast-audio) car les deux étapes
// combinées dépassent le budget d'exécution d'une seule invocation Edge
// Function (~150s sur le plan gratuit) une fois la synthèse vocale ajoutée.
import { createClient } from "npm:@supabase/supabase-js@2.48.1";
import { CORS_HEADERS, jsonResponse } from "../_shared/podcast-utils.ts";

const GEMINI_TEXT_MODEL = "gemini-3.6-flash";
export const SPEAKER_A = "Alex";
export const SPEAKER_B = "Sam";

function buildScriptPrompt(lessonTitle: string, lessonContent: string, objectifProfessionnel: string | null): string {
  return `Tu es un producteur de podcast éducatif francophone. Crée le script d'un podcast à deux voix (deux animateurs qui dialoguent naturellement) à partir du cours ci-dessous, personnalisé pour un élève précis.

RÈGLE ABSOLUE : le contenu pédagogique obligatoire du cours (Source 1) doit être intégralement couvert et fidèlement transmis. Ne supprime jamais une connaissance, une méthode ou un point du cours pour "faire de la place" à la personnalisation — la personnalisation est une couche ajoutée, jamais un remplacement.

=== SOURCE 1 : COURS DE RÉFÉRENCE "${lessonTitle}" (obligatoire, à couvrir intégralement) ===
${lessonContent}

=== SOURCE 2 : PROFIL DE L'ÉLÈVE (contexte de personnalisation) ===
${objectifProfessionnel?.trim() ? objectifProfessionnel : "Aucun profil renseigné — reste généraliste mais professionnel, sans inventer de contexte métier."}

=== COMMENT PERSONNALISER (avec parcimonie et naturel) ===
- N'utilise le profil de l'élève QUE là où cela aide réellement à comprendre un concept, illustrer un exemple, ou montrer une application concrète.
- Ne répète pas mécaniquement son métier ou ses objectifs à chaque phrase — ce doit être un vrai dialogue pédagogique, pas un publipostage.
- Remplace ou complète les exemples génériques du cours par des exemples issus du secteur professionnel de l'élève quand c'est pertinent, sans inventer de faits précis sur son entreprise réelle.
- Termine en reliant explicitement le sujet du jour à l'un des objectifs exprimés par l'élève, si le profil le permet.

=== FORMAT DE SORTIE ===
Un dialogue entre deux animateurs nommés "${SPEAKER_A}" et "${SPEAKER_B}", naturel et dynamique, ENTRE 300 ET 400 MOTS MAXIMUM (impératif technique, ne pas dépasser), qui explique l'essentiel du cours ci-dessus du début à la fin sans en trahir le sens. Une ligne par réplique, format strict :
${SPEAKER_A}: ...
${SPEAKER_B}: ...

Ne produis aucun autre texte que les répliques (pas de titre, pas de note, pas de balise markdown).`;
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
      .from("lessons")
      .select("id, title, reference_content")
      .eq("id", lessonId)
      .maybeSingle();
    if (lessonErr) return jsonResponse({ error: lessonErr.message }, 500);
    if (!lesson) return jsonResponse({ error: "Leçon introuvable ou accès refusé." }, 404);
    if (!lesson.reference_content) return jsonResponse({ error: "Cette leçon n'a pas encore de contenu de cours." }, 400);

    const { data: onboarding } = await supabase
      .from("student_onboarding")
      .select("goal, goal_detail")
      .eq("user_id", userId)
      .maybeSingle();
    const objectifProfessionnel = onboarding?.goal_detail || onboarding?.goal || null;

    const scriptPrompt = buildScriptPrompt(lesson.title, lesson.reference_content, objectifProfessionnel);
    const textResp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_TEXT_MODEL}:generateContent`,
      {
        method: "POST",
        headers: { "x-goog-api-key": geminiApiKey, "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: scriptPrompt }] }] }),
      },
    );
    if (!textResp.ok) return jsonResponse({ error: `Gemini (script) a échoué : ${await textResp.text()}` }, 502);
    const textJson = await textResp.json();
    const script = textJson?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!script) return jsonResponse({ error: "Gemini n'a renvoyé aucun script." }, 502);

    return jsonResponse({ script });
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : "Erreur inconnue." }, 500);
  }
});
