
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../constants';
import { GeminiDateExtractionResponse, LaunchSummaryReport, RiskReport, ScoringCriteriaReport, TenderChatSession } from '../types';

// Ce mini-site tourne dans un iframe du même domaine que la plateforme, qui a
// déjà son propre client Supabase connecté. On ne crée surtout PAS de second
// client ici : supabase-js instancie un GoTrueClient complet (rafraîchissement
// automatique du jeton, écoute des événements `storage` pour la synchronisation
// multi-onglets) qui partagerait la même clé de stockage que celui du parent —
// deux clients actifs sur la même origine finissent par interférer et
// provoquent un rechargement intempestif de l'état d'auth du parent (la page
// se réinitialise juste après l'ouverture de l'onglet Html). On se contente
// donc de lire le jeton déjà écrit en localStorage par le client du parent,
// sans provoquer aucun effet de bord.
function getAccessToken(): string | null {
  try {
    const projectRef = new URL(SUPABASE_URL).hostname.split('.')[0];
    const raw = localStorage.getItem(`sb-${projectRef}-auth-token`);
    if (!raw) return null;
    return JSON.parse(raw)?.access_token ?? null;
  } catch {
    return null;
  }
}

async function callTenderAssistant<T>(action: string, payload: Record<string, unknown>): Promise<T> {
  const accessToken = getAccessToken();
  if (!accessToken) {
    throw new Error("Vous devez être connecté à la plateforme pour utiliser cette fonctionnalité.");
  }

  const response = await fetch(`${SUPABASE_URL}/functions/v1/tender-assistant`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ action, ...payload }),
  });

  const json = await response.json().catch(() => ({}));
  if (!response.ok || json?.error) {
    throw new Error(json?.error || `Erreur serveur (${response.status})`);
  }
  return json as T;
}

/**
 * Extracts key dates from the provided text content via le proxy Gemini côté serveur.
 * If the call fails or a date is not found, it provides sensible fallback estimations.
 * @param textContent The full text extracted from the PDF.
 * @returns A promise that resolves with GeminiDateExtractionResponse containing key dates.
 */
export const extractDatesFromDCE = async (textContent: string): Promise<GeminiDateExtractionResponse> => {
  const today = new Date();
  const estimatedFutureDate = new Date();
  estimatedFutureDate.setDate(today.getDate() + 28); // 4 weeks from today for estimation
  const estimatedFutureDateString = estimatedFutureDate.toISOString().split('T')[0];

  try {
    const { result } = await callTenderAssistant<{ result: GeminiDateExtractionResponse }>('extractDates', { text: textContent });
    if (!result.submissionDeadline) {
      result.submissionDeadline = estimatedFutureDateString;
    }
    return result;
  } catch (error: unknown) {
    console.error('Error calling tender-assistant for date extraction:', error);
    return {
      submissionDeadline: estimatedFutureDateString,
      siteVisitDate: null,
      launchMeetingDate: null,
    };
  }
};

/**
 * Creates a new chat session state, initialized with the provided PDF content.
 * The system instruction is applied server-side on every turn by the proxy.
 * @param pdfContent The combined text content from all uploaded PDFs.
 * @returns A promise that resolves with a TenderChatSession instance.
 */
export const createChatSession = async (pdfContent: string): Promise<TenderChatSession> => {
  return { pdfContent, history: [] };
};

/**
 * Sends a message to an existing chat session via le proxy et retourne la réponse complète.
 * @param session The TenderChatSession instance.
 * @param message The user's message.
 * @returns The model's full text response.
 */
export const sendMessageToChat = async (session: TenderChatSession, message: string): Promise<string> => {
  const { text } = await callTenderAssistant<{ text: string }>('chat', {
    pdfContent: session.pdfContent,
    history: session.history,
    message,
  });
  session.history.push({ role: 'user', text: message });
  session.history.push({ role: 'model', text });
  return text;
};

/**
 * Generates a launch summary report from the provided text content.
 * @param textContent The full text extracted from the PDF.
 * @returns A promise that resolves with a LaunchSummaryReport.
 */
export const generateLaunchSummary = async (textContent: string): Promise<LaunchSummaryReport> => {
  const { result } = await callTenderAssistant<{ result: LaunchSummaryReport }>('launchSummary', { text: textContent });
  return result;
};

/**
 * Generates a risk report from the provided text content, focusing on penalties and performance guarantees.
 * @param textContent The full text extracted from the PDF.
 * @returns A promise that resolves with a RiskReport.
 */
export const generateRiskReport = async (textContent: string): Promise<RiskReport> => {
  const { result } = await callTenderAssistant<{ result: RiskReport }>('riskReport', { text: textContent });
  return result;
};

/**
 * Extracts scoring criteria with hidden needs and killer arguments from the provided text content.
 * @param textContent The full text extracted from the PDF.
 * @returns A promise that resolves with a ScoringCriteriaReport.
 */
export const generateScoringCriteriaReport = async (textContent: string): Promise<ScoringCriteriaReport> => {
  const { result } = await callTenderAssistant<{ result: ScoringCriteriaReport }>('scoringCriteria', { text: textContent });
  return result;
};
