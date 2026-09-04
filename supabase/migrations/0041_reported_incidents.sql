-- Signalement d'incidents techniques par les utilisateurs (bouton dans la
-- topbar) + suivi côté admin (liste, statut "à traiter" / "corrigé").
create type incident_page as enum ('lecon', 'tableau_de_bord', 'outil_ia', 'exercice', 'autre');
create type incident_status as enum ('a_traiter', 'corrige');

create table reported_incidents (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  page        incident_page not null,
  description text not null,
  status      incident_status not null default 'a_traiter',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index reported_incidents_status_idx on reported_incidents (status, created_at desc);

create trigger reported_incidents_set_updated_at before update on reported_incidents
  for each row execute function set_updated_at();

alter table reported_incidents enable row level security;

-- Tout utilisateur connecté peut signaler un incident en son nom propre.
create policy "reported_incidents_insert_own" on reported_incidents for insert
  with check (user_id = auth.uid());

-- L'auteur revoit ses propres signalements ; l'admin voit tout (pour la
-- liste de suivi).
create policy "reported_incidents_read_own_or_admin" on reported_incidents for select
  using (user_id = auth.uid() or is_admin());

-- Seul l'admin change le statut (à traiter / corrigé) — pas l'auteur.
create policy "reported_incidents_admin_update" on reported_incidents for update
  using (is_admin()) with check (is_admin());
