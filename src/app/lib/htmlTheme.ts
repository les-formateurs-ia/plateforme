// Adaptation du HTML des formateurs à la charte et au thème du compte — partie
// "parent" pure (sans React ni import ?raw, pour rester testable sous Node).
// Le moteur lui-même tourne dans l'iframe : voir htmlThemeEngine.js ; le hook
// qui lui transmet le thème : useHtmlTheme.ts.

export type HtmlSurface = "page" | "card";

// Ce que le moteur reçoit par postMessage. Les couleurs rgba() du thème sont
// passées brutes : le moteur les compose lui-même sur la surface `bg`.
export interface HtmlThemeConfig {
  dark: boolean;
  bg: string;
  card: string;
  fg: string;
  fg2: string;
  fg3: string;
  sep: string;
  inputBg: string;
  inputB: string;
  accent1: string;
  accent2: string;
}

export interface HtmlThemeSource {
  isDark: boolean;
  bg: string;
  card: string;
  fg: string;
  fg2: string;
  fg3: string;
  sep: string;
  inputBg: string;
  inputB: string;
  grad1: string;
  grad2: string;
}

// `surface` = le fond du site à l'endroit où l'iframe est affichée : fond de page
// (leçon, exercice) ou fond de carte (aperçu dans une modale / une GCard). Le fond
// racine du HTML prend exactement cette couleur pour se fondre dans l'interface.
export function buildHtmlTheme(th: HtmlThemeSource, surface: HtmlSurface): HtmlThemeConfig {
  return {
    dark: th.isDark,
    bg: surface === "card" ? th.card : th.bg,
    card: th.card,
    fg: th.fg,
    fg2: th.fg2,
    fg3: th.fg3,
    sep: th.sep,
    inputBg: th.inputBg,
    inputB: th.inputB,
    accent1: th.grad1,
    accent2: th.grad2,
  };
}

// Tant que le thème n'est pas appliqué : fond transparent (on voit la surface du
// conteneur, donc pas de flash blanc en sombre) et contenu masqué. Filet de
// sécurité si le moteur ne répond jamais : après 1,5 s, la page s'affiche telle
// que le formateur l'a écrite, sur fond blanc.
const PRE_CSS =
  "html:not([data-lfia-ready]):not(#lfia-pre){background:transparent;animation:lfia-root 0s linear 1.5s forwards}" +
  "html:not([data-lfia-ready])>body{visibility:hidden;animation:lfia-show 0s linear 1.5s forwards}" +
  "@keyframes lfia-show{to{visibility:visible}}@keyframes lfia-root{to{background:#fff}}";

export function injectHtmlThemeWith(engineSource: string, html: string, channel: string): string {
  const safeChannel = channel.replace(/[^a-z0-9]/gi, "");
  const extras =
    `<style data-platform-injected="lfia-pre">${PRE_CSS}</style>\n` +
    `<script data-platform-injected data-lfia-channel="${safeChannel}">${engineSource.replace(/<\/script/gi, "<\\/script")}</script>`;
  if (/<head[^>]*>/i.test(html)) return html.replace(/<head[^>]*>/i, (m) => `${m}\n${extras}`);
  if (/<html[^>]*>/i.test(html)) return html.replace(/<html[^>]*>/i, (m) => `${m}\n${extras}`);
  return extras + html;
}
