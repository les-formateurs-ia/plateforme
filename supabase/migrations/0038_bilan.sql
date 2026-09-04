-- Bilan de rendez-vous : après la fin d'un créneau, le formateur renseigne
-- Sujet / Next Step / Point fort — affiché ensuite dans l'onglet Rendez-vous
-- de l'élève.
alter table rendez_vous add column bilan_sujet text;
alter table rendez_vous add column bilan_next_step text;
alter table rendez_vous add column bilan_point_fort text;
alter table rendez_vous add column bilan_filled_at timestamptz;

-- check_rendez_vous_constraints() (0025) tournait sur TOUT update de la
-- ligne, y compris un simple remplissage de bilan sur un rendez-vous déjà
-- passé — dès que l'élève avait repris un créneau plus tard (cas normal), la
-- vérification "un seul rendez-vous confirmé à venir" le bloquait à tort. On
-- ajoute :
--   1. un WHEN sur le trigger pour ne déclencher la fonction que si les
--      colonnes réellement concernées par ces contraintes changent ;
--   2. dans la fonction elle-même, une garde interdisant à quiconque hormis
--      le formateur du rendez-vous (ou un admin) de modifier les colonnes de
--      bilan — la policy RLS "rendez_vous_update" (0025) n'est qu'au niveau
--      ligne et laisserait sinon un élève écrire dans le bilan de son propre
--      rendez-vous.
create or replace function check_rendez_vous_constraints() returns trigger as $$
begin
  if (new.bilan_sujet is distinct from old.bilan_sujet
      or new.bilan_next_step is distinct from old.bilan_next_step
      or new.bilan_point_fort is distinct from old.bilan_point_fort
      or new.bilan_filled_at is distinct from old.bilan_filled_at)
     and auth.uid() <> old.formateur_id and not is_admin() then
    raise exception 'Seul le formateur peut renseigner le bilan de ce rendez-vous.';
  end if;

  if new.status <> 'confirmed' then
    return new;
  end if;

  if exists (
    select 1 from rendez_vous
    where student_id = new.student_id
      and status = 'confirmed'
      and slot_date >= current_date
      and id <> coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid)
  ) then
    raise exception 'Vous avez déjà un rendez-vous à venir : modifiez-le au lieu d''en reprendre un second.';
  end if;

  if exists (
    select 1 from rendez_vous
    where formateur_id = new.formateur_id
      and slot_date = new.slot_date
      and status = 'confirmed'
      and id <> coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid)
      and new.start_time < end_time and new.end_time > start_time
  ) then
    raise exception 'Ce créneau chevauche un rendez-vous déjà confirmé.';
  end if;

  return new;
end;
$$ language plpgsql;

-- Un seul trigger "before insert or update" avec WHEN référençant OLD posait
-- problème pour la branche INSERT (OLD n'existe pas) : on sépare en deux
-- triggers, l'un sans WHEN pour l'INSERT (OLD n'a jamais de sens ici), l'autre
-- avec le WHEN pour l'UPDATE (où OLD/NEW existent toujours).
drop trigger rendez_vous_check_constraints on rendez_vous;

create trigger rendez_vous_check_constraints_insert before insert on rendez_vous
  for each row execute function check_rendez_vous_constraints();

create trigger rendez_vous_check_constraints_update before update on rendez_vous
  for each row
  when (
    old.status is distinct from new.status or
    old.slot_date is distinct from new.slot_date or
    old.start_time is distinct from new.start_time or
    old.end_time is distinct from new.end_time or
    old.student_id is distinct from new.student_id or
    old.formateur_id is distinct from new.formateur_id or
    old.bilan_sujet is distinct from new.bilan_sujet or
    old.bilan_next_step is distinct from new.bilan_next_step or
    old.bilan_point_fort is distinct from new.bilan_point_fort or
    old.bilan_filled_at is distinct from new.bilan_filled_at
  )
  execute function check_rendez_vous_constraints();
