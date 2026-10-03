// Questionnaire (test de satisfaction) d'une entreprise — questions mixtes
// (QCM à choix unique ou multiple / note 1-5 / Oui-Non avec texte
// conditionnel / texte libre), chacune obligatoire ou facultative. Même
// principe de sauvegarde sur place que le quiz (lib/companyPositioning.ts).
import { supabase } from "@/app/lib/supabase/client";
import type { SatisfactionQuestionType } from "@/app/lib/supabase/database.types";

export type { SatisfactionQuestionType };
export type YesNo = "yes" | "no";

export interface SatisfactionTestRow {
  id: string;
  companyId: string;
  title: string;
  isVisible: boolean;
  questionCount: number;
  isGlobal: boolean; // déjà enregistré en questionnaire global
}

export interface SatisfactionOptionDraft { id?: string; label: string; }
export interface SatisfactionQuestionDraft {
  id?: string;
  question: string;
  type: SatisfactionQuestionType;
  isRequired: boolean;
  allowMultiple: boolean;       // seulement pour type === 'qcm'
  followUpOn: YesNo | null;     // seulement pour type === 'yes_no'
  followUpLabel: string;        // seulement pour type === 'yes_no'
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

  const { data: templates, error: templatesError } = await supabase
    .from("company_satisfaction_templates")
    .select("source_test_id")
    .in("source_test_id", tests.map((t) => t.id));
  if (templatesError) throw templatesError;
  const globalIds = new Set((templates ?? []).map((t) => t.source_test_id));

  return tests.map((t) => ({
    id: t.id, companyId: t.company_id, title: t.title, isVisible: t.is_visible, questionCount: counts.get(t.id) ?? 0, isGlobal: globalIds.has(t.id),
  }));
}

