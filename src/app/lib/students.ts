// Édition des informations de base d'un élève depuis sa fiche admin.
// profiles/student_onboarding passent par une écriture directe (RLS
// is_admin() les autorise déjà) ; l'email est un cas à part — cf.
// updateStudentEmail.
import { supabase } from "@/app/lib/supabase/client";

export interface StudentInfoUpdate {
  firstName: string;
  email: string;
  phone: string;
  age: string;
  profession: string;
}

async function extractFunctionError(error: { message: string; context?: Response }): Promise<string> {
  let message = error.message;
  if (error.context) {
    try {
      const body = await error.context.clone().json();
      if (body?.error) message = body.error;
    } catch {
      // corps non-JSON, on garde le message par défaut
    }
  }
  return message;
}

// Changer profiles.email seul désynchroniserait l'email de connexion réel
// (stocké sur auth.users, pas sur profiles) — passe par une Edge Function
// service-role qui met à jour les deux, cf. supabase/functions/update-student-email.
export async function updateStudentEmail(studentId: string, email: string): Promise<void> {
  const { data, error } = await supabase.functions.invoke("update-student-email", { body: { studentId, email } });
  if (error) throw new Error(await extractFunctionError(error));
  if (data?.error) throw new Error(data.error);
}

export async function saveStudentInfo(studentId: string, currentEmail: string, update: StudentInfoUpdate): Promise<void> {
  const { error: profileError } = await supabase
    .from("profiles")
    .update({ first_name: update.firstName.trim() || null, phone: update.phone.trim() || null })
    .eq("id", studentId);
  if (profileError) throw profileError;

  const { error: onboardingError } = await supabase
    .from("student_onboarding")
    .upsert({ user_id: studentId, age: update.age.trim() || null, profession: update.profession.trim() || null });
  if (onboardingError) throw onboardingError;

  const trimmedEmail = update.email.trim();
  if (trimmedEmail && trimmedEmail !== currentEmail) {
    await updateStudentEmail(studentId, trimmedEmail);
  }
}
