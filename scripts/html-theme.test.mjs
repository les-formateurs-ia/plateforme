import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

// Le moteur est un script autonome (injecté tel quel dans les iframes) : on
// l'évalue sans DOM, il n'expose alors que ses fonctions de couleur pures.
const source = readFileSync(new URL('../src/app/lib/htmlThemeEngine.js', import.meta.url), 'utf8');
const sandbox = {};
vm.runInNewContext(source, sandbox);
const E = sandbox.__lfiaHtmlTheme;

const THEMES = {
  light: E.createTheme({ dark: false, bg: '#F7F7FA', card: '#FFFFFF', fg: 'rgba(15,14,20,0.94)', sep: 'rgba(15,14,20,0.08)', inputBg: 'rgba(15,14,20,0.03)', accent1: '#b58de0', accent2: '#dbacf0' }),
  dark: E.createTheme({ dark: true, bg: '#0A0A10', card: '#131319', fg: 'rgba(255,255,255,0.94)', sep: 'rgba(255,255,255,0.07)', inputBg: 'rgba(255,255,255,0.05)', accent1: '#b58de0', accent2: '#dbacf0' }),
};
const WHITE_PAGE = E.makePage(E.parseColor('#ffffff'));
const ctx = (T, extra = {}) => E.contextFor(T, WHITE_PAGE, extra);
const c = (s) => E.parseColor(s);
const hue = (col) => E.rgbToOklch(col).h;
const hueDist = (a, b) => { const d = Math.abs(a - b) % 360; return d > 180 ? 360 - d : d; };
const labDist = (a, b) => {
  const x = E.rgbToOklch(a), y = E.rgbToOklch(b);
  const ax = x.C * Math.cos(x.h * Math.PI / 180), ay = x.C * Math.sin(x.h * Math.PI / 180);
  const bx = y.C * Math.cos(y.h * Math.PI / 180), by = y.C * Math.sin(y.h * Math.PI / 180);
  return Math.hypot(x.L - y.L, ax - bx, ay - by);
};
// Texte posé sur un fond donné (même logique qu'une règle .x{background;color}).
const textOn = (T, text, bgSrc) => {
  const bg = E.mapColor(c(bgSrc), 'bg', ctx(T));
  const fg = E.mapColor(c(text), 'fg', ctx(T, { srcBg: c(bgSrc), tgtBg: bg }));
  return { bg, fg, cr: E.contrast(fg, bg) };
};

test('parseColor comprend hex, fonctions, noms et alpha Tailwind', () => {
  assert.deepEqual({ ...c('#f00') }, { r: 255, g: 0, b: 0, a: 1 });
  assert.equal(c('#ff000080').a.toFixed(2), '0.50');
  assert.equal(E.formatColor(c('rgb(10, 20, 30)')), '#0a141e');
  assert.equal(E.formatColor(c('rgba(10 20 30 / 50%)')), 'rgba(10, 20, 30, 0.5)');
  assert.equal(E.formatColor(c('hsl(0 100% 50%)')), '#ff0000');
  assert.equal(E.formatColor(c('rebeccapurple')), '#663399');
  assert.equal(c('rgb(59 130 246 / var(--tw-bg-opacity))').alphaExpr, 'var(--tw-bg-opacity)');
  const ok = c('oklch(62.3% 0.188 260)');
  assert.ok(Math.abs(ok.r - 0x3b) <= 2 && Math.abs(ok.g - 0x82) <= 2 && Math.abs(ok.b - 0xf6) <= 2);
  assert.equal(c('currentColor'), null);
  assert.equal(c('var(--x)'), null);
});

test('les teintes rejoignent la famille de la charte', () => {
  const cases = [
    ['#ef4444', 'corail', 25, 45], ['#dc3545', 'corail', 25, 45], ['#f97316', 'corail', 25, 45], ['#c2410c', 'corail', 25, 45],
    ['#f59e0b', 'doré', 65, 95], ['#ffc107', 'doré', 65, 95], ['#b45309', 'doré', 60, 95],
    ['#22c55e', 'vert', 140, 165], ['#198754', 'vert', 140, 165],
    ['#3b82f6', 'bleu', 195, 230], ['#0d6efd', 'bleu', 195, 230], ['#06b6d4', 'bleu', 195, 215],
    ['#8b5cf6', 'violet', 290, 320], ['#764ba2', 'violet', 290, 320],
  ];
  for (const T of Object.values(THEMES)) {
    for (const [src, fam, lo, hi] of cases) {
      const h = hue(E.mapColor(c(src), 'bg', ctx(T, { control: true })));
      assert.ok(h >= lo && h <= hi, `${src} → ${fam} (teinte ${h.toFixed(0)}°, attendue ${lo}-${hi}°) en ${T.dark ? 'sombre' : 'clair'}`);
    }
  }
});

