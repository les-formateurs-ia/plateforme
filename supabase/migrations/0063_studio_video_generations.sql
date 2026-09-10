-- Module "Imaginez vos vidéos" (Le Studio) : génération vidéo via l'API
-- Higgsfield. Même architecture que 0062_studio_image_generations.sql —
-- réutilise le type studio_image_status (pending/ready/failed, générique,
-- pas spécifique aux images) plutôt que d'en recréer un identique.
create table studio_video_generations (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references profiles(id) on delete cascade,
  status                studio_image_status not null default 'pending',
  model                 text not null,
  options               jsonb not null default '{}', -- réglages spécifiques au modèle (duration, resolution...)
  prompt                text not null,
  source_image_path     text, -- chemin dans le bucket studio-videos, si Image-to-Video
  video_path            text, -- chemin dans le bucket studio-videos, une fois la génération prête
  external_request_id   text,
  error_message         text,
  created_at            timestamptz not null default now(),
  completed_at          timestamptz
);
create index studio_video_generations_user_idx on studio_video_generations (user_id, created_at desc);

alter table studio_video_generations enable row level security;

create policy "studio_videos_select" on studio_video_generations for select
  using (
    user_id = auth.uid()
    or is_admin()
    or exists (select 1 from profiles p where p.id = user_id and p.formateur_id = auth.uid())
  );

create policy "studio_videos_insert_own" on studio_video_generations for insert
  with check (user_id = auth.uid());

create policy "studio_videos_update_own_or_admin" on studio_video_generations for update
  using (user_id = auth.uid() or is_admin());

-- Bucket privé, même schéma de chemins que studio-images :
-- {user_id}/sources/{fichier} (photo de référence), {user_id}/results/{generation_id}.mp4
insert into storage.buckets (id, name, public)
values ('studio-videos', 'studio-videos', false)
on conflict (id) do nothing;

create policy "studio_videos_storage_read" on storage.objects for select
  using (
    bucket_id = 'studio-videos' and (
      (storage.foldername(name))[1] = auth.uid()::text
      or is_admin()
      or exists (select 1 from profiles p where p.id::text = (storage.foldername(name))[1] and p.formateur_id = auth.uid())
    )
  );

create policy "studio_videos_storage_write" on storage.objects for insert
  with check (bucket_id = 'studio-videos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "studio_videos_storage_update" on storage.objects for update
  using (bucket_id = 'studio-videos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "studio_videos_storage_delete" on storage.objects for delete
  using (bucket_id = 'studio-videos' and ((storage.foldername(name))[1] = auth.uid()::text or is_admin()));
