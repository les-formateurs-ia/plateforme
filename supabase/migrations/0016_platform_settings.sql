-- Réglages plateforme (singleton, une seule ligne — voir le check ci-dessous).
-- Pour l'instant : le lien de la page de réservation Google Calendar
-- ("Appointment schedule") de l'expert IA, configuré par un admin/formateur
-- dans AdminAppointmentsPage et affiché en iframe à l'élève sur la page
-- Planning quand il demande un rendez-vous. La prise de créneau réelle (et
-- la génération du lien Google Meet) se fait côté Google, pas dans notre
-- BDD — appointments.google_meet_link reste un champ de secours manuel.
create table platform_settings (
  id                  boolean primary key default true,
  expert_booking_url  text,
  updated_at          timestamptz not null default now(),
  constraint platform_settings_singleton check (id)
);
insert into platform_settings (id) values (true) on conflict (id) do nothing;
create trigger platform_settings_set_updated_at before update on platform_settings
  for each row execute function set_updated_at();

alter table platform_settings enable row level security;
-- Lu par tous (le lien de réservation n'a rien de sensible, l'élève doit
-- pouvoir le charger), écrit uniquement par admin/formateur.
create policy "platform_settings_read" on platform_settings for select using (true);
create policy "platform_settings_write" on platform_settings for update using (is_staff()) with check (is_staff());