test('succès, avertissement et erreur restent distincts (texte, fond, aplat)', () => {
  // Paires Tailwind et Bootstrap : texte foncé sur fond d'alerte clair.
  const sets = [
    { ok: ['#065f46', '#ecfdf5'], warn: ['#92400e', '#fffbeb'], err: ['#991b1b', '#fef2f2'] },
    { ok: ['#0f5132', '#d1e7dd'], warn: ['#664d03', '#fff3cd'], err: ['#842029', '#f8d7da'] },
  ];
  for (const T of Object.values(THEMES)) {
    for (const s of sets) {
      const m = Object.fromEntries(Object.entries(s).map(([k, [text, bg]]) => [k, textOn(T, text, bg)]));
      for (const [a, b] of [['ok', 'warn'], ['ok', 'err'], ['warn', 'err']]) {
        assert.ok(hueDist(hue(m[a].fg), hue(m[b].fg)) >= 25, `textes ${a}/${b} trop proches en ${T.dark ? 'sombre' : 'clair'}`);
        assert.ok(hueDist(hue(m[a].bg), hue(m[b].bg)) >= 25, `fonds ${a}/${b} trop proches en ${T.dark ? 'sombre' : 'clair'}`);
      }
      for (const v of Object.values(m)) assert.ok(v.cr >= 4.5, `contraste ${v.cr.toFixed(2)} < 4.5`);
    }
    const solid = ['#16a34a', '#f59e0b', '#dc2626'].map((x) => E.mapColor(c(x), 'bg', ctx(T, { control: true })));
    assert.ok(labDist(solid[0], solid[1]) > 0.08 && labDist(solid[1], solid[2]) > 0.08 && labDist(solid[0], solid[2]) > 0.08);
  }
});

test('texte sur bouton coloré : choisi au contraste, pas forcé blanc ou noir', () => {
  for (const T of Object.values(THEMES)) {
    for (const bg of ['#2563eb', '#16a34a', '#dc2626', '#7c3aed', '#facc15', '#1e3a8a']) {
      for (const text of ['#ffffff', '#000000', '#1f2937']) {
        const bgM = E.mapColor(c(bg), 'bg', ctx(T, { control: true }));
        const fg = E.mapColor(c(text), 'fg', ctx(T, { control: true, srcBg: c(bg), tgtBg: bgM }));
        assert.ok(E.contrast(fg, bgM) >= 4.5, `${text} sur ${bg} : ${E.contrast(fg, bgM).toFixed(2)} en ${T.dark ? 'sombre' : 'clair'}`);
      }
    }
  }
});

test('thème sombre : fond racine exact, texte clair, cartes hiérarchisées', () => {
  const T = THEMES.dark;
  assert.equal(E.formatColor(E.mapColor(c('#ffffff'), 'bg', ctx(T, { root: true }))), '#0a0a10');
  assert.equal(E.formatColor(E.mapColor(c('#f3f4f6'), 'bg', ctx(T, { root: true }))), '#0a0a10');
  // Page blanche : le blanc est le fond, un gris est une surface surélevée.
  assert.equal(E.formatColor(E.mapColor(c('#ffffff'), 'bg', ctx(T))), '#0a0a10');
  const L = (x) => E.rgbToOklch(E.mapColor(c(x), 'bg', ctx(T))).L;
  assert.ok(L('#f9fafb') > T.bgL + 0.03, 'gris très clair → surface visible');
  assert.ok(L('#e5e7eb') > L('#f9fafb'), 'gris plus soutenu → surface plus marquée');
  // Page grise + carte blanche : la carte se détache du fond.
  const grayPage = E.makePage(c('#f3f4f6'));
  const card = E.mapColor(c('#ffffff'), 'bg', E.contextFor(T, grayPage));
  assert.ok(E.rgbToOklch(card).L > T.bgL + 0.03);
  // Texte principal → clair du thème, texte secondaire plus discret mais lisible.
  const main = E.mapColor(c('#111827'), 'fg', ctx(T));
  const muted = E.mapColor(c('#6b7280'), 'fg', ctx(T));
  assert.ok(E.contrast(main, T.bg) > 14);
  assert.ok(E.contrast(muted, T.bg) >= 4.5 && E.contrast(muted, T.bg) < E.contrast(main, T.bg));
  // Bordure de tableau quasi invisible au départ : reste visible.
  assert.ok(E.contrast(E.mapColor(c('#e5e7eb'), 'border', ctx(T)), T.bg) >= 1.5);
  // Ombre/transparence noire d'un survol → voile clair.
  const hover = E.mapColor(c('rgba(0,0,0,0.05)'), 'bg', ctx(T));
  assert.ok(E.luminance(E.composite(hover, T.bg)) > E.luminance(T.bg));
});

test('thème clair : fond racine = fond du site, texte = notre sombre, contenu clair conservé', () => {
  const T = THEMES.light;
  assert.equal(E.formatColor(E.mapColor(c('#ffffff'), 'bg', ctx(T, { root: true }))), '#f7f7fa');
  assert.equal(E.formatColor(E.mapColor(c('#000000'), 'fg', ctx(T))), '#0f0e14');
  const kept = E.mapColor(c('#e5e7eb'), 'bg', ctx(T));
  assert.ok(Math.abs(E.rgbToOklch(kept).L - E.rgbToOklch(c('#e5e7eb')).L) < 0.01);
  const link = E.mapColor(c('#2563eb'), 'fg', ctx(T));
  assert.ok(E.contrast(link, T.bg) >= 4.5 && hueDist(hue(link), 207) < 25);
  // Page conçue sombre, affichée en clair : texte clair devenu foncé et lisible.
  const darkPage = E.makePage(c('#0f172a'));
  const t = E.mapColor(c('#e2e8f0'), 'fg', E.contextFor(T, darkPage, { srcBg: c('#0f172a') }));
  assert.ok(E.contrast(t, T.bg) >= 4.5 && E.luminance(t) < 0.2);
});

