// Parcours complet du lien "Définir votre mot de passe", contre le projet
// Supabase de .env, APRÈS déploiement (migration 20260925140000 + Edge
// Functions generate-password-link, password-setup, update-student-email).
// Crée des comptes jetables (1 admin, 2 élèves, emails @example.com), vérifie
// chaque règle, puis les supprime — aucun vrai élève n'est touché.
//   node scripts/password-setup-e2e.mjs
import { readFileSync } from 'node:fs';
import { createHash, randomBytes } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const env = Object.fromEntries(readFileSync(new URL('../.env', import.meta.url), 'utf8')
  .split(/\r?\n/).filter((l) => /^[A-Z_]+=/.test(l)).map((l) => { const i = l.indexOf('='); return [l.slice(0, i), l.slice(i + 1).replace(/^"|"$/g, '')]; }));
const URL_ = env.VITE_SUPABASE_URL, ANON = env.VITE_SUPABASE_ANON_KEY, SERVICE = env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL_ || !ANON || !SERVICE) throw new Error('VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY et SUPABASE_SERVICE_ROLE_KEY requis dans .env');

const opts = { auth: { persistSession: false, autoRefreshToken: false } };
const service = createClient(URL_, SERVICE, opts);
const run = randomBytes(4).toString('hex');
const sha256 = (s) => createHash('sha256').update(s).digest('hex');
const strong = () => `Perso-${randomBytes(6).toString('hex')}A1`;
let failures = 0;
const check = (cond, label) => { console.log(`${cond ? '✔' : '✘'} ${label}`); if (!cond) failures++; };

