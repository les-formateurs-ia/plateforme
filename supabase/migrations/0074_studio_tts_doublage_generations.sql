-- Modules "Du texte à l'audio" et "Parlez n'importe quelle langue" (Le
-- Studio), via l'API Runware. Même architecture 3-niveaux (élève/formateur/
-- admin) que 0073_studio_talkinghead_generations.sql, réutilise
-- studio_image_status (pending/ready/failed, générique).

-- "Du texte à l'audio" : un seul actif Runware (audio), un seul appel
-- MiniMax Speech 2.8 par génération, pas de source uploadée.
create table studio_tts_generations (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references profiles(id) on delete cascade,
  status                studio_image_status not null default 'pending',
  model                 text not null, -- toujours minimax:speech@2.8 pour l'instant (cf. _shared/studio-tts-voices.ts)
  script_text           text not null,
  voice                 text not null,
  language              text not null,
  audio_path            text, -- chemin dans le bucket studio-tts, une fois la génération prête
  external_request_id   text,
  error_message         text,
  created_at            timestamptz not null default now(),
  completed_at          timestamptz
);
create index studio_tts_generations_user_idx on studio_tts_generations (user_id, created_at desc);

alter table studio_tts_generations enable row level security;

create policy "studio_tts_select" on studio_tts_generations for select
  using (
    user_id = auth.uid()
    or is_admin()
    or exists (select 1 from profiles p where p.id = user_id and p.formateur_id = auth.uid())
  );

create policy "studio_tts_insert_own" on studio_tts_generations for insert
  with check (user_id = auth.uid());

create policy "studio_tts_update_own_or_admin" on studio_tts_generations for update
  using (user_id = auth.uid() or is_admin());

insert into storage.buckets (id, name, public)
values ('studio-tts', 'studio-tts', false)
on conflict (id) do nothing;

create policy "studio_tts_storage_read" on storage.objects for select
  using (
    bucket_id = 'studio-tts' and (
      (storage.foldername(name))[1] = auth.uid()::text
      or is_admin()
      or exists (select 1 from profiles p where p.id::text = (storage.foldername(name))[1] and p.formateur_id = auth.uid())
    )
  );

create policy "studio_tts_storage_write" on storage.objects for insert
  with check (bucket_id = 'studio-tts' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "studio_tts_storage_update" on storage.objects for update
  using (bucket_id = 'studio-tts' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "studio_tts_storage_delete" on storage.objects for delete
  using (bucket_id = 'studio-tts' and ((storage.foldername(name))[1] = auth.uid()::text or is_admin()));

-- "Parlez n'importe quelle langue" : vidéo source uploadée + texte traduit
-- (étape LLM intermédiaire, non persistée ailleurs que dans translated_text)
-- + rendu lip-sync final (un seul actif suivi via external_request_id,
-- comme studio_talkinghead_generations).
create table studio_doublage_generations (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references profiles(id) on delete cascade,
  status                studio_image_status not null default 'pending',
  model                 text not null, -- slug interne (cf. _shared/studio-doublage-models.ts)
  script_text           text not null, -- texte source fourni par l'élève (ce qui est dit dans la vidéo)
  translated_text       text, -- texte traduit par le LLM avant synthèse vocale
  target_voice          text not null,
  target_language       text not null,
  source_video_path     text not null, -- chemin dans le bucket studio-doublage (vidéo obligatoire)
  video_path            text, -- chemin dans le bucket studio-doublage, une fois la génération prête
  external_request_id   text,
  error_message         text,
  created_at            timestamptz not null default now(),
  completed_at          timestamptz
);
create index studio_doublage_generations_user_idx on studio_doublage_generations (user_id, created_at desc);

alter table studio_doublage_generations enable row level security;

create policy "studio_doublage_select" on studio_doublage_generations for select
  using (
    user_id = auth.uid()
    or is_admin()
    or exists (select 1 from profiles p where p.id = user_id and p.formateur_id = auth.uid())
  );

create policy "studio_doublage_insert_own" on studio_doublage_generations for insert
  with check (user_id = auth.uid());

create policy "studio_doublage_update_own_or_admin" on studio_doublage_generations for update
  using (user_id = auth.uid() or is_admin());

insert into storage.buckets (id, name, public)
values ('studio-doublage', 'studio-doublage', false)
on conflict (id) do nothing;

create policy "studio_doublage_storage_read" on storage.objects for select
  using (
    bucket_id = 'studio-doublage' and (
      (storage.foldername(name))[1] = auth.uid()::text
      or is_admin()
      or exists (select 1 from profiles p where p.id::text = (storage.foldername(name))[1] and p.formateur_id = auth.uid())
    )
  );

create policy "studio_doublage_storage_write" on storage.objects for insert
  with check (bucket_id = 'studio-doublage' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "studio_doublage_storage_update" on storage.objects for update
  using (bucket_id = 'studio-doublage' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "studio_doublage_storage_delete" on storage.objects for delete
  using (bucket_id = 'studio-doublage' and ((storage.foldername(name))[1] = auth.uid()::text or is_admin()));

-- Le suivi de budget IA (0071_ai_usage_budget.sql) doit accepter les deux
-- nouvelles sources "studio_tts" (coût TTS) et "studio_doublage" (coût
-- traduction + TTS + lip-sync).
alter table ai_usage_events drop constraint ai_usage_events_source_check;
alter table ai_usage_events add constraint ai_usage_events_source_check
  check (source in ('studio_image','studio_video','studio_music','studio_talkinghead','studio_tts','studio_doublage','battle_ground','reverse_prompt'));
