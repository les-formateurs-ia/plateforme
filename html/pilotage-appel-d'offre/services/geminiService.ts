
import { GoogleGenAI, Type, Chat, GenerateContentResponse } from '@google/genai';
import { GEMINI_MODEL } from '../constants';
import { GeminiDateExtractionResponse, LaunchSummaryReport, RiskReport, ScoringCriteriaReport, ChatMessage } from '../types';

export const getGeminiInstance = () => {
  if (!process.env.API_KEY) {
    throw new Error('API_KEY environment variable is not set. Please ensure it is configured.');
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

/**
 * Extracts key dates from the provided text content using the Gemini API.
 * The prompt asks Gemini to identify the submission deadline, site visit date, and launch meeting date
 * from the tender document text. It includes a structured response schema for reliable parsing.
 * If the API call fails or a date is not found, it provides sensible fallback estimations.
 * @param textContent The full text extracted from the PDF.
 * @returns A promise that resolves with GeminiDateExtractionResponse containing key dates.
 */
export const extractDatesFromDCE = async (textContent: string): Promise<GeminiDateExtractionResponse> => {
  const ai = getGeminiInstance();
  const today = new Date();
  const estimatedFutureDate = new Date();
  estimatedFutureDate.setDate(today.getDate() + 28); // 4 weeks from today for estimation
  const todayString = today.toISOString().split('T')[0];
  const estimatedFutureDateString = estimatedFutureDate.toISOString().split('T')[0];

  const prompt = `Analyze the following "Règlement de Consultation" (DCE) text to extract critical dates.
  Identify the final deadline for offer submission ("Date limite de remise des offres", "date de dépôt des candidatures", "date de clôture des offres"),
  any specific site visit dates ("visite de site", "date de visite obligatoire"),
  and any project launch meeting dates ("réunion de lancement", "date de réunion d'information").
  Return the dates in YYYY-MM-DD format.

  If a date is not explicitly found, return null for that field, except for 'submissionDeadline'.
  For 'submissionDeadline', if no date is found, provide an estimate of "${estimatedFutureDateString}" (today + 4 weeks) as a reasonable default.

  Text:
  """
  ${textContent}
  """`;

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: { parts: [{ text: prompt }] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            submissionDeadline: {
              type: Type.STRING,
              description: `The final deadline for offer submission in YYYY-MM-DD format. If not found, use "${estimatedFutureDateString}" as an estimate.`,
            },
            siteVisitDate: {
              type: Type.STRING,
              description: 'The date of the site visit, if mentioned, in YYYY-MM-DD format. Null if not found.',
            },
            launchMeetingDate: {
              type: Type.STRING,
              description: 'The date of the project launch meeting, if mentioned, in YYYY-MM-DD format. Null if not found.',
            },
          },
          required: ["submissionDeadline"], // Ensure submissionDeadline is always present
          propertyOrdering: ["submissionDeadline", "siteVisitDate", "launchMeetingDate"],
        },
      },
    });

    const jsonStr = response.text.trim();
    const parsedResponse: GeminiDateExtractionResponse = JSON.parse(jsonStr);

    // Final check for submissionDeadline in case Gemini returns null despite instructions
    if (!parsedResponse.submissionDeadline) {
      parsedResponse.submissionDeadline = estimatedFutureDateString;
    }

    return parsedResponse;

  } catch (error: unknown) {
    console.error('Error calling Gemini API for date extraction:', error);
    // Fallback to estimated dates if API call fails
    return {
      submissionDeadline: estimatedFutureDateString,
      siteVisitDate: null,
      launchMeetingDate: null,
    };
  }
};

/**
 * Creates a new chat session with the Gemini model, initialized with the provided PDF content.
 * @param pdfContent The combined text content from all uploaded PDFs.
 * @returns A promise that resolves with a Chat instance.
 */
export const createChatSession = async (pdfContent: string): Promise<Chat> => {
  const ai = getGeminiInstance();
  return ai.chats.create({
    model: GEMINI_MODEL,
    config: {
      systemInstruction: `Vous êtes un assistant expert en appels d'offre. Vous avez accès au contenu suivant extrait de documents d'appel d'offre :
      """
      ${pdfContent}
      """
      Répondez aux questions de l'utilisateur en vous basant *exclusivement* sur ce contenu. Si la réponse n'est pas dans le document, indiquez-le poliment.`,
    },
  });
};

