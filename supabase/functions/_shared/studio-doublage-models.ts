// Catalogue Runware pour le module "Parlez n'importe quelle langue" (Le
// Studio) — cf. src/app/lib/studioDoublage.ts, à garder en phase avec ce
// fichier.
//
// Pipeline en 3 étapes (cf. generate-studio-doublage) : 1) le texte fourni
// par l'élève est traduit dans la langue cible via un LLM (textInference,
// même modèle que Battle Ground) ; 2) le texte traduit est synthétisé en
// voix via MiniMax Speech 2.8 (cf. studio-tts-voices.ts) ; 3) la vidéo
// source uploadée + l'audio traduit sont soumis à un modèle de lip-sync
// "vidéo -> vidéo" (videoInference), qui resynchronise les lèvres et les
// micro-expressions sur le nouvel audio.
//
// Runware n'a PAS de modèle de transcription (speech-to-text) à ce jour —
// vérifié le 2026-09-19 sur runware.ai/docs : l'API audio est uniquement
// tournée génération (parole/musique/SFX). Le pipeline demande donc à
// l'élève de fournir le texte prononcé dans la vidéo (plutôt qu'une
// transcription automatique) ; la "traduction intelligente" vient de
// l'étape LLM ci-dessus, qui reformule naturellement pour l'oral plutôt que
// de traduire mot à mot.
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

// Modèle de traduction : réutilise Claude Opus 5 via Runware, déjà vérifié
// en direct pour Battle Ground (generate-battle-responses) — latence ~12.6s,
// plus rapide que GPT-5.4 Pro (~45s) pour ce type de tâche courte.
export const TRANSLATION_MODEL = "anthropic:claude@opus-5";

export function buildTranslationPrompt(text: string, targetLanguageLabel: string): string {
  return `Tu es un traducteur professionnel spécialisé dans le doublage vidéo. Traduis fidèlement le texte suivant en ${targetLanguageLabel}, de façon NATURELLE et fluide à l'oral — comme si un locuteur natif le prononçait à voix haute — en conservant le sens, le ton et une longueur proche de l'original (le doublage doit rester synchronisable avec la vidéo). Si le texte est déjà en ${targetLanguageLabel}, reformule-le légèrement pour qu'il sonne naturel à l'oral plutôt que de le recopier tel quel.

Réponds UNIQUEMENT avec le texte traduit, sans guillemets, sans commentaire, sans préambule.

=== TEXTE ORIGINAL ===
${text}`;
}
