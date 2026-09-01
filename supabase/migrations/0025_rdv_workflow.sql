-- Évolution du planning natif (0023) :
--   * une session dure 1h (le créneau de 15 min choisi n'est que l'heure de
--     début) — l'ancien code ne posait aucune contrainte de durée, on verrouille
--     ça côté BDD via un contrôle de chevauchement, pas via un CHECK sur
--     end_time (calculé côté client mais vérifié ici quoi qu'il arrive) ;
--   * un élève ne peut avoir qu'un seul rendez-vous confirmé à venir à la fois
--     (il doit modifier l'existant plutôt que d'en reprendre un second) ;
--   * un formateur peut annuler (avec notification obligatoire à l'élève) ou
--     proposer un nouveau créneau (accepté/refusé par l'élève, notifié dans
--     les deux cas) ;
--   * table notifications générique pour porter ces événements jusqu'au compte
--     élève/formateur (cloche dans la topbar + carte dans l'onglet Planning).

alter table rendez_vous add column cancelled_by uuid references profiles(id);
alter table rendez_vous add column proposed_date date;
alter table rendez_vous add column proposed_start_time time;
alter table rendez_vous add column proposed_end_time time;
alter table rendez_vous add column proposed_by uuid references profiles(id);
alter table rendez_vous add column proposed_at timestamptz;

-- ── Un seul rendez-vous confirmé à venir par élève, et aucun chevauchement
-- entre deux rendez-vous confirmés d'un même formateur ─────────────────────
create function check_rendez_vous_constraints() returns trigger as $$
begin
  if new.status <> 'confirmed' then
    return new;
  end if;

  if exists (
    select 1 from rendez_vous
    where student_id = new.student_id
      and status = 'confirmed'
      and slot_date >= current_date
      and id <> coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid)
  ) then
    raise exception 'Vous avez déjà un rendez-vous à venir : modifiez-le au lieu d''en reprendre un second.';
  end if;

  if exists (
    select 1 from rendez_vous
    where formateur_id = new.formateur_id
      and slot_date = new.slot_date
      and status = 'confirmed'
      and id <> coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid)
      and new.start_time < end_time and new.end_time > start_time
  ) then
    raise exception 'Ce créneau chevauche un rendez-vous déjà confirmé.';
  end if;

  return new;
end;
$$ language plpgsql;

create trigger rendez_vous_check_constraints before insert or update on rendez_vous
  for each row execute function check_rendez_vous_constraints();

-- La policy d'update d'origine (0023) n'avait pas de with check : un
-- participant pouvait en théorie réattribuer le rendez-vous à un tiers.
drop policy "rendez_vous_update" on rendez_vous;
create policy "rendez_vous_update" on rendez_vous for update
  using (student_id = auth.uid() or formateur_id = auth.uid() or is_admin())
  with check (student_id = auth.uid() or formateur_id = auth.uid() or is_admin());

-- ── Notifications (annulation / proposition de nouveau créneau) ───────────
create type notification_type as enum (
  'rdv_cancelled', 'rdv_reschedule_proposed', 'rdv_reschedule_accepted', 'rdv_reschedule_declined'
);

create table notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  type        notification_type not null,
  title       text not null,
  body        text,
  rdv_id      uuid references rendez_vous(id) on delete cascade,
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);
create index notifications_user_idx on notifications (user_id, created_at desc);

alter table notifications enable row level security;

create policy "notifications_read" on notifications for select using (user_id = auth.uid());
create policy "notifications_mark_read" on notifications for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Une notification est toujours envoyée par l'autre partie d'un rendez-vous
-- partagé (le formateur notifie son élève et vice-versa) — jamais à un tiers
-- sans lien avec l'expéditeur.
create policy "notifications_insert" on notifications for insert
  with check (
    user_id = auth.uid()
    or exists (
      select 1 from rendez_vous r
      where r.id = rdv_id
        and (r.student_id = auth.uid() or r.formateur_id = auth.uid())
        and (r.student_id = user_id or r.formateur_id = user_id)
    )
  );
