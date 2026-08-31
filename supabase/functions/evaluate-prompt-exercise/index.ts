// Exercice "Exercices prompts" (Pratique IA) : l'élève écrit un prompt libre,
// l'IA le note /20 avec corrections précises (extraits verbatim pour que le
// front puisse les surligner dans le texte) + éléments manquants + verdict
// honnête. Transversal à toute la formation (pas une leçon précise) : le
// contexte envoyé au modèle agrège reference_content de toutes les leçons
// accessibles à l'élève (RLS lessons_read_enrolled s'applique normalement,
// via le token de l'appelant). Comparaison automatique avec la tentative
// précédente de CE même élève si elle existe.
import { createClient } from "npm:@supabase/supabase-js@2.48.1";
import { CORS_HEADERS, jsonResponse } from "../_shared/podcast-utils.ts";
import { buildCourseContext } from "../_shared/course-context.ts";
import { parsePedagogyStyle, pedagogyFeedbackToneBlock } from "../_shared/pedagogy-style.ts";

const GEMINI_TEXT_MODEL = "gemini-3.6-flash";

interface Correction { excerpt: string; suggestion: string; explanation: string }
interface MissingItem { title: string; explanation: string }
interface Feedback { score: number; corrections: Correction[]; missing: MissingItem[]; verdict: string }
interface PreviousAttempt { promptText: string; score: number; verdict: string; corrections: Correction[]; missing: MissingItem[] }

function buildEvaluationPrompt(
  studentPrompt: string,
  attemptNumber: number,
  courseContext: string,
  previous: PreviousAttempt | null,
  pedagogyStyle: string,
): string {
  const previousBlock = previous
    ? `
=== TENTATIVE PRÉCÉDENTE DE CET ÉLÈVE (comparaison obligatoire) ===
Prompt précédent :
---
${previous.promptText}
---
Score obtenu : ${previous.score}/20
Verdict précédent : ${previous.verdict}
Corrections précédemment signalées :
${previous.corrections.length ? previous.corrections.map((c, i) => `${i + 1}. "${c.excerpt}" → "${c.suggestion}"`).join("\n") : "(aucune)"}
Éléments manquants précédemment signalés :
${previous.missing.length ? previous.missing.map((m) => `- ${m.title}`).join("\n") : "(aucun)"}

Dans ton verdict final, dis explicitement si les problèmes ci-dessus sont corrigés, partiellement corrigés, ou toujours présents dans la nouvelle version — et si de nouveaux problèmes sont apparus entre les deux versions. Ne complimente pas une réécriture cosmétique qui n'a pas réglé le fond.
`
    : "";

  return `Tu es un expert reconnu en prompt engineering, niveau professoral — quelqu'un qui maîtrise en profondeur les techniques de rédaction de prompts efficaces pour les IA génératives actuelles (rôle/persona, contexte, contraintes de format, exemples, gestion des cas limites, itération, formulation sans ambiguïté), pas un correcteur vague qui se contente d'un ressenti général. Tu es l'évaluateur d'un exercice pratique sur une plateforme de formation professionnelle à l'IA générative (certification RS6776 "First Step") : ton rôle est d'aider l'élève à progresser concrètement, pas de le rassurer.

=== RÈGLES DE RÉFÉRENCE DE LA FORMATION (à appliquer en plus des bonnes pratiques générales) ===
${courseContext || "Aucun contenu de cours disponible pour le moment — évalue uniquement selon les bonnes pratiques générales de prompt engineering à jour."}
Si une méthode ou règle spécifique enseignée dans le cours ci-dessus est pertinente pour ce prompt et n'est pas respectée, signale-le comme une correction ou un élément manquant, au même titre qu'une règle générale de prompt engineering.

${pedagogyStyle}
${previousBlock}
=== PROMPT DE L'ÉLÈVE À ÉVALUER (tentative n°${attemptNumber}) ===
---
${studentPrompt}
---

=== CE QUE TU DOIS PRODUIRE ===
1. CORRECTIONS : repère chaque formulation du prompt ci-dessus qui est une erreur, une imprécision, une ambiguïté ou une maladresse qui nuit à son efficacité. Pour chacune : l'extrait fautif exact, une reformulation corrigée, une explication.
2. ÉLÉMENTS MANQUANTS : repère les éléments structurants absents (ex : rôle/persona de l'IA non défini, absence de contexte, absence de contrainte de format de sortie, absence de critères de réussite, absence d'exemples quand ils aideraient, règle du cours ci-dessus non respectée, etc.). Pour chacun, l'explication doit couvrir DEUX choses : (a) pourquoi c'est important en général dans un prompt et ce qui se passe concrètement si on l'omet, et (b) ce que ça change précisément dans CE prompt-ci.
3. SCORE sur 20 : honnête et rigoureux, sans complaisance — l'objectif est d'apprendre à l'élève à écrire des prompts réellement efficaces, pas de le flatter. Un prompt vague ou générique qui "marcherait à peu près" ne mérite pas une bonne note.
4. VERDICT global : évaluation honnête et directe de la qualité du prompt et de sa capacité à produire un résultat cohérent et fiable.${previous ? " Compare explicitement avec la tentative précédente (voir ci-dessus)." : ""}

=== RÈGLES ABSOLUES DE FORMAT ===
- Chaque "excerpt" dans "corrections" doit être une citation EXACTE, mot pour mot, copiée telle quelle depuis le prompt de l'élève ci-dessus (jamais reformulée, jamais résumée, jamais tronquée différemment) — impératif technique : ce texte sert à localiser automatiquement l'erreur dans l'interface. Choisis le fragment le plus court possible qui identifie sans ambiguïté le passage concerné, et liste les corrections dans l'ordre où elles apparaissent dans le prompt. N'invente jamais un extrait qui n'existe pas mot pour mot dans le prompt de l'élève.
- Les explications doivent être concises, concrètes et directement exploitables — jamais de remarque vague du type "ce serait mieux d'être plus précis" sans dire précisément quoi et pourquoi. Pas de blabla, va à l'essentiel.

=== FORMAT DE SORTIE ===
Réponds UNIQUEMENT avec un objet JSON strict, sans texte autour, de cette forme exacte :
{
  "score": <entier de 0 à 20>,
  "corrections": [ { "excerpt": "...", "suggestion": "...", "explanation": "..." } ],
  "missing": [ { "title": "...", "explanation": "..." } ],
  "verdict": "..."
}
"corrections" et "missing" peuvent être des tableaux vides si réellement rien à signaler (rare pour un score inférieur à 20).`;
}

