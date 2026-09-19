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

// Timeout par défaut sur l'appel HTTP Runware lui-même (pas le workflow
// complet de génération) : sans lui, un fetch() qui ne reçoit jamais de
// réponse (stall réseau côté Runware ou entre les deux) bloque la promesse
// indéfiniment — le client (supabase.functions.invoke) n'a pas de timeout
// par défaut non plus, donc l'UI reste bloquée sur "en cours" pour toujours
// au lieu d'afficher une erreur avec bouton "Réessayer". Cas constaté le
// 2026-09-16 sur le module musique (generate-studio-music), qui enchaîne un
// appel Gemini + 2 soumissions Runware dans la même requête initiale — plus
// de surface pour un stall que les modules image/vidéo (qui ne font qu'une
// soumission).
// 30s s'est avéré trop court en pratique : la soumission audio MiniMax Music
// (minimax:music@2.6) déclenche systématiquement notre propre timeout (donc
// masque la vraie réponse/erreur Runware) — remonté à 60s le 2026-09-16 pour
// laisser le temps à Runware de répondre (le code d'erreur "timeoutProvider"
// existant ci-dessous suggère que Runware attend lui-même une réponse du
// fournisseur tiers avant de répondre, ce qui peut légitimement prendre du
// temps pour un modèle audio).
const RUNWARE_CALL_TIMEOUT_MS = 60000;

async function callRunware(apiKey: string, tasks: Record<string, unknown>[]): Promise<{ data: RunwareResultItem[]; errors: RunwareErrorItem[] }> {
  // includeCost: true fait revenir un champ `cost` (USD) par tâche dans la
  // réponse — appliqué ici uniformément (soumission ET polling getResponse)
  // plutôt que dans chacun des ~44 builders de modèles, cf. _shared/ai-budget.ts.
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), RUNWARE_CALL_TIMEOUT_MS);
  let resp: Response;
  try {
    resp = await fetch(RUNWARE_BASE_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(tasks.map((t) => ({ ...t, includeCost: true }))),
      signal: controller.signal,
    });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error("Runware n'a pas répondu à temps, réessaie.");
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
  const text = await resp.text();
  let json: { data?: RunwareResultItem[]; errors?: RunwareErrorItem[] };
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`Réponse Runware invalide (HTTP ${resp.status}) : ${text.slice(0, 300)}`);
  }
  return { data: json.data ?? [], errors: json.errors ?? [] };
}

// Soumet une tâche (imageInference/videoInference/audioInference). Certains
// modèles répondent dans la foulée (data[0].imageURL/videoURL/audioURL déjà
// présent) — d'autres restent "en cours" et doivent être interrogés via
// getResponse.
// deliveryMethod: "async" est OBLIGATOIRE ici — cause racine du bug "musique
// bloquée indéfiniment sur 'en cours'" trouvée le 2026-09-16 : sans lui,
// Runware traite la tâche en mode SYNCHRONE par défaut (doc officielle :
// "Async is for long-form audio generation... or any task that usually takes
// more than 60 seconds") et essaie de tenir la connexion HTTP ouverte
// jusqu'à la fin de la génération avant de répondre. Pour MiniMax Music 2.6
// (~2-2.5 min de traitement typique), ça dépassait largement le timeout
// RUNWARE_CALL_TIMEOUT_MS ci-dessus (30s puis 60s), qui masquait la vraie
// cause en faisant croire à un simple stall réseau. Avec "async", Runware
// accuse réception immédiatement (taskUUID, status "pending") et le
// polling existant (check-studio-*-status -> pollRunwareTask -> getResponse)
// reprend la main normalement, comme prévu depuis le début.
export async function submitRunwareTask(apiKey: string, task: Record<string, unknown>): Promise<SubmitResult> {
  const taskUUID = (task.taskUUID as string | undefined) ?? crypto.randomUUID();
  const { data, errors } = await callRunware(apiKey, [{ deliveryMethod: "async", ...task, taskUUID }]);
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
  bucket: string; pathPrefix: string; url: string; table: string; rowId: string; kind: "image" | "video" | "audio";
  usage: { userId: string; mediaType: "image" | "video" | "audio"; model: string; cost: number | undefined; source: "studio_image" | "studio_video" | "studio_talkinghead" | "studio_tts" | "studio_doublage" };
}): Promise<
  { ok: true; path: string } | { ok: false; error: string }
> {
  try {
    const { bytes, contentType } = await downloadBytes(url);
    // Recraft V4 Pro Vector renvoie du SVG (pas du PNG/JPG) — cf. studio-models.ts.
    // MiniMax Speech 2.8 (Du texte à l'audio) renvoie du MP3 par défaut
    // (outputFormat demandé dans buildTtsTask), WAV en repli si jamais.
    const ext = kind === "video" ? "mp4"
      : kind === "audio" ? (contentType.includes("wav") ? "wav" : "mp3")
      : contentType.includes("svg") ? "svg" : contentType.includes("png") ? "png" : "jpg";
    const finalPath = `${pathPrefix}.${ext}`;
    const { error: uploadError } = await userClient.storage.from(bucket).upload(finalPath, bytes, { contentType, upsert: true });
    if (uploadError) throw new Error(uploadError.message);
    const pathColumn = kind === "video" ? "video_path" : kind === "audio" ? "audio_path" : "image_path";
    await userClient.from(table).update({ status: "ready", [pathColumn]: finalPath, completed_at: new Date().toISOString() }).eq("id", rowId);
    await recordAiUsage(userClient, usage);
    return { ok: true, path: finalPath };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur de finalisation.";
    await userClient.from(table).update({ status: "failed", error_message: message }).eq("id", rowId);
    return { ok: false, error: message };
  }
}
