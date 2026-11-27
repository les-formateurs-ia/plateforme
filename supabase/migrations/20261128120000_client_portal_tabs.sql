-- Espace client en onglets : rendez-vous avec le client, résultats du test
-- de positionnement des collaborateurs, et signature par la personne qui
-- signe vraiment (nom, prénom, fonction saisis au moment de signer).

-- ── Rendez-vous avec le client ────────────────────────────────────────
-- Saisis par l'administrateur (date, objet, compte rendu, document joint),
-- consultables dans l'espace client.

create table session_meetings (
  id           uuid primary key default gen_random_uuid(),
  session_id   uuid not null references training_sessions(id) on delete cascade,
  meeting_date date not null,
  title        text not null check (length(btrim(title)) between 1 and 200),
  notes        text check (notes is null or length(notes) <= 5000),
  -- Document dans le bucket session-meetings : <session_id>/<uuid>.<ext>
  file_path    text,
  file_name    text,
  created_by   uuid references profiles(id) on delete set null,
  created_at   timestamptz not null default now()
);
create index session_meetings_session_idx on session_meetings(session_id, meeting_date desc);

alter table session_meetings enable row level security;
create policy "admin manages meetings" on session_meetings for all using (is_admin()) with check (is_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('session-meetings', 'session-meetings', false, 20971520,
  array['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
on conflict (id) do nothing;

-- Le client télécharge par la fonction client-portal-file (lien personnel
-- vérifié, URL signée de courte durée) : aucun accès direct au bucket.
create policy "admin reads meeting files" on storage.objects for select to authenticated
  using (bucket_id = 'session-meetings' and (select public.is_admin()));
create policy "admin uploads meeting files" on storage.objects for insert to authenticated
  with check (bucket_id = 'session-meetings' and (select public.is_admin()));
create policy "admin deletes meeting files" on storage.objects for delete to authenticated
  using (bucket_id = 'session-meetings' and (select public.is_admin()));

-- ── Signature : la personne qui signe ─────────────────────────────────
-- Le nom prévu à l'émission (représentant du client) est proposé ; le
-- signataire le corrige si ce n'est pas lui. signer_name garde « Prénom NOM,
-- fonction » : tampon, certificat de signature et backoffice le reprennent tels quels.

create function sign_client_document_as(p_token uuid, p_document_id uuid, p_prenom text, p_nom text, p_fonction text)
returns timestamptz language plpgsql security definer set search_path = public as $$
declare
  v_name text;
  v_signed timestamptz;
begin
  if length(btrim(coalesce(p_prenom, ''))) not between 1 and 100 or length(btrim(coalesce(p_nom, ''))) not between 1 and 100 then
    raise exception 'Prénom et nom du signataire obligatoires.';
  end if;
  if length(btrim(coalesce(p_fonction, ''))) > 150 then raise exception 'Fonction trop longue.'; end if;
  v_name := btrim(p_prenom) || ' ' || upper(btrim(p_nom)) || coalesce(', ' || nullif(btrim(p_fonction), ''), '');

  update session_documents d
    set signed_at = now(), signer_name = v_name, signed_ip = request_ip(), signed_user_agent = request_user_agent()
    from training_sessions s
    where s.id = d.session_id and s.client_token = p_token and d.id = p_document_id
      and d.requires_signature and d.signed_at is null;
  select d.signed_at into v_signed
    from session_documents d join training_sessions s on s.id = d.session_id
    where s.client_token = p_token and d.id = p_document_id and d.requires_signature;
  if v_signed is null then raise exception 'Document introuvable.'; end if;
  return v_signed;
end $$;

revoke all on function sign_client_document_as(uuid, uuid, text, text, text) from public;
grant execute on function sign_client_document_as(uuid, uuid, text, text, text) to anon, authenticated;

-- ── Espace client : signataire prévu, positionnement, rendez-vous ─────
-- Même réponse qu'avant (20261103120000), avec trois clés de plus.

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
    ), '[]'::jsonb),
    -- Représentant du client : préremplit la fenêtre de signature.
    'signataire', s.client->'representant',
    -- Tests de positionnement de l'entreprise et résultats des stagiaires
    -- de cette formation (rapprochés par leur compte).
    'positionnement', case when s.company_id is null then null else jsonb_build_object(
      'tests', coalesce((
        select jsonb_agg(jsonb_build_object(
          'id', pt.id, 'titre', pt.title, 'ouvert', pt.is_visible,
          'questions', (select count(*) from company_positioning_questions q where q.test_id = pt.id)
        ) order by pt.created_at)
        from company_positioning_tests pt where pt.company_id = s.company_id and pt.kind = 'positioning'
      ), '[]'::jsonb),
      'resultats', coalesce((
        select jsonb_agg(jsonb_build_object('traineeId', t.id, 'testId', a.test_id, 'score', a.score, 'date', a.created_at))
        from company_positioning_attempts a
        join company_positioning_tests pt on pt.id = a.test_id and pt.kind = 'positioning'
        join training_session_trainees t on t.session_id = s.id and t.profile_id = a.student_id
        where a.company_id = s.company_id
      ), '[]'::jsonb)
    ) end,
    'rendezVous', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', m.id, 'date', m.meeting_date, 'titre', m.title, 'notes', m.notes, 'fichier', m.file_name
      ) order by m.meeting_date desc, m.created_at desc)
      from session_meetings m where m.session_id = s.id
    ), '[]'::jsonb)
  )
  from training_sessions s where s.client_token = p_token;
$$;

-- Fichier d'un rendez-vous, pour la fonction client-portal-file (service
-- role) : seulement si le lien personnel correspond à la session.
create function client_meeting_file(p_token uuid, p_meeting_id uuid)
returns table (file_path text, file_name text) language sql security definer stable set search_path = public as $$
  select m.file_path, m.file_name from session_meetings m
  join training_sessions s on s.id = m.session_id
  where s.client_token = p_token and m.id = p_meeting_id and m.file_path is not null;
$$;
revoke all on function client_meeting_file(uuid, uuid) from public, anon, authenticated;
grant execute on function client_meeting_file(uuid, uuid) to service_role;
