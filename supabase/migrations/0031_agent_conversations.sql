-- ═══════════════════════════════════════════════════════════════════════════
-- Agent IA unifié par élève : remplace le copilote texte scopé par leçon
-- (chat_messages, clé (user_id, lesson_id)) par des conversations scopées par
-- ÉLÈVE, groupées par formation ("projet", formation_instance_id nullable =
-- discussion générale). Texte et vocal écrivent désormais dans la même table
-- de messages (modality), avec un historique continu par conversation au
-- lieu d'être remis à zéro à chaque leçon.
--
-- chat_messages n'est pas supprimée (historique existant), mais n'est plus
-- alimentée après cette migration : son contenu est repris ci-dessous dans
-- de nouvelles conversations, une par (user_id, formation) déjà utilisée.
-- ═══════════════════════════════════════════════════════════════════════════

create type agent_message_modality as enum ('text', 'voice');

create table agent_conversations (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references profiles(id) on delete cascade,
  formation_instance_id uuid references formation_instances(id) on delete set null, -- null = discussion générale
  title                 text,
  created_at            timestamptz not null default now(),
  last_message_at       timestamptz not null default now()
);
create index agent_conversations_user_recency on agent_conversations (user_id, last_message_at desc);

create table agent_messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references agent_conversations(id) on delete cascade,
  role            chat_role not null, -- même enum ('user','ai') que l'ancien chat_messages
  content         text not null,
  modality        agent_message_modality not null default 'text',
  is_off_topic    boolean not null default false,
  created_at      timestamptz not null default now()
);
create index agent_messages_lookup on agent_messages (conversation_id, created_at);

-- ── Auto-maintenance : dernière activité + titre de la conversation ────────
-- Évite de dupliquer cette logique dans chaque appelant (edge function pour
-- le texte, insert client direct pour les transcripts vocaux) : elle
-- s'applique uniformément quel que soit le chemin d'écriture.

create function agent_conversations_touch() returns trigger as $$
begin
  update agent_conversations set last_message_at = new.created_at where id = new.conversation_id;
  return new;
end;
$$ language plpgsql security definer;

create trigger agent_messages_touch_conversation
  after insert on agent_messages
  for each row execute function agent_conversations_touch();

create function agent_conversations_maybe_title() returns trigger as $$
begin
  if new.role = 'user' then
    update agent_conversations
    set title = left(new.content, 60)
    where id = new.conversation_id and title is null;
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger agent_messages_set_title
  after insert on agent_messages
  for each row execute function agent_conversations_maybe_title();

-- ── RLS ──────────────────────────────────────────────────────────────────

alter table agent_conversations enable row level security;
alter table agent_messages enable row level security;

create policy "agent_conversations_self" on agent_conversations for all
  using (user_id = auth.uid() or is_staff())
  with check (user_id = auth.uid() or is_staff());

create policy "agent_messages_self" on agent_messages for all
  using (
    exists (select 1 from agent_conversations c where c.id = conversation_id and (c.user_id = auth.uid() or is_staff()))
  )
  with check (
    exists (select 1 from agent_conversations c where c.id = conversation_id and (c.user_id = auth.uid() or is_staff()))
  );

-- ── Reprise de l'historique existant ────────────────────────────────────
-- Une conversation par (élève, formation) déjà présente dans chat_messages,
-- reconstituée via instance_lessons → instance_sections → formation_instances
-- (chat_messages.lesson_id référence déjà instance_lessons depuis la
-- migration 0019). Les triggers ci-dessus renseignent last_message_at et
-- title automatiquement au fil des inserts.

do $$
declare
  r record;
  v_conversation_id uuid;
begin
  for r in (
    select distinct cm.user_id, isec.instance_id as formation_instance_id
    from chat_messages cm
    join instance_lessons il on il.id = cm.lesson_id
    join instance_sections isec on isec.id = il.section_id
  ) loop
    insert into agent_conversations (user_id, formation_instance_id)
    values (r.user_id, r.formation_instance_id)
    returning id into v_conversation_id;

    insert into agent_messages (conversation_id, role, content, modality, is_off_topic, created_at)
    select v_conversation_id, cm.role, cm.content, 'text', cm.is_off_topic, cm.created_at
    from chat_messages cm
    join instance_lessons il on il.id = cm.lesson_id
    join instance_sections isec on isec.id = il.section_id
    where isec.instance_id = r.formation_instance_id and cm.user_id = r.user_id
    order by cm.created_at asc;
  end loop;
end $$;
