// Exercice "Génération images & vidéos" (Pratique IA) — voir
// supabase/functions/evaluate-media-exercise et check-media-exercise-status.
// Même principe de sessions/dossiers que promptExercise.ts, mais chaque
// tentative génère un média (jamais de texte) de façon asynchrone : on
// re-signe les URLs à chaque lecture (elles expirent) et on poll le statut
// tant qu'il vaut "generating" (surtout pertinent pour la vidéo, Veo pouvant
// prendre plusieurs minutes).
import { supabase } from "@/app/lib/supabase/client";

export type MediaMode = "image" | "video";
export type MediaAttemptStatus = "generating" | "ready" | "failed";

export interface MediaCorrection { excerpt: string; suggestion: string; explanation: string }
export interface MediaMissingItem { title: string; explanation: string }

export interface MediaExerciseAttempt {
  id: string;
  sessionId: string;
  attemptNumber: number;
  mode: MediaMode;
  promptText: string;
  correctedPromptText: string;
  score: number;
  corrections: MediaCorrection[];
  missing: MediaMissingItem[];
  verdict: string;
  status: MediaAttemptStatus;
  error: string | null;
  originalMediaPath: string | null;
  correctedMediaPath: string | null;
  originalUrl: string | null;
  correctedUrl: string | null;
  createdAt: string;
}

export interface MediaExerciseSession {
  sessionId: string;
  ordinal: number;
  mode: MediaMode;
  attemptCount: number;
  startedAt: string;
  lastAttemptAt: string;
  lastScore: number;
  preview: string;
}

interface Row {
  id: string;
  session_id: string;
  attempt_number: number;
  mode: MediaMode;
  prompt_text: string;
  corrected_prompt_text: string;
  score: number;
  feedback: Record<string, unknown>;
  status: MediaAttemptStatus;
  error: string | null;
  original_media_path: string | null;
  corrected_media_path: string | null;
  created_at: string;
}

async function toSignedUrl(path: string | null): Promise<string | null> {
  if (!path) return null;
  const { data } = await supabase.storage.from("media-exercise-outputs").createSignedUrl(path, 3600);
  return data?.signedUrl ?? null;
}

async function mapRow(row: Row): Promise<MediaExerciseAttempt> {
  const feedback = row.feedback ?? {};
  const [originalUrl, correctedUrl] = row.status === "ready"
    ? await Promise.all([toSignedUrl(row.original_media_path), toSignedUrl(row.corrected_media_path)])
    : [null, null];
  return {
    id: row.id,
    sessionId: row.session_id,
    attemptNumber: row.attempt_number,
    mode: row.mode,
    promptText: row.prompt_text,
    correctedPromptText: row.corrected_prompt_text,
    score: row.score,
    corrections: (feedback.corrections as MediaCorrection[]) ?? [],
    missing: (feedback.missing as MediaMissingItem[]) ?? [],
    verdict: (feedback.verdict as string) ?? "",
    status: row.status,
    error: row.error,
    originalMediaPath: row.original_media_path,
    correctedMediaPath: row.corrected_media_path,
    originalUrl,
    correctedUrl,
    createdAt: row.created_at,
  };
}

export async function listMediaExerciseAttempts(userId: string, sessionId: string): Promise<MediaExerciseAttempt[]> {
  const { data, error } = await supabase
    .from("media_exercise_attempts")
    .select("id, session_id, attempt_number, mode, prompt_text, corrected_prompt_text, score, feedback, status, error, original_media_path, corrected_media_path, created_at")
    .eq("user_id", userId)
    .eq("session_id", sessionId)
    .order("attempt_number", { ascending: true });
  if (error) throw error;
  return Promise.all((data ?? []).map(mapRow));
}

export async function listMediaExerciseSessions(userId: string): Promise<MediaExerciseSession[]> {
  const { data, error } = await supabase
    .from("media_exercise_attempts")
    .select("session_id, mode, prompt_text, score, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  if (error) throw error;

  const bySession = new Map<string, { mode: MediaMode; promptText: string; score: number; createdAt: string }[]>();
  for (const row of data ?? []) {
    const list = bySession.get(row.session_id) ?? [];
    list.push({ mode: row.mode, promptText: row.prompt_text, score: row.score, createdAt: row.created_at });
    bySession.set(row.session_id, list);
  }

  const sessions = Array.from(bySession.entries()).map(([sessionId, rows]) => ({
    sessionId,
    mode: rows[rows.length - 1].mode,
    attemptCount: rows.length,
    startedAt: rows[0].createdAt,
    lastAttemptAt: rows[rows.length - 1].createdAt,
    lastScore: rows[rows.length - 1].score,
    preview: rows[0].promptText.slice(0, 90),
  }));
  sessions.sort((a, b) => a.startedAt.localeCompare(b.startedAt));
  const withOrdinal: MediaExerciseSession[] = sessions.map((s, i) => ({ ...s, ordinal: i + 1 }));
  withOrdinal.sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  return withOrdinal;
}

export async function deleteMediaExerciseSession(userId: string, sessionId: string): Promise<void> {
  const { data: rows } = await supabase
    .from("media_exercise_attempts")
    .select("original_media_path, corrected_media_path")
    .eq("user_id", userId)
    .eq("session_id", sessionId);
  const paths = (rows ?? []).flatMap((r) => [r.original_media_path, r.corrected_media_path]).filter((p): p is string => !!p);
  if (paths.length > 0) await supabase.storage.from("media-exercise-outputs").remove(paths);

  const { error } = await supabase.from("media_exercise_attempts").delete().eq("user_id", userId).eq("session_id", sessionId);
  if (error) throw error;
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

export async function submitMediaExercise(promptText: string, sessionId: string, mode: MediaMode): Promise<MediaExerciseAttempt> {
  const { data, error } = await supabase.functions.invoke("evaluate-media-exercise", { body: { promptText, sessionId, mode } });
  if (error) throw new Error(await extractFunctionError(error));
  if (data?.error) throw new Error(data.error);
  if (!data?.attempt) throw new Error("Réponse inattendue du serveur.");
  return mapRow(data.attempt);
}

// Rappelle check-media-exercise-status jusqu'à ce que la génération aboutisse
// ou échoue. La vidéo pouvant prendre plusieurs minutes, on espace les appels
// et on prévoit un timeout généreux plutôt que de bloquer indéfiniment.
export async function pollMediaExerciseAttempt(
  attemptId: string,
  { intervalMs = 6000, timeoutMs = 480000 }: { intervalMs?: number; timeoutMs?: number } = {},
): Promise<MediaExerciseAttempt> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const { data, error } = await supabase.functions.invoke("check-media-exercise-status", { body: { attemptId } });
    if (error) throw new Error(await extractFunctionError(error));
    if (data?.error) throw new Error(data.error);
    const row = data.attempt as Row;
    if (row.status !== "generating") {
      const feedback = row.feedback ?? {};
      return {
        id: row.id, sessionId: row.session_id, attemptNumber: row.attempt_number, mode: row.mode,
        promptText: row.prompt_text, correctedPromptText: row.corrected_prompt_text, score: row.score,
        corrections: (feedback.corrections as MediaCorrection[]) ?? [], missing: (feedback.missing as MediaMissingItem[]) ?? [],
        verdict: (feedback.verdict as string) ?? "", status: row.status, error: row.error,
        originalMediaPath: row.original_media_path, correctedMediaPath: row.corrected_media_path,
        originalUrl: data.originalUrl ?? null, correctedUrl: data.correctedUrl ?? null, createdAt: row.created_at,
      };
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  throw new Error("La génération prend plus de temps que prévu — réessaie dans quelques minutes.");
}
