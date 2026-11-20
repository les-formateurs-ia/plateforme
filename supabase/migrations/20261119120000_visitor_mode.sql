-- ═══════════════════════════════════════════════════════════════════════════
-- Mode Visiteur : un prospect reçoit un lien (/visite/:jeton) qui le connecte
-- sans mot de passe à un compte élève de démonstration.
--
-- Un lien = un compte visiteur, créé par l'admin avec le lien (cf. edge
-- function create-visitor-link) : la formation choisie lui est attribuée
-- (duplicata classique), avec un petit budget IA. Rouvrir le lien reconnecte
-- au même compte — recliquer ne redonne donc jamais de crédits.
--
-- Restrictions du compte visiteur :
--   - programme visible, seule la première leçon ouverte (les modules
--     suivants restent fermés côté serveur, cf. 20260925130000 ; la limite
--     à une leçon dans le premier module est appliquée côté interface) ;
--   - Studio limité par profiles.ai_budget_usd (garde-fou serveur existant) ;
--   - Hub IA, Guide IA, Exercices : aperçu limité côté interface ;
--   - Agent IA : prompt « mode test » côté edge functions (agent-chat,
--     gemini-voice-token) ;
--   - pas de réservation de rendez-vous (policy ci-dessous).
-- ═══════════════════════════════════════════════════════════════════════════

alter table profiles add column is_visitor boolean not null default false;

create or replace function public.is_visitor() returns boolean
language sql stable security definer set search_path = public
as $$
  select coalesce((select is_visitor from public.profiles where id = auth.uid()), false);
$$;

revoke execute on function public.is_visitor() from public, anon;
grant execute on function public.is_visitor() to authenticated;

-- is_visitor rejoint les colonnes protégées : un visiteur ne peut pas
-- s'enlever lui-même la restriction (ni toucher à son budget, déjà protégé).
create or replace function public.profiles_guard_protected_columns() returns trigger as $$
begin
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;
  if new.role is distinct from old.role then
    raise exception 'Modification du rôle non autorisée.' using errcode = '42501';
  end if;
  if new.is_visitor is distinct from old.is_visitor then
    raise exception 'Modification du mode visiteur non autorisée.' using errcode = '42501';
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

-- Un visiteur ne réserve jamais de créneau avec un vrai formateur.
create policy "rendez_vous_insert_not_visitor" on rendez_vous
  as restrictive for insert to authenticated
  with check (not public.is_visitor());

-- ── Liens visiteurs ──────────────────────────────────────────────────────
create table visitor_links (
  id uuid primary key default gen_random_uuid(),
  token uuid not null unique default gen_random_uuid(),
  label text not null,
  profile_id uuid not null references profiles(id) on delete cascade,
  template_id uuid references formations(id) on delete set null,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz,
  revoked_at timestamptz,
  open_count integer not null default 0,
  last_opened_at timestamptz
);

create index visitor_links_created_at_idx on visitor_links (created_at desc);

-- Création (compte + lien) et ouverture passent par des edge functions
-- service-role ; l'admin lit, renomme, désactive.
alter table visitor_links enable row level security;

create policy "visitor_links_admin_select" on visitor_links for select to authenticated using (public.is_admin());
create policy "visitor_links_admin_update" on visitor_links for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "visitor_links_admin_delete" on visitor_links for delete to authenticated using (public.is_admin());
