import { isLessonCompleted, type CourseOutline, type LessonWithState, type OutlineSection } from "@/app/lib/learning";

// État d'un module dans le parcours de l'élève — partagé par l'accueil (frise
// du parcours) et « Mes leçons », pour que les deux disent la même chose.
//   done    : toutes les leçons sont validées
//   current : contient la prochaine leçon à faire
//   started : commencé mais ce n'est pas là que se trouve la suite
//   todo    : ouvert, pas encore commencé
//   locked  : fermé par le formateur, ou aucune leçon accessible
export type ModuleStatus = "done" | "current" | "started" | "todo" | "locked";

export interface ModuleProgress {
  section: OutlineSection;
  index: number;
  done: number;
  total: number;
  pct: number;
  status: ModuleStatus;
  minutes: number;
}

export const MODULE_STATUS_LABEL: Record<ModuleStatus, string> = {
  done: "Validé",
  current: "En cours",
  started: "Commencé",
  todo: "À commencer",
  locked: "Verrouillé",
};

export function nextLessonOf(states: LessonWithState[]) {
  return states.find((s) => s.state === "available") ?? null;
}

export function moduleProgress(outline: CourseOutline, states: LessonWithState[]): ModuleProgress[] {
  const next = nextLessonOf(states);
  return outline.sections.map((section, index) => {
    const own = section.lessons.map((l) => states.find((s) => s.lesson.id === l.id));
    const done = own.filter(isLessonCompleted).length;
    const total = section.lessons.length;
    const allLocked = own.length > 0 && own.every((s) => s?.state === "locked");
    const status: ModuleStatus =
      total > 0 && done === total ? "done"
      : !section.isUnlocked || allLocked ? "locked"
      : next && section.lessons.some((l) => l.id === next.lesson.id) ? "current"
      : done > 0 ? "started"
      : "todo";
    const minutes = section.lessons.reduce((m, l) => m + (l.durationMinutes ?? 0), 0);
    return { section, index, done, total, pct: total ? Math.round((done / total) * 100) : 0, status, minutes };
  });
}

/** « 8 octobre » / « mercredi 8 octobre » en français. */
export function frenchDate(d = new Date(), withWeekday = true) {
  return d.toLocaleDateString("fr-FR", { weekday: withWeekday ? "long" : undefined, day: "numeric", month: "long" });
}

/** Salutation selon l'heure. */
export function greeting(d = new Date()) {
  const h = d.getHours();
  return h < 5 ? "Bonsoir" : h < 18 ? "Bonjour" : "Bonsoir";
}
