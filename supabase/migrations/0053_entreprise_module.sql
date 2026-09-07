-- ═══════════════════════════════════════════════════════════════════════════
-- Module "Entreprise" (V2 B2B) — second contour applicatif à côté du CPF.
--
-- Une entreprise (companies) a une liste de collaborateurs
-- (company_employees, gérée par l'admin) qui, une fois invités, deviennent
-- des profiles standard (role='student') rattachés via profiles.company_id.
-- Le formateur y crée du contenu scopé par entreprise (test de
-- positionnement, fichiers, exercices HTML, test de satisfaction,
-- catégories de fichiers), chaque item contrôlé par un booléen
-- is_visible ("Afficher/Masquer"). Miroir volontaire du modèle CPF
-- (formations/quiz_questions/quiz_options, html_exercises) mais scopé par
-- entreprise plutôt que par inscription/assignation individuelle : tout
-- le staff (is_staff()) a accès à toutes les entreprises, seul l'admin
-- crée une entreprise et gère la liste de collaborateurs.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Entreprises & collaborateurs ─────────────────────────────────────────

create table companies (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  created_by    uuid references profiles(id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create trigger companies_set_updated_at before update on companies
  for each row execute function set_updated_at();

-- Un profil avec company_id renseigné = un collaborateur entreprise
-- (toujours role='student'). Nullable : ne touche pas aux comptes CPF.
alter table profiles add column company_id uuid references companies(id) on delete set null;

-- Liste de collaborateurs saisie par l'admin (Nom/Prénom/Email). profile_id
-- se remplit une fois l'invitation acceptée (voir Edge Function
-- send-company-invite) — avant ça, l'employé n'a pas encore de compte auth.
create table company_employees (
  id                  uuid primary key default gen_random_uuid(),
  company_id          uuid not null references companies(id) on delete cascade,
  first_name          text not null,
  last_name           text not null,
  email               text not null,
  profile_id          uuid references profiles(id) on delete set null,
  invite_sent_at      timestamptz,
  invite_accepted_at  timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (company_id, email)
);
create trigger company_employees_set_updated_at before update on company_employees
  for each row execute function set_updated_at();
create index company_employees_company_idx on company_employees(company_id);

-- ── Test de positionnement (QCM — miroir quiz_questions/quiz_options) ────

create table company_positioning_tests (
  id            uuid primary key default gen_random_uuid(),
  company_id    uuid not null references companies(id) on delete cascade,
  title         text not null,
  is_visible    boolean not null default false,
  created_by    uuid references profiles(id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create trigger company_positioning_tests_set_updated_at before update on company_positioning_tests
  for each row execute function set_updated_at();

create table company_positioning_questions (
  id            uuid primary key default gen_random_uuid(),
  test_id       uuid not null references company_positioning_tests(id) on delete cascade,
  question      text not null,
  explanation   text,
  order_index   integer not null
);

create table company_positioning_options (
  id            uuid primary key default gen_random_uuid(),
  question_id   uuid not null references company_positioning_questions(id) on delete cascade,
  label         text not null,
  is_correct    boolean not null default false,
  order_index   integer not null
);

-- Un seul essai enregistré par élève et par test (test diagnostique, pas
-- un quiz noté avec remédiation comme côté CPF).
create table company_positioning_attempts (
  id            uuid primary key default gen_random_uuid(),
  test_id       uuid not null references company_positioning_tests(id) on delete cascade,
  company_id    uuid not null references companies(id) on delete cascade,
  student_id    uuid not null references profiles(id) on delete cascade,
  score         numeric not null,
  answers       jsonb not null, -- [{question_id, selected_option_id, correct}]
  created_at    timestamptz not null default now(),
  unique (test_id, student_id)
);

-- ── Espace fichiers formateur → élèves ────────────────────────────────────

create table company_files (
  id            uuid primary key default gen_random_uuid(),
  company_id    uuid not null references companies(id) on delete cascade,
  name          text not null,
  description   text,
  storage_path  text not null,
  mime_type     text,
  file_size     bigint,
  is_visible    boolean not null default false,
  uploaded_by   uuid references profiles(id),
  created_at    timestamptz not null default now()
);
create index company_files_company_idx on company_files(company_id);

-- ── Exercices HTML entreprise (miroir simplifié de html_exercises) ───────

create table company_html_exercises (
  id            uuid primary key default gen_random_uuid(),
  company_id    uuid not null references companies(id) on delete cascade,
  name          text not null,
  description   text,
  html_content  text not null default '',
  is_visible    boolean not null default false,
  created_by    uuid references profiles(id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create trigger company_html_exercises_set_updated_at before update on company_html_exercises
  for each row execute function set_updated_at();

-- ── Test de satisfaction (QCM / note 1-5 / texte libre) ──────────────────

create table company_satisfaction_tests (
  id            uuid primary key default gen_random_uuid(),
  company_id    uuid not null references companies(id) on delete cascade,
  title         text not null,
  is_visible    boolean not null default false,
  created_by    uuid references profiles(id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create trigger company_satisfaction_tests_set_updated_at before update on company_satisfaction_tests
  for each row execute function set_updated_at();

create table company_satisfaction_questions (
  id            uuid primary key default gen_random_uuid(),
  test_id       uuid not null references company_satisfaction_tests(id) on delete cascade,
  question      text not null,
  question_type text not null check (question_type in ('qcm', 'rating', 'text')),
  order_index   integer not null
);

-- Uniquement pour les questions question_type = 'qcm'.
create table company_satisfaction_options (
  id            uuid primary key default gen_random_uuid(),
  question_id   uuid not null references company_satisfaction_questions(id) on delete cascade,
  label         text not null,
  order_index   integer not null
);

create table company_satisfaction_responses (
  id            uuid primary key default gen_random_uuid(),
  test_id       uuid not null references company_satisfaction_tests(id) on delete cascade,
  company_id    uuid not null references companies(id) on delete cascade,
  student_id    uuid not null references profiles(id) on delete cascade,
  answers       jsonb not null, -- [{question_id, type, value}]
  created_at    timestamptz not null default now(),
  unique (test_id, student_id)
);

-- ── Catégories de fichiers élève + uploads élève ──────────────────────────

create table company_file_categories (
  id            uuid primary key default gen_random_uuid(),
  company_id    uuid not null references companies(id) on delete cascade,
  name          text not null,
  created_at    timestamptz not null default now(),
  unique (company_id, name)
);

create table company_student_uploads (
  id            uuid primary key default gen_random_uuid(),
  company_id    uuid not null references companies(id) on delete cascade,
  student_id    uuid not null references profiles(id) on delete cascade,
  category_id   uuid references company_file_categories(id) on delete set null,
  storage_path  text not null,
  file_name     text not null,
  mime_type     text,
  file_size     bigint,
  created_at    timestamptz not null default now()
);
create index company_student_uploads_company_idx on company_student_uploads(company_id);

-- ── RLS helper : l'utilisateur courant appartient-il à cette entreprise ? ─
-- Miroir de is_admin()/is_staff() (0001/0010) : security definer pour lire
-- profiles sans re-déclencher sa propre RLS.

create function same_company(target uuid) returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and company_id = target
  );
$$ language sql security definer stable;

-- ── RLS ────────────────────────────────────────────────────────────────

alter table companies enable row level security;
alter table company_employees enable row level security;
alter table company_positioning_tests enable row level security;
alter table company_positioning_questions enable row level security;
alter table company_positioning_options enable row level security;
alter table company_positioning_attempts enable row level security;
alter table company_files enable row level security;
alter table company_html_exercises enable row level security;
alter table company_satisfaction_tests enable row level security;
alter table company_satisfaction_questions enable row level security;
alter table company_satisfaction_options enable row level security;
alter table company_satisfaction_responses enable row level security;
alter table company_file_categories enable row level security;
alter table company_student_uploads enable row level security;

-- companies : le staff (admin+formateur) voit tout ; seul l'admin crée/modifie/supprime.
create policy "companies_staff_select" on companies for select using (is_staff());
create policy "companies_admin_insert" on companies for insert with check (is_admin());
create policy "companies_admin_update" on companies for update using (is_admin()) with check (is_admin());
create policy "companies_admin_delete" on companies for delete using (is_admin());

-- collaborateurs : staff lit tout, seul l'admin gère la liste. L'envoi
-- d'accès (formateur inclus) passe par l'Edge Function service-role, pas
-- par une écriture directe sur cette table.
create policy "company_employees_staff_select" on company_employees for select using (is_staff());
create policy "company_employees_admin_insert" on company_employees for insert with check (is_admin());
create policy "company_employees_admin_update" on company_employees for update using (is_admin()) with check (is_admin());
create policy "company_employees_admin_delete" on company_employees for delete using (is_admin());

-- test de positionnement
create policy "company_positioning_tests_select" on company_positioning_tests for select
  using (is_staff() or (is_visible and same_company(company_id)));
create policy "company_positioning_tests_staff_insert" on company_positioning_tests for insert with check (is_staff());
create policy "company_positioning_tests_staff_update" on company_positioning_tests for update using (is_staff()) with check (is_staff());
create policy "company_positioning_tests_staff_delete" on company_positioning_tests for delete using (is_staff());

create policy "company_positioning_questions_select" on company_positioning_questions for select
  using (
    is_staff() or exists (
      select 1 from company_positioning_tests t
      where t.id = test_id and t.is_visible and same_company(t.company_id)
    )
  );
create policy "company_positioning_questions_staff_write" on company_positioning_questions for all
  using (is_staff()) with check (is_staff());

create policy "company_positioning_options_select" on company_positioning_options for select
  using (
    is_staff() or exists (
      select 1 from company_positioning_questions q
      join company_positioning_tests t on t.id = q.test_id
      where q.id = question_id and t.is_visible and same_company(t.company_id)
    )
  );
create policy "company_positioning_options_staff_write" on company_positioning_options for all
  using (is_staff()) with check (is_staff());

create policy "company_positioning_attempts_select" on company_positioning_attempts for select
  using (is_staff() or student_id = auth.uid());
create policy "company_positioning_attempts_self_insert" on company_positioning_attempts for insert
  with check (student_id = auth.uid() and same_company(company_id));
create policy "company_positioning_attempts_staff_delete" on company_positioning_attempts for delete using (is_staff());

-- fichiers formateur
create policy "company_files_select" on company_files for select
  using (is_staff() or (is_visible and same_company(company_id)));
create policy "company_files_staff_insert" on company_files for insert with check (is_staff());
create policy "company_files_staff_update" on company_files for update using (is_staff()) with check (is_staff());
create policy "company_files_staff_delete" on company_files for delete using (is_staff());

-- exercices HTML
create policy "company_html_exercises_select" on company_html_exercises for select
  using (is_staff() or (is_visible and same_company(company_id)));
create policy "company_html_exercises_staff_insert" on company_html_exercises for insert with check (is_staff());
create policy "company_html_exercises_staff_update" on company_html_exercises for update using (is_staff()) with check (is_staff());
create policy "company_html_exercises_staff_delete" on company_html_exercises for delete using (is_staff());

-- test de satisfaction
create policy "company_satisfaction_tests_select" on company_satisfaction_tests for select
  using (is_staff() or (is_visible and same_company(company_id)));
create policy "company_satisfaction_tests_staff_insert" on company_satisfaction_tests for insert with check (is_staff());
create policy "company_satisfaction_tests_staff_update" on company_satisfaction_tests for update using (is_staff()) with check (is_staff());
create policy "company_satisfaction_tests_staff_delete" on company_satisfaction_tests for delete using (is_staff());

create policy "company_satisfaction_questions_select" on company_satisfaction_questions for select
  using (
    is_staff() or exists (
      select 1 from company_satisfaction_tests t
      where t.id = test_id and t.is_visible and same_company(t.company_id)
    )
  );
create policy "company_satisfaction_questions_staff_write" on company_satisfaction_questions for all
  using (is_staff()) with check (is_staff());

create policy "company_satisfaction_options_select" on company_satisfaction_options for select
  using (
    is_staff() or exists (
      select 1 from company_satisfaction_questions q
      join company_satisfaction_tests t on t.id = q.test_id
      where q.id = question_id and t.is_visible and same_company(t.company_id)
    )
  );
create policy "company_satisfaction_options_staff_write" on company_satisfaction_options for all
  using (is_staff()) with check (is_staff());

create policy "company_satisfaction_responses_select" on company_satisfaction_responses for select
  using (is_staff() or student_id = auth.uid());
create policy "company_satisfaction_responses_self_insert" on company_satisfaction_responses for insert
  with check (student_id = auth.uid() and same_company(company_id));
create policy "company_satisfaction_responses_staff_delete" on company_satisfaction_responses for delete using (is_staff());

-- catégories de fichiers : staff écrit, staff + élèves de l'entreprise lisent
create policy "company_file_categories_select" on company_file_categories for select
  using (is_staff() or same_company(company_id));
create policy "company_file_categories_staff_insert" on company_file_categories for insert with check (is_staff());
create policy "company_file_categories_staff_update" on company_file_categories for update using (is_staff()) with check (is_staff());
create policy "company_file_categories_staff_delete" on company_file_categories for delete using (is_staff());

-- uploads élève
create policy "company_student_uploads_select" on company_student_uploads for select
  using (is_staff() or student_id = auth.uid());
create policy "company_student_uploads_self_insert" on company_student_uploads for insert
  with check (student_id = auth.uid() and same_company(company_id));
create policy "company_student_uploads_self_delete" on company_student_uploads for delete
  using (student_id = auth.uid() or is_staff());

-- ── Storage ────────────────────────────────────────────────────────────

insert into storage.buckets (id, name, public)
values ('company-files', 'company-files', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('company-student-uploads', 'company-student-uploads', false)
on conflict (id) do nothing;

-- company-files : chemin {company_id}/{uuid}-{filename}. Lecture staff, ou
-- élève de l'entreprise si la ligne company_files correspondante est
-- visible ; écriture réservée au staff.
create policy "company_files_storage_select" on storage.objects for select
  using (
    bucket_id = 'company-files'
    and (
      is_staff()
      or exists (
        select 1 from company_files f
        where f.storage_path = name and f.is_visible and same_company(f.company_id)
      )
    )
  );
create policy "company_files_storage_insert" on storage.objects for insert
  with check (bucket_id = 'company-files' and is_staff());
create policy "company_files_storage_update" on storage.objects for update
  using (bucket_id = 'company-files' and is_staff());
create policy "company_files_storage_delete" on storage.objects for delete
  using (bucket_id = 'company-files' and is_staff());

-- company-student-uploads : chemin {company_id}/{student_id}/{uuid}-{filename}.
create policy "company_student_uploads_storage_select" on storage.objects for select
  using (
    bucket_id = 'company-student-uploads'
    and (is_staff() or (storage.foldername(name))[2] = auth.uid()::text)
  );
create policy "company_student_uploads_storage_insert" on storage.objects for insert
  with check (
    bucket_id = 'company-student-uploads'
    and (storage.foldername(name))[2] = auth.uid()::text
  );
create policy "company_student_uploads_storage_delete" on storage.objects for delete
  using (
    bucket_id = 'company-student-uploads'
    and ((storage.foldername(name))[2] = auth.uid()::text or is_staff())
  );
