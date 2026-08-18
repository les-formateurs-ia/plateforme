-- ═══════════════════════════════════════════════════════════════════════════
-- Badges : catalogue + attribution automatique.
--
-- user_badges n'est écrivable que par l'admin (RLS de 0001), donc l'élève ne
-- peut pas s'auto-attribuer un badge en écrivant directement dans la table.
-- L'attribution passe par une fonction security definer déclenchée quand une
-- lesson_progress passe à 'completed' — l'élève déclenche l'update sur SA
-- propre ligne (autorisé), le trigger fait l'insert user_badges pour son compte.
-- ═══════════════════════════════════════════════════════════════════════════

insert into badges (code, name, description, icon, criteria) values
  ('first_lesson', 'Première leçon validée', 'Tu as terminé ta première leçon.', '⚡', '{"type":"lessons_completed","count":1}'),
  ('perfect_quiz', 'Quiz parfait', 'Tu as obtenu 100% à un quiz.', '🧠', '{"type":"quiz_score","score":100}'),
  ('module_complete', 'Module terminé', 'Tu as terminé toutes les leçons d''un module.', '🏆', '{"type":"module_completed"}')
on conflict (code) do nothing;

create or replace function public.award_badges_for_user(p_user_id uuid) returns void as $$
declare
  v_badge_id uuid;
begin
  if exists (select 1 from lesson_progress where user_id = p_user_id and status = 'completed') then
    select id into v_badge_id from badges where code = 'first_lesson';
    if v_badge_id is not null then
      insert into user_badges (user_id, badge_id) values (p_user_id, v_badge_id) on conflict do nothing;
    end if;
  end if;

  if exists (select 1 from quiz_attempts where user_id = p_user_id and score = 100) then
    select id into v_badge_id from badges where code = 'perfect_quiz';
    if v_badge_id is not null then
      insert into user_badges (user_id, badge_id) values (p_user_id, v_badge_id) on conflict do nothing;
    end if;
  end if;

  if exists (
    select 1
    from sections s
    join lessons l on l.section_id = s.id
    left join lesson_progress lp
      on lp.lesson_id = l.id and lp.user_id = p_user_id and lp.status = 'completed'
    group by s.id
    having count(l.id) > 0 and count(l.id) = count(lp.lesson_id)
  ) then
    select id into v_badge_id from badges where code = 'module_complete';
    if v_badge_id is not null then
      insert into user_badges (user_id, badge_id) values (p_user_id, v_badge_id) on conflict do nothing;
    end if;
  end if;
end;
$$ language plpgsql security definer set search_path = public;

create or replace function public.trg_award_badges() returns trigger as $$
begin
  if new.status = 'completed' then
    perform public.award_badges_for_user(new.user_id);
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger lesson_progress_award_badges
  after insert or update of status on lesson_progress
  for each row execute function public.trg_award_badges();
