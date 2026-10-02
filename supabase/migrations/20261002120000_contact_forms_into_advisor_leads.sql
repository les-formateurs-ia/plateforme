-- The public site's contact pages (/contact/, /contact/entreprise/, /contact/particulier/)
-- save into the advisor's table, so every request is read in one place ("Demandes IA").
-- `source` tells them apart. Contact rows have no AI session (token), sector or analysis;
-- they always have a phone number. Written only by the contact-request Edge Function.
begin;

alter table public.project_advisor_leads
  alter column access_token_hash drop not null,
  alter column sector drop not null,
  alter column need drop not null,
  -- Company form: company name and size, main challenges.
  add column company text check (char_length(company) between 2 and 160),
  add column challenges text[] check (cardinality(challenges) between 1 and 4
    and challenges <@ array['charge-equipes', 'automatisation', 'charte-conformite', 'cadrage']),
  -- Individual form: employment status and CPF balance knowledge.
  add column employment_status text check (employment_status in ('salarie', 'demandeur-emploi', 'independant-autre')),
  add column cpf_balance text check (cpf_balance in ('oui', 'non', 'aide')),
  -- Campaign parameters of the visit (utm_source, utm_medium, utm_campaign…), if any.
  add column utm jsonb check (jsonb_typeof(utm) = 'object'),
  add constraint project_advisor_leads_source_check
    check (source in ('conseiller-ia', 'contact-general', 'contact-entreprise', 'contact-particulier')),
  add constraint project_advisor_leads_advisor_fields_check
    check (source <> 'conseiller-ia' or (access_token_hash is not null and sector is not null and need is not null)),
  add constraint project_advisor_leads_contact_fields_check
    check (source = 'conseiller-ia' or (phone is not null and access_token_hash is null
      and (source <> 'contact-general' or need is not null)
      and (source <> 'contact-entreprise' or (profile = 'entreprise' and company is not null and challenges is not null))
      and (source <> 'contact-particulier' or (profile = 'particulier' and employment_status is not null and cpf_balance is not null))));

grant select (source, company, challenges, employment_status, cpf_balance, utm)
on public.project_advisor_leads to authenticated;

comment on table public.project_advisor_leads is
  'Prospects du conseiller IA et des pages contact du site (colonne source). Accès serveur uniquement, lecture admin.';
commit;
