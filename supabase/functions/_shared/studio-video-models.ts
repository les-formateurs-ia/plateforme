// Modèles vidéo réellement activés sur ce compte Higgsfield (vérifiés en
// sondant l'API : Veo3.1, Seedance et Sora-2 existent dans le catalogue mais
// renvoient model_not_found/model_disabled sur cette clé). Aucun de ces
// modèles n'expose de ratio d'aspect configurable (contrairement aux modèles
// image) : Kling et Dop héritent du ratio de l'image source, Hailuo et Wan
// rendent dans un ratio fixe côté Higgsfield. À tenir en phase avec
// src/app/lib/studioVideos.ts.
export interface StudioVideoOption {
  key: string;
  label: string;
  choices: string[];
  default: string;
  numeric?: boolean; // envoyer la valeur en nombre plutôt qu'en chaîne
}

export interface StudioVideoModelConfig {
  supportsSourceImage: boolean;
  requiresSourceImage: boolean;
  options: StudioVideoOption[];
  pathFor: (hasImage: boolean) => string;
  buildBody: (params: { prompt: string; sourceImageUrl?: string; optionValues: Record<string, string> }) => Record<string, unknown>;
}

export const STUDIO_VIDEO_MODELS: Record<string, StudioVideoModelConfig> = {
  "hailuo-02-standard": {
    supportsSourceImage: true,
    requiresSourceImage: false,
    options: [{ key: "duration", label: "Durée", choices: ["6", "10"], default: "6", numeric: true }],
    pathFor: (hasImage) => (hasImage ? "/minimax/hailuo-02/standard/image-to-video" : "/minimax/hailuo-02/standard/text-to-video"),
    buildBody: ({ prompt, sourceImageUrl, optionValues }) => ({
      prompt,
      duration: Number(optionValues.duration ?? "6"),
      ...(sourceImageUrl ? { image_url: sourceImageUrl } : {}),
    }),
  },
  "kling-v21-standard": {
    supportsSourceImage: true,
    requiresSourceImage: true,
    options: [{ key: "duration", label: "Durée", choices: ["5", "10"], default: "5", numeric: true }],
    pathFor: () => "/kling-video/v2.1/standard/image-to-video",
    buildBody: ({ prompt, sourceImageUrl, optionValues }) => ({
      prompt,
      image_url: sourceImageUrl,
      duration: Number(optionValues.duration ?? "5"),
    }),
  },
  "wan-25-preview": {
    supportsSourceImage: false,
    requiresSourceImage: false,
    options: [
      { key: "duration", label: "Durée", choices: ["5", "10"], default: "5", numeric: true },
      { key: "resolution", label: "Résolution", choices: ["480p", "720p", "1080p"], default: "720p" },
    ],
    pathFor: () => "/wan-25-preview/text-to-video",
    buildBody: ({ prompt, optionValues }) => ({
      prompt,
      duration: Number(optionValues.duration ?? "5"),
      resolution: optionValues.resolution ?? "720p",
    }),
  },
};
