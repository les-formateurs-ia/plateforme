// Catalogue Runware pour le module "Parlez n'importe quelle langue" (Le
// Studio) — cf. src/app/lib/studioDoublage.ts, à garder en phase avec ce
// fichier.
//
// Pipeline en 3 étapes (cf. generate-studio-doublage) : 1) Gemini écoute
// l'audio de la vidéo uploadée et transcrit + traduit directement vers la
// langue cible (cf. _shared/gemini-video.ts — Runware n'a aucune capacité
// de transcription audio, vérifié le 2026-09-19 sur sa doc/FAQ) ; 2) le
// texte traduit est synthétisé en voix via MiniMax Speech 2.8 (cf.
// studio-tts-voices.ts) ; 3) la vidéo source uploadée + l'audio traduit
// sont soumis à un modèle de lip-sync "vidéo -> vidéo" (videoInference),
// qui resynchronise les lèvres et les micro-expressions sur le nouvel
// audio.
//
// Modèles retenus, famille "sync." (schéma vérifié le 2026-09-19 sur
// https://runware.ai/docs/models/sync-lipsync-2 et .../sync-lipsync-2-pro) :
// inputs.video (URL) + inputs.audio (URL), providerSettings.sync.syncMode
// ("bounce" par défaut chez Runware — remplacé ici par "cut_off" pour éviter
// les artefacts de rebond/boucle quand la durée de l'audio traduit diffère
// de la vidéo source, cas fréquent en traduction). Non exposé à l'élève.
export interface StudioDoublageModelConfig {
  runwareModel: string;
  label: string;
  description: string;
  buildTask: (params: { videoUrl: string; audioUrl: string }) => Record<string, unknown>;
}

function buildLipsyncTask(runwareModel: string) {
  return ({ videoUrl, audioUrl }: { videoUrl: string; audioUrl: string }): Record<string, unknown> => ({
    taskType: "videoInference",
    model: runwareModel,
    outputFormat: "MP4",
    inputs: { video: videoUrl, audio: audioUrl },
    providerSettings: { sync: { syncMode: "cut_off", temperature: 0.5 } },
  });
}

export const STUDIO_DOUBLAGE_MODELS: Record<string, StudioDoublageModelConfig> = {
  "lipsync-2": {
    runwareModel: "sync:lipsync-2@1",
    label: "Sync Lipsync 2",
    description: "Rapide et économique — bon choix par défaut.",
    buildTask: buildLipsyncTask("sync:lipsync-2@1"),
  },
  "lipsync-2-pro": {
    runwareModel: "sync:lipsync-2-pro@1",
    label: "Sync Lipsync 2 Pro",
    description: "Qualité studio (rendu diffusion), préserve mieux les micro-expressions — plus lent et plus cher.",
    buildTask: buildLipsyncTask("sync:lipsync-2-pro@1"),
  },
};

export const DEFAULT_DOUBLAGE_MODEL = "lipsync-2";

// Langues source/cible proposées à l'élève — une seule voix MiniMax Speech
// 2.8 par langue cible (cf. studio-tts-voices.ts pour le catalogue complet
// avec variantes), pour garder le formulaire à 2 choix simples (langue
// d'origine, langue cible) comme demandé.
export interface DoublageLanguage {
  code: string;
  label: string;
  voiceId: string; // voix MiniMax utilisée quand cette langue est la CIBLE
}

// Corrigé le 2026-09-20 : "English_expressive_narrator" et "Spanish_narrator"
// n'existaient pas dans le catalogue Runware réel (cf. studio-tts-voices.ts,
// dont le catalogue complet a été revérifié directement sur la doc à cette
// date) — remplacés par des ids réels, mêmes réserves de non-vérification en
// direct que le reste du catalogue.
export const DOUBLAGE_LANGUAGES: DoublageLanguage[] = [
  { code: "fr", label: "Français", voiceId: "French_MaleNarrator" },
  { code: "en", label: "Anglais", voiceId: "English_CaptivatingStoryteller" },
  { code: "es", label: "Espagnol", voiceId: "Spanish_Narrator" },
  { code: "de", label: "Allemand", voiceId: "German_FriendlyMan" },
  { code: "it", label: "Italien", voiceId: "Italian_Narrator" },
  { code: "pt", label: "Portugais", voiceId: "Portuguese_SentimentalLady" },
  { code: "ru", label: "Russe", voiceId: "Russian_ReliableMan" },
];

export const DEFAULT_DOUBLAGE_LANGUAGE = "fr";
