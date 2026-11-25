-- Messagerie interne d'une session : l'administrateur y transmet au
-- formateur attribué ce qu'il faut savoir du client (la demande, le besoin,
-- le contexte), et le formateur y répond ou ajoute ses propres notes.
-- Un fil par session ; ni le client ni les stagiaires n'y ont accès.
--
-- Les messages sont conservés sans limite de durée : aucune policy de
-- modification ni de suppression, ils ne disparaissent qu'avec la session
-- elle-même (suppression confirmée par l'administrateur).

create table session_messages (
  id           uuid primary key default gen_random_uuid(),
  session_id   uuid not null references training_sessions(id) on delete cascade,
  author_id    uuid references profiles(id) on delete set null,
  -- Recopiés à l'envoi : le formateur ne lit pas le profil de l'administrateur,
  -- et le fil reste lisible si un compte est supprimé.
  author_name  text not null default '',
  author_role  text not null default 'formateur' check (author_role in ('admin', 'formateur')),
  body         text not null check (length(btrim(body)) between 1 and 5000),
  created_at   timestamptz not null default now()
);
create index session_messages_session_idx on session_messages(session_id, created_at);

-- Auteur, rôle et heure fixés par la base : le client ne peut ni signer à la
-- place d'un autre ni antidater un message.
create function session_messages_set_author() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  p profiles%rowtype;
begin
  select * into p from profiles where id = auth.uid();
  if not found then raise exception 'Compte introuvable.'; end if;
  new.author_id := p.id;
  new.author_name := coalesce(nullif(trim(coalesce(p.first_name, '') || ' ' || coalesce(p.last_name, '')), ''), p.email, '');
  new.author_role := case when p.role = 'admin' then 'admin' else 'formateur' end;
  new.body := btrim(new.body);
  new.created_at := now();
  return new;
end $$;

create trigger session_messages_set_author before insert on session_messages
  for each row execute function session_messages_set_author();

alter table session_messages enable row level security;

create policy "admin or session formateur reads messages" on session_messages for select
  using (is_admin() or is_session_formateur(session_id));
create policy "admin or session formateur writes messages" on session_messages for insert
  with check (is_admin() or is_session_formateur(session_id));

-- Nouveaux messages affichés en direct chez l'autre participant (les
-- policies ci-dessus filtrent aussi la diffusion).
alter publication supabase_realtime add table session_messages;
