// Podcasts personnalisés par élève × leçon × format (voir generate-podcast-*
// Edge Functions et src/app/lib/podcastFormats.ts pour le catalogue des formats).
import { supabase } from "@/app/lib/supabase/client";
import type { PodcastVariantId } from "@/app/lib/podcastFormats";

export interface Podcast {
  variant: PodcastVariantId;
  storagePath: string;
  transcript: string;
  createdAt: string;
}

// Tous les formats déjà générés pour cette leçon (au plus une ligne par
// variant, grâce au DELETE scopé par variant côté finalize-podcast-audio).
export async function getMyPodcasts(userId: string, lessonId: string): Promise<Podcast[]> {
  const { data, error } = await supabase
    .from("ai_generated_content")
    .select("content, created_at, variant")
    .eq("user_id", userId)
    .eq("lesson_id", lessonId)
    .eq("content_type", "podcast")
    .order("created_at", { ascending: false });
  if (error) throw error;
  const podcasts: Podcast[] = [];
  for (const row of data ?? []) {
    const content = row.content as { storage_path?: string; transcript?: string };
    if (!content?.storage_path || !row.variant) continue;
    podcasts.push({ variant: row.variant as PodcastVariantId, storagePath: content.storage_path, transcript: content.transcript ?? "", createdAt: row.created_at });
  }
  return podcasts;
}

export async function getPodcastSignedUrl(storagePath: string): Promise<string> {
  const { data, error } = await supabase.storage.from("lesson-podcasts").createSignedUrl(storagePath, 3600);
  if (error) throw error;
  return data.signedUrl;
}

async function extractFunctionError(error: { message: string; context?: Response }): Promise<string> {
  let message = error.message;
  if (error.context) {
    try {
      const body = await error.context.clone().json();
      if (body?.error) message = body.error;
    } catch {
      // corps non-JSON, on garde le message par défaut
    }
  }
  return message;
}

export type PodcastProgress =
  | { step: "script" }
  | { step: "audio"; done: number; total: number }
  | { step: "final" };

// Même découpage que supabase/functions/_shared/podcast-utils.ts
// (splitScriptIntoChunks) : quelques répliques par morceau, pour que chaque
// synthèse tienne dans le budget CPU d'une Edge Function.
function splitScriptIntoChunks(script: string, maxWordsPerChunk = 90): string[] {
  const lines = script.split(/\n+/).map((l) => l.trim()).filter(Boolean);
  const chunks: string[] = [];
  let current: string[] = [];
  let words = 0;
  for (const line of lines) {
    const n = line.split(/\s+/).length;
    if (current.length && words + n > maxWordsPerChunk) { chunks.push(current.join("\n")); current = []; words = 0; }
    current.push(line);
    words += n;
  }
  if (current.length) chunks.push(current.join("\n"));
  return chunks;
}

async function invoke<T>(name: string, body: unknown): Promise<T> {
  const res = await supabase.functions.invoke(name, { body });
  if (res.error) throw new Error(await extractFunctionError(res.error));
  if (res.data?.error) throw new Error(res.data.error);
  return res.data as T;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Un morceau, avec nouvelles tentatives espacées (Gemini TTS renvoie parfois
// une erreur passagère ou une limite de débit).
async function synthesizeChunk(lessonId: string, chunkIndex: number, chunkText: string, variant: PodcastVariantId) {
  const delays = [2000, 5000, 10000];
  for (let attempt = 0; ; attempt++) {
    try {
      return await invoke<{ sampleRate?: number; channels?: number }>("process-podcast-chunk", { lessonId, chunkIndex, chunkText, variant });
    } catch (err) {
      if (attempt >= delays.length) throw err;
      await sleep(delays[attempt]);
    }
  }
}

// Génération complète d'un podcast, orchestrée depuis le navigateur :
// script → synthèse des morceaux (3 en parallèle) → assemblage.
// Avant, generate-podcast-audio enchaînait les morceaux un par un dans une
// tâche de fond côté serveur : pour un format long, la tâche dépassait la
// limite de durée des Edge Functions et était interrompue sans erreur, et
// l'élève voyait « la génération prend plus de temps que prévu ». Ici chaque
// appel est court (une synthèse), la progression est réelle et une erreur
// remonte avec son message. L'élève doit garder la page ouverte.
export async function generatePodcast(lessonId: string, variant: PodcastVariantId, onProgress?: (p: PodcastProgress) => void): Promise<{ storagePath: string; variant: PodcastVariantId }> {
  onProgress?.({ step: "script" });
  const scriptData = await invoke<{ script?: string; variant?: PodcastVariantId }>("generate-podcast-script", { lessonId, variant });
  const script = scriptData?.script;
  if (!script) throw new Error("Le script du podcast n'a pas pu être généré.");
  // Le serveur peut retomber sur un format par défaut si `variant` était invalide.
  const confirmed: PodcastVariantId = scriptData.variant ?? variant;

  const chunks = splitScriptIntoChunks(script);
  let done = 0;
  let sampleRate = 24000;
  let channels = 1;
  onProgress?.({ step: "audio", done, total: chunks.length });
  const CONCURRENCY = 3;
  let next = 0;
  const worker = async () => {
    while (next < chunks.length) {
      const i = next++;
      const r = await synthesizeChunk(lessonId, i, chunks[i], confirmed);
      sampleRate = r?.sampleRate ?? sampleRate;
      channels = r?.channels ?? channels;
      onProgress?.({ step: "audio", done: ++done, total: chunks.length });
    }
  };
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, chunks.length) }, worker));

  onProgress?.({ step: "final" });
  const final = await invoke<{ storagePath: string; variant?: PodcastVariantId }>("finalize-podcast-audio", {
    lessonId, chunkCount: chunks.length, sampleRate, channels, transcript: script, variant: confirmed,
  });
  return { storagePath: final.storagePath, variant: final.variant ?? confirmed };
}
