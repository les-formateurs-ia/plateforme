-- Attribution d'une session à un formateur, et cloisonnement de l'espace
-- équipe : l'administrateur voit tout ; un formateur ne voit que les
-- sessions qui lui sont attribuées, et seulement leur partie pédagogique
-- (stagiaires, séances, émargement, évaluation). Les prix, conditions de
-- paiement, financeur, documents émis, e-mails et le lien de l'espace
-- client restent réservés à l'administrateur.

alter table training_sessions add column formateur_id uuid references profiles(id) on delete set null;
create index training_sessions_formateur_idx on training_sessions(formateur_id);
comment on column training_sessions.formateur_id is
  'Formateur attribué : il voit la session (sans ses données financières) et en assure l''émargement.';

-- Vrai si la session est attribuée à l'utilisateur courant. Security
-- definer : le formateur n'a pas de lecture directe sur training_sessions.
create function is_session_formateur(p_session_id uuid) returns boolean
language sql security definer stable set search_path = public as $$
  select exists (select 1 from training_sessions where id = p_session_id and formateur_id = auth.uid());
$$;

-- ── Sessions : administrateur seul en accès direct ─────────────────────

drop policy "staff manage sessions" on training_sessions;
create policy "admin manage sessions" on training_sessions for all using (is_admin()) with check (is_admin());

-- Sessions du formateur, données financières masquées (lignes de prix,
-- tarif du programme, conditions de paiement, financeur, jeton de l'espace
-- client) ; même forme que la table pour être lue par le même code.
create function my_formateur_sessions(p_session_id uuid default null) returns setof training_sessions
language plpgsql security definer stable set search_path = public as $$
declare
  r training_sessions%rowtype;
begin
  if not is_staff() then raise exception 'Réservé aux formateurs.'; end if;
  for r in
    select * from training_sessions
    where formateur_id = auth.uid() and (p_session_id is null or id = p_session_id)
    order by date_debut desc
  loop
    r.lignes := '[]'::jsonb;
    r.formation := jsonb_set(r.formation, '{tarif}', '""'::jsonb);
    r.conditions_paiement := '';
    r.financeur := null;
    r.client_token := '00000000-0000-0000-0000-000000000000';
    return next r;
  end loop;
end $$;

-- ── Séances, stagiaires, émargement ────────────────────────────────────

drop policy "staff manage slots" on training_session_slots;
create policy "admin manage slots" on training_session_slots for all using (is_admin()) with check (is_admin());
create policy "formateur reads own slots" on training_session_slots for select using (is_session_formateur(session_id));

drop policy "staff manage trainees" on training_session_trainees;
create policy "admin manage trainees" on training_session_trainees for all using (is_admin()) with check (is_admin());
create policy "formateur reads own trainees" on training_session_trainees for select using (is_session_formateur(session_id));
-- Le formateur saisit le résultat de l'évaluation (repris sur l'attestation).
create policy "formateur evaluates own trainees" on training_session_trainees for update
  using (is_session_formateur(session_id)) with check (is_session_formateur(session_id));

drop policy "staff read signatures" on attendance_signatures;
create policy "admin read signatures" on attendance_signatures for select using (is_admin());
create policy "formateur reads own signatures" on attendance_signatures for select
  using (exists (select 1 from training_session_slots s where s.id = slot_id and is_session_formateur(s.session_id)));

-- ── Documents et e-mails : administrateur seul ─────────────────────────

drop policy "staff read documents" on session_documents;
drop policy "staff issue documents" on session_documents;
drop policy "staff delete unsigned documents" on session_documents;
create policy "admin read documents" on session_documents for select using (is_admin());
create policy "admin issue documents" on session_documents for insert with check (is_admin() and signed_at is null);
create policy "admin delete unsigned documents" on session_documents for delete using (is_admin() and signed_at is null);

drop policy "staff read emails" on session_emails;
create policy "admin read emails" on session_emails for select using (is_admin());

-- ── Émargement de l'intervenant : sessions attribuées seulement ────────

create or replace function sign_attendance_as_trainer(p_slot_id uuid) returns timestamptz
language plpgsql security definer set search_path = public as $$
declare
  v_slot    training_session_slots%rowtype;
  v_name    text;
  v_signed  timestamptz;
begin
  if not is_staff() then raise exception 'Réservé aux formateurs.'; end if;
  select * into v_slot from training_session_slots where id = p_slot_id;
  if not found then raise exception 'Créneau introuvable.'; end if;
  if not is_admin() and not is_session_formateur(v_slot.session_id) then
    raise exception 'Cette formation ne vous est pas attribuée.';
  end if;
  if now() at time zone 'Europe/Paris' < v_slot.slot_date + v_slot.start_time then
    raise exception 'La séance n''a pas encore commencé.';
  end if;
  select coalesce(nullif(trim(coalesce(first_name, '') || ' ' || coalesce(last_name, '')), ''), email) into v_name
    from profiles where id = auth.uid();
  insert into attendance_signatures (slot_id, signer_role, signer_profile_id, signer_name, ip, user_agent)
    values (p_slot_id, 'intervenant', auth.uid(), v_name, request_ip(), request_user_agent())
    on conflict do nothing;
  select signed_at into v_signed from attendance_signatures where slot_id = p_slot_id and signer_role = 'intervenant';
  return v_signed;
end $$;

revoke all on function is_session_formateur(uuid), my_formateur_sessions(uuid) from public;
grant execute on function is_session_formateur(uuid), my_formateur_sessions(uuid) to authenticated;
revoke execute on function is_session_formateur(uuid), my_formateur_sessions(uuid) from anon;
