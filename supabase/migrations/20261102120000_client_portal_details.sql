-- Espace client enrichi : programme complet, collaborateurs inscrits et
-- présence par séance (émargement), pour que le client suive sa formation
-- d'un coup d'œil. Même jeton, même périmètre : une seule session.

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
      from session_documents d where d.session_id = s.id
    ), '[]'::jsonb)
  )
  from training_sessions s where s.client_token = p_token;
$$;
