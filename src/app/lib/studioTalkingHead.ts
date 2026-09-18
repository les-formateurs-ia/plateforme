// Module "Faites parler vos images" (Le Studio) — génération de vidéo
// lip-sync/avatar parlant (photo + texte -> vidéo) via l'API Runware.
// Catalogue côté client, à garder en phase avec
// supabase/functions/_shared/studio-talkinghead-models.ts.
// IMPORTANT : comme pour Imaginez vos vidéos, le compte Runware n'a aucun
// solde crédité — ces 5 modèles sont tous tiers et renverront l'erreur
// Runware explicite (thirdPartyInsufficientCredits) tant que le compte n'est
// pas alimenté (https://my.runware.ai/wallet). Le code est prêt et
// fonctionnera dès que ce sera fait.
import { supabase } from "@/app/lib/supabase/client";
import type { StudioImageStatus } from "@/app/lib/supabase/database.types";

export interface StudioTalkingHeadModel {
  id: string;
  label: string;
  description: string;
}

export const STUDIO_TALKINGHEAD_MODELS: StudioTalkingHeadModel[] = [
  { id: "p-video-avatar", label: "P-Video Avatar", description: "Rapide et économique — bon choix par défaut." },
  { id: "heygen-avatar-iv", label: "HeyGen Avatar IV", description: "Qualité premium, gestes et expressions naturels." },
  { id: "omnihuman-1-5", label: "OmniHuman 1.5", description: "Modèle ByteDance à la pointe pour la précision du lip-sync." },
  { id: "klingai-avatar-2-pro", label: "KlingAI Avatar 2.0 Pro", description: "Bon équilibre qualité/prix." },
  { id: "aurora-v1", label: "Aurora v1", description: "Creatify Aurora — expressivité et mouvement corps entier." },
];

export interface TalkingHeadVoice {
  id: string;
  label: string;
  language: string;
}

export const TTS_VOICES: TalkingHeadVoice[] = [
  { id: "French_MaleNarrator", label: "Français — Narrateur (H)", language: "fr-FR" },
  { id: "French_FemaleAnchor", label: "Français — Présentatrice (F)", language: "fr-FR" },
  { id: "English_expressive_narrator", label: "Anglais — Narrateur expressif", language: "en-US" },
  { id: "English_CalmWoman", label: "Anglais — Voix calme (F)", language: "en-US" },
  { id: "Spanish_narrator", label: "Espagnol — Narrateur", language: "es-ES" },
];

export const SCRIPT_MAX_LENGTH = 1000;

export interface StudioTalkingHeadGeneration {
  id: string;
  status: StudioImageStatus;
  model: string;
  scriptText: string;
  voice: string;
  language: string;
  sourceImagePath: string;
  videoPath: string | null;
  errorMessage: string | null;
  createdAt: string;
}

function mapRow(row: {
  id: string; status: StudioImageStatus; model: string; script_text: string; voice: string; language: string;
  source_image_path: string; video_path: string | null; error_message: string | null; created_at: string;
}): StudioTalkingHeadGeneration {
  return {
    id: row.id,
    status: row.status,
    model: row.model,
    scriptText: row.script_text,
    voice: row.voice,
    language: row.language,
    sourceImagePath: row.source_image_path,
    videoPath: row.video_path,
    errorMessage: row.error_message,
    createdAt: row.created_at,
  };
}

export async function getMyTalkingHeadGenerations(userId: string): Promise<StudioTalkingHeadGeneration[]> {
  const { data, error } = await supabase
    .from("studio_talkinghead_generations")
    .select("id, status, model, script_text, voice, language, source_image_path, video_path, error_message, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapRow);
}

export async function getStudioTalkingHeadSignedUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage.from("studio-talkinghead").createSignedUrl(path, 3600);
  if (error) throw error;
  return data.signedUrl;
}

export async function uploadStudioTalkingHeadSourceImage(userId: string, file: File): Promise<string> {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${userId}/sources/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("studio-talkinghead").upload(path, file, { contentType: file.type || undefined });
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

export async function requestTalkingHeadGeneration(params: {
  model: string; script: string; sourceImagePath: string; voice: string; language: string;
}): Promise<string> {
  const { data, error } = await supabase.functions.invoke("generate-studio-talkinghead", { body: params });
  if (error) throw new Error(await extractFunctionError(error));
  if (data?.error) throw new Error(data.error);
  if (!data?.id) throw new Error("La génération n'a pas pu démarrer.");
  return data.id as string;
}

export interface TalkingHeadGenerationPollResult {
  status: StudioImageStatus;
  videoPath: string | null;
  error: string | null;
}

// Rythme entre l'image (4s/180s) et la vidéo (8s/480s) : le pipeline ajoute
// une étape TTS mais le rendu avatar reste comparable à une vidéo courte.
export async function pollTalkingHeadGenerationStatus(
  generationId: string,
  { intervalMs = 6000, timeoutMs = 300000 }: { intervalMs?: number; timeoutMs?: number } = {},
): Promise<TalkingHeadGenerationPollResult> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const { data, error } = await supabase.functions.invoke("check-studio-talkinghead-status", { body: { generationId } });
    if (error) throw new Error(await extractFunctionError(error));
    if (data?.error && data?.status !== "failed") throw new Error(data.error);
    if (data?.status === "ready" || data?.status === "failed") {
      return { status: data.status, videoPath: data.videoPath ?? null, error: data.error ?? null };
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  return { status: "pending", videoPath: null, error: "Délai d'attente dépassé." };
}
