// Module "Créer vos images" (Le Studio) — génération Text-to-Image / Image-to-Image
// via l'API Runware (remplace Higgsfield). Seuls des modèles FLUX natifs
// Runware sont proposés pour l'instant : les modèles tiers (Google, OpenAI,
// Ideogram...) exigent un solde Runware crédité (compte non alimenté au
// moment de la migration, cf. supabase/functions/_shared/studio-models.ts,
// à garder en phase avec ce fichier).
import { supabase } from "@/app/lib/supabase/client";
import type { StudioImageStatus } from "@/app/lib/supabase/database.types";

export interface StudioModel {
  id: string;
  label: string;
  description: string;
  supportsSourceImage: boolean;
  aspectRatios: string[];
  defaultAspectRatio: string;
}

const COMMON_ASPECT_RATIOS = ["1:1", "4:3", "3:4", "3:2", "2:3", "16:9", "9:16"];

export const STUDIO_MODELS: StudioModel[] = [
  {
    id: "flux-dev",
    label: "FLUX.1 Dev",
    description: "Rendu haute qualité — texte seul ou à partir d'une image source (Image-to-Image).",
    supportsSourceImage: true,
    aspectRatios: COMMON_ASPECT_RATIOS,
    defaultAspectRatio: "4:3",
  },
  {
    id: "flux-schnell",
    label: "FLUX.1 Schnell",
    description: "Génération très rapide — texte seul ou à partir d'une image source (Image-to-Image).",
    supportsSourceImage: true,
    aspectRatios: COMMON_ASPECT_RATIOS,
    defaultAspectRatio: "4:3",
  },
];

const ASPECT_RATIO_LABELS: Record<string, string> = {
  "1:1": "Carré (1:1)",
  "16:9": "Paysage (16:9)",
  "9:16": "Portrait (9:16)",
  "4:3": "Paysage (4:3)",
  "3:4": "Portrait (3:4)",
  auto: "Automatique",
};

export function aspectRatioLabel(ratio: string): string {
  return ASPECT_RATIO_LABELS[ratio] ?? ratio;
}

export interface StudioImageGeneration {
  id: string;
  status: StudioImageStatus;
  model: string;
  aspectRatio: string;
  prompt: string;
  sourceImagePath: string | null;
  imagePath: string | null;
  errorMessage: string | null;
  createdAt: string;
}

function mapRow(row: {
  id: string; status: StudioImageStatus; model: string; aspect_ratio: string; prompt: string;
  source_image_path: string | null; image_path: string | null; error_message: string | null; created_at: string;
}): StudioImageGeneration {
  return {
    id: row.id,
    status: row.status,
    model: row.model,
    aspectRatio: row.aspect_ratio,
    prompt: row.prompt,
    sourceImagePath: row.source_image_path,
    imagePath: row.image_path,
    errorMessage: row.error_message,
    createdAt: row.created_at,
  };
}

export async function getMyGenerations(userId: string): Promise<StudioImageGeneration[]> {
  const { data, error } = await supabase
    .from("studio_image_generations")
    .select("id, status, model, aspect_ratio, prompt, source_image_path, image_path, error_message, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapRow);
}

// Formateur/admin uniquement : RLS (studio_images_select) ne renvoie des
// lignes que pour ses propres élèves (ou tout le monde pour l'admin).
export async function getGenerationsForStudent(studentId: string): Promise<StudioImageGeneration[]> {
  const { data, error } = await supabase
    .from("studio_image_generations")
    .select("id, status, model, aspect_ratio, prompt, source_image_path, image_path, error_message, created_at")
    .eq("user_id", studentId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapRow);
}

export async function getStudioImageSignedUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage.from("studio-images").createSignedUrl(path, 3600);
  if (error) throw error;
  return data.signedUrl;
}

export async function uploadStudioSourceImage(userId: string, file: File): Promise<string> {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${userId}/sources/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("studio-images").upload(path, file, { contentType: file.type || undefined });
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

export async function requestImageGeneration(params: {
  model: string; aspectRatio: string; prompt: string; sourceImagePath?: string;
}): Promise<string> {
  const { data, error } = await supabase.functions.invoke("generate-studio-image", { body: params });
  if (error) throw new Error(await extractFunctionError(error));
  if (data?.error) throw new Error(data.error);
  if (!data?.id) throw new Error("La génération n'a pas pu démarrer.");
  return data.id as string;
}

export interface GenerationPollResult {
  status: StudioImageStatus;
  imagePath: string | null;
  error: string | null;
}

// Runware rend souvent une image en quelques secondes (parfois immédiat, cf.
// generate-studio-image) — on interroge quand même par courts appels au cas
// où le modèle reste "pending" plus longtemps (même logique que les
// podcasts/vidéos avatar).
export async function pollGenerationStatus(
  generationId: string,
  { intervalMs = 4000, timeoutMs = 180000 }: { intervalMs?: number; timeoutMs?: number } = {},
): Promise<GenerationPollResult> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const { data, error } = await supabase.functions.invoke("check-studio-image-status", { body: { generationId } });
    if (error) throw new Error(await extractFunctionError(error));
    if (data?.error && data?.status !== "failed") throw new Error(data.error);
    if (data?.status === "ready" || data?.status === "failed") {
      return { status: data.status, imagePath: data.imagePath ?? null, error: data.error ?? null };
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  return { status: "pending", imagePath: null, error: "Délai d'attente dépassé." };
}
