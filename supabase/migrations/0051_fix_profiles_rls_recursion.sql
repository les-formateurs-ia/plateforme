-- INCIDENT : 0050 a introduit une policy RLS sur profiles avec un sous-select
-- corrélé sur profiles lui-même (id = (select formateur_id from profiles
-- where id = auth.uid())). Postgres doit ré-appliquer RLS à ce sous-select,
-- ce qui réévalue la même policy → "infinite recursion detected in policy
-- for relation profiles" sur TOUT select sur profiles, pour tout le monde
-- (site entier redirigé vers signup, cf. is_admin() qui échoue aussi).
--
-- Fix : passer par une fonction security definer (même pattern que is_admin(),
-- 0001) — son corps s'exécute avec les droits du propriétaire de la fonction
-- et n'est donc plus soumis à la RLS de l'appelant, donc plus de récursion.
drop policy "profiles_student_select_own_formateur" on profiles;

create function my_formateur_id() returns uuid as $$
  select formateur_id from public.profiles where id = auth.uid();
$$ language sql security definer stable;

create policy "profiles_student_select_own_formateur" on profiles for select
  using (id = my_formateur_id());
