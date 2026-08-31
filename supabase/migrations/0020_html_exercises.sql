-- ═══════════════════════════════════════════════════════════════════════════
-- "Exercices pour vous" — curation admin/formateur, global ou privé
--
-- Jusqu'ici un élève créait librement ses propres dossiers d'exercice HTML
-- (exercise_sessions), sans aucun contenu défini par l'équipe pédagogique.
-- On applique ici le même principe que pour les formations : l'exercice
-- (nom + consigne) est défini par admin/formateur, et sa visibilité contrôlée
-- (global = tous les élèves, private = élèves cochés explicitement via une
-- vraie table de jointure, pas un array dénormalisé sur profiles).
-- ═══════════════════════════════════════════════════════════════════════════

create type exercise_visibility as enum ('global', 'private');

create table html_exercises (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  description   text,
  visibility    exercise_visibility not null default 'private',
  created_by    uuid references profiles(id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create trigger html_exercises_set_updated_at before update on html_exercises
  for each row execute function set_updated_at();

create table html_exercise_assignments (
  id            uuid primary key default gen_random_uuid(),
  exercise_id   uuid not null references html_exercises(id) on delete cascade,
  student_id    uuid not null references profiles(id) on delete cascade,
  assigned_by   uuid references profiles(id),
  assigned_at   timestamptz not null default now(),
  unique (exercise_id, student_id)
);

-- Le travail de l'élève (ses tentatives) reste dans exercise_sessions /
-- html_exercise_attempts, inchangées dans leur mécanique — juste rattachées
-- à l'exercice dont elles découlent.
alter table exercise_sessions add column exercise_id uuid references html_exercises(id) on delete cascade;
create unique index exercise_sessions_user_exercise_unique
  on exercise_sessions (user_id, exercise_id) where exercise_id is not null;

-- ── RLS ──────────────────────────────────────────────────────────────────

alter table html_exercises enable row level security;
alter table html_exercise_assignments enable row level security;

create policy "html_exercises_select" on html_exercises for select
  using (
    is_staff()
    or visibility = 'global'
    or exists (select 1 from html_exercise_assignments a where a.exercise_id = id and a.student_id = auth.uid())
  );
create policy "html_exercises_staff_write" on html_exercises for insert with check (is_staff());
create policy "html_exercises_staff_update" on html_exercises for update using (is_staff()) with check (is_staff());
create policy "html_exercises_staff_delete" on html_exercises for delete using (is_staff());

create policy "html_exercise_assignments_select" on html_exercise_assignments for select
  using (is_staff() or student_id = auth.uid());
create policy "html_exercise_assignments_staff_write" on html_exercise_assignments for all
  using (is_staff()) with check (is_staff());
