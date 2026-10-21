-- Correctif de 20261021120000_certification_exams.sql : le trigger
-- certification_exams_guard (l'élève ne modifie que ses réponses) bloquait
-- aussi submit_certification_exam, qui tourne avec la session de l'élève.
-- La fonction lève désormais un drapeau local à sa transaction que le
-- trigger laisse passer.

create or replace function certification_exams_guard_student_update() returns trigger as $$
begin
  if not is_admin()
    and coalesce(current_setting('app.certification_submit', true), '') <> 'on'
    and (
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

create or replace function submit_certification_exam(p_answers jsonb, p_slot_date date, p_start_time time) returns uuid
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

  perform set_config('app.certification_submit', 'on', true);
  update certification_exams
    set answers = p_answers, status = 'submitted', submitted_at = now(), rendez_vous_id = v_rdv
    where id = v_exam.id;
  perform set_config('app.certification_submit', '', true);

  select coalesce(nullif(trim(concat_ws(' ', first_name, last_name)), ''), email) into v_name
    from profiles where id = auth.uid();
  insert into notifications (user_id, type, title, body, rdv_id)
  values (v_exam.examiner_id, 'certification_submitted', 'Écrit de certification rendu',
          v_name || ' a validé son écrit. Soutenance le ' || to_char(p_slot_date, 'DD/MM/YYYY') || ' à ' || to_char(p_start_time, 'HH24"h"MI') || '.',
          v_rdv);
  return v_rdv;
end;
$$;
