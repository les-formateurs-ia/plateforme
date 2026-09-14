// Catalogue image Runware (remplace Higgsfield). Modèles FLUX natifs Runware
// + catalogue complet demandé le 2026-09-14 (23 modèles tiers, cf.
// src/app/lib/studioImages.ts — à garder en phase avec ce fichier).
// ATTENTION : au 2026-09-12, tout modèle tiers renvoyait
// thirdPartyInsufficientCredits en direct — ce compte Runware n'a pas de
// carte enregistrée + solde ≥5$ (https://my.runware.ai/wallet). Tous les
// modèles tiers ci-dessous sont donc câblés et prêts, mais resteront en
// erreur pour les élèves tant que le compte n'est pas crédité ; ce n'est pas
// un bug côté code, l'erreur Runware renvoyée au client le dit explicitement
// (cf. ERROR_MESSAGES dans _shared/runware.ts). Seuls flux-dev/flux-schnell
// (natifs Runware, préfixe "runware:") fonctionnent sans solde crédité.
//
// AIR identifiers + contraintes de dimensions sourcés depuis la doc
// officielle Runware (runware.ai/docs/models/...) le 2026-09-14, avec
// vérification croisée (2+ fetches indépendants par modèle) pour la plupart.
// Modèles marqués "confiance faible" ci-dessous n'ont qu'une seule source —
// à valider en priorité une fois le compte crédité. Non testés de bout en
// bout faute de compte crédité (sauf flux-dev/flux-schnell).
export interface StudioModelConfig {
  runwareModel: string;
  supportsSourceImage: boolean;
  buildTask: (params: { prompt: string; width: number; height: number; sourceImageUrl?: string }) => Record<string, unknown>;
}

// -- Helpers de construction de tâche (évite la répétition sur ~20 modèles) --

// Modèles à dimensions libres (multiples de 16/64 dans une plage min/max) qui
// acceptent une image source via seedImage+strength (style FLUX.1 "natif").
function seedImageTask(modelId: string) {
  return ({ prompt, width, height, sourceImageUrl }: { prompt: string; width: number; height: number; sourceImageUrl?: string }) => ({
    taskType: "imageInference",
    model: modelId,
    positivePrompt: prompt,
    width,
    height,
    ...(sourceImageUrl ? { seedImage: sourceImageUrl, strength: 0.75 } : {}),
  });
}

// Modèles à dimensions libres qui acceptent une image source via
// referenceImages (FLUX.2, Google, OpenAI, ByteDance, Alibaba récents...).
function referenceImageTask(modelId: string) {
  return ({ prompt, width, height, sourceImageUrl }: { prompt: string; width: number; height: number; sourceImageUrl?: string }) => ({
    taskType: "imageInference",
    model: modelId,
    positivePrompt: prompt,
    width,
    height,
    ...(sourceImageUrl ? { referenceImages: [sourceImageUrl] } : {}),
  });
}

// Modèles sans dimensions libres : Runware n'accepte qu'une liste fermée de
// résolutions (ex. presets "2K"/"4K"). On choisit le preset le plus proche du
// ratio demandé (paysage / portrait / carré), même logique que gpt-image
// ci-dessous. Presets sourcés depuis des exemples de la doc (pas une liste
// exhaustive officielle) — best-effort, à valider une fois le compte crédité.
interface FixedPresets { landscape: [number, number]; portrait: [number, number]; square: [number, number] }

function pickPreset(width: number, height: number, presets: FixedPresets): [number, number] {
  const ratio = width / height;
  return ratio > 1.15 ? presets.landscape : ratio < 0.87 ? presets.portrait : presets.square;
}

function fixedPresetTask(modelId: string, presets: FixedPresets, sourceImageParam: "referenceImages" | null) {
  return ({ prompt, width, height, sourceImageUrl }: { prompt: string; width: number; height: number; sourceImageUrl?: string }) => {
    const [w, h] = pickPreset(width, height, presets);
    return {
      taskType: "imageInference",
      model: modelId,
      positivePrompt: prompt,
      width: w,
      height: h,
      ...(sourceImageUrl && sourceImageParam ? { [sourceImageParam]: [sourceImageUrl] } : {}),
    };
  };
}

