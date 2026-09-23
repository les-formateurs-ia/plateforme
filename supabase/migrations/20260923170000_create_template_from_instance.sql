-- "Utiliser en tant que template" : crée un nouveau TEMPLATE (formations →
-- sections → lessons → quiz_*) à partir du DUPLICATA personnalisé d'un élève
-- (formation_instances → instance_*), sens inverse d'assign_formation_to_student.
--
-- Copié : structure et contenu pédagogique uniquement (infos de la formation,
-- modules, leçons avec tout leur contenu, questions/options de QCM). Chaque
-- ligne reçoit un nouvel id : le template et le duplicata source restent
-- totalement indépendants ensuite.
-- Jamais copié (données de l'élève, rattachées à instance_lessons /
-- formation_instances) : lesson_progress, quiz_attempts, chat_messages,
-- ai_generated_content (dont sa mindmap personnalisée), mission_submissions,
-- agent_conversations, ni l'élève, le statut d'inscription ou l'attribution.
-- Les mindmaps de référence du template se régénèrent via "Publier et générer".
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
        ai_content_prompt, practical_exercise_prompt, reference_content, custom_html_content, is_mission, order_index
      ) values (
        v_new_section_id, v_lesson.slug, v_lesson.title, v_lesson.video_provider, v_lesson.video_url, v_lesson.custom_video_url,
        v_lesson.video_asset_id, v_lesson.duration_minutes, v_lesson.ai_content_prompt,
        v_lesson.practical_exercise_prompt, v_lesson.reference_content, v_lesson.custom_html_content, v_lesson.is_mission, v_lesson.order_index
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
