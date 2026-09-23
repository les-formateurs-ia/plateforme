-- "Réinitialiser les statistiques" (fiche élève, admin) : efface le parcours
-- de test d'un compte élève avant de le remettre au vrai élève, qui repart
-- du module 1 / leçon 1 comme à sa première connexion (le déverrouillage des
-- leçons découle uniquement de lesson_progress, cf. src/app/lib/learning.ts).
--
-- Effacé : progression (lesson_progress), résultats de QCM (quiz_attempts),
-- badges (user_badges, dérivés de la progression), missions rendues
-- (mission_submissions + leurs notifications, en cascade), conversations
-- avec l'Agent et chats de leçon (agent_conversations → agent_messages,
-- chat_messages) avec la mémoire long terme de l'Agent (student_ai_memory) —
-- sinon le tableau de bord compterait encore les questions du test et
-- l'Agent se souviendrait d'une progression qui n'existe plus —, et la
-- consommation de crédits IA (ai_usage_events, spent_usd = 0).
--
-- Conservé : le compte, le profil d'onboarding, les formations attribuées et
-- tout leur contenu (y compris les podcasts/mindmaps déjà générés), le
-- formateur, le plafond de crédits (ai_budget_usd) et l'historique des
-- recharges, les exercices pratiques, les créations du Studio, les rendez-vous.
--
-- Renvoie les chemins des PDF de missions supprimées : le client les efface
-- du bucket mission-pdfs via l'API Storage (jamais par SQL direct).
create or replace function public.admin_reset_student_stats(p_student_id uuid)
returns text[]
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role      user_role;
  v_pdf_paths text[];
begin
  if not public.is_admin() then
    raise exception 'Réservé à l''administrateur.' using errcode = '42501';
  end if;
  select role into v_role from profiles where id = p_student_id;
  if v_role is distinct from 'student' then
    raise exception 'Ce compte n''est pas un élève.' using errcode = '22023';
  end if;

  select coalesce(array_agg(pdf_path) filter (where pdf_path is not null), '{}')
    into v_pdf_paths from mission_submissions where student_id = p_student_id;

  delete from lesson_progress where user_id = p_student_id;
  delete from quiz_attempts where user_id = p_student_id;
  delete from user_badges where user_id = p_student_id;
  delete from mission_submissions where student_id = p_student_id;
  delete from chat_messages where user_id = p_student_id;
  delete from agent_conversations where user_id = p_student_id;
  delete from student_ai_memory where user_id = p_student_id;
  delete from ai_usage_events where user_id = p_student_id;
  update profiles set spent_usd = 0 where id = p_student_id;

  return v_pdf_paths;
end;
$$;

revoke execute on function public.admin_reset_student_stats(uuid) from public, anon;
grant execute on function public.admin_reset_student_stats(uuid) to authenticated;
