// Test de satisfaction d'une entreprise — questions mixtes (QCM / note 1-5 /
// texte libre). Même principe de sauvegarde "supprime puis réinsère" que le
// test de positionnement (lib/companyPositioning.ts).
import { supabase } from "@/app/lib/supabase/client";

export type SatisfactionQuestionType = "qcm" | "rating" | "text";

export interface SatisfactionTestRow {
  id: string;
  companyId: string;
  title: string;
  isVisible: boolean;
  questionCount: number;
}

export interface SatisfactionOptionDraft { id?: string; label: string; }
export interface SatisfactionQuestionDraft {
  id?: string;
  question: string;
  type: SatisfactionQuestionType;
  options: SatisfactionOptionDraft[]; // seulement pour type === 'qcm'
}

export async function listSatisfactionTests(companyId: string): Promise<SatisfactionTestRow[]> {
  const { data: tests, error } = await supabase
    .from("company_satisfaction_tests")
    .select("id, company_id, title, is_visible")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  if (!tests?.length) return [];

  const { data: questions, error: questionsError } = await supabase
    .from("company_satisfaction_questions")
    .select("test_id")
    .in("test_id", tests.map((t) => t.id));
  if (questionsError) throw questionsError;
  const counts = new Map<string, number>();
  for (const q of questions ?? []) counts.set(q.test_id, (counts.get(q.test_id) ?? 0) + 1);

  return tests.map((t) => ({ id: t.id, companyId: t.company_id, title: t.title, isVisible: t.is_visible, questionCount: counts.get(t.id) ?? 0 }));
}

export async function createSatisfactionTest(companyId: string, title: string, createdBy: string): Promise<string> {
  const { data, error } = await supabase
    .from("company_satisfaction_tests")
    .insert({ company_id: companyId, title, created_by: createdBy })
    .select("id")
    .single();
  if (error || !data) throw error ?? new Error("Erreur inconnue");
  return data.id;
}

export async function toggleSatisfactionTestVisibility(testId: string, isVisible: boolean): Promise<void> {
  const { error } = await supabase.from("company_satisfaction_tests").update({ is_visible: isVisible }).eq("id", testId);
  if (error) throw error;
}

export async function deleteSatisfactionTest(testId: string): Promise<void> {
  const { error } = await supabase.from("company_satisfaction_tests").delete().eq("id", testId);
  if (error) throw error;
}

export async function renameSatisfactionTest(testId: string, title: string): Promise<void> {
  const { error } = await supabase.from("company_satisfaction_tests").update({ title }).eq("id", testId);
  if (error) throw error;
}

export async function getSatisfactionQuestions(testId: string): Promise<SatisfactionQuestionDraft[]> {
  const { data: questionRows, error } = await supabase
    .from("company_satisfaction_questions")
    .select("id, question, question_type, order_index")
    .eq("test_id", testId)
    .order("order_index");
  if (error) throw error;
  if (!questionRows?.length) return [];

  const { data: optionRows, error: optionsError } = await supabase
    .from("company_satisfaction_options")
    .select("id, question_id, label, order_index")
    .in("question_id", questionRows.map((q) => q.id))
    .order("order_index");
  if (optionsError) throw optionsError;

  return questionRows.map((q) => ({
    id: q.id,
    question: q.question,
    type: q.question_type as SatisfactionQuestionType,
    options: (optionRows ?? []).filter((o) => o.question_id === q.id).map((o) => ({ id: o.id, label: o.label })),
  }));
}

