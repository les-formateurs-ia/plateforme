// Module "Imaginez vos vidéos" (Le Studio) — génération Text-to-Video /
// Image-to-Video via l'API Runware (remplace Higgsfield, cf.
// supabase/functions/_shared/studio-video-models.ts, à garder en phase).
// IMPORTANT : au moment de cette migration, le compte Runware n'a aucun
// solde crédité et TOUTE génération vidéo (quel que soit le modèle) exige
// un solde ≥5$ (https://my.runware.ai/wallet) — l'élève verra donc l'erreur
// Runware explicite tant que le compte n'est pas alimenté. Le code est prêt
// et fonctionnera dès que ce sera fait, sans changement supplémentaire.
import { supabase } from "@/app/lib/supabase/client";
import type { StudioImageStatus } from "@/app/lib/supabase/database.types";

export interface StudioVideoOption {
  key: string;
  label: string;
  choices: string[];
  default: string;
}

export interface StudioVideoModel {
  id: string;
  label: string;
  description: string;
  supportsSourceImage: boolean;
  requiresSourceImage: boolean;
  options: StudioVideoOption[];
}

export const STUDIO_VIDEO_MODELS: StudioVideoModel[] = [
  {
    id: "veo-3-1",
    label: "Google Veo 3.1",
    description: "Texte seul ou animation d'une photo de référence (optionnelle).",
    supportsSourceImage: true,
    requiresSourceImage: false,
    options: [{ key: "duration", label: "Durée", choices: ["5", "8"], default: "8" }],
  },
  {
    id: "kling",
    label: "Kling",
    description: "Animation d'une photo de référence — image obligatoire.",
    supportsSourceImage: true,
    requiresSourceImage: true,
    options: [{ key: "duration", label: "Durée", choices: ["5", "10"], default: "5" }],
  },
  {
    id: "flux-video",
    label: "FLUX Video",
    description: "Texte uniquement.",
    supportsSourceImage: false,
    requiresSourceImage: false,
    options: [{ key: "duration", label: "Durée", choices: ["5"], default: "5" }],
  },
];

export interface StudioVideoGeneration {
  id: string;
  status: StudioImageStatus;
  model: string;
  options: Record<string, string>;
  prompt: string;
  sourceImagePath: string | null;
  videoPath: string | null;
  errorMessage: string | null;
  createdAt: string;
}

function mapRow(row: {
  id: string; status: StudioImageStatus; model: string; options: Record<string, unknown>; prompt: string;
  source_image_path: string | null; video_path: string | null; error_message: string | null; created_at: string;
}): StudioVideoGeneration {
  return {
    id: row.id,
    status: row.status,
    model: row.model,
    options: row.options as Record<string, string>,
    prompt: row.prompt,
    sourceImagePath: row.source_image_path,
    videoPath: row.video_path,
    errorMessage: row.error_message,
    createdAt: row.created_at,
  };
}

export async function getMyVideoGenerations(userId: string): Promise<StudioVideoGeneration[]> {
  const { data, error } = await supabase
    .from("studio_video_generations")
    .select("id, status, model, options, prompt, source_image_path, video_path, error_message, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapRow);
}

// Formateur/admin uniquement : RLS (studio_videos_select) ne renvoie des
// lignes que pour ses propres élèves (ou tout le monde pour l'admin).
export async function getVideoGenerationsForStudent(studentId: string): Promise<StudioVideoGeneration[]> {
  const { data, error } = await supabase
    .from("studio_video_generations")
    .select("id, status, model, options, prompt, source_image_path, video_path, error_message, created_at")
    .eq("user_id", studentId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapRow);
}

export async function getStudioVideoSignedUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage.from("studio-videos").createSignedUrl(path, 3600);
  if (error) throw error;
  return data.signedUrl;
}

export async function uploadStudioVideoSourceImage(userId: string, file: File): Promise<string> {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${userId}/sources/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("studio-videos").upload(path, file, { contentType: file.type || undefined });
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

export async function requestVideoGeneration(params: {
  model: string; prompt: string; sourceImagePath?: string; options: Record<string, string>;
}): Promise<string> {
  const { data, error } = await supabase.functions.invoke("generate-studio-video", { body: params });
  if (error) throw new Error(await extractFunctionError(error));
  if (data?.error) throw new Error(data.error);
  if (!data?.id) throw new Error("La génération n'a pas pu démarrer.");
  return data.id as string;
}

export interface VideoGenerationPollResult {
  status: StudioImageStatus;
  videoPath: string | null;
  error: string | null;
}

// Le rendu vidéo est nettement plus lent que l'image (plusieurs minutes) —
// intervalle et timeout plus généreux (même logique que pollAvatarVideoStatus).
export async function pollVideoGenerationStatus(
  generationId: string,
  { intervalMs = 8000, timeoutMs = 480000 }: { intervalMs?: number; timeoutMs?: number } = {},
): Promise<VideoGenerationPollResult> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const { data, error } = await supabase.functions.invoke("check-studio-video-status", { body: { generationId } });
    if (error) throw new Error(await extractFunctionError(error));
    if (data?.error && data?.status !== "failed") throw new Error(data.error);
    if (data?.status === "ready" || data?.status === "failed") {
      return { status: data.status, videoPath: data.videoPath ?? null, error: data.error ?? null };
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  return { status: "pending", videoPath: null, error: "Délai d'attente dépassé." };
}
