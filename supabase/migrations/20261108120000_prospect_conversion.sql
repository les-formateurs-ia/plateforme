-- Conversion d'un prospect en dossier de formation : le prospect garde le
-- lien vers la session créée (devis, programme, puis convention ou contrat),
-- pour rouvrir le dossier depuis sa fiche et éviter une double conversion.
-- Colonne de suivi, modifiable par l'admin comme l'étape et le montant.
begin;

alter table public.project_advisor_leads
  add column session_id uuid references public.training_sessions(id) on delete set null;

create index project_advisor_leads_session_idx on public.project_advisor_leads (session_id)
  where session_id is not null;

grant select (session_id) on public.project_advisor_leads to authenticated;
grant update (session_id) on public.project_advisor_leads to authenticated;

commit;
