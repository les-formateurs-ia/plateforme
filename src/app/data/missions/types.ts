// Trame d'une mission de fin de module (leçon "Mission", cf. lessons.mission_template) :
// introduction, exercices (contexte puis questions, chacune avec son champ de
// réponse) et grille de notation. Le texte est écrit en JSX dans chaque
// mission (strategieConfidentialite.tsx…) ; l'affichage est commun
// (components/lesson/MissionPlayer.tsx, PDF via MissionPrintDocument.tsx).
import type { ReactNode } from "react";

// id : identifiant stable de la réponse (clé des réponses enregistrées) —
// ne jamais le changer une fois des élèves partis sur la mission.
export type MissionField =
  | { type: "text"; id: string; placeholder: string }
  | { type: "textarea"; id: string; placeholder: string; tall?: boolean }
  | { type: "table"; id: string; columns: string[]; defaultRows: number }
  | { type: "image"; id: string; hint: string };

// case : mise en situation · prompt : texte de travail (prompt, procédure…)
// instr : consigne de l'exercice · note / key : encadré d'information.
export type MissionBlockVariant = "case" | "prompt" | "instr" | "note" | "key";

export interface MissionBlock {
  variant: MissionBlockVariant;
  label?: string;
  body: ReactNode;
}

export interface MissionQuestion {
  num: string;
  // Partie de l'exercice (I, II…) : la numérotation repart à 1 dans chacune.
  part?: string;
  prompt: ReactNode;
  field: MissionField;
}

export interface MissionExercise {
  eyebrow: string;
  title: string;
  context: MissionBlock[];
  questions: MissionQuestion[];
}

export interface MissionDefinition {
  key: string;
  title: string;
  // Résumé affiché dans le choix de la mission (éditeur de leçon).
  summary: string;
  intro: ReactNode;
  introBlocks: MissionBlock[];
  exercises: MissionExercise[];
  grading: { eyebrow: string; title: string; body: ReactNode };
  footnote: string;
}

export type MissionAnswer = string | string[][];
export type MissionAnswers = Record<string, MissionAnswer>;
