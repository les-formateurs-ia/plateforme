-- Historique des tentatives de l'exercice "Exercices prompts" (Pratique IA) :
-- l'élève écrit un prompt libre, l'IA le note /20 avec corrections détaillées.
-- Exercice transversal (pas lié à une leçon précise), donc table dédiée plutôt
-- que ai_generated_content qui exige un lesson_id. attempt_number est linéaire
-- par élève (1, 2, 3...) pour permettre la navigation/pagination côté front et
-- la comparaison tentative précédente ↔ nouvelle tentative côté prompt IA.
create table prompt_exercise_attempts (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references profiles(id) on delete cascade,
  attempt_number  integer not null,
  prompt_text     text not null,
  score           integer not null check (score between 0 and 20),
  feedback        jsonb not null, -- { corrections: [{excerpt,suggestion,explanation}], missing: [{title,explanation}], verdict }
  model           text,
  created_at      timestamptz not null default now(),
  unique (user_id, attempt_number)
);
create index prompt_exercise_attempts_lookup on prompt_exercise_attempts (user_id, attempt_number);

alter table prompt_exercise_attempts enable row level security;
-- Même logique que ai_content_self / chat_messages_self : l'élève voit et
-- crée ses propres tentatives, admin/formateur peuvent tout voir (suivi
-- pédagogique) mais n'ont pas de raison d'en créer pour un élève.
create policy "prompt_exercise_attempts_self" on prompt_exercise_attempts for all
  using (user_id = auth.uid() or is_staff())
  with check (user_id = auth.uid() or is_staff());
