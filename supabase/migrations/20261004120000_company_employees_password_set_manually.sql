-- Collaborateurs : mémorise qu'un admin/formateur a défini le mot de passe à
-- la main (Edge Function set-student-password), pour afficher le statut
-- "Mot de passe défini manuellement". Remis à null si l'élève choisit
-- ensuite lui-même son mot de passe via un lien (password-setup).

alter table company_employees
  add column if not exists password_set_manually_at timestamptz;
