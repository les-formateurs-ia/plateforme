// Module "Du texte à l'audio" (Le Studio) — synthèse vocale (Text-to-Speech)
// via MiniMax Speech 2.8 sur l'API Runware. Catalogue de voix partagé avec
// "Faites parler vos images" et "Parlez n'importe quelle langue" — cf.
// supabase/functions/_shared/studio-tts-voices.ts, à garder en phase.
import { supabase } from "@/app/lib/supabase/client";
import type { StudioImageStatus } from "@/app/lib/supabase/database.types";

export interface TtsVoice {
  id: string;
  label: string;
  language: string;
}

export const TTS_VOICES: TtsVoice[] = [
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

export const SCRIPT_MAX_LENGTH = 4000;

export interface StudioTtsGeneration {
  id: string;
  status: StudioImageStatus;
  scriptText: string;
  voice: string;
  language: string;
  audioPath: string | null;
  errorMessage: string | null;
  createdAt: string;
}

function mapRow(row: {
  id: string; status: StudioImageStatus; script_text: string; voice: string; language: string;
  audio_path: string | null; error_message: string | null; created_at: string;
}): StudioTtsGeneration {
  return {
    id: row.id,
    status: row.status,
    scriptText: row.script_text,
    voice: row.voice,
    language: row.language,
    audioPath: row.audio_path,
    errorMessage: row.error_message,
    createdAt: row.created_at,
  };
}

const TTS_SELECT = "id, status, script_text, voice, language, audio_path, error_message, created_at";

export async function getMyTtsGenerations(userId: string): Promise<StudioTtsGeneration[]> {
  const { data, error } = await supabase
    .from("studio_tts_generations")
    .select(TTS_SELECT)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapRow);
}

export async function getStudioTtsSignedUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage.from("studio-tts").createSignedUrl(path, 3600);
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

export async function requestTtsGeneration(params: { script: string; voice: string }): Promise<string> {
  const { data, error } = await supabase.functions.invoke("generate-studio-tts", { body: params });
  if (error) throw new Error(await extractFunctionError(error));
  if (data?.error) throw new Error(data.error);
  if (!data?.id) throw new Error("La génération n'a pas pu démarrer.");
  return data.id as string;
}

export interface TtsGenerationPollResult {
  status: StudioImageStatus;
  audioPath: string | null;
  error: string | null;
}

// La synthèse vocale seule est nettement plus rapide que l'avatar (pas de
// rendu vidéo derrière) — intervalle/timeout resserrés par rapport à
// pollTalkingHeadGenerationStatus.
export async function pollTtsGenerationStatus(
  generationId: string,
  { intervalMs = 4000, timeoutMs = 180000 }: { intervalMs?: number; timeoutMs?: number } = {},
): Promise<TtsGenerationPollResult> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const { data, error } = await supabase.functions.invoke("check-studio-tts-status", { body: { generationId } });
    if (error) throw new Error(await extractFunctionError(error));
    if (data?.error && data?.status !== "failed") throw new Error(data.error);
    if (data?.status === "ready" || data?.status === "failed") {
      return { status: data.status, audioPath: data.audioPath ?? null, error: data.error ?? null };
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  return { status: "pending", audioPath: null, error: "Délai d'attente dépassé." };
}
