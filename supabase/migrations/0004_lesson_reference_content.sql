-- Ajoute le texte de référence fixe d'une leçon (le "cours" que l'élève lit/regarde),
-- distinct de ai_content_prompt qui reste un PROMPT servant à personnaliser ce contenu
-- par IA selon le profil de l'élève (Étape 2). reference_content est la source de
-- vérité pédagogique : ce que l'IA personnalise, elle le personnalise à PARTIR de ce texte,
-- sans jamais en retirer les connaissances obligatoires du référentiel de certification.
alter table lessons add column reference_content text;
comment on column lessons.reference_content is
  'Contenu pédagogique de référence (texte complet du cours), fixe et identique pour tous les élèves. Sert de base à la personnalisation IA (Étape 2) via ai_content_prompt.';
