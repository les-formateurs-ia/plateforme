-- Pièce jointe PDF sur le bilan de rendez-vous (cf. 0038_bilan.sql) : le
-- formateur peut joindre un fichier, stocké dans un bucket privé au chemin
-- {rdv_id}/{filename} (même principe que lesson-avatar-videos, 0006), visible
-- par les deux participants du rendez-vous et l'admin, modifiable uniquement
-- par le formateur.
alter table rendez_vous add column bilan_attachment_path text;
alter table rendez_vous add column bilan_attachment_name text;

-- Étend la garde bilan (0038) et le WHEN du trigger update aux nouvelles
-- colonnes — sans ça, une modification qui ne touche QUE la pièce jointe ne
-- déclencherait pas la fonction et l'élève pourrait l'écrire librement (RLS
-- "rendez_vous_update" n'est qu'au niveau ligne).
create or replace function check_rendez_vous_constraints() returns trigger as $$
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

drop trigger rendez_vous_check_constraints_update on rendez_vous;
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
    old.bilan_filled_at is distinct from new.bilan_filled_at or
    old.bilan_attachment_path is distinct from new.bilan_attachment_path or
    old.bilan_attachment_name is distinct from new.bilan_attachment_name
  )
  execute function check_rendez_vous_constraints();

insert into storage.buckets (id, name, public)
values ('rdv-bilan-attachments', 'rdv-bilan-attachments', false)
on conflict (id) do nothing;

create policy "rdv_bilan_attachments_read" on storage.objects for select
  using (
    bucket_id = 'rdv-bilan-attachments'
    and exists (
      select 1 from rendez_vous r
      where r.id::text = (storage.foldername(name))[1]
        and (r.student_id = auth.uid() or r.formateur_id = auth.uid() or public.is_admin())
    )
  );

create policy "rdv_bilan_attachments_formateur_insert" on storage.objects for insert
  with check (
    bucket_id = 'rdv-bilan-attachments'
    and exists (
      select 1 from rendez_vous r
      where r.id::text = (storage.foldername(name))[1]
        and (r.formateur_id = auth.uid() or public.is_admin())
    )
  );

create policy "rdv_bilan_attachments_formateur_update" on storage.objects for update
  using (
    bucket_id = 'rdv-bilan-attachments'
    and exists (
      select 1 from rendez_vous r
      where r.id::text = (storage.foldername(name))[1]
        and (r.formateur_id = auth.uid() or public.is_admin())
    )
  );

create policy "rdv_bilan_attachments_formateur_delete" on storage.objects for delete
  using (
    bucket_id = 'rdv-bilan-attachments'
    and exists (
      select 1 from rendez_vous r
      where r.id::text = (storage.foldername(name))[1]
        and (r.formateur_id = auth.uid() or public.is_admin())
    )
  );
