// Lien "Définir votre mot de passe" : l'admin le génère depuis la fiche élève
// (Edge Function generate-password-link), l'élève l'ouvre sur
// /definir-mot-de-passe#<jeton> (Edge Function password-setup). Le jeton est
// placé dans le fragment (#) : le navigateur ne l'envoie jamais au serveur
// qui sert la page ni dans l'en-tête Referer.
import { supabase } from "@/app/lib/supabase/client";

export const PASSWORD_SETUP_PATH = "/definir-mot-de-passe";
// Le lien remis à l'élève pointe toujours vers la plateforme officielle, même
// généré depuis un poste de développement (localhost) : le jeton vit dans la
// même base Supabase, seule l'adresse de la page change.
const PLATFORM_URL = "https://plateforme.les-formateurs-ia.fr";

export class PasswordSetupError extends Error {
  constructor(message: string, readonly invalidLink = false) {
    super(message);
  }
}

async function functionError(error: { message: string; context?: Response }): Promise<PasswordSetupError> {
  if (error.context) {
    try {
      const body = await error.context.clone().json();
      if (body?.error) return new PasswordSetupError(body.error, body.invalid === true);
    } catch {
      // corps non-JSON, on garde le message générique
    }
  }
  return new PasswordSetupError("Service indisponible. Vérifie ta connexion et réessaie.");
}

export async function generatePasswordLink(studentId: string): Promise<{ url: string; expiresAt: string }> {
  const { data, error } = await supabase.functions.invoke("generate-password-link", { body: { studentId } });
  if (error) throw await functionError(error);
  return { url: `${PLATFORM_URL}${PASSWORD_SETUP_PATH}#${data.token}`, expiresAt: data.expiresAt };
}

export type PasswordLinkInfo = { valid: true; firstName: string | null; email: string } | { valid: false };

export async function inspectPasswordLink(token: string): Promise<PasswordLinkInfo> {
  const { data, error } = await supabase.functions.invoke("password-setup", { body: { action: "inspect", token } });
  if (error) {
    const err = await functionError(error);
    if (err.invalidLink) return { valid: false };
    throw err;
  }
  return { valid: true, firstName: data.firstName ?? null, email: data.email };
}

// Renvoie l'email du compte, pour la connexion qui suit.
export async function completePasswordSetup(token: string, password: string): Promise<string> {
  const { data, error } = await supabase.functions.invoke("password-setup", { body: { action: "complete", token, password } });
  if (error) throw await functionError(error);
  return data.email;
}
