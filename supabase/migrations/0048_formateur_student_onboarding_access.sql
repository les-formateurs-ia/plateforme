-- Le formateur doit pouvoir consulter (âge, profession, objectif) et
-- modifier (objectif professionnel, style de tuteur IA) le dossier
-- onboarding de SES élèves depuis sa fiche élève — même principe que
-- 0028_formateur_sees_own_students.sql pour profiles. La policy
-- "onboarding_self" (0001_init_schema.sql) ne couvrait que
-- user_id = auth.uid() ou is_admin() : le formateur n'avait aucun accès à
-- l'onboarding de ses élèves.
create policy "onboarding_formateur_own_students" on student_onboarding for all
  using (
    is_staff() and exists (
      select 1 from profiles p where p.id = student_onboarding.user_id and p.formateur_id = auth.uid()
    )
  )
  with check (
    is_staff() and exists (
      select 1 from profiles p where p.id = student_onboarding.user_id and p.formateur_id = auth.uid()
    )
  );
