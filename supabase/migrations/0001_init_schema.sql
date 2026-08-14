-- ═══════════════════════════════════════════════════════════════════════════
-- Plateforme e-learning IA — schéma initial
--
-- Principe directeur : séparer le CONTENU TEMPLATE (fixe, créé au back-office)
-- du CONTENU GÉNÉRÉ (personnalisé par IA selon le profil de l'élève).
-- Une leçon ne stocke jamais de texte/mindmap généré : elle stocke des PROMPTS
-- de référence. Le résultat généré vit dans ai_generated_content, par élève.
-- ═══════════════════════════════════════════════════════════════════════════

create extension if not exists pgcrypto;

-- ── Enums ────────────────────────────────────────────────────────────────
create type user_role as enum ('admin', 'student');
create type enrollment_status as enum ('active', 'completed', 'paused');
create type lesson_progress_status as enum ('locked', 'in_progress', 'completed');
create type appointment_status as enum ('requested', 'preparing', 'confirmed', 'completed', 'cancelled');
create type ai_content_type as enum (
  'practical_exercise',   -- cas pratique généré depuis practical_exercise_prompt
  'mindmap',
  'podcast',
  'text_summary',
  'remedial_explanation', -- explication des erreurs si quiz < 75%
  'remedial_quiz'         -- nouvelles questions générées si quiz < 75%
);
create type chat_role as enum ('user', 'ai');
create type video_provider as enum ('cloudflare_stream', 'youtube', 'vimeo', 'external_url');
create type formation_status as enum ('draft', 'published', 'archived');

-- ── updated_at helper ───────────────────────────────────────────────────
create function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ═══════════════════════════════════════════════════════════════════════════
-- IDENTITÉ
-- ═══════════════════════════════════════════════════════════════════════════

-- Étend auth.users. Une ligne est créée automatiquement à l'inscription
-- (voir trigger handle_new_user plus bas).
create table profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  role          user_role not null default 'student',
  first_name    text,
  last_name     text,
  email         text not null unique,
  must_onboard  boolean not null default true, -- force le formulaire à la 1ère connexion
  created_at    timestamptz not null default now()
);

