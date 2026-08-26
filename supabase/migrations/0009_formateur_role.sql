-- Ajoute le rôle "formateur". Séparé dans sa propre migration : PostgreSQL
-- interdit d'utiliser une nouvelle valeur d'enum dans la même transaction que
-- celle qui l'ajoute (cf. 0010_formateur_permissions.sql pour son usage).
alter type user_role add value if not exists 'formateur';
