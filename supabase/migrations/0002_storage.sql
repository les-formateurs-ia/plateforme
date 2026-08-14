-- Stockage des vidéos de leçon. Bucket public en lecture (simple <video src=...>,
-- pas de gating au niveau fichier) mais écriture réservée aux admins — cohérent
-- avec le reste du schéma (RLS sur formations/sections/lessons).
insert into storage.buckets (id, name, public)
values ('lesson-videos', 'lesson-videos', true)
on conflict (id) do nothing;

create policy "lesson_videos_public_read" on storage.objects for select
  using (bucket_id = 'lesson-videos');

create policy "lesson_videos_admin_insert" on storage.objects for insert
  with check (bucket_id = 'lesson-videos' and public.is_admin());

create policy "lesson_videos_admin_update" on storage.objects for update
  using (bucket_id = 'lesson-videos' and public.is_admin());

create policy "lesson_videos_admin_delete" on storage.objects for delete
  using (bucket_id = 'lesson-videos' and public.is_admin());
