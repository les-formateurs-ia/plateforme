// Définit à la main le mot de passe d'un élève (Collaborateurs d'une
// entreprise → icône clé). Réservé à l'admin, comme update-student-email et
// generate-password-link : ça touche l'identifiant de connexion réel.
// Nécessite la clé service-role (auth.admin.updateUserById).
//
// Pour un collaborateur entreprise, must_onboard est aussi levé : sinon, à sa
// première connexion, /entreprise/welcome lui redemanderait de choisir un mot
// de passe et écraserait celui transmis par l'admin. Le trigger
// profiles_mark_company_invite_accepted passe alors son statut à "Compte
// activé". Les élèves CPF gardent leur must_onboard : il pilote leur
// formulaire d'inscription, pas le mot de passe.
import { createClient } from "npm:@supabase/supabase-js@2.48.1";
import { CORS_HEADERS, jsonResponse, getCallerRole } from "../_shared/podcast-utils.ts";
import { passwordProblem } from "../_shared/password-policy.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });

  try {
    const { studentId, password } = await req.json();
    if (typeof studentId !== "string" || !studentId.trim() || typeof password !== "string") {
      return jsonResponse({ error: "studentId et password sont obligatoires." }, 400);
    }

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

    const { data: target, error: targetErr } = await serviceClient
      .from("profiles")
      .select("id, role, company_id")
      .eq("id", studentId)
      .maybeSingle();
    if (targetErr) return jsonResponse({ error: targetErr.message }, 500);
    if (!target) return jsonResponse({ error: "Élève introuvable." }, 404);
    if (target.role !== "student") return jsonResponse({ error: "Réservé aux comptes élèves." }, 400);

    // L'email de connexion fait foi (auth.users), pas la copie de profiles.
    const { data: authUser, error: authErr } = await serviceClient.auth.admin.getUserById(studentId);
    if (authErr || !authUser?.user?.email) return jsonResponse({ error: "Compte de connexion introuvable pour cet élève." }, 404);

    const problem = passwordProblem(password, authUser.user.email);
    if (problem) return jsonResponse({ error: problem }, 400);

    const { error: updateErr } = await serviceClient.auth.admin.updateUserById(studentId, { password });
    if (updateErr) return jsonResponse({ error: updateErr.message }, 400);

    if (target.company_id) {
      const { error: onboardErr } = await serviceClient.from("profiles").update({ must_onboard: false }).eq("id", studentId);
      if (onboardErr) return jsonResponse({ error: onboardErr.message }, 500);
    }

    // Un lien "Définir votre mot de passe" en cours écraserait ce mot de passe : on l'annule.
    await serviceClient.from("password_setup_tokens").delete().eq("user_id", studentId);

    return jsonResponse({ ok: true, email: authUser.user.email });
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : "Erreur inconnue." }, 500);
  }
});
