// Catalogue vidéo Runware (remplace Higgsfield). Catalogue complet (21
// modèles demandés le 2026-09-14) — cf. src/app/lib/studioVideos.ts, à garder
// en phase avec ce fichier.
//
// BUG CORRIGÉ LE 2026-09-14 : jusqu'ici chaque modèle n'exposait qu'une seule
// résolution fixe (souvent paysage uniquement) — impossible de générer en
// portrait. Chaque modèle expose maintenant un "resolutions" (ratio -> w/h)
// et, s'il y a plusieurs ratios, une option "aspectRatio" ajoutée
// automatiquement (cf. ratioOption ci-dessous) qui réutilise le même
// mécanisme générique que l'option "duration" (validée dans
// generate-studio-video/index.ts, aucune modification nécessaire côté edge
// function : le choix de ratio arrive comme n'importe quelle autre option).
//
// Résolutions sourcées/vérifiées le 2026-09-14 : veo-3-1, kling, flux-video
// et sora-2 ont des résolutions confirmées HIGH confidence (multi-sources) ;
// les modèles marqués "best-effort" dans les commentaires ci-dessous n'ont
// qu'une seule source ou une liste non exhaustive — à valider une fois le
// compte Runware crédité (https://my.runware.ai/wallet). Testé bout en bout
// le 2026-09-12 (avant l'ajout du portrait) : "kling" (klingai:5@3, succès
// ~2min) ; Veo a été soumis sans erreur mais pas attendu jusqu'au bout.
export interface StudioVideoOption {
  key: string;
  label: string;
  choices: string[];
  default: string;
  numeric?: boolean;
}

export interface StudioVideoResolution { width: number; height: number }

export interface StudioVideoModelConfig {
  runwareModel: string;
  supportsSourceImage: boolean;
  requiresSourceImage: boolean;
  resolutions: Record<string, StudioVideoResolution>;
  defaultAspectRatio: string;
  options: StudioVideoOption[];
  buildTask: (params: { prompt: string; sourceImageUrl?: string; optionValues: Record<string, string> }) => Record<string, unknown>;
}

// Ajoute une option "aspectRatio" (rendue comme les autres options côté
// client, cf. StudioVideosPage.tsx) uniquement si le modèle propose plus d'un
// ratio — inutile de faire choisir un format à l'élève s'il n'y en a qu'un.
function ratioOption(resolutions: Record<string, StudioVideoResolution>, defaultRatio: string): StudioVideoOption[] {
  const choices = Object.keys(resolutions);
  return choices.length > 1 ? [{ key: "aspectRatio", label: "Format", choices, default: defaultRatio }] : [];
}

function resolveRatio(resolutions: Record<string, StudioVideoResolution>, defaultRatio: string, optionValues: Record<string, string>): StudioVideoResolution {
  const key = optionValues.aspectRatio && resolutions[optionValues.aspectRatio] ? optionValues.aspectRatio : defaultRatio;
  return resolutions[key];
}

// frameImages optionnel (image de référence facultative) — modèle générique
// réutilisé par la grande majorité des modèles vidéo tiers.
function framesTask(modelId: string, resolutions: Record<string, StudioVideoResolution>, defaultRatio: string) {
  return ({ prompt, sourceImageUrl, optionValues }: { prompt: string; sourceImageUrl?: string; optionValues: Record<string, string> }) => {
    const { width, height } = resolveRatio(resolutions, defaultRatio, optionValues);
    return {
      taskType: "videoInference",
      model: modelId,
      positivePrompt: prompt,
      width,
      height,
      duration: Number(optionValues.duration ?? "5"),
      ...(sourceImageUrl ? { frameImages: [{ inputImage: sourceImageUrl, frame: "first" }] } : {}),
    };
  };
}

// frameImages obligatoire (image de référence requise, ex. Kling) — pas de
// garde sur sourceImageUrl car requiresSourceImage:true impose déjà sa
// présence (validée dans generate-studio-video/index.ts).
function requiredFrameTask(modelId: string, resolutions: Record<string, StudioVideoResolution>, defaultRatio: string) {
  return ({ prompt, sourceImageUrl, optionValues }: { prompt: string; sourceImageUrl?: string; optionValues: Record<string, string> }) => {
    const { width, height } = resolveRatio(resolutions, defaultRatio, optionValues);
    return {
      taskType: "videoInference",
      model: modelId,
      positivePrompt: prompt,
      width,
      height,
      duration: Number(optionValues.duration ?? "5"),
      frameImages: [{ inputImage: sourceImageUrl, frame: "first" }],
    };
  };
}

