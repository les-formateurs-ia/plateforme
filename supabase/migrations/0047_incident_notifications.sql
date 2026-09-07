-- ═══════════════════════════════════════════════════════════════════════════
-- Un incident signalé (reported_incidents) notifie tous les admins
-- immédiatement — même canal que les notifications RDV (table notifications,
-- cloche + realtime déjà en place côté front). Le badge "nouveau signalement"
-- à côté de l'onglet Incidents s'appuie sur ces notifications non lues.
-- ═══════════════════════════════════════════════════════════════════════════

alter type notification_type add value 'incident_reported';

alter table notifications add column incident_id uuid references reported_incidents(id) on delete cascade;

-- security definer : le rapporteur (élève, formateur ou admin) n'a par
-- ailleurs aucun droit d'écrire une notification pour un autre utilisateur
-- (cf. policy notifications_insert, limitée aux parties d'un même rdv) — ici
-- on notifie délibérément un tiers (l'admin), donc on bypass la RLS via un
-- trigger plutôt que d'élargir la policy côté client.
create or replace function notify_admins_of_incident()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reporter text;
begin
  select coalesce(nullif(trim(coalesce(first_name, '') || ' ' || coalesce(last_name, '')), ''), email)
    into v_reporter
  from profiles where id = new.user_id;

  insert into notifications (user_id, type, title, body, incident_id)
  select p.id, 'incident_reported', 'Nouvel incident signalé',
    coalesce(v_reporter, 'Un utilisateur') || ' — ' || left(new.description, 140),
    new.id
  from profiles p
  where p.role = 'admin';

  return new;
end;
$$;

create trigger reported_incidents_notify_admins
  after insert on reported_incidents
  for each row execute function notify_admins_of_incident();
