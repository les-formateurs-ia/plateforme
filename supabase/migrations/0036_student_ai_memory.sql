-- ═══════════════════════════════════════════════════════════════════════════
-- Mémoire long terme de l'Agent IA, par élève : une fiche texte qui synthétise
-- ce que l'agent a appris de l'élève au fil de TOUTES ses conversations
-- (toutes formations, texte et vocal confondus) — pas seulement la fenêtre
-- d'historique récente d'une conversation. Régénérée en tâche de fond par
-- agent-chat / gemini-voice-token (cf. _shared/student-memory.ts) une fois
-- assez de nouveaux messages accumulés depuis la dernière synthèse.
-- ═══════════════════════════════════════════════════════════════════════════

create table student_ai_memory (
  user_id             uuid primary key references profiles(id) on delete cascade,
  summary             text not null default '',
  last_summarized_at  timestamptz not null default '1970-01-01T00:00:00Z',
  updated_at          timestamptz not null default now()
);

alter table student_ai_memory enable row level security;

create policy "student_ai_memory_self" on student_ai_memory for all
  using (user_id = auth.uid() or is_staff())
  with check (user_id = auth.uid() or is_staff());
