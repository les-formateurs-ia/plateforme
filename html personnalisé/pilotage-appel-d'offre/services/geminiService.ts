import { GeminiDateExtractionResponse, LaunchSummaryReport, RiskReport, ScoringCriteriaReport } from '../types';

// Cette appli tourne dans une iframe sandboxée embarquée sur la plateforme (onglet HTML
// d'une leçon) : elle n'a donc pas accès à une clé Gemini côté client (ce serait visible
// dans le code source par tous les élèves). La plateforme injecte à la place, via
// `window.__PLATFORM_AUTH__`, l'URL Supabase / clé anonyme / jeton de session de l'élève
// connecté, et tous les appels IA passent par la edge function `tender-assistant-gemini`
// qui garde la vraie clé Gemini côté serveur.
declare global {
  interface Window {
    __PLATFORM_AUTH__?: { supabaseUrl: string; supabaseAnonKey: string; accessToken: string };
  }
}

interface ChatHistoryEntry {
  role: 'user' | 'model';
  text: string;
}

export interface ChatSession {
  pdfContent: string;
  history: ChatHistoryEntry[];
}

async function callProxy<T>(action: string, payload: Record<string, unknown>): Promise<T> {
  const auth = window.__PLATFORM_AUTH__;
  if (!auth) {
    throw new Error("Session plateforme introuvable — recharge la page depuis la leçon pour reconnecter les fonctions IA.");
  }
  const resp = await fetch(`${auth.supabaseUrl}/functions/v1/tender-assistant-gemini`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${auth.accessToken}`,
      'apikey': auth.supabaseAnonKey,
    },
    body: JSON.stringify({ action, ...payload }),
  });
  const data = await resp.json().catch(() => null);
  if (!resp.ok || data?.error) {
    throw new Error(data?.error || `Erreur serveur (${resp.status})`);
  }
  return data as T;
}

/**
 * Extracts key dates from the provided text content via the platform's Gemini proxy.
 * Falls back to sensible estimated dates server-side if the call fails.
 */
export const extractDatesFromDCE = async (textContent: string): Promise<GeminiDateExtractionResponse> => {
  return callProxy<GeminiDateExtractionResponse>('dates', { textContent });
};

/**
 * Creates a new chat session, initialized with the provided PDF content.
 * History is kept client-side and resent with each message (no server persistence).
 */
export const createChatSession = async (pdfContent: string): Promise<ChatSession> => {
  return { pdfContent, history: [] };
};

/**
 * Sends a message to an existing chat session. Yields a single chunk (non-streaming)
 * to stay compatible with the existing `for await` consumer in Chatbot.tsx.
 */
export const sendMessageToChat = async function* (chat: ChatSession, message: string): AsyncGenerator<{ text: string }> {
  const { text } = await callProxy<{ text: string }>('chat', { pdfContent: chat.pdfContent, history: chat.history, message });
  chat.history.push({ role: 'user', text: message });
  chat.history.push({ role: 'model', text });
  yield { text };
};

/**
 * Generates a launch summary report from the provided text content.
 */
export const generateLaunchSummary = async (textContent: string): Promise<LaunchSummaryReport> => {
  return callProxy<LaunchSummaryReport>('summary', { textContent });
};

/**
 * Generates a risk report from the provided text content.
 */
export const generateRiskReport = async (textContent: string): Promise<RiskReport> => {
  return callProxy<RiskReport>('risks', { textContent });
};

/**
 * Extracts scoring criteria with hidden needs and killer arguments from the provided text content.
 */
export const generateScoringCriteriaReport = async (textContent: string): Promise<ScoringCriteriaReport> => {
  return callProxy<ScoringCriteriaReport>('scoring', { textContent });
};
