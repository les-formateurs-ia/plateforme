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
      // Runware/Veo 3.1 rejette toute valeur hors {4, 6, 8} ("Invalid value for
      // 'duration' parameter") — corrigé le 2026-09-16, l'UI proposait 5/8.
      { key: "duration", label: "Durée", choices: ["4", "6", "8"], default: "8", numeric: true },
    ],
    buildTask: framesTask("google:3@2", { "16:9": { width: 1280, height: 720 }, "9:16": { width: 720, height: 1280 } }, "16:9"),
  },
  "veo-3-1-fast": {
    // Confiance haute — vérifié le 2026-09-16 sur https://runware.ai/docs/models/google-veo-3-1-fast :
    // AIR google:3@3 confirmé, durées autorisées 4/6/7/8s (7s utile en extension
    // vidéo via inputs.video), résolutions 720p confirmées.
    runwareModel: "google:3@3",
    supportsSourceImage: true,
    requiresSourceImage: false,
    resolutions: { "16:9": { width: 1280, height: 720 }, "9:16": { width: 720, height: 1280 } },
    defaultAspectRatio: "16:9",
    options: [
      ...ratioOption({ "16:9": { width: 1280, height: 720 }, "9:16": { width: 720, height: 1280 } }, "16:9"),
      { key: "duration", label: "Durée", choices: ["4", "6", "7", "8"], default: "8", numeric: true },
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
    // Confiance haute — vérifié le 2026-09-16 sur
    // https://runware.ai/docs/models/klingai-video-3-0-pro : AIR et résolutions
    // (16:9 1920x1080, 1:1 1440x1440, 9:16 1080x1920) confirmés ; durée
    // autorisée 3-15s (5/10 retenus ici sont valides).
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
    // Confiance haute — vérifié le 2026-09-16 sur
    // https://runware.ai/docs/models/klingai-video-3-0-4k : AIR et résolutions
    // (16:9 3840x2160, 9:16 2160x3840, 1:1 2880x2880) confirmés ; durée
    // autorisée 3-15s (5/10 retenus ici sont valides).
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
    // Confiance haute — vérifié le 2026-09-16 sur
    // https://runware.ai/docs/models/klingai-video-o1-pro : AIR confirmé,
    // résolutions 1080p incluant le carré (16:9 1920x1080, 1:1 1440x1440,
    // 9:16 1080x1920 — le 1:1 manquait, corrigé). Avec frameImages, durée
    // limitée à 5 ou 10s (DURATION_5_10 est donc correct).
    runwareModel: "klingai:kling@o1",
    supportsSourceImage: true,
    requiresSourceImage: false,
    resolutions: { "16:9": { width: 1920, height: 1080 }, "9:16": { width: 1080, height: 1920 }, "1:1": { width: 1440, height: 1440 } },
    defaultAspectRatio: "16:9",
    options: [
      ...ratioOption({ "16:9": { width: 1920, height: 1080 }, "9:16": { width: 1080, height: 1920 }, "1:1": { width: 1440, height: 1440 } }, "16:9"),
      DURATION_5_10,
    ],
    buildTask: framesTask("klingai:kling@o1", { "16:9": { width: 1920, height: 1080 }, "9:16": { width: 1080, height: 1920 }, "1:1": { width: 1440, height: 1440 } }, "16:9"),
  },
  "kling-video-o1-standard": {
    // Confiance haute — vérifié le 2026-09-16 sur
    // https://runware.ai/docs/models/klingai-video-o1-standard : AIR confirmé,
    // mais contrairement à kling-video-o1-pro ce modèle est en 720p (pas
    // 1080p) — corrigé (16:9 1280x720, 9:16 720x1280, 1:1 960x960 ajouté).
    // Avec frameImages, durée limitée à 5 ou 10s (DURATION_5_10 correct).
    runwareModel: "klingai:kling@o1-standard",
    supportsSourceImage: true,
    requiresSourceImage: false,
    resolutions: { "16:9": { width: 1280, height: 720 }, "9:16": { width: 720, height: 1280 }, "1:1": { width: 960, height: 960 } },
    defaultAspectRatio: "16:9",
    options: [
      ...ratioOption({ "16:9": { width: 1280, height: 720 }, "9:16": { width: 720, height: 1280 }, "1:1": { width: 960, height: 960 } }, "16:9"),
      DURATION_5_10,
    ],
    buildTask: framesTask("klingai:kling@o1-standard", { "16:9": { width: 1280, height: 720 }, "9:16": { width: 720, height: 1280 }, "1:1": { width: 960, height: 960 } }, "16:9"),
  },

  // -- Black Forest Labs — liste de résolutions autorisées confirmée en
  // direct (erreur unsupportedModelResolution le 2026-09-12) puis revérifiée
  // en doc le 2026-09-14 (palier 720p ci-dessous). Durée revérifiée le
  // 2026-09-16 sur https://runware.ai/docs/models/bfl-flux-3-video : la doc
  // autorise en fait tout entier de 5 à 20s (ou "auto"), pas seulement 5s —
  // choix élargi à 5/10/15/20 (confiance haute). --
  "flux-video": {
    runwareModel: "bfl:flux@3-video",
    supportsSourceImage: false,
    requiresSourceImage: false,
    resolutions: { "16:9": { width: 1280, height: 704 }, "9:16": { width: 704, height: 1280 }, "1:1": { width: 960, height: 960 } },
    defaultAspectRatio: "16:9",
    options: [
      ...ratioOption({ "16:9": { width: 1280, height: 704 }, "9:16": { width: 704, height: 1280 }, "1:1": { width: 960, height: 960 } }, "16:9"),
      { key: "duration", label: "Durée", choices: ["5", "10", "15", "20"], default: "5", numeric: true },
    ],
    buildTask: ({ prompt, optionValues }) => {
      const resolutions = { "16:9": { width: 1280, height: 704 }, "9:16": { width: 704, height: 1280 }, "1:1": { width: 960, height: 960 } };
      const { width, height } = resolveRatio(resolutions, "16:9", optionValues);
      return { taskType: "videoInference", model: "bfl:flux@3-video", positivePrompt: prompt, width, height, duration: Number(optionValues.duration ?? "5") };
    },
  },

  // -- OpenAI — résolutions confirmées (doc officielle), revérifié le
  // 2026-09-16 sur https://runware.ai/docs/models/openai-sora-2 (AIR,
  // résolutions et durées 4/8/12/16/20s tous confirmés à l'identique,
  // confiance haute). --
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

  // -- Runway ML — confiance haute, vérifié le 2026-09-16 sur
  // https://runware.ai/docs/models/runway-gen-4-5 : AIR et les 5 résolutions
  // confirmés à l'identique ; durée doc 5/8/10s (défaut doc 10, on garde 8
  // qui reste une valeur valide de la liste). --
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

  // -- ByteDance (Seedance) — palier 720p retenu pour les 3 variantes.
  // Confiance haute — vérifié le 2026-09-16 sur
  // https://runware.ai/docs/models/bytedance-seedance-2-0 (+ -2-0-fast et
  // -1-5-pro, mêmes valeurs au palier 720p) : le carré 720p est 960x960, pas
  // 1088x1088 comme précédemment renseigné — corrigé sur les 3 variantes.
  // Durée doc : 2.0/2.0-fast acceptent 4-15s, 1.5-pro 4-12s ; DURATION_5_10
  // (5/10) reste un sous-ensemble valide pour les 3. --
  "seedance-2-0": {
    runwareModel: "bytedance:seedance@2.0",
    supportsSourceImage: true,
    requiresSourceImage: false,
    resolutions: { "16:9": { width: 1280, height: 720 }, "9:16": { width: 720, height: 1280 }, "1:1": { width: 960, height: 960 } },
    defaultAspectRatio: "16:9",
    options: [
      ...ratioOption({ "16:9": { width: 1280, height: 720 }, "9:16": { width: 720, height: 1280 }, "1:1": { width: 960, height: 960 } }, "16:9"),
      DURATION_5_10,
    ],
    buildTask: framesTask("bytedance:seedance@2.0", { "16:9": { width: 1280, height: 720 }, "9:16": { width: 720, height: 1280 }, "1:1": { width: 960, height: 960 } }, "16:9"),
  },
  "seedance-2-0-fast": {
    runwareModel: "bytedance:seedance@2.0-fast",
    supportsSourceImage: true,
    requiresSourceImage: false,
    resolutions: { "16:9": { width: 1280, height: 720 }, "9:16": { width: 720, height: 1280 }, "1:1": { width: 960, height: 960 } },
    defaultAspectRatio: "16:9",
    options: [
      ...ratioOption({ "16:9": { width: 1280, height: 720 }, "9:16": { width: 720, height: 1280 }, "1:1": { width: 960, height: 960 } }, "16:9"),
      DURATION_5_10,
    ],
    buildTask: framesTask("bytedance:seedance@2.0-fast", { "16:9": { width: 1280, height: 720 }, "9:16": { width: 720, height: 1280 }, "1:1": { width: 960, height: 960 } }, "16:9"),
  },
  "seedance-1-5-pro": {
    runwareModel: "bytedance:seedance@1.5-pro",
    supportsSourceImage: true,
    requiresSourceImage: false,
    resolutions: { "16:9": { width: 1280, height: 720 }, "9:16": { width: 720, height: 1280 }, "1:1": { width: 960, height: 960 } },
    defaultAspectRatio: "16:9",
    options: [
      ...ratioOption({ "16:9": { width: 1280, height: 720 }, "9:16": { width: 720, height: 1280 }, "1:1": { width: 960, height: 960 } }, "16:9"),
      DURATION_5_10,
    ],
    buildTask: framesTask("bytedance:seedance@1.5-pro", { "16:9": { width: 1280, height: 720 }, "9:16": { width: 720, height: 1280 }, "1:1": { width: 960, height: 960 } }, "16:9"),
  },

  // -- Lightricks (LTX) — résolutions confirmées (doc officielle, 16:9/9:16
  // uniquement, pas de carré). Revérifié le 2026-09-16 :
  // https://runware.ai/docs/models/lightricks-ltx-2-5-pro (durée 6/8/10/auto,
  // défaut doc 6 ; plafond 1080p) et .../lightricks-ltx-2-5-fast (durée
  // 6/8/10/12/14/16/18/20/auto, défaut doc 6 ; plafond 4K). DURATION_6_8_10
  // (6/8/10) reste un sous-ensemble valide pour les deux variantes. --
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
  // ne l'ajoute que si 2+ ratios existent). Confiance haute — revérifié le
  // 2026-09-16 sur https://runware.ai/docs/models/minimax-hailuo-2-3 et
  // .../minimax-hailuo-02 : AIR, résolution 1080p et durées 6/10s (défaut 6)
  // confirmés à l'identique pour les deux variantes. --
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

  // -- Alibaba — confiance haute pour wan27-video, vérifié le 2026-09-16 sur
  // https://runware.ai/docs/models/alibaba-wan2-7 : AIR et les 3 résolutions
  // (16:9 1280x720, 9:16 720x1280, 1:1 960x960) confirmés à l'identique ;
  // durée doc 2-15s, DURATION_5_10 reste un sous-ensemble valide. --
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
    // Confiance moyenne (best-effort, résolutions calquées sur wan27-video —
    // recherché le 2026-09-16, aucune page de doc dédiée trouvée pour
    // "happyhorse" sur runware.ai, donc non revérifiable directement ;
    // wan27-video lui-même est maintenant confirmé haute confiance).
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
    // Confiance haute — vérifié le 2026-09-16 sur
    // https://runware.ai/docs/models/vidu-q3 : AIR confirmé, palier 720p
    // retenu, mais le carré 720p est 960x960 (pas 1080x1080) — corrigé.
    // Durée doc : 1-16s, DURATION_5_10 (5/10) reste un sous-ensemble valide.
    runwareModel: "vidu:4@1",
    supportsSourceImage: true,
    requiresSourceImage: false,
    resolutions: { "16:9": { width: 1280, height: 720 }, "9:16": { width: 720, height: 1280 }, "1:1": { width: 960, height: 960 } },
    defaultAspectRatio: "16:9",
    options: [
      ...ratioOption({ "16:9": { width: 1280, height: 720 }, "9:16": { width: 720, height: 1280 }, "1:1": { width: 960, height: 960 } }, "16:9"),
      DURATION_5_10,
    ],
    buildTask: framesTask("vidu:4@1", { "16:9": { width: 1280, height: 720 }, "9:16": { width: 720, height: 1280 }, "1:1": { width: 960, height: 960 } }, "16:9"),
  },

  // -- PixVerse — confiance haute, revérifié le 2026-09-16 sur
  // https://runware.ai/docs/models/pixverse-v5-5 et .../pixverse-v6 : AIR et
  // grille de résolutions confirmés, mais le carré 720p est 720x720, pas
  // 960x960 (960x960 n'existe dans AUCUN palier PixVerse) — corrigé sur les
  // 2 variantes. Durée doc : 1-15s (v6) / 5,8,10 selon résolution (v5.5) ;
  // nos listes (5/8 et 5/8/10) restent valides. --
  "pixverse-v5-5": {
    runwareModel: "pixverse:1@6",
    supportsSourceImage: true,
    requiresSourceImage: false,
    resolutions: { "16:9": { width: 1280, height: 720 }, "9:16": { width: 720, height: 1280 }, "1:1": { width: 720, height: 720 } },
    defaultAspectRatio: "16:9",
    options: [
      ...ratioOption({ "16:9": { width: 1280, height: 720 }, "9:16": { width: 720, height: 1280 }, "1:1": { width: 720, height: 720 } }, "16:9"),
      { key: "duration", label: "Durée", choices: ["5", "8"], default: "5", numeric: true },
    ],
    buildTask: framesTask("pixverse:1@6", { "16:9": { width: 1280, height: 720 }, "9:16": { width: 720, height: 1280 }, "1:1": { width: 720, height: 720 } }, "16:9"),
  },
  "pixverse-v6": {
    runwareModel: "pixverse:1@8",
    supportsSourceImage: true,
    requiresSourceImage: false,
    resolutions: { "16:9": { width: 1280, height: 720 }, "9:16": { width: 720, height: 1280 }, "1:1": { width: 720, height: 720 } },
    defaultAspectRatio: "16:9",
    options: [
      ...ratioOption({ "16:9": { width: 1280, height: 720 }, "9:16": { width: 720, height: 1280 }, "1:1": { width: 720, height: 720 } }, "16:9"),
      { key: "duration", label: "Durée", choices: ["5", "8", "10"], default: "5", numeric: true },
    ],
    buildTask: framesTask("pixverse:1@8", { "16:9": { width: 1280, height: 720 }, "9:16": { width: 720, height: 1280 }, "1:1": { width: 720, height: 720 } }, "16:9"),
  },

  // -- Skywork --
  "skyreels-v4": {
    // Confiance haute — revérifié le 2026-09-16 sur
    // https://runware.ai/docs/models/skywork-skyreels-v4 : AIR et les 3
    // résolutions 720p confirmés à l'identique ; durée doc 3-15s,
    // DURATION_5_10 reste un sous-ensemble valide.
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
    // Confiance haute — revérifié le 2026-09-16 sur
    // https://runware.ai/docs/models/xai-grok-imagine-video : AIR et les 3
    // résolutions 720p confirmés à l'identique ; durée doc 1-15s (défaut 6),
    // DURATION_5_10 reste un sous-ensemble valide.
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
