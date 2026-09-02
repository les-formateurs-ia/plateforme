// Agent IA unifié par élève : conversations continues (texte + vocal),
// groupées par formation ("projet", formationInstanceId nullable = discussion
// générale) — remplace le copilote scopé par leçon (chat.ts/chat_messages).
import { supabase } from "@/app/lib/supabase/client";

export interface AgentConversation {
  id: string;
  formationInstanceId: string | null;
  title: string | null;
  createdAt: string;
  lastMessageAt: string;
}

export interface AgentMessageRow {
  id: string;
  role: "user" | "ai";
  content: string;
  modality: "text" | "voice";
  isOffTopic: boolean;
  createdAt: string;
}

function mapConversation(r: { id: string; formation_instance_id: string | null; title: string | null; created_at: string; last_message_at: string }): AgentConversation {
  return { id: r.id, formationInstanceId: r.formation_instance_id, title: r.title, createdAt: r.created_at, lastMessageAt: r.last_message_at };
}

export async function listAgentConversations(userId: string): Promise<AgentConversation[]> {
  const { data, error } = await supabase
    .from("agent_conversations")
    .select("id, formation_instance_id, title, created_at, last_message_at")
    .eq("user_id", userId)
    .order("last_message_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapConversation);
}

// La dernière conversation d'un élève pour une formation donnée (ou générale
// si formationInstanceId est null) — utilisée par LessonPage pour retrouver
// le fil "rapide" du cours plutôt que d'en ouvrir un nouveau à chaque visite.
export async function findLatestConversationForInstance(userId: string, formationInstanceId: string | null): Promise<AgentConversation | null> {
  let query = supabase
    .from("agent_conversations")
    .select("id, formation_instance_id, title, created_at, last_message_at")
    .eq("user_id", userId)
    .order("last_message_at", { ascending: false })
    .limit(1);
  query = formationInstanceId ? query.eq("formation_instance_id", formationInstanceId) : query.is("formation_instance_id", null);
  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  return data ? mapConversation(data) : null;
}

export async function getAgentMessages(conversationId: string): Promise<AgentMessageRow[]> {
  const { data, error } = await supabase
    .from("agent_messages")
    .select("id, role, content, modality, is_off_topic, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((r) => ({ id: r.id, role: r.role, content: r.content, modality: r.modality, isOffTopic: r.is_off_topic, createdAt: r.created_at }));
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

// Envoie un message texte : crée la conversation au premier message si
// conversationId est null (rattachée à formationInstanceId, ou générale).
export async function sendAgentMessage(
  conversationId: string | null,
  formationInstanceId: string | null,
  message: string,
): Promise<{ conversationId: string; reply: string; offTopic: boolean }> {
  const { data, error } = await supabase.functions.invoke("agent-chat", {
    body: { conversationId, formationInstanceId, message },
  });
  if (error) throw new Error(await extractFunctionError(error));
  if (data?.error) throw new Error(data.error);
  return { conversationId: data.conversationId, reply: data.reply, offTopic: !!data.offTopic };
}

// Trouve ou crée la conversation d'un projet (ou générale) sans envoyer de
// message — utilisée avant de démarrer une session vocale, pour que les
// transcripts aient un conversation_id dès le premier tour de parole.
export async function ensureConversation(userId: string, formationInstanceId: string | null): Promise<AgentConversation> {
  const existing = await findLatestConversationForInstance(userId, formationInstanceId);
  if (existing) return existing;
  const { data, error } = await supabase
    .from("agent_conversations")
    .insert({ user_id: userId, formation_instance_id: formationInstanceId })
    .select("id, formation_instance_id, title, created_at, last_message_at")
    .single();
  if (error) throw error;
  return mapConversation(data);
}

// Persiste un tour de parole vocal (transcript Gemini Live) — l'agent vocal
// n'écrit rien lui-même côté serveur, cf. src/app/lib/geminiVoice.ts.
export async function insertAgentVoiceMessage(conversationId: string, role: "user" | "ai", content: string): Promise<void> {
  const { error } = await supabase
    .from("agent_messages")
    .insert({ conversation_id: conversationId, role, content, modality: "voice" });
  if (error) throw error;
}
