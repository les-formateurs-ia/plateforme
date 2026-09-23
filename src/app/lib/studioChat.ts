// Modules "Discutez avec ChatGPT / Gemini / Claude" (Le Studio). Voir
// supabase/functions/studio-chat — Gemini en direct, GPT/Claude via Runware
// (mêmes clés que Battle Ground).
//
// IMPORTANT : CHAT_PROVIDERS[*].models doit rester synchronisé avec
// supabase/functions/_shared/studio-chat-models.ts.
import { supabase } from "@/app/lib/supabase/client";
import logoChatGPT from "@/imports/chatgpt_logo.png";
import logoGemini from "@/imports/gemini_logo.png";
import logoClaude from "@/imports/claude_logo.png";

export type ChatProvider = "openai" | "gemini" | "anthropic";

export interface ChatProviderConfig {
  id: ChatProvider;
  slug: string;
  name: string;
  company: string;
  accent: string;
  gradient: string;
  logo: string;
  // Les PNG ont beaucoup de marge blanche (et pas la même) : zoom pour que le logo remplisse l'avatar.
  logoZoom: string;
  defaultModel: string;
  models: { id: string; label: string }[];
}

export const CHAT_PROVIDERS: Record<ChatProvider, ChatProviderConfig> = {
  openai: {
    id: "openai",
    slug: "chatgpt",
    name: "ChatGPT",
    company: "OpenAI",
    accent: "#10A37F",
    gradient: "#10A37F",
    logo: logoChatGPT,
    logoZoom: "auto 175%",
    defaultModel: "openai:gpt@5.5",
    models: [
      { id: "openai:gpt@5.5", label: "GPT-5.5" },
      { id: "openai:gpt@5.4", label: "GPT-5.4" },
      { id: "openai:gpt@5.4-pro", label: "GPT-5.4 Pro (raisonnement, plus lent)" },
      { id: "openai:gpt@5.4-mini", label: "GPT-5.4 Mini (rapide)" },
    ],
  },
  gemini: {
    id: "gemini",
    slug: "gemini",
    name: "Gemini",
    company: "Google",
    accent: "#4285F4",
    gradient: "linear-gradient(135deg,#4285F4 0%,#9B72CB 55%,#D96570 100%)",
    logo: logoGemini,
    logoZoom: "auto 130%",
    defaultModel: "gemini-3.8-flash",
    models: [
      { id: "gemini-3.8-flash", label: "Gemini 3.8 Flash" },
      { id: "gemini-3.6-flash", label: "Gemini 3.6 Flash" },
      { id: "gemini-3.1-pro-preview", label: "Gemini 3.1 Pro (preview)" },
      { id: "gemini-3.5-flash-lite", label: "Gemini 3.5 Flash-Lite (rapide)" },
    ],
  },
  anthropic: {
    id: "anthropic",
    slug: "claude",
    name: "Claude",
    company: "Anthropic",
    accent: "#D97757",
    gradient: "#D97757",
    logo: logoClaude,
    logoZoom: "auto 155%",
    defaultModel: "anthropic:claude@opus-5",
    models: [
      { id: "anthropic:claude@fable-5", label: "Claude Fable 5" },
      { id: "anthropic:claude@opus-5", label: "Claude Opus 5" },
      { id: "anthropic:claude@sonnet-4.6", label: "Claude Sonnet 4.6" },
      { id: "anthropic:claude@haiku-4.5", label: "Claude Haiku 4.5 (rapide)" },
    ],
  },
};

export const CHAT_MESSAGE_MAX_LENGTH = 20000;
export const CHAT_MAX_FILES = 3;
export const CHAT_MAX_FILE_BYTES = 10 * 1024 * 1024;
export const CHAT_FILE_ACCEPT = "image/png,image/jpeg,image/webp,image/gif,application/pdf,.txt,.md,.csv,.json,.html,.htm,.xml,.yaml,.yml,.js,.ts,.tsx,.jsx,.py,.sql,.css,.log";

export interface ChatAttachment {
  path: string;
  name: string;
  mimeType: string;
  size: number;
  kind?: "image" | "pdf" | "text";
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  model?: string;
  attachments?: ChatAttachment[];
}

export interface ChatConversation {
  id: string;
  provider: ChatProvider;
  model: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

interface Row {
  id: string;
  provider: ChatProvider;
  model: string;
  title: string;
  messages: ChatMessage[];
  created_at: string;
  updated_at: string;
}

function mapRow(row: Row): ChatConversation {
  return { id: row.id, provider: row.provider, model: row.model, title: row.title, messages: row.messages ?? [], createdAt: row.created_at, updatedAt: row.updated_at };
}

export function modelLabel(provider: ChatProvider, model: string): string {
  return CHAT_PROVIDERS[provider].models.find((m) => m.id === model)?.label ?? model;
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

// Certains navigateurs laissent file.type vide pour .md/.csv/.py etc. — le
// serveur classe alors le fichier par extension.
export async function uploadChatAttachment(userId: string, file: File): Promise<ChatAttachment> {
  const safeName = file.name.normalize("NFD").replace(/[^\w.-]+/g, "_").slice(-100);
  const path = `${userId}/${crypto.randomUUID()}-${safeName}`;
  const { error } = await supabase.storage.from("studio-chat").upload(path, file, { contentType: file.type || "text/plain" });
  if (error) throw new Error(`Envoi de "${file.name}" impossible : ${error.message}`);
  return { path, name: file.name, mimeType: file.type || "text/plain", size: file.size };
}

export async function sendChatMessage(params: {
  conversationId: string | null;
  provider: ChatProvider;
  model: string;
  message: string;
  attachments: ChatAttachment[];
}): Promise<ChatConversation> {
  const { data, error } = await supabase.functions.invoke("studio-chat", { body: params });
  if (error) throw new Error(await extractFunctionError(error));
  if (data?.error) throw new Error(data.error);
  if (!data?.conversation) throw new Error("Réponse inattendue du serveur.");
  return mapRow(data.conversation);
}

export async function listMyChatConversations(userId: string, provider: ChatProvider): Promise<ChatConversation[]> {
  const { data, error } = await supabase
    .from("studio_chat_conversations")
    .select("id, provider, model, title, messages, created_at, updated_at")
    .eq("user_id", userId)
    .eq("provider", provider)
    .order("updated_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data ?? []).map((row) => mapRow(row as unknown as Row));
}

// Garder synchronisé avec TraceStep dans supabase/functions/studio-chat/index.ts.
export interface ChatTraceStep {
  task: "extraction_pdf" | "reponse";
  provider: ChatProvider;
  model: string;
  via: "google" | "runware";
  files: { name: string; kind: "image" | "pdf" | "text"; mode: "natif" | "texte" | "texte_extrait" | "cache" | "non_transmis" }[];
  note?: string;
}

// Lisible par l'admin uniquement (RLS) — renvoie {} pour tout autre rôle.
export async function getChatTraces(conversationId: string): Promise<Record<string, ChatTraceStep[]>> {
  const { data, error } = await supabase
    .from("studio_chat_traces")
    .select("message_id, steps")
    .eq("conversation_id", conversationId);
  if (error) throw error;
  return Object.fromEntries((data ?? []).map((row) => [row.message_id, row.steps as ChatTraceStep[]]));
}

export async function deleteChatConversation(conversation: ChatConversation): Promise<void> {
  const paths = conversation.messages.flatMap((m) => (m.attachments ?? []).map((a) => a.path));
  const { error } = await supabase.from("studio_chat_conversations").delete().eq("id", conversation.id);
  if (error) throw error;
  if (paths.length) await supabase.storage.from("studio-chat").remove(paths);
}
