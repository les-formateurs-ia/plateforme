-- Leçon "Mission IA" : une leçon spéciale (typiquement en fin de module) où
-- l'élève ne voit que le contenu HTML (reference_content, potentiellement
-- avec des champs à remplir) — pas de podcast/Playground/Agent/Copilote ni
-- de bouton "Terminer la leçon". Il peut enregistrer un brouillon (état
-- intermédiaire, jamais notifié au formateur) puis valider définitivement :
-- son HTML (avec ses modifications) est alors figé, transformé en PDF et
-- envoyé à son formateur (stockage + notification), et il ne peut plus le
-- modifier ensuite.

alter table lessons add column is_mission boolean not null default false;
comment on column lessons.is_mission is
  'Si vrai, la leçon est une "Mission" : seul reference_content est affiché à l''élève (podcast/Playground/Agent/Copilote/QCM masqués), avec un flux dédié d''enregistrement/validation — cf. mission_submissions.';

alter table instance_lessons add column is_mission boolean not null default false;
comment on column instance_lessons.is_mission is
  'Copie de lessons.is_mission au moment de l''attribution/prévisualisation — voir assign_formation_to_student / preview_formation_as_staff.';

-- ── Copie de is_mission à la duplication ───────────────────────────────────
-- Même corps que 0069_lesson_custom_video.sql, avec is_mission ajouté à la
-- copie lessons -> instance_lessons.

create or replace function assign_formation_to_student(p_template_id uuid, p_student_id uuid)
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

      insert into ai_generated_content (user_id, lesson_id, content_type, content, model)
      select auth.uid(), v_new_lesson_id, 'mindmap', rm.content, rm.model
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

-- ── Soumissions de mission ─────────────────────────────────────────────────
create table mission_submissions (
  id             uuid primary key default gen_random_uuid(),
  lesson_id      uuid not null references instance_lessons(id) on delete cascade,
  student_id     uuid not null references profiles(id) on delete cascade,
  status         text not null default 'draft' check (status in ('draft', 'submitted')),
  html_content   text not null,
  pdf_path       text,
  viewed_at      timestamptz,
  submitted_at   timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (lesson_id, student_id)
);
create index mission_submissions_student_idx on mission_submissions (student_id, created_at desc);

alter table mission_submissions enable row level security;

-- Lecture : l'élève voit la sienne, le formateur voit celles de SES élèves
-- (profiles.formateur_id, même règle que 0028_formateur_sees_own_students.sql
-- et 0062_studio_image_generations.sql), l'admin voit tout.
create policy "mission_submissions_select" on mission_submissions for select
  using (
    student_id = auth.uid()
    or is_admin()
    or exists (select 1 from profiles p where p.id = student_id and p.formateur_id = auth.uid())
  );

create policy "mission_submissions_insert_own" on mission_submissions for insert
  with check (student_id = auth.uid());

-- Update : uniquement par l'élève propriétaire, et seulement tant que le
-- statut est encore "draft" — une fois "submitted", plus aucune écriture
-- n'est possible (verrou en base, pas seulement côté UI), conformément à
-- "il ne pourra plus modifier son html" après validation.
create policy "mission_submissions_update_own_draft" on mission_submissions for update
  using (student_id = auth.uid() and status = 'draft')
  with check (student_id = auth.uid());

-- Le formateur/admin peut marquer une soumission comme vue (badge "Nouveau"
-- sur la fiche élève) sans pouvoir toucher au reste.
create policy "mission_submissions_mark_viewed" on mission_submissions for update
  using (is_admin() or exists (select 1 from profiles p where p.id = student_id and p.formateur_id = auth.uid()))
  with check (is_admin() or exists (select 1 from profiles p where p.id = student_id and p.formateur_id = auth.uid()));

-- Bucket privé (comme studio-images) : accès via URL signée, jamais public.
-- Chemin : {student_id}/{lesson_id}.pdf
insert into storage.buckets (id, name, public)
values ('mission-pdfs', 'mission-pdfs', false)
on conflict (id) do nothing;

create policy "mission_pdfs_storage_read" on storage.objects for select
  using (
    bucket_id = 'mission-pdfs' and (
      (storage.foldername(name))[1] = auth.uid()::text
      or is_admin()
      or exists (select 1 from profiles p where p.id::text = (storage.foldername(name))[1] and p.formateur_id = auth.uid())
    )
  );

create policy "mission_pdfs_storage_write" on storage.objects for insert
  with check (bucket_id = 'mission-pdfs' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "mission_pdfs_storage_update" on storage.objects for update
  using (bucket_id = 'mission-pdfs' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "mission_pdfs_storage_delete" on storage.objects for delete
  using (bucket_id = 'mission-pdfs' and ((storage.foldername(name))[1] = auth.uid()::text or is_admin()));

-- ── Notification formateur à la validation d'une mission ──────────────────
alter type notification_type add value 'mission_submitted';

alter table notifications add column mission_submission_id uuid references mission_submissions(id) on delete cascade;

-- Un élève peut notifier SON formateur assigné au sujet de SA propre
-- soumission de mission (additive à "notifications_insert" de 0025, qui ne
-- couvre que le cas rendez-vous).
create policy "notifications_insert_mission" on notifications for insert
  with check (
    mission_submission_id is not null
    and exists (
      select 1 from mission_submissions ms
      join profiles p on p.id = ms.student_id
      where ms.id = mission_submission_id
        and ms.student_id = auth.uid()
        and p.formateur_id = user_id
    )
  );
