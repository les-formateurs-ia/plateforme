-- Espace "Prospects" : suivi commercial des demandes (conseiller IA + pages
-- contact) sous forme de tableau Kanban, avec un journal (notes, appels,
-- e-mails, changements d'étape) et des rappels datés.
--
-- Les colonnes d'identité des demandes restent écrites uniquement par les
-- Edge Functions ; l'admin ne peut modifier que les colonnes de suivi
-- ajoutées ici (étape, montant estimé). Le journal et les rappels sont
-- réservés à l'admin, comme la lecture des demandes.
begin;

alter table public.project_advisor_leads
  add column pipeline_stage text not null default 'nouveau'
    check (pipeline_stage in ('nouveau', 'a_rappeler', 'contacte', 'proposition', 'gagne', 'archive')),
  add column stage_changed_at timestamptz not null default now(),
  add column deal_value integer check (deal_value between 0 and 10000000);

-- Les demandes existantes entrent dans le tableau à leur date de réception.
update public.project_advisor_leads set stage_changed_at = created_at;

create index project_advisor_leads_stage_idx
  on public.project_advisor_leads (pipeline_stage, stage_changed_at desc);

grant select (pipeline_stage, stage_changed_at, deal_value)
  on public.project_advisor_leads to authenticated;
grant update (pipeline_stage, stage_changed_at, deal_value)
  on public.project_advisor_leads to authenticated;

create policy project_advisor_leads_admin_update
on public.project_advisor_leads for update to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

-- Journal du prospect. kind = 'etape' est écrit par le trigger ci-dessous
-- (body = nouvelle étape), les autres par l'admin.
create table public.prospect_activities (
  id bigint generated always as identity primary key,
  lead_id bigint not null references public.project_advisor_leads(id) on delete cascade,
  kind text not null check (kind in ('note', 'appel', 'email', 'rdv', 'etape')),
  body text not null check (char_length(body) between 1 and 5000),
  created_by uuid references public.profiles(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);
create index prospect_activities_lead_idx on public.prospect_activities (lead_id, created_at desc);
create index prospect_activities_created_by_idx on public.prospect_activities (created_by);

create table public.prospect_reminders (
  id bigint generated always as identity primary key,
  lead_id bigint not null references public.project_advisor_leads(id) on delete cascade,
  due_at timestamptz not null,
  title text not null check (char_length(title) between 1 and 300),
  done_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);
create index prospect_reminders_lead_idx on public.prospect_reminders (lead_id, due_at);
create index prospect_reminders_open_idx on public.prospect_reminders (due_at) where done_at is null;
create index prospect_reminders_created_by_idx on public.prospect_reminders (created_by);

alter table public.prospect_activities enable row level security;
alter table public.prospect_reminders enable row level security;

create policy prospect_activities_admin_all on public.prospect_activities for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy prospect_reminders_admin_all on public.prospect_reminders for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

grant select, insert, update, delete on public.prospect_activities, public.prospect_reminders to authenticated;
revoke all on public.prospect_activities, public.prospect_reminders from anon;

-- Chaque changement d'étape est daté et laisse une trace dans le journal.
create function public.prospect_log_stage_change()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if new.pipeline_stage is distinct from old.pipeline_stage then
    new.stage_changed_at := now();
    insert into public.prospect_activities (lead_id, kind, body)
      values (new.id, 'etape', new.pipeline_stage);
  end if;
  return new;
end;
$$;

create trigger project_advisor_leads_stage_change
  before update of pipeline_stage on public.project_advisor_leads
  for each row execute function public.prospect_log_stage_change();

commit;
