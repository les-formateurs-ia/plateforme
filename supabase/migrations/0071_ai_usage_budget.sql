-- Suivi du budget IA Runware par élève (plafond 50 $, cf. ticket "Suivi du
-- budget et analytics de la consommation IA"). Ne concerne QUE les appels
-- Runware (Le Studio images/vidéos, Battle Ground GPT/Claude routés via
-- Runware, Rétro-ingénierie) — les appels Gemini directs (hors Runware)
-- n'incrémentent jamais spent_usd.
alter table profiles add column spent_usd numeric(12,6) not null default 0;

create table ai_usage_events (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references profiles(id) on delete cascade,
  media_type   text not null check (media_type in ('image','video','audio','text')),
  provider     text not null,
  model        text not null,
  cost_usd     numeric(12,6) not null check (cost_usd >= 0),
  source       text not null check (source in ('studio_image','studio_video','battle_ground','reverse_prompt')),
  created_at   timestamptz not null default now()
);
create index ai_usage_events_user_idx on ai_usage_events (user_id, created_at desc);

alter table ai_usage_events enable row level security;

-- Même motif trois-niveaux que studio_image_generations (0062) : l'élève voit
-- les siennes, le formateur voit celles de SES élèves, l'admin voit tout.
create policy "ai_usage_events_select" on ai_usage_events for select
  using (
    user_id = auth.uid()
    or is_admin()
    or exists (select 1 from profiles p where p.id = user_id and p.formateur_id = auth.uid())
  );

-- Log immuable : insert own uniquement, jamais d'update/delete côté client.
create policy "ai_usage_events_insert_own" on ai_usage_events for insert
  with check (user_id = auth.uid());

-- Incrémente profiles.spent_usd à chaque ligne insérée — atomique (verrou de
-- ligne Postgres standard) sans passer par un RPC séparé côté edge function.
-- Même idiome que agent_conversations_touch (0031_agent_conversations.sql).
create function ai_usage_events_apply_cost() returns trigger as $$
begin
  update profiles set spent_usd = spent_usd + new.cost_usd where id = new.user_id;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger ai_usage_events_apply_cost_trigger
  after insert on ai_usage_events
  for each row execute function ai_usage_events_apply_cost();
