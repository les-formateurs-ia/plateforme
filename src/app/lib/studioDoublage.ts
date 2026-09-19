// Module "Parlez n'importe quelle langue" (Le Studio) — traduction &
// doublage vidéo (upload d'une vidéo -> Gemini transcrit + traduit -> voix
// -> lip-sync) via l'API Runware pour la génération, Gemini uniquement pour
// "comprendre" ce qui est dit (Runware n'a aucune capacité de transcription
// audio). L'élève choisit juste la langue d'origine et la langue cible,
// aucune saisie manuelle de texte. Catalogue de modèles/langues côté
// client, à garder en phase avec supabase/functions/_shared/studio-doublage-models.ts.
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

export interface DoublageLanguage {
  code: string;
  label: string;
}

export const DOUBLAGE_LANGUAGES: DoublageLanguage[] = [
  { code: "fr", label: "Français" },
  { code: "en", label: "Anglais" },
  { code: "es", label: "Espagnol" },
  { code: "de", label: "Allemand" },
  { code: "it", label: "Italien" },
  { code: "pt", label: "Portugais" },
  { code: "ru", label: "Russe" },
];

export const DEFAULT_SOURCE_LANGUAGE = "en";
export const DEFAULT_TARGET_LANGUAGE = "fr";

export interface StudioDoublageGeneration {
  id: string;
  status: StudioImageStatus;
  model: string;
  scriptText: string | null;
  translatedText: string | null;
  sourceLanguage: string | null;
  targetLanguage: string;
  sourceVideoPath: string;
  videoPath: string | null;
  errorMessage: string | null;
  createdAt: string;
}

function mapRow(row: {
  id: string; status: StudioImageStatus; model: string; script_text: string | null; translated_text: string | null;
  source_language: string | null; target_language: string; source_video_path: string; video_path: string | null;
  error_message: string | null; created_at: string;
}): StudioDoublageGeneration {
  return {
    id: row.id,
    status: row.status,
    model: row.model,
    scriptText: row.script_text,
    translatedText: row.translated_text,
    sourceLanguage: row.source_language,
    targetLanguage: row.target_language,
    sourceVideoPath: row.source_video_path,
    videoPath: row.video_path,
    errorMessage: row.error_message,
    createdAt: row.created_at,
  };
}

const DOUBLAGE_SELECT = "id, status, model, script_text, translated_text, source_language, target_language, source_video_path, video_path, error_message, created_at";

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
  model: string; sourceVideoPath: string; sourceLanguage: string; targetLanguage: string;
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

// Le rendu combine désormais transcription+traduction Gemini (variable
// selon la longueur de la vidéo) puis lip-sync Runware — timeout un peu
// plus généreux que la version précédente (texte saisi à la main).
export async function pollDoublageGenerationStatus(
  generationId: string,
  { intervalMs = 6000, timeoutMs = 360000 }: { intervalMs?: number; timeoutMs?: number } = {},
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
