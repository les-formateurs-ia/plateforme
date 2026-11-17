-- Astuces IA : bucket public des exemples visuels (images WEBP/PNG/JPEG, vidéos MP4)
-- et du code HTML des pages web d'exemple (text/plain, jamais servi comme page).
-- Rempli une seule fois, hors application, par
-- scripts/generate-astuces-media.mjs avec la clé service-role (qui contourne
-- RLS) — aucune écriture côté client, donc aucune policy INSERT/UPDATE.
-- Bucket public : la lecture passe par /storage/v1/object/public/…, qui ne
-- consulte pas les policies de storage.objects. Le script crée aussi le
-- bucket s'il manque ; cette migration le documente et le rend reproductible.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('astuces-media', 'astuces-media', true, 52428800, array['image/webp', 'image/png', 'image/jpeg', 'video/mp4', 'text/plain'])
on conflict (id) do nothing;
