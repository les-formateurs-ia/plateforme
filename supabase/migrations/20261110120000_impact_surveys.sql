-- Évaluation d'impact après une session (évaluation « à froid ») :
--   * impact_surveys : questionnaire rattaché à une session, mêmes types de
--     questions que les questionnaires de satisfaction (QCM, note 1 à 5,
--     Oui / Non avec précision, texte libre), stockés en jsonb avec des id
--     stables (les réponses y renvoient) ;
--   * deux liens sans compte : answer_token (les stagiaires répondent en
--     indiquant seulement prénom et nom) et results_token (tableau de bord
--     des résultats, partagé au responsable de l'entreprise) ;
--   * impact_survey_responses : réponses, écrites uniquement par
--     submit_impact_survey() qui vérifie le lien et que le questionnaire est ouvert.
begin;

create table public.impact_surveys (
  id             uuid primary key default gen_random_uuid(),
  session_id     uuid not null references public.training_sessions(id) on delete cascade,
  title          text not null check (length(trim(title)) > 0),
  description    text,
  questions      jsonb not null default '[]'::jsonb check (jsonb_typeof(questions) = 'array'),
  answer_token   uuid not null unique default gen_random_uuid(),
  results_token  uuid not null unique default gen_random_uuid(),
  is_open        boolean not null default true,
  created_by     uuid references public.profiles(id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index impact_surveys_session_idx on public.impact_surveys(session_id, created_at);

create table public.impact_survey_responses (
  id          uuid primary key default gen_random_uuid(),
  survey_id   uuid not null references public.impact_surveys(id) on delete cascade,
  first_name  text not null check (length(trim(first_name)) between 1 and 80),
  last_name   text not null check (length(trim(last_name)) between 1 and 80),
  answers     jsonb not null check (jsonb_typeof(answers) = 'array'),
  created_at  timestamptz not null default now()
);
create index impact_survey_responses_survey_idx on public.impact_survey_responses(survey_id, created_at desc);

alter table public.impact_surveys enable row level security;
alter table public.impact_survey_responses enable row level security;
create policy "admin manage impact surveys" on public.impact_surveys for all using (is_admin()) with check (is_admin());
create policy "admin read impact responses" on public.impact_survey_responses for select using (is_admin());
create policy "admin delete impact responses" on public.impact_survey_responses for delete using (is_admin());

-- ── Liens publics ────────────────────────────────────────────────────

-- Questionnaire à remplir (lien des stagiaires).
create function public.get_impact_survey(p_token uuid) returns jsonb
language sql security definer stable set search_path = public as $$
  select jsonb_build_object(
    'title', v.title, 'description', v.description, 'questions', v.questions, 'isOpen', v.is_open,
    'formation', s.formation->>'intitule', 'client', s.client->>'nom', 'dateDebut', s.date_debut, 'dateFin', s.date_fin
  )
  from impact_surveys v join training_sessions s on s.id = v.session_id
  where v.answer_token = p_token;
$$;

create function public.submit_impact_survey(p_token uuid, p_first_name text, p_last_name text, p_answers jsonb) returns timestamptz
language plpgsql security definer set search_path = public as $$
declare
  v_survey impact_surveys;
  v_at timestamptz;
begin
  select * into v_survey from impact_surveys where answer_token = p_token;
  if not found then raise exception 'Lien invalide.'; end if;
  if not v_survey.is_open then raise exception 'Ce questionnaire est clos.'; end if;
  if p_answers is null or jsonb_typeof(p_answers) <> 'array' or octet_length(p_answers::text) > 60000 then
    raise exception 'Réponses invalides.';
  end if;
  insert into impact_survey_responses (survey_id, first_name, last_name, answers)
  values (v_survey.id, trim(p_first_name), trim(p_last_name), p_answers)
  returning created_at into v_at;
  return v_at;
end $$;

-- Tableau de bord des résultats (lien du responsable de l'entreprise).
create function public.get_impact_survey_results(p_token uuid) returns jsonb
language sql security definer stable set search_path = public as $$
  select jsonb_build_object(
    'title', v.title, 'description', v.description, 'questions', v.questions, 'isOpen', v.is_open,
    'formation', s.formation->>'intitule', 'client', s.client->>'nom', 'dateDebut', s.date_debut, 'dateFin', s.date_fin,
    'stagiaires', (select count(*) from training_session_trainees t where t.session_id = s.id),
    'responses', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', r.id, 'firstName', r.first_name, 'lastName', r.last_name, 'answers', r.answers, 'createdAt', r.created_at
      ) order by r.created_at desc)
      from impact_survey_responses r where r.survey_id = v.id
    ), '[]'::jsonb)
  )
  from impact_surveys v join training_sessions s on s.id = v.session_id
  where v.results_token = p_token;
$$;

revoke all on function public.get_impact_survey(uuid), public.submit_impact_survey(uuid, text, text, jsonb),
  public.get_impact_survey_results(uuid) from public;
grant execute on function public.get_impact_survey(uuid), public.submit_impact_survey(uuid, text, text, jsonb),
  public.get_impact_survey_results(uuid) to anon, authenticated;

commit;
