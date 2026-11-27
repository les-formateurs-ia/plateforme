-- Rendez-vous client : le client ne voit plus le document joint, seulement
-- son résumé structuré, rédigé par Claude (fonction summarize-meeting) puis
-- relu par l'administrateur. Le résumé est rangé dans notes (Markdown).
-- Le document reste dans le bucket privé session-meetings, pour l'admin seul.

-- Un compte rendu complet dépasse les 5 000 caractères prévus pour une note.
alter table session_meetings drop constraint if exists session_meetings_notes_check;
alter table session_meetings add constraint session_meetings_notes_check check (notes is null or length(notes) <= 30000);

-- Plus d'accès au fichier depuis l'espace client (la fonction
-- client-portal-file est à supprimer elle aussi).
drop function if exists client_meeting_file(uuid, uuid);

-- Même réponse qu'en 20261128120000, sans le nom du fichier : rendez-vous =
-- date, objet, résumé.
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
        'id', m.id, 'date', m.meeting_date, 'titre', m.title, 'resume', m.notes
      ) order by m.meeting_date desc, m.created_at desc)
      from session_meetings m where m.session_id = s.id
    ), '[]'::jsonb)
  )
  from training_sessions s where s.client_token = p_token;
$$;
