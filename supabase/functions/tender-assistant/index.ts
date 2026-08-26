// Proxy Gemini pour le mini-outil "Pilotage appel d'offre" (mini-site HTML
// embarqué dans la première leçon). La clé Gemini ne doit jamais atteindre le
// navigateur : tous les appels passent par ici, avec authentification requise
// pour empêcher un usage public de la clé partagée entre tous les élèves.
import { createClient } from "npm:@supabase/supabase-js@2.48.1";
import { CORS_HEADERS, jsonResponse } from "../_shared/podcast-utils.ts";

const GEMINI_TEXT_MODEL = "gemini-3.6-flash";

async function callGemini(geminiApiKey: string, body: Record<string, unknown>): Promise<string> {
  const resp = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_TEXT_MODEL}:generateContent`,
    { method: "POST", headers: { "x-goog-api-key": geminiApiKey, "Content-Type": "application/json" }, body: JSON.stringify(body) },
  );
  if (!resp.ok) throw new Error(`Gemini a échoué : ${await resp.text()}`);
  const json = await resp.json();
  const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini n'a renvoyé aucune réponse.");
  return text;
}

function extractDatesRequest(textContent: string) {
  const today = new Date();
  const estimatedFutureDate = new Date();
  estimatedFutureDate.setDate(today.getDate() + 28);
  const estimatedFutureDateString = estimatedFutureDate.toISOString().split("T")[0];

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

  return {
    contents: { parts: [{ text: prompt }] },
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "OBJECT",
        properties: {
          submissionDeadline: { type: "STRING", description: `The final deadline for offer submission in YYYY-MM-DD format. If not found, use "${estimatedFutureDateString}" as an estimate.` },
          siteVisitDate: { type: "STRING", description: "The date of the site visit, if mentioned, in YYYY-MM-DD format. Null if not found." },
          launchMeetingDate: { type: "STRING", description: "The date of the project launch meeting, if mentioned, in YYYY-MM-DD format. Null if not found." },
        },
        required: ["submissionDeadline"],
        propertyOrdering: ["submissionDeadline", "siteVisitDate", "launchMeetingDate"],
      },
    },
  };
}

function launchSummaryRequest(textContent: string) {
  const prompt = `À partir du document d'appel d'offre suivant, extraire les informations clés pour une réunion de lancement :
  1. Les objectifs principaux de la collectivité/client.
  2. Les critères de notation pondérés (si spécifiés).
  3. Les contraintes de tracé ou techniques majeures (si mentionnées, ex: exigences spécifiques sur le parcours d'un réseau, matériaux).

  Retournez la réponse au format JSON strict. Chaque champ doit être un tableau de chaînes de caractères.

  Text:
  """
  ${textContent}
  """`;

  return {
    contents: { parts: [{ text: prompt }] },
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "OBJECT",
        properties: {
          objectifsCollectivite: { type: "ARRAY", items: { type: "STRING" }, description: "Liste des objectifs principaux de la collectivité/client." },
          criteresNotationPonderes: { type: "ARRAY", items: { type: "STRING" }, description: "Liste des critères de notation et leur pondération." },
          contraintesTrace: { type: "ARRAY", items: { type: "STRING" }, description: "Liste des contraintes de tracé ou techniques." },
        },
        required: ["objectifsCollectivite", "criteresNotationPonderes", "contraintesTrace"],
      },
    },
  };
}

function riskReportRequest(textContent: string) {
  const prompt = `À partir du projet de contrat (CCAP/CCTP) suivant, identifier les clauses à risque :
  1. Les clauses détaillant des pénalités (ex: retard, non-conformité).
  2. Les clauses relatives aux garanties de performance (ex: niveaux de service, efficacité).
  3. Toute autre clause significative présentant un risque ou étant particulièrement contraignante.

  Retournez la réponse au format JSON strict. Chaque champ doit être un tableau de chaînes de caractères.

  Text:
  """
  ${textContent}
  """`;

  return {
    contents: { parts: [{ text: prompt }] },
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "OBJECT",
        properties: {
          clausesAPenalites: { type: "ARRAY", items: { type: "STRING" }, description: "Liste des clauses de pénalités." },
          garantiesPerformance: { type: "ARRAY", items: { type: "STRING" }, description: "Liste des clauses de garanties de performance." },
          autresRisques: { type: "ARRAY", items: { type: "STRING" }, description: "Liste des autres clauses à risque." },
        },
        required: ["clausesAPenalites", "garantiesPerformance", "autresRisques"],
      },
    },
  };
}

function scoringCriteriaRequest(textContent: string) {
  const prompt = `À partir du document d'appel d'offre suivant, extraire les critères de notation et pour chacun :
  - Le critère tel qu'il est formulé.
  - Ce que le client veut entendre (le "besoin caché" derrière ce critère).
  - Un "Killer Argument" (un argument clé ou un point de différenciation fort) à intégrer dans le mémoire pour ce critère.

  Retournez la réponse au format JSON strict, sous forme d'un tableau d'objets.

  Text:
  """
  ${textContent}
  """`;

  return {
    contents: { parts: [{ text: prompt }] },
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "OBJECT",
        properties: {
          criteres: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                critere: { type: "STRING", description: "Le libellé exact du critère de notation." },
                besoinCache: { type: "STRING", description: "Le besoin implicite du client pour ce critère." },
                killerArgument: { type: "STRING", description: "Un argument clé pour ce critère." },
              },
              required: ["critere", "besoinCache", "killerArgument"],
            },
            description: "Liste des critères de notation avec leurs analyses.",
          },
        },
        required: ["criteres"],
      },
    },
  };
}

function chatRequest(pdfContent: string, history: { role: "user" | "model"; text: string }[], message: string) {
  return {
    systemInstruction: {
      parts: [{
        text: `Vous êtes un assistant expert en appels d'offre. Vous avez accès au contenu suivant extrait de documents d'appel d'offre :
      """
      ${pdfContent}
      """
      Répondez aux questions de l'utilisateur en vous basant *exclusivement* sur ce contenu. Si la réponse n'est pas dans le document, indiquez-le poliment.`,
      }],
    },
    contents: [
      ...history.map((m) => ({ role: m.role, parts: [{ text: m.text }] })),
      { role: "user", parts: [{ text: message }] },
    ],
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });

  try {
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiApiKey) return jsonResponse({ error: "GEMINI_API_KEY non configurée côté serveur." }, 500);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return jsonResponse({ error: "Non authentifié." }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) return jsonResponse({ error: "Session invalide." }, 401);

    const payload = await req.json();
    const action = payload?.action;

    let geminiRequest: Record<string, unknown>;
    switch (action) {
      case "extractDates":
        geminiRequest = extractDatesRequest(String(payload.text ?? ""));
        break;
      case "launchSummary":
        geminiRequest = launchSummaryRequest(String(payload.text ?? ""));
        break;
      case "riskReport":
        geminiRequest = riskReportRequest(String(payload.text ?? ""));
        break;
      case "scoringCriteria":
        geminiRequest = scoringCriteriaRequest(String(payload.text ?? ""));
        break;
      case "chat":
        geminiRequest = chatRequest(String(payload.pdfContent ?? ""), Array.isArray(payload.history) ? payload.history : [], String(payload.message ?? ""));
        break;
      default:
        return jsonResponse({ error: "Action inconnue." }, 400);
    }

    const rawText = await callGemini(geminiApiKey, geminiRequest);

    if (action === "chat") return jsonResponse({ text: rawText });

    try {
      return jsonResponse({ result: JSON.parse(rawText) });
    } catch {
      return jsonResponse({ error: "Réponse Gemini invalide (JSON non parsable)." }, 502);
    }
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : "Erreur inconnue." }, 500);
  }
});
