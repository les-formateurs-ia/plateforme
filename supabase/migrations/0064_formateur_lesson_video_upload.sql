-- Ouvre l'upload/remplacement de la vidéo d'une leçon au formateur. Le bucket
-- storage "lesson-videos" (0002_storage.sql) était resté sur is_admin() alors
-- que le contenu pédagogique (table lessons/instance_lessons) est passé à
-- is_staff() depuis 0010/0019 — oubli résiduel, pas une restriction voulue.
drop policy if exists "lesson_videos_admin_insert" on storage.objects;
drop policy if exists "lesson_videos_admin_update" on storage.objects;
drop policy if exists "lesson_videos_admin_delete" on storage.objects;

create policy "lesson_videos_staff_insert" on storage.objects for insert
  with check (bucket_id = 'lesson-videos' and public.is_staff());

create policy "lesson_videos_staff_update" on storage.objects for update
  using (bucket_id = 'lesson-videos' and public.is_staff());

create policy "lesson_videos_staff_delete" on storage.objects for delete
  using (bucket_id = 'lesson-videos' and public.is_staff());
