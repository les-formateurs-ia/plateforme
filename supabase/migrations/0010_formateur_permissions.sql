-- Droits du rôle "formateur" : mêmes droits que l'admin sur le contenu
-- pédagogique (cours, leçons, quiz, badges, rendez-vous), sauf sur deux
-- points explicitement réservés à l'admin :
--   1. Inscrire/désinscrire des élèves d'un cours (enrollments_admin_write,
--      déjà admin-only, inchangé).
--   2. Modifier le HTML "Playground" d'une leçon (protégé ci-dessous par un
--      trigger dédié, car lessons_admin_write doit rester ouvert au
--      formateur pour le reste des champs de la leçon).
create or replace function is_staff() returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'formateur')
  );
$$ language sql security definer stable;

-- Le formateur doit pouvoir prévisualiser tout le catalogue sans être
-- "inscrit" comme un élève (même logique que le court-circuit is_admin()
-- déjà en place) et écrire sur le contenu pédagogique.
drop policy "formations_read_published" on formations;
create policy "formations_read_published" on formations for select
  using (status = 'published' or is_staff());

drop policy "formations_admin_write" on formations;
create policy "formations_admin_write" on formations for all
  using (is_staff()) with check (is_staff());

drop policy "sections_read" on sections;
create policy "sections_read" on sections for select
  using (exists (select 1 from formations f where f.id = formation_id and (f.status = 'published' or is_staff())));

drop policy "sections_admin_write" on sections;
create policy "sections_admin_write" on sections for all
  using (is_staff()) with check (is_staff());

drop policy "lessons_read_enrolled" on lessons;
create policy "lessons_read_enrolled" on lessons for select
  using (
    is_staff() or exists (
      select 1 from sections s
      join enrollments e on e.formation_id = s.formation_id
      where s.id = section_id and e.user_id = auth.uid()
    )
  );

drop policy "lessons_admin_write" on lessons;
create policy "lessons_admin_write" on lessons for all
  using (is_staff()) with check (is_staff());

-- Le formateur peut éditer le reste d'une leçon (via lessons_admin_write
-- ci-dessus) mais pas le HTML "Playground" — protégé ici indépendamment de
-- la policy RLS pour ne pas devoir sortir la colonne dans une table à part.
create or replace function protect_playground_html() returns trigger as $$
begin
  if new.custom_html_content is distinct from old.custom_html_content and not is_admin() then
    raise exception 'Seul un administrateur peut modifier le Playground (HTML) d''une leçon.';
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists lessons_protect_playground_html on lessons;
create trigger lessons_protect_playground_html
  before update on lessons
  for each row execute function protect_playground_html();

drop policy "quiz_questions_read_enrolled" on quiz_questions;
create policy "quiz_questions_read_enrolled" on quiz_questions for select
  using (
    is_staff() or exists (
      select 1 from lessons l
      join sections s on s.id = l.section_id
      join enrollments e on e.formation_id = s.formation_id
      where l.id = lesson_id and e.user_id = auth.uid()
    )
  );

drop policy "quiz_questions_admin_write" on quiz_questions;
create policy "quiz_questions_admin_write" on quiz_questions for all
  using (is_staff()) with check (is_staff());

drop policy "quiz_options_read_enrolled" on quiz_options;
create policy "quiz_options_read_enrolled" on quiz_options for select
  using (
    is_staff() or exists (
      select 1 from quiz_questions q
      join lessons l on l.id = q.lesson_id
      join sections s on s.id = l.section_id
      join enrollments e on e.formation_id = s.formation_id
      where q.id = question_id and e.user_id = auth.uid()
    )
  );

drop policy "quiz_options_admin_write" on quiz_options;
create policy "quiz_options_admin_write" on quiz_options for all
  using (is_staff()) with check (is_staff());

-- Visibilité support (progression/chat/contenu IA d'un élève) étendue au
-- formateur, comme le reste de la matrice "formateur = admin".
drop policy "ai_content_self" on ai_generated_content;
create policy "ai_content_self" on ai_generated_content for all
  using (user_id = auth.uid() or is_staff())
  with check (user_id = auth.uid() or is_staff());

drop policy "chat_messages_self" on chat_messages;
create policy "chat_messages_self" on chat_messages for all
  using (user_id = auth.uid() or is_staff())
  with check (user_id = auth.uid() or is_staff());

drop policy "lesson_progress_self" on lesson_progress;
create policy "lesson_progress_self" on lesson_progress for all
  using (user_id = auth.uid() or is_staff())
  with check (user_id = auth.uid() or is_staff());

drop policy "quiz_attempts_self" on quiz_attempts;
create policy "quiz_attempts_self" on quiz_attempts for all
  using (user_id = auth.uid() or is_staff())
  with check (user_id = auth.uid() or is_staff());

drop policy "badges_admin_write" on badges;
create policy "badges_admin_write" on badges for all using (is_staff()) with check (is_staff());

drop policy "user_badges_self_read" on user_badges;
create policy "user_badges_self_read" on user_badges for select
  using (user_id = auth.uid() or is_staff());

drop policy "user_badges_admin_write" on user_badges;
create policy "user_badges_admin_write" on user_badges for all
  using (is_staff()) with check (is_staff());

drop policy "appointments_self" on appointments;
create policy "appointments_self" on appointments for select
  using (user_id = auth.uid() or is_staff());

drop policy "appointments_self_insert" on appointments;
create policy "appointments_self_insert" on appointments for insert
  with check (user_id = auth.uid() or is_staff());

drop policy "appointments_admin_update" on appointments;
create policy "appointments_admin_update" on appointments for update
  using (is_staff());

-- profiles_self_select / enrollments_* restent inchangées (is_admin()) :
-- voir tous les profils et gérer les inscriptions élèves reste strictement
-- réservé à l'admin.
