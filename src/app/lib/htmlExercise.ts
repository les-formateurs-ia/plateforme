// Exercice "Exercices pour vous" (Pratique IA) — bac à sable HTML/JS, même
// fonctionnement que le Playground d'une leçon (voir platformHtml.ts), mais
// pas d'évaluation IA : juste un historique de ce que l'élève a collé pour un
// exercice défini par admin/formateur (voir lib/htmlExercises.ts côté admin),
// groupé en dossiers via exercise_sessions (voir exerciseSessions.ts).
import { supabase } from "@/app/lib/supabase/client";
import type { ExerciseVisibility } from "@/app/lib/supabase/database.types";
import { listExerciseTagsForExercises, type ExerciseTag } from "@/app/lib/exerciseTags";

export interface HtmlExerciseAttempt {
  id: string;
  sessionId: string;
  attemptNumber: number;
  htmlContent: string;
  createdAt: string;
}

interface Row {
  id: string;
  session_id: string;
  attempt_number: number;
  html_content: string;
  created_at: string;
}

function mapRow(row: Row): HtmlExerciseAttempt {
  return {
    id: row.id,
    sessionId: row.session_id,
    attemptNumber: row.attempt_number,
    htmlContent: row.html_content,
    createdAt: row.created_at,
  };
}

export async function listHtmlExerciseAttempts(userId: string, sessionId: string): Promise<HtmlExerciseAttempt[]> {
  const { data, error } = await supabase
    .from("html_exercise_attempts")
    .select("id, session_id, attempt_number, html_content, created_at")
    .eq("user_id", userId)
    .eq("session_id", sessionId)
    .order("attempt_number", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(mapRow);
}

export async function saveHtmlExerciseAttempt(userId: string, sessionId: string, htmlContent: string): Promise<HtmlExerciseAttempt> {
  const { data: last } = await supabase
    .from("html_exercise_attempts")
    .select("attempt_number")
    .eq("session_id", sessionId)
    .order("attempt_number", { ascending: false })
    .limit(1);
  const attemptNumber = (last?.[0]?.attempt_number ?? 0) + 1;

  const { data, error } = await supabase
    .from("html_exercise_attempts")
    .insert({ user_id: userId, session_id: sessionId, attempt_number: attemptNumber, html_content: htmlContent })
    .select()
    .single();
  if (error) throw error;
  return mapRow(data);
}

export interface VisibleHtmlExercise {
  exerciseId: string;
  // null = l'élève n'a pas encore ouvert cet exercice (pas de tentative).
  sessionId: string | null;
  name: string;
  description: string | null;
  htmlContent: string;
  visibility: ExerciseVisibility;
  attemptCount: number;
  lastAttemptAt: string | null;
  // HTML de la dernière tentative, pour un aperçu miniature en vrai rendu.
  previewHtml: string;
  tags: ExerciseTag[];
}

// Liste les exercices visibles par l'élève (globaux + privés qui lui sont
// assignés — filtré côté base par RLS sur html_exercises), avec son propre
// état d'avancement s'il a déjà commencé. `visibility` permet à la page de
// séparer "tes exercices personnalisés" (private) des exercices communs
// (global) plutôt que de tout mélanger.
export async function listVisibleHtmlExercises(userId: string): Promise<VisibleHtmlExercise[]> {
  const { data: exercises, error } = await supabase
    .from("html_exercises")
    .select("id, name, description, html_content, visibility, created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  if (!exercises?.length) return [];

  const { data: sessions, error: sessionsError } = await supabase
    .from("exercise_sessions")
    .select("id, exercise_id")
    .eq("user_id", userId)
    .eq("exercise_type", "html")
    .not("exercise_id", "is", null);
  if (sessionsError) throw sessionsError;

  const sessionByExercise = new Map<string, string>();
  for (const s of sessions ?? []) if (s.exercise_id) sessionByExercise.set(s.exercise_id, s.id);
  const sessionIds = (sessions ?? []).map((s) => s.id);

  const { data: attempts, error: attemptsError } = sessionIds.length
    ? await supabase
        .from("html_exercise_attempts")
        .select("session_id, html_content, created_at")
        .eq("user_id", userId)
        .in("session_id", sessionIds)
        .order("created_at", { ascending: true })
    : { data: [] as { session_id: string; html_content: string; created_at: string }[], error: null };
  if (attemptsError) throw attemptsError;

  const bySession = new Map<string, { htmlContent: string; createdAt: string }[]>();
  for (const row of attempts ?? []) {
    const list = bySession.get(row.session_id) ?? [];
    list.push({ htmlContent: row.html_content, createdAt: row.created_at });
    bySession.set(row.session_id, list);
  }

  const tagsByExercise = await listExerciseTagsForExercises(exercises.map((e) => e.id));

  return exercises.map((ex) => {
    const sessionId = sessionByExercise.get(ex.id) ?? null;
    const rows = sessionId ? (bySession.get(sessionId) ?? []) : [];
    return {
      exerciseId: ex.id,
      sessionId,
      name: ex.name,
      description: ex.description,
      htmlContent: ex.html_content,
      visibility: ex.visibility,
      attemptCount: rows.length,
      lastAttemptAt: rows.length ? rows[rows.length - 1].createdAt : null,
      previewHtml: rows.length ? rows[rows.length - 1].htmlContent : ex.html_content,
      tags: tagsByExercise.get(ex.id) ?? [],
    };
  });
}

// Récupère (ou crée) le dossier de travail de l'élève pour un exercice donné
// — même idée que ensureLessonStarted dans lib/learning.ts.
export async function ensureHtmlExerciseSession(userId: string, exerciseId: string): Promise<string> {
  const { data: existing, error: existingError } = await supabase
    .from("exercise_sessions")
    .select("id")
    .eq("user_id", userId)
    .eq("exercise_id", exerciseId)
    .maybeSingle();
  if (existingError) throw existingError;
  if (existing) return existing.id;

  const { data, error } = await supabase
    .from("exercise_sessions")
    .insert({ user_id: userId, exercise_type: "html", exercise_id: exerciseId })
    .select("id")
    .single();
  if (error || !data) throw error ?? new Error("Erreur inconnue");
  return data.id;
}

export interface HtmlExerciseBrief {
  exerciseId: string;
  name: string;
  description: string | null;
  htmlContent: string;
}

// Consigne de l'exercice lié à un dossier de travail, pour l'afficher en
// en-tête de HtmlExercisePage (null pour un dossier orphelin, ex. un ancien
// dossier self-créé avant l'introduction du système de curation).
export async function getExerciseBriefForSession(sessionId: string): Promise<HtmlExerciseBrief | null> {
  const { data: session, error } = await supabase.from("exercise_sessions").select("exercise_id").eq("id", sessionId).maybeSingle();
  if (error) throw error;
  if (!session?.exercise_id) return null;
  const { data: exercise, error: exerciseError } = await supabase
    .from("html_exercises")
    .select("id, name, description, html_content")
    .eq("id", session.exercise_id)
    .maybeSingle();
  if (exerciseError) throw exerciseError;
  return exercise
    ? { exerciseId: exercise.id, name: exercise.name, description: exercise.description, htmlContent: exercise.html_content }
    : null;
}