export const STUDIO_MODELS: Record<string, StudioModelConfig> = {
  // -- FLUX.1 natifs Runware (fonctionnent sans solde crédité) --
  "flux-dev": { runwareModel: "runware:101@1", supportsSourceImage: true, buildTask: seedImageTask("runware:101@1") },
  "flux-schnell": { runwareModel: "runware:100@1", supportsSourceImage: true, buildTask: seedImageTask("runware:100@1") },

  // -- FLUX.2 (Black Forest Labs) — pro/max/flex passent par bfl: (passthrough
  // direct BFL), dev/klein sont hébergés nativement par Runware (runware:400@N),
  // tous en dimensions libres 128/256/512–2048px (16px), referenceImages. --
  "flux2-pro": { runwareModel: "bfl:5@1", supportsSourceImage: true, buildTask: referenceImageTask("bfl:5@1") },
  "flux2-max": { runwareModel: "bfl:7@1", supportsSourceImage: true, buildTask: referenceImageTask("bfl:7@1") },
  "flux2-flex": { runwareModel: "bfl:6@1", supportsSourceImage: true, buildTask: referenceImageTask("bfl:6@1") },
  "flux2-dev": { runwareModel: "runware:400@1", supportsSourceImage: true, buildTask: referenceImageTask("runware:400@1") },
  "flux2-klein-9b": { runwareModel: "runware:400@2", supportsSourceImage: true, buildTask: referenceImageTask("runware:400@2") },
  "flux2-klein-9b-base": { runwareModel: "runware:400@3", supportsSourceImage: true, buildTask: referenceImageTask("runware:400@3") },

  // -- Google Gemini --
  "nano-banana": { runwareModel: "google:4@2", supportsSourceImage: true, buildTask: referenceImageTask("google:4@2") }, // Nano Banana Pro
  "nano-banana-2": { runwareModel: "google:4@3", supportsSourceImage: true, buildTask: referenceImageTask("google:4@3") },

  // -- OpenAI --
  "gpt-image": {
    // GPT Image 1.5 — 3 tailles fixes seulement.
    runwareModel: "openai:4@1",
    supportsSourceImage: true,
    buildTask: ({ prompt, width, height, sourceImageUrl }) => {
      const ratio = width / height;
      const [w, h] = ratio > 1.15 ? [1536, 1024] : ratio < 0.87 ? [1024, 1536] : [1024, 1024];
      return { taskType: "imageInference", model: "openai:4@1", positivePrompt: prompt, width: w, height: h, ...(sourceImageUrl ? { referenceImages: [sourceImageUrl] } : {}) };
    },
  },
  // GPT Image 2 — dimensions libres 16–3840px (16px), contrairement à la 1.5.
  "gpt-image-2": { runwareModel: "openai:gpt-image@2", supportsSourceImage: true, buildTask: referenceImageTask("openai:gpt-image@2") },

  // -- Alibaba --
  "z-image-turbo": { runwareModel: "runware:z-image@turbo", supportsSourceImage: true, buildTask: seedImageTask("runware:z-image@turbo") },
  // Confiance faible (une seule source doc) — AIR à revalider.
  "z-image": { runwareModel: "runware:z-image@0", supportsSourceImage: true, buildTask: seedImageTask("runware:z-image@0") },
  "qwen-image-2512": { runwareModel: "alibaba:qwen-image@2512", supportsSourceImage: true, buildTask: seedImageTask("alibaba:qwen-image@2512") },
  // Dimensions libres 768–4096px mais plafonnées à 2048px avec referenceImages
  // — nos ASPECT_RATIO_DIMENSIONS (≤1344px) respectent déjà cette limite.
  "wan27-image-pro": { runwareModel: "alibaba:wan@2.7-image-pro", supportsSourceImage: true, buildTask: referenceImageTask("alibaba:wan@2.7-image-pro") },

  // -- Luma --
  // Presets fixes ~3K uniquement (pas de dimensions libres).
  "uni-1": {
    runwareModel: "luma:uni@1",
    supportsSourceImage: true,
    buildTask: fixedPresetTask("luma:uni@1", { landscape: [2464, 1696], portrait: [1504, 2784], square: [2048, 2048] }, "referenceImages"),
  },

  // -- Stability AI --
  "stable-diffusion-3": { runwareModel: "runware:5@1", supportsSourceImage: true, buildTask: seedImageTask("runware:5@1") },

  // -- Recraft (sortie vectorielle pour la variante Vector — cf. gestion SVG
  // dans finalizeRunwareResult, _shared/runware.ts). Pas d'image-to-image
  // documentée pour ces deux modèles. --
  "recraft-v4-pro": {
    // Confiance faible (une seule source doc, AIR à revalider).
    runwareModel: "recraft:v4-pro@0",
    supportsSourceImage: false,
    buildTask: fixedPresetTask("recraft:v4-pro@0", { landscape: [2688, 1536], portrait: [1536, 2688], square: [2048, 2048] }, null),
  },
  "recraft-v4-pro-vector": {
    runwareModel: "recraft:v4-pro@vector",
    supportsSourceImage: false,
    buildTask: fixedPresetTask("recraft:v4-pro@vector", { landscape: [2688, 1536], portrait: [1536, 2688], square: [2048, 2048] }, null),
  },

  // -- ByteDance --
  // Seedream 4.5 : dimensions libres jusqu'à 16383px.
  "seedream-4-5": { runwareModel: "bytedance:seedream@4.5", supportsSourceImage: true, buildTask: referenceImageTask("bytedance:seedream@4.5") },
  // Seedream 5.0 Lite : presets fixes 2K/3K uniquement.
  "seedream-5-lite": {
    runwareModel: "bytedance:seedream@5.0-lite",
    supportsSourceImage: true,
    buildTask: fixedPresetTask("bytedance:seedream@5.0-lite", { landscape: [2848, 1600], portrait: [1600, 2848], square: [2048, 2048] }, "referenceImages"),
  },

  // -- Runway ML --
  "runway-gen4-image": {
    runwareModel: "runway:4@1",
    supportsSourceImage: true,
    buildTask: fixedPresetTask("runway:4@1", { landscape: [1920, 1080], portrait: [1080, 1920], square: [1024, 1024] }, "referenceImages"),
  },

  // -- ImagineArt --
  "imagineart-1-5-pro": {
    // Presets fixes 4K uniquement ; support image-to-image non documenté,
    // on ne l'active pas pour éviter un paramètre refusé par l'API.
    runwareModel: "imagineart:1.5-pro@0",
    supportsSourceImage: false,
    buildTask: fixedPresetTask("imagineart:1.5-pro@0", { landscape: [5120, 2880], portrait: [2880, 5120], square: [4096, 4096] }, null),
  },

  // -- KlingAI --
  "kling-image": { runwareModel: "klingai:kling-image@3", supportsSourceImage: true, buildTask: referenceImageTask("klingai:kling-image@3") }, // Kling Image 3.0
  "kling-image-o3": {
    // Presets fixes par ratio (1K/2K/4K) — on prend le palier 2K.
    runwareModel: "klingai:kling-image@o3",
    supportsSourceImage: true,
    buildTask: fixedPresetTask("klingai:kling-image@o3", { landscape: [2560, 1440], portrait: [1440, 2560], square: [2048, 2048] }, "referenceImages"),
  },
};

