-- Exercice "Exercices pour vous" (Pratique IA) : un bac à sable HTML/JS pour
-- l'élève, avec exactement le même fonctionnement que le Playground d'une
-- leçon (LessonPage.tsx) — même injection window.__PLATFORM_AUTH__, même
-- appel à ai-proxy pour parler à Gemini sans exposer de clé. Pas d'évaluation
-- IA ici (contrairement aux deux autres exercices) : on stocke juste le HTML
-- collé, groupé en sessions/dossiers navigables comme les autres exercices.
create table html_exercise_attempts (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references profiles(id) on delete cascade,
  session_id      uuid not null,
  attempt_number  integer not null,
  html_content    text not null,
  created_at      timestamptz not null default now(),
  unique (session_id, attempt_number)
);
create index html_exercise_attempts_lookup on html_exercise_attempts (user_id, session_id, attempt_number);

alter table html_exercise_attempts enable row level security;
create policy "html_exercise_attempts_self" on html_exercise_attempts for all
  using (user_id = auth.uid() or is_staff())
  with check (user_id = auth.uid() or is_staff());
