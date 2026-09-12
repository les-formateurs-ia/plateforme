-- Oubli dans 0067 : le bucket "ai-detection-images" n'avait que des policies
-- insert/update/delete (staff-only), sans policy select sur storage.objects.
-- Un upload avec { upsert: true } (utilisé par createAiDetectionImage/
-- updateAiDetectionImage) échoue silencieusement en 403 RLS car le backend
-- Storage a besoin d'une policy select pour vérifier si l'objet existe déjà
-- avant de décider insert vs update — le flag "public" du bucket ne couvre
-- que la route de téléchargement anonyme, pas cette vérification interne.
-- Même correctif que lesson-videos (0002_storage.sql), qui a toujours eu
-- cette policy select publique.
create policy "ai_detection_images_bucket_read" on storage.objects for select
  using (bucket_id = 'ai-detection-images');
