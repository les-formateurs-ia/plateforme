// Catalogue image Runware (remplace Higgsfield). Modèles FLUX natifs Runware
// + modèles tiers (OpenAI GPT Image, Google Gemini/Nano Banana) ajoutés le
// 2026-09-14 à la demande explicite des élèves. ATTENTION : au 2026-09-12,
// tout modèle tiers renvoyait thirdPartyInsufficientCredits en direct — ce
// compte Runware n'a pas de carte enregistrée + solde ≥5$
// (https://my.runware.ai/wallet). gpt-image/nano-banana sont donc câblés et
// prêts, mais resteront en erreur pour les élèves tant que le compte n'est
// pas crédité ; ce n'est pas un bug côté code, l'erreur Runware renvoyée au
// client le dit explicitement (cf. ERROR_MESSAGES dans _shared/runware.ts).
// Identifiants AIR + tailles/paramètres sourcés depuis la doc officielle
// Runware (runware.ai/docs/models/openai-gpt-image-1-5 et
// .../google-nano-banana-pro) — non testés de bout en bout faute de compte
// crédité, à valider une fois le solde disponible.
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
  // GPT Image 1.5 (OpenAI) n'accepte que 3 tailles fixes — on choisit la
  // plus proche du ratio demandé plutôt que les dimensions FLUX arbitraires.
  // Image source passée via `referenceImages` (pas seedImage/strength, qui
  // sont spécifiques aux modèles FLUX/Runware natifs).
  "gpt-image": {
    runwareModel: "openai:4@1",
    supportsSourceImage: true,
    buildTask: ({ prompt, width, height, sourceImageUrl }) => {
      const ratio = width / height;
      const [w, h] = ratio > 1.15 ? [1536, 1024] : ratio < 0.87 ? [1024, 1536] : [1024, 1024];
      return {
        taskType: "imageInference",
        model: "openai:4@1",
        positivePrompt: prompt,
        width: w,
        height: h,
        ...(sourceImageUrl ? { referenceImages: [sourceImageUrl] } : {}),
      };
    },
  },
  // Nano Banana Pro (Gemini 3 Pro Image Preview, Google) — dimensions libres
  // (multiples de 64 comme FLUX), image source via `referenceImages`.
  "nano-banana": {
    runwareModel: "google:4@2",
    supportsSourceImage: true,
    buildTask: ({ prompt, width, height, sourceImageUrl }) => ({
      taskType: "imageInference",
      model: "google:4@2",
      positivePrompt: prompt,
      width,
      height,
      ...(sourceImageUrl ? { referenceImages: [sourceImageUrl] } : {}),
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
