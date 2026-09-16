// Client Runware partagé — remplace l'intégration Higgsfield pour Le Studio
// (images/vidéos) et l'atelier Rétro-ingénierie (Exercez-vous 2). Une seule
// API REST (`POST https://api.runware.ai/v1`, corps = tableau de tâches),
// contrairement à Higgsfield qui avait un chemin par modèle.
//
// Constat vérifié en direct le 2026-09-12 avec la clé de production : seuls
// les modèles natifs Runware (préfixe "runware:", famille FLUX, self-hosted)
// répondent sans solde crédité. Tout modèle tiers (Google, OpenAI, Ideogram)
// et TOUTE génération vidéo (quel que soit le modèle) renvoient
// thirdPartyInsufficientCredits / videoInferenceInsufficientCredits tant que
// le compte Runware n'a pas de carte enregistrée + solde ≥5$
// (https://my.runware.ai/wallet). Le code vidéo est donc écrit et branché,
// mais restera en erreur (message clair renvoyé à l'élève) jusqu'à ce que
// le compte soit crédité — pas de flag artificiel, l'erreur Runware parle
// d'elle-même une fois affichée côté client.
import { recordAiUsage } from "./ai-budget.ts";

export const RUNWARE_BASE_URL = "https://api.runware.ai/v1";

interface RunwareResultItem {
  taskUUID: string;
  taskType: string;
  imageURL?: string;
  videoURL?: string;
  audioURL?: string;
  text?: string;
  cost?: number;
}

interface RunwareErrorItem {
  code: string;
  message: string;
}

type SubmitResult =
  | { status: "ready"; url: string; cost?: number }
  | { status: "pending"; taskUUID: string };

type PollResult =
  | { status: "pending" }
  | { status: "ready"; url: string; cost?: number }
  | { status: "failed"; error: string };

const ERROR_MESSAGES: Record<string, string> = {
  invalidApiKey: "Clé API Runware invalide ou manquante côté serveur.",
  timeoutProvider: "Le fournisseur a mis trop de temps à répondre, réessaie.",
  providerRateLimitExceeded: "Quota Runware atteint, réessaie dans un instant.",
  thirdPartyInsufficientCredits: "Ce modèle nécessite un solde Runware crédité (compte non alimenté) — https://my.runware.ai/wallet.",
  videoInferenceInsufficientCredits: "La génération vidéo nécessite un solde Runware crédité — https://my.runware.ai/wallet.",
};

export function formatRunwareError(errors: RunwareErrorItem[]): string {
  const first = errors[0];
  if (!first) return "Erreur Runware inconnue.";
  return ERROR_MESSAGES[first.code] ?? first.message ?? "Erreur Runware inconnue.";
}

async function callRunware(apiKey: string, tasks: Record<string, unknown>[]): Promise<{ data: RunwareResultItem[]; errors: RunwareErrorItem[] }> {
  // includeCost: true fait revenir un champ `cost` (USD) par tâche dans la
  // réponse — appliqué ici uniformément (soumission ET polling getResponse)
  // plutôt que dans chacun des ~44 builders de modèles, cf. _shared/ai-budget.ts.
  const resp = await fetch(RUNWARE_BASE_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(tasks.map((t) => ({ ...t, includeCost: true }))),
  });
  const text = await resp.text();
  let json: { data?: RunwareResultItem[]; errors?: RunwareErrorItem[] };
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`Réponse Runware invalide (HTTP ${resp.status}) : ${text.slice(0, 300)}`);
  }
  return { data: json.data ?? [], errors: json.errors ?? [] };
}

// Soumet une tâche (imageInference/videoInference). Certains modèles
// répondent dans la foulée (data[0].imageURL/videoURL déjà présent) —
// d'autres restent "en cours" et doivent être interrogés via getResponse.
export async function submitRunwareTask(apiKey: string, task: Record<string, unknown>): Promise<SubmitResult> {
  const taskUUID = (task.taskUUID as string | undefined) ?? crypto.randomUUID();
  const { data, errors } = await callRunware(apiKey, [{ ...task, taskUUID }]);
  if (errors.length) throw new Error(formatRunwareError(errors));
  const result = data[0];
  const url = result?.imageURL ?? result?.videoURL ?? result?.audioURL;
  if (url) return { status: "ready", url, cost: result?.cost };
  return { status: "pending", taskUUID };
}

// Un seul appel getResponse — utilisé par check-studio-*-status, rappelé
// périodiquement par le client (même contrat que l'ancien polling Higgsfield).
export async function pollRunwareTask(apiKey: string, taskUUID: string): Promise<PollResult> {
  const { data, errors } = await callRunware(apiKey, [{ taskType: "getResponse", taskUUID }]);
  if (errors.length) return { status: "failed", error: formatRunwareError(errors) };
  const result = data[0];
  const url = result?.imageURL ?? result?.videoURL ?? result?.audioURL;
  if (url) return { status: "ready", url, cost: result?.cost };
  return { status: "pending" };
}

