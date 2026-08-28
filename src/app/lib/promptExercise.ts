// Exercice "Exercices prompts" (Pratique IA) — voir supabase/functions/evaluate-prompt-exercise.
// Les tentatives sont groupées en dossiers via exercise_sessions (voir
// exerciseSessions.ts) — ce module ne gère que les tentatives elles-mêmes et
// la fusion avec les métadonnées de dossier pour le listing.
import { supabase } from "@/app/lib/supabase/client";
import { listExerciseSessions } from "@/app/lib/exerciseSessions";

export interface PromptCorrection { excerpt: string; suggestion: string; explanation: string }
export interface PromptMissingItem { title: string; explanation: string }

export interface PromptExerciseAttempt {
  id: string;
  sessionId: string;
  attemptNumber: number;
  promptText: string;
  score: number;
  corrections: PromptCorrection[];
  missing: PromptMissingItem[];
  verdict: string;
  createdAt: string;
}

export interface PromptExerciseSession {
  sessionId: string;
  ordinal: number;
  name: string | null;
  attemptCount: number;
  createdAt: string;
  lastAttemptAt: string | null;
  lastScore: number | null;
  preview: string | null;
}

function mapRow(row: {
  id: string;
  session_id: string;
  attempt_number: number;
  prompt_text: string;
  score: number;
  feedback: Record<string, unknown>;
  created_at: string;
}): PromptExerciseAttempt {
  const feedback = row.feedback ?? {};
  return {
    id: row.id,
    sessionId: row.session_id,
    attemptNumber: row.attempt_number,
    promptText: row.prompt_text,
    score: row.score,
    corrections: (feedback.corrections as PromptCorrection[]) ?? [],
    missing: (feedback.missing as PromptMissingItem[]) ?? [],
    verdict: (feedback.verdict as string) ?? "",
    createdAt: row.created_at,
  };
}

export async function listPromptExerciseAttempts(userId: string, sessionId: string): Promise<PromptExerciseAttempt[]> {
  const { data, error } = await supabase
    .from("prompt_exercise_attempts")
    .select("id, session_id, attempt_number, prompt_text, score, feedback, created_at")
    .eq("user_id", userId)
    .eq("session_id", sessionId)
    .order("attempt_number", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(mapRow);
}

export async function listPromptExerciseSessions(userId: string): Promise<PromptExerciseSession[]> {
  const [sessions, attemptsResp] = await Promise.all([
    listExerciseSessions(userId, "prompt"),
    supabase.from("prompt_exercise_attempts").select("session_id, prompt_text, score, created_at").eq("user_id", userId).order("created_at", { ascending: true }),
  ]);
  if (attemptsResp.error) throw attemptsResp.error;

  const bySession = new Map<string, { promptText: string; score: number; createdAt: string }[]>();
  for (const row of attemptsResp.data ?? []) {
    const list = bySession.get(row.session_id) ?? [];
    list.push({ promptText: row.prompt_text, score: row.score, createdAt: row.created_at });
    bySession.set(row.session_id, list);
  }

  const withOrdinal: PromptExerciseSession[] = sessions.map((s, i) => {
    const rows = bySession.get(s.id) ?? [];
    return {
      sessionId: s.id,
      ordinal: i + 1,
      name: s.name,
      attemptCount: rows.length,
      createdAt: s.createdAt,
      lastAttemptAt: rows.length ? rows[rows.length - 1].createdAt : null,
      lastScore: rows.length ? rows[rows.length - 1].score : null,
      preview: rows.length ? rows[0].promptText.slice(0, 90) : null,
    };
  });
  withOrdinal.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return withOrdinal;
}

async function extractFunctionError(error: { message: string; context?: Response }): Promise<string> {
  let message = error.message;
  if (error.context) {
    try {
      const body = await error.context.clone().json();
      if (body?.error) message = body.error;
    } catch {
      // corps non-JSON, on garde le message par défaut
    }
  }
  return message;
}

export async function submitPromptExercise(promptText: string, sessionId: string): Promise<PromptExerciseAttempt> {
  const { data, error } = await supabase.functions.invoke("evaluate-prompt-exercise", { body: { promptText, sessionId } });
  if (error) throw new Error(await extractFunctionError(error));
  if (data?.error) throw new Error(data.error);
  if (!data?.attempt) throw new Error("Réponse inattendue du serveur.");
  return mapRow(data.attempt);
}
