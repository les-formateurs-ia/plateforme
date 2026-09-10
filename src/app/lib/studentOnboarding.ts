// Dossier onboarding d'un élève (âge, profession, objectif, style de tuteur
// IA) consulté/édité depuis la fiche élève admin/formateur — cf.
// AdminStudentDetailPage. RLS : onboarding_self (admin) +
// onboarding_formateur_own_students (formateur, ses élèves uniquement).
import { supabase } from "@/app/lib/supabase/client";

export type PedagogyStyle = "soft" | "strict" | "synth";

export interface StudentOnboardingInfo {
  age: string | null;
  profession: string | null;
  experience: string | null;
  objective: string | null;
  tutorPersona: PedagogyStyle | null;
}

export async function getStudentOnboarding(studentId: string): Promise<StudentOnboardingInfo | null> {
  const { data, error } = await supabase
    .from("student_onboarding")
    .select("age, profession, experience, goal, goal_detail, ai_tutor_persona")
    .eq("user_id", studentId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    age: data.age,
    profession: data.profession,
    experience: data.experience,
    objective: data.goal_detail || data.goal,
    tutorPersona: (data.ai_tutor_persona as PedagogyStyle | null) ?? null,
  };
}

export async function updateStudentExperience(studentId: string, experience: string): Promise<void> {
  const cleaned = experience.trim();
  const { error } = await supabase
    .from("student_onboarding")
    .upsert({ user_id: studentId, experience: cleaned });
  if (error) throw error;
}

export async function updateStudentObjective(studentId: string, objective: string): Promise<void> {
  const cleaned = objective.trim();
  const { error } = await supabase
    .from("student_onboarding")
    .update({ goal: cleaned, goal_detail: null })
    .eq("user_id", studentId);
  if (error) throw error;
}

export async function updateStudentTutorPersona(studentId: string, tutorPersona: PedagogyStyle): Promise<void> {
  const { error } = await supabase
    .from("student_onboarding")
    .update({ ai_tutor_persona: tutorPersona })
    .eq("user_id", studentId);
  if (error) throw error;
}
