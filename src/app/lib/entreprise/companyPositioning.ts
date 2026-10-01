// Quiz d'une entreprise — QCM, miroir de quiz_questions/quiz_options (voir
// AdminLessonEditorPage) mais scopé par entreprise et sans notion de
// remédiation : un seul essai enregistré par élève. Deux usages partagent
// les mêmes tables, distingués par kind : le test de positionnement (avant
// la formation) et le quiz de validation (après).
import { supabase } from "@/app/lib/supabase/client";
import type { CompanyQuizKind } from "@/app/lib/supabase/database.types";

export type { CompanyQuizKind };

export const QUIZ_KIND_LABEL: Record<CompanyQuizKind, { singular: string; plural: string }> = {
  positioning: { singular: "Test de positionnement", plural: "Tests de positionnement" },
  validation: { singular: "Quiz de validation", plural: "Quiz de validation" },
};

export interface PositioningTestRow {
  id: string;
  companyId: string;
  title: string;
  kind: CompanyQuizKind;
  isVisible: boolean;
  questionCount: number;
}

export interface QuizOptionDraft { id?: string; label: string; isCorrect: boolean; }
export interface QuizQuestionDraft { id?: string; question: string; explanation: string; options: QuizOptionDraft[]; }

async function countQuestions(testIds: string[]): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  if (!testIds.length) return counts;
  const { data, error } = await supabase.from("company_positioning_questions").select("test_id").in("test_id", testIds);
  if (error) throw error;
  for (const q of data ?? []) counts.set(q.test_id, (counts.get(q.test_id) ?? 0) + 1);
  return counts;
}

export async function listPositioningTests(companyId: string, kind?: CompanyQuizKind): Promise<PositioningTestRow[]> {
  let query = supabase
    .from("company_positioning_tests")
    .select("id, company_id, title, kind, is_visible")
    .eq("company_id", companyId);
  if (kind) query = query.eq("kind", kind);
  const { data: tests, error } = await query.order("created_at", { ascending: false });
  if (error) throw error;
  if (!tests?.length) return [];

  const counts = await countQuestions(tests.map((t) => t.id));
  return tests.map((t) => ({
    id: t.id, companyId: t.company_id, title: t.title, kind: t.kind, isVisible: t.is_visible, questionCount: counts.get(t.id) ?? 0,
  }));
}

export async function createPositioningTest(companyId: string, title: string, createdBy: string, kind: CompanyQuizKind): Promise<string> {
  const { data, error } = await supabase
    .from("company_positioning_tests")
    .insert({ company_id: companyId, title, created_by: createdBy, kind })
    .select("id")
    .single();
  if (error || !data) throw error ?? new Error("Erreur inconnue");
  return data.id;
}

export async function togglePositioningTestVisibility(testId: string, isVisible: boolean): Promise<void> {
  const { error } = await supabase.from("company_positioning_tests").update({ is_visible: isVisible }).eq("id", testId);
  if (error) throw error;
}

export async function deletePositioningTest(testId: string): Promise<void> {
  const { error } = await supabase.from("company_positioning_tests").delete().eq("id", testId);
  if (error) throw error;
}

export async function renamePositioningTest(testId: string, title: string): Promise<void> {
  const { error } = await supabase.from("company_positioning_tests").update({ title }).eq("id", testId);
  if (error) throw error;
}

export async function getPositioningQuestions(testId: string): Promise<QuizQuestionDraft[]> {
  const { data: questionRows, error } = await supabase
    .from("company_positioning_questions")
    .select("id, question, explanation, order_index")
    .eq("test_id", testId)
    .order("order_index");
  if (error) throw error;
  if (!questionRows?.length) return [];

  const { data: optionRows, error: optionsError } = await supabase
    .from("company_positioning_options")
    .select("id, question_id, label, is_correct, order_index")
    .in("question_id", questionRows.map((q) => q.id))
    .order("order_index");
  if (optionsError) throw optionsError;

  return questionRows.map((q) => ({
    id: q.id,
    question: q.question,
    explanation: q.explanation ?? "",
    options: (optionRows ?? []).filter((o) => o.question_id === q.id).map((o) => ({ id: o.id, label: o.label, isCorrect: o.is_correct })),
  }));
}

// Met à jour sur place (questions et réponses gardent leur id) au lieu de
// tout supprimer puis réinsérer : les tentatives déjà enregistrées
// référencent ces id dans answers, les résultats restent donc lisibles après
// une modification du quiz.
export async function savePositioningQuestions(testId: string, questions: QuizQuestionDraft[]): Promise<void> {
  const kept = questions.filter((q) => q.question.trim());

  const { data: existing, error: existingError } = await supabase
    .from("company_positioning_questions").select("id").eq("test_id", testId);
  if (existingError) throw existingError;
  const keptIds = new Set(kept.map((q) => q.id).filter(Boolean));
  const removedIds = (existing ?? []).map((q) => q.id).filter((id) => !keptIds.has(id));
  if (removedIds.length) {
    const { error } = await supabase.from("company_positioning_questions").delete().in("id", removedIds);
    if (error) throw error;
  }

  for (let qIndex = 0; qIndex < kept.length; qIndex++) {
    const q = kept[qIndex];
    const fields = { question: q.question.trim(), explanation: q.explanation.trim() || null, order_index: qIndex };
    let questionId = q.id;
    if (questionId) {
      const { error } = await supabase.from("company_positioning_questions").update(fields).eq("id", questionId);
      if (error) throw error;
    } else {
      const { data, error } = await supabase
        .from("company_positioning_questions").insert({ test_id: testId, ...fields }).select("id").single();
      if (error || !data) throw error ?? new Error("Erreur quiz");
      questionId = data.id;
    }
    await saveQuestionOptions(questionId, q.options);
  }
}

