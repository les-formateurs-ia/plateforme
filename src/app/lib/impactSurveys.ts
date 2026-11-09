// Évaluation d'impact après une session (migration 20261110120000) : un
// questionnaire par lien unique, sans compte (prénom + nom seulement), et un
// second lien vers le tableau de bord des résultats, à partager au
// responsable de l'entreprise. Mêmes types de questions que les
// questionnaires de satisfaction (QCM, note 1 à 5, Oui / Non, texte libre).
import { supabase } from "@/app/lib/supabase/client";
import type { Json } from "@/app/lib/supabase/database.types";
import type { SatisfactionAnswer, SatisfactionQuestionDraft, SatisfactionQuestionType, YesNo } from "@/app/lib/entreprise/companySatisfaction";

export type ImpactQuestion = {
  id: string; question: string; type: SatisfactionQuestionType; isRequired: boolean;
  allowMultiple: boolean; followUpOn: YesNo | null; followUpLabel: string;
  options: { id: string; label: string }[];
};
export type ImpactAnswer = SatisfactionAnswer;

export type ImpactSurveyRow = {
  id: string; sessionId: string; title: string; description: string; questions: ImpactQuestion[];
  answerToken: string; resultsToken: string; isOpen: boolean; createdAt: string; responseCount: number;
};

export type PublicImpactSurvey = {
  title: string; description: string | null; questions: ImpactQuestion[]; isOpen: boolean;
  formation: string; client: string; dateDebut: string; dateFin: string;
};
export type ImpactResponse = { id: string; firstName: string; lastName: string; answers: ImpactAnswer[]; createdAt: string };
export type ImpactResults = PublicImpactSurvey & { stagiaires: number; responses: ImpactResponse[] };

export const impactAnswerUrl = (token: string) => `${window.location.origin}/evaluation/${token}`;
export const impactResultsUrl = (token: string) => `${window.location.origin}/evaluation/resultats/${token}`;

// Les id des questions et des réponses de QCM restent stables d'une
// modification à l'autre : les réponses déjà reçues y renvoient.
export function toImpactQuestions(drafts: SatisfactionQuestionDraft[]): ImpactQuestion[] {
  return drafts.filter((q) => q.question.trim()).map((q) => ({
    id: q.id ?? crypto.randomUUID(),
    question: q.question.trim(),
    type: q.type,
    isRequired: q.isRequired,
    allowMultiple: q.type === "qcm" && q.allowMultiple,
    followUpOn: q.type === "yes_no" ? q.followUpOn : null,
    followUpLabel: q.type === "yes_no" && q.followUpOn ? q.followUpLabel.trim() : "",
    options: q.type === "qcm" ? q.options.filter((o) => o.label.trim()).map((o) => ({ id: o.id ?? crypto.randomUUID(), label: o.label.trim() })) : [],
  }));
}

export const toDrafts = (questions: ImpactQuestion[]): SatisfactionQuestionDraft[] => questions.map((q) => ({ ...q, options: q.options.map((o) => ({ ...o })) }));

// ── Équipe (admin) ────────────────────────────────────────────────────

export async function listImpactSurveys(sessionId: string): Promise<ImpactSurveyRow[]> {
  const { data, error } = await supabase.from("impact_surveys")
    .select("id, session_id, title, description, questions, answer_token, results_token, is_open, created_at")
    .eq("session_id", sessionId).order("created_at");
  if (error) throw error;
  const rows = data ?? [];
  const counts = new Map<string, number>();
  if (rows.length) {
    const { data: responses, error: rError } = await supabase.from("impact_survey_responses").select("survey_id").in("survey_id", rows.map((r) => r.id));
    if (rError) throw rError;
    for (const r of responses ?? []) counts.set(r.survey_id, (counts.get(r.survey_id) ?? 0) + 1);
  }
  return rows.map((r) => ({
    id: r.id, sessionId: r.session_id, title: r.title, description: r.description ?? "", questions: (r.questions ?? []) as unknown as ImpactQuestion[],
    answerToken: r.answer_token, resultsToken: r.results_token, isOpen: r.is_open, createdAt: r.created_at, responseCount: counts.get(r.id) ?? 0,
  }));
}

