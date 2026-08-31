-- ═══════════════════════════════════════════════════════════════════════════
-- Séparation TEMPLATE / DUPLICATA ÉLÈVE
--
-- Jusqu'ici une formation (formations → sections → lessons → quiz_*) était à
-- la fois le template pédagogique ET l'objet auquel les élèves étaient
-- directement inscrits (enrollments). On applique ici, un niveau au-dessus,
-- le même principe déjà utilisé pour le contenu IA généré (cf. commentaire
-- en tête de 0001_init_schema.sql) : le template reste figé, et chaque
-- attribution à un élève crée un DUPLICATA indépendant (formation_instances
-- → instance_sections → instance_lessons → instance_quiz_*) que l'admin/
-- formateur peut ensuite personnaliser sans jamais toucher au template.
--
-- Données existantes traitées comme des données de test (validé) : les
-- tables de progression par élève sont réinitialisées, enrollments est
-- supprimée et remplacée par formation_instances.user_id.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Tables miroir : le duplicata attribué à un élève ───────────────────────

create table formation_instances (
  id                    uuid primary key default gen_random_uuid(),
  template_id           uuid references formations(id) on delete set null,
  user_id               uuid not null references profiles(id) on delete cascade,
  name                  text not null,
  description           text,
  duration_minutes      integer,
  price_cents           integer,
  currency              text not null default 'EUR',
  certification_enabled boolean not null default false,
  certification_prompt  text,
  status                enrollment_status not null default 'active',
  assigned_by           uuid references profiles(id),
  assigned_at           timestamptz not null default now(),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
create trigger formation_instances_set_updated_at before update on formation_instances
  for each row execute function set_updated_at();

create table instance_sections (
  id            uuid primary key default gen_random_uuid(),
  instance_id   uuid not null references formation_instances(id) on delete cascade,
  title         text not null,
  order_index   integer not null,
  created_at    timestamptz not null default now(),
  unique (instance_id, order_index)
);

create table instance_lessons (
  id                        uuid primary key default gen_random_uuid(),
  section_id                uuid not null references instance_sections(id) on delete cascade,
  slug                      text not null,
  title                     text not null,
  video_provider            video_provider not null default 'cloudflare_stream',
  video_url                 text,
  video_asset_id            text,
  duration_minutes          integer,
  ai_content_prompt         text,
  practical_exercise_prompt text,
  reference_content         text,
  custom_html_content       text,
  order_index               integer not null,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now(),
  unique (section_id, slug),
  unique (section_id, order_index)
);
create trigger instance_lessons_set_updated_at before update on instance_lessons
  for each row execute function set_updated_at();

-- Même garde-fou que pour les templates : seul un admin modifie le
-- Playground HTML, y compris sur un duplicata personnalisé par un formateur.
create trigger instance_lessons_protect_playground_html
  before update on instance_lessons
  for each row execute function protect_playground_html();

create table instance_quiz_questions (
  id            uuid primary key default gen_random_uuid(),
  lesson_id     uuid not null references instance_lessons(id) on delete cascade,
  question      text not null,
  explanation   text,
  order_index   integer not null,
  created_at    timestamptz not null default now()
);

create table instance_quiz_options (
  id            uuid primary key default gen_random_uuid(),
  question_id   uuid not null references instance_quiz_questions(id) on delete cascade,
  label         text not null,
  is_correct    boolean not null default false,
  order_index   integer not null
);

-- ── Duplication server-side : le cœur de la garantie "le template ne bouge
-- jamais". Boucles imbriquées simples (volumes faibles par formation), pas
-- de table de mapping nécessaire car chaque niveau ne référence que l'id du
-- parent fraîchement inséré (variable scalaire locale à l'appel). ─────────

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
  if not is_admin() then
    raise exception 'Seul un administrateur peut attribuer une formation.';
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

grant execute on function assign_formation_to_student(uuid, uuid) to authenticated;

-- ── Repoint des tables de progression par élève vers les duplicatas ────────
-- Déjà keyed par user_id : seule la cible de lesson_id change. Données de
-- test → réinitialisées plutôt que migrées (pas de duplicata existant vers
-- lequel les rattacher).

truncate table quiz_attempts, lesson_progress, chat_messages, ai_generated_content;

alter table ai_generated_content drop constraint ai_generated_content_lesson_id_fkey;
alter table ai_generated_content add constraint ai_generated_content_lesson_id_fkey
  foreign key (lesson_id) references instance_lessons(id) on delete cascade;

alter table chat_messages drop constraint chat_messages_lesson_id_fkey;
alter table chat_messages add constraint chat_messages_lesson_id_fkey
  foreign key (lesson_id) references instance_lessons(id) on delete cascade;

alter table lesson_progress drop constraint lesson_progress_lesson_id_fkey;
alter table lesson_progress add constraint lesson_progress_lesson_id_fkey
  foreign key (lesson_id) references instance_lessons(id) on delete cascade;

alter table quiz_attempts drop constraint quiz_attempts_lesson_id_fkey;
alter table quiz_attempts add constraint quiz_attempts_lesson_id_fkey
  foreign key (lesson_id) references instance_lessons(id) on delete cascade;

-- ── Rendez-vous : liés au duplicata suivi par l'élève, pas au template ─────

truncate table appointments;

alter table appointments drop constraint appointments_formation_id_fkey;
alter table appointments rename column formation_id to instance_id;
alter table appointments add constraint appointments_instance_id_fkey
  foreign key (instance_id) references formation_instances(id) on delete cascade;

alter table appointments drop constraint appointments_section_id_fkey;
alter table appointments add constraint appointments_section_id_fkey
  foreign key (section_id) references instance_sections(id) on delete set null;

-- ── enrollments : remplacée par formation_instances.user_id (pas de
-- contrainte unique → plusieurs formations simultanées nativement possibles).
-- Les policies des tables template qui la référencent sont retirées d'abord
-- (drop table sans cascade ensuite, pour un comportement explicite). ──────

drop policy if exists "lessons_read_enrolled" on lessons;
drop policy if exists "quiz_questions_read_enrolled" on quiz_questions;
drop policy if exists "quiz_options_read_enrolled" on quiz_options;

drop table enrollments;

-- ── RLS : nouvelles tables ──────────────────────────────────────────────

alter table formation_instances enable row level security;
alter table instance_sections enable row level security;
alter table instance_lessons enable row level security;
alter table instance_quiz_questions enable row level security;
alter table instance_quiz_options enable row level security;

create policy "formation_instances_select" on formation_instances for select
  using (user_id = auth.uid() or is_staff());
create policy "formation_instances_admin_insert" on formation_instances for insert
  with check (is_admin());
create policy "formation_instances_staff_update" on formation_instances for update
  using (is_staff()) with check (is_staff());
create policy "formation_instances_admin_delete" on formation_instances for delete
  using (is_admin());

create policy "instance_sections_select" on instance_sections for select
  using (
    is_staff() or exists (
      select 1 from formation_instances fi where fi.id = instance_id and fi.user_id = auth.uid()
    )
  );
create policy "instance_sections_staff_write" on instance_sections for all
  using (is_staff()) with check (is_staff());

create policy "instance_lessons_select" on instance_lessons for select
  using (
    is_staff() or exists (
      select 1 from instance_sections s
      join formation_instances fi on fi.id = s.instance_id
      where s.id = section_id and fi.user_id = auth.uid()
    )
  );
create policy "instance_lessons_staff_write" on instance_lessons for all
  using (is_staff()) with check (is_staff());

create policy "instance_quiz_questions_select" on instance_quiz_questions for select
  using (
    is_staff() or exists (
      select 1 from instance_lessons l
      join instance_sections s on s.id = l.section_id
      join formation_instances fi on fi.id = s.instance_id
      where l.id = lesson_id and fi.user_id = auth.uid()
    )
  );
create policy "instance_quiz_questions_staff_write" on instance_quiz_questions for all
  using (is_staff()) with check (is_staff());

create policy "instance_quiz_options_select" on instance_quiz_options for select
  using (
    is_staff() or exists (
      select 1 from instance_quiz_questions q
      join instance_lessons l on l.id = q.lesson_id
      join instance_sections s on s.id = l.section_id
      join formation_instances fi on fi.id = s.instance_id
      where q.id = question_id and fi.user_id = auth.uid()
    )
  );
create policy "instance_quiz_options_staff_write" on instance_quiz_options for all
  using (is_staff()) with check (is_staff());

-- ── RLS : tables template simplifiées ────────────────────────────────────
-- Plus aucun élève n'y accède directement (il ne consulte que son
-- duplicata) : is_staff() suffit, en lecture comme en écriture.

drop policy if exists "formations_read_published" on formations;
drop policy if exists "formations_admin_write" on formations;
create policy "formations_staff_all" on formations for all
  using (is_staff()) with check (is_staff());

drop policy if exists "sections_read" on sections;
drop policy if exists "sections_admin_write" on sections;
create policy "sections_staff_all" on sections for all
  using (is_staff()) with check (is_staff());

drop policy if exists "lessons_admin_write" on lessons;
create policy "lessons_staff_all" on lessons for all
  using (is_staff()) with check (is_staff());

drop policy if exists "quiz_questions_admin_write" on quiz_questions;
create policy "quiz_questions_staff_all" on quiz_questions for all
  using (is_staff()) with check (is_staff());

drop policy if exists "quiz_options_admin_write" on quiz_options;
create policy "quiz_options_staff_all" on quiz_options for all
  using (is_staff()) with check (is_staff());
