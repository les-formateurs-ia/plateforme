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

// Contraintes de dimensions par modèle "à dimensions libres" — nécessaire car
// nos ASPECT_RATIO_DIMENSIONS partagées (~1024-1344px, pensées pour les FLUX)
// ne respectent PAS forcément les bornes des modèles tiers, qui peuvent
// exiger une résolution beaucoup plus grande. Constaté en direct le
// 2026-09-14 sur Seedream 4.5 : erreur Runware "Invalid image pixels. Total
// pixels (width x height) must be between 3686400 and 16777216" (= entre
// 2560x1440 et 4096x4096) alors qu'on envoyait ~1024x1024 (1.05MP, bien en
// dessous du minimum). D'où minArea/maxArea ci-dessous en plus de
// minSide/maxSide (limites par côté, sourcées depuis la doc officielle).
interface DimensionConstraints { minSide?: number; maxSide?: number; minArea?: number; maxArea?: number; step?: number }

// Redimensionne (en conservant le ratio) pour respecter les bornes du modèle,
// puis arrondit au multiple de `step` le plus proche (16 par défaut, comme
// l'exige la plupart des modèles Runware à dimensions libres).
function fitDimensions(width: number, height: number, c?: DimensionConstraints): { width: number; height: number } {
  if (!c) return { width, height };
  const step = c.step ?? 16;
  const area = width * height;
  let scale = 1;
  if (c.minArea && area * scale * scale < c.minArea) scale = Math.sqrt(c.minArea / area);
  if (c.maxArea && area * scale * scale > c.maxArea) scale = Math.min(scale, Math.sqrt(c.maxArea / area));
  let w = width * scale;
  let h = height * scale;
  if (c.minSide) {
    const need = c.minSide / Math.min(w, h);
    if (need > 1) { w *= need; h *= need; }
  }
  if (c.maxSide) {
    const need = c.maxSide / Math.max(w, h);
    if (need < 1) { w *= need; h *= need; }
  }
  const round = (n: number) => Math.max(step, Math.round(n / step) * step);
  return { width: round(w), height: round(h) };
}

// Modèles à dimensions libres (multiples de 16/64 dans une plage min/max) qui
// acceptent une image source via seedImage+strength (style FLUX.1 "natif").
function seedImageTask(modelId: string, constraints?: DimensionConstraints) {
  return ({ prompt, width, height, sourceImageUrl }: { prompt: string; width: number; height: number; sourceImageUrl?: string }) => {
    const dims = fitDimensions(width, height, constraints);
    return {
      taskType: "imageInference",
      model: modelId,
      positivePrompt: prompt,
      width: dims.width,
      height: dims.height,
      ...(sourceImageUrl ? { seedImage: sourceImageUrl, strength: 0.75 } : {}),
    };
  };
}

