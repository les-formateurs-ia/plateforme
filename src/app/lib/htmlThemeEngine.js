// Moteur d'adaptation du HTML collé par les formateurs (Cours, Mission, Playground,
// exercices HTML) à la charte graphique et au thème clair/sombre du compte.
//
// Ce fichier est injecté TEL QUEL (import ?raw) dans les iframes sandboxées, via
// injectHtmlThemeWith() (htmlTheme.ts) : pas d'import, pas de TypeScript, il doit
// rester autonome. Le parent (useHtmlTheme.ts) lui envoie le thème par postMessage
// — et le renvoie à chaque changement de thème, sans recharger l'iframe (la saisie
// de l'élève et l'état des scripts du formateur sont conservés).
//
// Principe : on ne touche jamais au contenu ni à la mise en page, seulement aux
// couleurs.
//   - Feuilles <style> (et CSS de CDN, rapatriées en <style> quand le CDN le permet) :
//     réécrites via le CSSOM, règle par règle, donc :hover, ::before, classes de
//     validation ajoutées en JS, @keyframes… suivent automatiquement.
//   - Variables CSS : chaque variable de couleur reçoit une déclinaison par rôle
//     (--x--lfia-bg, --x--lfia-fg…) et chaque usage pointe vers la bonne — une même
//     variable peut servir de fond de bouton ET de couleur de texte.
//   - style="" et attributs SVG/HTML (fill, stroke, bgcolor…) : jamais modifiés ;
//     on génère des règles ciblant [data-lfia-i] pour que le JS du formateur qui
//     relit el.style.color retrouve ses propres valeurs.
//   - Enfin une passe de contraste sur le DOM réel (fond effectif des ancêtres)
//     corrige ce qu'une règle isolée ne pouvait pas deviner. Elle est relancée
//     sur mutation du DOM et sur interaction (survol, focus…).
// Les fonctions de couleur pures sont exposées pour les tests Node
// (scripts/html-theme.test.mjs), qui chargent ce fichier sans DOM.
(function (root) {
  "use strict";

  // ─── Analyse / formatage des couleurs ──────────────────────────────────

  const NAMED = {};
  ("aliceblue:f0f8ff antiquewhite:faebd7 aqua:00ffff aquamarine:7fffd4 azure:f0ffff beige:f5f5dc bisque:ffe4c4 black:000000 " +
    "blanchedalmond:ffebcd blue:0000ff blueviolet:8a2be2 brown:a52a2a burlywood:deb887 cadetblue:5f9ea0 chartreuse:7fff00 " +
    "chocolate:d2691e coral:ff7f50 cornflowerblue:6495ed cornsilk:fff8dc crimson:dc143c cyan:00ffff darkblue:00008b " +
    "darkcyan:008b8b darkgoldenrod:b8860b darkgray:a9a9a9 darkgreen:006400 darkgrey:a9a9a9 darkkhaki:bdb76b darkmagenta:8b008b " +
    "darkolivegreen:556b2f darkorange:ff8c00 darkorchid:9932cc darkred:8b0000 darksalmon:e9967a darkseagreen:8fbc8f " +
    "darkslateblue:483d8b darkslategray:2f4f4f darkslategrey:2f4f4f darkturquoise:00ced1 darkviolet:9400d3 deeppink:ff1493 " +
    "deepskyblue:00bfff dimgray:696969 dimgrey:696969 dodgerblue:1e90ff firebrick:b22222 floralwhite:fffaf0 forestgreen:228b22 " +
    "fuchsia:ff00ff gainsboro:dcdcdc ghostwhite:f8f8ff gold:ffd700 goldenrod:daa520 gray:808080 green:008000 greenyellow:adff2f " +
    "grey:808080 honeydew:f0fff0 hotpink:ff69b4 indianred:cd5c5c indigo:4b0082 ivory:fffff0 khaki:f0e68c lavender:e6e6fa " +
    "lavenderblush:fff0f5 lawngreen:7cfc00 lemonchiffon:fffacd lightblue:add8e6 lightcoral:f08080 lightcyan:e0ffff " +
    "lightgoldenrodyellow:fafad2 lightgray:d3d3d3 lightgreen:90ee90 lightgrey:d3d3d3 lightpink:ffb6c1 lightsalmon:ffa07a " +
    "lightseagreen:20b2aa lightskyblue:87cefa lightslategray:778899 lightslategrey:778899 lightsteelblue:b0c4de " +
    "lightyellow:ffffe0 lime:00ff00 limegreen:32cd32 linen:faf0e6 magenta:ff00ff maroon:800000 mediumaquamarine:66cdaa " +
    "mediumblue:0000cd mediumorchid:ba55d3 mediumpurple:9370db mediumseagreen:3cb371 mediumslateblue:7b68ee " +
    "mediumspringgreen:00fa9a mediumturquoise:48d1cc mediumvioletred:c71585 midnightblue:191970 mintcream:f5fffa " +
    "mistyrose:ffe4e1 moccasin:ffe4b5 navajowhite:ffdead navy:000080 oldlace:fdf5e6 olive:808000 olivedrab:6b8e23 " +
    "orange:ffa500 orangered:ff4500 orchid:da70d6 palegoldenrod:eee8aa palegreen:98fb98 paleturquoise:afeeee " +
    "palevioletred:db7093 papayawhip:ffefd5 peachpuff:ffdab9 peru:cd853f pink:ffc0cb plum:dda0dd powderblue:b0e0e6 " +
    "purple:800080 rebeccapurple:663399 red:ff0000 rosybrown:bc8f8f royalblue:4169e1 saddlebrown:8b4513 salmon:fa8072 " +
    "sandybrown:f4a460 seagreen:2e8b57 seashell:fff5ee sienna:a0522d silver:c0c0c0 skyblue:87ceeb slateblue:6a5acd " +
    "slategray:708090 slategrey:708090 snow:fffafa springgreen:00ff7f steelblue:4682b4 tan:d2b48c teal:008080 thistle:d8bfd8 " +
    "tomato:ff6347 turquoise:40e0d0 violet:ee82ee wheat:f5deb3 white:ffffff whitesmoke:f5f5f5 yellow:ffff00 yellowgreen:9acd32")
    .split(" ").forEach((pair) => { const i = pair.indexOf(":"); NAMED[pair.slice(0, i)] = pair.slice(i + 1); });

  const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);
  const WHITE = { r: 255, g: 255, b: 255, a: 1 };
  const has = (o, k) => Object.prototype.hasOwnProperty.call(o, k);

  function parseHex(s) {
    let h = s.slice(1);
    if (!/^[0-9a-f]+$/i.test(h)) return null;
    if (h.length === 3 || h.length === 4) h = h.split("").map((c) => c + c).join("");
    if (h.length !== 6 && h.length !== 8) return null;
    return {
      r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16),
      a: h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1,
    };
  }

  function topLevelIndex(s, ch) {
    let depth = 0;
    for (let i = 0; i < s.length; i++) {
      const c = s[i];
      if (c === "(") depth++;
      else if (c === ")") depth--;
      else if (c === ch && depth === 0) return i;
    }
    return -1;
  }

  // "50%" → 50 * scale / 100 ; "0.5" → 0.5.
  function num(s, pctScale) {
    const v = parseFloat(s);
    if (!isFinite(v)) return NaN;
    return /%$/.test(s) ? (v * pctScale) / 100 : v;
  }

  function parseHue(s) {
    if (s === "none") return 0;
    let v = parseFloat(s);
    if (!isFinite(v)) return NaN;
    if (/turn$/i.test(s)) v *= 360;
    else if (/grad$/i.test(s)) v *= 0.9;
    else if (/rad$/i.test(s)) v *= 180 / Math.PI;
    return ((v % 360) + 360) % 360;
  }

  function hslToRgb(h, s, l) {
    s = clamp(s, 0, 1); l = clamp(l, 0, 1);
    const k = (n) => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return { r: f(0) * 255, g: f(8) * 255, b: f(4) * 255 };
  }

  // rgb()/hsl()/oklch()/oklab(), syntaxes virgules ou espaces. Un alpha non
  // littéral (Tailwind : "rgb(59 130 246 / var(--tw-bg-opacity))") est conservé
  // tel quel dans alphaExpr et la couleur est traitée comme opaque.
  function splitTopLevel(s, ch) {
    const out = [];
    let depth = 0, start = 0;
    for (let i = 0; i < s.length; i++) {
      const c = s[i];
      if (c === "(") depth++;
      else if (c === ")") depth--;
      else if (c === ch && depth === 0) { out.push(s.slice(start, i)); start = i + 1; }
    }
    out.push(s.slice(start));
    return out;
  }

  function parseFunc(fn, body) {
    let main = body, alphaStr = null;
    const slash = topLevelIndex(body, "/");
    if (slash >= 0) { main = body.slice(0, slash); alphaStr = body.slice(slash + 1).trim(); }
    else {
      const parts = splitTopLevel(body, ",");
      if (parts.length === 4) { main = parts.slice(0, 3).join(","); alphaStr = parts[3].trim(); }
    }
    if (/[a-z]\(/i.test(main)) return null;
    const parts = main.split(/[\s,]+/).filter(Boolean);
    if (alphaStr === null && parts.length === 4) alphaStr = parts.pop();
    if (parts.length !== 3) return null;
    let a = 1, alphaExpr = null;
    if (alphaStr) {
      if (/[a-z]\(/i.test(alphaStr)) alphaExpr = alphaStr;
      else { a = num(alphaStr, 1); if (isNaN(a)) return null; a = clamp(a, 0, 1); }
    }
    let rgb;
    if (fn === "rgb" || fn === "rgba") {
      const ch = parts.map((p) => num(p, 255));
      if (ch.some(isNaN)) return null;
      rgb = { r: ch[0], g: ch[1], b: ch[2] };
    } else if (fn === "hsl" || fn === "hsla") {
      const h = parseHue(parts[0]);
      const pct = (p) => { const v = num(p, 1); return /%$/.test(p) ? v : v / 100; };
      const s = pct(parts[1]), l = pct(parts[2]);
      if ([h, s, l].some(isNaN)) return null;
      rgb = hslToRgb(h, s, l);
    } else if (fn === "oklch") {
      const L = num(parts[0], 1), C = num(parts[1], 0.4), h = parseHue(parts[2]);
      if ([L, C, h].some(isNaN)) return null;
      rgb = oklchToRgb(L, C, h);
    } else if (fn === "oklab") {
      const L = num(parts[0], 1), A = num(parts[1], 0.4), B = num(parts[2], 0.4);
      if ([L, A, B].some(isNaN)) return null;
      rgb = oklchToRgb(L, Math.hypot(A, B), (Math.atan2(B, A) * 180) / Math.PI);
    } else return null;
    return { r: clamp(rgb.r, 0, 255), g: clamp(rgb.g, 0, 255), b: clamp(rgb.b, 0, 255), a, alphaExpr };
  }

  function parseColor(str) {
    if (!str) return null;
    const s = String(str).trim().toLowerCase();
    if (!s) return null;
    if (s === "transparent") return { r: 0, g: 0, b: 0, a: 0 };
    if (s[0] === "#") return parseHex(s);
    const m = /^(rgba?|hsla?|oklch|oklab)\((.*)\)$/.exec(s);
    if (m) return parseFunc(m[1], m[2]);
    if (has(NAMED, s)) return parseHex("#" + NAMED[s]);
    return null;
  }

  const hex2 = (v) => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, "0");
  function formatColor(c) {
    const r = Math.round(clamp(c.r, 0, 255)), g = Math.round(clamp(c.g, 0, 255)), b = Math.round(clamp(c.b, 0, 255));
    if (c.alphaExpr) return "rgb(" + r + " " + g + " " + b + " / " + c.alphaExpr + ")";
    if (c.a === undefined || c.a >= 0.999) return "#" + hex2(r) + hex2(g) + hex2(b);
    return "rgba(" + r + ", " + g + ", " + b + ", " + Math.round(c.a * 1000) / 1000 + ")";
  }

  // ─── Espaces colorimétriques (OKLCH) et contraste WCAG ─────────────────

  const toLin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
  const fromLin = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055) * 255;

  function rgbToOklch(c) {
    const r = toLin(c.r), g = toLin(c.g), b = toLin(c.b);
    const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
    const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
    const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
    const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
    const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
    const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
    return { L, C: Math.hypot(A, B), h: ((Math.atan2(B, A) * 180) / Math.PI + 360) % 360 };
  }

  function oklchToLinear(L, C, h) {
    const hr = (h * Math.PI) / 180, A = C * Math.cos(hr), B = C * Math.sin(hr);
    const l = Math.pow(L + 0.3963377774 * A + 0.2158037573 * B, 3);
    const m = Math.pow(L - 0.1055613458 * A - 0.0638541728 * B, 3);
    const s = Math.pow(L - 0.0894841775 * A - 1.291485548 * B, 3);
    return [
      4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
      -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
      -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
    ];
  }
  const inGamut = (v) => v.every((x) => x >= -1e-4 && x <= 1 + 1e-4);

  // Hors gamut sRGB : on réduit la chroma (teinte et luminosité conservées).
  function oklchToRgb(L, C, h) {
    L = clamp(L, 0, 1);
    let lin = oklchToLinear(L, C, h);
    if (!inGamut(lin)) {
      let lo = 0, hi = C;
      for (let i = 0; i < 22; i++) { const mid = (lo + hi) / 2; if (inGamut(oklchToLinear(L, mid, h))) lo = mid; else hi = mid; }
      lin = oklchToLinear(L, lo, h);
    }
    return { r: fromLin(clamp(lin[0], 0, 1)), g: fromLin(clamp(lin[1], 0, 1)), b: fromLin(clamp(lin[2], 0, 1)), a: 1 };
  }

  const luminance = (c) => 0.2126 * toLin(c.r) + 0.7152 * toLin(c.g) + 0.0722 * toLin(c.b);
  function contrast(a, b) {
    const x = luminance(a), y = luminance(b);
    return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
  }
  function composite(fg, bg) {
    const a = fg.a === undefined ? 1 : fg.a;
    return { r: fg.r * a + bg.r * (1 - a), g: fg.g * a + bg.g * (1 - a), b: fg.b * a + bg.b * (1 - a), a: 1 };
  }
  function average(colors, over) {
    const list = colors.map((c) => composite(c, over));
    const n = list.length || 1;
    return list.reduce((acc, c) => ({ r: acc.r + c.r / n, g: acc.g + c.g / n, b: acc.b + c.b / n, a: 1 }), { r: 0, g: 0, b: 0, a: 1 });
  }
  const isDarkColor = (c) => rgbToOklch(c).L < 0.6;

  // Couleur "neutre" (gris, blanc cassé, ardoise…) : seuil de chroma qui suit la
  // luminosité — un bleu-50 (C≈0.014) reste bleu, un slate-50 (C≈0.003) est gris.
  function isNeutral(lch) {
    return lch.C < Math.max(0.006, 0.065 * (1 - Math.pow(2 * lch.L - 1, 2)));
  }

  // ─── Charte graphique ───────────────────────────────────────────────────
  // Teintes OKLCH de la charte : corail #fbc2ad (41°), doré #fceccd (84°),
  // menthe #6adeb1 (166°), bleu #78d5e2 (207°), violet #b58de0 (306°), lilas
  // #dbacf0 (315°). Le vert "succès" (152°) est dérivé de la menthe.

  const NEUTRAL_H = 286; // teinte des neutres du site (#0A0A10, #F7F7FA)
  const DARK_TEXT = { r: 15, g: 14, b: 20, a: 1 }; // #0F0E14

  // Teinte source → teinte charte (linéaire par morceaux, ordre préservé pour que
  // deux rouges différents restent deux coraux différents). Rouges/roses → corail
  // rouge (erreur), orangés → corail, ambres/jaunes → doré (avertissement :
  // la frontière est placée pour que amber-500/700 ne rejoignent pas le corail),
  // verts → vert succès, sarcelles → menthe, cyans/bleus → bleu de la charte,
  // indigos/violets → violet, fuchsias/roses vifs → lilas.
  const HUE_MAP = [
    [0, 30], [25, 32], [49, 42], [53, 70], [70, 80], [100, 86], [118, 120], [135, 148], [150, 152],
    [168, 162], [185, 176], [200, 200], [215, 206], [258, 212], [266, 222], [272, 294], [294, 303],
    [306, 306], [322, 313], [340, 320], [352, 328], [358, 332], [360, 390],
  ];
  // Par teinte cible : [teinte, luminosité d'aplat, chroma "vive"]. Les aplats
  // (boutons, pastilles) prennent les tons pastel de la charte.
  const FAMILIES = [
    [30, 0.78, 0.125],  // corail rouge (erreur)
    [41, 0.84, 0.095],  // corail
    [80, 0.87, 0.125],  // doré (avertissement)
    [152, 0.8, 0.145],  // vert succès
    [166, 0.82, 0.125], // menthe
    [207, 0.82, 0.095], // bleu
    [306, 0.72, 0.125], // violet
    [315, 0.81, 0.105], // lilas
  ];

  // Les ambres virent au rouge en fonçant (amber-800 ≈ 46°, orange-500 ≈ 48°) :
  // la frontière corail/doré suit donc la luminosité. Elle est ramenée sur le
  // saut 49→53° de HUE_MAP, avec un poids qui s'annule hors de la zone orangée.
  function mapHue(h, L) {
    if (L !== undefined && h > 25 && h < 80) {
      const edge = clamp(42 + (L - 0.47) * 60, 41, 62);
      const w = h < 35 ? (h - 25) / 10 : h > 65 ? (80 - h) / 15 : 1;
      h += (51 - edge) * w;
    }
    for (let i = 0; i < HUE_MAP.length - 1; i++) {
      const [x0, y0] = HUE_MAP[i], [x1, y1] = HUE_MAP[i + 1];
      if (h >= x0 && h <= x1) return ((y0 + ((h - x0) / (x1 - x0)) * (y1 - y0)) % 360 + 360) % 360;
    }
    return h;
  }

  function famAt(h) {
    const pts = FAMILIES.concat([[FAMILIES[0][0] + 360, FAMILIES[0][1], FAMILIES[0][2]]]);
    if (h < pts[0][0]) h += 360;
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1];
      if (h >= a[0] && h <= b[0]) {
        const t = (h - a[0]) / (b[0] - a[0]);
        return { L: a[1] + t * (b[1] - a[1]), C: a[2] + t * (b[2] - a[2]) };
      }
    }
    return { L: 0.8, C: 0.1 };
  }

  // ─── Thème et contexte ──────────────────────────────────────────────────

  function createTheme(cfg) {
    cfg = cfg || {};
    const dark = !!cfg.dark;
    const base = parseColor(cfg.bg);
    const bg = base ? composite(base, dark ? { r: 10, g: 10, b: 16, a: 1 } : WHITE) : dark ? { r: 10, g: 10, b: 16, a: 1 } : WHITE;
    const over = (v, fb) => { const c = parseColor(v); return c ? composite(c, bg) : fb; };
    const text = dark ? over(cfg.fg, { r: 240, g: 240, b: 242, a: 1 }) : DARK_TEXT;
    const T = {
      dark, bg, text,
      bgL: rgbToOklch(bg).L,
      card: over(cfg.card, bg),
      sep: over(cfg.sep, bg),
      muted: over(cfg.fg3, text),
      inputBg: over(cfg.inputBg, bg),
      accent1: parseColor(cfg.accent1) || parseColor("#b58de0"),
      accent2: parseColor(cfg.accent2) || parseColor("#dbacf0"),
    };
    // Bornes des textes : notre sombre #0F0E14 et, côté clair, le texte du
    // thème sombre (ou blanc en thème clair, pour un texte posé sur un aplat foncé).
    T.darkL = rgbToOklch(DARK_TEXT).L;
    T.lightL = dark ? rgbToOklch(text).L : 1;
    return T;
  }

  const makePage = (rgb) => { const L = rgbToOklch(rgb).L; return { src: rgb, L, light: L >= 0.6 }; };

  function contextFor(T, page, extra) {
    const ctx = { T, page, srcBg: page.src, tgtBg: T.bg, vars: new Set() };
    if (extra) Object.keys(extra).forEach((k) => { if (extra[k] !== undefined) ctx[k] = extra[k]; });
    return ctx;
  }

  // ─── Correspondance des couleurs ────────────────────────────────────────

  // Fonds neutres : en sombre, toute surface distincte du fond de page (carte
  // blanche sur page grise, panneau gris sur page blanche, bloc de code noir…)
  // devient une surface légèrement plus claire que le fond, d'autant plus que
  // l'écart d'origine était grand — la hiérarchie des cartes est conservée.
  function mapNeutralBg(lch, ctx) {
    const T = ctx.T, page = ctx.page;
    const d = lch.L - page.L;
    if (Math.abs(d) < 0.012) return Object.assign({}, T.bg);
    let L;
    if (T.dark) {
      if (page.light) L = T.bgL + 0.04 + Math.min(Math.abs(d), 0.5) * 0.22;
      else {
        L = clamp(T.bgL + d, Math.max(0.08, T.bgL - 0.06), T.bgL + 0.2);
        if (Math.abs(L - T.bgL) < 0.03) L = T.bgL + (d >= 0 || T.bgL < 0.11 ? 0.03 : -0.03);
      }
      return oklchToRgb(L, 0.008, NEUTRAL_H);
    }
    if (page.light) return oklchToRgb(lch.L, Math.min(lch.C, 0.01), lch.C < 0.002 ? NEUTRAL_H : lch.h);
    L = d > 0 ? Math.min(1, T.bgL + 0.03 + d * 0.3) : T.bgL - (0.03 + Math.min(-d, 0.5) * 0.25);
    return oklchToRgb(L, 0.006, NEUTRAL_H);
  }

  // Fonds colorés. Teintes très claires (fond d'alerte, surlignage) → teinte
  // douce de la charte, foncée en thème sombre ; aplats (boutons, badges,
  // en-têtes) → ton pastel de la charte, les écarts de nuance (hover…) conservés.
  function mapChromaBg(lch, ctx) {
    const T = ctx.T;
    const h = mapHue(lch.h, lch.L), fam = famAt(h);
    const rel = clamp(lch.C / 0.16, 0.2, 1.1);
    let tint = !ctx.control && !ctx.fillMode && lch.L >= 0.87;
    if (ctx.gradTint !== undefined && !ctx.control && !ctx.fillMode) tint = ctx.gradTint;
    let L, C;
    if (tint) {
      if (T.dark) { L = T.bgL + 0.055 + (1 - Math.min(lch.L, 1)) * 0.55; C = clamp(lch.C * 1.6, 0.03, 0.065); }
      else { L = Math.max(lch.L, 0.9); C = Math.min(Math.max(lch.C, 0.012), fam.C * 0.7); }
    } else {
      L = clamp(fam.L + (lch.L - 0.64) * 0.35, 0.5, 0.92);
      C = fam.C * rel;
    }
    return oklchToRgb(L, C, h);
  }

  // Formes SVG colorées, accent-color… : aplat de la charte, assez contrasté
  // sur le fond pour rester lisible comme élément graphique.
  function mapDecor(lch, ctx) {
    const T = ctx.T;
    const out = mapChromaBg(lch, Object.assign({}, ctx, { fillMode: true }));
    if (contrast(out, T.bg) >= 1.6) return out;
    const o = rgbToOklch(out);
    return oklchToRgb(fitL(o.h, o.C, T.bg, 1.6, T.dark, T).L, o.C, o.h);
  }

  // Cherche, du côté demandé (plus clair / plus foncé que le fond), la
  // luminosité la plus proche du fond qui atteint le contraste voulu.
  function fitL(h, C, bg, want, lighter, T) {
    const ext = lighter ? T.lightL : T.darkL;
    const crExt = contrast(oklchToRgb(ext, C, h), bg);
    if (crExt <= want) return { L: ext, cr: crExt };
    let near = rgbToOklch(bg).L, far = ext;
    for (let i = 0; i < 22; i++) {
      const mid = (near + far) / 2;
      if (contrast(oklchToRgb(mid, C, h), bg) >= want) far = mid; else near = mid;
    }
    return { L: far, cr: contrast(oklchToRgb(far, C, h), bg) };
  }

  // Côté préféré d'abord ; s'il ne permet même pas le minimum (texte clair sur un
  // aplat pastel…), on bascule de côté : le texte est choisi au contraste.
  function pickL(h, C, bg, want, minCR, lighter, T) {
    const a = fitL(h, C, bg, want, lighter, T);
    if (a.cr >= Math.min(want, minCR) - 0.01) return { L: a.L, lighter };
    const b = fitL(h, C, bg, want, !lighter, T);
    if (b.cr >= minCR - 0.01) return { L: b.L, lighter: !lighter };
    return a.cr >= b.cr ? { L: a.L, lighter } : { L: b.L, lighter: !lighter };
  }

  // Textes, bordures, icônes. On conserve le contraste d'origine (texte
  // principal / secondaire / discret restent hiérarchisés) avec un minimum
  // (4,5:1 texte, 1,5:1 séparateurs, 3:1 champs de formulaire), et on inverse
  // le sens clair/foncé seulement si le fond a lui-même changé de polarité.
  function mapFg(c, lch, neutral, role, ctx) {
    const T = ctx.T;
    const minCR = ctx.minCR != null ? ctx.minCR : role === "fg" ? 4.5 : role === "border" ? 1.5 : 1;
    const srcLighter = luminance(c) >= luminance(ctx.srcBg);
    const flipped = isDarkColor(ctx.srcBg) !== isDarkColor(ctx.tgtBg);
    const lighter = flipped ? !srcLighter : srcLighter;
    // Texte blanc sur bouton vif devenu pastel : l'intention était "le plus
    // lisible possible", on vise 7:1 plutôt que le seul contraste d'origine.
    const want = Math.max(contrast(c, ctx.srcBg), minCR, flipped && role === "fg" ? 7 : 0);
    let h, C, fam = null;
    if (neutral) { h = NEUTRAL_H; C = Math.min(lch.C, 0.012); }
    else { h = mapHue(lch.h, lch.L); fam = famAt(h); C = 0.15 * clamp(lch.C / 0.16, 0.25, 1); }
    const pick = pickL(h, C, ctx.tgtBg, want, minCR, lighter, T);
    let L = pick.L;
    // Texte neutre poussé à l'extrême : exactement nos couleurs de texte.
    if (neutral && L <= T.darkL + 1e-4) return Object.assign({}, DARK_TEXT);
    if (neutral && T.dark && L >= T.lightL - 1e-4) return Object.assign({}, T.text);
    // Accents colorés en thème sombre : tons pastel de la charte.
    if (fam && T.dark && pick.lighter) L = Math.max(L, fam.L - 0.02);
    return oklchToRgb(L, C, h);
  }

  // Couleur finale X d'opacité ≥ a telle que X posé sur B donne T.
  function solveAlpha(target, B, a) {
    let need = a;
    ["r", "g", "b"].forEach((k) => {
      const d = target[k] - B[k];
      if (d > 0) need = Math.max(need, d / (255 - B[k] || 1));
      else if (d < 0) need = Math.max(need, -d / (B[k] || 1));
    });
    need = Math.min(1, need);
    return { r: B.r + (target.r - B.r) / need, g: B.g + (target.g - B.g) / need, b: B.b + (target.b - B.b) / need, a: need };
  }

  // role : "bg" (fonds), "fg" (texte), "border" (bordures, traits), "decor"
  // (formes SVG, accent-color), "shadow" (ombres : teinte seulement).
  function mapColor(c, role, ctx) {
    if (!c || c.a <= 0.001) return c;
    const T = ctx.T;
    if (role === "shadow") {
      const lch = rgbToOklch(c);
      if (isNeutral(lch)) return c;
      const h = mapHue(lch.h, lch.L);
      const out = oklchToRgb(lch.L, Math.min(lch.C, famAt(h).C * 1.2), h);
      out.a = c.a;
      return out;
    }
    if (role === "bg" && ctx.root) return Object.assign({}, T.bg);
    const srcBack = role === "bg" ? ctx.page.src : ctx.srcBg;
    const tgtBack = role === "bg" ? T.bg : ctx.tgtBg;
    const opaque = c.a < 1 ? composite(c, srcBack) : { r: c.r, g: c.g, b: c.b, a: 1 };
    const lch = rgbToOklch(opaque);
    const neutral = isNeutral(lch);
    let out;
    if (role === "bg") out = neutral ? mapNeutralBg(lch, ctx) : mapChromaBg(lch, ctx);
    else if (role === "decor" && !neutral) out = mapDecor(lch, ctx);
    else out = mapFg(opaque, lch, neutral, role, ctx);
    if (c.a < 1) return solveAlpha(out, tgtBack, c.a);
    out.a = 1;
    return out;
  }

  // ─── Réécriture des valeurs CSS ─────────────────────────────────────────

  const COLOR_FN = /^(rgba?|hsla?|oklch|oklab)$/;
  const isIdentChar = (c) => /[\w-]/.test(c);

  function matchParen(s, open) {
    let depth = 0, quote = null;
    for (let i = open; i < s.length; i++) {
      const c = s[i];
      if (quote) { if (c === quote && s[i - 1] !== "\\") quote = null; continue; }
      if (c === '"' || c === "'") quote = c;
      else if (c === "(") depth++;
      else if (c === ")" && --depth === 0) return i;
    }
    return -1;
  }

  // Parcourt une valeur CSS et remplace chaque couleur (hex, fonctions, noms)
  // par onColor(couleur) ; les url(...) et chaînes sont recopiées telles quelles,
  // les var(--x) de couleur redirigées vers leur déclinaison de rôle.
  function rewrite(v, onColor, role, ctx) {
    let out = "", i = 0;
    const n = v.length;
    while (i < n) {
      const ch = v[i];
      if (ch === '"' || ch === "'") {
        let j = i + 1;
        while (j < n && (v[j] !== ch || v[j - 1] === "\\")) j++;
        out += v.slice(i, j + 1); i = j + 1; continue;
      }
      if (/[a-zA-Z_-]/.test(ch) && (i === 0 || !isIdentChar(v[i - 1]))) {
        let j = i;
        while (j < n && isIdentChar(v[j])) j++;
        const ident = v.slice(i, j).toLowerCase();
        if (v[j] === "(") {
          const close = matchParen(v, j);
          if (close < 0) { out += v.slice(i); break; }
          const inner = v.slice(j + 1, close);
          if (ident === "url") out += v.slice(i, close + 1);
          else if (ident === "var") out += rewriteVar(inner, onColor, role, ctx);
          else if (COLOR_FN.test(ident)) {
            const c = parseColor(ident + "(" + inner + ")") || parseColor(ident + "(" + resolveTriplets(inner) + ")");
            out += c ? onColor(c, v.slice(i, close + 1)) : v.slice(i, close + 1);
          } else out += v.slice(i, j + 1) + rewrite(inner, onColor, role, ctx) + ")";
          i = close + 1; continue;
        }
        if (has(NAMED, ident)) out += onColor(parseColor(ident), v.slice(i, j));
        else out += v.slice(i, j);
        i = j; continue;
      }
      if (ch === "#") {
        const m = /^#[0-9a-fA-F]{3,8}(?![\w-])/.exec(v.slice(i));
        const c = m && parseHex(m[0]);
        if (c) { out += onColor(c, m[0]); i += m[0].length; continue; }
      }
      out += ch; i++;
    }
    return out;
  }

  // Bootstrap : rgba(var(--bs-success-rgb), var(--bs-bg-opacity)) avec
  // --bs-success-rgb: 25,135,84. La variable "triplet" est résolue (valeur
  // définie à la racine) pour obtenir une couleur adaptable ; l'alpha en var()
  // est conservé. Sans DOM (tests), tripletLookup est fourni par setTripletLookup.
  let tripletLookup = null;
  function resolveTriplets(inner) {
    if (!tripletLookup || inner.indexOf("var(") < 0) return inner;
    const [main, ...rest] = splitTopLevel(inner, ",");
    const resolved = main.replace(/var\(\s*(--[\w-]+)\s*\)/g, (m, name) => {
      const v = String(tripletLookup(name) || "").trim();
      return /^\d{1,3}(\s*,\s*|\s+)\d{1,3}(\s*,\s*|\s+)\d{1,3}$/.test(v) ? v.replace(/\s+/g, " ").replace(/ ?, ?/g, ",") : m;
    });
    return [resolved].concat(rest).join(",");
  }

  function rewriteVar(inner, onColor, role, ctx) {
    const comma = topLevelIndex(inner, ",");
    const name = (comma < 0 ? inner : inner.slice(0, comma)).trim();
    const fb = comma < 0 ? "" : "," + rewrite(inner.slice(comma + 1), onColor, role, ctx);
    const vars = ctx && ctx.vars;
    if (role && vars && vars.has(name)) return "var(" + name + "--lfia-" + role + fb + ")";
    return "var(" + name + fb + ")";
  }

  function scanColors(v) {
    const list = [];
    rewrite(v, (c, raw) => { list.push(c); return raw; }, null, null);
    return list;
  }

  function mapValue(v, role, ctx) {
    if (!v) return v;
    // Dégradé d'assombrissement posé sur une image : il est pensé pour l'image, on n'y touche pas.
    if (role === "bg" && /url\(/i.test(v)) return v;
    let c2 = ctx;
    if (role === "bg" && /gradient\(/i.test(v)) {
      const cols = scanColors(v).filter((c) => c.a > 0.05);
      if (cols.length) {
        const avgL = cols.reduce((s, c) => s + rgbToOklch(composite(c, ctx.page.src)).L, 0) / cols.length;
        c2 = Object.assign({}, ctx, { gradTint: avgL >= 0.87 });
      }
    }
    return rewrite(v, (c, raw) => {
      const m = mapColor(c, role, c2);
      if (m === c) return raw;
      if (c.alphaExpr) { m.alphaExpr = c.alphaExpr; m.a = 1; }
      return formatColor(m);
    }, role, c2);
  }

  // Meilleur texte (notre sombre ou le clair du thème) sur un ou plusieurs fonds.
  function bestText(T, bgs) {
    const light = T.dark ? T.text : WHITE;
    const score = (c) => Math.min.apply(null, bgs.map((b) => contrast(c, b)));
    return score(DARK_TEXT) >= score(light) ? DARK_TEXT : light;
  }

  function pickNeutral(T, bg, want) {
    const r = pickL(NEUTRAL_H, 0.006, bg, want, want, isDarkColor(bg), T);
    return oklchToRgb(r.L, 0.006, NEUTRAL_H);
  }

  // Styles de base, en spécificité nulle (:where) : ils ne s'appliquent qu'à ce
  // que le formateur n'a pas stylé lui-même (texte par défaut, liens, boutons et
  // champs natifs, tableaux border="1"…). Seul le fond racine est imposé.
  function buildBaseCss(T, page) {
    const ctx = contextFor(T, page);
    const m = (hex, role) => formatColor(mapColor(parseColor(hex), role, ctx));
    const f = formatColor;
    const accent = f(T.accent1);
    return [
      ":root{color-scheme:" + (T.dark ? "dark" : "light") + ";accent-color:" + accent + ";}",
      ":root:not(#lfia-root),:root:not(#lfia-root)>body{background-color:" + f(T.bg) + "!important;background-image:none!important;}",
      ":where(:root){color:" + f(T.text) + ";}",
      ":where(a:link){color:" + m("#0000ee", "fg") + ";}",
      ":where(a:visited){color:" + m("#551a8b", "fg") + ";}",
      ":where(mark){background-color:" + m("#ffff00", "bg") + ";color:inherit;}",
      ":where(hr){border-color:" + f(pickNeutral(T, T.bg, 1.6)) + ";}",
      ":where(table[border],table[border] th,table[border] td){border-color:" + f(pickNeutral(T, T.bg, 1.8)) + ";}",
      ":where(button,input[type=button],input[type=submit],input[type=reset]){background-color:" + accent +
        ";border-color:" + accent + ";color:" + f(bestText(T, [T.accent1, T.accent2])) + ";}",
      ":where(input:not([type=checkbox],[type=radio],[type=range],[type=color],[type=button],[type=submit],[type=reset],[type=image],[type=file]),textarea,select){background-color:" +
        f(T.inputBg) + ";color:" + f(T.text) + ";border-color:" + f(pickNeutral(T, T.inputBg, 3)) + ";}",
      ":where(input,textarea)::placeholder{color:" + f(pickNeutral(T, T.inputBg, 3.5)) + ";}",
    ].join("\n");
  }

  const api = {
    parseColor, formatColor, contrast, luminance, composite, rgbToOklch, oklchToRgb, isNeutral,
    mapHue, famAt, createTheme, makePage, contextFor, mapColor, mapValue, scanColors, buildBaseCss,
    ensureContrast,
    setTripletLookup: (fn) => { tripletLookup = fn; },
  };
  root.__lfiaHtmlTheme = api;

  // Texte illisible sur son fond réel : même teinte, luminosité ajustée.
  function ensureContrast(fg, bg, want, T) {
    const lch = rgbToOklch(fg);
    const neutral = isNeutral(lch);
    const h = neutral ? NEUTRAL_H : lch.h;
    const C = neutral ? Math.min(lch.C, 0.012) : Math.max(lch.C, 0.05);
    const r = pickL(h, C, bg, want, want, luminance(fg) >= luminance(bg), T);
    return oklchToRgb(r.L, C, h);
  }

  if (typeof document === "undefined" || typeof window === "undefined" || !document.documentElement) return;

  // ─── Application au document ────────────────────────────────────────────

  const HTML_NS = "http://www.w3.org/1999/xhtml";
  const docEl = document.documentElement;
  const script = document.currentScript;
  const channel = script ? script.getAttribute("data-lfia-channel") : null;
  const OWN_STYLES = /^lfia-(pre|base|inline|fix|notrans)$/;
  const ROLES = ["bg", "fg", "border", "decor", "shadow"];
  const VAR_SHORTHANDS = [
    ["background", "bg"], ["border", "border"], ["border-top", "border"], ["border-right", "border"],
    ["border-bottom", "border"], ["border-left", "border"], ["border-color", "border"], ["border-block", "border"],
    ["border-inline", "border"], ["outline", "border"], ["column-rule", "border"], ["text-decoration", "fg"],
  ];
  // Attributs de présentation → propriété CSS équivalente.
  const HINT_ATTRS = {
    fill: "fill", stroke: "stroke", "stop-color": "stop-color", "flood-color": "flood-color",
    "lighting-color": "lighting-color", color: "color", bgcolor: "background-color", text: "color",
  };
  const HINT_SELECTOR = "[style],[fill],[stroke],[stop-color],[flood-color],[lighting-color],font[color],[bgcolor],body[text]";
  const SKIP_TAGS = { SCRIPT: 1, STYLE: 1, HEAD: 1, TITLE: 1, META: 1, LINK: 1, NOSCRIPT: 1, TEMPLATE: 1, BR: 1, IMG: 1, VIDEO: 1, CANVAS: 1, IFRAME: 1, OBJECT: 1, EMBED: 1 };
  // Boutons / pastilles : leur fond clair reste un aplat de la charte. Champs de
  // saisie : fond traité comme une surface (un input.invalid rose pâle reste une
  // teinte douce, foncée en sombre), mais bordure à 3:1 comme les boutons.
  const CONTROL_RE = /(^|[^\w-])button([^\w-]|$)|btn|bouton|badge|chip|pill|\[type=["']?(submit|button|reset)/i;
  const FIELD_RE = /(^|[^\w-])(input|select|textarea)([^\w-]|$)/i;
  const TEXT_FIELD = /^(|text|email|number|password|search|tel|url|date|time|datetime-local|month|week)$/;

  let cfg = null, T = null, page = null, domReady = false, observer = null, seq = 0;
  let baseStyle = null, inlineStyle = null, fixStyle = null;
  const declRecs = new WeakMap();   // CSSStyleDeclaration (feuilles) → valeurs d'origine
  const colorVars = new Set();      // variables CSS qui portent une couleur
  const inlineDecls = new Map();    // élément → règles générées pour style="" / attributs
  const inPlace = new Map();        // élément → propriétés style="… !important" réécrites en place
  const fixDecls = new Map();       // élément → corrections de contraste
  const idOwners = new Map();
  const mediaOrig = new WeakMap();
  const handledLinks = new WeakSet();

  const isOurs = (n) => n && n.nodeType === 1 && n.hasAttribute("data-platform-injected");
  const report = (e) => { try { console.warn("[thème HTML]", e); } catch (_) { /* rien */ } };
  // Nos seules écritures observables par le MutationObserver sont les styles
  // !important réécrits en place : on vide sa file juste après.
  const flushOwn = () => { if (observer) observer.takeRecords(); };

  function idOf(el) {
    let id = el.getAttribute("data-lfia-i");
    if (!id || (idOwners.has(id) && idOwners.get(id) !== el)) { id = String(++seq); el.setAttribute("data-lfia-i", id); }
    idOwners.set(id, el);
    return id;
  }

  function mountStyles() {
    if (baseStyle && baseStyle.isConnected) return;
    const head = document.head || docEl;
    let ref = head.firstChild;
    const pre = head.querySelector('style[data-platform-injected="lfia-pre"]');
    if (pre) ref = pre.nextSibling;
    [baseStyle, inlineStyle, fixStyle] = ["base", "inline", "fix"].map((kind) => {
      const s = document.createElement("style");
      s.setAttribute("data-platform-injected", "lfia-" + kind);
      head.insertBefore(s, ref);
      ref = s.nextSibling;
      return s;
    });
  }

  function walkRules(rules, fn) {
    for (let i = 0; i < rules.length; i++) {
      const r = rules[i];
      if (r.type === 3) { try { if (r.styleSheet) walkRules(r.styleSheet.cssRules, fn); } catch (e) { /* @import d'un autre domaine */ } continue; }
      if (r.type === 4) handleMedia(r);
      if (r.style) fn(r.style, r.selectorText || "");
      if (r.cssRules) walkRules(r.cssRules, fn);
    }
  }

  function eachSheetDecl(fn) {
    const sheets = document.styleSheets;
    for (let i = 0; i < sheets.length; i++) {
      const s = sheets[i], owner = s.ownerNode;
      if (owner && owner.nodeType === 1 && OWN_STYLES.test(owner.getAttribute("data-platform-injected") || "")) continue;
      let rules;
      try { rules = s.cssRules; } catch (e) { continue; }
      if (rules) walkRules(rules, fn);
    }
  }

  // Le formateur a pu prévoir son propre mode sombre (@media prefers-color-scheme) :
  // on part toujours de sa version claire et c'est ce moteur qui produit le sombre,
  // pour que le rendu suive le thème du compte et non celui du système.
  function handleMedia(r) {
    let orig = mediaOrig.get(r);
    if (orig === undefined) { orig = r.media.mediaText; mediaOrig.set(r, orig); }
    if (!/prefers-color-scheme/i.test(orig)) return;
    const next = orig
      .replace(/\(\s*prefers-color-scheme\s*:\s*dark\s*\)/gi, "(prefers-color-scheme: lfia-never)")
      .replace(/\(\s*prefers-color-scheme\s*:\s*light\s*\)/gi, "(min-width: 0px)");
    try { if (r.media.mediaText !== next) r.media.mediaText = next; } catch (e) { /* ignoré */ }
  }

  function isRootSelector(sel) {
    return sel.split(",").some((s) => {
      s = s.trim();
      return /^(html|:root|body)([.#:[][^\s>+~]*)?$/i.test(s) || /^html\s*>?\s*body$/i.test(s);
    });
  }
  const infoForSelector = (sel) => ({
    root: !!sel && isRootSelector(sel),
    control: CONTROL_RE.test(sel),
    field: FIELD_RE.test(sel),
    text: /(^|[^\w-])(text|tspan|textpath)([^\w-]|$)/i.test(sel),
  });
  function isControl(el) {
    const t = el.tagName;
    return t === "BUTTON" || el.getAttribute("role") === "button" ||
      (t === "INPUT" && /^(submit|button|reset)$/i.test(el.getAttribute("type") || ""));
  }
  const infoForEl = (el) => ({
    root: el === docEl || el === document.body,
    control: isControl(el),
    field: !isControl(el) && /^(INPUT|SELECT|TEXTAREA)$/.test(el.tagName),
    text: /^(text|tspan|textPath)$/.test(el.localName),
  });

  function roleOf(p, info) {
    if (p === "color" || p === "-webkit-text-fill-color" || p === "caret-color" || p === "text-decoration-color" ||
      p === "text-emphasis-color" || p === "-webkit-text-stroke-color") return "fg";
    if (p === "background-color" || p === "background-image") return "bg";
    if (/^(border|outline|column-rule).*color$/.test(p)) return "border";
    if (p === "fill") return info.text ? "fg" : "decor";
    if (p === "stroke") return "border";
    if (p === "stop-color" || p === "flood-color" || p === "lighting-color" || p === "accent-color") return "decor";
    if (p === "box-shadow" || p === "text-shadow" || p === "filter") return "shadow";
    return null;
  }

  function collectColorVars() {
    const defs = new Map();
    const take = (decl) => {
      for (let i = 0; i < decl.length; i++) {
        const p = decl[i];
        if (p.slice(0, 2) !== "--" || p.indexOf("--lfia-") > 0) continue;
        if (!defs.has(p)) defs.set(p, []);
        defs.get(p).push(decl.getPropertyValue(p));
      }
    };
    eachSheetDecl((d) => take(d));
    [docEl].concat(Array.from(docEl.querySelectorAll("[style]"))).forEach((el) => { if (el.style) take(el.style); });
    const before = colorVars.size;
    colorVars.clear();
    defs.forEach((vals, name) => { if (vals.some((v) => scanColors(v).length)) colorVars.add(name); });
    const refs = (v) => { const re = /var\(\s*(--[\w-]+)/g; let m; while ((m = re.exec(v))) if (colorVars.has(m[1])) return true; return false; };
    for (let k = 0; k < 6; k++) {
      let grew = false;
      defs.forEach((vals, name) => { if (!colorVars.has(name) && vals.some(refs)) { colorVars.add(name); grew = true; } });
      if (!grew) break;
    }
    return colorVars.size !== before;
  }

  // Variables définies à la racine, lues en une fois par passe : les relire au
  // fil des réécritures CSSOM forcerait un recalcul de styles à chaque appel.
  const rootVars = new Map();
  function snapshotRootVars() {
    rootVars.clear();
    const cs = getComputedStyle(docEl);
    for (let i = 0; i < cs.length; i++) {
      const p = cs[i];
      if (p.slice(0, 2) === "--" && p.indexOf("--lfia-") < 0) rootVars.set(p, cs.getPropertyValue(p).trim());
    }
  }
  tripletLookup = (name) => rootVars.get(name) || "";

  function resolveVars(v) {
    for (let guard = 0; v.indexOf("var(") >= 0 && guard < 5; guard++) {
      v = v.replace(/var\(\s*(--[\w-]+)\s*(?:,([^()]*))?\)/g, (m, name, fb) => rootVars.get(name) || (fb || "").trim());
    }
    return v;
  }

  // Couleur de fond (d'origine) déclarée dans le même bloc, pour savoir sur quoi
  // pose le texte de ce bloc (.btn{background:#2563eb;color:#fff}).
  function declBg(decl) {
    let v = decl.getPropertyValue("background-color");
    if (!v) { const sh = decl.getPropertyValue("background"); if (sh && sh.indexOf("var(") >= 0) v = sh; }
    const c = v ? parseColor(resolveVars(v.trim())) : null;
    if (c && c.a > 0.05) return c;
    const img = decl.getPropertyValue("background-image");
    if (img && !/url\(/i.test(img) && /gradient/i.test(img)) {
      const cols = scanColors(resolveVars(img)).filter((x) => x.a > 0.05);
      if (cols.length) return average(cols, page.src);
    }
    return null;
  }

  function ruleCtx(decl, info) {
    const own = declBg(decl);
    let srcBg = page.src, tgtBg = T.bg;
    if (own) {
      srcBg = composite(own, page.src);
      if (!info.root) tgtBg = composite(mapColor(own, "bg", contextFor(T, page, { control: info.control, vars: colorVars })), T.bg);
    }
    return { srcBg, tgtBg, root: info.root, control: info.control, field: info.field };
  }

  function declCtx(role, rc) {
    const x = { root: rc.root, control: rc.control, vars: colorVars };
    if (role === "border") x.minCR = rc.control || rc.field ? 3 : 1.5;
    if (role !== "bg") { x.srcBg = rc.srcBg; x.tgtBg = rc.tgtBg; }
    return contextFor(T, page, x);
  }
  const varCtx = (role) => contextFor(T, page, { vars: colorVars, minCR: role === "border" ? 1.5 : undefined });

  // Variable de texte déclarée avec sa variable de fond dans le même bloc
  // (Bootstrap : .btn-primary{--bs-btn-color:#fff;--bs-btn-bg:#0d6efd;
  // --bs-btn-hover-color…;--bs-btn-hover-bg…}) : le texte est adapté par rapport
  // à ce fond-là — y compris pour :hover, que la passe de contraste ne voit pas.
  function pairedBg(decl, name) {
    const m = /^(.*?)-(color|text|fg|foreground|text-color)$/.exec(name);
    if (!m) return null;
    for (const suffix of ["bg", "background", "bg-color", "background-color"]) {
      const v = decl.getPropertyValue(m[1] + "-" + suffix);
      const c = v ? parseColor(resolveVars(v.trim())) : null;
      if (c && c.a > 0.05) return { srcBg: composite(c, page.src), tgtBg: composite(mapColor(c, "bg", varCtx("bg")), T.bg) };
    }
    return null;
  }

  function forEachColorDecl(decl, info, cb) {
    const rc = ruleCtx(decl, info);
    const props = [];
    for (let i = 0; i < decl.length; i++) props.push(decl[i]);
    props.forEach((p) => {
      if (p.indexOf("--lfia-") > 0) return;
      const v = decl.getPropertyValue(p);
      if (!v) return;
      const pri = decl.getPropertyPriority(p);
      if (p.slice(0, 2) === "--") {
        if (!colorVars.has(p)) return;
        const pair = pairedBg(decl, p);
        ROLES.forEach((role) => {
          const ctx = pair && (role === "fg" || role === "border") ? declCtx(role, Object.assign({}, rc, pair)) : varCtx(role);
          cb(p + "--lfia-" + role, v, mapValue(v, role, ctx), pri, true);
        });
        return;
      }
      const role = roleOf(p, info);
      if (!role) return;
      const nv = mapValue(v, role, declCtx(role, rc));
      if (nv !== v) cb(p, v, nv, pri, false);
    });
    // Raccourci + var() : le navigateur laisse ses sous-propriétés vides.
    VAR_SHORTHANDS.forEach(([sh, role]) => {
      if (props.indexOf(sh) >= 0) return;
      const v = decl.getPropertyValue(sh);
      if (!v || v.indexOf("var(") < 0) return;
      const nv = mapValue(v, role, declCtx(role, rc));
      if (nv !== v) cb(sh, v, nv, decl.getPropertyPriority(sh), false);
    });
  }

  function restoreDecl(decl) {
    const rec = declRecs.get(decl);
    if (!rec) return;
    rec.written.forEach((w, p) => {
      if (decl.getPropertyValue(p) !== w) return; // modifiée depuis par la page : on garde sa valeur
      if (rec.added.has(p)) decl.removeProperty(p);
      else { const o = rec.orig.get(p); decl.setProperty(p, o.v, o.pri); }
    });
    declRecs.delete(decl);
  }

  function processDecl(decl, info) {
    restoreDecl(decl);
    const rec = { orig: new Map(), written: new Map(), added: new Set() };
    forEachColorDecl(decl, info, (p, v, nv, pri, added) => {
      try { decl.setProperty(p, nv, pri); } catch (e) { return; }
      if (added) rec.added.add(p); else rec.orig.set(p, { v, pri });
      rec.written.set(p, decl.getPropertyValue(p));
    });
    if (rec.written.size) declRecs.set(decl, rec);
  }

  function processAllSheets() {
    eachSheetDecl((decl, sel) => processDecl(decl, infoForSelector(sel)));
  }

  function restoreInPlace(el) {
    const m = inPlace.get(el);
    if (!m) return;
    m.forEach((r, p) => { if (el.style.getPropertyValue(p) === r.written) el.style.setProperty(p, r.orig, "important"); });
    inPlace.delete(el);
  }

  function hintRole(el, attr) {
    const tag = el.localName;
    if (attr === "color") return tag === "font" ? "fg" : null;
    if (attr === "text") return tag === "body" ? "fg" : null;
    if (attr === "bgcolor") return "bg";
    if (attr === "fill") return /^(text|tspan|textPath)$/.test(tag) ? "fg" : "decor";
    if (attr === "stroke") return "border";
    return "decor";
  }

  function processInline(el) {
    if (!T || isOurs(el)) return;
    restoreInPlace(el);
    const info = infoForEl(el);
    const imp = [], hint = [];
    if (el.style && el.style.length) {
      forEachColorDecl(el.style, info, (p, v, nv, pri, added) => {
        if (added) imp.push(p + ":" + nv);
        else if (pri === "important") {
          // Un style="…!important" ne peut pas être surclassé par une feuille : réécrit en place.
          let m = inPlace.get(el);
          if (!m) inPlace.set(el, (m = new Map()));
          el.style.setProperty(p, nv, "important");
          m.set(p, { orig: v, written: el.style.getPropertyValue(p) });
        } else imp.push(p + ":" + nv + "!important");
      });
    }
    Object.keys(HINT_ATTRS).forEach((attr) => {
      if (!el.hasAttribute(attr)) return;
      const role = hintRole(el, attr);
      const c = role && parseColor(el.getAttribute(attr));
      if (!c) return;
      const ctx = contextFor(T, page, { root: info.root, control: info.control, vars: colorVars, minCR: role === "border" ? (info.field ? 3 : 1.5) : undefined });
      const m = mapColor(c, role, ctx);
      if (m !== c) hint.push(HINT_ATTRS[attr] + ":" + formatColor(m));
    });
    if (imp.length || hint.length) inlineDecls.set(el, { imp: imp.join(";"), hint: hint.join(";") });
    else inlineDecls.delete(el);
  }

  function processInlineTree(node) {
    if (node.nodeType !== 1 || isOurs(node)) return;
    if (node.matches(HINT_SELECTOR)) processInline(node);
    node.querySelectorAll(HINT_SELECTOR).forEach(processInline);
  }

  function processAllInline() {
    inlineDecls.clear();
    processInlineTree(docEl);
  }

  function writeInlineSheet() {
    const parts = [];
    inlineDecls.forEach((d, el) => {
      if (!el.isConnected) { inlineDecls.delete(el); return; }
      const id = idOf(el);
      if (d.hint) parts.push(':where([data-lfia-i="' + id + '"]){' + d.hint + "}");
      if (d.imp) parts.push('[data-lfia-i="' + id + '"]{' + d.imp + "}");
    });
    if (inlineStyle) inlineStyle.textContent = parts.join("\n");
  }

  function writeFixSheet() {
    const parts = [];
    fixDecls.forEach((d, el) => {
      if (!el.isConnected) { fixDecls.delete(el); return; }
      parts.push('[data-lfia-i="' + idOf(el) + '"]{' + d + "}");
    });
    if (fixStyle) fixStyle.textContent = parts.join("\n");
  }

  // ── Passe de contraste sur le rendu réel ──

  function hasOwnText(el) {
    for (let n = el.firstChild; n; n = n.nextSibling) if (n.nodeType === 3 && /\S/.test(n.data)) return true;
    return false;
  }
  const isField = (el) => el.tagName === "TEXTAREA" || el.tagName === "SELECT" ||
    (el.tagName === "INPUT" && TEXT_FIELD.test((el.getAttribute("type") || "").toLowerCase()));

  // Fond effectivement visible derrière un élément (fonds semi-transparents
  // composés, dégradés moyennés). null si une image est en jeu : impossible de
  // connaître la couleur sous le texte, on ne corrige pas.
  function bgOf(el, memo) {
    if (memo.has(el)) return memo.get(el);
    const under = el.parentElement ? bgOf(el.parentElement, memo) : T.bg;
    const cs = getComputedStyle(el);
    const own = parseColor(cs.backgroundColor);
    let res = under;
    if (own && own.a > 0.01) res = under ? composite(own, under) : own.a > 0.95 ? own : null;
    const img = cs.backgroundImage;
    if (img && img !== "none") {
      if (/url\(/i.test(img)) res = null;
      else {
        const cols = scanColors(img).filter((c) => c.a > 0.01);
        if (cols.length && res) res = average(cols, res);
      }
    }
    memo.set(el, res);
    return res;
  }

  function fixFor(el, memo) {
    if (el.namespaceURI !== HTML_NS || isOurs(el) || SKIP_TAGS[el.tagName]) return null;
    const field = isField(el);
    if (!field && el.tagName !== "BUTTON" && !hasOwnText(el)) return null;
    const cs = getComputedStyle(el);
    // Pas de test sur visibility : la première passe tourne pendant que le
    // document est encore masqué (lfia-pre), et un élément caché peut réapparaître.
    if (cs.display === "none") return null;
    const bg = bgOf(el, memo);
    if (!bg) return null;
    const out = [];
    const fg = parseColor(cs.color);
    const fill = parseColor(cs.webkitTextFillColor || "");
    if (fg && fg.a > 0.05 && !(fill && fill.a < 0.05)) {
      const shown = composite(fg, bg);
      const size = parseFloat(cs.fontSize) || 16, weight = parseInt(cs.fontWeight, 10) || 400;
      const need = size >= 24 || (size >= 18.5 && weight >= 700) ? 3 : 4.5;
      if (contrast(shown, bg) < need - 0.05) out.push("color:" + formatColor(ensureContrast(shown, bg, need + 0.25, T)) + "!important");
    }
    // Champ de saisie qui se confond avec son fond : sa bordure doit le délimiter.
    if (field && parseFloat(cs.borderTopWidth) > 0) {
      const outer = el.parentElement ? bgOf(el.parentElement, memo) : T.bg;
      const bc = parseColor(cs.borderTopColor);
      if (outer && bc && contrast(bg, outer) < 1.15 && contrast(composite(bc, outer), outer) < 1.6) {
        out.push("border-color:" + formatColor(ensureContrast(composite(bc, outer), outer, 3, T)) + "!important");
      }
    }
    return out.length ? out.join(";") : null;
  }

  function fixupSubtree(rootEl) {
    if (!T || !rootEl || !rootEl.isConnected) return;
    const els = [rootEl].concat(Array.from(rootEl.querySelectorAll("*")));
    let removed = false;
    els.forEach((el) => { if (fixDecls.delete(el)) removed = true; });
    if (removed) writeFixSheet();
    const memo = new Map();
    let added = false;
    els.forEach((el) => {
      let d = null;
      try { d = fixFor(el, memo); } catch (e) { /* élément exotique */ }
      if (d) { fixDecls.set(el, d); added = true; }
    });
    if (added) writeFixSheet();
  }

  let pendingRoots = null, fixTimer = 0;
  function scheduleFixup(target) {
    if (!T) return;
    if (!pendingRoots) pendingRoots = new Set();
    if (target instanceof Set) target.forEach((t) => t && pendingRoots.add(t));
    else if (target) pendingRoots.add(target);
    if (fixTimer) return;
    const run = () => {
      fixTimer = 0;
      const roots = pendingRoots;
      pendingRoots = null;
      if (!roots) return;
      if (roots.has(docEl)) { fixupSubtree(docEl); return; }
      roots.forEach((r) => {
        if (!r.isConnected) return;
        for (let p = r.parentElement; p; p = p.parentElement) if (roots.has(p)) return;
        fixupSubtree(r);
      });
    };
    fixTimer = window.requestAnimationFrame ? requestAnimationFrame(run) : setTimeout(run, 16);
  }

  // Changement de palette global (thème appliqué, changé, CSS de CDN rapatriée) :
  // les transition: color .15s du formateur feraient mesurer à la passe de
  // contraste des couleurs intermédiaires. On les coupe le temps de recalculer,
  // puis on les rend (sans effet visible : les valeurs ne bougent plus).
  function withoutTransitions(fn) {
    const s = document.createElement("style");
    s.setAttribute("data-platform-injected", "lfia-notrans");
    s.textContent = "*,*::before,*::after{transition:none!important}";
    (document.head || docEl).appendChild(s);
    try { fn(); } finally {
      void docEl.offsetHeight;
      const drop = () => s.remove();
      if (window.requestAnimationFrame) requestAnimationFrame(drop); else setTimeout(drop, 16);
    }
  }

  // ── Mutations (JS du formateur) ──

  function refreshSheets() {
    snapshotRootVars();
    const varsChanged = collectColorVars();
    processAllSheets();
    if (varsChanged) processAllInline();
    writeInlineSheet();
    flushOwn();
  }

  function onMutations(records) {
    if (!T) return;
    let sheetsDirty = false, inlineDirty = false;
    const roots = new Set();
    records.forEach((r) => {
      const t = r.target;
      if (r.type === "childList") {
        if (isOurs(t)) return;
        if (t.nodeName === "STYLE") sheetsDirty = true;
        r.addedNodes.forEach((n) => {
          if (n.nodeType !== 1 || isOurs(n)) return;
          if (n.nodeName === "STYLE" || n.nodeName === "LINK" || n.querySelector("style,link")) sheetsDirty = true;
          processInlineTree(n);
          inlineDirty = true;
        });
        roots.add(t.nodeType === 1 ? t : t.parentElement);
      } else if (r.type === "characterData") {
        const p = t.parentElement;
        if (!p || isOurs(p)) return;
        if (p.nodeName === "STYLE") sheetsDirty = true;
        else roots.add(p);
      } else if (r.type === "attributes") {
        if (isOurs(t)) return;
        const a = r.attributeName;
        if (a === "style" || has(HINT_ATTRS, a)) { processInline(t); inlineDirty = true; }
        else if (a === "media") sheetsDirty = true;
        roots.add(t);
      }
    });
    if (sheetsDirty) { refreshSheets(); inlineCrossOriginLinks(); }
    else if (inlineDirty) writeInlineSheet();
    flushOwn();
    scheduleFixup(sheetsDirty ? docEl : roots);
  }

  function startObserver() {
    if (observer || !window.MutationObserver) return;
    observer = new MutationObserver(onMutations);
    observer.observe(docEl, {
      subtree: true, childList: true, characterData: true, attributes: true,
      attributeFilter: ["style", "class", "id", "hidden", "open", "media"].concat(Object.keys(HINT_ATTRS)),
    });
    // Survol / focus / saisie : les états :hover, :focus… changent les fonds.
    ["mouseover", "mouseout", "focusin", "focusout", "input", "change", "transitionend", "animationend"].forEach((ev) => {
      document.addEventListener(ev, (e) => { const t = e.target; if (t && t.nodeType === 1) scheduleFixup(t); }, true);
    });
  }

  // CSS d'un CDN (<link>) : illisible depuis cette iframe sans origine. On le
  // rapatrie en <style> quand le CDN l'autorise (jsDelivr, cdnjs, unpkg… le font).
  function absolutize(css, base) {
    return css
      .replace(/url\(\s*(['"]?)([^'")]+)\1\s*\)/gi, (m, q, u) => {
        if (/^(data:|https?:|\/\/|#|blob:)/i.test(u)) return m;
        try { return "url(" + q + new URL(u, base).href + q + ")"; } catch (e) { return m; }
      })
      .replace(/@import\s+(['"])([^'"]+)\1/gi, (m, q, u) => {
        try { return "@import " + q + new URL(u, base).href + q; } catch (e) { return m; }
      });
  }

  function inlineCrossOriginLinks() {
    const jobs = [];
    document.querySelectorAll('link[rel~="stylesheet"][href]').forEach((link) => {
      if (handledLinks.has(link) || isOurs(link)) return;
      const sheet = link.sheet;
      if (!sheet) { link.addEventListener("load", () => { if (T) { inlineCrossOriginLinks(); refreshSheets(); scheduleFixup(docEl); } }, { once: true }); return; }
      try { void sheet.cssRules; handledLinks.add(link); return; } catch (e) { /* autre origine */ }
      handledLinks.add(link);
      if (/fonts\.googleapis\.com/i.test(link.href) || !window.fetch) return;
      jobs.push(fetch(link.href, { mode: "cors", credentials: "omit" })
        .then((res) => (res.ok ? res.text() : Promise.reject(new Error(String(res.status)))))
        .then((css) => {
          const style = document.createElement("style");
          style.setAttribute("data-platform-injected", "lfia-inlined");
          if (link.media) style.media = link.media;
          style.textContent = absolutize(css, link.href);
          if (link.parentNode) link.parentNode.insertBefore(style, link.nextSibling);
          try { sheet.disabled = true; } catch (e) { /* la copie, placée après, l'emporte de toute façon */ }
        })
        .catch(() => { /* CDN sans CORS : couleurs laissées telles quelles, seule la passe de contraste s'applique */ }));
    });
    if (!jobs.length) return null;
    return Promise.all(jobs).then(() => { if (T) withoutTransitions(() => { refreshSheets(); fixupSubtree(docEl); }); });
  }

  // Fond de page d'origine (body, sinon html, sinon blanc), mesuré une seule fois
  // avant nos propres styles : c'est la référence des surfaces "carte".
  function detectPage() {
    const pre = document.querySelector('style[data-platform-injected="lfia-pre"]');
    if (pre && pre.sheet) pre.sheet.disabled = true;
    let col = null;
    try {
      for (const el of [document.body, docEl]) {
        if (!el) continue;
        const cs = getComputedStyle(el);
        const img = cs.backgroundImage;
        if (img && img !== "none" && !/url\(/i.test(img)) {
          const cols = scanColors(img).filter((c) => c.a > 0.05);
          if (cols.length) { col = average(cols, WHITE); break; }
        }
        const c = parseColor(cs.backgroundColor);
        if (c && c.a > 0.05) { col = composite(c, WHITE); break; }
      }
    } finally {
      if (pre && pre.sheet) pre.sheet.disabled = false;
    }
    return makePage(col || WHITE);
  }

  function applyTheme() {
    if (!cfg || !domReady) return;
    try {
      T = createTheme(cfg);
      // Les @media prefers-color-scheme du formateur d'abord (walkRules les
      // neutralise) : sinon on mesurerait le fond de sa version sombre.
      if (!page) { eachSheetDecl(() => {}); page = detectPage(); }
      mountStyles();
      withoutTransitions(() => {
        baseStyle.textContent = buildBaseCss(T, page);
        snapshotRootVars();
        collectColorVars();
        processAllSheets();
        processAllInline();
        writeInlineSheet();
        fixDecls.clear();
        writeFixSheet();
        fixupSubtree(docEl);
      });
      startObserver();
    } catch (e) { report(e); }
    docEl.setAttribute("data-lfia-theme", T && T.dark ? "dark" : "light");
    const reveal = () => docEl.setAttribute("data-lfia-ready", "");
    const pending = inlineCrossOriginLinks();
    if (pending && !docEl.hasAttribute("data-lfia-ready")) {
      const timer = setTimeout(reveal, 1200);
      pending.then(() => { clearTimeout(timer); reveal(); });
    } else reveal();
    flushOwn();
  }

  // Document tel que le formateur l'a écrit (sans nos styles ni attributs) : c'est
  // ce qui est enregistré pour une mission (cf. injectMissionBridge) et imprimé en PDF.
  function serializeClean() {
    const clone = docEl.cloneNode(true);
    if (inPlace.size) {
      const live = [docEl].concat(Array.from(docEl.querySelectorAll("*")));
      const copy = [clone].concat(Array.from(clone.querySelectorAll("*")));
      if (live.length === copy.length) {
        live.forEach((el, i) => {
          const m = inPlace.get(el);
          if (m) m.forEach((r, p) => { if (copy[i].style.getPropertyValue(p) === r.written) copy[i].style.setProperty(p, r.orig, "important"); });
        });
      }
    }
    clone.querySelectorAll("[data-platform-injected]").forEach((n) => n.remove());
    clone.querySelectorAll("[data-lfia-i]").forEach((n) => n.removeAttribute("data-lfia-i"));
    ["data-lfia-i", "data-lfia-ready", "data-lfia-theme"].forEach((a) => clone.removeAttribute(a));
    return clone.outerHTML;
  }
  api.serializeClean = serializeClean;

  function hello() {
    try { window.parent.postMessage({ __lfiaThemeReady: true, channel }, "*"); } catch (e) { /* pas de parent */ }
  }
  window.addEventListener("message", (e) => {
    if (e.source !== window.parent) return;
    const d = e.data;
    if (!d || !d.__lfiaTheme || (channel && d.channel !== channel)) return;
    cfg = d.__lfiaTheme;
    applyTheme();
  });
  function onReady() {
    domReady = true;
    if (cfg) applyTheme();
    else { hello(); setTimeout(() => { if (!cfg) hello(); }, 400); }
  }
  hello();
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", onReady);
  else onReady();
  // Polices, feuilles tardives, images : la mise en page (donc les fonds) peut bouger.
  window.addEventListener("load", () => { if (T) { refreshSheets(); scheduleFixup(docEl); } });
})(typeof window !== "undefined" ? window : globalThis);