async function saveQuestionOptions(questionId: string, options: QuizOptionDraft[]): Promise<void> {
  const kept = options.filter((o) => o.label.trim());

  const { data: existing, error: existingError } = await supabase
    .from("company_positioning_options").select("id").eq("question_id", questionId);
  if (existingError) throw existingError;
  const keptIds = new Set(kept.map((o) => o.id).filter(Boolean));
  const removedIds = (existing ?? []).map((o) => o.id).filter((id) => !keptIds.has(id));
  if (removedIds.length) {
    const { error } = await supabase.from("company_positioning_options").delete().in("id", removedIds);
    if (error) throw error;
  }

  for (let oIndex = 0; oIndex < kept.length; oIndex++) {
    const o = kept[oIndex];
    const fields = { label: o.label.trim(), is_correct: o.isCorrect, order_index: oIndex };
    const { error } = o.id
      ? await supabase.from("company_positioning_options").update(fields).eq("id", o.id)
      : await supabase.from("company_positioning_options").insert({ question_id: questionId, ...fields });
    if (error) throw error;
  }
}

// ── Côté élève ────────────────────────────────────────────────────────────

export interface VisiblePositioningTest {
  id: string;
  title: string;
  questionCount: number;
  done: boolean;
  score: number | null;
}

export async function listVisiblePositioningTests(companyId: string, studentId: string, kind: CompanyQuizKind): Promise<VisiblePositioningTest[]> {
  const { data: tests, error } = await supabase
    .from("company_positioning_tests")
    .select("id, title")
    .eq("company_id", companyId)
    .eq("kind", kind)
    .eq("is_visible", true)
    .order("created_at", { ascending: true });
  if (error) throw error;
  if (!tests?.length) return [];

  const counts = await countQuestions(tests.map((t) => t.id));

  const { data: attempts, error: attemptsError } = await supabase
    .from("company_positioning_attempts")
    .select("test_id, score")
    .eq("student_id", studentId)
    .in("test_id", tests.map((t) => t.id));
  if (attemptsError) throw attemptsError;
  const scoreByTest = new Map<string, number>();
  for (const a of attempts ?? []) scoreByTest.set(a.test_id, a.score);

  return tests.map((t) => ({
    id: t.id, title: t.title, questionCount: counts.get(t.id) ?? 0,
    done: scoreByTest.has(t.id), score: scoreByTest.get(t.id) ?? null,
  }));
}

export interface PositioningQuestionForStudent {
  id: string;
  question: string;
  options: { id: string; label: string; isCorrect: boolean }[];
}

// isCorrect voyage jusqu'au client pour calculer le score localement à la
// soumission — même convention que le quiz de leçon CPF (lib/learning.ts,
// getLessonContent), pas de vérification serveur séparée dans ce codebase.
export async function getPositioningTestForTaking(testId: string): Promise<{ title: string; kind: CompanyQuizKind; questions: PositioningQuestionForStudent[] }> {
  const { data: test, error: testError } = await supabase.from("company_positioning_tests").select("title, kind").eq("id", testId).single();
  if (testError || !test) throw testError ?? new Error("Test introuvable");

  const { data: questionRows, error } = await supabase
    .from("company_positioning_questions")
    .select("id, question, order_index")
    .eq("test_id", testId)
    .order("order_index");
  if (error) throw error;

  const { data: optionRows, error: optionsError } = await supabase
    .from("company_positioning_options")
    .select("id, question_id, label, is_correct, order_index")
    .in("question_id", (questionRows ?? []).map((q) => q.id))
    .order("order_index");
  if (optionsError) throw optionsError;

  return {
    title: test.title,
    kind: test.kind,
    questions: (questionRows ?? []).map((q) => ({
      id: q.id, question: q.question,
      options: (optionRows ?? []).filter((o) => o.question_id === q.id).map((o) => ({ id: o.id, label: o.label, isCorrect: o.is_correct })),
    })),
  };
}

export interface PositioningAnswer { questionId: string; selectedOptionId: string; correct: boolean; }

export async function submitPositioningAttempt(testId: string, companyId: string, studentId: string, answers: PositioningAnswer[]): Promise<number> {
  const score = answers.length ? Math.round((answers.filter((a) => a.correct).length / answers.length) * 100) : 0;
  const { error } = await supabase
    .from("company_positioning_attempts")
    .insert({ test_id: testId, company_id: companyId, student_id: studentId, score, answers });
  if (error) throw error;
  return score;
}

// ── Staff : résultats ─────────────────────────────────────────────────────

export interface PositioningAttemptRow {
  id: string;
  testId: string;
  studentId: string;
  score: number;
  answers: PositioningAnswer[];
  createdAt: string;
}

export async function listCompanyPositioningAttempts(companyId: string): Promise<PositioningAttemptRow[]> {
  const { data, error } = await supabase
    .from("company_positioning_attempts")
    .select("id, test_id, student_id, score, answers, created_at")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((a) => ({
    id: a.id, testId: a.test_id, studentId: a.student_id, score: Number(a.score),
    answers: (a.answers ?? []) as PositioningAnswer[], createdAt: a.created_at,
  }));
}

// Supprime la tentative : l'élève peut alors repasser le quiz.
export async function deletePositioningAttempt(attemptId: string): Promise<void> {
  const { error } = await supabase.from("company_positioning_attempts").delete().eq("id", attemptId);
  if (error) throw error;
}
