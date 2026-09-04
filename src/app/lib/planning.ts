// Données pour la page admin Planning (onglets étudiants/formateurs).
import { supabase } from "@/app/lib/supabase/client";

export interface PersonCard {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  avatarUrl: string | null;
}

export interface StudentCard extends PersonCard {
  activeFormationName: string | null;
  formateurId: string | null;
}

// `formateurId` restreint aux élèves dont ce formateur est le coach attitré
// (profiles.formateur_id) — utilisé par la page Planning pour qu'un
// formateur ne voie que SES élèves, contrairement à l'admin qui les voit
// tous (cf. 0024_student_formateur.sql).
export async function listStudentCards(formateurId?: string): Promise<StudentCard[]> {
  let studentsQuery = supabase.from("profiles").select("id, first_name, last_name, email, avatar_url, formateur_id").eq("role", "student").order("first_name");
  if (formateurId) studentsQuery = studentsQuery.eq("formateur_id", formateurId);

  const [{ data: students, error: studentsError }, { data: instances, error: instancesError }] = await Promise.all([
    studentsQuery,
    supabase.from("formation_instances").select("user_id, name, assigned_at").eq("status", "active").order("assigned_at", { ascending: false }),
  ]);
  if (studentsError) throw studentsError;
  if (instancesError) throw instancesError;

  // La liste est déjà triée par assigned_at desc : la première rencontrée
  // par élève est donc la formation active la plus récemment attribuée.
  const latestByStudent = new Map<string, string>();
  for (const inst of instances ?? []) {
    if (!latestByStudent.has(inst.user_id)) latestByStudent.set(inst.user_id, inst.name);
  }

  return (students ?? []).map((s) => ({
    id: s.id,
    firstName: s.first_name,
    lastName: s.last_name,
    email: s.email,
    avatarUrl: s.avatar_url,
    activeFormationName: latestByStudent.get(s.id) ?? null,
    formateurId: s.formateur_id,
  }));
}

export async function listFormateurCards(): Promise<PersonCard[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, email, avatar_url")
    .eq("role", "formateur")
    .order("first_name");
  if (error) throw error;
  return (data ?? []).map((p) => ({ id: p.id, firstName: p.first_name, lastName: p.last_name, email: p.email, avatarUrl: p.avatar_url }));
}

// Pour l'attribution "coach" d'un élève : un admin peut lui aussi être
// désigné comme référent, en plus des formateurs (contrairement à l'onglet
// Planning/Formateurs ci-dessus qui ne liste que le rôle "formateur").
export async function listCoachAssignableCards(): Promise<PersonCard[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, email, avatar_url")
    .in("role", ["formateur", "admin"])
    .order("first_name");
  if (error) throw error;
  return (data ?? []).map((p) => ({ id: p.id, firstName: p.first_name, lastName: p.last_name, email: p.email, avatarUrl: p.avatar_url }));
}

// Un formateur (ou admin) peut suivre plusieurs élèves, un élève n'a qu'un
// seul coach à la fois (cf. 0024_student_formateur.sql) — simple update de
// la colonne formateur_id sur le profil de l'élève.
export async function assignFormateurToStudent(studentId: string, formateurId: string | null): Promise<void> {
  const { error } = await supabase.from("profiles").update({ formateur_id: formateurId }).eq("id", studentId);
  if (error) throw error;
}
