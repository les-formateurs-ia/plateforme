-- Sessions de formation et justificatifs Qualiopi (remplace Digiforma) :
--   * training_sessions : une action de formation vendue (entreprise, OPCO,
--     CPF ou particulier), avec les données des documents réglementaires ;
--   * training_session_slots / _trainees : créneaux et stagiaires ;
--   * attendance_signatures : émargement en ligne par créneau, horodaté avec
--     l'adresse IP et le navigateur du signataire ;
--   * session_documents : documents émis (copie figée du HTML + empreinte
--     SHA-256), signés en ligne par lien personnel pour les contrats ;
--   * learning_activity_log : temps passé par jour et par leçon, source des
--     relevés de connexion des formations à distance (CPF).
--
-- Les écritures sensibles (signatures, journal) passent par des fonctions
-- security definer : elles fixent elles-mêmes l'heure, l'IP et l'identité,
-- le client ne peut rien antidater.

create table training_sessions (
  id                   uuid primary key default gen_random_uuid(),
  reference            text not null unique,
  financement          text not null check (financement in ('entreprise', 'opco', 'cpf', 'particulier')),
  financeur            text,
  company_id           uuid references companies(id) on delete set null,
  -- Données des documents : Client et Formation (src/app/lib/documents/types.ts).
  client               jsonb not null,
  formation            jsonb not null,
  lignes               jsonb not null default '[]'::jsonb,
  conditions_paiement  text not null default '',
  date_debut           date not null,
  date_fin             date not null,
  lieu                 text not null default '',
  lien_connexion       text,
  intervenants         jsonb not null default '[]'::jsonb,
  created_by           uuid references profiles(id) on delete set null,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  check (date_fin >= date_debut)
);
create index training_sessions_company_idx on training_sessions(company_id);

create table training_session_slots (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid not null references training_sessions(id) on delete cascade,
  slot_date   date not null,
  start_time  time not null,
  end_time    time not null,
  created_at  timestamptz not null default now(),
  check (end_time > start_time)
);
create index training_session_slots_session_idx on training_session_slots(session_id, slot_date);

create table training_session_trainees (
  id                   uuid primary key default gen_random_uuid(),
  session_id           uuid not null references training_sessions(id) on delete cascade,
  -- Compte plateforme : nécessaire pour émarger en ligne et pour le relevé de connexions.
  profile_id           uuid references profiles(id) on delete set null,
  civilite             text not null default '',
  prenom               text not null,
  nom                  text not null,
  email                text not null,
  fonction             text,
  resultat_evaluation  text,
  created_at           timestamptz not null default now(),
  unique (session_id, email)
);
create index training_session_trainees_profile_idx on training_session_trainees(profile_id);

create table attendance_signatures (
  id                 uuid primary key default gen_random_uuid(),
  slot_id            uuid not null references training_session_slots(id) on delete cascade,
  trainee_id         uuid references training_session_trainees(id) on delete cascade,
  signer_role        text not null check (signer_role in ('stagiaire', 'intervenant')),
  signer_profile_id  uuid references profiles(id) on delete set null,
  signer_name        text not null,
  signed_at          timestamptz not null default now(),
  ip                 text,
  user_agent         text,
  check ((signer_role = 'stagiaire') = (trainee_id is not null))
);
create unique index attendance_signatures_trainee_uniq on attendance_signatures(slot_id, trainee_id) where signer_role = 'stagiaire';
create unique index attendance_signatures_trainer_uniq on attendance_signatures(slot_id) where signer_role = 'intervenant';

create table session_documents (
  id                  uuid primary key default gen_random_uuid(),
  session_id          uuid not null references training_sessions(id) on delete cascade,
  template_id         text not null,
  title               text not null,
  html                text not null,
  html_sha256         text not null,
  requires_signature  boolean not null default false,
  sign_token          uuid not null unique default gen_random_uuid(),
  signer_name         text,
  signer_email        text,
  issued_by           uuid references profiles(id) on delete set null,
  issued_at           timestamptz not null default now(),
  signed_at           timestamptz,
  signed_ip           text,
  signed_user_agent   text
);
create index session_documents_session_idx on session_documents(session_id, issued_at desc);

create table learning_activity_log (
  user_id        uuid not null references profiles(id) on delete cascade,
  activity_date  date not null,
  lesson_id      uuid not null references instance_lessons(id) on delete cascade,
  seconds        integer not null default 0 check (seconds >= 0),
  updated_at     timestamptz not null default now(),
  primary key (user_id, activity_date, lesson_id)
);

-- ── RLS ────────────────────────────────────────────────────────────────

alter table training_sessions enable row level security;
alter table training_session_slots enable row level security;
alter table training_session_trainees enable row level security;
alter table attendance_signatures enable row level security;
alter table session_documents enable row level security;
alter table learning_activity_log enable row level security;

