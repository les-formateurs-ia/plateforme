-- ═══════════════════════════════════════════════════════════════════════════
-- "Exercez-vous 2" — duplicat complet et indépendant du module "Pratique IA"
-- (exercise_sessions, html_exercises(+assignments), exercise_tags(+assignments),
-- prompt/media/html_exercise_attempts — voir migrations 0012 à 0032).
--
-- Demande explicite : un second onglet de menu avec sa propre mémoire, ses
-- propres tables/colonnes, entièrement séparé du premier — aucune ligne ni
-- foreign key partagée avec les tables d'origine. Même schéma, mêmes règles
-- RLS, suffixe "_2" sur chaque table/type/bucket.
-- ═══════════════════════════════════════════════════════════════════════════

create type exercise_session_type_2 as enum ('prompt', 'media', 'html');
create type exercise_visibility_2 as enum ('global', 'private');

-- ── Dossiers d'exercice (partagés par les trois exercices prompt/media/html)

create table exercise_sessions_2 (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references profiles(id) on delete cascade,
  exercise_type  exercise_session_type_2 not null,
  name           text,
  description    text,
  exercise_id    uuid,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index exercise_sessions_2_lookup on exercise_sessions_2 (user_id, exercise_type, created_at);
create trigger exercise_sessions_2_set_updated_at before update on exercise_sessions_2
  for each row execute function set_updated_at();

-- ── "Exercices pour vous" — curation admin/formateur, global ou privé

create table html_exercises_2 (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  description   text,
  html_content  text not null default '',
  visibility    exercise_visibility_2 not null default 'private',
  created_by    uuid references profiles(id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create trigger html_exercises_2_set_updated_at before update on html_exercises_2
  for each row execute function set_updated_at();

alter table exercise_sessions_2 add constraint exercise_sessions_2_exercise_fk
  foreign key (exercise_id) references html_exercises_2(id) on delete cascade;
create unique index exercise_sessions_2_user_exercise_unique
  on exercise_sessions_2 (user_id, exercise_id) where exercise_id is not null;

create table html_exercise_assignments_2 (
  id            uuid primary key default gen_random_uuid(),
  exercise_id   uuid not null references html_exercises_2(id) on delete cascade,
  student_id    uuid not null references profiles(id) on delete cascade,
  assigned_by   uuid references profiles(id),
  assigned_at   timestamptz not null default now(),
  unique (exercise_id, student_id)
);

-- ── Tags

create table exercise_tags_2 (
  id            uuid primary key default gen_random_uuid(),
  name          text not null unique,
  created_by    uuid references profiles(id),
  created_at    timestamptz not null default now()
);

create table html_exercise_tag_assignments_2 (
  id            uuid primary key default gen_random_uuid(),
  exercise_id   uuid not null references html_exercises_2(id) on delete cascade,
  tag_id        uuid not null references exercise_tags_2(id) on delete cascade,
  assigned_by   uuid references profiles(id),
  assigned_at   timestamptz not null default now(),
  unique (exercise_id, tag_id)
);

-- ── Tentatives (une table par exercice, comme le module d'origine)

create table prompt_exercise_attempts_2 (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references profiles(id) on delete cascade,
  session_id      uuid not null references exercise_sessions_2(id) on delete cascade,
  attempt_number  integer not null,
  prompt_text     text not null,
  score           integer not null check (score between 0 and 20),
  feedback        jsonb not null, -- { corrections: [{excerpt,suggestion,explanation}], missing: [{title,explanation}], verdict }
  model           text,
  created_at      timestamptz not null default now(),
  unique (session_id, attempt_number)
);
create index prompt_exercise_attempts_2_lookup on prompt_exercise_attempts_2 (user_id, session_id, attempt_number);

create table media_exercise_attempts_2 (
  id                        uuid primary key default gen_random_uuid(),
  user_id                   uuid not null references profiles(id) on delete cascade,
  session_id                uuid not null references exercise_sessions_2(id) on delete cascade,
  attempt_number            integer not null,
  mode                      text not null check (mode in ('image', 'video')),
  prompt_text               text not null,
  corrected_prompt_text     text not null,
  score                     integer not null check (score between 0 and 20),
  feedback                  jsonb not null,
  status                    text not null default 'generating' check (status in ('generating', 'ready', 'failed')),
  error                     text,
  original_media_path       text,
  corrected_media_path      text,
  original_operation_name   text,
  corrected_operation_name  text,
  model                     text,
  created_at                timestamptz not null default now(),
  unique (session_id, attempt_number)
);
create index media_exercise_attempts_2_lookup on media_exercise_attempts_2 (user_id, session_id, attempt_number);

create table html_exercise_attempts_2 (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references profiles(id) on delete cascade,
  session_id      uuid not null references exercise_sessions_2(id) on delete cascade,
  attempt_number  integer not null,
  html_content    text not null,
  created_at      timestamptz not null default now(),
  unique (session_id, attempt_number)
);
create index html_exercise_attempts_2_lookup on html_exercise_attempts_2 (user_id, session_id, attempt_number);

-- ── Storage (résultats image/vidéo de media_exercise_attempts_2)
-- Chemin : {user_id}/{attempt_id}/original.<ext> et {user_id}/{attempt_id}/corrected.<ext>

insert into storage.buckets (id, name, public)
values ('media-exercise-outputs-2', 'media-exercise-outputs-2', false)
on conflict (id) do nothing;

create policy "media_exercise_outputs_2_owner_read" on storage.objects for select
  using (bucket_id = 'media-exercise-outputs-2' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));

create policy "media_exercise_outputs_2_owner_write" on storage.objects for insert
  with check (bucket_id = 'media-exercise-outputs-2' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "media_exercise_outputs_2_owner_update" on storage.objects for update
  using (bucket_id = 'media-exercise-outputs-2' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "media_exercise_outputs_2_owner_delete" on storage.objects for delete
  using (bucket_id = 'media-exercise-outputs-2' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));

-- ── RLS ──────────────────────────────────────────────────────────────────

alter table exercise_sessions_2 enable row level security;
alter table html_exercises_2 enable row level security;
alter table html_exercise_assignments_2 enable row level security;
alter table exercise_tags_2 enable row level security;
alter table html_exercise_tag_assignments_2 enable row level security;
alter table prompt_exercise_attempts_2 enable row level security;
alter table media_exercise_attempts_2 enable row level security;
alter table html_exercise_attempts_2 enable row level security;

create policy "exercise_sessions_2_self" on exercise_sessions_2 for all
  using (user_id = auth.uid() or is_staff())
  with check (user_id = auth.uid() or is_staff());

create policy "html_exercises_2_select" on html_exercises_2 for select
  using (
    is_staff()
    or visibility = 'global'
    or exists (select 1 from html_exercise_assignments_2 a where a.exercise_id = id and a.student_id = auth.uid())
  );
create policy "html_exercises_2_staff_write" on html_exercises_2 for insert with check (is_staff());
create policy "html_exercises_2_staff_update" on html_exercises_2 for update using (is_staff()) with check (is_staff());
create policy "html_exercises_2_staff_delete" on html_exercises_2 for delete using (is_staff());

create policy "html_exercise_assignments_2_select" on html_exercise_assignments_2 for select
  using (is_staff() or student_id = auth.uid());
create policy "html_exercise_assignments_2_staff_write" on html_exercise_assignments_2 for all
  using (is_staff()) with check (is_staff());

create policy "exercise_tags_2_read" on exercise_tags_2 for select using (true);
create policy "exercise_tags_2_admin_insert" on exercise_tags_2 for insert with check (is_admin());
create policy "exercise_tags_2_admin_update" on exercise_tags_2 for update using (is_admin()) with check (is_admin());
create policy "exercise_tags_2_admin_delete" on exercise_tags_2 for delete using (is_admin());

create policy "html_exercise_tag_assignments_2_select" on html_exercise_tag_assignments_2 for select
  using (exists (select 1 from html_exercises_2 he where he.id = exercise_id));
create policy "html_exercise_tag_assignments_2_staff_write" on html_exercise_tag_assignments_2 for all
  using (is_staff()) with check (is_staff());

create policy "prompt_exercise_attempts_2_self" on prompt_exercise_attempts_2 for all
  using (user_id = auth.uid() or is_staff())
  with check (user_id = auth.uid() or is_staff());

create policy "media_exercise_attempts_2_self" on media_exercise_attempts_2 for all
  using (user_id = auth.uid() or is_staff())
  with check (user_id = auth.uid() or is_staff());

create policy "html_exercise_attempts_2_self" on html_exercise_attempts_2 for all
  using (user_id = auth.uid() or is_staff())
  with check (user_id = auth.uid() or is_staff());
