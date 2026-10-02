-- ═══════════════════════════════════════════════════════════════════════════
-- Module Entreprise — retours formateur (quiz, questionnaires, accès élèves).
--
-- 1. Quiz de validation : même structure que le test de positionnement
--    (QCM + bonnes réponses + score), on ajoute une colonne kind plutôt
--    qu'une table miroir — RLS, options et tentatives sont partagées.
-- 2. Questionnaires (tests de satisfaction) : texte d'en-tête (finalité,
--    barème), réponse obligatoire ou non, QCM à choix multiples, et type
--    "Oui / Non" avec champ texte conditionnel.
-- 3. invite_accepted_at : renseigné automatiquement quand le collaborateur
--    définit son mot de passe (must_onboard passe à false), pour afficher un
--    statut fiable ("Compte activé") — profile_id est rempli dès l'envoi de
--    l'invitation et ne suffit donc pas.
--
-- Uniquement des ajouts avec valeurs par défaut : les données et le code
-- existants restent compatibles.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. Quiz de validation ────────────────────────────────────────────────

alter table company_positioning_tests
  add column kind text not null default 'positioning'
    check (kind in ('positioning', 'validation'));

-- ── 2. Questionnaires ────────────────────────────────────────────────────

alter table company_satisfaction_tests add column description text;

alter table company_satisfaction_questions
  add column is_required     boolean not null default true,
  add column allow_multiple  boolean not null default false, -- QCM uniquement
  add column follow_up_on    text check (follow_up_on in ('yes', 'no')), -- Oui/Non uniquement
  add column follow_up_label text;

alter table company_satisfaction_questions
  drop constraint company_satisfaction_questions_question_type_check;
alter table company_satisfaction_questions
  add constraint company_satisfaction_questions_question_type_check
    check (question_type in ('qcm', 'rating', 'text', 'yes_no'));

-- ── 3. Statut d'activation des comptes collaborateurs ─────────────────────

-- security definer : le collaborateur n'a aucun droit d'écriture sur
-- company_employees (RLS admin), c'est son propre passage d'onboarding qui
-- déclenche la mise à jour.
create function mark_company_invite_accepted() returns trigger as $$
begin
  if old.must_onboard and not new.must_onboard and new.company_id is not null then
    update public.company_employees
       set invite_accepted_at = coalesce(invite_accepted_at, now())
     where profile_id = new.id;
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger profiles_mark_company_invite_accepted
  after update of must_onboard on profiles
  for each row execute function mark_company_invite_accepted();

-- Rattrapage des collaborateurs déjà activés avant ce trigger.
update company_employees e
   set invite_accepted_at = now()
  from profiles p
 where p.id = e.profile_id
   and not p.must_onboard
   and e.invite_accepted_at is null;
