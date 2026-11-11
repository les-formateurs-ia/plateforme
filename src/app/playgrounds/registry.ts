import { createElement, lazy, type ComponentType, type LazyExoticComponent } from "react";
import type { RevisionData } from "./rs6776/revision/types";

// Playgrounds natifs : des composants React versionnés dans le dépôt, à la
// place d'un HTML collé dans l'onglet "Playground" d'une leçon. Une entrée peut
// aussi fournir la "Fiche de révision" de la leçon (onglet dédié).
//
// Aucun nouveau champ en base : la leçon désigne son Playground natif par un
// marqueur placé dans custom_html_content, champ que toutes les fonctions SQL
// de copie (attribution, aperçu, modèle depuis une copie) recopient déjà :
//
//   <!-- playground:rs6776-1-1 -->
//   <!-- playground:rs6776-1-1 profil=sirh -->
//   <!-- playground:rs6776-1-1 pg=non -->        (fiche de révision seule, sans Playground)
//   <!-- playground:rs6776-1-2 profil=sirh -->
//   <!doctype html>…                             (fiche de révision native + Playground HTML
//                                                 placé juste après le marqueur)
//
// Les paramètres (clé=valeur) permettent une variante par élève dans sa copie
// de formation. Avantage clé : le code du composant est partagé par toutes les
// copies, donc une amélioration du Playground atteint immédiatement tous les
// élèves déjà inscrits — ce que ne permet pas un HTML recopié dans chaque copie.

export type PlaygroundParams = Record<string, string>;
export type PlaygroundProps = { params: PlaygroundParams; lessonTitle: string };

export type PlaygroundEntry = {
  id: string;
  label: string;
  // Variantes proposées dans l'éditeur (valeur du paramètre `profil`).
  profiles?: { value: string; label: string }[];
  // Playground natif. Absent : le Playground est le HTML placé après le marqueur.
  Component?: LazyExoticComponent<ComponentType<PlaygroundProps>>;
  // Fiche de révision de la leçon (onglet dédié), même marqueur, mêmes paramètres.
  Revision?: LazyExoticComponent<ComponentType<PlaygroundProps>>;
};

export const PLAYGROUNDS: PlaygroundEntry[] = [
  // Leçons RS6776 suivantes : fiche de révision native, Playground HTML après le marqueur.
  // (entrées ajoutées au fil de la production, voir RS6776_SHEETS plus bas)
  {
    id: "rs6776-1-1",
    label: "RS6776 · 1.1 Comprendre l'IA générative et ses usages",
    profiles: [{ value: "sirh", label: "Consultant(e) SIRH" }],
    Component: lazy(() => import("./rs6776/Lecon11Playground")),
    Revision: lazy(() => import("./rs6776/Lecon11Revision")),
  },
];

// Fiche de révision générique (revision/RevisionSheet.tsx) à partir d'un fichier de contenu.
const sheet = (load: () => Promise<{ data: RevisionData }>) =>
  lazy(async () => {
    const [{ data }, { RevisionSheet }] = await Promise.all([load(), import("./rs6776/revision/RevisionSheet")]);
    return { default: (p: PlaygroundProps) => createElement(RevisionSheet, { data, profile: p.params.profil }) };
  });

const MARKER_RE = /^\s*<!--\s*playground:([a-z0-9-]+)((?:\s+[a-z0-9_-]+=[a-z0-9_-]+)*)\s*-->/i;

export function parsePlaygroundMarker(html: string | null | undefined): { entry: PlaygroundEntry; params: PlaygroundParams; html: string } | null {
  if (!html) return null;
  const m = MARKER_RE.exec(html);
  if (!m) return null;
  const entry = PLAYGROUNDS.find((p) => p.id === m[1].toLowerCase());
  if (!entry) return null;
  const params: PlaygroundParams = {};
  for (const pair of m[2].trim().split(/\s+/).filter(Boolean)) {
    const [k, v] = pair.split("=");
    params[k.toLowerCase()] = v.toLowerCase();
  }
  return { entry, params, html: html.slice(m[0].length).trim() };
}