create function handle_new_user() returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Réponses au formulaire de 1ère connexion (préférences, objectif, style d'apprentissage...).
-- raw_answers en jsonb pour absorber l'évolution du formulaire sans migration.
create table student_onboarding (
  user_id       uuid primary key references profiles(id) on delete cascade,
  age           text,
  profession    text,
  goal          text,
  goal_detail   text,
  learning_style text, -- 'visual' | 'audio' | 'project' ...
  ai_tutor_persona text,
  raw_answers   jsonb not null default '{}',
  completed_at  timestamptz not null default now()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- CATALOGUE (le "Template" : formation → sections → leçons)
-- ═══════════════════════════════════════════════════════════════════════════

create table formations (
  id                    uuid primary key default gen_random_uuid(),
  name                  text not null,
  slug                  text not null unique,
  description           text,
  duration_minutes      integer,
  price_cents           integer,
  currency              text not null default 'EUR',
  certification_enabled boolean not null default false,
  certification_prompt  text, -- placeholder, détaillé dans un autre ticket
  status                formation_status not null default 'draft',
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
create trigger formations_set_updated_at before update on formations
  for each row execute function set_updated_at();

create table sections (
  id            uuid primary key default gen_random_uuid(),
  formation_id  uuid not null references formations(id) on delete cascade,
  title         text not null,
  order_index   integer not null,
  created_at    timestamptz not null default now(),
  unique (formation_id, order_index)
);

-- Une leçon = les zones du Template : vidéo, prompt de contenu IA, quiz,
-- prompt d'exercice pratique, durée. Tout le reste est généré à la volée.
create table lessons (
  id                        uuid primary key default gen_random_uuid(),
  section_id                uuid not null references sections(id) on delete cascade,
  slug                      text not null, -- "1 identifiant"
  title                     text not null,
  video_provider            video_provider not null default 'cloudflare_stream',
  video_url                 text,
  video_asset_id            text, -- id spécifique au provider (ex: Cloudflare Stream UID)
  duration_minutes          integer,
  ai_content_prompt         text, -- référence pour générer texte/podcast/mindmap
  practical_exercise_prompt text, -- référence pour générer le cas pratique
  order_index               integer not null,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now(),
  unique (section_id, slug),
  unique (section_id, order_index)
);
create trigger lessons_set_updated_at before update on lessons
  for each row execute function set_updated_at();

-- Banque de questions fixe définie au back-office (pas générée par l'IA).
create table quiz_questions (
  id            uuid primary key default gen_random_uuid(),
  lesson_id     uuid not null references lessons(id) on delete cascade,
  question      text not null,
  explanation   text,
  order_index   integer not null,
  created_at    timestamptz not null default now()
);

create table quiz_options (
  id            uuid primary key default gen_random_uuid(),
  question_id   uuid not null references quiz_questions(id) on delete cascade,
  label         text not null,
  is_correct    boolean not null default false,
  order_index   integer not null
);

-- ═══════════════════════════════════════════════════════════════════════════
-- PERSONNALISATION IA (le contenu qui varie par élève)
-- ═══════════════════════════════════════════════════════════════════════════

-- Cache/historique de tout ce que l'IA a généré pour un élève sur une leçon :
-- cas pratique, mindmap, podcast, résumé, remédiation après échec au quiz.
-- Le front lit toujours la ligne la plus récente par (user_id, lesson_id, content_type).
create table ai_generated_content (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references profiles(id) on delete cascade,
  lesson_id         uuid not null references lessons(id) on delete cascade,
  content_type      ai_content_type not null,
  source_prompt     text not null, -- prompt de référence + contexte profil injecté
  content           jsonb not null,
  model             text,
  regenerated_from  uuid references ai_generated_content(id),
  created_at        timestamptz not null default now()
);
create index ai_generated_content_lookup
  on ai_generated_content (user_id, lesson_id, content_type, created_at desc);

-- Historique des messages du copilote IA dans la leçon, avec flag de garde-fou
-- (hors-sujet → réponse standard + proposition de RDV expert).
create table chat_messages (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references profiles(id) on delete cascade,
  lesson_id     uuid not null references lessons(id) on delete cascade,
  role          chat_role not null,
  content       text not null,
  is_off_topic  boolean not null default false,
  created_at    timestamptz not null default now()
);
create index chat_messages_lookup on chat_messages (user_id, lesson_id, created_at);

-- ═══════════════════════════════════════════════════════════════════════════
-- PARCOURS & PROGRESSION
-- ═══════════════════════════════════════════════════════════════════════════

create table enrollments (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references profiles(id) on delete cascade,
  formation_id  uuid not null references formations(id) on delete cascade,
  status        enrollment_status not null default 'active',
  enrolled_at   timestamptz not null default now(),
  unique (user_id, formation_id)
);

create table lesson_progress (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references profiles(id) on delete cascade,
  lesson_id           uuid not null references lessons(id) on delete cascade,
  status              lesson_progress_status not null default 'locked',
  best_quiz_score     numeric,
  time_spent_seconds  integer not null default 0,
  started_at          timestamptz,
  completed_at        timestamptz,
  unique (user_id, lesson_id)
);

-- Un essai de quiz par tentative. Si score < 75%, l'app doit générer de
-- nouvelles questions (remedial_quiz) + une explication (remedial_explanation)
-- avant de permettre une nouvelle tentative.
create table quiz_attempts (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references profiles(id) on delete cascade,
  lesson_id       uuid not null references lessons(id) on delete cascade,
  attempt_number  integer not null,
  score           numeric not null,
  passed          boolean not null,
  answers         jsonb not null, -- [{question_id, selected_option_id, correct}]
  ai_feedback     text,
  created_at      timestamptz not null default now(),
  unique (user_id, lesson_id, attempt_number)
);

create table badges (
  id            uuid primary key default gen_random_uuid(),
  code          text not null unique,
  name          text not null,
  description   text,
  icon          text,
  criteria      jsonb not null default '{}' -- ex: {"type":"lessons_completed","count":5}
);

create table user_badges (
  user_id     uuid not null references profiles(id) on delete cascade,
  badge_id    uuid not null references badges(id) on delete cascade,
  earned_at   timestamptz not null default now(),
  primary key (user_id, badge_id)
);

-- ═══════════════════════════════════════════════════════════════════════════
-- RENDEZ-VOUS AVEC L'EXPERT IA
-- ═══════════════════════════════════════════════════════════════════════════

create table appointments (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references profiles(id) on delete cascade,
  formation_id    uuid not null references formations(id) on delete cascade,
  section_id      uuid references sections(id) on delete set null, -- fin de module
  status          appointment_status not null default 'requested',
  requested_at    timestamptz not null default now(),
  scheduled_at    timestamptz,
  google_meet_link text,
  admin_message   text,
  handled_by      uuid references profiles(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create trigger appointments_set_updated_at before update on appointments
  for each row execute function set_updated_at();

-- ═══════════════════════════════════════════════════════════════════════════
-- RLS
-- ═══════════════════════════════════════════════════════════════════════════

create function is_admin() returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$ language sql security definer stable;

alter table profiles enable row level security;
alter table student_onboarding enable row level security;
alter table formations enable row level security;
alter table sections enable row level security;
alter table lessons enable row level security;
alter table quiz_questions enable row level security;
alter table quiz_options enable row level security;
alter table ai_generated_content enable row level security;
alter table chat_messages enable row level security;
alter table enrollments enable row level security;
alter table lesson_progress enable row level security;
alter table quiz_attempts enable row level security;
alter table badges enable row level security;
alter table user_badges enable row level security;
alter table appointments enable row level security;

-- profils : chacun voit/édite le sien, l'admin voit tout
create policy "profiles_self_select" on profiles for select using (id = auth.uid() or is_admin());
create policy "profiles_self_update" on profiles for update using (id = auth.uid() or is_admin());
create policy "profiles_admin_write" on profiles for insert with check (is_admin());

create policy "onboarding_self" on student_onboarding for all
  using (user_id = auth.uid() or is_admin())
  with check (user_id = auth.uid() or is_admin());

-- catalogue : lecture publique du contenu publié, écriture réservée à l'admin
create policy "formations_read_published" on formations for select
  using (status = 'published' or is_admin());
create policy "formations_admin_write" on formations for all
  using (is_admin()) with check (is_admin());

create policy "sections_read" on sections for select
  using (exists (select 1 from formations f where f.id = formation_id and (f.status = 'published' or is_admin())));
create policy "sections_admin_write" on sections for all
  using (is_admin()) with check (is_admin());

create policy "lessons_read_enrolled" on lessons for select
  using (
    is_admin() or exists (
      select 1 from sections s
      join enrollments e on e.formation_id = s.formation_id
      where s.id = section_id and e.user_id = auth.uid()
    )
  );
create policy "lessons_admin_write" on lessons for all
  using (is_admin()) with check (is_admin());

create policy "quiz_questions_read_enrolled" on quiz_questions for select
  using (
    is_admin() or exists (
      select 1 from lessons l
      join sections s on s.id = l.section_id
      join enrollments e on e.formation_id = s.formation_id
      where l.id = lesson_id and e.user_id = auth.uid()
    )
  );
create policy "quiz_questions_admin_write" on quiz_questions for all
  using (is_admin()) with check (is_admin());

create policy "quiz_options_read_enrolled" on quiz_options for select
  using (
    is_admin() or exists (
      select 1 from quiz_questions q
      join lessons l on l.id = q.lesson_id
      join sections s on s.id = l.section_id
      join enrollments e on e.formation_id = s.formation_id
      where q.id = question_id and e.user_id = auth.uid()
    )
  );
create policy "quiz_options_admin_write" on quiz_options for all
  using (is_admin()) with check (is_admin());

-- données personnelles : élève voit/écrit les siennes, admin voit tout
create policy "ai_content_self" on ai_generated_content for all
  using (user_id = auth.uid() or is_admin())
  with check (user_id = auth.uid() or is_admin());

create policy "chat_messages_self" on chat_messages for all
  using (user_id = auth.uid() or is_admin())
  with check (user_id = auth.uid() or is_admin());

create policy "enrollments_self_read" on enrollments for select
  using (user_id = auth.uid() or is_admin());
create policy "enrollments_admin_write" on enrollments for all
  using (is_admin()) with check (is_admin());

create policy "lesson_progress_self" on lesson_progress for all
  using (user_id = auth.uid() or is_admin())
  with check (user_id = auth.uid() or is_admin());

create policy "quiz_attempts_self" on quiz_attempts for all
  using (user_id = auth.uid() or is_admin())
  with check (user_id = auth.uid() or is_admin());

create policy "badges_read_all" on badges for select using (true);
create policy "badges_admin_write" on badges for all using (is_admin()) with check (is_admin());

create policy "user_badges_self_read" on user_badges for select
  using (user_id = auth.uid() or is_admin());
create policy "user_badges_admin_write" on user_badges for all
  using (is_admin()) with check (is_admin());

create policy "appointments_self" on appointments for select
  using (user_id = auth.uid() or is_admin());
create policy "appointments_self_insert" on appointments for insert
  with check (user_id = auth.uid() or is_admin());
create policy "appointments_admin_update" on appointments for update
  using (is_admin());
