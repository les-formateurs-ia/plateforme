-- Traçabilité des modules de chat du Studio : pour chaque réponse, quels
-- modèles/fournisseurs ont réellement traité la requête et ses fichiers
-- (ex. PDF retranscrit par Gemini puis réponse de GPT via Runware).
-- Table séparée de studio_chat_conversations pour que seul l'admin puisse la
-- lire : l'élève et le formateur ne doivent pas voir ce détail technique.
create table studio_chat_traces (
  id               uuid primary key default gen_random_uuid(),
  conversation_id  uuid not null references studio_chat_conversations(id) on delete cascade,
  message_id       text not null, -- id du message assistant dans studio_chat_conversations.messages
  user_id          uuid not null references profiles(id) on delete cascade,
  steps            jsonb not null,
  created_at       timestamptz not null default now()
);
create index studio_chat_traces_conversation_idx on studio_chat_traces (conversation_id);

alter table studio_chat_traces enable row level security;

create policy "studio_chat_traces_select_admin" on studio_chat_traces for select
  using (public.is_admin());

-- Écrit par l'edge function studio-chat avec la session de l'élève.
create policy "studio_chat_traces_insert_own" on studio_chat_traces for insert
  with check (user_id = auth.uid());
