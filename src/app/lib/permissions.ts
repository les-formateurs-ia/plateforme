import type { Role } from "@/app/state/auth-context";

// admin & formateur ont les mêmes droits sur le contenu pédagogique — sauf
// deux exceptions gérées au cas par cas là où elles s'appliquent :
// inscription/désinscription des élèves (admin uniquement) et édition du
// Playground HTML d'une leçon (admin uniquement, appliqué aussi côté DB).
export function isStaff(role: Role | null): boolean {
  return role === "admin" || role === "formateur";
}
