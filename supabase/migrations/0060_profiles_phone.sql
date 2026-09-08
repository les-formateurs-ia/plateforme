-- Numéro de téléphone optionnel, saisi à l'inscription (étape 1, comme
-- l'email) ou renseigné plus tard depuis Paramètres. Pas de contrainte
-- not null/unique : contrairement à l'email, c'est un champ facultatif.
alter table profiles add column phone text;
