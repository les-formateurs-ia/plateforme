import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

// Les modèles sont du TypeScript pur (aucun import Vite) : on les regroupe en
// mémoire avec esbuild pour les exécuter sous Node.
const { outputFiles } = await build({
  stdin: {
    contents: `export * from './src/app/lib/documents/catalog'; export * from './src/app/lib/documents/samples'; export * from './src/app/lib/documents/session'; export * from './src/app/lib/documents/journey'; export { withSignatureProof, stampSignature } from './src/app/lib/documents/render';`,
    resolveDir: fileURLToPath(new URL('..', import.meta.url)),
    loader: 'ts',
  },
  bundle: true, format: 'esm', platform: 'node', write: false,
});
const mod = await import(`data:text/javascript;base64,${Buffer.from(outputFiles[0].text).toString('base64')}`);
const { DOCUMENT_TEMPLATES, SAMPLES, renderTemplate, buildDocumentContext, isSlotOpen, isSlotUpcoming, withSignatureProof, FORMATION_RS6776, FORMATION_ENTREPRISE, computeJourney, stampSignature } = mod;

const byId = (id) => SAMPLES.find((s) => s.id === id).ctx;
const ids = (ctx) => DOCUMENT_TEMPLATES.filter((t) => t.applicable(ctx)).map((t) => t.id);

test('every applicable template renders without undefined values', () => {
  for (const sample of SAMPLES) {
    for (const t of DOCUMENT_TEMPLATES.filter((t) => t.applicable(sample.ctx))) {
      const html = renderTemplate(t, sample.ctx);
      assert.match(html, /^<!DOCTYPE html>/, `${sample.id}/${t.id}`);
      assert.doesNotMatch(html, /undefined|NaN|\[object Object\]/, `${sample.id}/${t.id}`);
    }
  }
});

test('contractual document depends on the financing', () => {
  assert.ok(ids(byId('entreprise')).includes('convention'));
  assert.ok(!ids(byId('entreprise')).includes('contrat-particulier'));
  assert.ok(ids(byId('particulier')).includes('contrat-particulier'));
  assert.ok(!ids(byId('cpf')).includes('convention'));
  assert.ok(!ids(byId('cpf')).includes('devis'));
});

test('attendance proof depends on the delivery mode', () => {
  assert.ok(ids(byId('entreprise')).includes('emargement'));
  assert.ok(!ids(byId('entreprise')).includes('releve-connexions'));
  assert.ok(ids(byId('cpf')).includes('releve-connexions'));
  const foad = { ...byId('cpf'), formation: { ...byId('cpf').formation, modalite: 'foad' } };
  assert.ok(!ids(foad).includes('emargement'));
});

test('one signing sheet per day and one certificate per trainee', () => {
  const ctx = byId('entreprise');
  const t = (id) => DOCUMENT_TEMPLATES.find((t) => t.id === id);
  assert.equal(t('emargement').pages(ctx).length, 2);
  assert.equal(t('certificat-realisation').pages(ctx).length, ctx.stagiaires.length);
});

test('mandatory legal mentions are present', () => {
  const t = (id) => DOCUMENT_TEMPLATES.find((t) => t.id === id);
  const contrat = renderTemplate(t('contrat-particulier'), byId('particulier'));
  assert.match(contrat, /quatorze jours/);
  assert.match(contrat, /30 % du prix/);
  const devis = renderTemplate(t('devis'), byId('entreprise'));
  assert.match(devis, /261-4-4° a/);
  assert.match(devis, /ne vaut pas agrément de l.État/);
  const html = renderTemplate(t('programme'), byId('entreprise'));
  assert.match(html, /Référent handicap/);
  assert.doesNotMatch(html, /<script/i);
});

test('user data is escaped', () => {
  const ctx = { ...byId('entreprise'), client: { ...byId('entreprise').client, nom: '<img src=x onerror=alert(1)>' } };
  const html = renderTemplate(DOCUMENT_TEMPLATES.find((t) => t.id === 'convention'), ctx);
  assert.doesNotMatch(html, /<img src=x/);
});

// ── Sessions réelles ────────────────────────────────────────────────

const baseSession = (formation, financement = 'entreprise') => ({
  id: 's1', reference: 'ENT-2026-001', financement, financeur: null, companyId: null,
  client: { type: 'entreprise', nom: 'Client', adresse: '', codePostal: '', ville: '', siret: null, representant: null, email: '' },
  formation, lignes: [], conditionsPaiement: '', dateDebut: '2026-12-03', dateFin: '2026-12-04', lieu: 'Lyon', lienConnexion: null, intervenants: [],
});
const trainee = (id, profileId = null) => ({ id, profileId, civilite: '', prenom: id, nom: 'X', email: `${id}@x.fr`, fonction: null, resultatEvaluation: null });
const sig = (slotId, traineeId, role = 'stagiaire') => ({ id: `${slotId}-${traineeId ?? role}`, slotId, traineeId, role, signerName: 'n', signedAt: '2026-12-03T09:00:00Z', ip: null });

