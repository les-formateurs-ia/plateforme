// Module "Imaginez vos vidéos" (Le Studio) — génération Text-to-Video /
// Image-to-Video via l'API Runware (remplace Higgsfield, cf.
// supabase/functions/_shared/studio-video-models.ts, à garder en phase).
// Catalogue complet (21 modèles demandés le 2026-09-14). Chaque modèle expose
// désormais un choix de format (paysage/portrait/carré, cf. "aspectRatio"
// dans les `options` ci-dessous) en plus de la durée — jusqu'ici seule la
// durée était réglable et tout tournait en 16:9 fixe, ce qui rendait le
// portrait impossible (bug corrigé le 2026-09-14).
// IMPORTANT : le compte Runware n'a aucun solde crédité et TOUTE génération
// vidéo (quel que soit le modèle, Sora 2 inclus) exige un solde ≥5$
// (https://my.runware.ai/wallet) — l'élève verra donc l'erreur Runware
// explicite tant que le compte n'est pas alimenté. Le code est prêt et
// fonctionnera dès que ce sera fait, sans changement supplémentaire. Seul
// "kling" a été testé bout en bout avec succès (2026-09-12).
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

const RATIO_16_9_9_16 = { key: "aspectRatio", label: "Format", choices: ["16:9", "9:16"], default: "16:9" };
const RATIO_16_9_9_16_1_1 = { key: "aspectRatio", label: "Format", choices: ["16:9", "9:16", "1:1"], default: "16:9" };
const RATIO_GEN45 = { key: "aspectRatio", label: "Format", choices: ["16:9", "9:16", "4:3", "3:4", "1:1"], default: "16:9" };
const DURATION_5_10 = { key: "duration", label: "Durée", choices: ["5", "10"], default: "5" };
const DURATION_6_8_10 = { key: "duration", label: "Durée", choices: ["6", "8", "10"], default: "8" };

