-- ═══════════════════════════════════════════════════════════════════════════
-- Suppression complète de l'ancien module "Exercez-vous 2" (duplicat du
-- module "Pratique IA", jamais testé en production — voir migration
-- 0065_practice2_module.sql). Remplacé par 3 nouveaux ateliers, voir
-- migration 0067_practice2_new_exercises.sql.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Storage : le bucket (confirmé vide — module jamais utilisé en
-- production) a été supprimé au préalable via l'API Storage (DELETE
-- /storage/v1/bucket/media-exercise-outputs-2) : Postgres refuse toute
-- écriture directe sur storage.objects/storage.buckets côté hébergement
-- (SQLSTATE 42501), seule l'API Storage peut le faire. Il ne reste donc
-- qu'à retirer les policies RLS orphelines qui référençaient ce bucket.

drop policy if exists "media_exercise_outputs_2_owner_read" on storage.objects;
drop policy if exists "media_exercise_outputs_2_owner_write" on storage.objects;
drop policy if exists "media_exercise_outputs_2_owner_update" on storage.objects;
drop policy if exists "media_exercise_outputs_2_owner_delete" on storage.objects;

-- ── Tables (cascade : une policy croisée entre html_exercises_2 et
-- html_exercise_assignments_2 empêche un simple drop dans l'ordre FK ;
-- cascade est sans risque ici, on supprime tout le module).

drop table if exists html_exercise_tag_assignments_2 cascade;
drop table if exists html_exercise_assignments_2 cascade;
drop table if exists prompt_exercise_attempts_2 cascade;
drop table if exists media_exercise_attempts_2 cascade;
drop table if exists html_exercise_attempts_2 cascade;
drop table if exists exercise_tags_2 cascade;
drop table if exists html_exercises_2 cascade;
drop table if exists exercise_sessions_2 cascade;

-- ── Types

drop type if exists exercise_session_type_2;
drop type if exists exercise_visibility_2;