export async function createSatisfactionTest(companyId: string, title: string, description: string | null, createdBy: string): Promise<string> {
  const { data, error } = await supabase
    .from("company_satisfaction_tests")
    .insert({ company_id: companyId, title, description, created_by: createdBy })
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

export async function updateSatisfactionTestHeader(testId: string, title: string, description: string | null): Promise<void> {
  const { error } = await supabase.from("company_satisfaction_tests").update({ title, description }).eq("id", testId);
  if (error) throw error;
}

const QUESTION_COLUMNS = "id, question, question_type, is_required, allow_multiple, follow_up_on, follow_up_label, order_index";

interface QuestionRow {
  id: string; question: string; question_type: SatisfactionQuestionType; is_required: boolean;
  allow_multiple: boolean; follow_up_on: YesNo | null; follow_up_label: string | null;
}

async function loadQuestionsWithOptions(testId: string): Promise<{ rows: QuestionRow[]; options: { id: string; question_id: string; label: string }[] }> {
  const { data: rows, error } = await supabase
    .from("company_satisfaction_questions")
    .select(QUESTION_COLUMNS)
    .eq("test_id", testId)
    .order("order_index");
  if (error) throw error;
  if (!rows?.length) return { rows: [], options: [] };

  const { data: options, error: optionsError } = await supabase
    .from("company_satisfaction_options")
    .select("id, question_id, label, order_index")
    .in("question_id", rows.map((q) => q.id))
    .order("order_index");
  if (optionsError) throw optionsError;
  return { rows, options: options ?? [] };
}

export async function getSatisfactionTestForEditing(testId: string): Promise<{ description: string; questions: SatisfactionQuestionDraft[] }> {
  const { data: test, error } = await supabase.from("company_satisfaction_tests").select("description").eq("id", testId).single();
  if (error || !test) throw error ?? new Error("Questionnaire introuvable");
  const { rows, options } = await loadQuestionsWithOptions(testId);
  return {
    description: test.description ?? "",
    questions: rows.map((q) => ({
      id: q.id,
      question: q.question,
      type: q.question_type,
      isRequired: q.is_required,
      allowMultiple: q.allow_multiple,
      followUpOn: q.follow_up_on,
      followUpLabel: q.follow_up_label ?? "",
      options: options.filter((o) => o.question_id === q.id).map((o) => ({ id: o.id, label: o.label })),
    })),
  };
}

// Mise à jour sur place (id conservés) : les réponses déjà reçues pointent
// vers ces id, la synthèse reste donc juste après une modification.
export async function saveSatisfactionQuestions(testId: string, questions: SatisfactionQuestionDraft[]): Promise<void> {
  const kept = questions.filter((q) => q.question.trim());

  const { data: existing, error: existingError } = await supabase
    .from("company_satisfaction_questions").select("id").eq("test_id", testId);
  if (existingError) throw existingError;
  const keptIds = new Set(kept.map((q) => q.id).filter(Boolean));
  const removedIds = (existing ?? []).map((q) => q.id).filter((id) => !keptIds.has(id));
  if (removedIds.length) {
    const { error } = await supabase.from("company_satisfaction_questions").delete().in("id", removedIds);
    if (error) throw error;
  }

  for (let qIndex = 0; qIndex < kept.length; qIndex++) {
    const q = kept[qIndex];
    const fields = {
      question: q.question.trim(),
      question_type: q.type,
      is_required: q.isRequired,
      allow_multiple: q.type === "qcm" && q.allowMultiple,
      follow_up_on: q.type === "yes_no" ? q.followUpOn : null,
      follow_up_label: q.type === "yes_no" && q.followUpOn ? (q.followUpLabel.trim() || null) : null,
      order_index: qIndex,
    };
    let questionId = q.id;
    if (questionId) {
      const { error } = await supabase.from("company_satisfaction_questions").update(fields).eq("id", questionId);
      if (error) throw error;
    } else {
      const { data, error } = await supabase
        .from("company_satisfaction_questions").insert({ test_id: testId, ...fields }).select("id").single();
      if (error || !data) throw error ?? new Error("Erreur questionnaire");
      questionId = data.id;
    }
    await saveQuestionOptions(questionId, q.type === "qcm" ? q.options : []);
  }
}

async function saveQuestionOptions(questionId: string, options: SatisfactionOptionDraft[]): Promise<void> {
  const kept = options.filter((o) => o.label.trim());

  const { data: existing, error: existingError } = await supabase
    .from("company_satisfaction_options").select("id").eq("question_id", questionId);
  if (existingError) throw existingError;
  const keptIds = new Set(kept.map((o) => o.id).filter(Boolean));
  const removedIds = (existing ?? []).map((o) => o.id).filter((id) => !keptIds.has(id));
  if (removedIds.length) {
    const { error } = await supabase.from("company_satisfaction_options").delete().in("id", removedIds);
    if (error) throw error;
  }

  for (let oIndex = 0; oIndex < kept.length; oIndex++) {
    const o = kept[oIndex];
    const fields = { label: o.label.trim(), order_index: oIndex };
    const { error } = o.id
      ? await supabase.from("company_satisfaction_options").update(fields).eq("id", o.id)
      : await supabase.from("company_satisfaction_options").insert({ question_id: questionId, ...fields });
    if (error) throw error;
  }
}

// ── Questionnaires globaux (modèles réutilisables entre entreprises) ──────
// Instantané jsonb sans id (cf. migration company_satisfaction_templates) :
// "Utiliser" pré-remplit un nouveau questionnaire d'entreprise, qui reçoit
// ses propres questions/options — le modèle et la copie restent indépendants.

export interface SatisfactionTemplateRow {
  id: string;
  title: string;
  description: string;
  questions: SatisfactionQuestionDraft[];
  createdBy: string | null;
  updatedAt: string;
}

function toTemplateQuestions(questions: SatisfactionQuestionDraft[]): SatisfactionQuestionDraft[] {
  return questions.filter((q) => q.question.trim()).map((q) => ({
    question: q.question.trim(),
    type: q.type,
    isRequired: q.isRequired,
    allowMultiple: q.type === "qcm" && q.allowMultiple,
    followUpOn: q.type === "yes_no" ? q.followUpOn : null,
    followUpLabel: q.type === "yes_no" && q.followUpOn ? q.followUpLabel.trim() : "",
    options: q.type === "qcm" ? q.options.filter((o) => o.label.trim()).map((o) => ({ label: o.label.trim() })) : [],
  }));
}

export async function listSatisfactionTemplates(): Promise<SatisfactionTemplateRow[]> {
  const { data, error } = await supabase
    .from("company_satisfaction_templates")
    .select("id, title, description, questions, created_by, updated_at")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((t) => ({
    id: t.id, title: t.title, description: t.description ?? "", createdBy: t.created_by, updatedAt: t.updated_at,
    questions: (t.questions ?? []) as SatisfactionQuestionDraft[],
  }));
}

// sourceTestId : questionnaire d'entreprise dont le modèle est issu — unique
// en base, un même questionnaire ne peut être mis en global qu'une fois.
export async function createSatisfactionTemplate(
  title: string, description: string | null, questions: SatisfactionQuestionDraft[], createdBy: string, sourceTestId: string,
): Promise<void> {
  const { error } = await supabase
    .from("company_satisfaction_templates")
    .insert({ title, description, questions: toTemplateQuestions(questions), created_by: createdBy, source_test_id: sourceTestId });
  if (error?.code === "23505") throw new Error("Ce questionnaire est déjà enregistré en global.");
  if (error) throw error;
}

export async function updateSatisfactionTemplate(templateId: string, title: string, description: string | null, questions: SatisfactionQuestionDraft[]): Promise<void> {
  const { data, error } = await supabase
    .from("company_satisfaction_templates")
    .update({ title, description, questions: toTemplateQuestions(questions) })
    .eq("id", templateId)
    .select("id");
  if (error) throw error;
  // RLS : une mise à jour refusée ne renvoie pas d'erreur, seulement 0 ligne.
  if (!data?.length) throw new Error("Seul l'auteur de ce questionnaire global ou un administrateur peut le modifier.");
}

export async function deleteSatisfactionTemplate(templateId: string): Promise<void> {
  const { data, error } = await supabase.from("company_satisfaction_templates").delete().eq("id", templateId).select("id");
  if (error) throw error;
  if (!data?.length) throw new Error("Seul l'auteur de ce questionnaire global ou un administrateur peut le supprimer.");
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
  isRequired: boolean;
  allowMultiple: boolean;
  followUpOn: YesNo | null;
  followUpLabel: string | null;
  options: { id: string; label: string }[];
}

export async function getSatisfactionTestForTaking(testId: string): Promise<{ title: string; description: string | null; questions: SatisfactionQuestionForStudent[] }> {
  const { data: test, error: testError } = await supabase.from("company_satisfaction_tests").select("title, description").eq("id", testId).single();
  if (testError || !test) throw testError ?? new Error("Test introuvable");
  const { rows, options } = await loadQuestionsWithOptions(testId);
  return {
    title: test.title,
    description: test.description,
    questions: rows.map((q) => ({
      id: q.id, question: q.question, type: q.question_type, isRequired: q.is_required, allowMultiple: q.allow_multiple,
      followUpOn: q.follow_up_on, followUpLabel: q.follow_up_label,
      options: options.filter((o) => o.question_id === q.id).map((o) => ({ id: o.id, label: o.label })),
    })),
  };
}

// value : id d'option (QCM simple), liste d'id (QCM multiple), 1-5 (note),
// "yes"/"no" (Oui/Non), texte (texte libre) ; "" ou [] si non répondu.
// detail : texte saisi dans le champ conditionnel d'une question Oui/Non.
export interface SatisfactionAnswer {
  questionId: string;
  type: SatisfactionQuestionType;
  value: string | number | string[];
  detail?: string;
}

export async function submitSatisfactionResponse(testId: string, companyId: string, studentId: string, answers: SatisfactionAnswer[]): Promise<void> {
  const { error } = await supabase
    .from("company_satisfaction_responses")
    .insert({ test_id: testId, company_id: companyId, student_id: studentId, answers });
  if (error) throw error;
}

// ── Staff : résultats ─────────────────────────────────────────────────────

export interface SatisfactionResponseRow {
  id: string;
  testId: string;
  studentId: string;
  answers: SatisfactionAnswer[];
  createdAt: string;
}

export async function listCompanySatisfactionResponses(companyId: string): Promise<SatisfactionResponseRow[]> {
  const { data, error } = await supabase
    .from("company_satisfaction_responses")
    .select("id, test_id, student_id, answers, created_at")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id, testId: r.test_id, studentId: r.student_id, answers: (r.answers ?? []) as SatisfactionAnswer[], createdAt: r.created_at,
  }));
}

export async function getSatisfactionQuestionsForResults(testId: string): Promise<SatisfactionQuestionForStudent[]> {
  return (await getSatisfactionTestForTaking(testId)).questions;
}

// Supprime la réponse : l'élève peut alors répondre à nouveau.
export async function deleteSatisfactionResponse(responseId: string): Promise<void> {
  const { error } = await supabase.from("company_satisfaction_responses").delete().eq("id", responseId);
  if (error) throw error;
}
