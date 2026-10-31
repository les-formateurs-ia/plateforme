-- Rattrapage : la colonne granted_scopes de 20261026120000 manquait en
-- production (migration appliquée partiellement), ce qui faisait échouer
-- le retour de la connexion Google. Idempotent.
alter table google_oauth_tokens add column if not exists granted_scopes text;
comment on column google_oauth_tokens.granted_scopes is
  'Autorisations Google accordées à la connexion (séparées par des espaces) — l''envoi de mails exige gmail.send.';
