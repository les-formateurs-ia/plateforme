// Réponses d'un élève à une mission de fin de module (cf. data/missions).
// mission_submissions.html_content contient le document imprimable de la
// mission (MissionPrintDocument : c'est lui qui part dans le PDF) avec les
// réponses brutes embarquées en JSON (#mission-answers) pour reprendre un
// brouillon. Les brouillons et missions validées enregistrés par l'ancienne
// page HTML (iframe) n'ont pas ce JSON : on relit alors leurs champs par
// identifiant, les mêmes que ceux des définitions de mission.
import type { MissionAnswer, MissionAnswers, MissionDefinition, MissionField } from "@/app/data/missions/types";
import { missionQuestions } from "@/app/data/missions";

export const MISSION_ANSWERS_SCRIPT_ID = "mission-answers";

export function emptyAnswer(field: MissionField): MissionAnswer {
  return field.type === "table" ? Array.from({ length: field.defaultRows }, () => field.columns.map(() => "")) : "";
}

export function isAnswered(answer: MissionAnswer | undefined): boolean {
  if (!answer) return false;
  if (typeof answer === "string") return answer.trim().length > 0;
  return answer.some((row) => row.some((cell) => cell.trim().length > 0));
}

// Ramène une valeur enregistrée à la forme attendue par le champ (colonnes
// ajoutées ou retirées depuis, type changé…) plutôt que de faire planter l'écran.
function normalize(field: MissionField, value: unknown): MissionAnswer {
  if (field.type === "table") {
    if (!Array.isArray(value) || !value.length) return emptyAnswer(field);
    return value.map((row) => field.columns.map((_, i) => (Array.isArray(row) && typeof row[i] === "string" ? row[i] : "")));
  }
  return typeof value === "string" ? value : "";
}

function readLegacyField(doc: Document, field: MissionField): unknown {
  const el = doc.getElementById(field.id);
  if (!el) return undefined;
  if (field.type === "image") return el.querySelector("img")?.getAttribute("src") ?? "";
  if (field.type === "table") {
    // Une ligne = les zones de saisie de ses cellules (la cellule du bouton
    // "supprimer" de l'ancienne page n'en contient pas).
    return Array.from(el.querySelectorAll("tr"))
      .map((tr) => Array.from(tr.querySelectorAll("textarea")).map((ta) => ta.textContent ?? ""))
      .filter((cells) => cells.length);
  }
  // L'ancienne page figeait la saisie dans le contenu des <textarea> et
  // l'attribut value des <input> (cf. injectMissionBridge).
  return el.tagName === "INPUT" ? el.getAttribute("value") ?? "" : el.textContent ?? "";
}

export function readMissionAnswers(mission: MissionDefinition, savedHtml: string | null): MissionAnswers {
  const doc = savedHtml ? new DOMParser().parseFromString(savedHtml, "text/html") : null;
  let stored: Record<string, unknown> | null = null;
  const json = doc?.getElementById(MISSION_ANSWERS_SCRIPT_ID)?.textContent;
  if (json) {
    try { stored = JSON.parse(json) as Record<string, unknown>; } catch { stored = null; }
  }
  const answers: MissionAnswers = {};
  for (const { field } of missionQuestions(mission)) {
    const raw = stored ? stored[field.id] : doc ? readLegacyField(doc, field) : undefined;
    answers[field.id] = raw === undefined ? emptyAnswer(field) : normalize(field, raw);
  }
  return answers;
}
