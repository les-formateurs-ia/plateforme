import test from 'node:test';
import assert from 'node:assert/strict';
import { createContactHandler } from '../supabase/functions/contact-request/handler.ts';
import { tokenHash } from '../supabase/functions/project-advisor/domain.ts';

const origin = 'https://les-formateurs-ia.fr';
const base = () => ({ requestId: crypto.randomUUID(), firstName: 'Camille', lastName: 'Test', email: 'CAMILLE@example.test', phone: '06 12 34 56 78', contactAccepted: true, website: '' });
const forms = {
  general: () => ({ ...base(), form: 'general', profile: 'particulier', need: 'Je veux gagner du temps sur mes e-mails.' }),
  entreprise: () => ({ ...base(), form: 'entreprise', company: 'ACME, 40 salariés', challenges: ['automatisation', 'charte-conformite'] }),
  particulier: () => ({ ...base(), form: 'particulier', employmentStatus: 'demandeur-emploi', cpfBalance: 'aide' }),
};

function fixture(overrides = {}) {
  const rows = new Map();
  const store = {
    async create(request) {
      if (rows.has(request.request_id)) return false;
      rows.set(request.request_id, structuredClone(request));
      return true;
    },
    async quota() { return true; },
    ...overrides,
  };
  const handler = createContactHandler({ store, hashIdentity: tokenHash });
  return { rows, request: (body, requestOrigin = origin) => handler(new Request('https://api.example.test/contact-request', { method: 'POST', headers: { origin: requestOrigin, 'content-type': 'application/json' }, body: JSON.stringify(body) })) };
}

test('each form saves its own fields, with the profile and a normalized contact', async () => {
  const f = fixture();
  for (const [form, make] of Object.entries(forms)) {
    const body = make();
    const response = await f.request(body);
    assert.equal(response.status, 200, form);
    const row = f.rows.get(body.requestId);
    assert.equal(row.source, `contact-${form}`);
    assert.equal(row.access_token_hash, undefined);
    assert.equal(row.email, 'camille@example.test');
    assert.equal(row.phone, '+33612345678');
  }
  const [general, entreprise, particulier] = [...f.rows.values()];
  assert.equal(general.profile, 'particulier');
  assert.equal(general.company, null);
  assert.equal(entreprise.profile, 'entreprise');
  assert.deepEqual(entreprise.challenges, ['automatisation', 'charte-conformite']);
  assert.equal(entreprise.need, null);
  assert.equal(particulier.profile, 'particulier');
  assert.deepEqual([particulier.employment_status, particulier.cpf_balance], ['demandeur-emploi', 'aide']);
});

test('a retry of the same form is accepted without a second row', async () => {
  const f = fixture(), body = forms.entreprise();
  assert.equal((await f.request(body)).status, 200);
  assert.equal((await f.request(body)).status, 200);
  assert.equal(f.rows.size, 1);
});

test('fields of another form are ignored; only known UTM keys are kept', async () => {
  const f = fixture(), body = { ...forms.particulier(), company: 'Ignored', need: 'Ignored too, it is long enough', utm: { utm_source: 'linkedin', evil: 'x' } };
  assert.equal((await f.request(body)).status, 200);
  const row = f.rows.get(body.requestId);
  assert.equal(row.company, null);
  assert.equal(row.need, null);
  assert.deepEqual(row.utm, { utm_source: 'linkedin' });
});

test('invalid or incomplete forms never create a row', async () => {
  const cases = [
    { ...forms.general(), profile: 'admin' },
    { ...forms.general(), need: 'court' },
    { ...forms.general(), lastName: '' },
    { ...forms.entreprise(), challenges: [] },
    { ...forms.entreprise(), challenges: ['drop table'] },
    { ...forms.particulier(), cpfBalance: undefined },
    { ...forms.general(), form: 'autre' },
    { ...forms.general(), email: 'bad@' },
    { ...forms.general(), phone: '12' },
    { ...forms.general(), contactAccepted: false },
    { ...forms.general(), website: 'spam' },
    { ...forms.general(), requestId: 'not-a-uuid' },
  ];
  for (const body of cases) {
    const f = fixture();
    assert.equal((await f.request(body)).status, 400, JSON.stringify(body));
    assert.equal(f.rows.size, 0);
  }
});

test('unknown origins, quotas and database failures are handled without leaking details', async () => {
  assert.equal((await fixture().request(forms.general(), 'https://evil.example')).status, 403);
  assert.equal((await fixture({ async quota() { return false; } }).request(forms.general())).status, 429);
  const response = await fixture({ async create() { throw new Error('private database details'); } }).request(forms.general());
  assert.equal(response.status, 503);
  assert.doesNotMatch(await response.text(), /private database details|saved/);
});