const DURATION_5_10: StudioVideoOption = { key: "duration", label: "Durée", choices: ["5", "10"], default: "5", numeric: true };
const DURATION_6_8_10: StudioVideoOption = { key: "duration", label: "Durée", choices: ["6", "8", "10"], default: "8", numeric: true };

export const STUDIO_VIDEO_MODELS: Record<string, StudioVideoModelConfig> = {
  // -- Google --
  "veo-3-1": {
    runwareModel: "google:3@2",
    supportsSourceImage: true,
    requiresSourceImage: false,
    resolutions: { "16:9": { width: 1280, height: 720 }, "9:16": { width: 720, height: 1280 } },
    defaultAspectRatio: "16:9",
    options: [
      ...ratioOption({ "16:9": { width: 1280, height: 720 }, "9:16": { width: 720, height: 1280 } }, "16:9"),
      { key: "duration", label: "Durée", choices: ["5", "8"], default: "8", numeric: true },
    ],
    buildTask: framesTask("google:3@2", { "16:9": { width: 1280, height: 720 }, "9:16": { width: 720, height: 1280 } }, "16:9"),
  },
  "veo-3-1-fast": {
    // Confiance moyenne (1 source) — AIR/résolutions à revalider.
    runwareModel: "google:3@3",
    supportsSourceImage: true,
    requiresSourceImage: false,
    resolutions: { "16:9": { width: 1280, height: 720 }, "9:16": { width: 720, height: 1280 } },
    defaultAspectRatio: "16:9",
    options: [
      ...ratioOption({ "16:9": { width: 1280, height: 720 }, "9:16": { width: 720, height: 1280 } }, "16:9"),
      { key: "duration", label: "Durée", choices: ["5", "8"], default: "8", numeric: true },
    ],
    buildTask: framesTask("google:3@3", { "16:9": { width: 1280, height: 720 }, "9:16": { width: 720, height: 1280 } }, "16:9"),
  },

  // -- KlingAI — "kling" (klingai:5@3) est le seul modèle vidéo Runware testé
  // bout en bout avec succès (2026-09-12) ; image de référence obligatoire. --
  "kling": {
    runwareModel: "klingai:5@3",
    supportsSourceImage: true,
    requiresSourceImage: true,
    resolutions: { "16:9": { width: 1920, height: 1080 }, "9:16": { width: 1080, height: 1920 }, "1:1": { width: 1080, height: 1080 } },
    defaultAspectRatio: "16:9",
    options: [
      ...ratioOption({ "16:9": { width: 1920, height: 1080 }, "9:16": { width: 1080, height: 1920 }, "1:1": { width: 1080, height: 1080 } }, "16:9"),
      DURATION_5_10,
    ],
    buildTask: requiredFrameTask("klingai:5@3", { "16:9": { width: 1920, height: 1080 }, "9:16": { width: 1080, height: 1920 }, "1:1": { width: 1080, height: 1080 } }, "16:9"),
  },
  "kling-video-3-pro": {
    // Confiance moyenne (AIR confirmé, résolutions best-effort).
    runwareModel: "klingai:kling-video@3-pro",
    supportsSourceImage: true,
    requiresSourceImage: false,
    resolutions: { "16:9": { width: 1920, height: 1080 }, "9:16": { width: 1080, height: 1920 }, "1:1": { width: 1440, height: 1440 } },
    defaultAspectRatio: "16:9",
    options: [
      ...ratioOption({ "16:9": { width: 1920, height: 1080 }, "9:16": { width: 1080, height: 1920 }, "1:1": { width: 1440, height: 1440 } }, "16:9"),
      DURATION_5_10,
    ],
    buildTask: framesTask("klingai:kling-video@3-pro", { "16:9": { width: 1920, height: 1080 }, "9:16": { width: 1080, height: 1920 }, "1:1": { width: 1440, height: 1440 } }, "16:9"),
  },
  "kling-video-3-4k": {
    // Confiance moyenne (AIR confirmé, résolutions best-effort).
    runwareModel: "klingai:kling-video@3-4k",
    supportsSourceImage: true,
    requiresSourceImage: false,
    resolutions: { "16:9": { width: 3840, height: 2160 }, "9:16": { width: 2160, height: 3840 }, "1:1": { width: 2880, height: 2880 } },
    defaultAspectRatio: "16:9",
    options: [
      ...ratioOption({ "16:9": { width: 3840, height: 2160 }, "9:16": { width: 2160, height: 3840 }, "1:1": { width: 2880, height: 2880 } }, "16:9"),
      DURATION_5_10,
    ],
    buildTask: framesTask("klingai:kling-video@3-4k", { "16:9": { width: 3840, height: 2160 }, "9:16": { width: 2160, height: 3840 }, "1:1": { width: 2880, height: 2880 } }, "16:9"),
  },
  "kling-video-o1-pro": {
    // Confiance faible : résolutions introuvables dans la doc au 2026-09-14,
    // on réutilise le palier 1080p de "kling" (testé bout en bout) — à
    // revalider une fois le compte crédité.
    runwareModel: "klingai:kling@o1",
    supportsSourceImage: true,
    requiresSourceImage: false,
    resolutions: { "16:9": { width: 1920, height: 1080 }, "9:16": { width: 1080, height: 1920 } },
    defaultAspectRatio: "16:9",
    options: [
      ...ratioOption({ "16:9": { width: 1920, height: 1080 }, "9:16": { width: 1080, height: 1920 } }, "16:9"),
      DURATION_5_10,
    ],
    buildTask: framesTask("klingai:kling@o1", { "16:9": { width: 1920, height: 1080 }, "9:16": { width: 1080, height: 1920 } }, "16:9"),
  },
  "kling-video-o1-standard": {
    // Confiance faible : même limitation que kling-video-o1-pro ci-dessus.
    runwareModel: "klingai:kling@o1-standard",
    supportsSourceImage: true,
    requiresSourceImage: false,
    resolutions: { "16:9": { width: 1920, height: 1080 }, "9:16": { width: 1080, height: 1920 } },
    defaultAspectRatio: "16:9",
    options: [
      ...ratioOption({ "16:9": { width: 1920, height: 1080 }, "9:16": { width: 1080, height: 1920 } }, "16:9"),
      DURATION_5_10,
    ],
    buildTask: framesTask("klingai:kling@o1-standard", { "16:9": { width: 1920, height: 1080 }, "9:16": { width: 1080, height: 1920 } }, "16:9"),
  },

  // -- Black Forest Labs — liste de résolutions autorisées confirmée en
  // direct (erreur unsupportedModelResolution le 2026-09-12) puis revérifiée
  // en doc le 2026-09-14 (palier 720p ci-dessous). --
  "flux-video": {
    runwareModel: "bfl:flux@3-video",
    supportsSourceImage: false,
    requiresSourceImage: false,
    resolutions: { "16:9": { width: 1280, height: 704 }, "9:16": { width: 704, height: 1280 }, "1:1": { width: 960, height: 960 } },
    defaultAspectRatio: "16:9",
    options: [
      ...ratioOption({ "16:9": { width: 1280, height: 704 }, "9:16": { width: 704, height: 1280 }, "1:1": { width: 960, height: 960 } }, "16:9"),
      { key: "duration", label: "Durée", choices: ["5"], default: "5", numeric: true },
    ],
    buildTask: ({ prompt, optionValues }) => {
      const resolutions = { "16:9": { width: 1280, height: 704 }, "9:16": { width: 704, height: 1280 }, "1:1": { width: 960, height: 960 } };
      const { width, height } = resolveRatio(resolutions, "16:9", optionValues);
      return { taskType: "videoInference", model: "bfl:flux@3-video", positivePrompt: prompt, width, height, duration: Number(optionValues.duration ?? "5") };
    },
  },

  // -- OpenAI — résolutions confirmées (doc officielle). --
  "sora-2": {
    runwareModel: "openai:3@1",
    supportsSourceImage: true,
    requiresSourceImage: false,
    resolutions: { "16:9": { width: 1280, height: 720 }, "9:16": { width: 720, height: 1280 } },
    defaultAspectRatio: "16:9",
    options: [
      ...ratioOption({ "16:9": { width: 1280, height: 720 }, "9:16": { width: 720, height: 1280 } }, "16:9"),
      { key: "duration", label: "Durée", choices: ["4", "8", "12", "16", "20"], default: "8", numeric: true },
    ],
    buildTask: framesTask("openai:3@1", { "16:9": { width: 1280, height: 720 }, "9:16": { width: 720, height: 1280 } }, "16:9"),
  },

  // -- Runway ML --
  "runway-gen-4-5": {
    runwareModel: "runway:1@2",
    supportsSourceImage: true,
    requiresSourceImage: false,
    resolutions: {
      "16:9": { width: 1280, height: 720 }, "9:16": { width: 720, height: 1280 },
      "4:3": { width: 1104, height: 832 }, "3:4": { width: 832, height: 1104 }, "1:1": { width: 960, height: 960 },
    },
    defaultAspectRatio: "16:9",
    options: [
      ...ratioOption({
        "16:9": { width: 1280, height: 720 }, "9:16": { width: 720, height: 1280 },
        "4:3": { width: 1104, height: 832 }, "3:4": { width: 832, height: 1104 }, "1:1": { width: 960, height: 960 },
      }, "16:9"),
      { key: "duration", label: "Durée", choices: ["5", "8", "10"], default: "8", numeric: true },
    ],
    buildTask: framesTask("runway:1@2", {
      "16:9": { width: 1280, height: 720 }, "9:16": { width: 720, height: 1280 },
      "4:3": { width: 1104, height: 832 }, "3:4": { width: 832, height: 1104 }, "1:1": { width: 960, height: 960 },
    }, "16:9"),
  },

  // -- ByteDance (Seedance) — palier 720p retenu pour les 3 variantes,
  // best-effort (exemples de doc, pas une liste exhaustive). --
  "seedance-2-0": {
    runwareModel: "bytedance:seedance@2.0",
    supportsSourceImage: true,
    requiresSourceImage: false,
    resolutions: { "16:9": { width: 1280, height: 720 }, "9:16": { width: 720, height: 1280 }, "1:1": { width: 1088, height: 1088 } },
    defaultAspectRatio: "16:9",
    options: [
      ...ratioOption({ "16:9": { width: 1280, height: 720 }, "9:16": { width: 720, height: 1280 }, "1:1": { width: 1088, height: 1088 } }, "16:9"),
      DURATION_5_10,
    ],
    buildTask: framesTask("bytedance:seedance@2.0", { "16:9": { width: 1280, height: 720 }, "9:16": { width: 720, height: 1280 }, "1:1": { width: 1088, height: 1088 } }, "16:9"),
  },
  "seedance-2-0-fast": {
    runwareModel: "bytedance:seedance@2.0-fast",
    supportsSourceImage: true,
    requiresSourceImage: false,
    resolutions: { "16:9": { width: 1280, height: 720 }, "9:16": { width: 720, height: 1280 }, "1:1": { width: 1088, height: 1088 } },
    defaultAspectRatio: "16:9",
    options: [
      ...ratioOption({ "16:9": { width: 1280, height: 720 }, "9:16": { width: 720, height: 1280 }, "1:1": { width: 1088, height: 1088 } }, "16:9"),
      DURATION_5_10,
    ],
    buildTask: framesTask("bytedance:seedance@2.0-fast", { "16:9": { width: 1280, height: 720 }, "9:16": { width: 720, height: 1280 }, "1:1": { width: 1088, height: 1088 } }, "16:9"),
  },
  "seedance-1-5-pro": {
    runwareModel: "bytedance:seedance@1.5-pro",
    supportsSourceImage: true,
    requiresSourceImage: false,
    resolutions: { "16:9": { width: 1280, height: 720 }, "9:16": { width: 720, height: 1280 }, "1:1": { width: 1088, height: 1088 } },
    defaultAspectRatio: "16:9",
    options: [
      ...ratioOption({ "16:9": { width: 1280, height: 720 }, "9:16": { width: 720, height: 1280 }, "1:1": { width: 1088, height: 1088 } }, "16:9"),
      DURATION_5_10,
    ],
    buildTask: framesTask("bytedance:seedance@1.5-pro", { "16:9": { width: 1280, height: 720 }, "9:16": { width: 720, height: 1280 }, "1:1": { width: 1088, height: 1088 } }, "16:9"),
  },

  // -- Lightricks (LTX) — résolutions confirmées (doc officielle, 16:9/9:16
  // uniquement, pas de carré). --
  "ltx-2-5-pro": {
    runwareModel: "lightricks:ltx@2.5-pro",
    supportsSourceImage: true,
    requiresSourceImage: false,
    resolutions: { "16:9": { width: 1280, height: 720 }, "9:16": { width: 720, height: 1280 } },
    defaultAspectRatio: "16:9",
    options: [
      ...ratioOption({ "16:9": { width: 1280, height: 720 }, "9:16": { width: 720, height: 1280 } }, "16:9"),
      DURATION_6_8_10,
    ],
    buildTask: framesTask("lightricks:ltx@2.5-pro", { "16:9": { width: 1280, height: 720 }, "9:16": { width: 720, height: 1280 } }, "16:9"),
  },
  "ltx-2-5-fast": {
    runwareModel: "lightricks:ltx@2.5-fast",
    supportsSourceImage: true,
    requiresSourceImage: false,
    resolutions: { "16:9": { width: 1280, height: 720 }, "9:16": { width: 720, height: 1280 } },
    defaultAspectRatio: "16:9",
    options: [
      ...ratioOption({ "16:9": { width: 1280, height: 720 }, "9:16": { width: 720, height: 1280 } }, "16:9"),
      DURATION_6_8_10,
    ],
    buildTask: framesTask("lightricks:ltx@2.5-fast", { "16:9": { width: 1280, height: 720 }, "9:16": { width: 720, height: 1280 } }, "16:9"),
  },

  // -- MiniMax — paysage uniquement (16:9), confirmé par la doc : pas de
  // 9:16 documenté, donc pas d'option "aspectRatio" proposée (ratioOption
  // ne l'ajoute que si 2+ ratios existent). --
  "minimax-hailuo-2-3": {
    runwareModel: "minimax:4@1",
    supportsSourceImage: true,
    requiresSourceImage: false,
    resolutions: { "16:9": { width: 1920, height: 1080 } },
    defaultAspectRatio: "16:9",
    options: [{ key: "duration", label: "Durée", choices: ["6", "10"], default: "6", numeric: true }],
    buildTask: framesTask("minimax:4@1", { "16:9": { width: 1920, height: 1080 } }, "16:9"),
  },
  "minimax-hailuo-02": {
    runwareModel: "minimax:3@1",
    supportsSourceImage: true,
    requiresSourceImage: false,
    resolutions: { "16:9": { width: 1920, height: 1080 } },
    defaultAspectRatio: "16:9",
    options: [{ key: "duration", label: "Durée", choices: ["6", "10"], default: "6", numeric: true }],
    buildTask: framesTask("minimax:3@1", { "16:9": { width: 1920, height: 1080 } }, "16:9"),
  },

  // -- Alibaba --
  "wan27-video": {
    runwareModel: "alibaba:wan@2.7",
    supportsSourceImage: true,
    requiresSourceImage: false,
    resolutions: { "16:9": { width: 1280, height: 720 }, "9:16": { width: 720, height: 1280 }, "1:1": { width: 960, height: 960 } },
    defaultAspectRatio: "16:9",
    options: [
      ...ratioOption({ "16:9": { width: 1280, height: 720 }, "9:16": { width: 720, height: 1280 }, "1:1": { width: 960, height: 960 } }, "16:9"),
      DURATION_5_10,
    ],
    buildTask: framesTask("alibaba:wan@2.7", { "16:9": { width: 1280, height: 720 }, "9:16": { width: 720, height: 1280 }, "1:1": { width: 960, height: 960 } }, "16:9"),
  },
  "happyhorse-1-0": {
    // Confiance moyenne (best-effort, résolutions calquées sur wan27-video).
    runwareModel: "alibaba:happyhorse@1.0",
    supportsSourceImage: true,
    requiresSourceImage: false,
    resolutions: { "16:9": { width: 1280, height: 720 }, "9:16": { width: 720, height: 1280 }, "1:1": { width: 960, height: 960 } },
    defaultAspectRatio: "16:9",
    options: [
      ...ratioOption({ "16:9": { width: 1280, height: 720 }, "9:16": { width: 720, height: 1280 }, "1:1": { width: 960, height: 960 } }, "16:9"),
      DURATION_5_10,
    ],
    buildTask: framesTask("alibaba:happyhorse@1.0", { "16:9": { width: 1280, height: 720 }, "9:16": { width: 720, height: 1280 }, "1:1": { width: 960, height: 960 } }, "16:9"),
  },

  // -- Vidu --
  "vidu-q3": {
    // Confiance moyenne — grille de résolutions par palier, on retient 720p.
    runwareModel: "vidu:4@1",
    supportsSourceImage: true,
    requiresSourceImage: false,
    resolutions: { "16:9": { width: 1280, height: 720 }, "9:16": { width: 720, height: 1280 }, "1:1": { width: 1080, height: 1080 } },
    defaultAspectRatio: "16:9",
    options: [
      ...ratioOption({ "16:9": { width: 1280, height: 720 }, "9:16": { width: 720, height: 1280 }, "1:1": { width: 1080, height: 1080 } }, "16:9"),
      DURATION_5_10,
    ],
    buildTask: framesTask("vidu:4@1", { "16:9": { width: 1280, height: 720 }, "9:16": { width: 720, height: 1280 }, "1:1": { width: 1080, height: 1080 } }, "16:9"),
  },

  // -- PixVerse — résolutions confirmées (doc officielle). --
  "pixverse-v5-5": {
    runwareModel: "pixverse:1@6",
    supportsSourceImage: true,
    requiresSourceImage: false,
    resolutions: { "16:9": { width: 1280, height: 720 }, "9:16": { width: 720, height: 1280 }, "1:1": { width: 960, height: 960 } },
    defaultAspectRatio: "16:9",
    options: [
      ...ratioOption({ "16:9": { width: 1280, height: 720 }, "9:16": { width: 720, height: 1280 }, "1:1": { width: 960, height: 960 } }, "16:9"),
      { key: "duration", label: "Durée", choices: ["5", "8"], default: "5", numeric: true },
    ],
    buildTask: framesTask("pixverse:1@6", { "16:9": { width: 1280, height: 720 }, "9:16": { width: 720, height: 1280 }, "1:1": { width: 960, height: 960 } }, "16:9"),
  },
  "pixverse-v6": {
    runwareModel: "pixverse:1@8",
    supportsSourceImage: true,
    requiresSourceImage: false,
    resolutions: { "16:9": { width: 1280, height: 720 }, "9:16": { width: 720, height: 1280 }, "1:1": { width: 960, height: 960 } },
    defaultAspectRatio: "16:9",
    options: [
      ...ratioOption({ "16:9": { width: 1280, height: 720 }, "9:16": { width: 720, height: 1280 }, "1:1": { width: 960, height: 960 } }, "16:9"),
      { key: "duration", label: "Durée", choices: ["5", "8", "10"], default: "5", numeric: true },
    ],
    buildTask: framesTask("pixverse:1@8", { "16:9": { width: 1280, height: 720 }, "9:16": { width: 720, height: 1280 }, "1:1": { width: 960, height: 960 } }, "16:9"),
  },

  // -- Skywork --
  "skyreels-v4": {
    // Confiance moyenne (doc officielle, 1 source).
    runwareModel: "skywork:skyreels@v4",
    supportsSourceImage: true,
    requiresSourceImage: false,
    resolutions: { "16:9": { width: 1280, height: 720 }, "9:16": { width: 720, height: 1280 }, "1:1": { width: 960, height: 960 } },
    defaultAspectRatio: "16:9",
    options: [
      ...ratioOption({ "16:9": { width: 1280, height: 720 }, "9:16": { width: 720, height: 1280 }, "1:1": { width: 960, height: 960 } }, "16:9"),
      DURATION_5_10,
    ],
    buildTask: framesTask("skywork:skyreels@v4", { "16:9": { width: 1280, height: 720 }, "9:16": { width: 720, height: 1280 }, "1:1": { width: 960, height: 960 } }, "16:9"),
  },

  // -- xAI --
  "grok-imagine-video": {
    // Confiance moyenne (doc officielle, 1 source).
    runwareModel: "xai:grok-imagine@video",
    supportsSourceImage: true,
    requiresSourceImage: false,
    resolutions: { "16:9": { width: 1280, height: 720 }, "9:16": { width: 720, height: 1280 }, "1:1": { width: 720, height: 720 } },
    defaultAspectRatio: "16:9",
    options: [
      ...ratioOption({ "16:9": { width: 1280, height: 720 }, "9:16": { width: 720, height: 1280 }, "1:1": { width: 720, height: 720 } }, "16:9"),
      DURATION_5_10,
    ],
    buildTask: framesTask("xai:grok-imagine@video", { "16:9": { width: 1280, height: 720 }, "9:16": { width: 720, height: 1280 }, "1:1": { width: 720, height: 720 } }, "16:9"),
  },
};
