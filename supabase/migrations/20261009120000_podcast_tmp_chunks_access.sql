-- ═══════════════════════════════════════════════════════════════════════════
-- Podcasts : les morceaux temporaires redeviennent lisibles par leur auteur.
--
-- La politique restrictive "lesson_generated_media_module_access"
-- (20260925130000_instance_section_access.sql) n'autorise la lecture d'un
-- fichier du bucket lesson-podcasts que si le 2e dossier du chemin est une
-- leçon accessible : {user_id}/{lesson_id}/{format}.wav. Or la synthèse écrit
-- d'abord ses morceaux dans {user_id}/tmp/{lesson_id}/{format}/{n}.pcm
-- (process-podcast-chunk), puis les relit pour les assembler
-- (finalize-podcast-audio) : le 2e dossier vaut "tmp", la vérification
-- échouait, et l'enregistrement d'un morceau renvoyait « new row violates
-- row-level security policy » (l'upload Storage relit la ligne insérée).
-- Depuis le 25/09, aucun élève ne pouvait donc générer de podcast (le staff
-- passait, is_staff() court-circuitant la règle).
--
-- Correctif : pour un chemin {user_id}/tmp/{lesson_id}/…, la même
-- vérification d'accès au module porte sur le 3e dossier. Le reste de la
-- politique est inchangé ; l'appartenance du dossier ({user_id}) reste
-- garantie par les politiques lesson_podcasts_owner_* (0005).
-- ═══════════════════════════════════════════════════════════════════════════

drop policy if exists "lesson_generated_media_module_access" on storage.objects;

create policy "lesson_generated_media_module_access" on storage.objects as restrictive for select
  using (
    storage.objects.bucket_id not in ('lesson-podcasts', 'lesson-avatar-videos')
    or public.is_staff()
    or (storage.objects.bucket_id = 'lesson-podcasts'
        and public.can_access_instance_lesson_path((storage.foldername(storage.objects.name))[2]))
    -- Morceaux temporaires de la synthèse : {user_id}/tmp/{lesson_id}/{format}/{n}.pcm
    or (storage.objects.bucket_id = 'lesson-podcasts'
        and (storage.foldername(storage.objects.name))[2] = 'tmp'
        and public.can_access_instance_lesson_path((storage.foldername(storage.objects.name))[3]))
    or (storage.objects.bucket_id = 'lesson-avatar-videos'
        and public.can_access_instance_lesson_path(split_part(storage.filename(storage.objects.name), '.', 1)))
  );
