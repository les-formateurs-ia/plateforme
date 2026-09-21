// End-to-end check against the deployed endpoint. Makes two real AI calls.
// Synthetic contacts are removed in finally; normal leads are never touched.
import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';
process.loadEnvFile();
const url = process.env.VITE_SUPABASE_URL;
const db = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const endpoint = url + '/functions/v1/project-advisor';
const requests = [];
async function send(action, body) {
  const response = await fetch(endpoint, { method: 'POST', headers: {
    origin: 'https://plateforme.les-formateurs-ia.fr', 'content-type': 'application/json',
  }, body: JSON.stringify({ action, ...body }), signal: AbortSignal.timeout(65000) });
  const result = await response.json();
  assert.equal(response.status, 200, JSON.stringify({ status: response.status, result }));
  return result;
}
try {
  for (const profile of ['entreprise', 'particulier']) {
    const body = {
      requestId: crypto.randomUUID(), accessToken: Array.from(crypto.getRandomValues(new Uint8Array(32)), b => b.toString(16).padStart(2, '0')).join(''),
      firstName: 'Test', lastName: 'Conseiller', profile, sector: 'Immobilier',
      need: 'Préparer des comptes-rendus de visite structurés à partir de notes anonymisées, avec une relecture avant envoi au client.',
      contactAccepted: true, website: '',
    };
    body.email = `advisor-smoke-${body.requestId}@example.invalid`;
    requests.push(body);
    assert.equal((await send('submit', body)).saved, true);
    const saved = await db.from('project_advisor_leads').select('analysis_status,email').eq('request_id', body.requestId).single();
    assert.ifError(saved.error); assert.equal(saved.data.analysis_status, 'pending');
    assert.equal((await send('submit', body)).saved, true);
    const result = await send('analyze', body);
    assert.equal(result.analysis.sections.length, 3);
    assert.ok(result.analysis.opportunities.length >= 2);
    const cached = await send('analyze', body);
    assert.deepEqual(cached, result);
    assert.equal((await send('callback', { ...body, phone: '06 00 00 00 00' })).confirmed, true);
    const final = await db.from('project_advisor_leads').select('status,phone,analysis_status,analysis_attempts,callback_requested_at').eq('request_id', body.requestId).single();
    assert.ifError(final.error);
    assert.equal(final.data.status, 'callback_requested'); assert.equal(final.data.phone, '+33600000000');
    assert.equal(final.data.analysis_status, 'ready'); assert.equal(final.data.analysis_attempts, 1);
    assert.ok(final.data.callback_requested_at);
    console.log(`PASS ${profile}: persisted before AI, real analysis, cached retry, callback persisted. Sections: ${result.analysis.sections.map(s => s.title).join(' / ')}`);
  }
  const anon = createClient(url, process.env.VITE_SUPABASE_ANON_KEY, { auth: { persistSession: false } });
  const forbidden = await anon.from('project_advisor_leads').select('id').limit(1);
  assert.ok(forbidden.error, 'Anonymous reads must be denied');
  console.log('PASS anonymous table access denied.');
} finally {
  for (const body of requests) {
    const { error } = await db.from('project_advisor_leads').delete().eq('request_id', body.requestId).eq('email', body.email);
    if (error) throw new Error('Could not remove synthetic advisor test contact: ' + body.requestId);
  }
  console.log('Synthetic test contacts removed.');
}
