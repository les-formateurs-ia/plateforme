// Atelier "Rétro-ingénierie" — le système génère une image cible, l'élève
// tente de la reproduire avec son propre prompt. Voir
// supabase/functions/generate-reverse-prompt-target et
// generate-reverse-prompt-attempt.
import { supabase } from "@/app/lib/supabase/client";

export type ReversePromptStatus = "generating" | "ready" | "failed";

export interface ReversePromptSession {
  id: string;
  status: ReversePromptStatus;
  targetImageUrl: string | null;
  error: string | null;
  createdAt: string;
}

export interface ReversePromptAttempt {
  id: string;
  sessionId: string;
  attemptNumber: number;
  promptText: string;
  status: ReversePromptStatus;
  imageUrl: string | null;
  error: string | null;
  createdAt: string;
}

interface SessionRow {
  id: string;
  status: ReversePromptStatus;
  target_image_path: string | null;
  error: string | null;
  created_at: string;
}

interface AttemptRow {
  id: string;
  session_id: string;
  attempt_number: number;
  prompt_text: string;
  status: ReversePromptStatus;
  generated_image_path: string | null;
  error: string | null;
  created_at: string;
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

async function toSignedUrl(path: string | null): Promise<string | null> {
  if (!path) return null;
  const { data } = await supabase.storage.from("reverse-prompt-images").createSignedUrl(path, 3600);
  return data?.signedUrl ?? null;
}

async function mapSessionRow(row: SessionRow): Promise<ReversePromptSession> {
  return {
    id: row.id,
    status: row.status,
    targetImageUrl: row.status === "ready" ? await toSignedUrl(row.target_image_path) : null,
    error: row.error,
    createdAt: row.created_at,
  };
}

async function mapAttemptRow(row: AttemptRow): Promise<ReversePromptAttempt> {
  return {
    id: row.id,
    sessionId: row.session_id,
    attemptNumber: row.attempt_number,
    promptText: row.prompt_text,
    status: row.status,
    imageUrl: row.status === "ready" ? await toSignedUrl(row.generated_image_path) : null,
    error: row.error,
    createdAt: row.created_at,
  };
}

export async function startReversePromptSession(): Promise<ReversePromptSession> {
  const { data, error } = await supabase.functions.invoke("generate-reverse-prompt-target", { body: {} });
  if (error) throw new Error(await extractFunctionError(error));
  if (data?.error) throw new Error(data.error);
  if (!data?.sessionId) throw new Error("Réponse inattendue du serveur.");
  return { id: data.sessionId, status: "ready", targetImageUrl: data.targetImageUrl ?? null, error: null, createdAt: new Date().toISOString() };
}

export async function submitReversePromptAttempt(sessionId: string, promptText: string): Promise<ReversePromptAttempt> {
  const { data, error } = await supabase.functions.invoke("generate-reverse-prompt-attempt", { body: { sessionId, promptText } });
  if (error) throw new Error(await extractFunctionError(error));
  if (data?.error) throw new Error(data.error);
  if (!data?.attemptId) throw new Error("Réponse inattendue du serveur.");
  return {
    id: data.attemptId,
    sessionId,
    attemptNumber: data.attemptNumber,
    promptText,
    status: "ready",
    imageUrl: data.imageUrl ?? null,
    error: null,
    createdAt: new Date().toISOString(),
  };
}

export async function listReversePromptAttempts(sessionId: string): Promise<ReversePromptAttempt[]> {
  const { data, error } = await supabase
    .from("reverse_prompt_attempts")
    .select("id, session_id, attempt_number, prompt_text, status, generated_image_path, error, created_at")
    .eq("session_id", sessionId)
    .order("attempt_number", { ascending: true });
  if (error) throw error;
  return Promise.all((data ?? []).map((row) => mapAttemptRow(row as AttemptRow)));
}
