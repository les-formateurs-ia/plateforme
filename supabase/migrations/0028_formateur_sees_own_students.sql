-- Un formateur doit pouvoir voir les profils de SES élèves (ceux dont il est
-- le coach attitré, profiles.formateur_id — cf. 0024_student_formateur.sql)
-- sur /admin/planning, désormais ouvert au staff (pas seulement admin). La
-- policy "profiles_self_select" (0001_init_schema.sql) ne couvrait que
-- id = auth.uid() ou is_admin() : un formateur ne pouvait lire AUCUN autre
-- profil, ses élèves y compris — cette policy additionnelle comble le trou
-- sans toucher à celle existante (les policies permissives s'additionnent).
create policy "profiles_formateur_select_own_students" on profiles for select
  using (is_staff() and formateur_id = auth.uid());
