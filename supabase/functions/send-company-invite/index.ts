// Envoie l'accès entreprise (mail Supabase natif) à un ou plusieurs
// collaborateurs — appelé depuis le bouton "Envoyer les accès aux élèves"
// (toute l'entreprise) ou l'action par ligne (un seul élève). Doit tourner
// avec la clé service-role : inviteUserByEmail() et le rattachement
// company_id/first_name/last_name sur le nouveau profil ne peuvent pas
// passer par une simple écriture RLS côté client.
import { createClient } from "npm:@supabase/supabase-js@2.48.1";
import { CORS_HEADERS, jsonResponse, isStaffRole, getCallerRole } from "../_shared/podcast-utils.ts";

// Messages Supabase Auth bruts (anglais, peu actionnables) → texte FR clair,
// même esprit que translateAuthError() côté client (auth-context.tsx).
function translateInviteError(message: string): string {
  if (message.includes("already been registered")) {
    return "Un compte existe déjà avec cet email sur la plateforme (élève CPF ou autre) — impossible d'envoyer une invitation. Ce collaborateur doit être rattaché manuellement par un administrateur.";
  }
  if (message.toLowerCase().includes("rate limit") || message.toLowerCase().includes("is invalid")) {
    return "L'envoi d'email a échoué (limite d'envoi de la messagerie atteinte) — réessaie dans quelques minutes.";
  }
  return message;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });

  try {
    const { employeeIds } = await req.json();
    if (!Array.isArray(employeeIds) || !employeeIds.length) return jsonResponse({ error: "employeeIds manquant." }, 400);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return jsonResponse({ error: "Non authentifié." }, 401);

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) return jsonResponse({ error: "Session invalide." }, 401);

    const role = await getCallerRole(userClient, userData.user.id);
    if (!isStaffRole(role)) return jsonResponse({ error: "Réservé à l'équipe pédagogique." }, 403);

    const serviceClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const frontendUrl = Deno.env.get("FRONTEND_URL") ?? "http://localhost:5173";

    const { data: employees, error: employeesError } = await serviceClient
      .from("company_employees")
      .select("id, company_id, first_name, last_name, email, profile_id")
      .in("id", employeeIds);
    if (employeesError) return jsonResponse({ error: employeesError.message }, 500);

    const sent: string[] = [];
    const skipped: string[] = [];
    const errors: { employeeId: string; message: string }[] = [];

    for (const employee of employees ?? []) {
      if (employee.profile_id) { skipped.push(employee.id); continue; }

      const { data: invited, error: inviteError } = await serviceClient.auth.admin.inviteUserByEmail(employee.email, {
        redirectTo: `${frontendUrl}/entreprise/welcome`,
        data: { company_id: employee.company_id, first_name: employee.first_name, last_name: employee.last_name },
      });
      if (inviteError || !invited?.user) {
        errors.push({ employeeId: employee.id, message: translateInviteError(inviteError?.message ?? "Échec de l'invitation.") });
        continue;
      }

      const nowIso = new Date().toISOString();
      const { error: profileError } = await serviceClient
        .from("profiles")
        .update({ company_id: employee.company_id, first_name: employee.first_name, last_name: employee.last_name })
        .eq("id", invited.user.id);
      if (profileError) { errors.push({ employeeId: employee.id, message: profileError.message }); continue; }

      const { error: linkError } = await serviceClient
        .from("company_employees")
        .update({ profile_id: invited.user.id, invite_sent_at: nowIso })
        .eq("id", employee.id);
      if (linkError) { errors.push({ employeeId: employee.id, message: linkError.message }); continue; }

      sent.push(employee.id);
    }

    return jsonResponse({ sent, skipped, errors });
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : "Erreur inconnue." }, 500);
  }
});
