-- Module "Du texte à l'audio" : réglages expressifs optionnels de MiniMax
-- Speech 2.8 (vitesse, volume, hauteur, émotion) — cf.
-- _shared/studio-tts-voices.ts (buildTtsTask) pour les bornes/valeurs
-- acceptées et la justification (champs non documentés côté Runware,
-- repris de l'API MiniMax T2A sous-jacente). Nullable : NULL = valeur par
-- défaut du modèle (et, pour emotion, choix automatique par MiniMax selon
-- le texte, plutôt qu'une émotion neutre forcée).
alter table studio_tts_generations add column speed numeric;
alter table studio_tts_generations add column volume numeric;
alter table studio_tts_generations add column pitch integer;
alter table studio_tts_generations add column emotion text;
