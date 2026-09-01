-- ═══════════════════════════════════════════════════════════════════════════
-- Prévisualisation "vue élève" d'un cours TEMPLATE par le staff
--
-- Depuis 0019, tout ce qui rend une leçon vivante pour un élève (mindmap,
-- podcast, vidéo IA, agent, quiz, progression) est stocké dans des tables
-- rattachées à instance_lessons — jamais à lessons (le template). Un admin/
-- formateur qui veut voir à quoi ressemblera un cours pas encore attribué
-- ne peut donc pas simplement "regarder" le template : il lui faut un vrai
-- duplicata pour que ces fonctionnalités marchent.
--
-- On duplique donc le template dans une formation_instances dédiée, possédée
-- par le membre du staff lui-même (is_preview = true), régénérée à chaque
-- appel pour toujours refléter le contenu actuel du template — sans jamais
-- toucher aux vraies attributions élèves ni au template.
-- ═══════════════════════════════════════════════════════════════════════════

alter table formation_instances add column is_preview boolean not null default false;

create or replace function preview_formation_as_staff(p_template_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
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

  -- Repart d'une prévisualisation propre à chaque appel (cascade sur
  -- sections/leçons/quiz/contenu IA/progression) pour refléter le contenu à
  -- jour du template plutôt qu'un instantané figé au premier clic.
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
        section_id, slug, title, video_provider, video_url, video_asset_id, duration_minutes,
        ai_content_prompt, practical_exercise_prompt, reference_content, custom_html_content, order_index
      ) values (
        v_new_section_id, v_lesson.slug, v_lesson.title, v_lesson.video_provider, v_lesson.video_url,
        v_lesson.video_asset_id, v_lesson.duration_minutes, v_lesson.ai_content_prompt,
        v_lesson.practical_exercise_prompt, v_lesson.reference_content, v_lesson.custom_html_content, v_lesson.order_index
      ) returning id into v_new_lesson_id;

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

grant execute on function preview_formation_as_staff(uuid) to authenticated;
