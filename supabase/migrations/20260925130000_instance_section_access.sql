-- ═══════════════════════════════════════════════════════════════════════════
-- Accès aux modules par élève. Chaque élève a son propre duplicata
-- (formation_instances → instance_sections), donc le module d'un élève est
-- une ligne instance_sections : un simple booléen is_unlocked suffit, sans
-- effet sur les autres élèves.
--
-- Règles :
--   - Seul le premier module d'une formation est ouvert d'office ; les
--     suivants restent fermés. Terminer un module n'ouvre rien : l'accès est
--     ouvert/fermé à la main par l'admin ou le formateur de l'élève
--     (profiles.formateur_id, même règle que 0028/0070).
--   - Fermé = contenu illisible pour l'élève, y compris via lien direct ou
--     edge function (elles lisent toutes avec le JWT de l'élève, donc RLS).
--   - La progression n'est jamais supprimée : elle reste lisible et redevient
--     active à la réouverture ; seules les nouvelles écritures sont bloquées.
-- ═══════════════════════════════════════════════════════════════════════════

alter table instance_sections add column is_unlocked boolean not null default false;

-- Existant : on ouvre le premier module de chaque formation et tout module où
-- l'élève a déjà commencé une leçon, pour ne couper personne en plein parcours.
update instance_sections s set is_unlocked = true
where s.order_index = (select min(s2.order_index) from instance_sections s2 where s2.instance_id = s.instance_id)
   or exists (
     select 1 from instance_lessons l
     join formation_instances fi on fi.id = s.instance_id
     join lesson_progress lp on lp.lesson_id = l.id and lp.user_id = fi.user_id
     where l.section_id = s.id
   );

-- ── Qui peut ouvrir/fermer un module ─────────────────────────────────────
-- Admin, ou formateur attitré de l'élève. fi.user_id = auth.uid() couvre les
-- instances de prévisualisation du staff (is_preview), qui lui appartiennent.
create or replace function public.can_manage_instance_access(p_instance_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select public.is_admin() or (
    public.is_staff() and exists (
      select 1 from public.formation_instances fi
      join public.profiles p on p.id = fi.user_id
      where fi.id = p_instance_id
        and (p.formateur_id = auth.uid() or fi.user_id = auth.uid())
    )
  );
$$;

revoke execute on function public.can_manage_instance_access(uuid) from public, anon;
grant execute on function public.can_manage_instance_access(uuid) to authenticated;

-- instance_sections_staff_write laisse tout le staff écrire sur la table : ce
-- trigger restreint la seule colonne is_unlocked, comme protect_playground_html.
create or replace function public.instance_sections_guard_access()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    -- Premier module créé dans la formation (attribution, prévisualisation ou
    -- ajout manuel dans une formation vide) : ouvert d'office.
    if not exists (select 1 from public.instance_sections where instance_id = new.instance_id) then
      new.is_unlocked := true;
    elsif new.is_unlocked and auth.uid() is not null and not public.can_manage_instance_access(new.instance_id) then
      new.is_unlocked := false;
    end if;
    return new;
  end if;

  if new.is_unlocked is distinct from old.is_unlocked
     and auth.uid() is not null
     and not public.can_manage_instance_access(new.instance_id) then
    raise exception 'Seul l''administrateur ou le formateur de l''élève peut ouvrir ou fermer un module.' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger instance_sections_guard_access
  before insert or update on instance_sections
  for each row execute function public.instance_sections_guard_access();

-- ── Leçon accessible à l'élève connecté ? ───────────────────────────────
-- true seulement si la leçon est dans SA formation ET dans un module ouvert.
-- Le staff est traité à part dans chaque policy (is_staff()).
create or replace function public.can_access_instance_lesson(p_lesson_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.instance_lessons l
    join public.instance_sections s on s.id = l.section_id
    join public.formation_instances fi on fi.id = s.instance_id
    where l.id = p_lesson_id and fi.user_id = auth.uid() and s.is_unlocked
  );
$$;

revoke execute on function public.can_access_instance_lesson(uuid) from public, anon;
grant execute on function public.can_access_instance_lesson(uuid) to authenticated;

-- ── Contenu : illisible dans un module fermé ─────────────────────────────

drop policy "instance_lessons_select" on instance_lessons;
create policy "instance_lessons_select" on instance_lessons for select
  using (
    is_staff() or exists (
      select 1 from instance_sections s
      join formation_instances fi on fi.id = s.instance_id
      where s.id = section_id and fi.user_id = auth.uid() and s.is_unlocked
    )
  );

drop policy "instance_quiz_questions_select" on instance_quiz_questions;
create policy "instance_quiz_questions_select" on instance_quiz_questions for select
  using (is_staff() or public.can_access_instance_lesson(lesson_id));

drop policy "instance_quiz_options_select" on instance_quiz_options;
create policy "instance_quiz_options_select" on instance_quiz_options for select
  using (
    is_staff() or exists (
      select 1 from instance_quiz_questions q
      where q.id = question_id and public.can_access_instance_lesson(q.lesson_id)
    )
  );

-- Contenu généré (mindmap, podcast, vidéo avatar) : c'est du contenu de la
-- leçon, donc fermé aussi en lecture. Il reste en base et revient à la réouverture.
create policy "ai_content_module_access" on ai_generated_content as restrictive for all
  using (public.is_staff() or public.can_access_instance_lesson(lesson_id))
  with check (public.is_staff() or public.can_access_instance_lesson(lesson_id));

-- ── Progression : conservée et lisible, mais plus d'écriture élève ───────
-- (policies restrictives : s'ajoutent en ET aux policies existantes)

create policy "lesson_progress_module_access_insert" on lesson_progress as restrictive for insert
  with check (public.is_staff() or public.can_access_instance_lesson(lesson_id));
create policy "lesson_progress_module_access_update" on lesson_progress as restrictive for update
  using (public.is_staff() or public.can_access_instance_lesson(lesson_id))
  with check (public.is_staff() or public.can_access_instance_lesson(lesson_id));

create policy "quiz_attempts_module_access_insert" on quiz_attempts as restrictive for insert
  with check (public.is_staff() or public.can_access_instance_lesson(lesson_id));

create policy "chat_messages_module_access_insert" on chat_messages as restrictive for insert
  with check (public.is_staff() or public.can_access_instance_lesson(lesson_id));

create policy "mission_submissions_module_access_insert" on mission_submissions as restrictive for insert
  with check (public.is_staff() or public.can_access_instance_lesson(lesson_id));
create policy "mission_submissions_module_access_update" on mission_submissions as restrictive for update
  using (public.is_staff() or public.can_access_instance_lesson(lesson_id))
  with check (public.is_staff() or public.can_access_instance_lesson(lesson_id));

-- ── Fichiers générés (chemins {user_id}/{lesson_id}/… et {user_id}/{lesson_id}.mp4) ──
-- Restrictive sur tout storage.objects : ne concerne que ces deux buckets.
-- Le cast est protégé par le regex pour qu'un nom inattendu ne fasse pas
-- échouer la requête entière (plpgsql : jamais inliné, donc pas de cast
-- évalué d'avance par le planner).
create or replace function public.can_access_instance_lesson_path(p_segment text)
returns boolean
language plpgsql stable security definer set search_path = public
as $$
begin
  if p_segment is null or p_segment !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    return false;
  end if;
  return public.can_access_instance_lesson(p_segment::uuid);
end;
$$;

revoke execute on function public.can_access_instance_lesson_path(text) from public, anon;
grant execute on function public.can_access_instance_lesson_path(text) to authenticated;

create policy "lesson_generated_media_module_access" on storage.objects as restrictive for select
  using (
    storage.objects.bucket_id not in ('lesson-podcasts', 'lesson-avatar-videos')
    or public.is_staff()
    or (storage.objects.bucket_id = 'lesson-podcasts'
        and public.can_access_instance_lesson_path((storage.foldername(storage.objects.name))[2]))
    or (storage.objects.bucket_id = 'lesson-avatar-videos'
        and public.can_access_instance_lesson_path(split_part(storage.filename(storage.objects.name), '.', 1)))
  );

-- ── Plan de la formation pour l'élève ────────────────────────────────────
-- instance_lessons étant illisible dans un module fermé, l'élève ne verrait
-- plus ni les titres ni le nombre de leçons à venir (et sa progression en %
-- serait faussée). Cette fonction ne renvoie que des métadonnées, jamais le
-- contenu (vidéo, texte de référence, HTML, quiz).
create or replace function public.get_instance_lesson_outline(p_instance_id uuid)
returns table (id uuid, section_id uuid, slug text, title text, duration_minutes integer, order_index integer)
language sql stable security definer set search_path = public
as $$
  select l.id, l.section_id, l.slug, l.title, l.duration_minutes, l.order_index
  from public.instance_lessons l
  join public.instance_sections s on s.id = l.section_id
  join public.formation_instances fi on fi.id = s.instance_id
  where fi.id = p_instance_id and (fi.user_id = auth.uid() or public.is_staff())
  order by s.order_index, l.order_index;
$$;

revoke execute on function public.get_instance_lesson_outline(uuid) from public, anon;
grant execute on function public.get_instance_lesson_outline(uuid) to authenticated;

-- Pour un lien direct vers une leçon illisible : distingue « module fermé »
-- de « leçon inexistante » sans rien révéler du contenu.
create or replace function public.is_instance_lesson_locked(p_lesson_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.instance_lessons l
    join public.instance_sections s on s.id = l.section_id
    join public.formation_instances fi on fi.id = s.instance_id
    where l.id = p_lesson_id and fi.user_id = auth.uid() and not s.is_unlocked
  );
$$;

revoke execute on function public.is_instance_lesson_locked(uuid) from public, anon;
grant execute on function public.is_instance_lesson_locked(uuid) to authenticated;
