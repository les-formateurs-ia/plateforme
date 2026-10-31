-- Accès direct des stagiaires depuis les e-mails : chaque inscription porte
-- un jeton personnel et durable. Le bouton des e-mails (/acces/:jeton)
-- appelle la fonction learner-access, qui connecte le stagiaire à son espace
-- (lien de connexion à usage unique généré au moment du clic), en créant et
-- rattachant son compte Entreprise si besoin, sans mot de passe à choisir.

alter table training_session_trainees add column access_token uuid not null unique default gen_random_uuid();
comment on column training_session_trainees.access_token is
  'Jeton du lien d''accès direct envoyé par e-mail (/acces/:jeton) ; ne donne accès qu''à un compte apprenant.';
