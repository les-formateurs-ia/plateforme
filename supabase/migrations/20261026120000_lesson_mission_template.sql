-- Missions de fin de module intégrées à la plateforme : au lieu d'un HTML
-- collé dans reference_content, une leçon "Mission" référence l'une des
-- missions codées dans l'application (src/app/data/missions, clé stable),
-- choisie dans l'éditeur de leçon. Les anciennes missions en HTML libre
-- (mission_template null) restent affichées comme avant.
--
-- Aussi : mission_submissions.email_notified_at, posé par la fonction
-- notify-mission-submitted une fois le mail envoyé au formateur et aux
-- administrateurs (évite un double envoi). Ce mail part du compte Google de
-- la plateforme (API Gmail) : google_oauth_tokens.granted_scopes garde les
-- autorisations réellement accordées à la connexion, pour savoir si l'envoi
-- de mails est permis (sinon l'admin reconnecte le compte depuis son profil).

alter table lessons add column mission_template text;
comment on column lessons.mission_template is
  'Clé de la mission de fin de module (src/app/data/missions) quand is_mission est vrai ; null = leçon classique ou ancienne mission en HTML libre (reference_content).';

alter table instance_lessons add column mission_template text;
comment on column instance_lessons.mission_template is
  'Copie de lessons.mission_template au moment de l''attribution/prévisualisation — voir assign_formation_to_student / preview_formation_as_staff.';

alter table mission_submissions add column email_notified_at timestamptz;
comment on column mission_submissions.email_notified_at is
  'Envoi du mail "mission validée" au formateur et aux administrateurs (fonction notify-mission-submitted).';

alter table google_oauth_tokens add column granted_scopes text;
comment on column google_oauth_tokens.granted_scopes is
  'Autorisations Google accordées à la connexion (séparées par des espaces) — l''envoi de mails exige gmail.send.';

-- Les trois missions existantes (HTML collé dans le template et ses copies
-- élèves) passent sur leur version intégrée. Les champs gardent les mêmes
-- identifiants : brouillons et missions déjà validées restent lisibles.
update lessons set mission_template = 'strategie-confidentialite'
  where is_mission and mission_template is null and reference_content like '%Mission IA : stratégie et confidentialité%';
update lessons set mission_template = 'contenu-optimisation'
  where is_mission and mission_template is null and reference_content like '%Mission IA : contenu et optimisation%';
update lessons set mission_template = 'conformite-accessibilite'
  where is_mission and mission_template is null and reference_content like '%Mission IA : conformité et accessibilité%';
update instance_lessons set mission_template = 'strategie-confidentialite'
  where is_mission and mission_template is null and reference_content like '%Mission IA : stratégie et confidentialité%';
update instance_lessons set mission_template = 'contenu-optimisation'
  where is_mission and mission_template is null and reference_content like '%Mission IA : contenu et optimisation%';
update instance_lessons set mission_template = 'conformite-accessibilite'
  where is_mission and mission_template is null and reference_content like '%Mission IA : conformité et accessibilité%';

-- ── Copie de mission_template à la duplication ────────────────────────────
-- Corps identiques à 20260923180000 (assign / preview) et 20260923170000
-- (create_template_from_instance), avec mission_template ajouté à la copie.

create or replace function public.assign_formation_to_student(p_template_id uuid, p_student_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_template        formations%rowtype;
  v_student_role    user_role;
  v_instance_id     uuid;
  v_section         record;
  v_new_section_id  uuid;
  v_lesson          record;
  v_new_lesson_id   uuid;
  v_question        record;
  v_new_question_id uuid;
  v_option          record;
begin
  if not is_staff() then
    raise exception 'Seul un membre du staff peut attribuer une formation.';
  end if;

  select role into v_student_role from profiles where id = p_student_id;
  if v_student_role is distinct from 'student' then
    raise exception 'Le destinataire doit avoir le rôle élève.';
  end if;

  select * into v_template from formations where id = p_template_id;
  if not found then
    raise exception 'Formation modèle introuvable.';
  end if;

  insert into formation_instances (
    template_id, user_id, name, description, duration_minutes, price_cents,
    currency, certification_enabled, certification_prompt, status, assigned_by
  ) values (
    v_template.id, p_student_id, v_template.name, v_template.description, v_template.duration_minutes,
    v_template.price_cents, v_template.currency, v_template.certification_enabled, v_template.certification_prompt,
    'active', auth.uid()
  ) returning id into v_instance_id;

  for v_section in select * from sections where formation_id = p_template_id order by order_index loop
    insert into instance_sections (instance_id, title, order_index)
    values (v_instance_id, v_section.title, v_section.order_index)
    returning id into v_new_section_id;

    for v_lesson in select * from lessons where section_id = v_section.id order by order_index loop
      insert into instance_lessons (
        section_id, slug, title, video_provider, video_url, custom_video_url, video_asset_id, duration_minutes,
        ai_content_prompt, practical_exercise_prompt, reference_content, custom_html_content, is_mission, mission_template, order_index
      ) values (
        v_new_section_id, v_lesson.slug, v_lesson.title, v_lesson.video_provider, v_lesson.video_url, v_lesson.custom_video_url,
        v_lesson.video_asset_id, v_lesson.duration_minutes, v_lesson.ai_content_prompt,
        v_lesson.practical_exercise_prompt, v_lesson.reference_content, v_lesson.custom_html_content, v_lesson.is_mission, v_lesson.mission_template, v_lesson.order_index
      ) returning id into v_new_lesson_id;

      insert into ai_generated_content (user_id, lesson_id, content_type, content, model, source_prompt)
      select p_student_id, v_new_lesson_id, 'mindmap', rm.content, rm.model, 'Copie de la mindmap de référence du template (lesson_reference_mindmaps).'
      from lesson_reference_mindmaps rm where rm.lesson_id = v_lesson.id;

      for v_question in select * from quiz_questions where lesson_id = v_lesson.id order by order_index loop
        insert into instance_quiz_questions (lesson_id, question, explanation, order_index)
        values (v_new_lesson_id, v_question.question, v_question.explanation, v_question.order_index)
        returning id into v_new_question_id;

        for v_option in select * from quiz_options where question_id = v_question.id order by order_index loop
          insert into instance_quiz_options (question_id, label, is_correct, order_index)
          values (v_new_question_id, v_option.label, v_option.is_correct, v_option.order_index);
        end loop;
      end loop;
    end loop;
  end loop;

  return v_instance_id;
end;
$$;

create or replace function public.preview_formation_as_staff(p_template_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_template        formations%rowtype;
  v_instance_id     uuid;
  v_section         record;
  v_new_section_id  uuid;
  v_lesson          record;
  v_new_lesson_id   uuid;
  v_question        record;
  v_new_question_id uuid;
  v_option          record;
begin
  if not is_staff() then
    raise exception 'Seul un membre du staff peut prévisualiser un cours.';
  end if;

  select * into v_template from formations where id = p_template_id;
  if not found then
    raise exception 'Formation modèle introuvable.';
  end if;

  delete from formation_instances where template_id = p_template_id and user_id = auth.uid() and is_preview;

  insert into formation_instances (
    template_id, user_id, name, description, duration_minutes, price_cents,
    currency, certification_enabled, certification_prompt, status, assigned_by, is_preview
  ) values (
    v_template.id, auth.uid(), v_template.name, v_template.description, v_template.duration_minutes,
    v_template.price_cents, v_template.currency, v_template.certification_enabled, v_template.certification_prompt,
    'active', auth.uid(), true
  ) returning id into v_instance_id;

  for v_section in select * from sections where formation_id = p_template_id order by order_index loop
    insert into instance_sections (instance_id, title, order_index)
    values (v_instance_id, v_section.title, v_section.order_index)
    returning id into v_new_section_id;

    for v_lesson in select * from lessons where section_id = v_section.id order by order_index loop
      insert into instance_lessons (
        section_id, slug, title, video_provider, video_url, custom_video_url, video_asset_id, duration_minutes,
        ai_content_prompt, practical_exercise_prompt, reference_content, custom_html_content, is_mission, mission_template, order_index
      ) values (
        v_new_section_id, v_lesson.slug, v_lesson.title, v_lesson.video_provider, v_lesson.video_url, v_lesson.custom_video_url,
        v_lesson.video_asset_id, v_lesson.duration_minutes, v_lesson.ai_content_prompt,
        v_lesson.practical_exercise_prompt, v_lesson.reference_content, v_lesson.custom_html_content, v_lesson.is_mission, v_lesson.mission_template, v_lesson.order_index
      ) returning id into v_new_lesson_id;

      insert into ai_generated_content (user_id, lesson_id, content_type, content, model, source_prompt)
      select auth.uid(), v_new_lesson_id, 'mindmap', rm.content, rm.model, 'Copie de la mindmap de référence du template (lesson_reference_mindmaps).'
      from lesson_reference_mindmaps rm where rm.lesson_id = v_lesson.id;

      for v_question in select * from quiz_questions where lesson_id = v_lesson.id order by order_index loop
        insert into instance_quiz_questions (lesson_id, question, explanation, order_index)
        values (v_new_lesson_id, v_question.question, v_question.explanation, v_question.order_index)
        returning id into v_new_question_id;

        for v_option in select * from quiz_options where question_id = v_question.id order by order_index loop
          insert into instance_quiz_options (question_id, label, is_correct, order_index)
          values (v_new_question_id, v_option.label, v_option.is_correct, v_option.order_index);
        end loop;
      end loop;
    end loop;
  end loop;

  return v_instance_id;
end;
$function$;

create or replace function public.create_template_from_instance(p_instance_id uuid, p_name text, p_slug text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_instance        formation_instances%rowtype;
  v_owner_role      user_role;
  v_name            text;
  v_base_slug       text;
  v_slug            text;
  v_suffix          integer := 2;
  v_template_id     uuid;
  v_section         record;
  v_new_section_id  uuid;
  v_lesson          record;
  v_new_lesson_id   uuid;
  v_question        record;
  v_new_question_id uuid;
  v_option          record;
begin
  if not public.is_admin() then
    raise exception 'Seul un administrateur peut créer un template.' using errcode = '42501';
  end if;

  select * into v_instance from formation_instances where id = p_instance_id;
  if not found then
    raise exception 'Formation personnalisée introuvable.' using errcode = 'P0002';
  end if;
  select role into v_owner_role from profiles where id = v_instance.user_id;
  if v_instance.is_preview or v_owner_role is distinct from 'student' then
    raise exception 'Seule la formation personnalisée d''un élève peut servir de template.' using errcode = '22023';
  end if;

  v_name := coalesce(nullif(trim(p_name), ''), v_instance.name);
  v_base_slug := coalesce(nullif(trim(p_slug), ''), 'formation');
  v_slug := v_base_slug;
  -- formations.slug est unique (templates supprimés inclus) : suffixe -2, -3…
  while exists (select 1 from formations where slug = v_slug) loop
    v_slug := v_base_slug || '-' || v_suffix;
    v_suffix := v_suffix + 1;
  end loop;

  insert into formations (
    name, slug, description, duration_minutes, price_cents, currency,
    certification_enabled, certification_prompt, status
  ) values (
    v_name, v_slug, v_instance.description, v_instance.duration_minutes, v_instance.price_cents, v_instance.currency,
    v_instance.certification_enabled, v_instance.certification_prompt, 'draft'
  ) returning id into v_template_id;

  for v_section in select * from instance_sections where instance_id = p_instance_id order by order_index loop
    insert into sections (formation_id, title, order_index)
    values (v_template_id, v_section.title, v_section.order_index)
    returning id into v_new_section_id;

    for v_lesson in select * from instance_lessons where section_id = v_section.id order by order_index loop
      insert into lessons (
        section_id, slug, title, video_provider, video_url, custom_video_url, video_asset_id, duration_minutes,
        ai_content_prompt, practical_exercise_prompt, reference_content, custom_html_content, is_mission, mission_template, order_index
      ) values (
        v_new_section_id, v_lesson.slug, v_lesson.title, v_lesson.video_provider, v_lesson.video_url, v_lesson.custom_video_url,
        v_lesson.video_asset_id, v_lesson.duration_minutes, v_lesson.ai_content_prompt,
        v_lesson.practical_exercise_prompt, v_lesson.reference_content, v_lesson.custom_html_content, v_lesson.is_mission, v_lesson.mission_template, v_lesson.order_index
      ) returning id into v_new_lesson_id;

      for v_question in select * from instance_quiz_questions where lesson_id = v_lesson.id order by order_index loop
        insert into quiz_questions (lesson_id, question, explanation, order_index)
        values (v_new_lesson_id, v_question.question, v_question.explanation, v_question.order_index)
        returning id into v_new_question_id;

        for v_option in select * from instance_quiz_options where question_id = v_question.id order by order_index loop
          insert into quiz_options (question_id, label, is_correct, order_index)
          values (v_new_question_id, v_option.label, v_option.is_correct, v_option.order_index);
        end loop;
      end loop;
    end loop;
  end loop;

  return v_template_id;
end;
$$;

revoke execute on function public.create_template_from_instance(uuid, text, text) from public, anon;
grant execute on function public.create_template_from_instance(uuid, text, text) to authenticated;