// Runware travaille en pixels (largeur/hauteur, pas de ratio nommé côté
// API) — on garde un sélecteur de ratio côté élève et on traduit ici vers
// des dimensions concrètes (multiples de 64, comme l'exige FLUX). Utilisé
// par tous les modèles à dimensions libres (cf. seedImageTask/referenceImageTask
// ci-dessus) ; les modèles à presets fixes ignorent ces valeurs sauf pour en
// déduire le ratio (paysage/portrait/carré, voir pickPreset).
export const ASPECT_RATIO_DIMENSIONS: Record<string, { width: number; height: number }> = {
  "1:1": { width: 1024, height: 1024 },
  "4:3": { width: 1152, height: 896 },
  "3:4": { width: 896, height: 1152 },
  "3:2": { width: 1216, height: 832 },
  "2:3": { width: 832, height: 1216 },
  "16:9": { width: 1344, height: 768 },
  "9:16": { width: 768, height: 1344 },
};

// Formats disponibles par modèle : les modèles à presets fixes (cf.
// fixedPresetTask ci-dessus) ne mappent que 3 ratios (paysage/portrait/carré)
// vers un seul preset chacun — inutile de proposer les 7 ratios communs, ça
// ne changerait pas le résultat et induirait l'élève en erreur. Les modèles à
// dimensions libres proposent les 7 ratios communs.
const FULL_ASPECT_RATIOS = Object.keys(ASPECT_RATIO_DIMENSIONS);
const FIXED_PRESET_ASPECT_RATIOS = ["16:9", "9:16", "1:1"];

export const MODEL_ASPECT_RATIOS: Record<string, string[]> = {
  "recraft-v4-pro": FIXED_PRESET_ASPECT_RATIOS,
  "recraft-v4-pro-vector": FIXED_PRESET_ASPECT_RATIOS,
  "seedream-5-lite": FIXED_PRESET_ASPECT_RATIOS,
  "runway-gen4-image": FIXED_PRESET_ASPECT_RATIOS,
  "imagineart-1-5-pro": FIXED_PRESET_ASPECT_RATIOS,
  "kling-image-o3": FIXED_PRESET_ASPECT_RATIOS,
  "uni-1": FIXED_PRESET_ASPECT_RATIOS,
};

export function aspectRatiosForModel(modelId: string): string[] {
  return MODEL_ASPECT_RATIOS[modelId] ?? FULL_ASPECT_RATIOS;
}
