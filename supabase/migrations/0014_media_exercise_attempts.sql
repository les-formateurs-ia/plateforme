-- Exercice "Génération images & vidéos" (Pratique IA) : même logique que
-- prompt_exercise_attempts (sessions/dossiers, score /20, corrections
-- verbatim, comparaison à la tentative précédente) mais le rendu de chaque
-- tentative n'est pas du texte : c'est une paire de médias générés (image OU
-- vidéo, jamais de texte) — un avec le prompt brut de l'élève, un avec le
-- prompt corrigé par l'IA, pour que l'élève VOIE concrètement la différence.
-- Génération asynchrone (surtout pour la vidéo, Veo peut prendre plusieurs
-- minutes) : status suit generating → ready/failed, le front poll
-- check-media-exercise-status (même leçon que check-avatar-video-status —
-- pas de polling interne à l'Edge Function, budget de temps mur trop court).
create table media_exercise_attempts (
  id                        uuid primary key default gen_random_uuid(),
  user_id                   uuid not null references profiles(id) on delete cascade,
  session_id                uuid not null,
  attempt_number            integer not null,
  mode                      text not null check (mode in ('image', 'video')),
  prompt_text               text not null,
  corrected_prompt_text     text not null,
  score                     integer not null check (score between 0 and 20),
  feedback                  jsonb not null, -- { corrections: [...], missing: [...], verdict }
  status                    text not null default 'generating' check (status in ('generating', 'ready', 'failed')),
  error                     text,
  original_media_path       text,
  corrected_media_path      text,
  original_operation_name   text, -- opération Veo en cours (mode vidéo uniquement, transitoire)
  corrected_operation_name  text,
  model                     text,
  created_at                timestamptz not null default now(),
  unique (session_id, attempt_number)
);
create index media_exercise_attempts_lookup on media_exercise_attempts (user_id, session_id, attempt_number);

alter table media_exercise_attempts enable row level security;
create policy "media_exercise_attempts_self" on media_exercise_attempts for all
  using (user_id = auth.uid() or is_staff())
  with check (user_id = auth.uid() or is_staff());

-- Stockage privé des images/vidéos générées. Chemin attendu :
-- {user_id}/{attempt_id}/original.<ext> et {user_id}/{attempt_id}/corrected.<ext>
-- (même convention que lesson-avatar-videos).
insert into storage.buckets (id, name, public)
values ('media-exercise-outputs', 'media-exercise-outputs', false)
on conflict (id) do nothing;

create policy "media_exercise_outputs_owner_read" on storage.objects for select
  using (bucket_id = 'media-exercise-outputs' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));

create policy "media_exercise_outputs_owner_write" on storage.objects for insert
  with check (bucket_id = 'media-exercise-outputs' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "media_exercise_outputs_owner_update" on storage.objects for update
  using (bucket_id = 'media-exercise-outputs' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "media_exercise_outputs_owner_delete" on storage.objects for delete
  using (bucket_id = 'media-exercise-outputs' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));