/**
 * Sends a message to an existing chat session and returns a streaming response.
 * @param chat The Chat instance.
 * @param message The user's message.
 * @returns An async iterator for streaming content.
 */
export const sendMessageToChat = async (chat: Chat, message: string) => {
  return chat.sendMessageStream({ message: message });
};

/**
 * Generates a launch summary report from the provided text content.
 * @param textContent The full text extracted from the PDF.
 * @returns A promise that resolves with a LaunchSummaryReport.
 */
export const generateLaunchSummary = async (textContent: string): Promise<LaunchSummaryReport> => {
  const ai = getGeminiInstance();
  const prompt = `À partir du document d'appel d'offre suivant, extraire les informations clés pour une réunion de lancement :
  1. Les objectifs principaux de la collectivité/client.
  2. Les critères de notation pondérés (si spécifiés).
  3. Les contraintes de tracé ou techniques majeures (si mentionnées, ex: exigences spécifiques sur le parcours d'un réseau, matériaux).

  Retournez la réponse au format JSON strict. Chaque champ doit être un tableau de chaînes de caractères.

  Text:
  """
  ${textContent}
  """`;

  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: { parts: [{ text: prompt }] },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          objectifsCollectivite: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Liste des objectifs principaux de la collectivité/client.',
          },
          criteresNotationPonderes: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Liste des critères de notation et leur pondération.',
          },
          contraintesTrace: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Liste des contraintes de tracé ou techniques.',
          },
        },
        required: ["objectifsCollectivite", "criteresNotationPonderes", "contraintesTrace"],
      },
    },
  });
  const jsonStr = response.text.trim();
  return JSON.parse(jsonStr);
};

/**
 * Generates a risk report from the provided text content, focusing on penalties and performance guarantees.
 * @param textContent The full text extracted from the PDF.
 * @returns A promise that resolves with a RiskReport.
 */
export const generateRiskReport = async (textContent: string): Promise<RiskReport> => {
  const ai = getGeminiInstance();
  const prompt = `À partir du projet de contrat (CCAP/CCTP) suivant, identifier les clauses à risque :
  1. Les clauses détaillant des pénalités (ex: retard, non-conformité).
  2. Les clauses relatives aux garanties de performance (ex: niveaux de service, efficacité).
  3. Toute autre clause significative présentant un risque ou étant particulièrement contraignante.

  Retournez la réponse au format JSON strict. Chaque champ doit être un tableau de chaînes de caractères.

  Text:
  """
  ${textContent}
  """`;

  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: { parts: [{ text: prompt }] },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          clausesAPenalites: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Liste des clauses de pénalités.',
          },
          garantiesPerformance: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Liste des clauses de garanties de performance.',
          },
          autresRisques: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Liste des autres clauses à risque.',
          },
        },
        required: ["clausesAPenalites", "garantiesPerformance", "autresRisques"],
      },
    },
  });
  const jsonStr = response.text.trim();
  return JSON.parse(jsonStr);
};

/**
 * Extracts scoring criteria with hidden needs and killer arguments from the provided text content.
 * @param textContent The full text extracted from the PDF.
 * @returns A promise that resolves with a ScoringCriteriaReport.
 */
export const generateScoringCriteriaReport = async (textContent: string): Promise<ScoringCriteriaReport> => {
  const ai = getGeminiInstance();
  const prompt = `À partir du document d'appel d'offre suivant, extraire les critères de notation et pour chacun :
  - Le critère tel qu'il est formulé.
  - Ce que le client veut entendre (le "besoin caché" derrière ce critère).
  - Un "Killer Argument" (un argument clé ou un point de différenciation fort) à intégrer dans le mémoire pour ce critère.

  Retournez la réponse au format JSON strict, sous forme d'un tableau d'objets.

  Text:
  """
  ${textContent}
  """`;

  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: { parts: [{ text: prompt }] },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          criteres: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                critere: { type: Type.STRING, description: 'Le libellé exact du critère de notation.' },
                besoinCache: { type: Type.STRING, description: 'Le besoin implicite du client pour ce critère.' },
                killerArgument: { type: Type.STRING, description: 'Un argument clé pour ce critère.' },
              },
              required: ["critere", "besoinCache", "killerArgument"],
            },
            description: 'Liste des critères de notation avec leurs analyses.',
          },
        },
        required: ["criteres"],
      },
    },
  });
  const jsonStr = response.text.trim();
  return JSON.parse(jsonStr);
};
