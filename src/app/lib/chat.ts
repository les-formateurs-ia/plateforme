// Copilote IA de la leçon (Gemini, restreint au sujet du cours + métier de l'élève).
import { supabase } from "@/app/lib/supabase/client";

export interface ChatMessageRow {
  role: "user" | "ai";
  content: string;
  isOffTopic: boolean;
  createdAt: string;
}

export async function getChatHistory(userId: string, lessonId: string): Promise<ChatMessageRow[]> {
  const { data, error } = await supabase
    .from("chat_messages")
    .select("role, content, is_off_topic, created_at")
    .eq("user_id", userId)
    .eq("lesson_id", lessonId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((r) => ({ role: r.role, content: r.content, isOffTopic: r.is_off_topic, createdAt: r.created_at }));
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

export async function sendLessonChatMessage(lessonId: string, message: string): Promise<{ reply: string; offTopic: boolean }> {
  const { data, error } = await supabase.functions.invoke("lesson-chat", { body: { lessonId, message } });
  if (error) throw new Error(await extractFunctionError(error));
  if (data?.error) throw new Error(data.error);
  return { reply: data.reply, offTopic: !!data.offTopic };
}
