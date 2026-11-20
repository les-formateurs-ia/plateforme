-- ═══════════════════════════════════════════════════════════════════════════
-- Mode Visiteur : lien de démonstration à diffuser aux prospects
-- (/visite/:jeton). Quiconque ouvre le lien entre directement dans la
-- plateforme, sans compte à créer ni mot de passe.
--
-- À la première ouverture dans un navigateur, l'edge function visitor-access
-- crée en coulisse un compte élève de démonstration (profiles.is_visitor),
-- lui attribue la formation du lien (duplicata classique) avec un petit
-- budget IA, puis le connecte. Ce navigateur garde sa session : y rouvrir le
-- lien ramène au même compte. Garde-fous : nombre maximal de comptes par
-- lien, et quelques comptes par jour et par adresse IP au plus.
--
-- Restrictions du compte visiteur :
--   - programme visible, seule la première leçon ouverte (les modules
--     suivants restent fermés côté serveur, cf. 20260925130000 ; la limite
--     à une leçon dans le premier module est appliquée côté interface) ;
--   - Studio limité par profiles.ai_budget_usd (garde-fou serveur existant) ;
--   - Hub IA, Guide IA, Exercices : aperçu limité côté interface ;
--   - Agent IA : prompt « mode test » côté edge functions (agent-chat,
--     gemini-voice-token) ;
--   - pas de réservation de rendez-vous (policy ci-dessous) ;
--   - lien désactivé ou expiré : les sessions ouvertes sont fermées
--     (visitor_link_active, vérifié au chargement du profil).
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
  template_id uuid references formations(id) on delete set null,
  -- Budget IA de chaque compte ouvert par ce lien.
  budget_usd numeric(10,2) not null default 3 check (budget_usd >= 0 and budget_usd <= 20),
  -- Nombre maximal de comptes ouverts par ce lien (null = sans limite).
  max_accounts integer check (max_accounts is null or max_accounts > 0),
  accounts_count integer not null default 0,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz,
  revoked_at timestamptz,
  open_count integer not null default 0,
  last_opened_at timestamptz
);

create index visitor_links_created_at_idx on visitor_links (created_at desc);

-- Comptes ouverts par un lien. ip_hash (sha-256 de l'IP salée par le lien,
-- jamais l'IP en clair) sert uniquement à la limite quotidienne par IP.
create table visitor_accounts (
  profile_id uuid primary key references profiles(id) on delete cascade,
  link_id uuid not null references visitor_links(id) on delete cascade,
  ip_hash text,
  created_at timestamptz not null default now()
);

create index visitor_accounts_link_idx on visitor_accounts (link_id);
create index visitor_accounts_ip_idx on visitor_accounts (ip_hash, created_at desc);

-- L'admin crée, lit, désactive les liens ; les comptes sont créés et
-- supprimés par des edge functions service-role (visitor-access,
-- delete-visitor-link).
alter table visitor_links enable row level security;
alter table visitor_accounts enable row level security;

create policy "visitor_links_admin_select" on visitor_links for select to authenticated using (public.is_admin());
create policy "visitor_links_admin_insert" on visitor_links for insert to authenticated with check (public.is_admin());
create policy "visitor_links_admin_update" on visitor_links for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "visitor_accounts_admin_select" on visitor_accounts for select to authenticated using (public.is_admin());

-- Le compte visiteur connecté vient-il d'un lien encore actif ? (un lien
-- désactivé ou expiré ferme aussi les visites déjà ouvertes).
create or replace function public.visitor_link_active() returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from visitor_accounts a join visitor_links l on l.id = a.link_id
    where a.profile_id = auth.uid()
      and l.revoked_at is null
      and (l.expires_at is null or l.expires_at > now())
  );
$$;

revoke execute on function public.visitor_link_active() from public, anon;
grant execute on function public.visitor_link_active() to authenticated;

-- Attribution de la formation à un compte visiteur, depuis visitor-access
-- (service role, donc sans auth.uid()) : on agit au nom de l'admin qui a créé
-- le lien (ou du premier admin s'il n'existe plus) pour réutiliser
-- assign_formation_to_student tel quel, is_staff() et assigned_by compris.
create or replace function public.assign_formation_to_visitor(p_template_id uuid, p_student_id uuid, p_staff_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_staff uuid;
begin
  if not exists (select 1 from profiles where id = p_student_id and is_visitor) then
    raise exception 'Le destinataire doit être un compte visiteur.';
  end if;
  select id into v_staff from profiles where id = p_staff_id and role = 'admin';
  if v_staff is null then
    select id into v_staff from profiles where role = 'admin' order by created_at limit 1;
  end if;
  if v_staff is null then
    raise exception 'Aucun administrateur pour attribuer la formation.';
  end if;
  perform set_config('request.jwt.claims', json_build_object('sub', v_staff, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', v_staff::text, true);
  return public.assign_formation_to_student(p_template_id, p_student_id);
end;
$$;

revoke execute on function public.assign_formation_to_visitor(uuid, uuid, uuid) from public, anon, authenticated;
grant execute on function public.assign_formation_to_visitor(uuid, uuid, uuid) to service_role;

-- ── Essais IA du visiteur ────────────────────────────────────────────────
-- Un visiteur teste chaque outil IA une fois (une image, une vidéo, un
-- message…) : les edge functions réservent l'essai avant l'appel au
-- fournisseur (claim_visitor_trial) et le rendent si cet appel échoue
-- (suppression service-role, cf. _shared/visitor-trial.ts).
create table visitor_ai_uses (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  tool text not null,
  created_at timestamptz not null default now()
);

create index visitor_ai_uses_profile_tool_idx on visitor_ai_uses (profile_id, tool);

-- Aucune policy : lecture et écriture uniquement par les fonctions ci-dessous
-- et le service role.
alter table visitor_ai_uses enable row level security;

-- Réserve un essai de l'outil p_tool pour l'appelant. Hors visiteur :
-- toujours autorisé, rien n'est compté. Visiteur : autorisé tant que moins de
-- p_limit essais sont enregistrés (p_limit = 0 : outil fermé au visiteur).
create or replace function public.claim_visitor_trial(p_tool text, p_limit integer default 1)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if not public.is_visitor() then
    return jsonb_build_object('allowed', true);
  end if;
  perform pg_advisory_xact_lock(hashtext(auth.uid()::text || ':' || p_tool));
  if (select count(*) from visitor_ai_uses where profile_id = auth.uid() and tool = p_tool) >= p_limit then
    return jsonb_build_object('allowed', false);
  end if;
  insert into visitor_ai_uses (profile_id, tool) values (auth.uid(), p_tool) returning id into v_id;
  return jsonb_build_object('allowed', true, 'use_id', v_id);
end;
$$;

revoke execute on function public.claim_visitor_trial(text, integer) from public, anon;
grant execute on function public.claim_visitor_trial(text, integer) to authenticated;

-- Outils déjà testés par le visiteur connecté (l'interface affiche alors la
-- présentation de l'outil plutôt que le formulaire).
create or replace function public.my_visitor_trials()
returns setof text
language sql stable security definer set search_path = public
as $$
  select distinct tool from visitor_ai_uses where profile_id = auth.uid();
$$;

revoke execute on function public.my_visitor_trials() from public, anon;
grant execute on function public.my_visitor_trials() to authenticated;
