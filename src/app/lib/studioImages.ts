// Module "Créer vos images" (Le Studio) — génération Text-to-Image / Image-to-Image
// via l'API Runware (remplace Higgsfield). Catalogue complet (23 modèles
// tiers demandés le 2026-09-14) — cf. supabase/functions/_shared/studio-models.ts
// (à garder en phase avec ce fichier) pour le détail des AIR identifiers et
// des sources. Seuls flux-dev/flux-schnell (natifs Runware) fonctionnent sans
// solde Runware crédité (carte + solde ≥5$, https://my.runware.ai/wallet) —
// tous les autres modèles resteront en erreur tant que le compte n'est pas
// alimenté (thirdPartyInsufficientCredits), erreur explicite côté élève.
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
// Modèles à presets fixes côté Runware (pas de dimensions libres) — cf.
// fixedPresetTask dans _shared/studio-models.ts, doit rester identique à
// FIXED_PRESET_ASPECT_RATIOS côté serveur.
const FIXED_PRESET_ASPECT_RATIOS = ["16:9", "9:16", "1:1"];

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
  {
    id: "flux2-pro",
    label: "FLUX.2 [pro]",
    description: "FLUX.2 professionnel (Black Forest Labs) — haute fidélité, jusqu'à 9 images de référence.",
    supportsSourceImage: true,
    aspectRatios: COMMON_ASPECT_RATIOS,
    defaultAspectRatio: "4:3",
  },
  {
    id: "flux2-max",
    label: "FLUX.2 [max]",
    description: "FLUX.2 le plus avancé (Black Forest Labs) — qualité maximale.",
    supportsSourceImage: true,
    aspectRatios: COMMON_ASPECT_RATIOS,
    defaultAspectRatio: "4:3",
  },
  {
    id: "flux2-flex",
    label: "FLUX.2 [flex]",
    description: "FLUX.2 configurable (Black Forest Labs) — contrôle fin des étapes de génération.",
    supportsSourceImage: true,
    aspectRatios: COMMON_ASPECT_RATIOS,
    defaultAspectRatio: "4:3",
  },
  {
    id: "flux2-dev",
    label: "FLUX.2 [dev]",
    description: "FLUX.2 pour l'expérimentation (Black Forest Labs, hébergé nativement par Runware).",
    supportsSourceImage: true,
    aspectRatios: COMMON_ASPECT_RATIOS,
    defaultAspectRatio: "4:3",
  },
  {
    id: "flux2-klein-9b",
    label: "FLUX.2 [klein] 9B",
    description: "FLUX.2 compact et très rapide (Black Forest Labs).",
    supportsSourceImage: true,
    aspectRatios: COMMON_ASPECT_RATIOS,
    defaultAspectRatio: "4:3",
  },
  {
    id: "flux2-klein-9b-base",
    label: "FLUX.2 [klein] 9B Base",
    description: "FLUX.2 compact, version de base non distillée (Black Forest Labs).",
    supportsSourceImage: true,
    aspectRatios: COMMON_ASPECT_RATIOS,
    defaultAspectRatio: "4:3",
  },
  {
    id: "gpt-image",
    label: "GPT Image (OpenAI)",
    description: "Modèle image d'OpenAI (ChatGPT) — bon suivi des instructions et texte intégré lisible.",
    supportsSourceImage: true,
    aspectRatios: COMMON_ASPECT_RATIOS,
    defaultAspectRatio: "1:1",
  },
  {
    id: "gpt-image-2",
    label: "GPT Image 2",
    description: "Nouvelle génération du modèle image d'OpenAI — dimensions plus libres que GPT Image 1.5.",
    supportsSourceImage: true,
    aspectRatios: COMMON_ASPECT_RATIOS,
    defaultAspectRatio: "1:1",
  },
  {
    id: "nano-banana",
    label: "Nano Banana Pro (Gemini)",
    description: "Modèle image le plus avancé de Google (Gemini) — bon rendu photoréaliste et édition précise.",
    supportsSourceImage: true,
    // Presets fixes (pas de dimensions libres) — confirmé le 2026-09-16, cf.
    // _shared/studio-models.ts.
    aspectRatios: FIXED_PRESET_ASPECT_RATIOS,
    defaultAspectRatio: "1:1",
  },
  {
    id: "nano-banana-2",
    label: "Nano Banana 2 (Gemini)",
    description: "Nouvelle génération Nano Banana (Google Gemini).",
    supportsSourceImage: true,
    aspectRatios: FIXED_PRESET_ASPECT_RATIOS,
    defaultAspectRatio: "1:1",
  },
  {
    id: "recraft-v4-pro",
    label: "Recraft V4 Pro",
    description: "Rendu graphique/illustration haut de gamme (Recraft) — texte seul uniquement.",
    supportsSourceImage: false,
    aspectRatios: FIXED_PRESET_ASPECT_RATIOS,
    defaultAspectRatio: "1:1",
  },
  {
    id: "recraft-v4-pro-vector",
    label: "Recraft V4 Pro Vector",
    description: "Variante Recraft V4 Pro qui génère un visuel vectoriel (SVG) — texte seul uniquement.",
    supportsSourceImage: false,
    aspectRatios: FIXED_PRESET_ASPECT_RATIOS,
    defaultAspectRatio: "1:1",
  },
  {
    id: "seedream-4-5",
    label: "Seedream 4.5",
    description: "Modèle image de ByteDance — dimensions très libres, jusqu'à 14 images de référence.",
    supportsSourceImage: true,
    aspectRatios: COMMON_ASPECT_RATIOS,
    defaultAspectRatio: "4:3",
  },
  {
    id: "seedream-5-lite",
    label: "Seedream 5.0 Lite",
    description: "Modèle image de ByteDance, version rapide.",
    supportsSourceImage: true,
    aspectRatios: FIXED_PRESET_ASPECT_RATIOS,
    defaultAspectRatio: "1:1",
  },
  {
    id: "runway-gen4-image",
    label: "Runway Gen-4 Image",
    description: "Modèle image de Runway ML.",
    supportsSourceImage: true,
    aspectRatios: FIXED_PRESET_ASPECT_RATIOS,
    defaultAspectRatio: "16:9",
  },
  {
    id: "imagineart-1-5-pro",
    label: "ImagineArt 1.5 Pro",
    description: "Modèle image ImagineArt, rendu en très haute définition — texte seul uniquement.",
    supportsSourceImage: false,
    aspectRatios: FIXED_PRESET_ASPECT_RATIOS,
    defaultAspectRatio: "1:1",
  },
  {
    id: "wan27-image-pro",
    label: "Wan2.7 Image Pro",
    description: "Modèle image d'Alibaba.",
    supportsSourceImage: true,
    aspectRatios: COMMON_ASPECT_RATIOS,
    defaultAspectRatio: "4:3",
  },
  {
    id: "z-image-turbo",
    label: "Z-Image-Turbo",
    description: "Modèle image d'Alibaba, génération très rapide.",
    supportsSourceImage: true,
    aspectRatios: COMMON_ASPECT_RATIOS,
    defaultAspectRatio: "4:3",
  },
  {
    id: "z-image",
    label: "Z-Image",
    description: "Modèle image d'Alibaba, version standard.",
    supportsSourceImage: true,
    aspectRatios: COMMON_ASPECT_RATIOS,
    defaultAspectRatio: "4:3",
  },
  {
    id: "kling-image",
    label: "Kling IMAGE 3.0",
    description: "Modèle image de KlingAI — texte seul ou à partir d'une image source (Image-to-Image).",
    supportsSourceImage: true,
    // Presets fixes (pas de dimensions libres) — confirmé le 2026-09-16, cf.
    // _shared/studio-models.ts.
    aspectRatios: FIXED_PRESET_ASPECT_RATIOS,
    defaultAspectRatio: "1:1",
  },
  {
    id: "kling-image-o3",
    label: "Kling IMAGE O3",
    description: "Modèle image de KlingAI, nouvelle génération.",
    supportsSourceImage: true,
    aspectRatios: FIXED_PRESET_ASPECT_RATIOS,
    defaultAspectRatio: "1:1",
  },
  {
    id: "qwen-image-2512",
    label: "Qwen-Image-2512",
    description: "Modèle image d'Alibaba (Qwen).",
    supportsSourceImage: true,
    aspectRatios: COMMON_ASPECT_RATIOS,
    defaultAspectRatio: "4:3",
  },
  {
    id: "uni-1",
    label: "UNI-1",
    description: "Modèle image de Luma AI.",
    supportsSourceImage: true,
    aspectRatios: FIXED_PRESET_ASPECT_RATIOS,
    defaultAspectRatio: "1:1",
  },
  {
    id: "stable-diffusion-3",
    label: "Stable Diffusion 3",
    description: "Modèle image de Stability AI.",
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

// Convertit un ratio "L:H" en valeur CSS aspect-ratio ("L / H") — utilisé pour
// dimensionner chaque tuile de la galerie selon le format réel de la
// génération (portrait/paysage/carré), au lieu d'un cadre fixe qui recadre.
export function aspectRatioToCss(ratio: string | null | undefined): string {
  const [w, h] = (ratio ?? "").split(":").map(Number);
  return w > 0 && h > 0 ? `${w} / ${h}` : "1 / 1";
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
