// Test de positionnement d'une entreprise — QCM, miroir de quiz_questions/
// quiz_options (voir AdminLessonEditorPage) mais scopé par entreprise et
// sans notion de remédiation : un seul essai enregistré par élève.
import { supabase } from "@/app/lib/supabase/client";

export interface PositioningTestRow {
  id: string;
  companyId: string;
  title: string;
  isVisible: boolean;
  questionCount: number;
}

export interface QuizOptionDraft { id?: string; label: string; isCorrect: boolean; }
export interface QuizQuestionDraft { id?: string; question: string; explanation: string; options: QuizOptionDraft[]; }

export async function listPositioningTests(companyId: string): Promise<PositioningTestRow[]> {
  const { data: tests, error } = await supabase
    .from("company_positioning_tests")
    .select("id, company_id, title, is_visible")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  if (!tests?.length) return [];

  const { data: questions, error: questionsError } = await supabase
    .from("company_positioning_questions")
    .select("test_id")
    .in("test_id", tests.map((t) => t.id));
  if (questionsError) throw questionsError;
  const counts = new Map<string, number>();
  for (const q of questions ?? []) counts.set(q.test_id, (counts.get(q.test_id) ?? 0) + 1);

  return tests.map((t) => ({ id: t.id, companyId: t.company_id, title: t.title, isVisible: t.is_visible, questionCount: counts.get(t.id) ?? 0 }));
}

export async function createPositioningTest(companyId: string, title: string, createdBy: string): Promise<string> {
  const { data, error } = await supabase
    .from("company_positioning_tests")
    .insert({ company_id: companyId, title, created_by: createdBy })
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

// Repart d'une base propre à chaque sauvegarde (supprime puis réinsère) —
// même approche que le quiz de leçon CPF, simple et fiable vu le faible volume.
export async function savePositioningQuestions(testId: string, questions: QuizQuestionDraft[]): Promise<void> {
  const { error: deleteError } = await supabase.from("company_positioning_questions").delete().eq("test_id", testId);
  if (deleteError) throw deleteError;

  for (let qIndex = 0; qIndex < questions.length; qIndex++) {
    const q = questions[qIndex];
    if (!q.question.trim()) continue;
    const { data: questionRow, error: questionError } = await supabase
      .from("company_positioning_questions")
      .insert({ test_id: testId, question: q.question.trim(), explanation: q.explanation.trim() || null, order_index: qIndex })
      .select("id")
      .single();
    if (questionError || !questionRow) throw questionError ?? new Error("Erreur quiz");
    const options = q.options.filter((o) => o.label.trim()).map((o, oIndex) => ({
      question_id: questionRow.id, label: o.label.trim(), is_correct: o.isCorrect, order_index: oIndex,
    }));
    if (options.length) {
      const { error: optionsError } = await supabase.from("company_positioning_options").insert(options);
      if (optionsError) throw optionsError;
    }
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

export async function listVisiblePositioningTests(companyId: string, studentId: string): Promise<VisiblePositioningTest[]> {
  const { data: tests, error } = await supabase
    .from("company_positioning_tests")
    .select("id, title")
    .eq("company_id", companyId)
    .eq("is_visible", true)
    .order("created_at", { ascending: true });
  if (error) throw error;
  if (!tests?.length) return [];

  const { data: questions, error: questionsError } = await supabase
    .from("company_positioning_questions")
    .select("test_id")
    .in("test_id", tests.map((t) => t.id));
  if (questionsError) throw questionsError;
  const counts = new Map<string, number>();
  for (const q of questions ?? []) counts.set(q.test_id, (counts.get(q.test_id) ?? 0) + 1);

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
export async function getPositioningTestForTaking(testId: string): Promise<{ title: string; questions: PositioningQuestionForStudent[] }> {
  const { data: test, error: testError } = await supabase.from("company_positioning_tests").select("title").eq("id", testId).single();
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
