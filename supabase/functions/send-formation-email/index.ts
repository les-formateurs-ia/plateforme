// Envoi à la demande des e-mails d'une session de formation (convocation,
// rappel, certificat et accès e-learning aux stagiaires ; lien de l'espace
// client au client),
// depuis le tableau de bord de la formation. Réservé à l'administrateur
// (le formateur n'a pas accès au lien de l'espace client) ; envoi par Gmail
// depuis le compte Google de la plateforme.
import { createClient } from "npm:@supabase/supabase-js@2.48.1";
import { CORS_HEADERS, getCallerRole, jsonResponse } from "../_shared/podcast-utils.ts";
import { GOOGLE_SCOPES, getPlatformGoogleAccount } from "../_shared/google-platform.ts";
import { buildRecipients, sendFormationEmails, type EmailKind } from "../_shared/formation-email.ts";

const KINDS: EmailKind[] = ["espace-client", "convocation", "rappel", "certificat", "acces-elearning"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });
  try {
    const { sessionId, kind, keys, preview } = await req.json();
    if (!sessionId || !KINDS.includes(kind)) return jsonResponse({ error: "Paramètres invalides." }, 400);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return jsonResponse({ error: "Non authentifié." }, 401);
    const userClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) return jsonResponse({ error: "Session invalide." }, 401);
    if (await getCallerRole(userClient, userData.user.id) !== "admin") return jsonResponse({ error: "Réservé à l'administrateur." }, 403);

    const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const frontendUrl = (Deno.env.get("FRONTEND_URL") ?? "https://plateforme.les-formateurs-ia.fr").replace(/\/$/, "");
    // Aperçu (fenêtre de confirmation) : destinataires et e-mails, rien n'est envoyé.
    if (preview) return jsonResponse({ recipients: await buildRecipients(db, { sessionId, kind, frontendUrl }) });

    const google = await getPlatformGoogleAccount(db);
    if (!google) return jsonResponse({ error: "Aucun compte Google plateforme connecté : connecte-le depuis ton profil admin." }, 503);
    if (!google.scopes.includes(GOOGLE_SCOPES.gmailSend)) {
      return jsonResponse({ error: "Le compte Google plateforme n'autorise pas l'envoi de mails : reconnecte-le depuis ton profil admin." }, 503);
    }

    const result = await sendFormationEmails(db, google, {
      sessionId, kind, keys: Array.isArray(keys) ? keys : undefined, automatic: false, sentBy: userData.user.id, frontendUrl,
    });
    return jsonResponse(result);
  } catch (err) {
    console.error(err);
    return jsonResponse({ error: err instanceof Error ? err.message : "Erreur inconnue." }, 500);
  }
});
