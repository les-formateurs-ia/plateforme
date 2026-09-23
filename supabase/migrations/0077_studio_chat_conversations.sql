-- Modules "Discutez avec ChatGPT / Gemini / Claude" (Le Studio) : chat libre
-- avec les vrais modèles, un module par fournisseur. Même modèle d'accès
-- 3-niveaux (élève/formateur/admin) que les autres tables studio_*.
-- Les messages sont stockés en jsonb dans la conversation (pas de table
-- séparée) : une conversation est toujours lue/écrite en entier par
-- l'edge function studio-chat, jamais message par message.
create table studio_chat_conversations (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  provider    text not null check (provider in ('openai','gemini','anthropic')),
  model       text not null, -- dernier modèle utilisé (cf. _shared/studio-chat-models.ts)
  title       text not null,
  messages    jsonb not null default '[]'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index studio_chat_conversations_user_idx on studio_chat_conversations (user_id, provider, updated_at desc);

alter table studio_chat_conversations enable row level security;

create policy "studio_chat_select" on studio_chat_conversations for select
  using (
    user_id = auth.uid()
    or public.is_admin()
    or exists (select 1 from public.profiles p where p.id = user_id and p.formateur_id = auth.uid())
  );

create policy "studio_chat_insert_own" on studio_chat_conversations for insert
  with check (user_id = auth.uid());

create policy "studio_chat_update_own" on studio_chat_conversations for update
  using (user_id = auth.uid());

create policy "studio_chat_delete_own" on studio_chat_conversations for delete
  using (user_id = auth.uid() or public.is_admin());

-- Fichiers joints aux messages : {user_id}/{uuid}-{nom}.
insert into storage.buckets (id, name, public)
values ('studio-chat', 'studio-chat', false)
on conflict (id) do nothing;

create policy "studio_chat_storage_read" on storage.objects for select
  using (
    bucket_id = 'studio-chat' and (
      (storage.foldername(storage.objects.name))[1] = auth.uid()::text
      or public.is_admin()
      or exists (select 1 from public.profiles p where p.id::text = (storage.foldername(storage.objects.name))[1] and p.formateur_id = auth.uid())
    )
  );

create policy "studio_chat_storage_write" on storage.objects for insert
  with check (bucket_id = 'studio-chat' and (storage.foldername(storage.objects.name))[1] = auth.uid()::text);

create policy "studio_chat_storage_delete" on storage.objects for delete
  using (bucket_id = 'studio-chat' and ((storage.foldername(storage.objects.name))[1] = auth.uid()::text or public.is_admin()));

alter table ai_usage_events drop constraint ai_usage_events_source_check;
alter table ai_usage_events add constraint ai_usage_events_source_check
  check (source in ('studio_image','studio_video','studio_music','studio_talkinghead','studio_tts','studio_doublage','studio_chat','battle_ground','reverse_prompt'));
