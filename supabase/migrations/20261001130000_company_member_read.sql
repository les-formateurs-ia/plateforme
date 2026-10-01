-- Un collaborateur entreprise doit pouvoir lire la fiche de SA propre
-- entreprise : son espace (CompanyStudentHome) affiche le nom de
-- l'entreprise en en-tête. Jusqu'ici seule companies_staff_select existait
-- (0053), l'élève obtenait donc une ligne vide et voyait "Entreprise" au lieu
-- du nom. same_company() (0053) limite la lecture à l'entreprise du profil
-- connecté ; écriture inchangée (admin uniquement).
create policy "companies_member_select" on companies for select
  using (same_company(id));
