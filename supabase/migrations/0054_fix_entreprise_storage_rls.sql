-- BUG (trouvé en testant le module Entreprise de bout en bout, 0053) : les
-- policies storage.objects de company-files/company-student-uploads
-- appelaient is_staff()/same_company() sans les qualifier par le schéma.
-- Toutes les autres policies storage.objects du projet qualifient
-- systématiquement en public.is_admin() (voir 0002, 0005, 0006, 0014) — sans
-- ça, la fonction ne se résout pas dans le search_path utilisé par le
-- service Storage, la condition échoue silencieusement, et
-- createSignedUrl()/list() renvoient "Object not found" même quand la ligne
-- company_files correspondante est parfaitement lisible côté PostgREST.

drop policy "company_files_storage_select" on storage.objects;
create policy "company_files_storage_select" on storage.objects for select
  using (
    bucket_id = 'company-files'
    and (
      public.is_staff()
      or exists (
        select 1 from public.company_files f
        where f.storage_path = name and f.is_visible and public.same_company(f.company_id)
      )
    )
  );

drop policy "company_files_storage_insert" on storage.objects;
create policy "company_files_storage_insert" on storage.objects for insert
  with check (bucket_id = 'company-files' and public.is_staff());

drop policy "company_files_storage_update" on storage.objects;
create policy "company_files_storage_update" on storage.objects for update
  using (bucket_id = 'company-files' and public.is_staff());

drop policy "company_files_storage_delete" on storage.objects;
create policy "company_files_storage_delete" on storage.objects for delete
  using (bucket_id = 'company-files' and public.is_staff());

drop policy "company_student_uploads_storage_select" on storage.objects;
create policy "company_student_uploads_storage_select" on storage.objects for select
  using (
    bucket_id = 'company-student-uploads'
    and (public.is_staff() or (storage.foldername(name))[2] = auth.uid()::text)
  );

drop policy "company_student_uploads_storage_insert" on storage.objects;
create policy "company_student_uploads_storage_insert" on storage.objects for insert
  with check (
    bucket_id = 'company-student-uploads'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

drop policy "company_student_uploads_storage_delete" on storage.objects;
create policy "company_student_uploads_storage_delete" on storage.objects for delete
  using (
    bucket_id = 'company-student-uploads'
    and ((storage.foldername(name))[2] = auth.uid()::text or public.is_staff())
  );
