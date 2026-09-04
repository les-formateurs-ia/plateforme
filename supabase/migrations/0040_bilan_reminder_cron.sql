-- Rappel automatique de bilan : dès qu'un rendez-vous confirmé est terminé
-- et que son bilan n'est pas rempli, on notifie le formateur (une seule fois
-- par rendez-vous — pas de relance répétée, la notification reste non-lue
-- jusqu'à ce que le bilan soit soumis, cf. submitBilan dans availability.ts).
create extension if not exists pg_cron;

create or replace function public.queue_bilan_reminders() returns void as $$
begin
  insert into notifications (user_id, type, title, body, rdv_id)
  select
    r.formateur_id,
    'bilan_reminder',
    'Bilan à rédiger',
    'Rendez-vous du ' || to_char(r.slot_date, 'DD/MM/YYYY') || ' avec ' ||
      coalesce(nullif(trim(p.first_name || ' ' || coalesce(p.last_name, '')), ''), p.email) ||
      ' — ajoutez votre bilan dans l''onglet Rendez-vous.',
    r.id
  from rendez_vous r
  join profiles p on p.id = r.student_id
  where r.status = 'confirmed'
    and r.bilan_filled_at is null
    and (r.slot_date + r.end_time) at time zone 'Europe/Paris' < now()
    and not exists (
      select 1 from notifications n where n.rdv_id = r.id and n.type = 'bilan_reminder'
    );
end;
$$ language plpgsql security definer set search_path = public;

select cron.schedule('queue-bilan-reminders', '*/15 * * * *', $$select public.queue_bilan_reminders();$$);