function sanitizeFeedback(raw: unknown): Feedback | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.score !== "number" || typeof r.verdict !== "string") return null;
  const corrections = Array.isArray(r.corrections)
    ? r.corrections
        .filter((c): c is Record<string, unknown> => !!c && typeof c === "object")
        .map((c) => ({ excerpt: String(c.excerpt ?? ""), suggestion: String(c.suggestion ?? ""), explanation: String(c.explanation ?? "") }))
        .filter((c) => c.excerpt.trim().length > 0)
    : [];
  const missing = Array.isArray(r.missing)
    ? r.missing
        .filter((m): m is Record<string, unknown> => !!m && typeof m === "object")
        .map((m) => ({ title: String(m.title ?? ""), explanation: String(m.explanation ?? "") }))
        .filter((m) => m.title.trim().length > 0)
    : [];
  return {
    score: Math.max(0, Math.min(20, Math.round(r.score))),
    corrections,
    missing,
    verdict: r.verdict.trim(),
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });

  try {
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiApiKey) return jsonResponse({ error: "GEMINI_API_KEY non configurée côté serveur." }, 500);

    const { promptText, sessionId } = await req.json();
    if (!promptText?.trim()) return jsonResponse({ error: "promptText manquant." }, 400);
    if (promptText.length > 8000) return jsonResponse({ error: "Ce prompt est trop long (8000 caractères max)." }, 400);
    if (typeof sessionId !== "string" || !/^[0-9a-f-]{36}$/i.test(sessionId)) return jsonResponse({ error: "sessionId manquant ou invalide." }, 400);

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

    // RLS (instance_lessons_select) restreint déjà cette lecture aux leçons
    // des duplicatas attribués à l'élève — pas de filtre supplémentaire ici.
    const { data: lessonRows } = await supabase
      .from("instance_lessons")
      .select("title, reference_content")
      .order("order_index");
    const courseContext = buildCourseContext(lessonRows ?? []);

    const { data: onboarding } = await supabase
      .from("student_onboarding")
      .select("ai_tutor_persona")
      .eq("user_id", userId)
      .maybeSingle();
    const pedagogyStyle = pedagogyFeedbackToneBlock(parsePedagogyStyle(onboarding?.ai_tutor_persona));

    const { data: previousRows } = await supabase
      .from("prompt_exercise_attempts")
      .select("attempt_number, prompt_text, score, feedback")
      .eq("user_id", userId)
      .eq("session_id", sessionId)
      .order("attempt_number", { ascending: false })
      .limit(1);
    const previousRow = previousRows?.[0] ?? null;
    const attemptNumber = (previousRow?.attempt_number ?? 0) + 1;
    const previous: PreviousAttempt | null = previousRow
      ? {
          promptText: previousRow.prompt_text,
          score: previousRow.score,
          verdict: (previousRow.feedback as Record<string, unknown>)?.verdict as string ?? "",
          corrections: ((previousRow.feedback as Record<string, unknown>)?.corrections as Correction[]) ?? [],
          missing: ((previousRow.feedback as Record<string, unknown>)?.missing as MissingItem[]) ?? [],
        }
      : null;

    const evalPrompt = buildEvaluationPrompt(promptText.trim(), attemptNumber, courseContext, previous, pedagogyStyle);
    const geminiResp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_TEXT_MODEL}:generateContent`,
      {
        method: "POST",
        headers: { "x-goog-api-key": geminiApiKey, "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: evalPrompt }] }], generationConfig: { responseMimeType: "application/json" } }),
      },
    );
    if (!geminiResp.ok) return jsonResponse({ error: `Gemini a échoué : ${await geminiResp.text()}` }, 502);
    const geminiJson = await geminiResp.json();
    const rawText = geminiJson?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) return jsonResponse({ error: "Gemini n'a renvoyé aucune évaluation." }, 502);

    let feedback: Feedback | null;
    try {
      feedback = sanitizeFeedback(JSON.parse(rawText));
    } catch {
      feedback = null;
    }
    if (!feedback) return jsonResponse({ error: "Réponse IA invalide, réessaie." }, 502);

    const { data: inserted, error: insertErr } = await supabase
      .from("prompt_exercise_attempts")
      .insert({
        user_id: userId,
        session_id: sessionId,
        attempt_number: attemptNumber,
        prompt_text: promptText.trim(),
        score: feedback.score,
        feedback: { corrections: feedback.corrections, missing: feedback.missing, verdict: feedback.verdict },
        model: GEMINI_TEXT_MODEL,
      })
      .select()
      .single();
    if (insertErr) return jsonResponse({ error: `Échec de l'enregistrement : ${insertErr.message}` }, 500);

    return jsonResponse({ attempt: inserted });
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : "Erreur inconnue." }, 500);
  }
});