export const STUDIO_VIDEO_MODELS: StudioVideoModel[] = [
  {
    id: "veo-3-1",
    label: "Veo 3.1",
    description: "Texte seul ou animation d'une photo de référence (optionnelle).",
    supportsSourceImage: true,
    requiresSourceImage: false,
    // Runware n'accepte que 4/6/8s pour Veo 3.1 (erreur "Invalid value for
    // 'duration' parameter" sur 5s) — corrigé le 2026-09-16.
    options: [RATIO_16_9_9_16, { key: "duration", label: "Durée", choices: ["4", "6", "8"], default: "8" }],
  },
  {
    id: "veo-3-1-fast",
    label: "Veo 3.1 Fast",
    description: "Version rapide de Veo 3.1 — texte seul ou animation d'une photo de référence (optionnelle).",
    supportsSourceImage: true,
    requiresSourceImage: false,
    // Doc Runware (google:3@3) confirme 4/6/7/8s — 7s ajouté le 2026-09-16
    // (https://runware.ai/docs/models/google-veo-3-1-fast).
    options: [RATIO_16_9_9_16, { key: "duration", label: "Durée", choices: ["4", "6", "7", "8"], default: "8" }],
  },
  {
    id: "kling",
    label: "Kling",
    description: "Animation d'une photo de référence — image obligatoire.",
    supportsSourceImage: true,
    requiresSourceImage: true,
    options: [RATIO_16_9_9_16_1_1, DURATION_5_10],
  },
  {
    id: "kling-video-3-pro",
    label: "Kling VIDEO 3.0 Pro",
    description: "Texte seul ou animation d'une photo de référence (optionnelle).",
    supportsSourceImage: true,
    requiresSourceImage: false,
    options: [RATIO_16_9_9_16_1_1, DURATION_5_10],
  },
  {
    id: "kling-video-3-4k",
    label: "Kling VIDEO 3.0 4K",
    description: "Kling en résolution 4K — texte seul ou animation d'une photo de référence (optionnelle).",
    supportsSourceImage: true,
    requiresSourceImage: false,
    options: [RATIO_16_9_9_16_1_1, DURATION_5_10],
  },
  {
    id: "kling-video-o1-pro",
    label: "Kling VIDEO O1 Pro",
    description: "Texte seul ou animation d'une photo de référence (optionnelle).",
    supportsSourceImage: true,
    requiresSourceImage: false,
    // Le format carré (1:1) existe aussi pour ce modèle (confirmé
    // 2026-09-16, https://runware.ai/docs/models/klingai-video-o1-pro) —
    // ajouté (RATIO_16_9_9_16 -> RATIO_16_9_9_16_1_1).
    options: [RATIO_16_9_9_16_1_1, DURATION_5_10],
  },
  {
    id: "kling-video-o1-standard",
    label: "Kling VIDEO O1 Standard",
    description: "Texte seul ou animation d'une photo de référence (optionnelle).",
    supportsSourceImage: true,
    requiresSourceImage: false,
    // Idem kling-video-o1-pro : format carré confirmé
    // (https://runware.ai/docs/models/klingai-video-o1-standard).
    options: [RATIO_16_9_9_16_1_1, DURATION_5_10],
  },
  {
    id: "flux-video",
    label: "FLUX Video",
    description: "Texte uniquement.",
    supportsSourceImage: false,
    requiresSourceImage: false,
    // Doc Runware (bfl:flux@3-video) autorise tout entier de 5 à 20s (ou
    // "auto"), pas seulement 5s — choix élargi le 2026-09-16
    // (https://runware.ai/docs/models/bfl-flux-3-video).
    options: [RATIO_16_9_9_16_1_1, { key: "duration", label: "Durée", choices: ["5", "10", "15", "20"], default: "5" }],
  },
  {
    id: "sora-2",
    label: "Sora 2 (OpenAI)",
    description: "Texte seul ou animation d'une photo de référence (optionnelle) — audio synchronisé.",
    supportsSourceImage: true,
    requiresSourceImage: false,
    options: [RATIO_16_9_9_16, { key: "duration", label: "Durée", choices: ["4", "8", "12", "16", "20"], default: "8" }],
  },
  {
    id: "runway-gen-4-5",
    label: "Runway Gen-4.5",
    description: "Texte seul ou animation d'une photo de référence (optionnelle).",
    supportsSourceImage: true,
    requiresSourceImage: false,
    options: [RATIO_GEN45, { key: "duration", label: "Durée", choices: ["5", "8", "10"], default: "8" }],
  },
  {
    id: "seedance-2-0",
    label: "Seedance 2.0",
    description: "Texte seul ou animation d'une photo de référence (optionnelle).",
    supportsSourceImage: true,
    requiresSourceImage: false,
    options: [RATIO_16_9_9_16_1_1, DURATION_5_10],
  },
  {
    id: "seedance-2-0-fast",
    label: "Seedance 2.0 Fast",
    description: "Version rapide de Seedance 2.0.",
    supportsSourceImage: true,
    requiresSourceImage: false,
    options: [RATIO_16_9_9_16_1_1, DURATION_5_10],
  },
  {
    id: "seedance-1-5-pro",
    label: "Seedance 1.5 Pro",
    description: "Texte seul ou animation d'une photo de référence (optionnelle).",
    supportsSourceImage: true,
    requiresSourceImage: false,
    options: [RATIO_16_9_9_16_1_1, DURATION_5_10],
  },
  {
    id: "ltx-2-5-pro",
    label: "LTX-2.5 Pro",
    description: "Texte seul ou animation d'une photo de référence (optionnelle).",
    supportsSourceImage: true,
    requiresSourceImage: false,
    options: [RATIO_16_9_9_16, DURATION_6_8_10],
  },
  {
    id: "ltx-2-5-fast",
    label: "LTX-2.5 Fast",
    description: "Version rapide de LTX-2.5.",
    supportsSourceImage: true,
    requiresSourceImage: false,
    options: [RATIO_16_9_9_16, DURATION_6_8_10],
  },
  {
    id: "minimax-hailuo-2-3",
    label: "MiniMax Hailuo 2.3",
    description: "Texte seul ou animation d'une photo de référence (optionnelle) — paysage uniquement.",
    supportsSourceImage: true,
    requiresSourceImage: false,
    options: [{ key: "duration", label: "Durée", choices: ["6", "10"], default: "6" }],
  },
  {
    id: "minimax-hailuo-02",
    label: "MiniMax Hailuo 02",
    description: "Texte seul ou animation d'une photo de référence (optionnelle) — paysage uniquement.",
    supportsSourceImage: true,
    requiresSourceImage: false,
    options: [{ key: "duration", label: "Durée", choices: ["6", "10"], default: "6" }],
  },
  {
    id: "wan27-video",
    label: "Wan2.7",
    description: "Texte seul ou animation d'une photo de référence (optionnelle).",
    supportsSourceImage: true,
    requiresSourceImage: false,
    options: [RATIO_16_9_9_16_1_1, DURATION_5_10],
  },
  {
    id: "happyhorse-1-0",
    label: "HappyHorse-1.0",
    description: "Texte seul ou animation d'une photo de référence (optionnelle).",
    supportsSourceImage: true,
    requiresSourceImage: false,
    options: [RATIO_16_9_9_16_1_1, DURATION_5_10],
  },
  {
    id: "vidu-q3",
    label: "Vidu Q3",
    description: "Texte seul ou animation d'une photo de référence (optionnelle).",
    supportsSourceImage: true,
    requiresSourceImage: false,
    options: [RATIO_16_9_9_16_1_1, DURATION_5_10],
  },
  {
    id: "pixverse-v5-5",
    label: "PixVerse V5.5",
    description: "Texte seul ou animation d'une photo de référence (optionnelle).",
    supportsSourceImage: true,
    requiresSourceImage: false,
    options: [RATIO_16_9_9_16_1_1, { key: "duration", label: "Durée", choices: ["5", "8"], default: "5" }],
  },
  {
    id: "pixverse-v6",
    label: "PixVerse V6",
    description: "Texte seul ou animation d'une photo de référence (optionnelle).",
    supportsSourceImage: true,
    requiresSourceImage: false,
    options: [RATIO_16_9_9_16_1_1, { key: "duration", label: "Durée", choices: ["5", "8", "10"], default: "5" }],
  },
  {
    id: "skyreels-v4",
    label: "SkyReels V4",
    description: "Texte seul ou animation d'une photo de référence (optionnelle).",
    supportsSourceImage: true,
    requiresSourceImage: false,
    options: [RATIO_16_9_9_16_1_1, DURATION_5_10],
  },
  {
    id: "grok-imagine-video",
    label: "Grok Imagine Video",
    description: "Texte seul ou animation d'une photo de référence (optionnelle).",
    supportsSourceImage: true,
    requiresSourceImage: false,
    options: [RATIO_16_9_9_16_1_1, DURATION_5_10],
  },
];

// Même logique que aspectRatioToCss (studioImages.ts) — le format vidéo vit
// dans options.aspectRatio plutôt qu'une colonne dédiée, et certains modèles
// n'exposent pas ce choix (options sans clé "aspectRatio") : on retombe alors
// sur 16:9, le défaut le plus courant.
export function videoAspectRatioToCss(options: Record<string, string> | null | undefined): string {
  const [w, h] = (options?.aspectRatio ?? "16:9").split(":").map(Number);
  return w > 0 && h > 0 ? `${w} / ${h}` : "16 / 9";
}

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
