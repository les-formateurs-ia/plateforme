// Cycle de vie "corbeille" des formations (templates) — réservé à l'admin
// côté DB (trigger formations_protect_soft_delete + policy admin_delete,
// cf. migration 0030). Un formateur qui appellerait ces fonctions recevrait
// une erreur Postgres, ces garde-fous côté client ne sont qu'un confort UX.
import { supabase } from "@/app/lib/supabase/client";
import type { FormationStatus } from "@/app/lib/supabase/database.types";
import { deleteLessonVideoFiles } from "@/app/lib/lessonVideos";

// Utilisé par le contexte de génération groupée (bulk-generation-context) une
// fois la génération des mindmaps de référence terminée, et pour repasser en
// 'generating' au lancement — un update ciblé plutôt que via saveCourse, qui
// réécrirait aussi tous les autres champs du formulaire.
export async function updateFormationStatus(formationId: string, status: FormationStatus): Promise<void> {
  const { error } = await supabase.from("formations").update({ status }).eq("id", formationId);
  if (error) throw error;
}

export interface TrashedFormationRow {
  id: string;
  name: string;
  description: string | null;
  deletedAt: string;
}

export async function softDeleteFormation(formationId: string): Promise<void> {
  const { error } = await supabase.from("formations").update({ deleted_at: new Date().toISOString() }).eq("id", formationId);
  if (error) throw error;
}

export async function restoreFormation(formationId: string): Promise<void> {
  const { error } = await supabase.from("formations").update({ deleted_at: null }).eq("id", formationId);
  if (error) throw error;
}

// Irréversible : supprime la ligne pour de bon (sections/leçons/quiz liés
// suivent par cascade). Aucun retour en arrière possible après cet appel.
export async function permanentlyDeleteFormation(formationId: string): Promise<void> {
  const { data: sections } = await supabase.from("sections").select("id").eq("formation_id", formationId);
  const sectionIds = (sections ?? []).map((s) => s.id);
  const videoUrls: (string | null)[] = [];
  if (sectionIds.length) {
    const { data: lessons } = await supabase.from("lessons").select("video_url, custom_video_url").in("section_id", sectionIds);
    videoUrls.push(...(lessons ?? []).flatMap((l) => [l.video_url, l.custom_video_url]));
  }
  const { error } = await supabase.from("formations").delete().eq("id", formationId);
  if (error) throw error;
  // La cascade DB supprime aussi sections/leçons — on nettoie leurs vidéos
  // dans le storage pour ne pas laisser de fichiers orphelins.
  await deleteLessonVideoFiles(videoUrls);
}

export async function listTrashedFormations(): Promise<TrashedFormationRow[]> {
  const { data, error } = await supabase
    .from("formations")
    .select("id, name, description, deleted_at")
    .not("deleted_at", "is", null)
    .order("deleted_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r) => ({ id: r.id, name: r.name, description: r.description, deletedAt: r.deleted_at as string }));
}

// ── "Utiliser en tant que template" ─────────────────────────────────────────
// Formations personnalisées des élèves (duplicatas, hors prévisualisations
// staff) pouvant servir de base à un nouveau template.
export interface StudentInstanceOption {
  id: string;
  name: string;
  studentId: string;
  studentName: string;
  assignedAt: string;
}

export async function listStudentInstancesForTemplate(): Promise<StudentInstanceOption[]> {
  const { data: instances, error } = await supabase
    .from("formation_instances")
    .select("id, name, user_id, assigned_at")
    .eq("is_preview", false)
    .order("assigned_at", { ascending: false });
  if (error) throw error;
  const userIds = [...new Set((instances ?? []).map((i) => i.user_id))];
  if (!userIds.length) return [];
  const { data: students, error: studentsError } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, email")
    .in("id", userIds)
    .eq("role", "student");
  if (studentsError) throw studentsError;
  const names = new Map((students ?? []).map((s) => [s.id, [s.first_name, s.last_name].filter(Boolean).join(" ").trim() || s.email]));
  return (instances ?? [])
    .filter((i) => names.has(i.user_id))
    .map((i) => ({ id: i.id, name: i.name, studentId: i.user_id, studentName: names.get(i.user_id)!, assignedAt: i.assigned_at }));
}

// Copie indépendante (nouveaux ids) de la structure et du contenu, sans
// aucune donnée de l'élève — cf. migration 20260923170000. Réservé à l'admin
// (vérifié côté SQL). Renvoie l'id du nouveau template, créé en brouillon.
export async function createTemplateFromInstance(instanceId: string, name: string, slug: string): Promise<string> {
  const { data, error } = await supabase.rpc("create_template_from_instance", { p_instance_id: instanceId, p_name: name, p_slug: slug });
  if (error) throw new Error(error.message);
  return data as string;
}
