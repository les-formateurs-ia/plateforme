-- ═══════════════════════════════════════════════════════════════════════════
-- Tags pour "Exercices pour vous" — classement transverse aux exercices HTML,
-- indépendant de la visibilité globale/privée. Le référentiel de tags
-- (création, renommage, suppression) est réservé à l'admin ; l'attribution
-- ou le retrait d'un tag sur un exercice reste ouvert à l'admin et au
-- formateur, comme l'assignation d'élèves (voir is_staff()).
-- ═══════════════════════════════════════════════════════════════════════════

create table exercise_tags (
  id            uuid primary key default gen_random_uuid(),
  name          text not null unique,
  created_by    uuid references profiles(id),
  created_at    timestamptz not null default now()
);

create table html_exercise_tag_assignments (
  id            uuid primary key default gen_random_uuid(),
  exercise_id   uuid not null references html_exercises(id) on delete cascade,
  tag_id        uuid not null references exercise_tags(id) on delete cascade,
  assigned_by   uuid references profiles(id),
  assigned_at   timestamptz not null default now(),
  unique (exercise_id, tag_id)
);

-- ── RLS ──────────────────────────────────────────────────────────────────

alter table exercise_tags enable row level security;
alter table html_exercise_tag_assignments enable row level security;

-- Les noms de tags ne sont pas sensibles et doivent rester visibles par tout
-- élève pour filtrer/afficher les exercices — même pattern de lecture
-- ouverte que badges/platform_settings.
create policy "exercise_tags_read" on exercise_tags for select using (true);
create policy "exercise_tags_admin_insert" on exercise_tags for insert with check (is_admin());
create policy "exercise_tags_admin_update" on exercise_tags for update using (is_admin()) with check (is_admin());
create policy "exercise_tags_admin_delete" on exercise_tags for delete using (is_admin());

-- Visible par qui peut déjà voir l'exercice concerné (la sous-requête
-- réapplique implicitement html_exercises_select).
create policy "html_exercise_tag_assignments_select" on html_exercise_tag_assignments for select
  using (exists (select 1 from html_exercises he where he.id = exercise_id));
create policy "html_exercise_tag_assignments_staff_write" on html_exercise_tag_assignments for all
  using (is_staff()) with check (is_staff());
