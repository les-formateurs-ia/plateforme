// Module "Concevez vos propres musiques" (Le Studio) — génération Text-to-Music
// via l'API Runware (MiniMax Music 2.6), précédée d'une étape LLM (Gemini) qui
// structure les paroles, invente un titre et rédige le prompt de la pochette
// d'album — cf. supabase/functions/generate-studio-music/index.ts.
// ATTENTION : comme les autres modules Studio, ce modèle est tiers pour
// Runware et renverra une erreur explicite tant que le compte n'a pas de
// solde crédité (https://my.runware.ai/wallet) — seule la pochette (flux-dev,
// natif) fonctionne sans solde.
import { supabase } from "@/app/lib/supabase/client";
import type { StudioImageStatus } from "@/app/lib/supabase/database.types";

export interface StudioMusicGeneration {
  id: string;
  status: StudioImageStatus;
  prompt: string;
  instrumental: boolean;
  lyricsInput: string | null;
  title: string | null;
  lyricsStructured: string | null;
  coverPrompt: string | null;
  audioPath: string | null;
  coverImagePath: string | null;
  errorMessage: string | null;
  createdAt: string;
}

function mapRow(row: {
  id: string; status: StudioImageStatus; prompt: string; instrumental: boolean; lyrics_input: string | null;
  title: string | null; lyrics_structured: string | null; cover_prompt: string | null;
  audio_path: string | null; cover_image_path: string | null; error_message: string | null; created_at: string;
}): StudioMusicGeneration {
  return {
    id: row.id,
    status: row.status,
    prompt: row.prompt,
    instrumental: row.instrumental,
    lyricsInput: row.lyrics_input,
    title: row.title,
    lyricsStructured: row.lyrics_structured,
    coverPrompt: row.cover_prompt,
    audioPath: row.audio_path,
    coverImagePath: row.cover_image_path,
    errorMessage: row.error_message,
    createdAt: row.created_at,
  };
}

const MUSIC_SELECT = "id, status, prompt, instrumental, lyrics_input, title, lyrics_structured, cover_prompt, audio_path, cover_image_path, error_message, created_at";

export async function getMyMusicGenerations(userId: string): Promise<StudioMusicGeneration[]> {
  const { data, error } = await supabase
    .from("studio_music_generations")
    .select(MUSIC_SELECT)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapRow);
}

// Formateur/admin uniquement : RLS (studio_music_select) ne renvoie des
// lignes que pour ses propres élèves (ou tout le monde pour l'admin).
export async function getMusicGenerationsForStudent(studentId: string): Promise<StudioMusicGeneration[]> {
  const { data, error } = await supabase
    .from("studio_music_generations")
    .select(MUSIC_SELECT)
    .eq("user_id", studentId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapRow);
}

export async function getStudioMusicSignedUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage.from("studio-music").createSignedUrl(path, 3600);
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

export async function requestMusicGeneration(params: {
  prompt: string; instrumental: boolean; lyrics?: string;
}): Promise<string> {
  const { data, error } = await supabase.functions.invoke("generate-studio-music", { body: params });
  if (error) throw new Error(await extractFunctionError(error));
  if (data?.error) throw new Error(data.error);
  if (!data?.id) throw new Error("La génération n'a pas pu démarrer.");
  return data.id as string;
}

export interface MusicGenerationPollResult {
  status: StudioImageStatus;
  audioPath: string | null;
  coverImagePath: string | null;
  error: string | null;
}

// Génération musicale ~2-3 min en moyenne (MiniMax Music 2.6) — intervalle/
// timeout entre ceux de l'image (rapide) et de la vidéo (plusieurs minutes).
export async function pollMusicGenerationStatus(
  generationId: string,
  { intervalMs = 6000, timeoutMs = 300000 }: { intervalMs?: number; timeoutMs?: number } = {},
): Promise<MusicGenerationPollResult> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const { data, error } = await supabase.functions.invoke("check-studio-music-status", { body: { generationId } });
    if (error) throw new Error(await extractFunctionError(error));
    if (data?.error && data?.status !== "failed") throw new Error(data.error);
    if (data?.status === "ready" || data?.status === "failed") {
      return { status: data.status, audioPath: data.audioPath ?? null, coverImagePath: data.coverImagePath ?? null, error: data.error ?? null };
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  return { status: "pending", audioPath: null, coverImagePath: null, error: "Délai d'attente dépassé." };
}
