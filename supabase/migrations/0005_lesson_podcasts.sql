-- Stockage des podcasts personnalisés (un fichier audio par élève × leçon).
-- Bucket privé (contrairement à lesson-videos) : le contenu est dérivé du profil
-- personnel de l'élève (Objectif professionnel), donc accès restreint au
-- propriétaire + admin, via URL signée côté client plutôt qu'URL publique.
-- Chemin attendu : {user_id}/{lesson_id}.wav
insert into storage.buckets (id, name, public)
values ('lesson-podcasts', 'lesson-podcasts', false)
on conflict (id) do nothing;

create policy "lesson_podcasts_owner_read" on storage.objects for select
  using (bucket_id = 'lesson-podcasts' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));

create policy "lesson_podcasts_owner_write" on storage.objects for insert
  with check (bucket_id = 'lesson-podcasts' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "lesson_podcasts_owner_update" on storage.objects for update
  using (bucket_id = 'lesson-podcasts' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "lesson_podcasts_owner_delete" on storage.objects for delete
  using (bucket_id = 'lesson-podcasts' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));
