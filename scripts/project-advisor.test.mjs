import test from 'node:test';
import assert from 'node:assert/strict';
import { createAdvisorHandler } from '../supabase/functions/project-advisor/handler.ts';
import { normalizePhone, tokenHash, validateAnalysis, systemPrompt } from '../supabase/functions/project-advisor/domain.ts';

const origin = 'https://plateforme.les-formateurs-ia.fr';
const analysis = { introduction: 'Votre projet peut être étudié.', opportunities: ['Première piste concrète.', 'Deuxième piste concrète.'], sections: [1, 2, 3].map(n => ({ title: `Section ${n}`, body: 'Explication adaptée au projet.' })) };
const input = () => ({ requestId: crypto.randomUUID(), accessToken: 'a'.repeat(64), firstName: 'Camille', lastName: 'Test', email: 'CAMILLE@example.test', profile: 'entreprise', sector: 'Immobilier', need: 'Rédiger mes comptes-rendus de visite.', contactAccepted: true, website: '' });

function fixture(overrides = {}) {
  const rows = new Map(), calls = [];
  const store = {
    async find(id) { return rows.get(id) ? structuredClone(rows.get(id)) : null; },
    async create(contact, requestId, hash) {
      calls.push('saved');
      const row = { ...contact, id: rows.size + 1, request_id: requestId, access_token_hash: hash, created_at: new Date().toISOString(), status: 'new', analysis_status: 'pending', analysis_attempts: 0, analysis: null, phone: null, callback_requested_at: null };
      rows.set(requestId, row);
      return structuredClone(row);
    },
    async quota() { return true; },
    async claim(id, hash) {
      const row = rows.get(id);
      if (!row || row.access_token_hash !== hash || !['pending', 'failed'].includes(row.analysis_status) || row.analysis_attempts >= 3) return null;
      row.analysis_status = 'processing'; row.analysis_attempts++;
      return structuredClone(row);
    },
    async finish(lead, result) { Object.assign(rows.get(lead.request_id), { analysis: result, analysis_status: result ? 'ready' : 'failed' }); },
    async callback(lead, phone, at) { calls.push('callback'); Object.assign(rows.get(lead.request_id), { phone, status: 'callback_requested', callback_requested_at: at }); },
    ...overrides.store,
  };
  const handler = createAdvisorHandler({ store, hashIdentity: tokenHash, generate: async project => { calls.push('generate'); assert.deepEqual(Object.keys(project).sort(), ['need', 'profile', 'sector']); return analysis; }, ...overrides, store });
  return { rows, calls, request: (action, body, requestOrigin = origin) => handler(new Request('https://api.example.test/project-advisor', { method: 'POST', headers: { origin: requestOrigin, 'content-type': 'application/json' }, body: JSON.stringify({ ...body, action }) })), handler };
}

test('lead is committed before AI; retries use the saved lead and cached analysis', async () => {
  const f = fixture(), body = input();
  assert.equal((await f.request('analyze', body)).status, 403);
  assert.equal((await f.request('submit', body)).status, 200);
  assert.deepEqual(f.calls, ['saved']);
  assert.equal((await f.request('submit', body)).status, 200);
  assert.equal(f.rows.size, 1);
  assert.equal(f.rows.get(body.requestId).email, 'camille@example.test');
  assert.deepEqual((await (await f.request('analyze', body)).json()).analysis, analysis);
  assert.deepEqual((await (await f.request('analyze', body)).json()).analysis, analysis);
  assert.deepEqual(f.calls, ['saved', 'generate']);
});

test('invalid email, missing contact agreement, invalid profile and bot trap never create a lead', async () => {
  for (const bad of [{ email: 'bad@' }, { contactAccepted: false }, { profile: 'admin' }, { website: 'spam' }, { need: 'short' }]) {
    const f = fixture();
    assert.equal((await f.request('submit', { ...input(), ...bad })).status, 400);
    assert.equal(f.rows.size, 0);
  }
});

test('database save failure prevents AI and never claims the form was saved', async () => {
  const f = fixture({ store: { async create() { throw new Error('private database details'); } } });
  const response = await f.request('submit', input());
  assert.equal(response.status, 503);
  assert.doesNotMatch(await response.text(), /private database details|saved/);
  assert.deepEqual(f.calls, []);
});