// Soumet puis attend la fin dans la même invocation (backoff 1.5s → 8s,
// budget ~45s) — pour un usage synchrone comme Rétro-ingénierie, qui ne fait
// pas de polling côté client.
export async function submitAndAwaitRunware(apiKey: string, task: Record<string, unknown>, { timeoutMs = 45000 }: { timeoutMs?: number } = {}): Promise<{ url: string; cost?: number }> {
  const submitted = await submitRunwareTask(apiKey, task);
  if (submitted.status === "ready") return { url: submitted.url, cost: submitted.cost };

  const deadline = Date.now() + timeoutMs;
  let delay = 1500;
  while (Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, delay));
    const polled = await pollRunwareTask(apiKey, submitted.taskUUID);
    if (polled.status === "ready") return { url: polled.url, cost: polled.cost };
    if (polled.status === "failed") throw new Error(polled.error);
    delay = Math.min(delay * 1.5, 8000);
  }
  throw new Error("La génération Runware prend plus de temps que prévu — réessaie dans quelques instants.");
}

// Génération de texte (taskType "textInference") — utilisé par Battle Ground
// pour router GPT/Claude via Runware plutôt que d'exiger des clés OpenAI/
// Anthropic séparées (le compte Runware crédité couvre déjà ces modèles
// tiers). deliveryMethod "async" impose le même cycle soumission+polling
// que l'image/vidéo ; la réponse texte arrive dans le champ `text`, pas
// une URL.
export async function submitAndAwaitRunwareText(apiKey: string, task: Record<string, unknown>, { timeoutMs = 45000 }: { timeoutMs?: number } = {}): Promise<{ text: string; cost?: number }> {
  const taskUUID = (task.taskUUID as string | undefined) ?? crypto.randomUUID();
  const { data, errors } = await callRunware(apiKey, [{ deliveryMethod: "async", ...task, taskUUID }]);
  if (errors.length) throw new Error(formatRunwareError(errors));
  const immediate = data[0]?.text;
  if (immediate) return { text: immediate, cost: data[0]?.cost };

  const deadline = Date.now() + timeoutMs;
  let delay = 1500;
  while (Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, delay));
    const { data: pollData, errors: pollErrors } = await callRunware(apiKey, [{ taskType: "getResponse", taskUUID }]);
    if (pollErrors.length) throw new Error(formatRunwareError(pollErrors));
    const text = pollData[0]?.text;
    if (text) return { text, cost: pollData[0]?.cost };
    delay = Math.min(delay * 1.5, 8000);
  }
  throw new Error("La génération de texte Runware prend plus de temps que prévu.");
}

// Télécharge un résultat Runware et l'upload tel quel dans le bucket/chemin
// donné, sans mettre à jour de ligne ni de statut — utilisé par le module
// musique (generate-studio-music / check-studio-music-status), qui gère deux
// actifs indépendants (audio + pochette) par ligne et ne peut donc pas
// réutiliser finalizeRunwareResult ci-dessous (pensé pour un seul actif par
// ligne, qui marque directement la ligne "ready").
// deno-lint-ignore no-explicit-any
export async function uploadRunwareAsset(userClient: any, { bucket, path, url }: { bucket: string; path: string; url: string }): Promise<
  { path: string } | { error: string }
> {
  try {
    const { bytes, contentType } = await downloadBytes(url);
    const { error } = await userClient.storage.from(bucket).upload(path, bytes, { contentType, upsert: true });
    if (error) throw new Error(error.message);
    return { path };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Erreur de téléchargement du média Runware." };
  }
}

export async function downloadBytes(url: string): Promise<{ bytes: Uint8Array; contentType: string }> {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error("Téléchargement du média Runware échoué.");
  const contentType = resp.headers.get("content-type") || "application/octet-stream";
  const bytes = new Uint8Array(await resp.arrayBuffer());
  return { bytes, contentType };
}

// Télécharge le résultat Runware, l'upload dans le bucket Supabase de
// destination, et marque la ligne "ready" (ou "failed" si une étape échoue)
// — factorisé car identique pour image/vidéo, génération immédiate ou pollée.
// `usage` trace le coût réel (cf. migration 0071_ai_usage_budget.sql) : best
// effort, un échec d'insert ne fait pas échouer la réponse déjà livrée à l'élève.
// deno-lint-ignore no-explicit-any
export async function finalizeRunwareResult(userClient: any, {
  bucket, pathPrefix, url, table, rowId, kind, usage,
}: {
  bucket: string; pathPrefix: string; url: string; table: string; rowId: string; kind: "image" | "video";
  usage: { userId: string; mediaType: "image" | "video"; model: string; cost: number | undefined; source: "studio_image" | "studio_video" };
}): Promise<
  { ok: true; path: string } | { ok: false; error: string }
> {
  try {
    const { bytes, contentType } = await downloadBytes(url);
    // Recraft V4 Pro Vector renvoie du SVG (pas du PNG/JPG) — cf. studio-models.ts.
    const ext = kind === "video" ? "mp4" : contentType.includes("svg") ? "svg" : contentType.includes("png") ? "png" : "jpg";
    const finalPath = `${pathPrefix}.${ext}`;
    const { error: uploadError } = await userClient.storage.from(bucket).upload(finalPath, bytes, { contentType, upsert: true });
    if (uploadError) throw new Error(uploadError.message);
    const pathColumn = kind === "video" ? "video_path" : "image_path";
    await userClient.from(table).update({ status: "ready", [pathColumn]: finalPath, completed_at: new Date().toISOString() }).eq("id", rowId);
    await recordAiUsage(userClient, usage);
    return { ok: true, path: finalPath };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur de finalisation.";
    await userClient.from(table).update({ status: "failed", error_message: message }).eq("id", rowId);
    return { ok: false, error: message };
  }
}
