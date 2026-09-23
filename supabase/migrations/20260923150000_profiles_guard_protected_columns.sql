-- profiles_self_update (0001) laisse l'utilisateur modifier TOUTE sa ligne :
-- un élève pouvait, depuis l'API, remettre spent_usd à 0 (contourner le
-- plafond IA de 50 $) ou se donner role = 'admin'. Ce trigger bloque ces
-- deux colonnes pour tout le monde sauf l'admin et le service role
-- (auth.uid() null : edge functions avec la clé service, scripts de seed).
-- spent_usd reste modifiable par ai_usage_events_apply_cost, qui lève le
-- drapeau transactionnel app.applying_ai_cost le temps de son UPDATE.
create or replace function public.profiles_guard_protected_columns() returns trigger as $$
begin
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;
  if new.role is distinct from old.role then
    raise exception 'Modification du rôle non autorisée.' using errcode = '42501';
  end if;
  if new.spent_usd is distinct from old.spent_usd
     and coalesce(current_setting('app.applying_ai_cost', true), '') <> 'on' then
    raise exception 'Modification du budget IA non autorisée.' using errcode = '42501';
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger profiles_guard_protected_columns
  before update on profiles
  for each row execute function public.profiles_guard_protected_columns();

create or replace function public.ai_usage_events_apply_cost() returns trigger as $$
begin
  perform set_config('app.applying_ai_cost', 'on', true);
  update profiles set spent_usd = spent_usd + new.cost_usd where id = new.user_id;
  perform set_config('app.applying_ai_cost', 'off', true);
  return new;
end;
$$ language plpgsql security definer set search_path = public;
