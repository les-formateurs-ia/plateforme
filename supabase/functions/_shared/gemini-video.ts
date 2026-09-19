// Transcription + traduction d'une vidéo via l'API Gemini (multimodale) —
// seule brique du module "Parlez n'importe quelle langue" qui ne passe pas
// par Runware, car Runware n'a AUCUNE capacité de transcription audio
// (confirmé le 2026-09-19 sur sa doc/FAQ : "Speech-to-text isn't a task
// type in the audio API"). Gemini sert ici uniquement à "comprendre" la
// vidéo — exactement comme il sert déjà à structurer les paroles de
// "Concevez vos propres musiques" ou à animer le copilote de leçon — toute
// la génération du média final (voix + lip-sync) reste 100% Runware
// (cf. generate-studio-doublage/index.ts).
//
// Upload en 2 temps (resumable upload officiel Gemini Files API) : on évite
// tout encodage base64 manuel du fichier vidéo (CPU-intensif sur de gros
// fichiers — piège déjà rencontré côté podcasts avec du base64 audio dans
// du JSON, cf. generate-podcast-audio) — le corps du PUT est directement
// les octets bruts de la vidéo, jamais ré-encodés.
const GEMINI_UPLOAD_BASE = "https://generativelanguage.googleapis.com/upload/v1beta/files";
const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta";
const GEMINI_VIDEO_MODEL = "gemini-3.6-flash";

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") throw new Error("Gemini n'a pas répondu à temps, réessaie.");
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

interface GeminiFile {
  name: string; // "files/xxxxx"
  uri: string;
  mimeType: string;
  state: "PROCESSING" | "ACTIVE" | "FAILED";
}

async function uploadVideoToGemini(apiKey: string, bytes: Uint8Array, mimeType: string): Promise<GeminiFile> {
  const initResp = await fetchWithTimeout(GEMINI_UPLOAD_BASE, {
    method: "POST",
    headers: {
      "x-goog-api-key": apiKey,
      "X-Goog-Upload-Protocol": "resumable",
      "X-Goog-Upload-Command": "start",
      "X-Goog-Upload-Header-Content-Length": String(bytes.byteLength),
      "X-Goog-Upload-Header-Content-Type": mimeType,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ file: { display_name: "studio-doublage-source" } }),
  }, 20000);
  if (!initResp.ok) throw new Error(`Gemini a refusé l'upload de la vidéo (${initResp.status}) : ${(await initResp.text()).slice(0, 300)}`);
  const uploadUrl = initResp.headers.get("x-goog-upload-url");
  if (!uploadUrl) throw new Error("Gemini n'a pas renvoyé d'URL d'upload.");

  const uploadResp = await fetchWithTimeout(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Length": String(bytes.byteLength),
      "X-Goog-Upload-Offset": "0",
      "X-Goog-Upload-Command": "upload, finalize",
    },
    body: bytes,
  }, 45000);
  if (!uploadResp.ok) throw new Error(`Gemini a refusé l'envoi de la vidéo (${uploadResp.status}) : ${(await uploadResp.text()).slice(0, 300)}`);
  const uploadJson = await uploadResp.json();
  const file = uploadJson.file;
  if (!file?.uri || !file?.name) throw new Error("Gemini n'a renvoyé aucun fichier après l'upload.");
  return { name: file.name, uri: file.uri, mimeType: file.mimeType ?? mimeType, state: file.state ?? "PROCESSING" };
}

// Une vidéo tout juste uploadée reste "PROCESSING" quelques secondes avant
// d'être utilisable dans generateContent — on interroge jusqu'à "ACTIVE".
async function waitForGeminiFileActive(apiKey: string, fileName: string, { timeoutMs = 40000 }: { timeoutMs?: number } = {}): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  let delay = 2000;
  while (Date.now() < deadline) {
    const resp = await fetchWithTimeout(`${GEMINI_API_BASE}/${fileName}`, { method: "GET", headers: { "x-goog-api-key": apiKey } }, 15000);
    if (!resp.ok) throw new Error(`Gemini a échoué à vérifier la vidéo (${resp.status}).`);
    const json = await resp.json();
    if (json.state === "ACTIVE") return;
    if (json.state === "FAILED") throw new Error("Gemini n'a pas pu traiter la vidéo envoyée.");
    await new Promise((resolve) => setTimeout(resolve, delay));
    delay = Math.min(delay * 1.5, 6000);
  }
  throw new Error("Le traitement de la vidéo par Gemini prend trop de temps, réessaie avec un clip plus court.");
}

// Transcrit l'audio de la vidéo (censée être en `sourceLanguageLabel`) et
// renvoie directement sa traduction naturelle en `targetLanguageLabel` — un
// seul appel Gemini fait les deux, pas de transcription intermédiaire
// exposée (inutile de la faire repasser par Runware ensuite).
export async function transcribeAndTranslateVideo(apiKey: string, {
  bytes, mimeType, sourceLanguageLabel, targetLanguageLabel,
}: { bytes: Uint8Array; mimeType: string; sourceLanguageLabel: string; targetLanguageLabel: string }): Promise<string> {
  const file = await uploadVideoToGemini(apiKey, bytes, mimeType);
  try {
    await waitForGeminiFileActive(apiKey, file.name);

    const prompt = `Tu es un traducteur professionnel spécialisé dans le doublage vidéo. Écoute attentivement l'audio de cette vidéo (normalement en ${sourceLanguageLabel}) et transcris fidèlement ce qui y est dit. Puis traduis ce texte en ${targetLanguageLabel}, de façon NATURELLE et fluide à l'oral — comme si un locuteur natif le prononçait à voix haute — en conservant le sens, le ton et une longueur proche de l'original (le doublage doit rester synchronisable avec la vidéo).

Réponds UNIQUEMENT avec le texte traduit final, sans la transcription intermédiaire, sans guillemets, sans commentaire, sans préambule.`;

    const genResp = await fetchWithTimeout(`${GEMINI_API_BASE}/models/${GEMINI_VIDEO_MODEL}:generateContent`, {
      method: "POST",
      headers: { "x-goog-api-key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ fileData: { fileUri: file.uri, mimeType: file.mimeType } }, { text: prompt }] }],
      }),
    }, 45000);
    if (!genResp.ok) throw new Error(`Gemini a échoué à analyser la vidéo (${genResp.status}) : ${(await genResp.text()).slice(0, 300)}`);
    const genJson = await genResp.json();
    const text = genJson?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!text) throw new Error("Gemini n'a renvoyé aucun texte à partir de la vidéo.");
    return text;
  } finally {
    // Best-effort : la vidéo expire de toute façon sous 48h côté Gemini
    // (quota 20 Go/projet), un échec de suppression ne doit jamais faire
    // échouer la génération.
    fetchWithTimeout(`${GEMINI_API_BASE}/${file.name}`, { method: "DELETE", headers: { "x-goog-api-key": apiKey } }, 10000).catch(() => {});
  }
}
