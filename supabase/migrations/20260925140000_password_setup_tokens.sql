-- Lien "Définir votre mot de passe" (fiche élève admin → bouton "Générer le
-- lien") : l'élève remplace le mot de passe de test par le sien, sur son
-- compte existant. Seul le hash SHA-256 du jeton est stocké ; le jeton en
-- clair n'existe que dans le lien remis à l'élève.
--   • user_id en clé primaire : un seul lien actif par élève — en générer un
--     nouveau écrase la ligne, donc annule l'ancien.
--   • email : l'email du compte au moment de la génération ; si l'email de
--     connexion change entre-temps, le lien ne vaut plus rien (vérifié par
--     l'Edge Function password-setup).
--   • expires_at : fixé par le serveur (72 h), toujours revérifié à l'usage,
--     même avant le passage du nettoyage planifié ci-dessous.
-- Lecture/écriture exclusivement via les Edge Functions (clé service role) :
-- RLS activée sans aucune policy + privilèges retirés à anon/authenticated.
create table public.password_setup_tokens (
  user_id uuid primary key references auth.users(id) on delete cascade,
  token_hash text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  email text not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '72 hours'
);

create index password_setup_tokens_expires_at_idx on public.password_setup_tokens (expires_at);

alter table public.password_setup_tokens enable row level security;
revoke all on table public.password_setup_tokens from anon, authenticated;

-- Liens utilisés/annulés : supprimés sur le moment par les Edge Functions.
-- Liens expirés : purgés ici toutes les heures.
select cron.schedule(
  'purge-expired-password-setup-tokens',
  '17 * * * *',
  $$delete from public.password_setup_tokens where expires_at <= now();$$
);
