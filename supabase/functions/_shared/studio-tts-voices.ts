// Catalogue de voix MiniMax Speech 2.8 (audioInference) partagé par les 3
// modules du Studio qui en dépendent : "Faites parler vos images" (TTS ->
// avatar), "Du texte à l'audio" (TTS seul) et "Parlez n'importe quelle
// langue" (TTS de traduction -> lip-sync). Extrait de
// studio-talkinghead-models.ts le 2026-09-19 pour éviter la duplication.
//
// Les 5 premières voix (fr/en/es) sont celles déjà vérifiées le 2026-09-18
// (cf. historique de studio-talkinghead-models.ts). Les 4 suivantes
// (de/it/pt/ru) ont été ajoutées le 2026-09-19 pour élargir la couverture
// linguistique du module doublage — sourcées sur
// https://runware.ai/docs/models/minimax-speech-2-8 mais PAS encore
// vérifiées par un appel réel (même réserve que le reste du catalogue
// Runware de ce projet) : à revalider dès qu'un élève les utilise
// réellement, corriger l'id si Runware renvoie une erreur "voice not found".
export interface TalkingHeadVoice {
  id: string;
  label: string;
  language: string; // code langue TTS (speech.language)
  languageLabel: string; // nom de la langue en français, pour l'UI et les prompts de traduction
}

export const TTS_VOICES: TalkingHeadVoice[] = [
  { id: "French_MaleNarrator", label: "Français — Narrateur (H)", language: "fr-FR", languageLabel: "Français" },
  { id: "French_FemaleAnchor", label: "Français — Présentatrice (F)", language: "fr-FR", languageLabel: "Français" },
  { id: "English_expressive_narrator", label: "Anglais — Narrateur expressif", language: "en-US", languageLabel: "Anglais" },
  { id: "English_CalmWoman", label: "Anglais — Voix calme (F)", language: "en-US", languageLabel: "Anglais" },
  { id: "Spanish_narrator", label: "Espagnol — Narrateur", language: "es-ES", languageLabel: "Espagnol" },
  { id: "German_FriendlyMan", label: "Allemand — Voix amicale (H)", language: "de-DE", languageLabel: "Allemand" },
  { id: "Italian_Narrator", label: "Italien — Narrateur", language: "it-IT", languageLabel: "Italien" },
  { id: "Portuguese_SentimentalLady", label: "Portugais — Voix expressive (F)", language: "pt-PT", languageLabel: "Portugais" },
  { id: "Russian_ReliableMan", label: "Russe — Voix posée (H)", language: "ru-RU", languageLabel: "Russe" },
];

export const DEFAULT_TTS_VOICE = TTS_VOICES[0].id;

export const TTS_MODEL_ID = "minimax:speech@2.8";

// "language" N'EST PAS un champ accepté par "speech" pour ce modèle — bug
// constaté en direct le 2026-09-19 (502 sur les 3 modules TTS) : Runware
// renvoie "Unsupported use of 'speech[language]' parameter... Allowed
// values are: text, voice, speed, volume, pitch, emotion, tone". La langue
// est déjà portée par le choix de voix (ex. "French_MaleNarrator") — pas
// besoin de la répéter, corrigé en la retirant du payload envoyé à Runware
// (le champ `language` reste dans TalkingHeadVoice/la ligne en base pour
// l'UI et les prompts de traduction, juste plus transmis tel quel ici).
export function buildTtsTask({ text, voice }: { text: string; voice: string }): Record<string, unknown> {
  return {
    taskType: "audioInference",
    model: TTS_MODEL_ID,
    outputFormat: "MP3",
    speech: { text, voice },
  };
}
