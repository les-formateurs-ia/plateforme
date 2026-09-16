// Catalogue musique Runware (module "Concevez vos propres musiques" du
// Studio). Un seul modèle exposé pour l'instant (MiniMax Music 2.6, cf.
// runware.ai/docs/models/minimax-music-2-6, schéma vérifié le 2026-09-16) —
// pas de sélecteur de modèle côté élève, contrairement aux catalogues image/
// vidéo (studio-models.ts / studio-video-models.ts).
// ATTENTION : comme tout modèle tiers Runware (cf. _shared/runware.ts), ce
// modèle renverra thirdPartyInsufficientCredits tant que le compte Runware
// n'a pas de solde crédité (https://my.runware.ai/wallet) — seule la
// pochette (générée via flux-dev, natif Runware) fonctionnera sans solde.
export const MUSIC_MODEL_ID = "minimax-music-2-6";

export interface StudioMusicModelConfig {
  runwareModel: string;
  buildTask: (params: { prompt: string; instrumental: boolean; lyrics?: string }) => Record<string, unknown>;
}

export const STUDIO_MUSIC_MODELS: Record<string, StudioMusicModelConfig> = {
  [MUSIC_MODEL_ID]: {
    runwareModel: "minimax:music@2.6",
    buildTask: ({ prompt, instrumental, lyrics }) => ({
      taskType: "audioInference",
      model: "minimax:music@2.6",
      positivePrompt: prompt,
      outputFormat: "MP3",
      // Contrainte API : le mode instrumental n'accepte ni lyrics ni
      // lyricsOptimizer. Hors instrumental, les paroles sont déjà structurées
      // par l'étape LLM (cf. generate-studio-music) — pas besoin de
      // lyricsOptimizer sauf si, cas limite, le LLM n'a rien renvoyé.
      settings: instrumental
        ? { instrumental: true }
        : { instrumental: false, ...(lyrics ? { lyrics } : { lyricsOptimizer: true }) },
    }),
  },
};