export async function saveImpactSurvey(p: {
  id: string | null; sessionId: string; title: string; description: string; questions: SatisfactionQuestionDraft[]; createdBy: string;
}): Promise<void> {
  const fields = { title: p.title.trim(), description: p.description.trim() || null, questions: toImpactQuestions(p.questions) as unknown as Json };
  const { error } = p.id
    ? await supabase.from("impact_surveys").update({ ...fields, updated_at: new Date().toISOString() }).eq("id", p.id)
    : await supabase.from("impact_surveys").insert({ ...fields, session_id: p.sessionId, created_by: p.createdBy });
  if (error) throw error;
}

export async function setImpactSurveyOpen(id: string, isOpen: boolean): Promise<void> {
  const { error } = await supabase.from("impact_surveys").update({ is_open: isOpen }).eq("id", id);
  if (error) throw error;
}

export async function deleteImpactSurvey(id: string): Promise<void> {
  const { error } = await supabase.from("impact_surveys").delete().eq("id", id);
  if (error) throw error;
}

// ── Liens publics (sans compte) ───────────────────────────────────────

export async function getPublicImpactSurvey(token: string): Promise<PublicImpactSurvey | null> {
  if (token === DEMO_TOKEN) return DEMO_SURVEY;
  const { data, error } = await supabase.rpc("get_impact_survey", { p_token: token });
  if (error) throw error;
  return (data as unknown as PublicImpactSurvey) ?? null;
}

export async function submitImpactSurvey(token: string, firstName: string, lastName: string, answers: ImpactAnswer[]): Promise<void> {
  if (token === DEMO_TOKEN) return;
  const { error } = await supabase.rpc("submit_impact_survey", {
    p_token: token, p_first_name: firstName, p_last_name: lastName, p_answers: answers as unknown as Json,
  });
  if (error) throw new Error(error.message);
}

export async function getImpactResults(token: string): Promise<ImpactResults | null> {
  if (token === DEMO_TOKEN) return DEMO_RESULTS;
  const { data, error } = await supabase.rpc("get_impact_survey_results", { p_token: token });
  if (error) throw error;
  return (data as unknown as ImpactResults) ?? null;
}

// ── Questionnaire proposé par défaut ──────────────────────────────────
// Évaluation « à froid » (quelques semaines après la formation) : mise en
// pratique, usages, gains, freins, besoins (niveaux 3 et 4 de Kirkpatrick).

const qcm = (question: string, labels: string[], allowMultiple = false): SatisfactionQuestionDraft =>
  ({ question, type: "qcm", isRequired: true, allowMultiple, followUpOn: null, followUpLabel: "", options: labels.map((label) => ({ label })) });
const rating = (question: string): SatisfactionQuestionDraft =>
  ({ question, type: "rating", isRequired: true, allowMultiple: false, followUpOn: null, followUpLabel: "", options: [] });
const yesNo = (question: string, followUpLabel: string): SatisfactionQuestionDraft =>
  ({ question, type: "yes_no", isRequired: true, allowMultiple: false, followUpOn: "yes", followUpLabel, options: [] });
const text = (question: string): SatisfactionQuestionDraft =>
  ({ question, type: "text", isRequired: false, allowMultiple: false, followUpOn: null, followUpLabel: "", options: [] });

export const DEFAULT_IMPACT_TITLE = "Évaluation de l’impact de la formation";
export const DEFAULT_IMPACT_DESCRIPTION = "Quelques semaines après la formation, nous aimerions savoir ce qu’elle a changé dans votre travail. 3 minutes suffisent.\nPour les notes : 1 = pas du tout, 5 = tout à fait.";

export function defaultImpactQuestions(): SatisfactionQuestionDraft[] {
  return [
    rating("Dans quelle mesure utilisez-vous aujourd’hui ce que vous avez appris pendant la formation ?"),
    qcm("À quelle fréquence utilisez-vous l’IA générative dans votre travail ?", ["Tous les jours", "Plusieurs fois par semaine", "Quelques fois par mois", "Rarement", "Jamais"]),
    qcm("Quels outils utilisez-vous désormais ?", ["ChatGPT", "Claude", "Gemini", "Microsoft Copilot", "Mistral / Le Chat", "Autre"], true),
    qcm("Combien de temps estimez-vous gagner par semaine grâce à la formation ?", ["Aucun", "Moins d’1 h", "1 à 3 h", "3 à 5 h", "Plus de 5 h"]),
    rating("La formation a-t-elle amélioré la qualité de votre travail ?"),
    yesNo("Avez-vous mis en place un nouveau cas d’usage ou une nouvelle façon de travailler depuis la formation ?", "Décrivez-le en quelques mots"),
    yesNo("Rencontrez-vous des freins pour appliquer ce que vous avez appris ?", "Lesquels ?"),
    rating("Recommanderiez-vous cette formation à un collègue ?"),
    text("Sur quels sujets aimeriez-vous aller plus loin ?"),
  ];
}

