-- L'admin peut aussi baisser le plafond IA d'un élève : admin_add_ai_credits
-- accepte un montant négatif (retrait), journalisé comme une recharge négative.
-- Le plafond ne descend jamais sous 0 ; il peut descendre sous la consommation
-- (l'élève est alors bloqué, c'est voulu).
alter table ai_budget_topups drop constraint ai_budget_topups_amount_usd_check;
alter table ai_budget_topups add constraint ai_budget_topups_amount_usd_check check (amount_usd <> 0);

create or replace function public.admin_add_ai_credits(p_user_id uuid, p_amount numeric)
returns numeric as $$
declare
  new_budget numeric;
begin
  if not public.is_admin() then
    raise exception 'Réservé à l''administrateur.' using errcode = '42501';
  end if;
  if p_amount is null or p_amount = 0 or abs(p_amount) > 10000 then
    raise exception 'Montant invalide.' using errcode = '22023';
  end if;
  if not exists (select 1 from profiles where id = p_user_id) then
    raise exception 'Utilisateur introuvable.' using errcode = 'P0002';
  end if;
  update profiles set ai_budget_usd = ai_budget_usd + p_amount
    where id = p_user_id and ai_budget_usd + p_amount >= 0
    returning ai_budget_usd into new_budget;
  if new_budget is null then
    raise exception 'Le plafond ne peut pas devenir négatif.' using errcode = '22023';
  end if;
  insert into ai_budget_topups (user_id, amount_usd, created_by) values (p_user_id, p_amount, auth.uid());
  return new_budget;
end;
$$ language plpgsql security definer set search_path = public;
