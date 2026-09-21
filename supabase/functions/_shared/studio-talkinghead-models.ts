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

// Voix MiniMax Speech 2.8 : catalogue déplacé dans studio-tts-voices.ts le
// 2026-09-19 (partagé désormais avec "Du texte à l'audio" et "Parlez
// n'importe quelle langue") — ré-exporté ici pour ne rien casser côté
// generate-studio-talkinghead/check-studio-talkinghead-status. Ce fichier
// partagé corrige déjà indépendamment le même bug speech.language que celui
// trouvé ici le 2026-09-18 (cf. son propre commentaire), donc plus besoin
// d'un buildTtsTask local.
export { TTS_VOICES, DEFAULT_TTS_VOICE, TTS_MODEL_ID, buildTtsTask, type TalkingHeadVoice } from "./studio-tts-voices.ts";
