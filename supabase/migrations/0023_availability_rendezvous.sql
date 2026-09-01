-- Remplace l'ancien système de rendez-vous (lien de réservation Google
-- Calendar collé en iframe, cf. 0016_platform_settings.sql) par un planning
-- natif : chaque admin/formateur déclare ses créneaux de 15 min disponibles
-- (availability_slots), l'élève réserve directement dedans (rendez_vous).
-- On ne passe plus du tout par Google Calendar/Meet.

drop table if exists appointments;
drop table if exists platform_settings;
drop type if exists appointment_status;

create type rdv_status as enum ('confirmed', 'cancelled');

-- ── Disponibilités déclarées par un admin/formateur (son propre agenda) ────
create table availability_slots (
  id            uuid primary key default gen_random_uuid(),
  formateur_id  uuid not null references profiles(id) on delete cascade,
  slot_date     date not null,
  start_time    time not null,
  created_at    timestamptz not null default now(),
  unique (formateur_id, slot_date, start_time)
);
create index availability_slots_formateur_date_idx on availability_slots (formateur_id, slot_date);

-- ── Rendez-vous réservés par un élève sur un créneau disponible ────────────
-- Réservable uniquement à partir du lendemain (jamais le jour même) —
-- contrainte de sécurité en base en plus du filtre côté client.
create table rendez_vous (
  id            uuid primary key default gen_random_uuid(),
  student_id    uuid not null references profiles(id) on delete cascade,
  formateur_id  uuid not null references profiles(id) on delete cascade,
  slot_date     date not null,
  start_time    time not null,
  end_time      time not null,
  status        rdv_status not null default 'confirmed',
  message       text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint rendez_vous_future check (slot_date > current_date),
  unique (formateur_id, slot_date, start_time)
);
create index rendez_vous_formateur_date_idx on rendez_vous (formateur_id, slot_date);
create index rendez_vous_student_idx on rendez_vous (student_id);
create trigger rendez_vous_set_updated_at before update on rendez_vous
  for each row execute function set_updated_at();

alter table availability_slots enable row level security;
alter table rendez_vous enable row level security;

-- Disponibilités : lisibles par tous les utilisateurs connectés (l'élève doit
-- voir les créneaux libres pour réserver), gérées uniquement par leur
-- propriétaire (admin ou formateur, sur son propre agenda).
create policy "availability_slots_read" on availability_slots for select using (true);
create policy "availability_slots_write" on availability_slots for all
  using (formateur_id = auth.uid() and is_staff())
  with check (formateur_id = auth.uid() and is_staff());

-- Rendez-vous : visibles par l'élève concerné, le formateur concerné, ou
-- l'admin. Créés par l'élève lui-même (jamais pour un autre), annulés par
-- l'élève, le formateur concerné ou l'admin.
create policy "rendez_vous_read" on rendez_vous for select
  using (student_id = auth.uid() or formateur_id = auth.uid() or is_admin());
create policy "rendez_vous_insert" on rendez_vous for insert
  with check (student_id = auth.uid());
create policy "rendez_vous_update" on rendez_vous for update
  using (student_id = auth.uid() or formateur_id = auth.uid() or is_admin());
