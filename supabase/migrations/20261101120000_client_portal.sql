-- Espace client d'une formation : un lien personnel (sans compte) donne au
-- client accès, pendant et après la formation, à ses dates, son programme
-- et tous ses documents (devis, convention, convocations, certificats),
-- qu'il signe sur place. Le jeton est propre à la session ; les fonctions
-- ci-dessous ne renvoient que les données de cette session.

alter table training_sessions add column client_token uuid not null unique default gen_random_uuid();
comment on column training_sessions.client_token is
  'Jeton du lien de l''espace client (/espace-client/:token), sans compte.';

create function get_client_portal(p_token uuid) returns jsonb
language sql security definer stable set search_path = public as $$
  select jsonb_build_object(
    'reference', s.reference,
    'financement', s.financement,
    'client', s.client->>'nom',
    'formation', jsonb_build_object(
      'intitule', s.formation->>'intitule',
      'accroche', s.formation->>'accroche',
      'dureeHeures', s.formation->'dureeHeures',
      'modalite', s.formation->>'modalite',
      'objectifs', s.formation->'objectifs'
    ),
    'dateDebut', s.date_debut,
    'dateFin', s.date_fin,
    'lieu', s.lieu,
    'lienConnexion', s.lien_connexion,
    'intervenants', s.intervenants,
    'stagiaires', (select count(*) from training_session_trainees t where t.session_id = s.id),
    'seances', coalesce((
      select jsonb_agg(jsonb_build_object('date', sl.slot_date, 'debut', sl.start_time, 'fin', sl.end_time) order by sl.slot_date, sl.start_time)
      from training_session_slots sl where sl.session_id = s.id
    ), '[]'::jsonb),
    'documents', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', d.id, 'templateId', d.template_id, 'title', d.title, 'issuedAt', d.issued_at,
        'requiresSignature', d.requires_signature, 'signedAt', d.signed_at, 'signerName', d.signer_name
      ) order by d.issued_at desc)
      from session_documents d where d.session_id = s.id
    ), '[]'::jsonb)
  )
  from training_sessions s where s.client_token = p_token;
$$;

create function get_client_document(p_token uuid, p_document_id uuid)
returns table (title text, html text, html_sha256 text, issued_at timestamptz, requires_signature boolean,
               signer_name text, signed_at timestamptz, signed_ip text, signed_user_agent text)
language sql security definer stable set search_path = public as $$
  select d.title, d.html, d.html_sha256, d.issued_at, d.requires_signature, d.signer_name, d.signed_at, d.signed_ip, d.signed_user_agent
  from session_documents d join training_sessions s on s.id = d.session_id
  where s.client_token = p_token and d.id = p_document_id;
$$;

create function sign_client_document(p_token uuid, p_document_id uuid) returns timestamptz
language plpgsql security definer set search_path = public as $$
declare v_signed timestamptz;
begin
  update session_documents d
    set signed_at = now(), signed_ip = request_ip(), signed_user_agent = request_user_agent()
    from training_sessions s
    where s.id = d.session_id and s.client_token = p_token and d.id = p_document_id
      and d.requires_signature and d.signed_at is null;
  select d.signed_at into v_signed
    from session_documents d join training_sessions s on s.id = d.session_id
    where s.client_token = p_token and d.id = p_document_id and d.requires_signature;
  if v_signed is null then raise exception 'Document introuvable.'; end if;
  return v_signed;
end $$;

revoke all on function get_client_portal(uuid), get_client_document(uuid, uuid), sign_client_document(uuid, uuid) from public;
grant execute on function get_client_portal(uuid), get_client_document(uuid, uuid), sign_client_document(uuid, uuid) to anon, authenticated;