async function call(fn, body, jwt) {
  const res = await fetch(`${URL_}/functions/v1/${fn}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: ANON, Authorization: `Bearer ${jwt ?? ANON}` },
    body: JSON.stringify(body),
  });
  return { status: res.status, body: await res.json().catch(() => null) };
}
const inspect = (token) => call('password-setup', { action: 'inspect', token });
const complete = (token, password, extra = {}) => call('password-setup', { action: 'complete', token, password, ...extra });
async function canSignIn(email, password) {
  const { data, error } = await createClient(URL_, ANON, opts).auth.signInWithPassword({ email, password });
  return error ? null : data.user.id;
}
async function row(userId) {
  const { data } = await service.from('password_setup_tokens').select('*').eq('user_id', userId).maybeSingle();
  return data;
}

async function makeUser(label, role) {
  const email = `e2e-pwsetup-${label}-${run}@example.com`;
  const password = `Test-${randomBytes(6).toString('hex')}A1`;
  const { data, error } = await service.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { first_name: `E2E ${label}` } });
  if (error) throw error;
  const { error: pErr } = await service.from('profiles').update({ role, first_name: `E2E ${label}`, must_onboard: false }).eq('id', data.user.id);
  if (pErr) throw pErr;
  return { id: data.user.id, email, password };
}

const created = [];
try {
  const admin = await makeUser('admin', 'admin'); created.push(admin);
  const a = await makeUser('eleve-a', 'student'); created.push(a);
  const b = await makeUser('eleve-b', 'student'); created.push(b);
  const jwtOf = async (u) => (await createClient(URL_, ANON, opts).auth.signInWithPassword({ email: u.email, password: u.password })).data.session.access_token;
  const adminJwt = await jwtOf(admin);
  const studentJwt = await jwtOf(a);
  const generate = async (studentId, jwt = adminJwt) => call('generate-password-link', { studentId }, jwt);

  console.log('\n— Génération');
  check((await generate(a.id, studentJwt)).status === 403, 'un élève ne peut pas générer de lien');
  check((await generate(a.id, ANON)).status === 401, 'sans session : refusé');
  check((await generate(admin.id)).status === 400, 'pas de lien pour un compte non-élève');
  const { body: gA1 } = await generate(a.id);
  const hoursValid = (new Date(gA1.expiresAt) - Date.now()) / 3.6e6;
  check(hoursValid > 71.9 && hoursValid <= 72, `valable 72 h (${hoursValid.toFixed(3)} h)`);
  const rA1 = await row(a.id);
  check(rA1?.token_hash === sha256(gA1.token), 'la base stocke le SHA-256 du jeton…');
  check(!JSON.stringify(rA1).includes(gA1.token), '…et jamais le jeton lui-même');
  check(rA1?.email === a.email, 'lien lié à l\'email du compte');

  console.log('\n— Page');
  const iA1 = await inspect(gA1.token);
  check(iA1.status === 200 && iA1.body.firstName === 'E2E eleve-a' && iA1.body.email === a.email, 'lien valide : prénom + email du compte');
  for (const bad of ['', 'nope', 'A'.repeat(43)]) {
    const r = await inspect(bad);
    check(r.status === 410 && r.body.invalid && !JSON.stringify(r.body).includes('@'), `jeton "${bad.slice(0, 8)}" : invalide, aucune donnée de compte`);
  }

  console.log('\n— Nouveau lien = ancien annulé, élèves indépendants');
  const { body: gA2 } = await generate(a.id);
  const { body: gB1 } = await generate(b.id);
  check((await inspect(gA1.token)).status === 410, 'l\'ancien lien de A ne marche plus');
  check((await inspect(gA2.token)).status === 200, 'le nouveau lien de A marche');
  check((await inspect(gB1.token)).body?.email === b.email, 'le lien de B est indépendant de ceux de A');
  check((await complete(gA1.token, strong())).status === 410, 'l\'ancien lien de A ne permet pas de changer le mot de passe');

  console.log('\n— Règles de mot de passe');
  const weak = await complete(gA2.token, 'faible');
  check(weak.status === 400 && /trop faible/.test(weak.body.error), `mot de passe faible refusé : « ${weak.body?.error} »`);
  const same = await complete(gA2.token, a.email);
  check(same.status === 400, 'email comme mot de passe refusé');
  check((await inspect(gA2.token)).status === 200, 'un refus ne consomme pas le lien');

  console.log('\n— Usage unique, y compris en simultané (A ×6 et B ×1 en parallèle)');
  const newA = strong(), newB = strong();
  // Tentative de détourner le lien de B vers le compte de A : champs ignorés.
  const results = await Promise.all([
    ...Array.from({ length: 6 }, () => complete(gA2.token, newA)),
    complete(gB1.token, newB, { userId: a.id, email: a.email }),
  ]);
  const aOk = results.slice(0, 6).filter((r) => r.status === 200).length;
  const aGone = results.slice(0, 6).filter((r) => r.status === 410).length;
  check(aOk === 1 && aGone === 5, `A : 1 succès, 5 refus (${aOk}/${aGone})`);
  check(results[6].status === 200 && results[6].body.email === b.email, 'B réussit en même temps, sur son propre compte');
  check((await complete(gA2.token, strong())).status === 410, 'lien de A réutilisé : refusé');
  check((await row(a.id)) === null && (await row(b.id)) === null, 'jetons utilisés supprimés de la base');

  console.log('\n— Même compte, ancien mot de passe désactivé');
  check((await canSignIn(a.email, a.password)) === null, 'A : l\'ancien mot de passe de test ne marche plus');
  check((await canSignIn(a.email, newA)) === a.id, 'A : le nouveau mot de passe ouvre le même compte (même id)');
  check((await canSignIn(b.email, newB)) === b.id, 'B : nouveau mot de passe OK');
  check((await canSignIn(a.email, newB)) === null, 'le mot de passe de B n\'a pas été appliqué à A');
  const { data: profA } = await service.from('profiles').select('id, role, first_name').eq('id', a.id).single();
  check(profA.role === 'student' && profA.first_name === 'E2E eleve-a', 'profil de A intact');

  console.log('\n— Expiration');
  const { body: gA3 } = await generate(a.id);
  await service.from('password_setup_tokens').update({ expires_at: new Date(Date.now() - 1000).toISOString() }).eq('user_id', a.id);
  check((await row(a.id)) !== null, 'lien expiré encore en base (purge pas encore passée)…');
  check((await inspect(gA3.token)).status === 410, '…mais déjà refusé à l\'affichage');
  check((await complete(gA3.token, strong())).status === 410, '…et à l\'enregistrement');
  check((await canSignIn(a.email, newA)) === a.id, 'le mot de passe de A n\'a pas bougé');
  await service.from('password_setup_tokens').delete().lte('expires_at', new Date().toISOString()).eq('user_id', a.id);
  check((await row(a.id)) === null, 'la requête de purge du cron le supprime');

  console.log('\n— Lien lié à l\'email');
  const { body: gA4 } = await generate(a.id);
  const newEmail = `e2e-pwsetup-eleve-a2-${run}@example.com`;
  await service.auth.admin.updateUserById(a.id, { email: newEmail, email_confirm: true });
  check((await inspect(gA4.token)).status === 410, 'email de connexion changé : le lien ne vaut plus rien');
} finally {
  for (const u of created) await service.auth.admin.deleteUser(u.id);
  console.log(`\nComptes de test supprimés (${created.length}).`);
}
console.log(failures ? `\n${failures} vérification(s) en échec.` : '\nTout est conforme.');
process.exit(failures ? 1 : 0);
