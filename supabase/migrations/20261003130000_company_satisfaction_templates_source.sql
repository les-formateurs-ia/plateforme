-- Questionnaires globaux : mémorise le questionnaire d'entreprise dont un
-- modèle global est issu, pour afficher qu'il est "déjà en global" et
-- empêcher de l'y enregistrer plusieurs fois (unique). Si le questionnaire
-- source est supprimé, le modèle global reste (lien remis à null) ; si le
-- modèle est supprimé, le questionnaire peut de nouveau être mis en global.
-- Les modèles créés avant cette migration n'ont pas de source (null).

alter table company_satisfaction_templates
  add column source_test_id uuid unique references company_satisfaction_tests(id) on delete set null;
