-- Regroupe les tentatives de l'exercice "Exercices prompts" en sessions
-- ("dossiers") : chaque fois que l'élève quitte l'exercice et y revient via
-- "Commencer", il choisit entre reprendre un dossier existant ou en ouvrir un
-- nouveau ("Nouveau test"). Pas de table sessions séparée : un dossier
-- n'existe que s'il a au moins une tentative (évite les dossiers fantômes
-- créés puis abandonnés avant tout envoi) — le front liste les session_id
-- distincts groupés côté client.
alter table prompt_exercise_attempts add column session_id uuid;

-- Regroupe les tentatives déjà existantes (avant l'introduction des
-- sessions) en un seul dossier "legacy" par élève plutôt que de les éclater
-- arbitrairement une par une.
update prompt_exercise_attempts a
set session_id = sub.session_id
from (
  select distinct user_id, gen_random_uuid() as session_id
  from prompt_exercise_attempts
) sub
where sub.user_id = a.user_id;

alter table prompt_exercise_attempts alter column session_id set not null;

alter table prompt_exercise_attempts drop constraint prompt_exercise_attempts_user_id_attempt_number_key;
alter table prompt_exercise_attempts add constraint prompt_exercise_attempts_session_attempt_key unique (session_id, attempt_number);

drop index if exists prompt_exercise_attempts_lookup;
create index prompt_exercise_attempts_lookup on prompt_exercise_attempts (user_id, session_id, attempt_number);
