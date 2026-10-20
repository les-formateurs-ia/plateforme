-- Espace "Prospects" : l'admin crée lui-même les prospects qui n'arrivent
-- pas par le site (Google, MaFormation, réseaux sociaux, appels directs).
--
-- Ces prospects n'ont ni session du conseiller ni formulaire : seuls le nom,
-- le profil et un moyen de contact (téléphone OU e-mail) sont exigés. Les
-- demandes du site restent écrites uniquement par les Edge Functions ; l'admin
-- ne peut créer et supprimer que des prospects saisis à la main.
begin;

alter table public.project_advisor_leads
  alter column email drop not null,
  alter column request_id set default gen_random_uuid(),
  drop constraint project_advisor_leads_source_check,
  add constraint project_advisor_leads_source_check
    check (source in ('conseiller-ia', 'contact-general', 'contact-entreprise', 'contact-particulier',
      'google', 'maformation', 'reseaux-sociaux', 'appel-direct')),
  drop constraint project_advisor_leads_contact_fields_check,
  add constraint project_advisor_leads_contact_fields_check
    check (source = 'conseiller-ia' or (access_token_hash is null
      and (source not like 'contact-%' or (phone is not null and email is not null))
      and (source <> 'contact-general' or need is not null)
      and (source <> 'contact-entreprise' or (profile = 'entreprise' and company is not null and challenges is not null))
      and (source <> 'contact-particulier' or (profile = 'particulier' and employment_status is not null and cpf_balance is not null)))),
  add constraint project_advisor_leads_manual_contact_check
    check (source in ('conseiller-ia', 'contact-general', 'contact-entreprise', 'contact-particulier')
      or phone is not null or email is not null);

grant insert (first_name, last_name, email, phone, profile, company, sector, need, source, pipeline_stage, deal_value)
  on public.project_advisor_leads to authenticated;
grant delete on public.project_advisor_leads to authenticated;
grant usage on sequence public.project_advisor_leads_id_seq to authenticated;

create policy project_advisor_leads_admin_insert
on public.project_advisor_leads for insert to authenticated
with check ((select public.is_admin()) and source in ('google', 'maformation', 'reseaux-sociaux', 'appel-direct'));

create policy project_advisor_leads_admin_delete
on public.project_advisor_leads for delete to authenticated
using ((select public.is_admin()) and source in ('google', 'maformation', 'reseaux-sociaux', 'appel-direct'));

commit;
