// Constructeur de prompt : étapes et assemblage, sans React (testé dans
// scripts/astuces-content.test.mjs). Les étapes d'un même `group` forment
// une phrase (jointes par des virgules) ; les groupes s'enchaînent en
// phrases distinctes, dans l'ordre `order`.
import type { AstuceDomain, Brique } from "./types";

export const SUBJECT_KEY = "sujet";

export interface BuilderStepView {
  key: string;
  label: string;
  placeholder: string;
  order: number;
  group: number;
  brique?: Brique;
}

export function builderSteps(domain: AstuceDomain): BuilderStepView[] {
  const steps: BuilderStepView[] = [{ key: SUBJECT_KEY, ...domain.builderSubject }];
  for (const brique of domain.briques) {
    if (brique.builder) steps.push({ key: brique.id, ...brique.builder, brique });
  }
  return steps.sort((a, b) => a.order - b.order);
}

export interface PromptPart {
  text: string;
  // Étape d'origine (absent = ponctuation de liaison).
  key?: string;
}

const clean = (value: string) => value.trim().replace(/[\s.,;:]+$/, "");
const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

export function assemblePrompt(domain: AstuceDomain, values: Record<string, string>): { text: string; parts: PromptPart[] } {
  const groups = new Map<number, { key: string; text: string }[]>();
  for (const step of builderSteps(domain)) {
    const text = clean(values[step.key] ?? "");
    if (!text) continue;
    const list = groups.get(step.group) ?? [];
    list.push({ key: step.key, text });
    groups.set(step.group, list);
  }

  const parts: PromptPart[] = [];
  const sentences = [...groups.entries()].sort(([a], [b]) => a - b).map(([, items]) => items);
  sentences.forEach((items, s) => {
    if (s > 0) parts.push({ text: " " });
    items.forEach((item, i) => {
      if (i > 0) parts.push({ text: ", " });
      parts.push({ key: item.key, text: i === 0 ? capitalize(item.text) : item.text });
    });
    parts.push({ text: "." });
  });
  return { text: parts.map((p) => p.text).join(""), parts };
}
