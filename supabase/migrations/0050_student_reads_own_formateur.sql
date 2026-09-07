-- "Expert" s'affichait à la place du nom du formateur assigné (Disponibilités,
-- bilans) : profiles_self_select (0001) et profiles_formateur_select_own_students
-- (0028) ne couvrent que "un formateur voit ses élèves" — l'inverse n'existait
-- pas, donc le SELECT d'un élève sur le profil de SON formateur (formateur_id
-- sur sa propre ligne profiles) était bloqué par RLS et retournait aucune
-- ligne, pas juste un nom vide. getFormateurName() (availability.ts) tombait
-- alors sur son fallback "Expert", quel que soit le contenu réel du compte
-- que l'admin avait attribué.
create policy "profiles_student_select_own_formateur" on profiles for select
  using (
    id = (select formateur_id from profiles where id = auth.uid())
  );
