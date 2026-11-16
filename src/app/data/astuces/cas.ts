// Cas pratiques : assemblage du prompt à partir du template, sans React
// (testé dans scripts/astuces-content.test.mjs, utilisé aussi par le script
// de génération des exemples).
import type { AstuceCas, CasBrique, CasOption } from "./types";

const SLOT_RE = /\{([a-z0-9-]+)\}/g;

export function templateSlots(template: string): string[] {
  return [...template.matchAll(SLOT_RE)].map((m) => m[1]);
}

export interface CasPart {
  text: string;
  // Emplacement d'origine (absent = texte fixe du template).
  slot?: string;
  kind?: "field" | "brique";
  // Champ pas encore rempli : le texte est alors « [Libellé] ».
  missing?: boolean;
}

// `values` : texte saisi/choisi par emplacement. Brique sans valeur = son
// option par défaut ; champ sans valeur = `example` si `useExamples`, sinon
// un emplacement « [Libellé] » signalé `missing`.
export function casParts(cas: AstuceCas, values: Record<string, string> = {}, useExamples = false): CasPart[] {
  const parts: CasPart[] = [];
  let last = 0;
  for (const match of cas.template.matchAll(SLOT_RE)) {
    const at = match.index ?? 0;
    if (at > last) parts.push({ text: cas.template.slice(last, at) });
    last = at + match[0].length;
    const id = match[1];
    const value = values[id]?.trim();
    const field = cas.fields.find((f) => f.id === id);
    if (field) {
      if (value) parts.push({ text: value, slot: id, kind: "field" });
      else if (useExamples) parts.push({ text: field.example, slot: id, kind: "field" });
      else parts.push({ text: `[${field.label}]`, slot: id, kind: "field", missing: true });
      continue;
    }
    const brique = cas.briques.find((b) => b.id === id);
    parts.push({ text: value || brique?.options[0]?.snippet || "", slot: id, kind: "brique" });
  }
  if (last < cas.template.length) parts.push({ text: cas.template.slice(last) });
  return parts;
}

export const partsText = (parts: CasPart[]) => parts.map((p) => p.text).join("");

// Prompt d'un exemple : champs = exemples, briques = défaut, sauf `override`.
export function casExamplePrompt(cas: AstuceCas, override?: { brique: CasBrique; option: CasOption }): string {
  const values = override ? { [override.brique.id]: override.option.snippet } : {};
  return partsText(casParts(cas, values, true));
}
