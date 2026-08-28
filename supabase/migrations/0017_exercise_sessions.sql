-- Jusqu'ici les "dossiers" d'exercice (Pratique IA) étaient une simple
-- déduction côté client : un session_id partagé par plusieurs tentatives,
-- sans ligne dédiée. Impossible d'y accrocher un nom/une description choisis
-- par l'élève, ou de faire exister un dossier avant sa première tentative
-- (renommer un dossier tout juste créé, par ex.). On fait donc du dossier une
-- vraie ligne, créée explicitement au clic sur "Nouveau test", partagée par
-- les trois exercices (prompt/media/html) plutôt que trois tables identiques.
create type exercise_session_type as enum ('prompt', 'media', 'html');

create table exercise_sessions (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references profiles(id) on delete cascade,
  exercise_type  exercise_session_type not null,
  name           text,
  description    text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index exercise_sessions_lookup on exercise_sessions (user_id, exercise_type, created_at);
create trigger exercise_sessions_set_updated_at before update on exercise_sessions
  for each row execute function set_updated_at();

alter table exercise_sessions enable row level security;
create policy "exercise_sessions_self" on exercise_sessions for all
  using (user_id = auth.uid() or is_staff())
  with check (user_id = auth.uid() or is_staff());

-- Backfill : une ligne exercise_sessions pour chaque session_id déjà utilisé
-- par des tentatives existantes (créées avant cette table), pour pouvoir
-- ensuite rattacher les tentatives par clé étrangère sans rien perdre.
insert into exercise_sessions (id, user_id, exercise_type, created_at)
select session_id, user_id, 'prompt', min(created_at)
from prompt_exercise_attempts group by session_id, user_id
on conflict (id) do nothing;

insert into exercise_sessions (id, user_id, exercise_type, created_at)
select session_id, user_id, 'media', min(created_at)
from media_exercise_attempts group by session_id, user_id
on conflict (id) do nothing;

insert into exercise_sessions (id, user_id, exercise_type, created_at)
select session_id, user_id, 'html', min(created_at)
from html_exercise_attempts group by session_id, user_id
on conflict (id) do nothing;

alter table prompt_exercise_attempts
  add constraint prompt_exercise_attempts_session_fk foreign key (session_id) references exercise_sessions(id) on delete cascade;
alter table media_exercise_attempts
  add constraint media_exercise_attempts_session_fk foreign key (session_id) references exercise_sessions(id) on delete cascade;
alter table html_exercise_attempts
  add constraint html_exercise_attempts_session_fk foreign key (session_id) references exercise_sessions(id) on delete cascade;
