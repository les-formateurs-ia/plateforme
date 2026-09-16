-- Module "Concevez vos propres musiques" (Le Studio) : génération musicale via
-- l'API Runware (MiniMax Music 2.6), précédée d'une étape LLM (Gemini) qui
-- structure les paroles ([Verse]/[Chorus]/...), invente un titre et rédige le
-- prompt de la pochette d'album. Même architecture 3-niveaux (élève/formateur/
-- admin) que 0062_studio_image_generations.sql / 0063_studio_video_generations.sql
-- — réutilise studio_image_status (pending/ready/failed, générique).
--
-- Deux actifs Runware distincts par ligne (audio + pochette), chacun avec son
-- propre external_request_id : la pochette est "best-effort" (un échec ne
-- bloque pas la génération musicale, cf. check-studio-music-status), d'où
-- deux colonnes de suivi séparées plutôt qu'un seul external_request_id comme
-- pour image/vidéo.
create table studio_music_generations (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references profiles(id) on delete cascade,
  status                studio_image_status not null default 'pending',
  model                 text not null, -- AIR Runware du modèle musical (ex. "minimax:music@2.6")
  prompt                text not null, -- description de style/ambiance saisie par l'élève
  instrumental          boolean not null default false,
  lyrics_input          text, -- paroles/idées brutes saisies par l'élève (optionnel)
  title                 text, -- titre généré par le LLM
  lyrics_structured     text, -- paroles restructurées par le LLM (tags [Verse]/[Chorus]/...)
  cover_prompt          text, -- prompt image généré par le LLM pour la pochette
  audio_path            text, -- chemin dans le bucket studio-music, une fois la musique prête
  cover_image_path      text, -- chemin dans le bucket studio-music, une fois la pochette prête
  audio_external_id     text, -- taskUUID Runware (audioInference), pour le polling
  cover_external_id     text, -- taskUUID Runware (imageInference pochette), pour le polling
  error_message         text,
  created_at            timestamptz not null default now(),
  completed_at          timestamptz
);
create index studio_music_generations_user_idx on studio_music_generations (user_id, created_at desc);

alter table studio_music_generations enable row level security;

create policy "studio_music_select" on studio_music_generations for select
  using (
    user_id = auth.uid()
    or is_admin()
    or exists (select 1 from profiles p where p.id = user_id and p.formateur_id = auth.uid())
  );

create policy "studio_music_insert_own" on studio_music_generations for insert
  with check (user_id = auth.uid());

create policy "studio_music_update_own_or_admin" on studio_music_generations for update
  using (user_id = auth.uid() or is_admin());

-- Bucket privé, même schéma que studio-images/studio-videos : accès via URL
-- signée. Chemins : {user_id}/results/{generation_id}-audio.mp3 et
-- {user_id}/results/{generation_id}-cover.{ext} — pas de dossier "sources"
-- (pas d'Audio-to-Audio ni de pochette fournie par l'élève dans ce module).
insert into storage.buckets (id, name, public)
values ('studio-music', 'studio-music', false)
on conflict (id) do nothing;

create policy "studio_music_storage_read" on storage.objects for select
  using (
    bucket_id = 'studio-music' and (
      (storage.foldername(name))[1] = auth.uid()::text
      or is_admin()
      or exists (select 1 from profiles p where p.id::text = (storage.foldername(name))[1] and p.formateur_id = auth.uid())
    )
  );

create policy "studio_music_storage_write" on storage.objects for insert
  with check (bucket_id = 'studio-music' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "studio_music_storage_update" on storage.objects for update
  using (bucket_id = 'studio-music' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "studio_music_storage_delete" on storage.objects for delete
  using (bucket_id = 'studio-music' and ((storage.foldername(name))[1] = auth.uid()::text or is_admin()));

-- Le suivi de budget IA (0071_ai_usage_budget.sql) doit accepter la nouvelle
-- source "studio_music" (coût du morceau + coût best-effort de la pochette).
alter table ai_usage_events drop constraint ai_usage_events_source_check;
alter table ai_usage_events add constraint ai_usage_events_source_check
  check (source in ('studio_image','studio_video','studio_music','battle_ground','reverse_prompt'));
