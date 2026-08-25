// Proxy Gemini pour l'appli HTML personnalisée "pilotage-appel-d'offre" (embarquée dans
// l'onglet HTML d'une leçon via iframe sandboxée). L'appli tournant intégralement côté
// navigateur de l'élève, elle ne peut pas détenir la clé Gemini sans l'exposer à tous les
// élèves qui ouvrent la leçon — cette fonction garde donc la clé côté serveur et n'expose
// que les 5 actions dont l'appli a besoin (aucun accès Gemini générique).
import { createClient } from "npm:@supabase/supabase-js@2.48.1";
import { CORS_HEADERS, jsonResponse } from "../_shared/podcast-utils.ts";

const GEMINI_MODEL = "gemini-3.6-flash";

async function callGemini(geminiApiKey: string, contents: unknown, responseSchema?: unknown) {
  const resp = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
    {
      method: "POST",
      headers: { "x-goog-api-key": geminiApiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        contents,
        ...(responseSchema ? { generationConfig: { responseMimeType: "application/json", responseSchema } } : {}),
      }),
    },
  );
  if (!resp.ok) throw new Error(`Gemini a échoué : ${await resp.text()}`);
  const json = await resp.json();
  const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini n'a renvoyé aucune réponse.");
  return text as string;
}

function estimatedFutureDateString(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

async function handleDates(geminiApiKey: string, textContent: string) {
  const estimatedFutureDateString4w = estimatedFutureDateString(28);
  const prompt = `Analyze the following "Règlement de Consultation" (DCE) text to extract critical dates.
  Identify the final deadline for offer submission ("Date limite de remise des offres", "date de dépôt des candidatures", "date de clôture des offres"),
  any specific site visit dates ("visite de site", "date de visite obligatoire"),
  and any project launch meeting dates ("réunion de lancement", "date de réunion d'information").
  Return the dates in YYYY-MM-DD format.

  If a date is not explicitly found, return null for that field, except for 'submissionDeadline'.
  For 'submissionDeadline', if no date is found, provide an estimate of "${estimatedFutureDateString4w}" (today + 4 weeks) as a reasonable default.

  Text:
  """
  ${textContent}
  """`;
  try {
    const text = await callGemini(geminiApiKey, [{ role: "user", parts: [{ text: prompt }] }], {
      type: "OBJECT",
      properties: {
        submissionDeadline: { type: "STRING" },
        siteVisitDate: { type: "STRING" },
        launchMeetingDate: { type: "STRING" },
      },
      required: ["submissionDeadline"],
    });
    const parsed = JSON.parse(text);
    if (!parsed.submissionDeadline) parsed.submissionDeadline = estimatedFutureDateString4w;
    return parsed;
  } catch (err) {
    console.error("dates extraction failed, falling back:", err);
    return { submissionDeadline: estimatedFutureDateString4w, siteVisitDate: null, launchMeetingDate: null };
  }
}

async function handleSummary(geminiApiKey: string, textContent: string) {
  const prompt = `À partir du document d'appel d'offre suivant, extraire les informations clés pour une réunion de lancement :
  1. Les objectifs principaux de la collectivité/client.
  2. Les critères de notation pondérés (si spécifiés).
  3. Les contraintes de tracé ou techniques majeures (si mentionnées, ex: exigences spécifiques sur le parcours d'un réseau, matériaux).

  Retournez la réponse au format JSON strict. Chaque champ doit être un tableau de chaînes de caractères.

  Text:
  """
  ${textContent}
  """`;
  const text = await callGemini(geminiApiKey, [{ role: "user", parts: [{ text: prompt }] }], {
    type: "OBJECT",
    properties: {
      objectifsCollectivite: { type: "ARRAY", items: { type: "STRING" } },
      criteresNotationPonderes: { type: "ARRAY", items: { type: "STRING" } },
      contraintesTrace: { type: "ARRAY", items: { type: "STRING" } },
    },
    required: ["objectifsCollectivite", "criteresNotationPonderes", "contraintesTrace"],
  });
  return JSON.parse(text);
}

async function handleRisks(geminiApiKey: string, textContent: string) {
  const prompt = `À partir du projet de contrat (CCAP/CCTP) suivant, identifier les clauses à risque :
  1. Les clauses détaillant des pénalités (ex: retard, non-conformité).
  2. Les clauses relatives aux garanties de performance (ex: niveaux de service, efficacité).
  3. Toute autre clause significative présentant un risque ou étant particulièrement contraignante.

  Retournez la réponse au format JSON strict. Chaque champ doit être un tableau de chaînes de caractères.

  Text:
  """
  ${textContent}
  """`;
  const text = await callGemini(geminiApiKey, [{ role: "user", parts: [{ text: prompt }] }], {
    type: "OBJECT",
    properties: {
      clausesAPenalites: { type: "ARRAY", items: { type: "STRING" } },
      garantiesPerformance: { type: "ARRAY", items: { type: "STRING" } },
      autresRisques: { type: "ARRAY", items: { type: "STRING" } },
    },
    required: ["clausesAPenalites", "garantiesPerformance", "autresRisques"],
  });
  return JSON.parse(text);
}

async function handleScoring(geminiApiKey: string, textContent: string) {
  const prompt = `À partir du document d'appel d'offre suivant, extraire les critères de notation et pour chacun :
  - Le critère tel qu'il est formulé.
  - Ce que le client veut entendre (le "besoin caché" derrière ce critère).
  - Un "Killer Argument" (un argument clé ou un point de différenciation fort) à intégrer dans le mémoire pour ce critère.

  Retournez la réponse au format JSON strict, sous forme d'un tableau d'objets.

  Text:
  """
  ${textContent}
  """`;
  const text = await callGemini(geminiApiKey, [{ role: "user", parts: [{ text: prompt }] }], {
    type: "OBJECT",
    properties: {
      criteres: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            critere: { type: "STRING" },
            besoinCache: { type: "STRING" },
            killerArgument: { type: "STRING" },
          },
          required: ["critere", "besoinCache", "killerArgument"],
        },
      },
    },
    required: ["criteres"],
  });
  return JSON.parse(text);
}

