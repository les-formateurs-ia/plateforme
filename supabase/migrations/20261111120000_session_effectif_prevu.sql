-- Effectif prévu d'une session : saisi dès la conversion du prospect (devis,
-- programme, convention), avant que chaque apprenant soit inscrit. Les
-- documents retiennent le plus grand de l'effectif prévu et du nombre de
-- stagiaires inscrits. my_formateur_sessions (setof training_sessions) le
-- renvoie tel quel : ce n'est pas une donnée commerciale.
begin;

alter table public.training_sessions
  add column effectif_prevu integer check (effectif_prevu is null or effectif_prevu between 1 and 500);

commit;
