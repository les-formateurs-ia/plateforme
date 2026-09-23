-- Plafond IA Runware par utilisateur, rechargeable par l'admin. Avant : 50 $
-- fixes pour tous (constante dans le code) et aucun moyen de débloquer un
-- élève. Désormais : bloqué quand spent_usd >= ai_budget_usd ; l'admin ajoute
-- des crédits via admin_add_ai_credits, chaque recharge est journalisée.
alter table profiles add column ai_budget_usd numeric(12,6) not null default 50 check (ai_budget_usd >= 0);

create table ai_budget_topups (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  amount_usd  numeric(12,6) not null check (amount_usd > 0),
  created_by  uuid references profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);
create index ai_budget_topups_user_idx on ai_budget_topups (user_id, created_at desc);

alter table ai_budget_topups enable row level security;

create policy "ai_budget_topups_select" on ai_budget_topups for select
  using (
    user_id = auth.uid()
    or public.is_admin()
    or exists (select 1 from public.profiles p where p.id = user_id and p.formateur_id = auth.uid())
  );
-- Aucune policy d'écriture : on ne recharge que via admin_add_ai_credits.

create or replace function public.admin_add_ai_credits(p_user_id uuid, p_amount numeric)
returns numeric as $$
declare
  new_budget numeric;
begin
  if not public.is_admin() then
    raise exception 'Réservé à l''administrateur.' using errcode = '42501';
  end if;
  if p_amount is null or p_amount <= 0 or p_amount > 10000 then
    raise exception 'Montant invalide.' using errcode = '22023';
  end if;
  update profiles set ai_budget_usd = ai_budget_usd + p_amount where id = p_user_id
    returning ai_budget_usd into new_budget;
  if new_budget is null then
    raise exception 'Utilisateur introuvable.' using errcode = 'P0002';
  end if;
  insert into ai_budget_topups (user_id, amount_usd, created_by) values (p_user_id, p_amount, auth.uid());
  return new_budget;
end;
$$ language plpgsql security definer set search_path = public;

revoke execute on function public.admin_add_ai_credits(uuid, numeric) from public, anon;
grant execute on function public.admin_add_ai_credits(uuid, numeric) to authenticated;

-- Le plafond lui-même rejoint les colonnes protégées (cf. 20260923150000).
create or replace function public.profiles_guard_protected_columns() returns trigger as $$
begin
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;
  if new.role is distinct from old.role then
    raise exception 'Modification du rôle non autorisée.' using errcode = '42501';
  end if;
  if new.ai_budget_usd is distinct from old.ai_budget_usd then
    raise exception 'Modification du budget IA non autorisée.' using errcode = '42501';
  end if;
  if new.spent_usd is distinct from old.spent_usd
     and coalesce(current_setting('app.applying_ai_cost', true), '') <> 'on' then
    raise exception 'Modification du budget IA non autorisée.' using errcode = '42501';
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;
