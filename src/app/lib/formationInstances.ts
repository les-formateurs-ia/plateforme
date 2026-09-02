// Couche d'accès aux duplicatas de formation attribués à un élève — la
// personnalisation elle-même passe par AdminCourseEditorPage/AdminLessonEditorPage
// (mode instance), ce module couvre juste le cycle de vie de l'attribution.
import { supabase } from "@/app/lib/supabase/client";
import type { EnrollmentStatus } from "@/app/lib/supabase/database.types";

export interface FormationInstanceRow {
  id: string;
  templateId: string | null;
  userId: string;
  name: string;
  status: EnrollmentStatus;
  assignedAt: string;
}

export async function listInstancesForStudent(studentId: string): Promise<FormationInstanceRow[]> {
  const { data, error } = await supabase
    .from("formation_instances")
    .select("id, template_id, user_id, name, status, assigned_at")
    .eq("user_id", studentId)
    .order("assigned_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id,
    templateId: r.template_id,
    userId: r.user_id,
    name: r.name,
    status: r.status,
    assignedAt: r.assigned_at,
  }));
}

export interface PublishedTemplate {
  id: string;
  name: string;
}

export async function listPublishedTemplates(): Promise<PublishedTemplate[]> {
  const { data, error } = await supabase.from("formations").select("id, name").eq("status", "published").is("deleted_at", null).order("name");
  if (error) throw error;
  return data ?? [];
}

// Duplique intégralement le template choisi (formation → sections → leçons →
// quiz) côté base via la fonction RPC assign_formation_to_student — le
// template original n'est jamais modifié. Retourne l'id du nouveau duplicata.
export async function assignFormationToStudent(templateId: string, studentId: string): Promise<string> {
  const { data, error } = await supabase.rpc("assign_formation_to_student", {
    p_template_id: templateId,
    p_student_id: studentId,
  });
  if (error) throw error;
  return data as string;
}

export async function updateInstanceStatus(instanceId: string, status: EnrollmentStatus): Promise<void> {
  const { error } = await supabase.from("formation_instances").update({ status }).eq("id", instanceId);
  if (error) throw error;
}

export async function deleteInstance(instanceId: string): Promise<void> {
  const { error } = await supabase.from("formation_instances").delete().eq("id", instanceId);
  if (error) throw error;
}