test('presential hours come from the trainee own signatures', () => {
  const bundle = {
    session: baseSession(FORMATION_ENTREPRISE),
    slots: [{ id: 'a', date: '2026-12-03', debut: '09:00', fin: '12:30' }, { id: 'b', date: '2026-12-03', debut: '13:30', fin: '17:00' }],
    trainees: [trainee('t1'), trainee('t2')],
    signatures: [sig('a', 't1'), sig('b', 't1'), sig('a', 't2'), sig('a', null, 'intervenant'), sig('b', null, 'intervenant')],
  };
  const ctx = buildDocumentContext(bundle);
  assert.equal(ctx.stagiaires[0].heuresRealisees, 7);
  // L'intervenant a signé l'après-midi, mais t2 non : pas compté pour t2.
  assert.equal(ctx.stagiaires[1].heuresRealisees, 3.5);
});

test('presential hours stay unknown without any session slot', () => {
  const ctx = buildDocumentContext({ session: baseSession(FORMATION_ENTREPRISE), slots: [], trainees: [trainee('t1')], signatures: [] });
  assert.equal(ctx.stagiaires[0].heuresRealisees, null);
});

test('distance hours add platform activity and trainer-signed sessions for a single trainee', () => {
  const bundle = {
    session: baseSession(FORMATION_RS6776, 'cpf'),
    slots: [{ id: 'a', date: '2026-12-04', debut: '10:00', fin: '11:00' }],
    trainees: [trainee('t1', 'p1')],
    signatures: [sig('a', null, 'intervenant')],
  };
  const activity = { t1: [
    { date: '2026-12-03', activite: 'Leçon : Intro', seconds: 5400 },
    { date: '2026-12-05', activite: 'Mission remise : Plan IA', seconds: 0 },
  ] };
  const ctx = buildDocumentContext(bundle, activity);
  const st = ctx.stagiaires[0];
  assert.equal(st.heuresRealisees, 2.5);
  assert.deepEqual(st.connexions.map((c) => c.date), ['03/12/2026', '04/12/2026', '05/12/2026']);
  assert.equal(st.connexions[0].duree, '1 h 30');
  assert.equal(st.connexions[2].duree, '—');
  const releve = renderTemplate(DOCUMENT_TEMPLATES.find((t) => t.id === 'releve-connexions'), ctx);
  assert.match(releve, /Séance avec le formateur/);
});

test('attendance window opens 15 minutes before and closes at the end (Paris time)', () => {
  const slot = { date: '2026-12-03', debut: '09:00', fin: '12:30' };
  // 03/12/2026 : heure d'hiver, Paris = UTC+1.
  assert.equal(isSlotOpen(slot, new Date('2026-12-03T07:40:00Z')), false);
  assert.equal(isSlotUpcoming(slot, new Date('2026-12-03T07:40:00Z')), true);
  assert.equal(isSlotOpen(slot, new Date('2026-12-03T07:46:00Z')), true);
  assert.equal(isSlotOpen(slot, new Date('2026-12-03T11:30:00Z')), true);
  assert.equal(isSlotOpen(slot, new Date('2026-12-03T11:31:00Z')), false);
  assert.equal(isSlotUpcoming(slot, new Date('2026-12-03T11:31:00Z')), false);
});

test('signature proof page is appended and escaped', () => {
  const html = renderTemplate(DOCUMENT_TEMPLATES.find((t) => t.id === 'convention'), byId('entreprise'));
  const signed = withSignatureProof(html, {
    titre: 'Convention', sha256: 'abc', emisLe: '2026-11-02T09:00:00Z', emisPar: 'Les Formateurs IA',
    signataire: '<b>Claire</b>', signeLe: '2026-11-03T10:15:00Z', ip: '203.0.113.7', navigateur: 'Firefox',
  });
  assert.match(signed, /Certificat de signature électronique/);
  assert.match(signed, /203\.0\.113\.7/);
  assert.doesNotMatch(signed, /<b>Claire<\/b>/);
  assert.ok(signed.trimEnd().endsWith('</html>'));
});

// ── Parcours gamifié ────────────────────────────────────────────────

const fullClient = { type: 'entreprise', nom: 'Exemple SAS', adresse: '1 rue A', codePostal: '69002', ville: 'Lyon', siret: '123', representant: { nom: 'Claire', qualite: 'DRH' }, email: 'c@x.fr' };
const doc = (template_id, signed = false) => ({ id: template_id, template_id, requires_signature: ['devis', 'convention'].includes(template_id), signed_at: signed ? '2026-11-01T10:00:00Z' : null });

test('a brand new company file starts on the client step with contracts locked', () => {
  const bundle = { session: baseSession(FORMATION_ENTREPRISE), slots: [], trainees: [], signatures: [] };
  const j = computeJourney(bundle, [], {}, new Date('2026-11-20T10:00:00Z'));
  assert.equal(j.next.id, 'client');
  assert.ok(j.missingFields.includes('client.siret'));
  assert.equal(j.steps.find((s) => s.id === 'devis').status, 'locked');
  assert.equal(j.steps.find((s) => s.id === 'cloture').status, 'locked');
  assert.equal(j.timeline.label, 'J-13');
});

