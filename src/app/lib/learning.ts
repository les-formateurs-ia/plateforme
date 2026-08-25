// Couche d'accès aux données pour le parcours élève (leçons, quiz, progression, badges).
// Remplace les données statiques de `data/mock.ts` pour tout ce qui touche à la progression réelle.
import { supabase } from "@/app/lib/supabase/client";

export interface OutlineLesson {
  id: string;
  sectionId: string;
  slug: string;
  title: string;
  durationMinutes: number | null;
  orderIndex: number;
}

export interface OutlineSection {
  id: string;
  title: string;
  orderIndex: number;
  lessons: OutlineLesson[];
}

export interface CourseOutline {
  formationId: string;
  formationName: string;
  sections: OutlineSection[];
}

export async function getActiveFormationId(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("enrollments")
    .select("formation_id")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("enrolled_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data?.formation_id ?? null;
}

export async function getCourseOutline(formationId: string): Promise<CourseOutline | null> {
  const { data: formation, error: formationError } = await supabase
    .from("formations")
    .select("id, name")
    .eq("id", formationId)
    .maybeSingle();
  if (formationError) throw formationError;
  if (!formation) return null;

  const { data: sectionRows, error: sectionsError } = await supabase
    .from("sections")
    .select("id, title, order_index")
    .eq("formation_id", formationId)
    .order("order_index", { ascending: true });
  if (sectionsError) throw sectionsError;

  const sectionIds = (sectionRows ?? []).map((s) => s.id);
  const { data: lessonRows, error: lessonsError } =
    sectionIds.length > 0
      ? await supabase
          .from("lessons")
          .select("id, section_id, slug, title, duration_minutes, order_index")
          .in("section_id", sectionIds)
          .order("order_index", { ascending: true })
      : { data: [], error: null };
  if (lessonsError) throw lessonsError;

  return {
    formationId: formation.id,
    formationName: formation.name,
    sections: (sectionRows ?? []).map((s) => ({
      id: s.id,
      title: s.title,
      orderIndex: s.order_index,
      lessons: (lessonRows ?? [])
        .filter((l) => l.section_id === s.id)
        .map((l) => ({
          id: l.id,
          sectionId: l.section_id,
          slug: l.slug,
          title: l.title,
          durationMinutes: l.duration_minutes,
          orderIndex: l.order_index,
        })),
    })),
  };
}

export function flattenLessons(outline: CourseOutline): OutlineLesson[] {
  return outline.sections.flatMap((s) => s.lessons);
}

export interface LessonProgressRow {
  lessonId: string;
  status: "locked" | "in_progress" | "completed";
  bestQuizScore: number | null;
  timeSpentSeconds: number;
  completedAt: string | null;
}

export async function getLessonProgressMap(userId: string, lessonIds: string[]): Promise<Map<string, LessonProgressRow>> {
  if (lessonIds.length === 0) return new Map();
  const { data, error } = await supabase
    .from("lesson_progress")
    .select("lesson_id, status, best_quiz_score, time_spent_seconds, completed_at")
    .eq("user_id", userId)
    .in("lesson_id", lessonIds);
  if (error) throw error;
  return new Map(
    (data ?? []).map((r) => [
      r.lesson_id,
      {
        lessonId: r.lesson_id,
        status: r.status,
        bestQuizScore: r.best_quiz_score,
        timeSpentSeconds: r.time_spent_seconds,
        completedAt: r.completed_at,
      },
    ]),
  );
}

export type LessonState = "completed" | "available" | "locked";

export interface LessonWithState {
  lesson: OutlineLesson;
  progress: LessonProgressRow | null;
  state: LessonState;
}

// Règle métier : les leçons se débloquent dans l'ordre. Une leçon est
// accessible seulement si toutes celles qui la précèdent sont "completed".
export function computeLessonStates(lessons: OutlineLesson[], progress: Map<string, LessonProgressRow>): LessonWithState[] {
  let unlocked = true;
  return lessons.map((lesson) => {
    const p = progress.get(lesson.id) ?? null;
    const completed = p?.status === "completed";
    const state: LessonState = completed ? "completed" : unlocked ? "available" : "locked";
    if (!completed) unlocked = false;
    return { lesson, progress: p, state };
  });
}

export async function ensureLessonStarted(userId: string, lessonId: string): Promise<void> {
  const { error } = await supabase
    .from("lesson_progress")
    .upsert(
      { user_id: userId, lesson_id: lessonId, status: "in_progress", started_at: new Date().toISOString() },
      { onConflict: "user_id,lesson_id", ignoreDuplicates: true },
    );
  if (error) throw error;
}

export async function addTimeSpent(userId: string, lessonId: string, seconds: number): Promise<void> {
  if (seconds <= 0) return;
  const { data, error } = await supabase
    .from("lesson_progress")
    .select("time_spent_seconds")
    .eq("user_id", userId)
    .eq("lesson_id", lessonId)
    .maybeSingle();
  if (error) throw error;
  const next = (data?.time_spent_seconds ?? 0) + Math.round(seconds);
  const { error: updateError } = await supabase
    .from("lesson_progress")
    .update({ time_spent_seconds: next })
    .eq("user_id", userId)
    .eq("lesson_id", lessonId);
  if (updateError) throw updateError;
}

export interface QuizOption {
  id: string;
  label: string;
  isCorrect: boolean;
  orderIndex: number;
}

export interface QuizQuestion {
  id: string;
  question: string;
  explanation: string | null;
  orderIndex: number;
  options: QuizOption[];
}

export interface LessonDetail {
  id: string;
  sectionId: string;
  slug: string;
  title: string;
  durationMinutes: number | null;
  videoProvider: string;
  videoUrl: string | null;
  aiContentPrompt: string | null;
  practicalExercisePrompt: string | null;
  referenceContent: string | null;
  customHtmlContent: string | null;
  sectionTitle: string;
  formationId: string;
  formationName: string;
  questions: QuizQuestion[];
}

export async function getLessonDetail(lessonId: string): Promise<LessonDetail | null> {
  const { data: lesson, error: lessonError } = await supabase
    .from("lessons")
    .select("id, section_id, slug, title, video_provider, video_url, duration_minutes, ai_content_prompt, practical_exercise_prompt, reference_content, custom_html_content")
    .eq("id", lessonId)
    .maybeSingle();
  if (lessonError) throw lessonError;
  if (!lesson) return null;

  const { data: section, error: sectionError } = await supabase
    .from("sections")
    .select("title, formation_id")
    .eq("id", lesson.section_id)
    .maybeSingle();
  if (sectionError) throw sectionError;

  const { data: formation, error: formationError } = section
    ? await supabase.from("formations").select("name").eq("id", section.formation_id).maybeSingle()
    : { data: null, error: null };
  if (formationError) throw formationError;

  const { data: questionRows, error: questionsError } = await supabase
    .from("quiz_questions")
    .select("id, question, explanation, order_index")
    .eq("lesson_id", lessonId)
    .order("order_index", { ascending: true });
  if (questionsError) throw questionsError;

  const questionIds = (questionRows ?? []).map((q) => q.id);
  const { data: optionRows, error: optionsError } =
    questionIds.length > 0
      ? await supabase
          .from("quiz_options")
          .select("id, question_id, label, is_correct, order_index")
          .in("question_id", questionIds)
          .order("order_index", { ascending: true })
      : { data: [], error: null };
  if (optionsError) throw optionsError;

  return {
    id: lesson.id,
    sectionId: lesson.section_id,
    slug: lesson.slug,
    title: lesson.title,
    durationMinutes: lesson.duration_minutes,
    videoProvider: lesson.video_provider,
    videoUrl: lesson.video_url,
    aiContentPrompt: lesson.ai_content_prompt,
    practicalExercisePrompt: lesson.practical_exercise_prompt,
    referenceContent: lesson.reference_content,
    customHtmlContent: lesson.custom_html_content,
    sectionTitle: section?.title ?? "",
    formationId: section?.formation_id ?? "",
    formationName: formation?.name ?? "",
    questions: (questionRows ?? []).map((q) => ({
      id: q.id,
      question: q.question,
      explanation: q.explanation,
      orderIndex: q.order_index,
      options: (optionRows ?? [])
        .filter((o) => o.question_id === q.id)
        .map((o) => ({
          id: o.id,
          label: o.label,
          isCorrect: o.is_correct,
          orderIndex: o.order_index,
        })),
    })),
  };
}

export const QUIZ_PASS_THRESHOLD = 75;

export interface QuizAnswer {
  questionId: string;
  selectedOptionId: string;
  correct: boolean;
}

export interface QuizSubmitResult {
  score: number;
  passed: boolean;
  attemptNumber: number;
}

// Enregistre une tentative de quiz + met à jour la progression de la leçon.
// Si score >= 75%, la leçon passe à "completed" (ce qui déclenche l'attribution
// des badges côté base via un trigger — voir migration 0003).
export async function submitQuiz(userId: string, lessonId: string, answers: QuizAnswer[]): Promise<QuizSubmitResult> {
  const correctCount = answers.filter((a) => a.correct).length;
  const score = answers.length > 0 ? Math.round((correctCount / answers.length) * 100) : 0;
  const passed = score >= QUIZ_PASS_THRESHOLD;

  const { count, error: countError } = await supabase
    .from("quiz_attempts")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("lesson_id", lessonId);
  if (countError) throw countError;
  const attemptNumber = (count ?? 0) + 1;

  const { error: attemptError } = await supabase.from("quiz_attempts").insert({
    user_id: userId,
    lesson_id: lessonId,
    attempt_number: attemptNumber,
    score,
    passed,
    answers,
  });
  if (attemptError) throw attemptError;

  const { data: existing, error: existingError } = await supabase
    .from("lesson_progress")
    .select("best_quiz_score, status, completed_at")
    .eq("user_id", userId)
    .eq("lesson_id", lessonId)
    .maybeSingle();
  if (existingError) throw existingError;
  const bestScore = Math.max(score, existing?.best_quiz_score ?? 0);
  // Une leçon déjà validée ne doit jamais redevenir "in_progress" — sinon retenter
  // (et rater) un quiz après coup reverrouillerait la suite du parcours.
  const alreadyCompleted = existing?.status === "completed";
  const nowCompleted = passed || alreadyCompleted;

  const { error: progressError } = await supabase.from("lesson_progress").upsert(
    {
      user_id: userId,
      lesson_id: lessonId,
      status: nowCompleted ? "completed" : "in_progress",
      best_quiz_score: bestScore,
      completed_at: nowCompleted ? (existing?.completed_at ?? new Date().toISOString()) : null,
    },
    { onConflict: "user_id,lesson_id" },
  );
  if (progressError) throw progressError;

  return { score, passed, attemptNumber };
}

export interface BadgeRow {
  id: string;
  code: string;
  name: string;
  description: string | null;
  icon: string | null;
}

export async function getAllBadges(): Promise<BadgeRow[]> {
  const { data, error } = await supabase.from("badges").select("id, code, name, description, icon").order("code");
  if (error) throw error;
  return (data ?? []).map((b) => ({ id: b.id, code: b.code, name: b.name, description: b.description, icon: b.icon }));
}

export async function getEarnedBadgeIds(userId: string): Promise<Set<string>> {
  const { data, error } = await supabase.from("user_badges").select("badge_id").eq("user_id", userId);
  if (error) throw error;
  return new Set((data ?? []).map((r) => r.badge_id));
}

export interface DashboardStats {
  totalLessons: number;
  completedLessons: number;
  completionPct: number;
  totalTimeSeconds: number;
  averageQuizScore: number | null;
  sections: { title: string; total: number; done: number }[];
}

export async function getDashboardStats(userId: string): Promise<DashboardStats | null> {
  const formationId = await getActiveFormationId(userId);
  if (!formationId) return null;
  const outline = await getCourseOutline(formationId);
  if (!outline) return null;
  const lessons = flattenLessons(outline);
  const progress = await getLessonProgressMap(userId, lessons.map((l) => l.id));

  const completedRows = [...progress.values()].filter((p) => p.status === "completed");
  const totalTimeSeconds = [...progress.values()].reduce((sum, p) => sum + p.timeSpentSeconds, 0);
  const scores = completedRows.map((p) => p.bestQuizScore).filter((s): s is number => s != null);
  const averageQuizScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;

  return {
    totalLessons: lessons.length,
    completedLessons: completedRows.length,
    completionPct: lessons.length > 0 ? Math.round((completedRows.length / lessons.length) * 100) : 0,
    totalTimeSeconds,
    averageQuizScore,
    sections: outline.sections.map((s) => ({
      title: s.title,
      total: s.lessons.length,
      done: s.lessons.filter((l) => progress.get(l.id)?.status === "completed").length,
    })),
  };
}

export async function getEnrolledSince(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("enrollments")
    .select("enrolled_at")
    .eq("user_id", userId)
    .order("enrolled_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data?.enrolled_at ?? null;
}

export async function getPromptsCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from("chat_messages")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("role", "user");
  if (error) throw error;
  return count ?? 0;
}

export interface DailyActivity {
  date: string; // YYYY-MM-DD
  count: number;
}

// Approximation de l'activité quotidienne à partir des événements réels
// existants (pas de table de log dédiée) : messages au copilote, tentatives
// de quiz, et débuts/fins de leçon.
export async function getRecentActivity(userId: string, days = 28): Promise<DailyActivity[]> {
  const since = new Date();
  since.setHours(0, 0, 0, 0);
  since.setDate(since.getDate() - (days - 1));
  const sinceIso = since.toISOString();

  const [{ data: chats }, { data: quizzes }, { data: progress }] = await Promise.all([
    supabase.from("chat_messages").select("created_at").eq("user_id", userId).gte("created_at", sinceIso),
    supabase.from("quiz_attempts").select("created_at").eq("user_id", userId).gte("created_at", sinceIso),
    supabase.from("lesson_progress").select("started_at, completed_at").eq("user_id", userId),
  ]);

  const counts = new Map<string, number>();
  const bump = (iso: string | null) => {
    if (!iso) return;
    const d = new Date(iso);
    if (d < since) return;
    const key = d.toISOString().slice(0, 10);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  };
  (chats ?? []).forEach((r) => bump(r.created_at));
  (quizzes ?? []).forEach((r) => bump(r.created_at));
  (progress ?? []).forEach((r) => { bump(r.started_at); bump(r.completed_at); });

  const result: DailyActivity[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(since);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    result.push({ date: key, count: counts.get(key) ?? 0 });
  }
  return result;
}

export function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.round((totalSeconds % 3600) / 60);
  if (hours === 0) return `${minutes}min`;
  return `${hours}h${String(minutes).padStart(2, "0")}`;
}
