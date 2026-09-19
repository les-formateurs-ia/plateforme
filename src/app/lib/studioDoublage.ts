// Module "Parlez n'importe quelle langue" (Le Studio) — traduction &
// doublage vidéo (upload d'une vidéo + texte source -> traduction
// intelligente -> voix -> lip-sync) via l'API Runware. Catalogue de modèles
// et de voix côté client, à garder en phase avec
// supabase/functions/_shared/studio-doublage-models.ts /
// _shared/studio-tts-voices.ts.
import { supabase } from "@/app/lib/supabase/client";
import type { StudioImageStatus } from "@/app/lib/supabase/database.types";

export interface StudioDoublageModel {
  id: string;
  label: string;
  description: string;
}

export const STUDIO_DOUBLAGE_MODELS: StudioDoublageModel[] = [
  { id: "lipsync-2", label: "Sync Lipsync 2", description: "Rapide et économique — bon choix par défaut." },
  { id: "lipsync-2-pro", label: "Sync Lipsync 2 Pro", description: "Qualité studio, préserve mieux les micro-expressions." },
];

export interface DoublageVoice {
  id: string;
  label: string;
  language: string;
}

export const DOUBLAGE_VOICES: DoublageVoice[] = [
  { id: "French_MaleNarrator", label: "Français — Narrateur (H)", language: "fr-FR" },
  { id: "French_FemaleAnchor", label: "Français — Présentatrice (F)", language: "fr-FR" },
  { id: "English_expressive_narrator", label: "Anglais — Narrateur expressif", language: "en-US" },
  { id: "English_CalmWoman", label: "Anglais — Voix calme (F)", language: "en-US" },
  { id: "Spanish_narrator", label: "Espagnol — Narrateur", language: "es-ES" },
  { id: "German_FriendlyMan", label: "Allemand — Voix amicale (H)", language: "de-DE" },
  { id: "Italian_Narrator", label: "Italien — Narrateur", language: "it-IT" },
  { id: "Portuguese_SentimentalLady", label: "Portugais — Voix expressive (F)", language: "pt-PT" },
  { id: "Russian_ReliableMan", label: "Russe — Voix posée (H)", language: "ru-RU" },
];

export const SCRIPT_MAX_LENGTH = 1000;

export interface StudioDoublageGeneration {
  id: string;
  status: StudioImageStatus;
  model: string;
  scriptText: string;
  translatedText: string | null;
  targetVoice: string;
  targetLanguage: string;
  sourceVideoPath: string;
  videoPath: string | null;
  errorMessage: string | null;
  createdAt: string;
}

function mapRow(row: {
  id: string; status: StudioImageStatus; model: string; script_text: string; translated_text: string | null;
  target_voice: string; target_language: string; source_video_path: string; video_path: string | null;
  error_message: string | null; created_at: string;
}): StudioDoublageGeneration {
  return {
    id: row.id,
    status: row.status,
    model: row.model,
    scriptText: row.script_text,
    translatedText: row.translated_text,
    targetVoice: row.target_voice,
    targetLanguage: row.target_language,
    sourceVideoPath: row.source_video_path,
    videoPath: row.video_path,
    errorMessage: row.error_message,
    createdAt: row.created_at,
  };
}

const DOUBLAGE_SELECT = "id, status, model, script_text, translated_text, target_voice, target_language, source_video_path, video_path, error_message, created_at";

export async function getMyDoublageGenerations(userId: string): Promise<StudioDoublageGeneration[]> {
  const { data, error } = await supabase
    .from("studio_doublage_generations")
    .select(DOUBLAGE_SELECT)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapRow);
}

export async function getStudioDoublageSignedUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage.from("studio-doublage").createSignedUrl(path, 3600);
  if (error) throw error;
  return data.signedUrl;
}

export async function uploadStudioDoublageSourceVideo(userId: string, file: File): Promise<string> {
  const ext = file.name.split(".").pop() || "mp4";
  const path = `${userId}/sources/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("studio-doublage").upload(path, file, { contentType: file.type || undefined });
  if (error) throw error;
  return path;
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

export async function requestDoublageGeneration(params: {
  model: string; script: string; sourceVideoPath: string; voice: string;
}): Promise<{ id: string; translatedText: string | null }> {
  const { data, error } = await supabase.functions.invoke("generate-studio-doublage", { body: params });
  if (error) throw new Error(await extractFunctionError(error));
  if (data?.error) throw new Error(data.error);
  if (!data?.id) throw new Error("La génération n'a pas pu démarrer.");
  return { id: data.id as string, translatedText: (data.translatedText as string | undefined) ?? null };
}

export interface DoublageGenerationPollResult {
  status: StudioImageStatus;
  videoPath: string | null;
  error: string | null;
}

// Même rythme que le lip-sync avatar (pollTalkingHeadGenerationStatus) : le
// rendu vient du même type de modèle Runware (videoInference), et se rajoute
// ici la traduction + TTS déjà résolues avant l'insertion de la ligne.
export async function pollDoublageGenerationStatus(
  generationId: string,
  { intervalMs = 6000, timeoutMs = 300000 }: { intervalMs?: number; timeoutMs?: number } = {},
): Promise<DoublageGenerationPollResult> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const { data, error } = await supabase.functions.invoke("check-studio-doublage-status", { body: { generationId } });
    if (error) throw new Error(await extractFunctionError(error));
    if (data?.error && data?.status !== "failed") throw new Error(data.error);
    if (data?.status === "ready" || data?.status === "failed") {
      return { status: data.status, videoPath: data.videoPath ?? null, error: data.error ?? null };
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  return { status: "pending", videoPath: null, error: "Délai d'attente dépassé." };
}
