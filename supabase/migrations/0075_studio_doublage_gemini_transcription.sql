-- Module "Parlez n'importe quelle langue" : l'élève ne saisit plus le texte
-- prononcé dans la vidéo à la main — Gemini le transcrit et le traduit
-- directement à partir de la vidéo uploadée (Runware n'a aucune capacité de
-- transcription audio, cf. _shared/gemini-video.ts). script_text n'est donc
-- plus renseigné par les nouvelles générations ; rendu nullable plutôt que
-- supprimé pour ne pas perdre la ligne déjà produite avec l'ancien flux
-- (saisie manuelle, testée en direct par l'utilisatrice le 2026-09-19).
-- Nouvelle colonne source_language : langue d'origine déclarée par l'élève,
-- utilisée pour guider la transcription Gemini.
alter table studio_doublage_generations alter column script_text drop not null;
alter table studio_doublage_generations add column source_language text;
