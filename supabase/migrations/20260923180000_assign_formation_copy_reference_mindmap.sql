-- Copie de la mindmap de référence (0042) à la duplication d'un template.
-- Deux bugs corrigés ici :
-- 1. 0046 (puis 0069/0070) a réécrit assign_formation_to_student sans cette
--    copie : l'élève attribué n'avait plus de mindmap prête.
-- 2. Depuis 0042, l'insert ne renseignait pas ai_generated_content.source_prompt
--    (NOT NULL depuis 0001) : dès qu'une mindmap de référence existe,
--    l'attribution ET la prévisualisation staff échouaient entièrement. Jamais
--    visible jusqu'ici faute de mindmap de référence générée en production.
-- Corps identiques aux versions en production, seule la copie change.
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
        ai_content_prompt, practical_exercise_prompt, reference_content, custom_html_content, is_mission, order_index
      ) values (
        v_new_section_id, v_lesson.slug, v_lesson.title, v_lesson.video_provider, v_lesson.video_url, v_lesson.custom_video_url,
        v_lesson.video_asset_id, v_lesson.duration_minutes, v_lesson.ai_content_prompt,
        v_lesson.practical_exercise_prompt, v_lesson.reference_content, v_lesson.custom_html_content, v_lesson.is_mission, v_lesson.order_index
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
        ai_content_prompt, practical_exercise_prompt, reference_content, custom_html_content, is_mission, order_index
      ) values (
        v_new_section_id, v_lesson.slug, v_lesson.title, v_lesson.video_provider, v_lesson.video_url, v_lesson.custom_video_url,
        v_lesson.video_asset_id, v_lesson.duration_minutes, v_lesson.ai_content_prompt,
        v_lesson.practical_exercise_prompt, v_lesson.reference_content, v_lesson.custom_html_content, v_lesson.is_mission, v_lesson.order_index
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
