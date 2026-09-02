-- ═══════════════════════════════════════════════════════════════════════════
-- Resserre 3 actions sur l'admin uniquement (le formateur les perd) :
--   1. Suppression d'une formation (désormais soft-delete → corbeille, la
--      suppression définitive depuis la corbeille est, elle, irréversible)
--   2. Changement de statut d'une formation attribuée à un élève
--      (active / en pause / terminée)
-- Les 2 autres actions demandées (attribuer un formateur à un élève,
-- attribuer une formation à un élève) sont déjà admin-only depuis
-- l'origine (profiles_self_update et assign_formation_to_student
-- utilisent is_admin(), jamais is_staff()) — rien à changer côté DB,
-- seule l'UI est resserrée en parallèle de cette migration.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. Corbeille des formations ─────────────────────────────────────────────

alter table formations add column deleted_at timestamptz;

-- Un formateur garde le droit de créer/modifier une formation, mais seul un
-- admin peut la mettre à la corbeille ou l'en sortir (changer deleted_at).
create or replace function protect_formation_soft_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.deleted_at is distinct from old.deleted_at and not is_admin() then
    raise exception 'Seul un administrateur peut supprimer ou restaurer une formation.';
  end if;
  return new;
end;
$$;

create trigger formations_protect_soft_delete
  before update on formations
  for each row execute function protect_formation_soft_delete();

drop policy if exists "formations_staff_all" on formations;

-- Les formations supprimées (deleted_at renseigné) ne sont visibles que par
-- un admin (vue "corbeille") ; un formateur ne voit plus que les formations
-- actives, comme avant.
create policy "formations_select" on formations for select
  using (is_admin() or (is_staff() and deleted_at is null));
create policy "formations_staff_insert" on formations for insert
  with check (is_staff());
create policy "formations_staff_update" on formations for update
  using (is_staff()) with check (is_staff());
-- Suppression définitive (depuis la corbeille) : admin uniquement.
create policy "formations_admin_delete" on formations for delete
  using (is_admin());

-- ── 2. Statut d'une formation attribuée (formation_instances.status) ───────

create or replace function protect_instance_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status is distinct from old.status and not is_admin() then
    raise exception 'Seul un administrateur peut changer le statut d''une formation attribuée.';
  end if;
  return new;
end;
$$;

create trigger formation_instances_protect_status
  before update on formation_instances
  for each row execute function protect_instance_status();
