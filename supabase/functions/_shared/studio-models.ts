// Catalogue image Runware (remplace Higgsfield). Seuls des modèles FLUX
// natifs Runware sont proposés : les modèles tiers (Google Nano Banana,
// OpenAI GPT Image, Ideogram...) exigent un solde Runware crédité, testé
// en direct le 2026-09-12 (thirdPartyInsufficientCredits sur ce compte).
// À réévaluer une fois le compte alimenté (https://my.runware.ai/wallet).
// À tenir en phase avec src/app/lib/studioImages.ts (même liste côté client).
export interface StudioModelConfig {
  runwareModel: string;
  supportsSourceImage: boolean;
  buildTask: (params: { prompt: string; width: number; height: number; sourceImageUrl?: string }) => Record<string, unknown>;
}

export const STUDIO_MODELS: Record<string, StudioModelConfig> = {
  "flux-dev": {
    runwareModel: "runware:101@1",
    supportsSourceImage: true,
    buildTask: ({ prompt, width, height, sourceImageUrl }) => ({
      taskType: "imageInference",
      model: "runware:101@1",
      positivePrompt: prompt,
      width,
      height,
      ...(sourceImageUrl ? { seedImage: sourceImageUrl, strength: 0.75 } : {}),
    }),
  },
  "flux-schnell": {
    runwareModel: "runware:100@1",
    supportsSourceImage: true,
    buildTask: ({ prompt, width, height, sourceImageUrl }) => ({
      taskType: "imageInference",
      model: "runware:100@1",
      positivePrompt: prompt,
      width,
      height,
      ...(sourceImageUrl ? { seedImage: sourceImageUrl, strength: 0.75 } : {}),
    }),
  },
};

// Runware travaille en pixels (largeur/hauteur, pas de ratio nommé côté
// API) — on garde un sélecteur de ratio côté élève et on traduit ici vers
// des dimensions concrètes (multiples de 64, comme l'exige FLUX).
export const ASPECT_RATIO_DIMENSIONS: Record<string, { width: number; height: number }> = {
  "1:1": { width: 1024, height: 1024 },
  "4:3": { width: 1152, height: 896 },
  "3:4": { width: 896, height: 1152 },
  "3:2": { width: 1216, height: 832 },
  "2:3": { width: 832, height: 1216 },
  "16:9": { width: 1344, height: 768 },
  "9:16": { width: 768, height: 1344 },
};
