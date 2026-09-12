// Catalogue vidéo Runware (remplace Higgsfield). Testé en direct le
// 2026-09-12 une fois le compte crédité : chaque modèle n'accepte qu'un
// jeu de résolutions fixes (pas de largeur/hauteur libres comme pour
// l'image) — Kling a rejeté 1280x720 avec la liste exacte des valeurs
// permises (unsupportedDimensions), d'où les dimensions codées en dur
// par modèle ci-dessous. Génération vidéo Kling confirmée bout en bout
// (~2 min, statut "success", champ videoURL). Veo accepte 1280x720 sans
// erreur (soumission confirmée, mais achèvement pas attendu pour économiser
// le crédit du compte). FLUX Video a été ajusté sur une résolution de sa
// liste autorisée (voir erreur unsupportedModelResolution) mais pas encore
// testé de bout en bout.
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
  width: number;
  height: number;
  options: StudioVideoOption[];
  buildTask: (params: { prompt: string; sourceImageUrl?: string; optionValues: Record<string, string> }) => Record<string, unknown>;
}

export const STUDIO_VIDEO_MODELS: Record<string, StudioVideoModelConfig> = {
  "veo-3-1": {
    runwareModel: "google:3@2",
    supportsSourceImage: true,
    requiresSourceImage: false,
    width: 1280,
    height: 720,
    options: [{ key: "duration", label: "Durée", choices: ["5", "8"], default: "8", numeric: true }],
    buildTask: ({ prompt, sourceImageUrl, optionValues }) => ({
      taskType: "videoInference",
      model: "google:3@2",
      positivePrompt: prompt,
      width: 1280,
      height: 720,
      duration: Number(optionValues.duration ?? "8"),
      ...(sourceImageUrl ? { frameImages: [{ inputImage: sourceImageUrl, frame: "first" }] } : {}),
    }),
  },
  // Kling n'accepte qu'un jeu fermé de résolutions (unsupportedDimensions si
  // on sort de cette liste) : 1920x1080 (16:9), 1080x1920 (9:16), 1080x1080 (1:1).
  "kling": {
    runwareModel: "klingai:5@3",
    supportsSourceImage: true,
    requiresSourceImage: true,
    width: 1920,
    height: 1080,
    options: [{ key: "duration", label: "Durée", choices: ["5", "10"], default: "5", numeric: true }],
    buildTask: ({ prompt, sourceImageUrl, optionValues }) => ({
      taskType: "videoInference",
      model: "klingai:5@3",
      positivePrompt: prompt,
      width: 1920,
      height: 1080,
      duration: Number(optionValues.duration ?? "5"),
      frameImages: [{ inputImage: sourceImageUrl, frame: "first" }],
    }),
  },
  // FLUX Video a aussi un jeu fermé de résolutions (unsupportedModelResolution) ;
  // 1280x704 est la plus proche d'un 16:9 dans la liste autorisée.
  "flux-video": {
    runwareModel: "bfl:flux@3-video",
    supportsSourceImage: false,
    requiresSourceImage: false,
    width: 1280,
    height: 704,
    options: [{ key: "duration", label: "Durée", choices: ["5"], default: "5", numeric: true }],
    buildTask: ({ prompt, optionValues }) => ({
      taskType: "videoInference",
      model: "bfl:flux@3-video",
      positivePrompt: prompt,
      width: 1280,
      height: 704,
      duration: Number(optionValues.duration ?? "5"),
    }),
  },
};
