-- ═══════════════════════════════════════════════════════════════════════════
-- "Exercez-vous 2" — 3 nouveaux ateliers pratiques :
--  1. Battle Ground (comparaison de plusieurs modèles IA sur un même prompt)
--  2. Rétro-ingénierie (reproduire une image cible générée par le système)
--  3. Détection Image IA (quiz réel/IA, galerie administrable par le staff)
-- Remplace l'ancien duplicat "Pratique IA" supprimé par la migration
-- 0066_drop_practice2_old.sql. is_staff()/is_admin() déjà définis
-- (0001_init_schema.sql / 0010_formateur_permissions.sql).
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. Battle Ground ─────────────────────────────────────────────────────

create table battle_ground_attempts (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references profiles(id) on delete cascade,
  prompt_text  text not null,
  responses    jsonb not null, -- [{ provider, model, label, text, error, latency_ms }]
  created_at   timestamptz not null default now()
);
create index battle_ground_attempts_lookup on battle_ground_attempts (user_id, created_at);

alter table battle_ground_attempts enable row level security;

create policy "battle_ground_attempts_self" on battle_ground_attempts for all
  using (user_id = auth.uid() or is_staff())
  with check (user_id = auth.uid() or is_staff());

-- ── 2. Rétro-ingénierie ──────────────────────────────────────────────────

create table reverse_prompt_sessions (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references profiles(id) on delete cascade,
  target_prompt      text not null, -- jamais exposé au client, seulement à l'image générée
  target_image_path  text,
  status             text not null default 'generating' check (status in ('generating', 'ready', 'failed')),
  error              text,
  created_at         timestamptz not null default now()
);
create index reverse_prompt_sessions_lookup on reverse_prompt_sessions (user_id, created_at);

create table reverse_prompt_attempts (
  id                     uuid primary key default gen_random_uuid(),
  session_id             uuid not null references reverse_prompt_sessions(id) on delete cascade,
  user_id                uuid not null references profiles(id) on delete cascade,
  attempt_number         integer not null,
  prompt_text            text not null,
  generated_image_path   text,
  status                 text not null default 'generating' check (status in ('generating', 'ready', 'failed')),
  error                  text,
  created_at             timestamptz not null default now(),
  unique (session_id, attempt_number)
);
create index reverse_prompt_attempts_lookup on reverse_prompt_attempts (user_id, session_id, attempt_number);

alter table reverse_prompt_sessions enable row level security;
alter table reverse_prompt_attempts enable row level security;

create policy "reverse_prompt_sessions_self" on reverse_prompt_sessions for all
  using (user_id = auth.uid() or is_staff())
  with check (user_id = auth.uid() or is_staff());

create policy "reverse_prompt_attempts_self" on reverse_prompt_attempts for all
  using (user_id = auth.uid() or is_staff())
  with check (user_id = auth.uid() or is_staff());

-- Storage : image cible + images des tentatives, privé, scope par propriétaire.
-- Chemin : {user_id}/{session_id}/target.png et {user_id}/{session_id}/attempt-{n}.png

insert into storage.buckets (id, name, public)
values ('reverse-prompt-images', 'reverse-prompt-images', false)
on conflict (id) do nothing;

create policy "reverse_prompt_images_owner_read" on storage.objects for select
  using (bucket_id = 'reverse-prompt-images' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_staff()));

create policy "reverse_prompt_images_owner_write" on storage.objects for insert
  with check (bucket_id = 'reverse-prompt-images' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "reverse_prompt_images_owner_update" on storage.objects for update
  using (bucket_id = 'reverse-prompt-images' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "reverse_prompt_images_owner_delete" on storage.objects for delete
  using (bucket_id = 'reverse-prompt-images' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_staff()));

-- ── 3. Détection Image IA ────────────────────────────────────────────────

create table ai_detection_images (
  id            uuid primary key default gen_random_uuid(),
  image_path    text not null,
  is_ai         boolean not null,
  explanation   text not null,
  created_by    uuid references profiles(id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create trigger ai_detection_images_set_updated_at before update on ai_detection_images
  for each row execute function set_updated_at();

create table ai_detection_attempts (
  id              uuid primary key default gen_random_uuid(),
  student_id      uuid not null references profiles(id) on delete cascade,
  image_id        uuid not null references ai_detection_images(id) on delete cascade,
  guessed_is_ai   boolean not null,
  correct         boolean not null,
  created_at      timestamptz not null default now()
);
create index ai_detection_attempts_lookup on ai_detection_attempts (student_id, image_id);

alter table ai_detection_images enable row level security;
alter table ai_detection_attempts enable row level security;

create policy "ai_detection_images_read" on ai_detection_images for select using (true);
create policy "ai_detection_images_staff_insert" on ai_detection_images for insert with check (is_staff());
create policy "ai_detection_images_staff_update" on ai_detection_images for update using (is_staff()) with check (is_staff());
create policy "ai_detection_images_staff_delete" on ai_detection_images for delete using (is_staff());

create policy "ai_detection_attempts_self" on ai_detection_attempts for all
  using (student_id = auth.uid() or is_staff())
  with check (student_id = auth.uid() or is_staff());

-- Storage : galerie publique en lecture (comme lesson-videos), écriture staff-only.
-- Chemin : {image_id}.<ext> (attribué à l'insertion de la ligne côté client)

insert into storage.buckets (id, name, public)
values ('ai-detection-images', 'ai-detection-images', true)
on conflict (id) do nothing;

create policy "ai_detection_images_bucket_staff_insert" on storage.objects for insert
  with check (bucket_id = 'ai-detection-images' and public.is_staff());

create policy "ai_detection_images_bucket_staff_update" on storage.objects for update
  using (bucket_id = 'ai-detection-images' and public.is_staff());

create policy "ai_detection_images_bucket_staff_delete" on storage.objects for delete
  using (bucket_id = 'ai-detection-images' and public.is_staff());
