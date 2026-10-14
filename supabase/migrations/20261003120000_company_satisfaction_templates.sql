-- ═══════════════════════════════════════════════════════════════════════════
-- Questionnaires "globaux" (module Entreprise) : modèles de questionnaire
-- réutilisables d'une entreprise à l'autre.
--
-- Même principe que les templates de formation (0019) : le modèle reste figé
-- et chaque utilisation crée une COPIE indépendante dans
-- company_satisfaction_tests (questions/options recréées avec de nouveaux
-- id) — modifier ou supprimer un modèle ne touche jamais aux questionnaires
-- déjà utilisés ni à leurs réponses.
--
-- Les questions sont stockées en jsonb (instantané, jamais référencé par des
-- réponses) plutôt que dans des tables miroir :
--   [{question, type, isRequired, allowMultiple, followUpOn, followUpLabel,
--     options: [{label}]}]
--
-- Droits : tout le staff (admin + formateur) voit et utilise les modèles et
-- peut en créer ; seul l'auteur ou un admin peut les modifier/supprimer.
-- ═══════════════════════════════════════════════════════════════════════════

create table company_satisfaction_templates (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  description   text,
  questions     jsonb not null default '[]'::jsonb,
  created_by    uuid references profiles(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create trigger company_satisfaction_templates_set_updated_at before update on company_satisfaction_templates
  for each row execute function set_updated_at();

alter table company_satisfaction_templates enable row level security;

create policy "company_satisfaction_templates_staff_select" on company_satisfaction_templates for select
  using (is_staff());
create policy "company_satisfaction_templates_staff_insert" on company_satisfaction_templates for insert
  with check (is_staff() and created_by = auth.uid());
create policy "company_satisfaction_templates_owner_update" on company_satisfaction_templates for update
  using (is_admin() or (is_staff() and created_by = auth.uid()))
  with check (is_admin() or (is_staff() and created_by = auth.uid()));
create policy "company_satisfaction_templates_owner_delete" on company_satisfaction_templates for delete
  using (is_admin() or (is_staff() and created_by = auth.uid()));
