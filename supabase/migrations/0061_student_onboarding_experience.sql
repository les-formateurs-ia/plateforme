-- Expérience professionnelle de l'élève (parcours, poste actuel, usage actuel
-- de l'IA...), saisie à la création du compte (par l'élève ou par l'admin) —
-- distincte de "profession" (intitulé de poste court) et de "goal"/"goal_detail"
-- (objectif). Sert de contexte au formateur pour construire la formation.
alter table student_onboarding add column experience text;
