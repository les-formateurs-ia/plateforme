// Exercice "Exercices pour vous" (Pratique IA) — bac à sable HTML/JS, même
// fonctionnement que le Playground d'une leçon (voir platformHtml.ts), mais
// pas d'évaluation IA : juste un historique de ce que l'élève a collé,
// groupé en sessions/dossiers comme les deux autres exercices.
import { supabase } from "@/app/lib/supabase/client";

export interface HtmlExerciseAttempt {
  id: string;
  sessionId: string;
  attemptNumber: number;
  htmlContent: string;
  createdAt: string;
}

export interface HtmlExerciseSession {
  sessionId: string;
  ordinal: number;
  attemptCount: number;
  startedAt: string;
  lastAttemptAt: string;
  preview: string;
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

export async function listHtmlExerciseSessions(userId: string): Promise<HtmlExerciseSession[]> {
  const { data, error } = await supabase
    .from("html_exercise_attempts")
    .select("session_id, html_content, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  if (error) throw error;

  const bySession = new Map<string, { htmlContent: string; createdAt: string }[]>();
  for (const row of data ?? []) {
    const list = bySession.get(row.session_id) ?? [];
    list.push({ htmlContent: row.html_content, createdAt: row.created_at });
    bySession.set(row.session_id, list);
  }

  const sessions = Array.from(bySession.entries()).map(([sessionId, rows]) => ({
    sessionId,
    attemptCount: rows.length,
    startedAt: rows[0].createdAt,
    lastAttemptAt: rows[rows.length - 1].createdAt,
    preview: rows[0].htmlContent.replace(/\s+/g, " ").trim().slice(0, 90),
  }));
  sessions.sort((a, b) => a.startedAt.localeCompare(b.startedAt));
  const withOrdinal: HtmlExerciseSession[] = sessions.map((s, i) => ({ ...s, ordinal: i + 1 }));
  withOrdinal.sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  return withOrdinal;
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

export async function deleteHtmlExerciseSession(userId: string, sessionId: string): Promise<void> {
  const { error } = await supabase.from("html_exercise_attempts").delete().eq("user_id", userId).eq("session_id", sessionId);
  if (error) throw error;
}
