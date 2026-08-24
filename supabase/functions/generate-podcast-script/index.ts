// Étape 1/2 de la génération de podcast : script du dialogue personnalisé.
// Séparée de la synthèse audio (generate-podcast-audio) car les deux étapes
// combinées dépassent le budget d'exécution d'une seule invocation Edge
// Function (~150s sur le plan gratuit) une fois la synthèse vocale ajoutée.
import { createClient } from "npm:@supabase/supabase-js@2.48.1";
import { CORS_HEADERS, jsonResponse } from "../_shared/podcast-utils.ts";
import { resolvePodcastFormat, type PodcastFormatSpec } from "../_shared/podcast-formats.ts";

const GEMINI_TEXT_MODEL = "gemini-3.6-flash";
export const SPEAKER_A = "Alex";
export const SPEAKER_B = "Sam";

function buildScriptPrompt(
  lessonTitle: string,
  lessonContent: string,
  objectifProfessionnel: string | null,
  formateurPrompt: string | null,
  prenom: string | null,
  format: PodcastFormatSpec,
): string {
  const coverageRule = format.relaxCoverageRule
    ? `RÈGLE ABSOLUE : sélectionne uniquement les points, méthodes et définitions les plus importants du contenu pédagogique ci-dessous (Source 1) — il est normal et souhaité, dans ce format condensé, de ne pas tout couvrir. En revanche, ne déforme et n'invente jamais une information absente du cours.`
    : `RÈGLE ABSOLUE : le contenu pédagogique obligatoire du cours (Source 1) doit être intégralement couvert et fidèlement transmis. Ne supprime jamais une connaissance, une méthode ou un point du cours pour "faire de la place" à la personnalisation — la personnalisation est une couche ajoutée, jamais un remplacement.`;

  return `Tu es un producteur de podcast éducatif francophone. Crée le script d'un podcast à deux voix (deux animateurs qui dialoguent naturellement) à partir du cours ci-dessous, personnalisé pour un élève précis.

${coverageRule}

=== SOURCE 1 : COURS DE RÉFÉRENCE "${lessonTitle}" (obligatoire, à couvrir intégralement) ===
${lessonContent}

=== SOURCE 2 : PROFIL DE L'ÉLÈVE (contexte de personnalisation) ===
${objectifProfessionnel?.trim() ? objectifProfessionnel : "Aucun profil renseigné — reste généraliste mais professionnel, sans inventer de contexte métier."}

=== COMMENT PERSONNALISER (avec parcimonie et naturel) ===
- N'utilise le profil de l'élève QUE là où cela aide réellement à comprendre un concept, illustrer un exemple, ou montrer une application concrète.
- Ne répète pas mécaniquement son métier ou ses objectifs à chaque phrase — ce doit être un vrai dialogue pédagogique, pas un publipostage.
- Remplace ou complète les exemples génériques du cours par des exemples issus du secteur professionnel de l'élève quand c'est pertinent, sans inventer de faits précis sur son entreprise réelle.
- Termine en reliant explicitement le sujet du jour à l'un des objectifs exprimés par l'élève, si le profil le permet.${prenom?.trim() ? `
- L'élève s'appelle ${prenom.trim()} : adresse-toi à lui/elle par son prénom à un ou deux moments clés du dialogue (par exemple en introduction ou en conclusion), de façon naturelle et chaleureuse — jamais de façon mécanique ni répétée à outrance.` : ""}${formateurPrompt?.trim() ? `
- Consigne du formateur pour cette leçon (à respecter en priorité, prime sur les règles génériques ci-dessus en cas de conflit) : ${formateurPrompt.trim()}` : ""}

=== FORMAT CHOISI PAR L'ÉLÈVE : ${format.label} ===
${format.directive}

=== FORMAT DE SORTIE ===
Un dialogue entre deux animateurs nommés "${SPEAKER_A}" et "${SPEAKER_B}", naturel et dynamique, ENTRE ${format.wordRange.min} ET ${format.wordRange.max} MOTS (impératif technique, ne pas dépasser la borne haute), qui applique le format ci-dessus à l'essentiel du cours sans en trahir le sens. Une ligne par réplique, format strict :
${SPEAKER_A}: ...
${SPEAKER_B}: ...

Ne produis aucun autre texte que les répliques (pas de titre, pas de note, pas de balise markdown).`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });

  try {
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiApiKey) return jsonResponse({ error: "GEMINI_API_KEY non configurée côté serveur." }, 500);

    const { lessonId, variant } = await req.json();
    if (!lessonId) return jsonResponse({ error: "lessonId manquant." }, 400);
    const format = resolvePodcastFormat(variant);

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
      .select("id, title, reference_content, ai_content_prompt")
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

    const { data: profileRow } = await supabase
      .from("profiles")
      .select("first_name")
      .eq("id", userId)
      .maybeSingle();
    const prenom = profileRow?.first_name || null;

    const scriptPrompt = buildScriptPrompt(lesson.title, lesson.reference_content, objectifProfessionnel, lesson.ai_content_prompt, prenom, format);
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

    return jsonResponse({ script, variant: format.id });
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : "Erreur inconnue." }, 500);
  }
});
