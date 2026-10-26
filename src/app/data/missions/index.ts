// Catalogue des missions de fin de module proposées dans l'éditeur de leçon
// ("Mission" → choix de la mission). La clé est enregistrée dans
// lessons.mission_template / instance_lessons.mission_template : ne jamais
// renommer une clé existante.
import type { MissionDefinition, MissionQuestion } from "./types";
import { strategieConfidentialite } from "./strategieConfidentialite";
import { contenuOptimisation } from "./contenuOptimisation";
import { conformiteAccessibilite } from "./conformiteAccessibilite";

export const MISSION_TEMPLATES: MissionDefinition[] = [strategieConfidentialite, contenuOptimisation, conformiteAccessibilite];

export function getMissionTemplate(key: string | null | undefined): MissionDefinition | null {
  return MISSION_TEMPLATES.find((m) => m.key === key) ?? null;
}

export function missionQuestions(mission: MissionDefinition): MissionQuestion[] {
  return mission.exercises.flatMap((e) => e.questions);
}
