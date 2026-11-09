-- Parcours CPF et suivi des élèves :
--   * formation_instances.available_from : date d'ouverture de la formation
--     attribuée ; avant ce jour, l'élève voit un décompte, puis tout s'ouvre ;
--   * session_emails : journal de TOUS les e-mails du parcours client (accès
--     e-learning, invitations Entreprise…), y compris hors session, avec
--     l'objet envoyé et l'élève ou l'entreprise concernés ;
--   * learner_connections : historique des connexions des élèves (début, fin,
--     durée), écrit uniquement par touch_learner_connection() qui fixe
--     elle-même l'heure, l'IP et le navigateur : rien ne peut être antidaté.
begin;

-- ── Date d'ouverture de la formation ─────────────────────────────────

alter table public.formation_instances add column available_from date;
comment on column public.formation_instances.available_from is
  'Jour d''ouverture de la formation pour l''élève (CPF) ; null = ouverte dès l''attribution.';

-- ── Journal des e-mails du parcours client ───────────────────────────

alter table public.session_emails alter column session_id drop not null;
alter table public.session_emails
  add column profile_id uuid references public.profiles(id) on delete set null,
  add column company_id uuid references public.companies(id) on delete set null,
  add column subject text;
alter table public.session_emails drop constraint if exists session_emails_kind_check;
alter table public.session_emails add constraint session_emails_kind_check
  check (kind in ('espace-client', 'convocation', 'rappel', 'certificat', 'acces-elearning', 'invitation-entreprise'));
create index session_emails_profile_idx on public.session_emails(profile_id, sent_at desc) where profile_id is not null;
create index session_emails_company_idx on public.session_emails(company_id, sent_at desc) where company_id is not null;

-- Rattachement des envois déjà journalisés à l'élève concerné.
update public.session_emails e set profile_id = t.profile_id
from public.training_session_trainees t
where e.trainee_id = t.id and e.profile_id is null and t.profile_id is not null;

-- ── Historique des connexions ────────────────────────────────────────

create table public.learner_connections (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  started_at    timestamptz not null default now(),
  last_seen_at  timestamptz not null default now(),
  ip            text,
  user_agent    text,
  check (last_seen_at >= started_at)
);
create index learner_connections_user_idx on public.learner_connections(user_id, started_at desc);

alter table public.learner_connections enable row level security;
-- Pas de policy d'écriture : seule touch_learner_connection() écrit.
create policy "admin read connections" on public.learner_connections for select using (is_admin());
create policy "user reads own connections" on public.learner_connections for select using (user_id = auth.uid());

-- Appelée par l'espace élève à l'ouverture puis chaque minute tant que
-- l'onglet est visible : prolonge la connexion en cours, ou en ouvre une
-- nouvelle après 15 minutes sans signe de vie.
create function public.touch_learner_connection() returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_id uuid;
begin
  if v_uid is null then return null; end if;
  if not exists (select 1 from profiles where id = v_uid and role = 'student') then return null; end if;
  -- Deux onglets ouverts en même temps prolongent la même connexion.
  perform pg_advisory_xact_lock(hashtext('learner_connection:' || v_uid::text));
  update learner_connections set last_seen_at = now()
  where id = (
    select id from learner_connections
    where user_id = v_uid and last_seen_at > now() - interval '15 minutes'
    order by last_seen_at desc limit 1
  )
  returning id into v_id;
  if v_id is null then
    insert into learner_connections (user_id, ip, user_agent)
    values (v_uid, request_ip(), request_user_agent())
    returning id into v_id;
  end if;
  return v_id;
end $$;

revoke all on function public.touch_learner_connection() from public;
grant execute on function public.touch_learner_connection() to authenticated;
revoke execute on function public.touch_learner_connection() from anon;

commit;
