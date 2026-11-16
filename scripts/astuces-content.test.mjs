// Garde-fous sur le contenu des Astuces IA : les textes sont relus et
// modifiés par les formateurs, ces tests attrapent les références cassées
// avant qu'elles n'arrivent à l'écran ou dans le script de génération.
import { test } from "node:test";
import assert from "node:assert/strict";
import { loadAstuces, loadStudioModels } from "./lib/load-astuces.mjs";

const { ASTUCE_DOMAINS, ASTUCE_CAS, collectMedia, assemblePrompt, SUBJECT_KEY, templateSlots, casParts, partsText, casExamplePrompt } = await loadAstuces();
const { STUDIO_MODELS, aspectRatiosForModel } = await loadStudioModels();
const STUDIO_PROMPT_MAX = 2000; // cf. generate-studio-image / generate-studio-video

const dupes = (values) => values.filter((v, i) => values.indexOf(v) !== i);

test("ids de briques uniques par domaine", () => {
  for (const d of ASTUCE_DOMAINS) {
    assert.deepEqual(dupes(d.briques.map((b) => b.id)), [], `briques en double (${d.id})`);
  }
});

test("chaque prompt de base de variation contient exactement un {x}", () => {
  for (const d of ASTUCE_DOMAINS) {
    for (const b of d.briques) {
      if (!b.variations) continue;
      assert.equal(b.variations.base.split("{x}").length - 1, 1, `${d.id}/${b.id}`);
      assert.deepEqual(dupes(b.variations.items.map((i) => i.id)), [], `variations en double (${d.id}/${b.id})`);
      assert.ok(b.variations.items.length >= 2, `${d.id}/${b.id} : au moins deux variations pour comparer`);
    }
  }
});

test("l'anatomie ne référence que des briques existantes", () => {
  for (const d of ASTUCE_DOMAINS) {
    const ids = new Set(d.briques.map((b) => b.id));
    for (const s of d.anatomy.segments) if (s.brique) assert.ok(ids.has(s.brique), `${d.id} anatomie → ${s.brique}`);
  }
});

test("cas pratiques : template, champs et briques cohérents", () => {
  assert.deepEqual(dupes(ASTUCE_CAS.map((c) => c.id)), [], "cas en double");
  for (const c of ASTUCE_CAS) {
    const slots = templateSlots(c.template);
    const declared = [...c.fields.map((f) => f.id), ...c.briques.map((b) => b.id)];
    assert.deepEqual(dupes(slots), [], `${c.id} : emplacement utilisé deux fois`);
    assert.deepEqual(dupes(declared), [], `${c.id} : champ/brique en double`);
    assert.deepEqual([...slots].sort(), [...declared].sort(), `${c.id} : emplacements du template ≠ champs + briques`);
    const domain = ASTUCE_DOMAINS.find((d) => d.id === c.domain);
    assert.ok(domain, `${c.id} : domaine ${c.domain} non publié`);
    for (const b of c.briques) {
      assert.ok(b.options.length >= 2, `${c.id}/${b.id} : au moins deux options pour comparer`);
      assert.deepEqual(dupes(b.options.map((o) => o.id)), [], `${c.id}/${b.id} : options en double`);
      assert.deepEqual(dupes(b.options.map((o) => o.snippet)), [], `${c.id}/${b.id} : snippets en double`);
      if (b.ref) assert.ok(domain.briques.some((x) => x.id === b.ref), `${c.id}/${b.id} → brique ${b.ref} inexistante`);
    }
  }
});

test("cas pratiques : modèle et format disponibles dans Le Studio", () => {
  for (const c of ASTUCE_CAS) {
    const model = STUDIO_MODELS[c.model.id];
    assert.ok(model, `${c.id} : modèle ${c.model.id} absent du Studio`);
    assert.ok(aspectRatiosForModel(c.model.id).includes(c.ratio), `${c.id} : format ${c.ratio} indisponible pour ${c.model.id}`);
    if (c.source) assert.ok(model.supportsSourceImage, `${c.id} : ${c.model.id} n'accepte pas d'image importée`);
  }
});

test("cas pratiques : prompt de l'élève = exemple quand il reprend les exemples", () => {
  for (const c of ASTUCE_CAS) {
    const values = Object.fromEntries(c.fields.map((f) => [f.id, f.example]));
    assert.equal(partsText(casParts(c, values)), casExamplePrompt(c), c.id);
    const missing = casParts(c).filter((p) => p.missing).map((p) => p.slot);
    assert.deepEqual(missing, c.fields.map((f) => f.id), `${c.id} : champs vides non signalés`);
  }
});

test("ordre d'assemblage du constructeur sans collision", () => {
  for (const d of ASTUCE_DOMAINS) {
    const orders = [d.builderSubject.order, ...d.briques.filter((b) => b.builder).map((b) => b.builder.order)];
    assert.deepEqual(dupes(orders), [], `ordres en double (${d.id})`);
  }
});

test("médias : clés uniques, prompts acceptés par Le Studio, dépendances résolubles", () => {
  const specs = collectMedia(ASTUCE_DOMAINS, ASTUCE_CAS);
  assert.deepEqual(dupes(specs.map((s) => s.key)), []);
  const byKey = new Map(specs.map((s) => [s.key, s]));
  for (const s of specs) {
    assert.ok(s.prompt.length <= STUDIO_PROMPT_MAX, `${s.key} : prompt trop long (${s.prompt.length})`);
    assert.ok(!/\{x\}|\{[a-z0-9-]+\}/.test(s.prompt), `${s.key} : emplacement non remplacé`);
    if (s.model) assert.ok(STUDIO_MODELS[s.model], `${s.key} : modèle ${s.model} absent du Studio`);
    // Le script traite les images sans dépendance avant les autres : une
    // dépendance doit donc elle-même être une image sans dépendance.
    for (const dep of [s.sourceKey, s.startKey].filter(Boolean)) {
      const target = byKey.get(dep);
      assert.ok(target && target.kind === "image" && !target.sourceKey, `${s.key} : dépendance ${dep} absente ou elle-même dépendante`);
    }
  }
});

test("constructeur : phrases par groupe, ponctuation propre, étapes vides ignorées", () => {
  const image = ASTUCE_DOMAINS.find((d) => d.id === "image");
  const { text, parts } = assemblePrompt(image, {
    style: "photographie éditoriale",
    [SUBJECT_KEY]: "une céramiste aux cheveux gris.",
    cadrage: "en plan taille,",
    lumiere: "  lumière douce d'une fenêtre à gauche  ",
    couleurs: "",
  });
  assert.equal(text, "Photographie éditoriale, une céramiste aux cheveux gris. En plan taille. Lumière douce d'une fenêtre à gauche.");
  assert.deepEqual(parts.filter((p) => p.key).map((p) => p.key), ["style", SUBJECT_KEY, "cadrage", "lumiere"]);
  assert.equal(assemblePrompt(image, {}).text, "");
});
