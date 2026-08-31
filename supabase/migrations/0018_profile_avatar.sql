-- Photo de profil utilisateur : une image par utilisateur, stockée dans le
-- bucket "avatars" (public en lecture, écriture réservée au propriétaire).
-- Chemin fixe {user_id}/avatar (sans extension, content-type porté par le
-- fichier) pour que chaque nouvel envoi écrase l'ancien via upsert plutôt que
-- d'accumuler des fichiers orphelins.
alter table profiles add column avatar_url text;
comment on column profiles.avatar_url is
  'URL publique de la photo de profil (bucket storage "avatars"). Null = avatar par défaut (portrait générique).';

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "avatars_public_read" on storage.objects for select
  using (bucket_id = 'avatars');

create policy "avatars_owner_insert" on storage.objects for insert
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "avatars_owner_update" on storage.objects for update
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "avatars_owner_delete" on storage.objects for delete
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