-- Les stagiaires ne lisent pas ces tables (prix et données client de la
-- convention) : la carte d'émargement passe par my_attendance_slots().
create policy "staff manage sessions" on training_sessions for all using (is_staff()) with check (is_staff());
create policy "staff manage slots" on training_session_slots for all using (is_staff()) with check (is_staff());
create policy "staff manage trainees" on training_session_trainees for all using (is_staff()) with check (is_staff());

-- Pas de policy d'écriture : une signature ne se crée que par les fonctions ci-dessous et ne se modifie jamais.
create policy "staff read signatures" on attendance_signatures for select using (is_staff());

create policy "staff read documents" on session_documents for select using (is_staff());
create policy "staff issue documents" on session_documents for insert with check (is_staff() and signed_at is null);
create policy "staff delete unsigned documents" on session_documents for delete using (is_staff() and signed_at is null);

create policy "staff read activity" on learning_activity_log for select using (is_staff());
create policy "user reads own activity" on learning_activity_log for select using (user_id = auth.uid());

-- ── Fonctions ──────────────────────────────────────────────────────────

create function request_ip() returns text as $$
  select nullif(trim(split_part(coalesce(current_setting('request.headers', true)::json->>'x-forwarded-for', ''), ',', 1)), '');
$$ language sql stable;

create function request_user_agent() returns text as $$
  select current_setting('request.headers', true)::json->>'user-agent';
$$ language sql stable;

-- Émargement du stagiaire connecté : le jour du créneau, de 15 minutes avant
-- le début jusqu'à la fin (heure de Paris). Renvoie l'heure de signature,
-- y compris si le créneau était déjà signé.
create function sign_attendance(p_slot_id uuid) returns timestamptz
language plpgsql security definer set search_path = public as $$
declare
  v_slot     training_session_slots%rowtype;
  v_trainee  training_session_trainees%rowtype;
  v_now      timestamp := now() at time zone 'Europe/Paris';
  v_signed   timestamptz;
begin
  select * into v_slot from training_session_slots where id = p_slot_id;
  if not found then raise exception 'Créneau introuvable.'; end if;
  select * into v_trainee from training_session_trainees
    where session_id = v_slot.session_id and profile_id = auth.uid();
  if not found then raise exception 'Vous n''êtes pas inscrit à cette session.'; end if;
  if v_now < v_slot.slot_date + v_slot.start_time - interval '15 minutes' or v_now > v_slot.slot_date + v_slot.end_time then
    raise exception 'L''émargement est ouvert de 15 minutes avant le début jusqu''à la fin de la séance.';
  end if;
  insert into attendance_signatures (slot_id, trainee_id, signer_role, signer_profile_id, signer_name, ip, user_agent)
    values (p_slot_id, v_trainee.id, 'stagiaire', auth.uid(), trim(v_trainee.prenom || ' ' || v_trainee.nom), request_ip(), request_user_agent())
    on conflict do nothing;
  select signed_at into v_signed from attendance_signatures where slot_id = p_slot_id and trainee_id = v_trainee.id;
  return v_signed;
end $$;

-- Séances du stagiaire connecté, du jour aux 30 prochains jours.
create function my_attendance_slots()
returns table (slot_id uuid, slot_date date, start_time time, end_time time, intitule text, signed_at timestamptz)
language sql security definer stable set search_path = public as $$
  select sl.id, sl.slot_date, sl.start_time, sl.end_time, s.formation->>'intitule', a.signed_at
  from training_session_trainees t
  join training_sessions s on s.id = t.session_id
  join training_session_slots sl on sl.session_id = s.id
  left join attendance_signatures a on a.slot_id = sl.id and a.trainee_id = t.id
  where t.profile_id = auth.uid()
    and sl.slot_date between (now() at time zone 'Europe/Paris')::date and (now() at time zone 'Europe/Paris')::date + 30
  order by sl.slot_date, sl.start_time;
$$;

-- Signature de l'intervenant (staff), possible dès le début du créneau.
create function sign_attendance_as_trainer(p_slot_id uuid) returns timestamptz
language plpgsql security definer set search_path = public as $$
declare
  v_slot    training_session_slots%rowtype;
  v_name    text;
  v_signed  timestamptz;
begin
  if not is_staff() then raise exception 'Réservé aux formateurs.'; end if;
  select * into v_slot from training_session_slots where id = p_slot_id;
  if not found then raise exception 'Créneau introuvable.'; end if;
  if now() at time zone 'Europe/Paris' < v_slot.slot_date + v_slot.start_time then
    raise exception 'La séance n''a pas encore commencé.';
  end if;
  select coalesce(nullif(trim(coalesce(first_name, '') || ' ' || coalesce(last_name, '')), ''), email) into v_name
    from profiles where id = auth.uid();
  insert into attendance_signatures (slot_id, signer_role, signer_profile_id, signer_name, ip, user_agent)
    values (p_slot_id, 'intervenant', auth.uid(), v_name, request_ip(), request_user_agent())
    on conflict do nothing;
  select signed_at into v_signed from attendance_signatures where slot_id = p_slot_id and signer_role = 'intervenant';
  return v_signed;