// ── Démonstration (/evaluation/demo et /evaluation/resultats/demo) ────
// Données fictives, sans base : aperçu des deux pages avant d'envoyer un lien.

export const DEMO_TOKEN = "demo";
const demoQuestions: ImpactQuestion[] = toImpactQuestions(defaultImpactQuestions()).map((q, i) => ({
  ...q, id: `q${i + 1}`, options: q.options.map((o, j) => ({ ...o, id: `q${i + 1}o${j + 1}` })),
}));
const DEMO_SURVEY: PublicImpactSurvey = {
  title: DEFAULT_IMPACT_TITLE, description: DEFAULT_IMPACT_DESCRIPTION, questions: demoQuestions, isOpen: true,
  formation: "IA générative au service de la performance", client: "Exemple Industrie SAS", dateDebut: "2026-09-14", dateFin: "2026-09-15",
};

const DEMO_PEOPLE: [string, string, number, string, string[], string, number, string | null, string | null, number, string][] = [
  ["Julie", "MARTIN", 5, "q2o1", ["q3o1", "q3o4"], "q4o3", 5, "Comptes rendus de réunion générés automatiquement à partir des notes.", null, 5, "Automatiser des tableaux Excel"],
  ["Karim", "BENALI", 4, "q2o2", ["q3o1", "q3o2"], "q4o3", 4, "Préparation des offres commerciales avec un assistant personnalisé.", "Manque de temps pour tester de nouveaux usages.", 5, "Créer des agents"],
  ["Sophie", "LEROY", 3, "q2o3", ["q3o4"], "q4o2", 3, null, "Les outils ne sont pas encore autorisés par la DSI.", 4, ""],
  ["Thomas", "DURAND", 5, "q2o1", ["q3o1", "q3o2", "q3o3"], "q4o4", 5, "Veille concurrentielle hebdomadaire synthétisée par l’IA.", null, 5, "Génération d’images pour la communication"],
  ["Amélie", "PETIT", 4, "q2o2", ["q3o2"], "q4o3", 4, "Rédaction des fiches produit.", null, 4, "Prompting avancé"],
  ["Nicolas", "MOREAU", 2, "q2o4", ["q3o4"], "q4o1", 3, null, "Je ne sais pas toujours quand l’utiliser.", 3, "Cas d’usage pour la comptabilité"],
  ["Laura", "SIMON", 5, "q2o1", ["q3o1", "q3o5"], "q4o5", 5, "Analyse des retours clients et tri des réclamations.", null, 5, ""],
];
const DEMO_RESULTS: ImpactResults = {
  ...DEMO_SURVEY, stagiaires: 9,
  responses: DEMO_PEOPLE.map(([firstName, lastName, use, freq, tools, gain, quality, usage, frein, reco, more], i) => ({
    id: `r${i}`, firstName, lastName, createdAt: new Date(Date.UTC(2026, 9, 20 + i, 9 + i)).toISOString(),
    answers: [
      { questionId: "q1", type: "rating", value: use },
      { questionId: "q2", type: "qcm", value: freq },
      { questionId: "q3", type: "qcm", value: tools },
      { questionId: "q4", type: "qcm", value: gain },
      { questionId: "q5", type: "rating", value: quality },
      { questionId: "q6", type: "yes_no", value: usage ? "yes" : "no", ...(usage ? { detail: usage } : {}) },
      { questionId: "q7", type: "yes_no", value: frein ? "yes" : "no", ...(frein ? { detail: frein } : {}) },
      { questionId: "q8", type: "rating", value: reco },
      { questionId: "q9", type: "text", value: more },
    ],
  })),
};
