-- Le formateur ne peut pas enregistrer le bilan d'un rendez-vous passé
-- (PATCH rendez_vous -> 400) à cause de deux règles conçues pour la
-- RÉSERVATION mais qui se redéclenchaient sur un simple remplissage de
-- bilan, alors que slot_date est nécessairement déjà passée à ce moment :
--
--   1. check_rendez_vous_constraints() (0025, étendue en 0038/0044/0045) ne
--      sortait tôt que pour status = 'cancelled' ; pour tout autre statut
--      (donc 'confirmed', le cas normal d'un rdv passé) elle relançait les
--      vérifications "un seul rdv à venir" / "créneau qui chevauche" même
--      quand seules les colonnes de bilan changeaient.
--   2. La contrainte table rendez_vous_future (0023, check simple, ne peut
--      pas lire OLD) revalide slot_date > current_date à CHAQUE update de la
--      ligne, pas seulement quand slot_date change.
--
-- Fix : les deux règles ne doivent s'appliquer que quand une colonne liée à
-- la réservation elle-même change (ou à l'insert) ; un update qui ne touche
-- que le bilan doit pouvoir passer inconditionnellement.

alter table rendez_vous drop constraint rendez_vous_future;

create or replace function check_rendez_vous_constraints() returns trigger as $$
declare
  booking_fields_changed boolean;
begin
  if (new.bilan_sujet is distinct from old.bilan_sujet
      or new.bilan_next_step is distinct from old.bilan_next_step
      or new.bilan_point_fort is distinct from old.bilan_point_fort
      or new.bilan_filled_at is distinct from old.bilan_filled_at
      or new.bilan_attachment_path is distinct from old.bilan_attachment_path
      or new.bilan_attachment_name is distinct from old.bilan_attachment_name)
     and auth.uid() <> old.formateur_id and not is_admin() then
    raise exception 'Seul le formateur peut renseigner le bilan de ce rendez-vous.';
  end if;

  booking_fields_changed := (
    tg_op = 'INSERT'
    or old.status is distinct from new.status
    or old.slot_date is distinct from new.slot_date
    or old.start_time is distinct from new.start_time
    or old.end_time is distinct from new.end_time
    or old.student_id is distinct from new.student_id
    or old.formateur_id is distinct from new.formateur_id
  );

  if not booking_fields_changed then
    return new;
  end if;

  if new.status = 'cancelled' then
    return new;
  end if;

  if tg_op = 'INSERT' and new.slot_date <= current_date then
    raise exception 'Impossible de réserver un rendez-vous dans le passé.';
  end if;

  if exists (
    select 1 from rendez_vous
    where student_id = new.student_id
      and status in ('pending', 'confirmed')
      and slot_date >= current_date
      and id <> coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid)
  ) then
    raise exception 'Vous avez déjà un rendez-vous à venir : modifiez-le au lieu d''en reprendre un second.';
  end if;

  if exists (
    select 1 from rendez_vous
    where formateur_id = new.formateur_id
      and slot_date = new.slot_date
      and status in ('pending', 'confirmed')
      and id <> coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid)
      and new.start_time < end_time and new.end_time > start_time
  ) then
    raise exception 'Ce créneau chevauche un rendez-vous déjà réservé.';
  end if;

  return new;
end;
$$ language plpgsql;