test('different capability, expired session and foreign origin cannot read or change a lead', async () => {
  const f = fixture(), body = input();
  await f.request('submit', body);
  for (const action of ['analyze', 'callback', 'submit']) {
    assert.equal((await f.request(action, { ...body, accessToken: 'b'.repeat(64), phone: '0612345678' })).status, 403);
  }
  const foreign = await f.request('submit', input(), 'https://evil.example');
  assert.equal(foreign.status, 403); assert.equal(foreign.headers.get('access-control-allow-origin'), null);
  f.rows.get(body.requestId).created_at = '2000-01-01T00:00:00Z';
  assert.equal((await f.request('callback', { ...body, phone: '0612345678' })).status, 403);
});

test('AI outage retains the contact and still permits an idempotent callback', async () => {
  const f = fixture({ generate: async () => { throw new Error('provider secret'); } }), body = input();
  await f.request('submit', body);
  assert.equal((await f.request('analyze', body)).status, 503);
  assert.equal(f.rows.size, 1); assert.equal(f.rows.get(body.requestId).analysis_status, 'failed');
  assert.equal((await f.request('callback', { ...body, phone: 'not-a-number' })).status, 400);
  const result = await f.request('callback', { ...body, phone: '06 12 34 56 78' });
  assert.equal((await result.json()).confirmed, true);
  await f.request('callback', { ...body, phone: '+33612345678' });
  assert.equal(f.rows.get(body.requestId).phone, '+33612345678');
  assert.equal(f.rows.get(body.requestId).status, 'callback_requested');
  assert.equal(f.calls.filter(x => x === 'callback').length, 1);
});

test('concurrent analysis calls invoke AI only once', async () => {
  let resolve, generated = 0;
  const f = fixture({ generate: () => { generated++; return new Promise(r => { resolve = r; }); } }), body = input();
  await f.request('submit', body);
  const first = f.request('analyze', body);
  while (!resolve) await new Promise(r => setTimeout(r, 1));
  const second = await f.request('analyze', body);
  assert.equal(second.status, 202); assert.equal(generated, 1);
  resolve(analysis); assert.equal((await first).status, 200);
});

test('rate limits stop storage and generation, without disclosing contact data', async () => {
  const f = fixture({ store: { async quota() { return false; } } });
  assert.equal((await f.request('submit', input())).status, 429);
  assert.equal(f.rows.size, 0);
});

test('callback storage errors do not show a success confirmation', async () => {
  const f = fixture({ store: { async callback() { throw new Error('not saved'); } } }), body = input();
  await f.request('submit', body);
  const response = await f.request('callback', { ...body, phone: '0612345678' });
  assert.equal(response.status, 503); assert.equal((await response.json()).confirmed, undefined);
});

test('changed submissions require a new ID; contact details never appear in responses', async () => {
  const f = fixture(), body = input();
  const response = await f.request('submit', body);
  const text = await response.text();
  assert.doesNotMatch(text, /Camille|example.test|access_token_hash/);
  assert.equal((await f.request('submit', { ...body, sector: 'Santé' })).status, 409);
});

test('payload limits and malformed JSON are enforced before accessing storage', async () => {
  const f = fixture();
  assert.equal((await f.request('submit', { ...input(), need: 'a'.repeat(17000) })).status, 413);
  const response = await f.handler(new Request('https://api.example.test', { method: 'POST', headers: { origin, 'content-type': 'application/json' }, body: '{' }));
  assert.equal(response.status, 400); assert.equal(f.rows.size, 0);
});

test('French and international phone numbers normalize; analysis schema and profile prompts are constrained', () => {
  assert.equal(normalizePhone('09 80 87 40 46'), '+33980874046');
  assert.equal(normalizePhone('0032 471 12 34 56'), '+32471123456');
  assert.throws(() => normalizePhone('1234'));
  assert.deepEqual(validateAnalysis(analysis), analysis);
  assert.throws(() => validateAnalysis({ ...analysis, sections: [] }));
  assert.match(systemPrompt('entreprise'), /documents internes/);
  assert.match(systemPrompt('particulier'), /Parcours e-learning/);
});