export function buildPlaygroundMarker(id: string, params: PlaygroundParams = {}): string {
  const extra = Object.entries(params).filter(([, v]) => v).map(([k, v]) => ` ${k}=${v}`).join("");
  return `<!-- playground:${id}${extra} -->`;
}

// Leçons 1.2 à 3.2 : fiche générique. `sheet` charge le contenu de revision/<fichier>.ts.
const RS6776_SHEETS: [string, string, () => Promise<{ data: RevisionData }>][] = [
  ["rs6776-1-2", "RS6776 · 1.2 Analyser son poste", () => import("./rs6776/revision/l12")],
  ["rs6776-1-3", "RS6776 · 1.3 Installer et configurer les outils", () => import("./rs6776/revision/l13")],
  ["rs6776-1-4", "RS6776 · 1.4 Reconnaître les informations à protéger", () => import("./rs6776/revision/l14")],
  ["rs6776-1-5", "RS6776 · 1.5 Sécuriser son usage de l'IA", () => import("./rs6776/revision/l15")],
  ["rs6776-1-6", "RS6776 · 1.6 Élaborer son plan d'actions IA", () => import("./rs6776/revision/l16")],
  ["rs6776-2-1", "RS6776 · 2.1 Les bases du prompt engineering", () => import("./rs6776/revision/l21")],
  ["rs6776-2-2", "RS6776 · 2.2 Prompts avancés", () => import("./rs6776/revision/l22")],
  ["rs6776-2-3", "RS6776 · 2.3 Rédaction assistée par IA", () => import("./rs6776/revision/l23")],
  ["rs6776-2-4", "RS6776 · 2.4 Créer des contenus visuels", () => import("./rs6776/revision/l24")],
  ["rs6776-2-5", "RS6776 · 2.5 Optimiser les contenus générés", () => import("./rs6776/revision/l25")],
  ["rs6776-3-1", "RS6776 · 3.1 Produire des contenus inclusifs", () => import("./rs6776/revision/l31")],
  ["rs6776-3-2", "RS6776 · 3.2 Cadre légal : IA Act, RGPD et veille", () => import("./rs6776/revision/l32")],
];
if (import.meta.env.DEV) RS6776_SHEETS.push(["rs6776-exemple", "Exemple de fiche (développement)", () => import("./rs6776/revision/_exemple")]);
// Playgrounds natifs des leçons 1.2 à 3.2 (version SIRH, convertis depuis le HTML d'origine).
const RS6776_PLAYGROUNDS: Record<string, LazyExoticComponent<ComponentType<PlaygroundProps>>> = {
  "rs6776-1-2": lazy(() => import("./rs6776/pg/Pg12")), "rs6776-1-3": lazy(() => import("./rs6776/pg/Pg13")),
  "rs6776-1-4": lazy(() => import("./rs6776/pg/Pg14")), "rs6776-1-5": lazy(() => import("./rs6776/pg/Pg15")),
  "rs6776-1-6": lazy(() => import("./rs6776/pg/Pg16")), "rs6776-2-1": lazy(() => import("./rs6776/pg/Pg21")),
  "rs6776-2-2": lazy(() => import("./rs6776/pg/Pg22")), "rs6776-2-3": lazy(() => import("./rs6776/pg/Pg23")),
  "rs6776-2-4": lazy(() => import("./rs6776/pg/Pg24")), "rs6776-2-5": lazy(() => import("./rs6776/pg/Pg25")),
  "rs6776-3-1": lazy(() => import("./rs6776/pg/Pg31")), "rs6776-3-2": lazy(() => import("./rs6776/pg/Pg32")),
};
for (const [id, label, load] of RS6776_SHEETS) PLAYGROUNDS.push({ id, label, profiles: [{ value: "sirh", label: "Consultant(e) SIRH" }], Revision: sheet(load), Component: RS6776_PLAYGROUNDS[id] });
