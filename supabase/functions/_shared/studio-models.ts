// Modèles image réellement activés sur ce compte Higgsfield (vérifié en
// sondant l'API : Nano Banana et Flux Pro Kontext Max existent dans le
// catalogue mais renvoient "model_not_found" sur cette clé — probablement
// des add-ons non activés sur le plan actuel). À tenir en phase avec
// src/app/lib/studioImages.ts (même liste côté client).
export interface StudioModelConfig {
  path: string;
  aspectRatios: string[];
  supportsSourceImage: boolean;
  buildBody: (params: { prompt: string; aspectRatio: string; sourceImageUrl?: string }) => Record<string, unknown>;
}

export const STUDIO_MODELS: Record<string, StudioModelConfig> = {
  "soul-standard": {
    path: "/higgsfield-ai/soul/standard",
    aspectRatios: ["1:1", "4:3", "3:4", "3:2", "2:3", "5:4", "4:5", "16:9", "9:16", "21:9"],
    supportsSourceImage: false,
    buildBody: ({ prompt, aspectRatio }) => ({ prompt, aspect_ratio: aspectRatio }),
  },
  "popcorn-auto": {
    path: "/higgsfield-ai/popcorn/auto",
    aspectRatios: ["1:1", "4:3", "3:4", "3:2", "2:3", "16:9", "9:16"],
    supportsSourceImage: true,
    buildBody: ({ prompt, aspectRatio, sourceImageUrl }) => ({
      prompt,
      aspect_ratio: aspectRatio,
      ...(sourceImageUrl ? { image_urls: [sourceImageUrl] } : {}),
    }),
  },
};

export const HIGGSFIELD_BASE_URL = "https://api.higgsfield.ai";
