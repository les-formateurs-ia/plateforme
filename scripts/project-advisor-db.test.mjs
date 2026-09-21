// Executes synthetic SQL checks in a transaction and always rolls them back.
// Requires SUPABASE_ACCESS_TOKEN and VITE_SUPABASE_URL in .env (Node >= 22.6).
import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
process.loadEnvFile();
const project = new URL(process.env.VITE_SUPABASE_URL).hostname.split('.')[0];
const endpoint = `https://api.supabase.com/v1/projects/${project}/database/query`;
async function query(sql) {
  const response = await fetch(endpoint, { method: 'POST', headers: {
    Authorization: `Bearer ${process.env.SUPABASE_ACCESS_TOKEN}`, 'Content-Type': 'application/json',
  }, body: JSON.stringify({ query: sql }) });
  const result = await response.json();
  if (!response.ok) throw new Error(JSON.stringify(result));
  return result;
}
const [state] = await query("select to_regclass('public.project_advisor_leads') as existing");
const migration = await readFile(new URL('../supabase/migrations/20260921132321_project_advisor_leads.sql', import.meta.url), 'utf8');
const schema = state.existing ? '' : migration.replace(/^begin;\s*$/m, '').replace(/^commit;\s*$/m, '');
const requestId = crypto.randomUUID();
await query(`begin;
${schema}
do $$ begin
  assert not has_table_privilege('anon', 'public.project_advisor_leads', 'SELECT');
  assert not has_table_privilege('anon', 'public.project_advisor_leads', 'INSERT');
  assert not has_table_privilege('authenticated', 'public.project_advisor_leads', 'UPDATE');
  assert not has_table_privilege('authenticated', 'public.project_advisor_leads', 'SELECT');
  assert not has_function_privilege('anon', 'public.project_advisor_take_quota(text,integer,integer)', 'EXECUTE');
  assert not has_function_privilege('authenticated', 'public.project_advisor_claim_analysis(uuid,text)', 'EXECUTE');
  assert (select relrowsecurity from pg_class where oid = 'public.project_advisor_leads'::regclass);
  assert (select relrowsecurity from pg_class where oid = 'public.project_advisor_quotas'::regclass);
end $$;
set local role service_role;
insert into public.project_advisor_leads (request_id,access_token_hash,first_name,last_name,email,profile,sector,need)
values ('${requestId}',repeat('a',64),'Test','Transaction','test@example.invalid','entreprise','Immobilier','Rédiger des comptes-rendus.');
do $$ declare claimed integer; begin
  assert public.project_advisor_take_quota('test:${requestId}',2,3600);
  assert public.project_advisor_take_quota('test:${requestId}',2,3600);
  assert not public.project_advisor_take_quota('test:${requestId}',2,3600);
  select count(*) into claimed from public.project_advisor_claim_analysis('${requestId}',repeat('b',64));
  assert claimed = 0;
  select count(*) into claimed from public.project_advisor_claim_analysis('${requestId}',repeat('a',64));
  assert claimed = 1;
  select count(*) into claimed from public.project_advisor_claim_analysis('${requestId}',repeat('a',64));
  assert claimed = 0;
  update public.project_advisor_leads set analysis_status='failed' where request_id='${requestId}';
  select count(*) into claimed from public.project_advisor_claim_analysis('${requestId}',repeat('a',64));
  assert claimed = 1;
  update public.project_advisor_leads set analysis_started_at=now()-interval '2 minutes' where request_id='${requestId}';
  select count(*) into claimed from public.project_advisor_claim_analysis('${requestId}',repeat('a',64));
  assert claimed = 1;
  update public.project_advisor_leads set analysis_status='failed' where request_id='${requestId}';
  select count(*) into claimed from public.project_advisor_claim_analysis('${requestId}',repeat('a',64));
  assert claimed = 0;
  update public.project_advisor_leads set status='callback_requested',phone='+33612345678',callback_requested_at=now()
    where request_id='${requestId}';
  assert (select phone='+33612345678' and status='callback_requested' and analysis_attempts=3
    from public.project_advisor_leads where request_id='${requestId}');
end $$;
rollback;`);
if (state.existing) {
  const [after] = await query(`select count(*)::int as count from public.project_advisor_leads where request_id='${requestId}'`);
  assert.equal(after.count, 0);
} else {
  const [after] = await query("select to_regclass('public.project_advisor_leads') as existing");
  assert.equal(after.existing, null);
}
console.log('PASS: database grants, RLS, atomic quotas, exclusive analysis claims, retry limit and callback storage. All test changes rolled back.');
