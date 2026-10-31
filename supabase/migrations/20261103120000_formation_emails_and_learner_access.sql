-- E-mails de formation et accès des apprenants :
--   * session_documents.trainee_id : document propre à un stagiaire
--     (convocation, attestation, certificat), qu'il retrouve dans son espace ;
--   * session_emails : journal des e-mails envoyés (manuels ou automatiques),
--     justificatif de remise et garde-fou contre les doublons ;
--   * training_sessions.auto_emails : envois automatiques (convocation J-7,
--     rappel J-1, certificat après la formation) ;
--   * liaison stagiaire ↔ compte Entreprise : un collaborateur invité ou
--     activé est rattaché à ses sessions par son e-mail, et inversement ;
--   * planification quotidienne de formation-email-automations (pg_cron +
--     pg_net), adresse et secret lus dans le coffre (vault).

alter table session_documents add column trainee_id uuid references training_session_trainees(id) on delete cascade;
create index session_documents_trainee_idx on session_documents(trainee_id);
comment on column session_documents.trainee_id is
  'Document individuel d''un stagiaire ; null = document de la session (client, financeur).';

alter table training_sessions add column auto_emails boolean not null default true;
comment on column training_sessions.auto_emails is
  'Envois automatiques : convocations à J-7, rappel à J-1, certificat dès qu''il est émis.';

create table session_emails (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid not null references training_sessions(id) on delete cascade,
  trainee_id  uuid references training_session_trainees(id) on delete set null,
  kind        text not null check (kind in ('espace-client', 'convocation', 'rappel', 'certificat')),
  recipient   text not null,
  status      text not null default 'sent' check (status in ('sent', 'error')),
  error       text,
  automatic   boolean not null default false,
  sent_by     uuid references profiles(id) on delete set null,
  sent_at     timestamptz not null default now()
);
create index session_emails_session_idx on session_emails(session_id, sent_at desc);
alter table session_emails enable row level security;
-- Écrit uniquement par les fonctions d'envoi (service role).
create policy "staff read emails" on session_emails for select using (is_staff());

-- ── Liaison stagiaires ↔ comptes Entreprise ───────────────────────────

-- Un stagiaire inscrit à une session d'entreprise reprend le compte du
-- collaborateur de même e-mail, s'il existe déjà.
create function link_trainee_to_employee() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.profile_id is null then
    select ce.profile_id into new.profile_id
    from company_employees ce join training_sessions s on s.company_id = ce.company_id
    where s.id = new.session_id and lower(ce.email) = lower(new.email) and ce.profile_id is not null
    limit 1;
  end if;
  return new;
end $$;

create trigger training_session_trainees_link_employee
  before insert or update of email on training_session_trainees
  for each row execute function link_trainee_to_employee();

-- Quand un collaborateur reçoit son compte (invitation), ses inscriptions
-- aux sessions de son entreprise sont rattachées à ce compte.
create function propagate_employee_profile() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.profile_id is not null then
    update training_session_trainees t set profile_id = new.profile_id
    from training_sessions s
    where s.id = t.session_id and s.company_id = new.company_id
      and lower(t.email) = lower(new.email) and t.profile_id is null;
  end if;
  return new;
end $$;

create trigger company_employees_propagate_profile
  after insert or update of profile_id on company_employees
  for each row execute function propagate_employee_profile();

-- Rattrapage des inscriptions existantes.
update training_session_trainees t set profile_id = ce.profile_id
from training_sessions s, company_employees ce
where s.id = t.session_id and ce.company_id = s.company_id
  and lower(ce.email) = lower(t.email) and ce.profile_id is not null and t.profile_id is null;

-- L'espace client ne liste que les documents de la session (les exemplaires
-- individuels des stagiaires restent dans leur propre espace).
create or replace function get_client_portal(p_token uuid) returns jsonb
language sql security definer stable set search_path = public as $$
  select jsonb_build_object(
    'reference', s.reference,
    'financement', s.financement,
    'client', s.client->>'nom',
    'formation', s.formation,
    'dateDebut', s.date_debut,
    'dateFin', s.date_fin,
    'lieu', s.lieu,
    'lienConnexion', s.lien_connexion,
    'intervenants', s.intervenants,
    'stagiaires', coalesce((
      select jsonb_agg(jsonb_build_object('id', t.id, 'prenom', t.prenom, 'nom', t.nom, 'fonction', t.fonction) order by t.nom, t.prenom)
      from training_session_trainees t where t.session_id = s.id
    ), '[]'::jsonb),
    'seances', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', sl.id, 'date', sl.slot_date, 'debut', sl.start_time, 'fin', sl.end_time,
        'presents', coalesce((
          select jsonb_agg(a.trainee_id) from attendance_signatures a
          where a.slot_id = sl.id and a.signer_role = 'stagiaire'
        ), '[]'::jsonb),
        'intervenantSigne', exists (select 1 from attendance_signatures a where a.slot_id = sl.id and a.signer_role = 'intervenant')
      ) order by sl.slot_date, sl.start_time)
      from training_session_slots sl where sl.session_id = s.id
    ), '[]'::jsonb),
    'documents', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', d.id, 'templateId', d.template_id, 'title', d.title, 'issuedAt', d.issued_at,
        'requiresSignature', d.requires_signature, 'signedAt', d.signed_at, 'signerName', d.signer_name
      ) order by d.issued_at desc)
      from session_documents d where d.session_id = s.id and d.trainee_id is null
    ), '[]'::jsonb)
  )
  from training_sessions s where s.client_token = p_token;
$$;

-- ── Documents de l'apprenant ──────────────────────────────────────────

create function my_training_documents()
returns table (id uuid, template_id text, title text, issued_at timestamptz, intitule text, date_debut date, date_fin date)
language sql security definer stable set search_path = public as $$
  select d.id, d.template_id, d.title, d.issued_at, s.formation->>'intitule', s.date_debut, s.date_fin
  from session_documents d
  join training_session_trainees t on t.id = d.trainee_id
  join training_sessions s on s.id = d.session_id
  where t.profile_id = auth.uid()
  order by d.issued_at desc;
$$;

create function get_my_training_document(p_document_id uuid)
returns table (title text, html text)
language sql security definer stable set search_path = public as $$
  select d.title, d.html
  from session_documents d join training_session_trainees t on t.id = d.trainee_id
  where d.id = p_document_id and t.profile_id = auth.uid();
$$;

revoke all on function my_training_documents(), get_my_training_document(uuid) from public;
grant execute on function my_training_documents(), get_my_training_document(uuid) to authenticated;
revoke execute on function my_training_documents(), get_my_training_document(uuid) from anon;

-- ── Envois automatiques quotidiens ────────────────────────────────────
-- Chaque matin (7 h UTC), appel de la fonction formation-email-automations.
-- À créer une fois dans le coffre (Dashboard > Project Settings > Vault) :
--   formation_emails_url    = https://<projet>.supabase.co/functions/v1/formation-email-automations
--   formation_emails_secret = même valeur que le secret CRON_SECRET de la fonction

create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule('formation-email-automations', '0 7 * * *', $cron$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'formation_emails_url'),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'formation_emails_secret')
    ),
    body := '{}'::jsonb
  );
$cron$);
