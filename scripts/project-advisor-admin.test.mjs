// Real RLS checks; all synthetic data and provisional grants are rolled back.
import { readFile } from 'node:fs/promises';
process.loadEnvFile();
const ref = new URL(process.env.VITE_SUPABASE_URL).hostname.split('.')[0];
async function query(sql) {
  const response = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: 'POST', headers: { Authorization: `Bearer ${process.env.SUPABASE_ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: sql }),
  });
  if (!response.ok) throw new Error(await response.text());
  return response.json();
}
const [state] = await query("select exists(select 1 from pg_policies where schemaname='public' and tablename='project_advisor_leads' and policyname='project_advisor_leads_admin_select') as applied");
const migration = await readFile(new URL('../supabase/migrations/20260921141737_project_advisor_admin_read.sql', import.meta.url), 'utf8');
const schema = state.applied ? '' : migration.replace(/^begin;\s*$/m, '').replace(/^commit;\s*$/m, '');
const email = `${crypto.randomUUID()}@example.invalid`;
let checks = '';
for (const role of ['admin', 'student', 'formateur']) {
  checks += `
reset role;
do $$ begin assert exists(select 1 from public.profiles where role='${role}'), 'Missing fixture role'; end $$;
select set_config('request.jwt.claims', json_build_object('sub',(select id from public.profiles where role='${role}' limit 1),'role','authenticated')::text,true);
set local role authenticated;
do $$ begin
  assert (select count(id) from public.project_advisor_leads where email='${email}') = ${role === 'admin' ? 1 : 0}, '${role} visibility';
  assert not has_column_privilege('authenticated','public.project_advisor_leads','access_token_hash','SELECT');
  assert not has_column_privilege('authenticated','public.project_advisor_leads','request_id','SELECT');
  assert not has_table_privilege('authenticated','public.project_advisor_leads','UPDATE');
end $$;
`;
}
await query(`begin;
${schema}
insert into public.project_advisor_leads(request_id,access_token_hash,first_name,last_name,email,profile,sector,need)
values(gen_random_uuid(),repeat('a',64),'Test','Admin','${email}','particulier','Marketing','Créer des comptes-rendus');
${checks}
reset role;
do $$ begin assert not has_any_column_privilege('anon','public.project_advisor_leads','SELECT'); end $$;
rollback;`);
console.log('PASS: admin can read; student, trainer and anon cannot; credentials and writes remain private. Transaction rolled back.');
