-- Bascule du Google Meet vers un compte UNIQUE de la plateforme (au lieu
-- d'un compte personnel par formateur, cf. 0037 : "chaque formateur connecte
-- son propre compte... aucun compte de service partagé"). C'est désormais ce
-- compte qui organise TOUS les Meet, quel que soit le formateur assigné au
-- rendez-vous — formateur et élève restent invités comme participants
-- (cf. sync-meet-event). Un seul compte peut être marqué comme compte
-- plateforme à la fois (index unique partiel ci-dessous). Se connecter
-- (google-oauth-start/callback) est désormais réservé aux admins.
alter table google_oauth_tokens add column is_platform_default boolean not null default false;
create unique index google_oauth_tokens_single_platform_idx on google_oauth_tokens (is_platform_default) where is_platform_default;

-- Le compte déjà connecté le plus récemment (s'il y en a un) devient le
-- compte plateforme par défaut, pour ne pas perdre une connexion existante.
update google_oauth_tokens set is_platform_default = true
where formateur_id = (select formateur_id from google_oauth_tokens order by connected_at desc limit 1);
