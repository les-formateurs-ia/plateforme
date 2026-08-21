-- Vidéos avatar HeyGen personnalisées par leçon × élève (même principe que les
-- podcasts : contenu généré par IA, stocké par utilisateur, jamais dans le
-- template de la leçon). Chemin attendu : {user_id}/{lesson_id}.mp4
alter type ai_content_type add value if not exists 'avatar_video';

insert into storage.buckets (id, name, public)
values ('lesson-avatar-videos', 'lesson-avatar-videos', false)
on conflict (id) do nothing;

create policy "lesson_avatar_videos_owner_read" on storage.objects for select
  using (bucket_id = 'lesson-avatar-videos' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));

create policy "lesson_avatar_videos_owner_write" on storage.objects for insert
  with check (bucket_id = 'lesson-avatar-videos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "lesson_avatar_videos_owner_update" on storage.objects for update
  using (bucket_id = 'lesson-avatar-videos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "lesson_avatar_videos_owner_delete" on storage.objects for delete
  using (bucket_id = 'lesson-avatar-videos' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));
