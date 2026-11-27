-- Versions du programme d'une session. Chaque création, import (PDF ou
-- Word) ou modification enregistrée du programme ajoute une version ;
-- l'administrateur choisit la version active. La version active est
-- recopiée dans training_sessions.formation : c'est elle que lisent les
-- documents et l'espace client, sans autre changement de leur côté.
--
-- Écritures par les deux fonctions ci-dessous seulement (admin), pour que
-- la version active et la fiche de la session restent toujours d'accord.

create table programme_versions (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid not null references training_sessions(id) on delete cascade,
  numero      int not null,
  -- origine : programme de la session avant le premier versionnement.
  source      text not null check (source in ('origine', 'creation', 'import', 'modification')),
  file_name   text,
  formation   jsonb not null,
  is_active   boolean not null default false,
  created_by  uuid references profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  unique (session_id, numero)
);
create unique index programme_versions_one_active on programme_versions(session_id) where is_active;

alter table programme_versions enable row level security;
create policy "admin reads programme versions" on programme_versions for select using (is_admin());

-- Ajoute une version (active si p_activate) et renvoie son id. Pour une
-- session créée avant le versionnement, son programme actuel est d'abord
-- conservé en version 1 « origine ».
create function add_programme_version(p_session_id uuid, p_formation jsonb, p_source text, p_file_name text default null, p_activate boolean default true)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_current jsonb;
  v_numero int;
  v_id uuid;
begin
  if not is_admin() then raise exception 'Réservé à l''administrateur.'; end if;
  if p_source not in ('creation', 'import', 'modification') then raise exception 'Source inconnue.'; end if;
  if jsonb_typeof(p_formation) <> 'object' or coalesce(p_formation->>'intitule', '') = '' then raise exception 'Programme invalide.'; end if;

  select formation into v_current from training_sessions where id = p_session_id for update;
  if not found then raise exception 'Session introuvable.'; end if;

  select coalesce(max(numero), 0) into v_numero from programme_versions where session_id = p_session_id;
  if v_numero = 0 and p_source <> 'creation' then
    insert into programme_versions (session_id, numero, source, formation, is_active, created_by)
    values (p_session_id, 1, 'origine', v_current, not p_activate, auth.uid());
    v_numero := 1;
  end if;

  if p_activate then
    update programme_versions set is_active = false where session_id = p_session_id and is_active;
  end if;
  insert into programme_versions (session_id, numero, source, file_name, formation, is_active, created_by)
  values (p_session_id, v_numero + 1, p_source, nullif(left(btrim(coalesce(p_file_name, '')), 200), ''), p_formation, p_activate, auth.uid())
  returning id into v_id;

  if p_activate then
    update training_sessions set formation = p_formation, updated_at = now() where id = p_session_id;
  end if;
  return v_id;
end $$;

-- Rend active une version existante : elle redevient le programme de la session.
create function activate_programme_version(p_version_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  v programme_versions%rowtype;
begin
  if not is_admin() then raise exception 'Réservé à l''administrateur.'; end if;
  select * into v from programme_versions where id = p_version_id;
  if not found then raise exception 'Version introuvable.'; end if;
  perform 1 from training_sessions where id = v.session_id for update;
  update programme_versions set is_active = false where session_id = v.session_id and is_active and id <> v.id;
  update programme_versions set is_active = true where id = v.id;
  update training_sessions set formation = v.formation, updated_at = now() where id = v.session_id;
end $$;

revoke all on function add_programme_version(uuid, jsonb, text, text, boolean) from public, anon;
revoke all on function activate_programme_version(uuid) from public, anon;
grant execute on function add_programme_version(uuid, jsonb, text, text, boolean) to authenticated;
grant execute on function activate_programme_version(uuid) to authenticated;
