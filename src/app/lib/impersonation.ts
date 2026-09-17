// Appel de l'Edge Function impersonate-user ("Se connecter en tant que") —
// cf. supabase/functions/impersonate-user.
import { supabase } from "@/app/lib/supabase/client";

export interface ImpersonationTicket {
  email: string;
  tokenHash: string;
  firstName: string | null;
  lastName: string | null;
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

export async function requestImpersonation(targetUserId: string): Promise<ImpersonationTicket> {
  const { data, error } = await supabase.functions.invoke("impersonate-user", { body: { targetUserId } });
  if (error) throw new Error(await extractFunctionError(error));
  if (data?.error) throw new Error(data.error);
  return data;
}