// Modèles à dimensions libres qui acceptent une image source via
// referenceImages (FLUX.2, Google, OpenAI, ByteDance, Alibaba récents...).
function referenceImageTask(modelId: string, constraints?: DimensionConstraints) {
  return ({ prompt, width, height, sourceImageUrl }: { prompt: string; width: number; height: number; sourceImageUrl?: string }) => {
    const dims = fitDimensions(width, height, constraints);
    return {
      taskType: "imageInference",
      model: modelId,
      positivePrompt: prompt,
      width: dims.width,
      height: dims.height,
      ...(sourceImageUrl ? { referenceImages: [sourceImageUrl] } : {}),
    };
  };
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
  "flux2-pro": { runwareModel: "bfl:5@1", supportsSourceImage: true, buildTask: referenceImageTask("bfl:5@1", { minSide: 256, maxSide: 2048, step: 16 }) },
  "flux2-max": { runwareModel: "bfl:7@1", supportsSourceImage: true, buildTask: referenceImageTask("bfl:7@1", { minSide: 256, maxSide: 2048, step: 16 }) },
  "flux2-flex": { runwareModel: "bfl:6@1", supportsSourceImage: true, buildTask: referenceImageTask("bfl:6@1", { minSide: 256, maxSide: 2048, step: 16 }) },
  "flux2-dev": { runwareModel: "runware:400@1", supportsSourceImage: true, buildTask: referenceImageTask("runware:400@1", { minSide: 512, maxSide: 2048, step: 16 }) },
  "flux2-klein-9b": { runwareModel: "runware:400@2", supportsSourceImage: true, buildTask: referenceImageTask("runware:400@2", { minSide: 128, maxSide: 2048, step: 16 }) },
  "flux2-klein-9b-base": { runwareModel: "runware:400@3", supportsSourceImage: true, buildTask: referenceImageTask("runware:400@3", { minSide: 128, maxSide: 2048, step: 16 }) },

  // -- Google Gemini -- Vérifié le 2026-09-16 (runware.ai/docs/models/google-
  // nano-banana-pro et .../google-nano-banana-2) : PAS de dimensions libres —
  // Runware n'accepte que des combinaisons largeur/hauteur fixes par palier
  // (1K/2K/4K pour Nano Banana Pro ; 0.5K/1K/2K/4K pour Nano Banana 2), même
  // format que Kling/Recraft/ImagineArt ci-dessous. Nos dimensions par défaut
  // (~1024-1344px) ne correspondent à AUCUNE combinaison exacte du tableau
  // (ex. 16:9 → 1344x768 chez nous vs 1376x768 documenté) : même risque
  // d'erreur "Invalid image pixels" que Seedream 4.5. On bascule donc sur
  // fixedPresetTask avec le palier 2K (16:9 documenté = 2752x1536, identique
  // pour les deux modèles).
  "nano-banana": {
    // Nano Banana Pro.
    runwareModel: "google:4@2",
    supportsSourceImage: true,
    buildTask: fixedPresetTask("google:4@2", { landscape: [2752, 1536], portrait: [1536, 2752], square: [2048, 2048] }, "referenceImages"),
  },
  "nano-banana-2": {
    runwareModel: "google:4@3",
    supportsSourceImage: true,
    buildTask: fixedPresetTask("google:4@3", { landscape: [2752, 1536], portrait: [1536, 2752], square: [2048, 2048] }, "referenceImages"),
  },

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
  // GPT Image 2 — dimensions libres 16–3840px (16px), aire 655 360–8 294 400px².
  // Confiance haute — revérifié le 2026-09-16 (runware.ai/docs/models/openai-
  // gpt-image-2, corroboré par la doc OpenAI officielle) : bornes inchangées.
  "gpt-image-2": { runwareModel: "openai:gpt-image@2", supportsSourceImage: true, buildTask: referenceImageTask("openai:gpt-image@2", { minSide: 16, maxSide: 3840, minArea: 655360, maxArea: 8294400, step: 16 }) },

  // -- Alibaba --
  "z-image-turbo": { runwareModel: "runware:z-image@turbo", supportsSourceImage: true, buildTask: seedImageTask("runware:z-image@turbo", { minSide: 128, maxSide: 2048, step: 16 }) },
  // Confiance haute — revérifié le 2026-09-16 (runware.ai/docs/models/alibaba-
  // z-image) : AIR et bornes (128-2048px par côté, step 16) confirmés inchangés.
  "z-image": { runwareModel: "runware:z-image@0", supportsSourceImage: true, buildTask: seedImageTask("runware:z-image@0", { minSide: 128, maxSide: 2048, step: 16 }) },
  "qwen-image-2512": { runwareModel: "alibaba:qwen-image@2512", supportsSourceImage: true, buildTask: seedImageTask("alibaba:qwen-image@2512", { minSide: 256, maxSide: 2048, step: 16 }) },
  // Dimensions libres 768–4096px, plafonnées à 2048px dès qu'une image de
  // référence est fournie (notre UI permet toujours cette option) — on
  // applique donc la borne 2048 dans tous les cas, plus simple et sûr.
  "wan27-image-pro": { runwareModel: "alibaba:wan@2.7-image-pro", supportsSourceImage: true, buildTask: referenceImageTask("alibaba:wan@2.7-image-pro", { minSide: 768, maxSide: 2048, step: 16 }) },

  // -- Luma --
  // Presets fixes ~3K uniquement (pas de dimensions libres).
  "uni-1": {
    runwareModel: "luma:uni@1",
    supportsSourceImage: true,
    buildTask: fixedPresetTask("luma:uni@1", { landscape: [2464, 1696], portrait: [1504, 2784], square: [2048, 2048] }, "referenceImages"),
  },

  // -- Stability AI --
  "stable-diffusion-3": { runwareModel: "runware:5@1", supportsSourceImage: true, buildTask: seedImageTask("runware:5@1", { minSide: 128, maxSide: 2048, step: 16 }) },

  // -- Recraft (sortie vectorielle pour la variante Vector — cf. gestion SVG
  // dans finalizeRunwareResult, _shared/runware.ts). Pas d'image-to-image
  // documentée pour ces deux modèles. --
  "recraft-v4-pro": {
    // Confiance haute — revérifié le 2026-09-16 (runware.ai/docs/models/
    // recraft-v4-pro) : AIR et presets 2K (2688x1536 / 1536x2688 / 2048x2048)
    // confirmés inchangés.
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
  // Seedream 4.5 : dimensions libres jusqu'à 16383px par côté, MAIS l'aire
  // totale doit rester entre 3 686 400 et 16 777 216 px² (= entre 2560x1440
  // et 4096x4096) — confirmé en direct le 2026-09-14 via l'erreur Runware
  // "Invalid image pixels. Total pixels (width x height) must be between
  // 3686400 and 16777216." (nos dimensions par défaut ~1024x1024 étaient
  // bien en dessous du minimum, d'où l'échec).
  "seedream-4-5": { runwareModel: "bytedance:seedream@4.5", supportsSourceImage: true, buildTask: referenceImageTask("bytedance:seedream@4.5", { minArea: 3686400, maxArea: 16777216, step: 32 }) },
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
    // Confiance haute — revérifié le 2026-09-16 (runware.ai/docs/models/
    // imagineart-1-5-pro) : presets (5120x2880 / 2880x5120 / 4096x4096)
    // confirmés inchangés.
    runwareModel: "imagineart:1.5-pro@0",
    supportsSourceImage: false,
    buildTask: fixedPresetTask("imagineart:1.5-pro@0", { landscape: [5120, 2880], portrait: [2880, 5120], square: [4096, 4096] }, null),
  },

  // -- KlingAI -- Vérifié le 2026-09-16 (runware.ai/docs/models/klingai-image-
  // 3-0 et .../klingai-image-o3) : les deux modèles n'ont PAS de dimensions
  // libres, seulement des combinaisons fixes par palier (1K/2K/4K) — même
  // constat que Nano Banana ci-dessus. kling-image utilisait jusqu'ici
  // referenceImageTask sans contraintes (dimensions ~1024-1344px envoyées
  // telles quelles, ne correspondant à aucune combinaison du tableau) ; on
  // bascule sur fixedPresetTask, palier 2K (16:9 documenté = 2720x1536).
  "kling-image": {
    // Kling Image 3.0.
    runwareModel: "klingai:kling-image@3",
    supportsSourceImage: true,
    buildTask: fixedPresetTask("klingai:kling-image@3", { landscape: [2720, 1536], portrait: [1536, 2720], square: [2048, 2048] }, "referenceImages"),
  },
  "kling-image-o3": {
    // Presets fixes par ratio (1K/2K/4K) — on prend le palier 2K. Valeurs
    // landscape/portrait corrigées le 2026-09-16 : le tableau officiel donne
    // 2720x1536 pour le 16:9 en 2K (pas 2560x1440, qui ne figure dans aucun
    // palier documenté — erreur du même type que Seedream 4.5).
    runwareModel: "klingai:kling-image@o3",
    supportsSourceImage: true,
    buildTask: fixedPresetTask("klingai:kling-image@o3", { landscape: [2720, 1536], portrait: [1536, 2720], square: [2048, 2048] }, "referenceImages"),
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
  // Ajoutés le 2026-09-16 (cf. commentaires ci-dessus) : nano-banana(-2) et
  // kling-image se sont avérés être des modèles à presets fixes, pas à
  // dimensions libres.
  "nano-banana": FIXED_PRESET_ASPECT_RATIOS,
  "nano-banana-2": FIXED_PRESET_ASPECT_RATIOS,
  "kling-image": FIXED_PRESET_ASPECT_RATIOS,
};

export function aspectRatiosForModel(modelId: string): string[] {
  return MODEL_ASPECT_RATIOS[modelId] ?? FULL_ASPECT_RATIOS;
}
