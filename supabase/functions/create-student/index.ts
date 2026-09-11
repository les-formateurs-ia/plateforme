// Crée un compte élève depuis l'admin (fiche "Nouvel élève"), sans mot de
// passe et donc sans email envoyé (auth.admin.createUser() n'envoie jamais
// de mail, contrairement à inviteUserByEmail() utilisé pour les entreprises).
// L'élève ne peut pas encore se connecter : un mot de passe/lien de
// définition sera ajouté séparément (voir note produit). Nécessite la clé
// service-role : la création d'un compte auth et l'écriture du profil ne
// peuvent pas passer par une simple écriture RLS côté client.
import { createClient } from "npm:@supabase/supabase-js@2.48.1";
import { CORS_HEADERS, jsonResponse, isStaffRole, getCallerRole } from "../_shared/podcast-utils.ts";

function translateCreateError(message: string): string {
  if (message.includes("already been registered") || message.includes("already exists")) {
    return "Un compte existe déjà avec cet email sur la plateforme.";
  }
  return message;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });

  try {
    const { firstName, lastName, email, phone, experience, objective } = await req.json();
    if (!firstName?.trim() || !email?.trim()) return jsonResponse({ error: "Prénom et email sont obligatoires." }, 400);

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

    const { data: created, error: createError } = await serviceClient.auth.admin.createUser({
      email: email.trim(),
      email_confirm: true,
      user_metadata: { first_name: firstName.trim(), last_name: lastName?.trim() || null },
    });
    if (createError || !created?.user) {
      return jsonResponse({ error: translateCreateError(createError?.message ?? "Échec de la création du compte.") }, 400);
    }

    const studentId = created.user.id;

    // Le trigger on_auth_user_created insère déjà la ligne profiles (id, email) —
    // on la complète ici avec les infos saisies par l'admin.
    const { error: profileError } = await serviceClient
      .from("profiles")
      .update({
        first_name: firstName.trim(),
        last_name: lastName?.trim() || null,
        phone: phone?.trim() || null,
        must_onboard: false,
      })
      .eq("id", studentId);
    if (profileError) return jsonResponse({ error: profileError.message }, 500);

    const { error: onboardingError } = await serviceClient
      .from("student_onboarding")
      .upsert({
        user_id: studentId,
        experience: experience?.trim() || null,
        goal: objective?.trim() || null,
      });
    if (onboardingError) return jsonResponse({ error: onboardingError.message }, 500);

    return jsonResponse({ id: studentId });
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : "Erreur inconnue." }, 500);
  }
});