async function handleChat(geminiApiKey: string, pdfContent: string, history: { role: "user" | "model"; text: string }[], message: string) {
  const systemInstruction = `Vous êtes un assistant expert en appels d'offre. Vous avez accès au contenu suivant extrait de documents d'appel d'offre :
  """
  ${pdfContent}
  """
  Répondez aux questions de l'utilisateur en vous basant *exclusivement* sur ce contenu. Si la réponse n'est pas dans le document, indiquez-le poliment.`;

  const contents = [
    { role: "user", parts: [{ text: systemInstruction }] },
    { role: "model", parts: [{ text: "Compris, je réponds uniquement à partir du contenu fourni." }] },
    ...history.map((m) => ({ role: m.role, parts: [{ text: m.text }] })),
    { role: "user", parts: [{ text: message }] },
  ];
  const text = await callGemini(geminiApiKey, contents);
  return { text };
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

    const body = await req.json();
    const { action } = body;

    switch (action) {
      case "dates":
        return jsonResponse(await handleDates(geminiApiKey, body.textContent ?? ""));
      case "summary":
        return jsonResponse(await handleSummary(geminiApiKey, body.textContent ?? ""));
      case "risks":
        return jsonResponse(await handleRisks(geminiApiKey, body.textContent ?? ""));
      case "scoring":
        return jsonResponse(await handleScoring(geminiApiKey, body.textContent ?? ""));
      case "chat":
        return jsonResponse(await handleChat(geminiApiKey, body.pdfContent ?? "", body.history ?? [], body.message ?? ""));
      default:
        return jsonResponse({ error: `Action inconnue : ${action}` }, 400);
    }
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : "Erreur inconnue." }, 500);
  }
});
