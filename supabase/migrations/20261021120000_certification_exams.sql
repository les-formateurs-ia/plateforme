-- Certification RS6776 (InKréa) : épreuve écrite passée sur la plateforme.
--
-- Une fois les leçons de l'élève terminées, l'admin "lance la certification"
-- (launch_certification_exam) : l'élève dispose alors de 10 jours pour remplir
-- les 6 exercices (réponses en jsonb, enregistrables en brouillon). Pendant
-- l'épreuve son espace est restreint côté front (accueil = épreuve, Studio
-- texte/image uniquement, cf. src/app/state/certification-context.tsx).
--
-- La validation définitive (submit_certification_exam) réserve dans le même
-- geste la soutenance orale sur un créneau de l'examinateur (l'admin désigné
-- au lancement, jamais un autre membre du staff) : un rendez_vous de type
-- 'soutenance', qui échappe à la règle "un seul rendez-vous à venir par
-- élève" des rendez-vous de coaching.

-- ── Type de rendez-vous ─────────────────────────────────────────────────────
alter table rendez_vous add column kind text not null default 'coaching'
  check (kind in ('coaching', 'soutenance'));

create or replace function check_rendez_vous_constraints() returns trigger as $$
declare
  booking_fields_changed boolean;
begin
  if (new.bilan_sujet is distinct from old.bilan_sujet
      or new.bilan_next_step is distinct from old.bilan_next_step
      or new.bilan_point_fort is distinct from old.bilan_point_fort
      or new.bilan_filled_at is distinct from old.bilan_filled_at
      or new.bilan_attachment_path is distinct from old.bilan_attachment_path
      or new.bilan_attachment_name is distinct from old.bilan_attachment_name)
     and auth.uid() <> old.formateur_id and not is_admin() then
    raise exception 'Seul le formateur peut renseigner le bilan de ce rendez-vous.';
  end if;

  booking_fields_changed := (
    tg_op = 'INSERT'
    or old.status is distinct from new.status
    or old.slot_date is distinct from new.slot_date
    or old.start_time is distinct from new.start_time
    or old.end_time is distinct from new.end_time
    or old.student_id is distinct from new.student_id
    or old.formateur_id is distinct from new.formateur_id
  );

  if not booking_fields_changed then
    return new;
  end if;

  if new.status = 'cancelled' then
    return new;
  end if;

  if tg_op = 'INSERT' and new.slot_date <= current_date then
    raise exception 'Impossible de réserver un rendez-vous dans le passé.';
  end if;

  -- Une soutenance s'ajoute au coaching sans compter dans la limite.
  if new.kind = 'coaching' and exists (
    select 1 from rendez_vous
    where student_id = new.student_id
      and kind = 'coaching'
      and status in ('pending', 'confirmed')
      and slot_date >= current_date
      and id <> coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid)
  ) then
    raise exception 'Vous avez déjà un rendez-vous à venir : modifiez-le au lieu d''en reprendre un second.';
  end if;

  if exists (
    select 1 from rendez_vous
    where formateur_id = new.formateur_id
      and slot_date = new.slot_date
      and status in ('pending', 'confirmed')
      and id <> coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid)
      and new.start_time < end_time and new.end_time > start_time
  ) then
    raise exception 'Ce créneau chevauche un rendez-vous déjà réservé.';
  end if;

  return new;
end;
$$ language plpgsql;

