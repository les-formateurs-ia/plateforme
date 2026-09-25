import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Helpers purs du lien "Définir votre mot de passe" (Node ≥ 22.18 exécute le
// TypeScript directement). Le parcours complet contre Supabase est couvert
// par scripts/password-setup-e2e.mjs.
const token = await import('../supabase/functions/_shared/password-setup-token.ts');
const serverPolicy = await import('../supabase/functions/_shared/password-policy.ts');
const clientPolicy = await import('../src/app/lib/passwordPolicy.ts');

test('jeton : 32 octets aléatoires en base64url, jamais deux fois le même', () => {
  const seen = new Set();
  for (let i = 0; i < 500; i++) {
    const t = token.generateToken();
    assert.match(t, /^[A-Za-z0-9_-]{43}$/);
    assert.ok(token.isWellFormedToken(t));
    seen.add(t);
  }
  assert.equal(seen.size, 500);
});

test('jeton : formes invalides refusées avant toute requête en base', () => {
  for (const bad of [undefined, null, 42, '', 'abc', 'x'.repeat(44), `${'a'.repeat(42)}=`, `${'a'.repeat(42)}/`]) {
    assert.equal(token.isWellFormedToken(bad), false, String(bad));
  }
});

test('hash : SHA-256 hexadécimal, conforme à la contrainte de la table', async () => {
  assert.equal(await token.hashToken('abc'), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  const h = await token.hashToken(token.generateToken());
  assert.match(h, /^[0-9a-f]{64}$/);
  const migration = readFileSync(new URL('../supabase/migrations/20260925140000_password_setup_tokens.sql', import.meta.url), 'utf8');
  assert.ok(migration.includes("token_hash ~ '^[0-9a-f]{64}$'"));
});

test('migration : table fermée aux rôles client, purge planifiée des liens expirés', () => {
  const migration = readFileSync(new URL('../supabase/migrations/20260925140000_password_setup_tokens.sql', import.meta.url), 'utf8');
  assert.match(migration, /enable row level security/);
  assert.match(migration, /revoke all on table public\.password_setup_tokens from anon, authenticated/);
  assert.doesNotMatch(migration, /create policy/i);
  assert.match(migration, /cron\.schedule\([\s\S]*expires_at <= now\(\)/);
});

const EMAIL = 'eleve@example.com';
const CASES = [
  ['', false],
  ['Court1', false],
  ['toutenminuscule1', false],
  ['TOUTENMAJUSCULE1', false],
  ['SansChiffreIci', false],
  ['Bonjour2026', true],
  ['Élève-Motdepasse9', true],
  ['EleveMotdepasse9!'.padEnd(73, 'x'), false],
  ['é'.repeat(30) + 'Aa1', true],
  ['é'.repeat(40) + 'Aa1', false],
  ['Eleve@example.com1', true],
];

test('politique : mêmes verdicts côté serveur et côté client', () => {
  for (const [pw, ok] of CASES) {
    const s = serverPolicy.passwordProblem(pw, EMAIL);
    const c = clientPolicy.passwordProblem(pw, EMAIL);
    assert.equal(s, c, pw);
    assert.equal(s === null, ok, `${pw} → ${s}`);
  }
  assert.deepEqual(serverPolicy.PASSWORD_RULES.map((r) => r.label), clientPolicy.PASSWORD_RULES.map((r) => r.label));
});

test("politique : l'adresse e-mail n'est jamais acceptée comme mot de passe", () => {
  assert.match(serverPolicy.passwordProblem('Eleve.Test1@Example.com', 'eleve.test1@example.com'), /adresse e-mail/);
});

test('politique : messages en français, sans jamais recopier le mot de passe', () => {
  for (const [pw] of CASES) {
    const msg = serverPolicy.passwordProblem(pw, EMAIL);
    if (msg && pw.length > 3) assert.ok(!msg.includes(pw), msg);
  }
});
