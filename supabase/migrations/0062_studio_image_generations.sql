-- Module "Créer vos images" (Le Studio) : génération d'images via l'API
-- Higgsfield (Soul, Nano Banana, Flux Pro Kontext Max — cf. openapi de
-- api.higgsfield.ai, les seuls modèles image réellement exposés par cette
-- API, indépendamment des noms cités dans le ticket produit). Chaque ligne =
-- une génération, historique par élève, consultable par le staff (formateur
-- de l'élève ou admin) depuis sa fiche.
create type studio_image_status as enum ('pending', 'ready', 'failed');

create table studio_image_generations (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references profiles(id) on delete cascade,
  status                studio_image_status not null default 'pending',
  model                 text not null,
  aspect_ratio          text not null,
  prompt                text not null,
  source_image_path     text, -- chemin dans le bucket studio-images, si Image-to-Image
  image_path            text, -- chemin dans le bucket studio-images, une fois la génération prête
  external_request_id   text, -- request_id Higgsfield, pour le polling de statut
  error_message         text,
  created_at            timestamptz not null default now(),
  completed_at          timestamptz
);
create index studio_image_generations_user_idx on studio_image_generations (user_id, created_at desc);

alter table studio_image_generations enable row level security;

-- Lecture : l'élève voit les siennes, le formateur voit celles de SES élèves
-- (profiles.formateur_id, même règle que 0028_formateur_sees_own_students.sql),
-- l'admin voit tout.
create policy "studio_images_select" on studio_image_generations for select
  using (
    user_id = auth.uid()
    or is_admin()
    or exists (select 1 from profiles p where p.id = user_id and p.formateur_id = auth.uid())
  );

create policy "studio_images_insert_own" on studio_image_generations for insert
  with check (user_id = auth.uid());

-- Update : seul le propriétaire fait avancer sa propre génération (polling
-- de statut, cf. check-studio-image-status) ; l'admin peut aussi corriger/nettoyer.
create policy "studio_images_update_own_or_admin" on studio_image_generations for update
  using (user_id = auth.uid() or is_admin());

-- Bucket privé (comme lesson-podcasts) : accès via URL signée, jamais public.
-- Chemins : {user_id}/sources/{fichier} (image source uploadée par l'élève,
-- Image-to-Image), {user_id}/results/{generation_id}.{ext} (image générée).
insert into storage.buckets (id, name, public)
values ('studio-images', 'studio-images', false)
on conflict (id) do nothing;

create policy "studio_images_storage_read" on storage.objects for select
  using (
    bucket_id = 'studio-images' and (
      (storage.foldername(name))[1] = auth.uid()::text
      or is_admin()
      or exists (select 1 from profiles p where p.id::text = (storage.foldername(name))[1] and p.formateur_id = auth.uid())
    )
  );

create policy "studio_images_storage_write" on storage.objects for insert
  with check (bucket_id = 'studio-images' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "studio_images_storage_update" on storage.objects for update
  using (bucket_id = 'studio-images' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "studio_images_storage_delete" on storage.objects for delete
  using (bucket_id = 'studio-images' and ((storage.foldername(name))[1] = auth.uid()::text or is_admin()));
