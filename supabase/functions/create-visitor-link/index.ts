// Crée un lien Visiteur depuis l'admin (page « Liens visiteurs ») : un compte
// élève de démonstration (profiles.is_visitor), la formation choisie
// attribuée comme à n'importe quel élève, un petit budget IA, puis le lien
// /visite/:jeton à envoyer au prospect (cf. visitor-access).
//
// Le compte reçoit une adresse technique qui n'existe pas : aucun e-mail
// n'est jamais envoyé (createUser n'envoie rien, et visitor-access génère le
// lien de connexion sans l'expédier). L'attribution passe par la session de
// l'admin : assign_formation_to_student vérifie is_staff().
import { createClient } from "npm:@supabase/supabase-js@2.48.1";
import { CORS_HEADERS, jsonResponse, getCallerRole } from "../_shared/podcast-utils.ts";

const VISITOR_EMAIL_DOMAIN = "visiteur.les-formateurs-ia.fr";
const DEFAULT_BUDGET_USD = 1;
const MAX_BUDGET_USD = 20;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });

  try {
    const { label, templateId, budgetUsd, expiresInDays } = await req.json();
    if (typeof label !== "string" || !label.trim()) return jsonResponse({ error: "Le nom du lien est obligatoire." }, 400);
    if (typeof templateId !== "string" || !templateId) return jsonResponse({ error: "Choisis la formation à montrer." }, 400);
    const budget = budgetUsd == null || budgetUsd === "" ? DEFAULT_BUDGET_USD : Number(budgetUsd);
    if (!Number.isFinite(budget) || budget < 0 || budget > MAX_BUDGET_USD) {
      return jsonResponse({ error: `Le budget IA doit être compris entre 0 et ${MAX_BUDGET_USD} $.` }, 400);
    }
    const days = expiresInDays == null || expiresInDays === "" ? null : Number(expiresInDays);
    if (days !== null && (!Number.isInteger(days) || days < 1 || days > 365)) {
      return jsonResponse({ error: "La durée de validité doit être comprise entre 1 et 365 jours." }, 400);
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

    const email = `visiteur-${crypto.randomUUID().slice(0, 12)}@${VISITOR_EMAIL_DOMAIN}`;
    const { data: created, error: createError } = await serviceClient.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { first_name: "Visiteur", visitor_label: label.trim() },
    });
    if (createError || !created?.user) {
      return jsonResponse({ error: createError?.message ?? "Échec de la création du compte visiteur." }, 500);
    }
    const visitorId = created.user.id;

    // En cas d'échec plus loin, on ne laisse pas de compte orphelin.
    const rollback = async (message: string, status = 500) => {
      await serviceClient.auth.admin.deleteUser(visitorId);
      return jsonResponse({ error: message }, status);
    };

    // Le trigger on_auth_user_created a déjà inséré la ligne profiles.
    const { error: profileError } = await serviceClient.from("profiles").update({
      first_name: "Visiteur",
      last_name: null,
      must_onboard: false,
      is_visitor: true,
      ai_budget_usd: budget,
    }).eq("id", visitorId);
    if (profileError) return await rollback(profileError.message);

    const { error: onboardingError } = await serviceClient.from("student_onboarding").upsert({ user_id: visitorId });
    if (onboardingError) return await rollback(onboardingError.message);

    const { error: assignError } = await userClient.rpc("assign_formation_to_student", {
      p_template_id: templateId,
      p_student_id: visitorId,
    });
    if (assignError) return await rollback(assignError.message, 400);

    const expiresAt = days ? new Date(Date.now() + days * 86_400_000).toISOString() : null;
    const { data: link, error: linkError } = await serviceClient.from("visitor_links").insert({
      label: label.trim(),
      profile_id: visitorId,
      template_id: templateId,
      created_by: userData.user.id,
      expires_at: expiresAt,
    }).select("id, token").single();
    if (linkError || !link) return await rollback(linkError?.message ?? "Échec de la création du lien.");

    return jsonResponse({ id: link.id, token: link.token, profileId: visitorId });
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : "Erreur inconnue." }, 500);
  }
});
