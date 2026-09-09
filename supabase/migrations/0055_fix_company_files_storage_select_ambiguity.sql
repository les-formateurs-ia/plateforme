-- BUG (found via end-to-end smoke test, still failing after 0054's schema-
-- qualification fix): inside the EXISTS subquery of
-- company_files_storage_select, the bare `name` column reference was
-- captured by company_files.name (the file's *display* name column) instead
-- of the intended storage.objects.name (the object's storage path) — Postgres
-- resolves an unqualified column to the innermost matching scope, and
-- company_files happens to have its own `name` column. The policy silently
-- became `f.storage_path = f.name`, which is essentially never true, so
-- every non-staff signed-URL/list request came back "Object not found" even
-- for a fully visible file. Fix: qualify the outer column explicitly.

drop policy "company_files_storage_select" on storage.objects;
create policy "company_files_storage_select" on storage.objects for select
  using (
    bucket_id = 'company-files'
    and (
      public.is_staff()
      or exists (
        select 1 from public.company_files f
        where f.storage_path = storage.objects.name and f.is_visible and public.same_company(f.company_id)
      )
    )
  );
