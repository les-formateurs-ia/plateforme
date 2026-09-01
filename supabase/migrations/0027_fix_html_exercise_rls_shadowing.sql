-- ═══════════════════════════════════════════════════════════════════════════
-- Fix : les exercices HTML privés n'étaient JAMAIS visibles par l'élève à
-- qui ils étaient pourtant assignés
--
-- La policy "html_exercises_select" (0020_html_exercises.sql) comparait, dans
-- son EXISTS corrélé, `a.exercise_id = id` — mais cet `id` non qualifié se
-- résout, à l'intérieur de la sous-requête sur html_exercise_assignments, à
-- la colonne `id` de CETTE table (son propre PK), pas à html_exercises.id de
-- la ligne externe : classique ombrage de nom de colonne partagé entre les
-- deux tables. La comparaison réelle exécutée était donc
-- `a.exercise_id = a.id`, presque toujours fausse (PK ≠ FK vers un autre
-- exercice), ce qui empêchait la policy de jamais matcher — un exercice privé
-- n'apparaissait donc que pour is_staff() ou visibility = 'global', jamais
-- via une assignation réelle, quelle que soit l'assignation en base.
--
-- Vérifié en conditions réelles (session élève simulée) : l'élève ne voyait
-- que les exercices globaux, alors que la ligne dans html_exercise_assignments
-- pour son exercice privé existait bien et lui était visible individuellement
-- (la policy de html_exercise_assignments, elle, était correcte).
-- ═══════════════════════════════════════════════════════════════════════════

drop policy "html_exercises_select" on html_exercises;
create policy "html_exercises_select" on html_exercises for select
  using (
    is_staff()
    or visibility = 'global'
    or exists (
      select 1 from html_exercise_assignments a
      where a.exercise_id = html_exercises.id and a.student_id = auth.uid()
    )
  );