end $$;

-- Lien de signature d'un document (accessible sans compte, le jeton fait foi).
create function get_document_for_signing(p_token uuid)
returns table (title text, html text, html_sha256 text, signer_name text, signed_at timestamptz)
language sql security definer stable set search_path = public as $$
  select d.title, d.html, d.html_sha256, d.signer_name, d.signed_at
  from session_documents d where d.sign_token = p_token and d.requires_signature;
$$;

create function sign_document(p_token uuid) returns timestamptz
language plpgsql security definer set search_path = public as $$
declare v_signed timestamptz;
begin
  update session_documents
    set signed_at = now(), signed_ip = request_ip(), signed_user_agent = request_user_agent()
    where sign_token = p_token and requires_signature and signed_at is null;
  select signed_at into v_signed from session_documents where sign_token = p_token and requires_signature;
  if v_signed is null then raise exception 'Document introuvable.'; end if;
  return v_signed;
end $$;

-- Temps passé sur une leçon, cumulé par jour (heure de Paris). Plafonné à
-- 5 minutes par appel : le lecteur envoie toutes les 30 secondes.
create function log_learning_time(p_lesson_id uuid, p_seconds integer) returns void
language sql security definer set search_path = public as $$
  insert into learning_activity_log (user_id, activity_date, lesson_id, seconds)
  select auth.uid(), (now() at time zone 'Europe/Paris')::date, p_lesson_id, least(greatest(p_seconds, 0), 300)
  where auth.uid() is not null and p_seconds > 0
  on conflict (user_id, activity_date, lesson_id)
  do update set seconds = learning_activity_log.seconds + excluded.seconds, updated_at = now();
$$;

-- Relevé d'activité d'un élève entre deux dates (staff) : temps journalier
-- par leçon, temps cumulé avant la mise en place du journal (daté du début
-- de la leçon) et missions remises.
create function trainee_activity(p_profile_id uuid, p_from date, p_to date)
returns table (activity_date date, activite text, seconds integer)
language plpgsql security definer stable set search_path = public as $$
begin
  if not is_staff() then raise exception 'Réservé aux formateurs.'; end if;
  return query
  select l.activity_date, 'Leçon : ' || il.title, l.seconds
    from learning_activity_log l join instance_lessons il on il.id = l.lesson_id
    where l.user_id = p_profile_id and l.activity_date between p_from and p_to
  union all
  select (coalesce(lp.started_at, lp.completed_at) at time zone 'Europe/Paris')::date,
         'Leçon : ' || il.title || ' (temps cumulé)',
         lp.time_spent_seconds - coalesce((select sum(x.seconds) from learning_activity_log x where x.user_id = lp.user_id and x.lesson_id = lp.lesson_id), 0)::integer
    from lesson_progress lp join instance_lessons il on il.id = lp.lesson_id
    where lp.user_id = p_profile_id
      and lp.time_spent_seconds > coalesce((select sum(x.seconds) from learning_activity_log x where x.user_id = lp.user_id and x.lesson_id = lp.lesson_id), 0)
      and (coalesce(lp.started_at, lp.completed_at) at time zone 'Europe/Paris')::date between p_from and p_to
  union all
  select (m.submitted_at at time zone 'Europe/Paris')::date, 'Mission remise : ' || il.title, 0
    from mission_submissions m join instance_lessons il on il.id = m.lesson_id
    where m.student_id = p_profile_id and m.status = 'submitted'
      and (m.submitted_at at time zone 'Europe/Paris')::date between p_from and p_to
  order by 1, 2;
end $$;

revoke all on function my_attendance_slots(), sign_attendance(uuid), sign_attendance_as_trainer(uuid), sign_document(uuid),
  get_document_for_signing(uuid), log_learning_time(uuid, integer), trainee_activity(uuid, date, date) from public;
grant execute on function my_attendance_slots(), sign_attendance(uuid), sign_attendance_as_trainer(uuid), log_learning_time(uuid, integer),
  trainee_activity(uuid, date, date) to authenticated;
grant execute on function get_document_for_signing(uuid), sign_document(uuid) to anon, authenticated;
-- Supabase accorde par défaut l'exécution à anon : retrait explicite pour
-- les fonctions réservées aux comptes connectés (elles vérifient aussi l'identité).
revoke execute on function my_attendance_slots(), sign_attendance(uuid), sign_attendance_as_trainer(uuid),
  log_learning_time(uuid, integer), trainee_activity(uuid, date, date) from anon;