test('couleurs sourdes des gabarits de leçon : ramenées à la charte, beiges restés neutres', () => {
  // Palette réelle des leçons (--accent, --ok, --warn, --alert et leurs "-soft", --rule-2).
  assert.equal(E.isNeutral(E.rgbToOklch(c('#1f4e46'))), false, 'vert sapin = couleur');
  assert.equal(E.isNeutral(E.rgbToOklch(c('#efece5'))), true, 'beige de filet = neutre');
  assert.equal(E.isNeutral(E.rgbToOklch(c('#334155'))), true, 'slate-700 = neutre');
  for (const T of Object.values(THEMES)) {
    const btn = E.mapColor(c('#1f4e46'), 'bg', ctx(T, { control: true }));
    assert.ok(E.rgbToOklch(btn).C > 0.06 && hueDist(hue(btn), 170) < 20, 'bouton accent → menthe de la charte');
    const okSoft = E.mapColor(c('#eef4ef'), 'bg', ctx(T));
    assert.ok(E.rgbToOklch(okSoft).C >= 0.02, 'fond "correct" nettement teinté');
    const border = E.mapColor(c('#2c6a48'), 'border', ctx(T, { srcBg: c('#eef4ef'), tgtBg: okSoft }));
    const cr = E.contrast(border, okSoft);
    // Clair : ton moyen (≈3:1) plutôt que presque noir ; sombre : pastel de la charte.
    assert.ok(cr >= 1.5 && (T.dark || cr <= 3.3), `bordure colorée (${cr.toFixed(2)}) en ${T.dark ? 'sombre' : 'clair'}`);
    const warn = textOn(T, '#8a6519', '#faf4e7'), err = textOn(T, '#963428', '#fbf1ef'), ok = textOn(T, '#2c6a48', '#eef4ef');
    for (const x of [warn, err, ok]) assert.ok(x.cr >= 4.5);
    assert.ok(hueDist(hue(warn.fg), hue(err.fg)) >= 25 && hueDist(hue(ok.fg), hue(warn.fg)) >= 25);
  }
});

test('mapValue : dégradés, variables par rôle, alpha Tailwind, url() intactes', () => {
  const T = THEMES.dark;
  const vars = new Set(['--primary']);
  const base = ctx(T, { vars });
  const grad = E.mapValue('linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 'bg', base);
  const stops = E.scanColors(grad);
  assert.equal(stops.length, 2);
  assert.ok(stops.every((s) => hueDist(hue(s), 260) < 60));
  assert.equal(E.mapValue('var(--primary)', 'bg', base), 'var(--primary--lfia-bg)');
  assert.equal(E.mapValue('1px solid var(--primary, #fff)', 'border', base).startsWith('1px solid var(--primary--lfia-border,'), true);
  assert.equal(E.mapValue('var(--spacing)', 'bg', base), 'var(--spacing)');
  const tw = E.mapValue('rgb(59 130 246 / var(--tw-bg-opacity))', 'bg', base);
  assert.match(tw, /^rgb\(\d+ \d+ \d+ \/ var\(--tw-bg-opacity\)\)$/);
  // Bootstrap : triplet RVB en variable + alpha en variable.
  E.setTripletLookup((name) => (name === '--bs-success-rgb' ? '25, 135, 84' : ''));
  const bs = E.mapValue('rgba(var(--bs-success-rgb), var(--bs-bg-opacity))', 'bg', base);
  E.setTripletLookup(null);
  assert.match(bs, /^rgb\(\d+ \d+ \d+ \/ var\(--bs-bg-opacity\)\)$/);
  assert.ok(hueDist(hue(E.parseColor(bs.replace(/ \/ .*\)$/, ')'))), 152) < 20, bs);
  const img = 'linear-gradient(rgba(0,0,0,.5), rgba(0,0,0,.5)), url("hero.jpg")';
  assert.equal(E.mapValue(img, 'bg', base), img);
  assert.equal(E.mapValue('0 1px 2px rgba(0,0,0,0.1)', 'shadow', base), '0 1px 2px rgba(0,0,0,0.1)');
  assert.equal(E.mapValue('transparent', 'bg', base), 'transparent');
});

test('styles de base : fond racine imposé, liens et boutons natifs dans la charte', () => {
  for (const T of Object.values(THEMES)) {
    const css = E.buildBaseCss(T, WHITE_PAGE);
    assert.ok(css.includes(`background-color:${E.formatColor(T.bg)}!important`));
    assert.ok(css.includes(`color-scheme:${T.dark ? 'dark' : 'light'}`));
    assert.match(css, /:where\(button,/);
  }
});
