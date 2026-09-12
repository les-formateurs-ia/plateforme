// Catalogue vidéo Runware (remplace Higgsfield). IDs de modèles confirmés
// reconnus par l'API le 2026-09-12 (erreur videoInferenceInsufficientCredits,
// pas modelNotFound) mais la génération elle-même n'a pas pu être testée de
// bout en bout : ce compte Runware n'a aucun solde crédité et TOUTE
// génération vidéo (quel que soit le modèle) l'exige
// (https://my.runware.ai/wallet). Le code fonctionnera dès que le compte
// sera alimenté ; en attendant, l'élève verra le message d'erreur Runware
// clair (formatRunwareError) plutôt qu'une génération silencieusement cassée.
export interface StudioVideoOption {
  key: string;
  label: string;
  choices: string[];
  default: string;
  numeric?: boolean;
}

export interface StudioVideoModelConfig {
  runwareModel: string;
  supportsSourceImage: boolean;
  requiresSourceImage: boolean;
  options: StudioVideoOption[];
  buildTask: (params: { prompt: string; sourceImageUrl?: string; optionValues: Record<string, string> }) => Record<string, unknown>;
}

const DEFAULT_WIDTH = 1280;
const DEFAULT_HEIGHT = 720;

export const STUDIO_VIDEO_MODELS: Record<string, StudioVideoModelConfig> = {
  "veo-3-1": {
    runwareModel: "google:3@2",
    supportsSourceImage: true,
    requiresSourceImage: false,
    options: [{ key: "duration", label: "Durée", choices: ["5", "8"], default: "8", numeric: true }],
    buildTask: ({ prompt, sourceImageUrl, optionValues }) => ({
      taskType: "videoInference",
      model: "google:3@2",
      positivePrompt: prompt,
      width: DEFAULT_WIDTH,
      height: DEFAULT_HEIGHT,
      duration: Number(optionValues.duration ?? "8"),
      ...(sourceImageUrl ? { frameImages: [{ inputImage: sourceImageUrl, frame: "first" }] } : {}),
    }),
  },
  "kling": {
    runwareModel: "klingai:5@3",
    supportsSourceImage: true,
    requiresSourceImage: true,
    options: [{ key: "duration", label: "Durée", choices: ["5", "10"], default: "5", numeric: true }],
    buildTask: ({ prompt, sourceImageUrl, optionValues }) => ({
      taskType: "videoInference",
      model: "klingai:5@3",
      positivePrompt: prompt,
      width: DEFAULT_WIDTH,
      height: DEFAULT_HEIGHT,
      duration: Number(optionValues.duration ?? "5"),
      frameImages: [{ inputImage: sourceImageUrl, frame: "first" }],
    }),
  },
  "flux-video": {
    runwareModel: "bfl:flux@3-video",
    supportsSourceImage: false,
    requiresSourceImage: false,
    options: [{ key: "duration", label: "Durée", choices: ["5"], default: "5", numeric: true }],
    buildTask: ({ prompt, optionValues }) => ({
      taskType: "videoInference",
      model: "bfl:flux@3-video",
      positivePrompt: prompt,
      width: DEFAULT_WIDTH,
      height: DEFAULT_HEIGHT,
      duration: Number(optionValues.duration ?? "5"),
    }),
  },
};
