-- Attribution d'un formateur (coach) à un élève : un formateur peut suivre
-- plusieurs élèves, un élève n'a qu'un seul formateur à la fois. Simple FK
-- nullable sur profiles (auto-référence), pas besoin d'une table à part.
alter table profiles add column formateur_id uuid references profiles(id) on delete set null;
create index profiles_formateur_id_idx on profiles (formateur_id);

-- profiles_self_update (is_admin()) couvre déjà l'écriture de cette colonne
-- par l'admin, cf. 0001_init_schema.sql — aucune policy supplémentaire requise.