export async function saveSatisfactionQuestions(testId: string, questions: SatisfactionQuestionDraft[]): Promise<void> {
  const { error: deleteError } = await supabase.from("company_satisfaction_questions").delete().eq("test_id", testId);
  if (deleteError) throw deleteError;

  for (let qIndex = 0; qIndex < questions.length; qIndex++) {
    const q = questions[qIndex];
    if (!q.question.trim()) continue;
    const { data: questionRow, error: questionError } = await supabase
      .from("company_satisfaction_questions")
      .insert({ test_id: testId, question: q.question.trim(), question_type: q.type, order_index: qIndex })
      .select("id")
      .single();
    if (questionError || !questionRow) throw questionError ?? new Error("Erreur questionnaire");
    if (q.type === "qcm") {
      const options = q.options.filter((o) => o.label.trim()).map((o, oIndex) => ({
        question_id: questionRow.id, label: o.label.trim(), order_index: oIndex,
      }));
      if (options.length) {
        const { error: optionsError } = await supabase.from("company_satisfaction_options").insert(options);
        if (optionsError) throw optionsError;
      }
    }
  }
}

// ── Côté élève ────────────────────────────────────────────────────────────

export interface VisibleSatisfactionTest {
  id: string;
  title: string;
  questionCount: number;
  done: boolean;
}

export async function listVisibleSatisfactionTests(companyId: string, studentId: string): Promise<VisibleSatisfactionTest[]> {
  const { data: tests, error } = await supabase
    .from("company_satisfaction_tests")
    .select("id, title")
    .eq("company_id", companyId)
    .eq("is_visible", true)
    .order("created_at", { ascending: true });
  if (error) throw error;
  if (!tests?.length) return [];

  const { data: questions, error: questionsError } = await supabase
    .from("company_satisfaction_questions")
    .select("test_id")
    .in("test_id", tests.map((t) => t.id));
  if (questionsError) throw questionsError;
  const counts = new Map<string, number>();
  for (const q of questions ?? []) counts.set(q.test_id, (counts.get(q.test_id) ?? 0) + 1);

  const { data: responses, error: responsesError } = await supabase
    .from("company_satisfaction_responses")
    .select("test_id")
    .eq("student_id", studentId)
    .in("test_id", tests.map((t) => t.id));
  if (responsesError) throw responsesError;
  const doneSet = new Set((responses ?? []).map((r) => r.test_id));

  return tests.map((t) => ({ id: t.id, title: t.title, questionCount: counts.get(t.id) ?? 0, done: doneSet.has(t.id) }));
}

export interface SatisfactionQuestionForStudent {
  id: string;
  question: string;
  type: SatisfactionQuestionType;
  options: { id: string; label: string }[];
}

export async function getSatisfactionTestForTaking(testId: string): Promise<{ title: string; questions: SatisfactionQuestionForStudent[] }> {
  const { data: test, error: testError } = await supabase.from("company_satisfaction_tests").select("title").eq("id", testId).single();
  if (testError || !test) throw testError ?? new Error("Test introuvable");

  const { data: questionRows, error } = await supabase
    .from("company_satisfaction_questions")
    .select("id, question, question_type, order_index")
    .eq("test_id", testId)
    .order("order_index");
  if (error) throw error;

  const { data: optionRows, error: optionsError } = await supabase
    .from("company_satisfaction_options")
    .select("id, question_id, label, order_index")
    .in("question_id", (questionRows ?? []).map((q) => q.id))
    .order("order_index");
  if (optionsError) throw optionsError;

  return {
    title: test.title,
    questions: (questionRows ?? []).map((q) => ({
      id: q.id, question: q.question, type: q.question_type as SatisfactionQuestionType,
      options: (optionRows ?? []).filter((o) => o.question_id === q.id).map((o) => ({ id: o.id, label: o.label })),
    })),
  };
}

export interface SatisfactionAnswer { questionId: string; type: SatisfactionQuestionType; value: string | number; }

export async function submitSatisfactionResponse(testId: string, companyId: string, studentId: string, answers: SatisfactionAnswer[]): Promise<void> {
  const { error } = await supabase
    .from("company_satisfaction_responses")
    .insert({ test_id: testId, company_id: companyId, student_id: studentId, answers });
  if (error) throw error;
}