-- ── Épreuve écrite ──────────────────────────────────────────────────────────
create table certification_exams (
  id              uuid primary key default gen_random_uuid(),
  student_id      uuid not null unique references profiles(id) on delete cascade,
  examiner_id     uuid references profiles(id) on delete set null,
  launched_by     uuid references profiles(id) on delete set null,
  launched_at     timestamptz not null default now(),
  deadline_at     timestamptz not null,
  status          text not null default 'in_progress' check (status in ('in_progress', 'submitted')),
  answers         jsonb not null default '{}'::jsonb,
  submitted_at    timestamptz,
  rendez_vous_id  uuid references rendez_vous(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create trigger certification_exams_set_updated_at before update on certification_exams
  for each row execute function set_updated_at();

alter table certification_exams enable row level security;

create policy "certification_exams_read" on certification_exams for select
  using (student_id = auth.uid() or is_admin());
-- L'élève n'enregistre que ses réponses, tant que l'écrit n'est pas validé ;
-- la validation passe par submit_certification_exam.
create policy "certification_exams_student_draft" on certification_exams for update
  using (student_id = auth.uid() and status = 'in_progress')
  with check (student_id = auth.uid() and status = 'in_progress');
create policy "certification_exams_admin_write" on certification_exams for all
  using (is_admin()) with check (is_admin());

-- Le colonnes hors réponses ne bougent jamais côté élève.
create function certification_exams_guard_student_update() returns trigger as $$
begin
  if not is_admin() and (
    new.student_id is distinct from old.student_id
    or new.examiner_id is distinct from old.examiner_id
    or new.launched_by is distinct from old.launched_by
    or new.launched_at is distinct from old.launched_at
    or new.deadline_at is distinct from old.deadline_at
    or new.submitted_at is distinct from old.submitted_at
    or new.rendez_vous_id is distinct from old.rendez_vous_id
  ) then
    raise exception 'Seules les réponses peuvent être modifiées.';
  end if;
  return new;
end;
$$ language plpgsql;
create trigger certification_exams_guard before update on certification_exams
  for each row execute function certification_exams_guard_student_update();

-- ── Lancement (admin) ───────────────────────────────────────────────────────
-- L'examinateur est l'admin titulaire de la certification (compte
-- contact@les-formateurs-ia.fr), à défaut l'admin qui lance l'épreuve.
create function launch_certification_exam(p_student_id uuid) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_role      user_role;
  v_examiner  uuid;
  v_id        uuid;
begin
  if not is_admin() then
    raise exception 'Réservé à l''administrateur.' using errcode = '42501';
  end if;
  select role into v_role from profiles where id = p_student_id;
  if v_role is distinct from 'student' then
    raise exception 'Ce compte n''est pas un élève.' using errcode = '22023';
  end if;
  if exists (select 1 from certification_exams where student_id = p_student_id) then
    raise exception 'La certification est déjà lancée pour cet élève.' using errcode = '23505';
  end if;

  select id into v_examiner from profiles
    where role = 'admin' and lower(email) = 'contact@les-formateurs-ia.fr' limit 1;

  insert into certification_exams (student_id, examiner_id, launched_by, deadline_at)
  values (p_student_id, coalesce(v_examiner, auth.uid()), auth.uid(), now() + interval '10 days')
  returning id into v_id;
  return v_id;
end;
$$;
revoke execute on function launch_certification_exam(uuid) from public, anon;
grant execute on function launch_certification_exam(uuid) to authenticated;

-- ── Validation définitive (élève) + réservation de la soutenance ────────────
alter type notification_type add value if not exists 'certification_submitted';

create function submit_certification_exam(p_answers jsonb, p_slot_date date, p_start_time time) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_exam  certification_exams%rowtype;
  v_rdv   uuid;
  v_name  text;
begin
  select * into v_exam from certification_exams where student_id = auth.uid() for update;
  if not found then
    raise exception 'Aucune certification en cours.' using errcode = '42501';
  end if;
  if v_exam.status <> 'in_progress' then
    raise exception 'Ton écrit a déjà été validé.' using errcode = '22023';
  end if;
  if v_exam.examiner_id is null then
    raise exception 'Aucun examinateur n''est désigné : contacte ton formateur.' using errcode = '22023';
  end if;
  if not exists (
    select 1 from availability_slots
    where formateur_id = v_exam.examiner_id and slot_date = p_slot_date and start_time = p_start_time
  ) then
    raise exception 'Ce créneau n''est plus disponible : choisis-en un autre.' using errcode = '22023';
  end if;

  insert into rendez_vous (student_id, formateur_id, slot_date, start_time, end_time, status, kind, message)
  values (auth.uid(), v_exam.examiner_id, p_slot_date, p_start_time, p_start_time + interval '1 hour',
          'confirmed', 'soutenance', 'Soutenance orale — certification RS6776')
  returning id into v_rdv;

  update certification_exams
    set answers = p_answers, status = 'submitted', submitted_at = now(), rendez_vous_id = v_rdv
    where id = v_exam.id;

  select coalesce(nullif(trim(concat_ws(' ', first_name, last_name)), ''), email) into v_name
    from profiles where id = auth.uid();
  insert into notifications (user_id, type, title, body, rdv_id)
  values (v_exam.examiner_id, 'certification_submitted', 'Écrit de certification rendu',
          v_name || ' a validé son écrit. Soutenance le ' || to_char(p_slot_date, 'DD/MM/YYYY') || ' à ' || to_char(p_start_time, 'HH24"h"MI') || '.',
          v_rdv);
  return v_rdv;
end;
$$;
revoke execute on function submit_certification_exam(jsonb, date, time) from public, anon;
grant execute on function submit_certification_exam(jsonb, date, time) to authenticated;
