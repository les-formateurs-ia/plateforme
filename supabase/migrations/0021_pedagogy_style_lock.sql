-- Le style de tuteur IA (student_onboarding.ai_tutor_persona) est choisi une
-- fois par l'élève à l'inscription (étape 4 de l'onboarding). Il pilote
-- désormais le ton de tous les prompts IA qui s'adressent à lui — un élève
-- ne doit plus pouvoir le changer lui-même après coup (seul un admin ou un
-- formateur le peut, à sa demande). Même schéma que protect_playground_html
-- (0008) : premier réglage libre (old value null), verrouillé ensuite.
create or replace function protect_ai_tutor_persona() returns trigger as $$
begin
  if new.ai_tutor_persona is distinct from old.ai_tutor_persona
     and old.ai_tutor_persona is not null
     and not is_staff() then
    raise exception 'Seul un formateur ou un administrateur peut modifier le style de tuteur IA.';
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists student_onboarding_protect_tutor_persona on student_onboarding;
create trigger student_onboarding_protect_tutor_persona
  before update on student_onboarding
  for each row execute function protect_ai_tutor_persona();
