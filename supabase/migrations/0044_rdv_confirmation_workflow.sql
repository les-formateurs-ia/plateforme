-- Suite de 0043 : les nouvelles réservations partent "en attente" (le
-- formateur doit confirmer), et les contraintes d'unicité/chevauchement
-- (0025, affinées en 0038) doivent bloquer un créneau dès qu'il est en
-- attente, pas seulement une fois confirmé — sinon un autre élève pourrait
-- réserver/chevaucher le même créneau tant qu'aucune confirmation n'a eu lieu.
alter table rendez_vous alter column status set default 'pending';

create or replace function check_rendez_vous_constraints() returns trigger as $$
begin
  if (new.bilan_sujet is distinct from old.bilan_sujet
      or new.bilan_next_step is distinct from old.bilan_next_step
      or new.bilan_point_fort is distinct from old.bilan_point_fort
      or new.bilan_filled_at is distinct from old.bilan_filled_at)
     and auth.uid() <> old.formateur_id and not is_admin() then
    raise exception 'Seul le formateur peut renseigner le bilan de ce rendez-vous.';
  end if;

  if new.status = 'cancelled' then
    return new;
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
