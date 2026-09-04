-- Connexion Google Calendar par formateur (OAuth) — chaque formateur connecte
-- son propre compte Google ; à la réservation d'un rendez-vous, un évènement
-- Google Meet est créé sur SON agenda avec l'élève en invité (voir la future
-- edge function sync-meet-event). Aucun compte de service partagé.
--
-- google_oauth_tokens contient un refresh_token — il ne doit jamais être
-- lisible par le navigateur (anon/authenticated), même pour son propriétaire.
-- RLS activée sans aucune policy = accès refusé par défaut pour ces deux
-- rôles ; seul un client service-role (utilisé uniquement dans les edge
-- functions ci-dessous) peut y lire/écrire. Même traitement pour
-- google_oauth_states, qui ne sert qu'au flux CSRF-safe start → callback.
create table google_oauth_tokens (
  formateur_id            uuid primary key references profiles(id) on delete cascade,
  refresh_token           text not null,
  access_token            text,
  access_token_expires_at timestamptz,
  google_email            text,
  connected_at            timestamptz not null default now()
);

create table google_oauth_states (
  state         text primary key default encode(extensions.gen_random_bytes(24), 'hex'),
  formateur_id  uuid not null references profiles(id) on delete cascade,
  created_at    timestamptz not null default now()
);

alter table google_oauth_tokens enable row level security;
alter table google_oauth_states enable row level security;

-- État de connexion, public au sens "lisible via les policies profiles
-- existantes" — jamais le token, juste l'email pour l'affichage côté
-- ProfilePage ("Connecté en tant que …").
alter table profiles add column google_calendar_email text;

alter table rendez_vous add column google_event_id text;
alter table rendez_vous add column meet_link text;
