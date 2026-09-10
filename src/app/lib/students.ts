// Création d'un élève depuis l'admin (fiche "Nouvel élève") — passe par une
// Edge Function service-role car ça crée un compte auth.users, cf.
// supabase/functions/create-student. Aucun email n'est envoyé.
import { supabase } from "@/app/lib/supabase/client";

export interface CreateStudentInput {
  firstName: string;
  lastName?: string;
  email: string;
  phone?: string;
  experience?: string;
  objective?: string;
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

export async function createStudent(input: CreateStudentInput): Promise<{ id: string }> {
  const { data, error } = await supabase.functions.invoke("create-student", { body: input });
  if (error) throw new Error(await extractFunctionError(error));
  if (data?.error) throw new Error(data.error);
  return data;
}
