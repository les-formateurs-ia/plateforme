// Change l'email de connexion d'un élève depuis la fiche admin. Réservé à
// l'admin (pas formateur) car ça touche l'identifiant de connexion réel.
// Nécessite la clé service-role : changer profiles.email seul désynchroniserait
// l'email de connexion (stocké sur auth.users, pas sur profiles) — on doit
// mettre à jour les deux dans le même geste. auth.admin.updateUserById()
// n'envoie aucun email de confirmation (email_confirm:true la marque
// directement comme vérifiée).
import { createClient } from "npm:@supabase/supabase-js@2.48.1";
import { CORS_HEADERS, jsonResponse, getCallerRole } from "../_shared/podcast-utils.ts";

function translateUpdateError(message: string): string {
  if (message.includes("already been registered") || message.includes("already exists")) {
    return "Un autre compte utilise déjà cet email.";
  }
  return message;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });

  try {
    const { studentId, email } = await req.json();
    if (!studentId || !email?.trim()) return jsonResponse({ error: "studentId et email sont obligatoires." }, 400);

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
    if (role !== "admin") return jsonResponse({ error: "Réservé aux administrateurs." }, 403);

    const serviceClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const trimmedEmail = email.trim();

    const { error: authError } = await serviceClient.auth.admin.updateUserById(studentId, {
      email: trimmedEmail,
      email_confirm: true,
    });
    if (authError) return jsonResponse({ error: translateUpdateError(authError.message) }, 400);

    const { error: profileError } = await serviceClient.from("profiles").update({ email: trimmedEmail }).eq("id", studentId);
    if (profileError) return jsonResponse({ error: profileError.message }, 500);

    return jsonResponse({ ok: true });
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : "Erreur inconnue." }, 500);
  }
});
