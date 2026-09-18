-- Module "Faites parler vos images" (Le Studio) : génération de vidéo
-- lip-sync/avatar parlant à partir d'une photo + d'un texte, via l'API
-- Runware. Même architecture 3-niveaux (élève/formateur/admin) que
-- 0062_studio_image_generations.sql / 0063_studio_video_generations.sql —
-- réutilise studio_image_status (pending/ready/failed, générique).
--
-- Pipeline en 2 étapes côté edge function (generate-studio-talkinghead) :
-- 1) le script est converti en voix (MiniMax Speech 2.8, audioInference,
--    résolu de façon synchrone dans la même invocation) ;
-- 2) l'audio obtenu + la photo source sont soumis au modèle avatar choisi
--    (videoInference, asynchrone, suivi via external_request_id comme pour
--    studio_video_generations). Contrairement à la musique (deux actifs
--    Runware indépendants par ligne), l'audio TTS n'est qu'une étape
--    intermédiaire non persistée : une seule colonne de suivi suffit.
create table studio_talkinghead_generations (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references profiles(id) on delete cascade,
  status                studio_image_status not null default 'pending',
  model                 text not null, -- slug interne (cf. _shared/studio-talkinghead-models.ts)
  script_text           text not null, -- texte que l'avatar doit prononcer
  voice                 text not null, -- id de voix MiniMax Speech 2.8
  language              text not null, -- code langue TTS (ex. "fr-FR")
  source_image_path     text not null, -- chemin dans le bucket studio-talkinghead (photo obligatoire)
  video_path            text, -- chemin dans le bucket studio-talkinghead, une fois la génération prête
  external_request_id   text,
  error_message         text,
  created_at            timestamptz not null default now(),
  completed_at          timestamptz
);
create index studio_talkinghead_generations_user_idx on studio_talkinghead_generations (user_id, created_at desc);

alter table studio_talkinghead_generations enable row level security;

create policy "studio_talkinghead_select" on studio_talkinghead_generations for select
  using (
    user_id = auth.uid()
    or is_admin()
    or exists (select 1 from profiles p where p.id = user_id and p.formateur_id = auth.uid())
  );

create policy "studio_talkinghead_insert_own" on studio_talkinghead_generations for insert
  with check (user_id = auth.uid());

create policy "studio_talkinghead_update_own_or_admin" on studio_talkinghead_generations for update
  using (user_id = auth.uid() or is_admin());

-- Bucket privé, même schéma de chemins que studio-videos :
-- {user_id}/sources/{fichier} (photo), {user_id}/results/{generation_id}.mp4
insert into storage.buckets (id, name, public)
values ('studio-talkinghead', 'studio-talkinghead', false)
on conflict (id) do nothing;

create policy "studio_talkinghead_storage_read" on storage.objects for select
  using (
    bucket_id = 'studio-talkinghead' and (
      (storage.foldername(name))[1] = auth.uid()::text
      or is_admin()
      or exists (select 1 from profiles p where p.id::text = (storage.foldername(name))[1] and p.formateur_id = auth.uid())
    )
  );

create policy "studio_talkinghead_storage_write" on storage.objects for insert
  with check (bucket_id = 'studio-talkinghead' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "studio_talkinghead_storage_update" on storage.objects for update
  using (bucket_id = 'studio-talkinghead' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "studio_talkinghead_storage_delete" on storage.objects for delete
  using (bucket_id = 'studio-talkinghead' and ((storage.foldername(name))[1] = auth.uid()::text or is_admin()));

-- Le suivi de budget IA (0071_ai_usage_budget.sql) doit accepter la nouvelle
-- source "studio_talkinghead" (coût TTS + coût vidéo avatar).
alter table ai_usage_events drop constraint ai_usage_events_source_check;
alter table ai_usage_events add constraint ai_usage_events_source_check
  check (source in ('studio_image','studio_video','studio_music','studio_talkinghead','battle_ground','reverse_prompt'));
