-- Formats de podcast multiples par leçon × élève (Analyse approfondie, Briefing
-- express, Regard critique, Débat contradictoire, Mots tout simples). Une leçon
-- peut désormais avoir plusieurs lignes ai_generated_content de content_type
-- 'podcast' pour un même élève, une par format généré, au lieu de l'ancien
-- modèle où toute régénération écrasait l'unique podcast existant.
-- NULL pour les content_type autres que 'podcast' (mindmap, avatar_video, etc.).
alter table ai_generated_content add column variant text;

-- Rétro-compatibilité : les podcasts déjà générés deviennent le format par
-- défaut "Analyse approfondie" (le plus proche du prompt historique).
update ai_generated_content set variant = 'approfondie' where content_type = 'podcast' and variant is null;

drop index if exists ai_generated_content_lookup;
create index ai_generated_content_lookup
  on ai_generated_content (user_id, lesson_id, content_type, variant, created_at desc);
