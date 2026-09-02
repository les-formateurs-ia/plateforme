import type { Role } from "@/app/state/auth-context";

// admin & formateur ont les mêmes droits sur le contenu pédagogique — sauf
// deux exceptions gérées au cas par cas là où elles s'appliquent :
// inscription/désinscription des élèves (admin uniquement) et édition du
// Playground HTML d'une leçon (admin uniquement, appliqué aussi côté DB).
export function isStaff(role: Role | null): boolean {
  return role === "admin" || role === "formateur";
}

// Actions admin uniquement (le formateur ne les a pas) : suppression d'une
// formation (corbeille + suppression définitive), changement de statut d'une
// formation attribuée, attribution d'un formateur ou d'une formation à un
// élève. Miroir de is_admin() côté DB.
export function isAdmin(role: Role | null): boolean {
  return role === "admin";
}
