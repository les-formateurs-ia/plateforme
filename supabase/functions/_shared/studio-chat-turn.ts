// Types et finalisation d'un tour de chat du Studio, partagés par studio-chat
// (réponse immédiate : Gemini, ou Runware déjà prêt) et studio-chat-status
// (réponse Runware récupérée plus tard par polling).
import { recordAiUsage } from "./ai-budget.ts";
import type { ChatProvider } from "./studio-chat-models.ts";

// Délai max d'attente d'une réponse (GPT/Claude via Runware).
export const CHAT_REPLY_TIMEOUT_MS = 10 * 60 * 1000;

export type AttachmentKind = "image" | "pdf" | "text" | "docx";

export interface Attachment {
  path: string;
  name: string;
  mimeType: string;
  size: number;
  kind: AttachmentKind;
  extractedText?: string;
  // Produits par le navigateur (src/app/lib/chatDocumentConversion.ts) :
  // pages JPEG d'un PDF (ChatGPT seulement) et HTML d'un .docx (tous).
  pagePaths?: string[];
  textPath?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  model?: string;
  attachments?: Attachment[];
}

// Garder synchronisé avec ChatTraceStep dans src/app/lib/studioChat.ts.
export interface TraceFile {
  name: string;
  kind: AttachmentKind;
  // natif = fichier lu directement par le modèle ; texte_extrait = PDF lu via sa
  // retranscription Gemini ; cache = retranscription faite lors d'un tour précédent ;
  // pages_images = PDF rendu en JPEG par le navigateur ; texte_converti = .docx → HTML.
  mode: "natif" | "texte" | "texte_extrait" | "texte_converti" | "pages_images" | "cache";
}

export interface TraceStep {
  task: "extraction_pdf" | "reponse";
  provider: ChatProvider;
  model: string;
  via: "google" | "runware";
  files: TraceFile[];
  note?: string;
}

// Contenu de studio_chat_conversations.pending_task.
export interface PendingTask {
  taskUUID: string;
  model: string;
  // Historique complet à enregistrer une fois la réponse arrivée (message
  // élève compris, retranscriptions PDF mises en cache).
  messages: ChatMessage[];
  steps: TraceStep[];
  startedAt: string;
}

export const CONVERSATION_COLUMNS = "id, provider, model, title, messages, pending_task, created_at, updated_at";

// Enregistre la réponse, la trace admin et le coût. Avec `taskUUID`, ne
// finalise que si cette tâche est toujours celle en attente (deux polls
// concurrents ne doivent pas ajouter la réponse deux fois) : renvoie alors
// null si un autre appel l'a déjà fait.
// deno-lint-ignore no-explicit-any
export async function completeTurn(supabase: any, params: {
  conversationId: string;
  userId: string;
  provider: ChatProvider;
  model: string;
  messages: ChatMessage[];
  reply: string;
  cost: number | undefined;
  steps: TraceStep[];
  taskUUID?: string;
}) {
  const assistantMessage: ChatMessage = { id: crypto.randomUUID(), role: "assistant", content: params.reply, createdAt: new Date().toISOString(), model: params.model };
  let query = supabase.from("studio_chat_conversations")
    .update({ messages: [...params.messages, assistantMessage], model: params.model, pending_task: null, updated_at: new Date().toISOString() })
    .eq("id", params.conversationId);
  if (params.taskUUID) query = query.eq("pending_task->>taskUUID", params.taskUUID);
  const { data, error } = await query.select(CONVERSATION_COLUMNS).maybeSingle();
  if (error) throw new Error(`Échec de l'enregistrement : ${error.message}`);
  if (!data) return null;

  if (params.provider !== "gemini") {
    await recordAiUsage(supabase, { userId: params.userId, mediaType: "text", model: params.model, cost: params.cost, source: "studio_chat" });
  }
  // Best effort : la réponse est déjà enregistrée, une trace manquante ne doit pas la faire échouer.
  const { error: traceErr } = await supabase.from("studio_chat_traces").insert({ conversation_id: params.conversationId, message_id: assistantMessage.id, user_id: params.userId, steps: params.steps });
  if (traceErr) console.error("studio_chat_traces insert failed:", traceErr.message);
  return data;
}

// Abandonne la réponse en attente. Une conversation encore vide (échec dès
// le premier message) est supprimée plutôt que laissée vide dans l'historique.
// deno-lint-ignore no-explicit-any
export async function abandonPendingTurn(supabase: any, conversationId: string, taskUUID: string): Promise<void> {
  const { data } = await supabase.from("studio_chat_conversations")
    .update({ pending_task: null })
    .eq("id", conversationId)
    .eq("pending_task->>taskUUID", taskUUID)
    .select("messages")
    .maybeSingle();
  if (data && Array.isArray(data.messages) && data.messages.length === 0) {
    await supabase.from("studio_chat_conversations").delete().eq("id", conversationId);
  }
}
