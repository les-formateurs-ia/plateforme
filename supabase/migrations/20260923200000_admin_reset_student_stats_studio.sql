-- "Réinitialiser les statistiques" efface aussi tout Le Studio de l'élève :
-- générations image / vidéo / musique / talking head / TTS / doublage et
-- conversations des chats ChatGPT / Gemini / Claude (traces admin en cascade).
-- Reste de la liste inchangé, cf. 20260923190000_admin_reset_student_stats.sql.
--
-- Renvoie désormais [{bucket, path}] : tous les fichiers de l'élève dans les
-- buckets du Studio et dans mission-pdfs (tous rangés sous {user_id}/…),
-- lus ici mais supprimés par le client via l'API Storage — une suppression
-- directe dans storage.objects laisserait les fichiers physiques orphelins.
drop function if exists public.admin_reset_student_stats(uuid);

create function public.admin_reset_student_stats(p_student_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role  user_role;
  v_files jsonb;
begin
  if not public.is_admin() then
    raise exception 'Réservé à l''administrateur.' using errcode = '42501';
  end if;
  select role into v_role from profiles where id = p_student_id;
  if v_role is distinct from 'student' then
    raise exception 'Ce compte n''est pas un élève.' using errcode = '22023';
  end if;

  select coalesce(jsonb_agg(jsonb_build_object('bucket', o.bucket_id, 'path', o.name)), '[]'::jsonb)
    into v_files
    from storage.objects o
   where o.bucket_id in ('mission-pdfs', 'studio-images', 'studio-videos', 'studio-music',
                         'studio-talkinghead', 'studio-tts', 'studio-doublage', 'studio-chat')
     and (storage.foldername(o.name))[1] = p_student_id::text;

  -- Parcours de formation
  delete from lesson_progress where user_id = p_student_id;
  delete from quiz_attempts where user_id = p_student_id;
  delete from user_badges where user_id = p_student_id;
  delete from mission_submissions where student_id = p_student_id;
  delete from chat_messages where user_id = p_student_id;
  delete from agent_conversations where user_id = p_student_id;
  delete from student_ai_memory where user_id = p_student_id;

  -- Le Studio
  delete from studio_image_generations where user_id = p_student_id;
  delete from studio_video_generations where user_id = p_student_id;
  delete from studio_music_generations where user_id = p_student_id;
  delete from studio_talkinghead_generations where user_id = p_student_id;
  delete from studio_tts_generations where user_id = p_student_id;
  delete from studio_doublage_generations where user_id = p_student_id;
  delete from studio_chat_conversations where user_id = p_student_id;

  -- Crédits IA consommés (le plafond ai_budget_usd et les recharges restent)
  delete from ai_usage_events where user_id = p_student_id;
  update profiles set spent_usd = 0 where id = p_student_id;

  return v_files;
end;
$$;

revoke execute on function public.admin_reset_student_stats(uuid) from public, anon;
grant execute on function public.admin_reset_student_stats(uuid) to authenticated;
