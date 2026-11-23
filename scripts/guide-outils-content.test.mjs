// Garde-fous sur le guide « Comprendre les outils » : ids uniques (ils
// servent d'URL), quiz cohérents, sources officielles uniquement.
import { test } from "node:test";
import assert from "node:assert/strict";
import { loadGuideOutils } from "./lib/load-astuces.mjs";

const { GUIDE_OUTILS, FORMAT_LABELS } = await loadGuideOutils();

// Domaines officiels autorisés par outil.
const OFFICIAL = {
  bases: ["openai.com", "chatgpt.com", "anthropic.com", "claude.com", "claude.ai", "google.com", "gemini.google", "blog.google", "google.dev", "deepmind.google"],
  chatgpt: ["openai.com", "chatgpt.com"],
  claude: ["anthropic.com", "claude.com", "claude.ai"],
  gemini: ["google.com", "gemini.google", "blog.google", "google.dev", "deepmind.google"],
};

const dupes = (values) => values.filter((v, i) => values.indexOf(v) !== i);
const isOfficial = (outil, url) => {
  const host = new URL(url).hostname;
  return OFFICIAL[outil].some((d) => host === d || host.endsWith(`.${d}`));
};

test("les bases puis trois outils, ids uniques", () => {
  assert.deepEqual(GUIDE_OUTILS.map((o) => o.id), ["bases", "chatgpt", "claude", "gemini"]);
});

test("ids de chapitres et d'articles uniques par outil", () => {
  for (const o of GUIDE_OUTILS) {
    assert.deepEqual(dupes(o.chapters.map((c) => c.id)), [], `${o.id} : chapitres en double`);
    const articles = o.chapters.flatMap((c) => c.articles.map((a) => a.id));
    assert.deepEqual(dupes(articles), [], `${o.id} : articles en double`);
    for (const id of articles) assert.match(id, /^[a-z0-9-]+$/, `${o.id}/${id} : id d'URL invalide`);
  }
});

test("chaque article a des blocs, un format connu et des sources officielles", () => {
  for (const o of GUIDE_OUTILS) {
    assert.match(o.checkedAt, /^\d{4}-\d{2}-\d{2}$/);
    for (const s of o.sources) assert.ok(isOfficial(o.id, s.url), `${o.id} : source non officielle ${s.url}`);
    for (const c of o.chapters) {
      assert.ok(c.articles.length > 0, `${o.id}/${c.id} : chapitre vide`);
      for (const a of c.articles) {
        assert.ok(a.blocks.length >= 2, `${o.id}/${a.id} : article trop court`);
        assert.ok(FORMAT_LABELS[a.format], `${o.id}/${a.id} : format inconnu`);
        assert.ok(a.sources.length > 0, `${o.id}/${a.id} : aucune source`);
        for (const s of a.sources) assert.ok(isOfficial(o.id, s.url), `${o.id}/${a.id} : source non officielle ${s.url}`);
      }
    }
  }
});

test("les articles d'un même chapitre ne se ressemblent pas tous", () => {
  for (const o of GUIDE_OUTILS) {
    for (const c of o.chapters) {
      if (c.articles.length < 3) continue;
      const formats = new Set(c.articles.map((a) => a.format));
      assert.ok(formats.size >= 3, `${o.id}/${c.id} : varier les formats (${[...formats].join(", ")})`);
    }
  }
});

test("quiz : une bonne réponse valide par question", () => {
  for (const o of GUIDE_OUTILS) {
    for (const a of o.chapters.flatMap((c) => c.articles)) {
      for (const b of a.blocks) {
        if (b.type !== "quiz") continue;
        for (const q of b.questions) {
          assert.ok(q.options.length >= 2 && q.answer >= 0 && q.answer < q.options.length, `${o.id}/${a.id} : « ${q.q} »`);
        }
      }
      for (const b of a.blocks) {
        if (b.type === "table") for (const r of b.rows) assert.equal(r.length, b.headers.length, `${o.id}/${a.id} : ligne de tableau incomplète`);
      }
    }
  }
});

// Profondeur : chaque article explique le « pourquoi » (au moins un bloc
// d'explication en profondeur) et ne se limite pas à deux blocs.
const DEPTH_BLOCKS = new Set(["deep", "insider", "myths", "flow", "stack", "beforeAfter"]);

test("chaque article va au fond des choses", () => {
  for (const o of GUIDE_OUTILS) {
    for (const a of o.chapters.flatMap((c) => c.articles)) {
      assert.ok(a.blocks.length >= 4, `${o.id}/${a.id} : moins de 4 blocs`);
      assert.ok(a.blocks.some((b) => DEPTH_BLOCKS.has(b.type)), `${o.id}/${a.id} : aucun bloc d'explication en profondeur`);
    }
  }
});
