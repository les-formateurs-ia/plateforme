-- Reprise des données Digiforma (formations Entreprise) dans le CRM :
--   * companies : la fiche client complète (identité légale, adresse,
--     contacts), jusqu'ici réduite au nom ;
--   * training_sessions : statut commercial (prospect, devis, gagné, perdu),
--     factures émises, charges (rémunération des intervenants), origine de
--     la session et archive Digiforma (étape, satisfaction, documents) ;
--   * training_session_trainees : heures prévues / réalisées, et e-mail
--     facultatif (Digiforma n'en avait pas pour la plupart des stagiaires) ;
--   * bucket privé digiforma-archives : les PDF du dossier (devis signés,
--     conventions, émargements, certificats), lus par l'administrateur seul.
--
-- Les données elles-mêmes sont chargées par supabase/scripts/import_digiforma.sql
-- (hors dépôt : elles contiennent des données personnelles).

-- ── Fiche entreprise ───────────────────────────────────────────────────

alter table companies
  add column legal_name    text,
  add column siret         text,
  add column vat_number    text,
  add column ape_code      text,
  add column address       text,
  add column postal_code   text,
  add column city          text,
  add column country       text not null default 'France',
  add column email         text,
  add column phone         text,
  add column website       text,
  add column notes         text,
  -- { formation | finance | representant : { civilite, prenom, nom, fonction, email, telephone } }
  add column contacts      jsonb not null default '{}'::jsonb,
  add column digiforma_id  bigint unique;

comment on column companies.contacts is
  'Contacts de l''entreprise par rôle (formation, finance, representant) : civilite, prenom, nom, fonction, email, telephone.';
comment on column companies.digiforma_id is 'Identifiant de l''entreprise dans Digiforma (reprise des données).';

-- ── Sessions : suivi commercial et financier ───────────────────────────

alter table training_sessions
  add column statut_commercial text not null default 'gagne'
    check (statut_commercial in ('prospect', 'devis', 'gagne', 'perdu')),
  -- [{ numero, date, destinataire, montantHt, statut (non_payee | en_retard | payee), payeHt, fichier }]
  add column factures   jsonb not null default '[]'::jsonb,
  add column charges_ht numeric(10, 2) not null default 0 check (charges_ht >= 0),
  add column source     text not null default 'plateforme' check (source in ('plateforme', 'digiforma')),
  -- Dossier repris de Digiforma : { code, etape, cloture, satisfaction, notes, documents: [{ categorie, dossier, nom, chemin, octets }] }
  add column archive    jsonb;

comment on column training_sessions.statut_commercial is
  'prospect : en discussion ; devis : proposition envoyée ; gagne : formation vendue ; perdu.';
comment on column training_sessions.archive is
  'Dossier repris de Digiforma. cloture = dossier administratif complet dans Digiforma : le parcours Qualiopi est considéré comme fait.';

-- ── Stagiaires : heures et e-mail facultatif ───────────────────────────

alter table training_session_trainees
  alter column email drop not null,
  add column heures_prevues   numeric(6, 2),
  add column heures_realisees numeric(6, 2);
-- La contrainte unique (session_id, email) reste : plusieurs e-mails nuls ne se gênent pas.

-- ── Formateur : données financières masquées ───────────────────────────

-- Même fonction qu'en 20261106120000, avec les nouvelles colonnes
-- financières (factures, charges) et les documents de l'archive.
create or replace function my_formateur_sessions(p_session_id uuid default null) returns setof training_sessions
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
    r.factures := '[]'::jsonb;
    r.charges_ht := 0;
    r.archive := case when r.archive is null then null else r.archive - 'documents' end;
    return next r;
  end loop;
end $$;

-- ── Archives Digiforma (PDF) ───────────────────────────────────────────

insert into storage.buckets (id, name, public, file_size_limit)
values ('digiforma-archives', 'digiforma-archives', false, 52428800)
on conflict (id) do nothing;

create policy "admin reads digiforma archives" on storage.objects for select to authenticated
  using (bucket_id = 'digiforma-archives' and (select public.is_admin()));
create policy "admin uploads digiforma archives" on storage.objects for insert to authenticated
  with check (bucket_id = 'digiforma-archives' and (select public.is_admin()));
create policy "admin updates digiforma archives" on storage.objects for update to authenticated
  using (bucket_id = 'digiforma-archives' and (select public.is_admin()));