test('with client and programme ready, the next step is issuing the quote', () => {
  const bundle = {
    session: { ...baseSession(FORMATION_ENTREPRISE), client: fullClient, intervenants: [{ nom: 'Yanis', qualite: 'Formateur' }] },
    slots: [], trainees: [], signatures: [],
  };
  const j = computeJourney(bundle, [], {}, new Date('2026-11-20T10:00:00Z'));
  assert.equal(j.next.id, 'devis');
  assert.deepEqual(j.next.actions[0], { kind: 'issue', templateIds: ['devis'], label: 'Émettre le devis' });
  const sent = computeJourney(bundle, [doc('devis')], {}, new Date('2026-11-20T10:00:00Z'));
  assert.equal(sent.next.actions[0].kind, 'share');
});

test('a finished and fully documented session reaches 100 %', () => {
  const slots = [{ id: 'a', date: '2026-12-03', debut: '09:00', fin: '12:30' }];
  const bundle = {
    session: { ...baseSession(FORMATION_ENTREPRISE), client: fullClient, intervenants: [{ nom: 'Yanis', qualite: 'Formateur' }] },
    slots, trainees: [{ ...trainee('t1', 'p1'), resultatEvaluation: 'Acquis' }],
    signatures: [sig('a', 't1'), sig('a', null, 'intervenant')],
  };
  const docs = ['devis', 'convention'].map((d) => doc(d, true))
    .concat(['programme', 'cgv', 'reglement-interieur', 'convocation', 'attestation-assiduite', 'certificat-realisation', 'attestation-fin-formation'].map((d) => doc(d)));
  const j = computeJourney(bundle, docs, {}, new Date('2026-12-10T10:00:00Z'));
  assert.deepEqual(j.steps.filter((s) => s.status !== 'done').map((s) => s.id), []);
  assert.equal(j.progress, 100);
  assert.equal(j.level.emoji, '🏆');
  assert.equal(j.next, null);
});

test('an unsigned past slot asks the trainer to sign it', () => {
  const slots = [{ id: 'a', date: '2026-12-03', debut: '09:00', fin: '12:30' }];
  const bundle = { session: { ...baseSession(FORMATION_ENTREPRISE), client: fullClient }, slots, trainees: [trainee('t1', 'p1')], signatures: [sig('a', 't1')] };
  const j = computeJourney(bundle, [], {}, new Date('2026-12-03T15:00:00Z'));
  const realisation = j.steps.find((s) => s.id === 'realisation');
  assert.equal(realisation.status, 'current');
  assert.deepEqual(realisation.actions[0], { kind: 'sign-slot', slotId: 'a', label: "Signer la séance en tant qu'intervenant" });
  assert.match(realisation.detail, /présence 100 %/);
});

test('signature boxes are filled: organisation at issue, client once signed', () => {
  const html = renderTemplate(DOCUMENT_TEMPLATES.find((t) => t.id === 'devis'), byId('entreprise'));
  assert.match(html, /data-sign="organisme"><\/div>/);
  const issued = stampSignature(html, 'organisme', 'Yanis SOUICI', '2026-11-02T09:00:00Z');
  assert.doesNotMatch(issued, /class="sign-box" data-sign="organisme"><\/div>/);
  assert.match(issued, /Signé électroniquement le 2 novembre 2026/);
  // La case du client reste vide jusqu'à sa signature.
  assert.match(issued, /class="sign-box" data-sign="client"><\/div>/);
  const signed = withSignatureProof(issued, {
    titre: 'Devis', sha256: 'x', emisLe: '2026-11-02T09:00:00Z', emisPar: 'Les Formateurs IA',
    signataire: 'Claire DUPONT', signeLe: '2026-11-03T10:15:00Z', ip: null, navigateur: null,
  });
  assert.doesNotMatch(signed, /class="sign-box" data-sign="client"><\/div>/);
  assert.match(signed, /<span class="sig-name">Claire DUPONT<\/span>/);
});

test('a file closed in Digiforma counts as complete; one still in progress does not', () => {
  const archive = { source: 'digiforma', code: 'AF1', etape: 'terminee', etapeLibelle: 'Terminée', cloture: true, nomSession: null, programme: null, heuresRealisees: 7, satisfaction: null, notes: [], documents: [] };
  const bundle = { session: { ...baseSession(FORMATION_ENTREPRISE), archive }, slots: [], trainees: [], signatures: [] };
  const closed = computeJourney(bundle, [], {}, new Date('2026-12-20T10:00:00Z'));
  assert.equal(closed.progress, 100);
  assert.equal(closed.next, null);
  assert.deepEqual(closed.missingFields, []);
  const open = computeJourney({ ...bundle, session: { ...bundle.session, archive: { ...archive, cloture: false } } }, [], {}, new Date('2026-12-20T10:00:00Z'));
  assert.equal(open.next.id, 'client');
});
