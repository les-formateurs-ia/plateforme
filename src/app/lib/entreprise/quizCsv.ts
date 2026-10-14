// Import CSV des quiz entreprise (positionnement / validation). Format, une
// ligne par question, ligne d'en-tête facultative :
//   question;reponse_1;reponse_2;reponse_3;reponse_4;reponse_5;bonne_reponse;explication
// Réponses vides ignorées (2 minimum). bonne_reponse : numéro (1-5), lettre
// (A-E) ou texte exact d'une des réponses.
import type { QuizQuestionDraft } from "@/app/lib/entreprise/companyPositioning";

const HEADER = ["question", "reponse_1", "reponse_2", "reponse_3", "reponse_4", "reponse_5", "bonne_reponse", "explication"];
const ANSWER_COUNT = 5;

// Excel (Windows, français) enregistre souvent en Windows-1252 plutôt qu'en
// UTF-8 : on retente dans cet encodage si le fichier n'est pas de l'UTF-8 valide.
async function readText(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(buffer);
  } catch {
    text = new TextDecoder("windows-1252").decode(buffer);
  }
  return text.replace(/^﻿/, "");
}

// Parseur CSV minimal : guillemets doubles (avec "" échappé et retours à la
// ligne dans une cellule), fins de ligne \n ou \r\n.
function parseRows(text: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"' && cell === "") quoted = true;
    else if (c === delimiter) { row.push(cell); cell = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell); rows.push(row); row = []; cell = "";
    } else cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows.filter((r) => r.some((v) => v.trim()));
}

const normalize = (s: string) => s.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

function resolveCorrect(raw: string, answers: string[]): number | null {
  const value = raw.trim();
  if (!value) return null;
  const digits = value.match(/^(?:r[ée]ponse[\s_-]*)?(\d)$/i);
  if (digits) return Number(digits[1]) - 1;
  if (/^[a-e]$/i.test(value)) return value.toLowerCase().charCodeAt(0) - 97;
  const index = answers.findIndex((a) => a && normalize(a) === normalize(value));
  return index >= 0 ? index : null;
}

export interface QuizCsvResult { questions: QuizQuestionDraft[]; errors: string[]; }

export async function parseQuizCsv(file: File): Promise<QuizCsvResult> {
  const text = await readText(file);
  const firstLine = text.split(/\r?\n/, 1)[0] ?? "";
  // Séparateur attendu : ";" — on tolère "," ou tabulation si aucun ";" n'apparaît.
  const delimiter = firstLine.includes(";") ? ";" : firstLine.includes("\t") ? "\t" : firstLine.includes(",") ? "," : ";";
  const rows = parseRows(text, delimiter);
  const hasHeader = rows.length > 0 && normalize(rows[0][0] ?? "") === "question";

  const questions: QuizQuestionDraft[] = [];
  const errors: string[] = [];
  rows.forEach((cells, i) => {
    if (hasHeader && i === 0) return;
    const line = i + 1;
    const question = (cells[0] ?? "").trim();
    const answers = Array.from({ length: ANSWER_COUNT }, (_, j) => (cells[1 + j] ?? "").trim());
    const correctRaw = cells[1 + ANSWER_COUNT] ?? "";
    const explanation = (cells[2 + ANSWER_COUNT] ?? "").trim();

    if (!question) { errors.push(`Ligne ${line} : question vide.`); return; }
    if (answers.filter(Boolean).length < 2) { errors.push(`Ligne ${line} : au moins 2 réponses sont nécessaires.`); return; }
    const correct = resolveCorrect(correctRaw, answers);
    if (correct === null || correct < 0 || correct >= ANSWER_COUNT || !answers[correct]) {
      errors.push(`Ligne ${line} : bonne réponse « ${correctRaw.trim() || "vide"} » invalide (attendu : numéro 1 à 5 d'une réponse renseignée).`);
      return;
    }
    questions.push({
      question,
      explanation,
      options: answers
        .map((label, j) => ({ label, isCorrect: j === correct }))
        .filter((o) => o.label),
    });
  });
  return { questions, errors };
}

export function downloadQuizCsvTemplate() {
  const rows = [
    HEADER,
    ["Que signifie IA ?", "Intelligence artificielle", "Internet avancé", "Interface automatique", "", "", "1", "IA est l'abréviation d'intelligence artificielle."],
  ];
  const csv = "﻿" + rows.map((r) => r.join(";")).join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "modele-quiz.csv";
  link.click();
  URL.revokeObjectURL(url);
}
