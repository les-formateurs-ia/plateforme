-- Public advisor widget. Browser clients never access these tables directly.
begin;

create table public.project_advisor_leads (
  id bigint generated always as identity primary key,
  request_id uuid not null unique,
  access_token_hash text not null check (access_token_hash ~ '^[a-f0-9]{64}$'),
  first_name text not null check (char_length(first_name) between 1 and 100),
  last_name text not null check (char_length(last_name) between 1 and 100),
  email text not null check (char_length(email) between 3 and 254),
  profile text not null check (profile in ('entreprise', 'particulier')),
  sector text not null check (char_length(sector) between 2 and 120),
  need text not null check (char_length(need) between 10 and 2000),
  source text not null default 'conseiller-ia',
  privacy_notice_version text not null default '2026-09-21',
  contact_accepted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  status text not null default 'new' check (status in ('new', 'callback_requested')),
  phone text check (phone ~ '^\+[1-9][0-9]{7,14}$'),
  callback_requested_at timestamptz,
  analysis_status text not null default 'pending'
    check (analysis_status in ('pending', 'processing', 'ready', 'failed')),
  analysis_attempts smallint not null default 0 check (analysis_attempts between 0 and 3),
  analysis_started_at timestamptz,
  analysis jsonb check (analysis is null or jsonb_typeof(analysis) = 'object'),
  check (status <> 'callback_requested' or (phone is not null and callback_requested_at is not null)),
  check (analysis_status <> 'ready' or analysis is not null)
);

create index project_advisor_leads_created_idx on public.project_advisor_leads (created_at desc);
create index project_advisor_leads_callback_idx on public.project_advisor_leads (callback_requested_at desc)
  where status = 'callback_requested';

alter table public.project_advisor_leads enable row level security;
revoke all on public.project_advisor_leads from public, anon, authenticated, service_role;
grant select, insert, update, delete on public.project_advisor_leads to service_role;
revoke all on sequence public.project_advisor_leads_id_seq from public, anon, authenticated;
grant usage, select on sequence public.project_advisor_leads_id_seq to service_role;

-- Short-lived counters contain HMACs, not raw email/IP addresses.
create table public.project_advisor_quotas (
  quota_key text not null,
  bucket_start timestamptz not null,
  hits integer not null check (hits > 0),
  primary key (quota_key, bucket_start)
);
create index project_advisor_quotas_expiry_idx on public.project_advisor_quotas (bucket_start);
alter table public.project_advisor_quotas enable row level security;
revoke all on public.project_advisor_quotas from public, anon, authenticated, service_role;
grant select, insert, update, delete on public.project_advisor_quotas to service_role;

-- Atomic increments enforce limits even across concurrent Edge Function instances.
create function public.project_advisor_take_quota(p_key text, p_limit integer, p_seconds integer)
returns boolean language plpgsql security invoker set search_path = '' as $$
declare
  bucket timestamptz;
  consumed integer;
begin
  if p_limit < 1 or p_seconds not between 1 and 86400 or char_length(p_key) > 160 then
    raise exception 'Invalid quota';
  end if;
  bucket := to_timestamp(floor(extract(epoch from now()) / p_seconds) * p_seconds);
  delete from public.project_advisor_quotas where bucket_start < now() - interval '2 days';
  insert into public.project_advisor_quotas as q (quota_key, bucket_start, hits)
    values (p_key, bucket, 1)
    on conflict (quota_key, bucket_start) do update set hits = q.hits + 1
      where q.hits < p_limit
    returning hits into consumed;
  return consumed is not null;
end;
$$;

-- Only one request can generate an analysis. Abandoned jobs can be retried;
-- attempts also identify the owner so a stale worker cannot overwrite a retry.
create function public.project_advisor_claim_analysis(p_request_id uuid, p_token_hash text)
returns setof public.project_advisor_leads
language sql security invoker set search_path = '' as $$
  update public.project_advisor_leads
  set analysis_status = 'processing', analysis_started_at = now(),
      analysis_attempts = analysis_attempts + 1
  where request_id = p_request_id and access_token_hash = p_token_hash
    and created_at > now() - interval '24 hours'
    and analysis_attempts < 3
    and (analysis_status in ('pending', 'failed')
      or (analysis_status = 'processing' and analysis_started_at < now() - interval '90 seconds'))
  returning *;
$$;

revoke all on function public.project_advisor_take_quota(text, integer, integer) from public, anon, authenticated;
revoke all on function public.project_advisor_claim_analysis(uuid, text) from public, anon, authenticated;
grant execute on function public.project_advisor_take_quota(text, integer, integer) to service_role;
grant execute on function public.project_advisor_claim_analysis(uuid, text) to service_role;

comment on table public.project_advisor_leads is
  'Prospects du widget HTML Conseiller Projet IA. Accès serveur uniquement, sans compte élève ni CRM.';
commit;
