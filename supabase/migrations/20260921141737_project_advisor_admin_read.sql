begin;

-- Admins can read contact/project data, never the visitor's access credentials.
grant select (id, first_name, last_name, email, profile, sector, need, phone,
  status, created_at, callback_requested_at)
on public.project_advisor_leads to authenticated;

create policy project_advisor_leads_admin_select
on public.project_advisor_leads for select to authenticated
using ((select public.is_admin()));

commit;
