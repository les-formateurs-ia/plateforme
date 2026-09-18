// Catalogue Runware pour le module "Faites parler vos images" (Le Studio) —
// cf. src/app/lib/studioTalkingHead.ts, à garder en phase avec ce fichier.
//
// 5 modèles "photo avatar" sélectionnés le 2026-09-18 parmi le catalogue
// lip-sync/talking-avatar de Runware (https://runware.ai/collections/best-lip-sync) :
// exclus volontairement les modèles "lip-sync classique" (sync. lipsync-2/
// lipsync-2-pro/sync-3, KlingAI Lip-Sync, PixVerse LipSync) qui exigent une
// VIDÉO existante en entrée — incompatibles avec le flow "photo + texte"
// demandé. Les 5 retenus ci-dessous prennent tous une photo statique.
//
// Aucun des 5 n'a de champ `speech.text` confirmé dans la doc Runware (à
// l'exception de prunaai:p-video@avatar, qui en a un, mais qu'on n'utilise
// pas ici pour garder un seul chemin de code uniforme, cf. plan) — chaque
// génération passe donc TOUJOURS par une étape TTS séparée (MiniMax Speech
// 2.8) avant d'appeler le modèle avatar avec l'URL audio obtenue.
//
// Schémas vérifiés en direct sur runware.ai/docs le 2026-09-18 :
// - prunaai:p-video@avatar : inputs.frameImages (tableau, PAS `image`) +
//   inputs.audio, `resolution` ("720p"/"1080p").
// - heygen:avatar@4, bytedance:5@2, klingai:avatar@2.0-pro, creatify:aurora@0 :
//   inputs.image + inputs.audio (schéma identique entre eux).
// Aucun appel réel n'a pu être testé bout en bout (compte Runware non
// crédité, cf. _shared/runware.ts) — à revalider une fois le compte alimenté
// (https://my.runware.ai/wallet), même réserve que studio-video-models.ts.

export interface StudioTalkingHeadModelConfig {
  runwareModel: string;
  label: string;
  description: string;
  buildTask: (params: { imageUrl: string; audioUrl: string }) => Record<string, unknown>;
}

export const STUDIO_TALKINGHEAD_MODELS: Record<string, StudioTalkingHeadModelConfig> = {
  "p-video-avatar": {
    runwareModel: "prunaai:p-video@avatar",
    label: "P-Video Avatar",
    description: "Rapide et économique — bon choix par défaut (720p/1080p).",
    buildTask: ({ imageUrl, audioUrl }) => ({
      taskType: "videoInference",
      model: "prunaai:p-video@avatar",
      resolution: "720p",
      outputFormat: "MP4",
      inputs: { frameImages: [imageUrl], audio: audioUrl },
    }),
  },
  "heygen-avatar-iv": {
    runwareModel: "heygen:avatar@4",
    label: "HeyGen Avatar IV",
    description: "Qualité premium, gestes et expressions naturels.",
    buildTask: ({ imageUrl, audioUrl }) => ({
      taskType: "videoInference",
      model: "heygen:avatar@4",
      outputFormat: "MP4",
      inputs: { image: imageUrl, audio: audioUrl },
    }),
  },
  "omnihuman-1-5": {
    runwareModel: "bytedance:5@2",
    label: "OmniHuman 1.5",
    description: "Modèle ByteDance à la pointe pour le réalisme et la précision du lip-sync.",
    buildTask: ({ imageUrl, audioUrl }) => ({
      taskType: "videoInference",
      model: "bytedance:5@2",
      outputFormat: "MP4",
      inputs: { image: imageUrl, audio: audioUrl },
    }),
  },
  "klingai-avatar-2-pro": {
    runwareModel: "klingai:avatar@2.0-pro",
    label: "KlingAI Avatar 2.0 Pro",
    description: "Bon équilibre qualité/prix, famille Kling déjà éprouvée sur la vidéo.",
    buildTask: ({ imageUrl, audioUrl }) => ({
      taskType: "videoInference",
      model: "klingai:avatar@2.0-pro",
      outputFormat: "MP4",
      inputs: { image: imageUrl, audio: audioUrl },
    }),
  },
  "aurora-v1": {
    runwareModel: "creatify:aurora@0",
    label: "Aurora v1",
    description: "Creatify Aurora — expressivité et mouvement corps entier.",
    buildTask: ({ imageUrl, audioUrl }) => ({
      taskType: "videoInference",
      model: "creatify:aurora@0",
      outputFormat: "MP4",
      inputs: { image: imageUrl, audio: audioUrl },
    }),
  },
};

// Voix MiniMax Speech 2.8 (audioInference) — ensemble restreint et sûr,
// à élargir/revalider une fois le compte Runware crédité (cf. commentaire de
// tête). Sourcé le 2026-09-18 sur https://runware.ai/docs/models/minimax-speech-2-8.
export interface TalkingHeadVoice {
  id: string;
  label: string;
  language: string; // code langue TTS (speech.language)
}

export const TTS_VOICES: TalkingHeadVoice[] = [
  { id: "French_MaleNarrator", label: "Français — Narrateur (H)", language: "fr-FR" },
  { id: "French_FemaleAnchor", label: "Français — Présentatrice (F)", language: "fr-FR" },
  { id: "English_expressive_narrator", label: "Anglais — Narrateur expressif", language: "en-US" },
  { id: "English_CalmWoman", label: "Anglais — Voix calme (F)", language: "en-US" },
  { id: "Spanish_narrator", label: "Espagnol — Narrateur", language: "es-ES" },
];

export const DEFAULT_TTS_VOICE = TTS_VOICES[0].id;

export const TTS_MODEL_ID = "minimax:speech@2.8";

export function buildTtsTask({ text, voice, language }: { text: string; voice: string; language: string }): Record<string, unknown> {
  return {
    taskType: "audioInference",
    model: TTS_MODEL_ID,
    outputFormat: "MP3",
    speech: { text, voice, language },
  };
}
