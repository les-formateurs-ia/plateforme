// Import d'un programme de formation (PDF ou Word) dans un dossier : Claude,
// via Runware (textInference), relève ses rubriques dans un JSON que le
// navigateur fusionne dans la fiche programme (mergeImportedProgramme).
// Le document est lu dans le navigateur (mammoth pour Word, pdf.js pour le
// texte d'un PDF, pages en images pour un PDF scanné) : seule sa matière
// arrive ici.
//
// En deux temps, comme le chat du Studio : { action: "start" } soumet et
// renvoie le résultat s'il est déjà prêt, sinon un taskUUID que le
// navigateur relance par { action: "poll" } jusqu'à la réponse. Une lecture
// longue ne bute donc pas sur la durée max d'une fonction.
//
// Réservé à l'administrateur (création et dossiers des formations). Outil
// interne : le coût n'est pas imputé sur un budget IA d'élève.
import { createClient } from "npm:@supabase/supabase-js@2.48.1";
import { CORS_HEADERS, getCallerRole, jsonResponse } from "../_shared/podcast-utils.ts";
import { pollRunwareText, submitRunwareText } from "../_shared/runware.ts";
import { PROGRAMME_IMPORT_PROMPT } from "./prompt.ts";

// Même identifiant que le niveau « expert » de Battle Ground, testé de bout en bout.
const MODEL = "anthropic:claude@opus-5";
const MAX_TEXT = 80_000;
const MAX_IMAGES = 12;
const MAX_IMAGE_CHARS = 3_000_000;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });
  if (req.method !== "POST") return jsonResponse({ error: "Méthode non autorisée." }, 405);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return jsonResponse({ error: "Non authentifié." }, 401);
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) return jsonResponse({ error: "Session invalide." }, 401);
    if (await getCallerRole(supabase, userData.user.id) !== "admin") {
      return jsonResponse({ error: "Seul l'administrateur peut importer un programme." }, 403);
    }

    const runwareKey = Deno.env.get("RUNWARE_API_KEY");
    if (!runwareKey) return jsonResponse({ error: "RUNWARE_API_KEY non configurée côté serveur." }, 500);

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") return jsonResponse({ error: "Requête invalide." }, 400);

    if (body.action === "poll") {
      if (typeof body.taskUUID !== "string" || !/^[0-9a-f-]{36}$/i.test(body.taskUUID)) return jsonResponse({ error: "taskUUID invalide." }, 400);
      return jsonResponse(await pollRunwareText(runwareKey, body.taskUUID));
    }
    if (body.action !== "start") return jsonResponse({ error: "Action inconnue." }, 400);

    const fileName = typeof body.fileName === "string" ? body.fileName.slice(0, 200) : "programme";
    const text = typeof body.text === "string" ? body.text.trim() : "";
    const images = Array.isArray(body.images)
      ? body.images.filter((i: unknown): i is string => typeof i === "string" && i.startsWith("data:image/jpeg;base64,") && i.length <= MAX_IMAGE_CHARS)
      : [];
    if (!text && !images.length) return jsonResponse({ error: "Document vide : aucun texte n'a pu être lu." }, 400);
    if (text.length > MAX_TEXT) return jsonResponse({ error: "Document trop long pour un programme (80 000 caractères au plus)." }, 400);
    if (images.length > MAX_IMAGES) return jsonResponse({ error: `Document trop long : ${MAX_IMAGES} pages au plus pour un PDF scanné.` }, 400);

    const content = text
      ? `Programme à relever (fichier « ${fileName} ») :\n\n${text}`
      : `Programme à relever : les ${images.length} image(s) jointe(s) sont les pages, dans l'ordre, du fichier « ${fileName} ».`;
    try {
      const submitted = await submitRunwareText(runwareKey, {
        taskType: "textInference",
        model: MODEL,
        messages: [{ role: "user", content }],
        ...(images.length ? { inputs: { images } } : {}),
        // Un programme détaillé tient en 3 000 à 5 000 tokens de JSON ; même
        // plafond que le chat du Studio (Runware coupe à 4 096 sans valeur).
        settings: { systemPrompt: PROGRAMME_IMPORT_PROMPT, maxTokens: 8192 },
      });
      return jsonResponse(submitted);
    } catch (err) {
      return jsonResponse({ error: err instanceof Error ? err.message : "Runware a refusé la demande." }, 502);
    }
  } catch (err) {
    console.error("import-programme:", err);
    return jsonResponse({ error: err instanceof Error ? err.message : "Erreur inconnue." }, 500);
  }
});
