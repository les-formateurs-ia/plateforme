// Génère un lien de connexion pour un élève/formateur au profit d'un membre
// du staff ("Se connecter en tant que") : mint un token magiclink via
// auth.admin.generateLink() (n'envoie jamais d'email, contrairement à
// inviteUserByEmail) que le client échange ensuite via verifyOtp() pour
// obtenir une vraie session sur le compte ciblé, sans mot de passe. Nécessite
// la clé service-role : generateLink() n'est pas exposé côté client.
import { createClient } from "npm:@supabase/supabase-js@2.48.1";
import { CORS_HEADERS, jsonResponse, isStaffRole, getCallerRole } from "../_shared/podcast-utils.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });

  try {
    const { targetUserId } = await req.json();
    if (!targetUserId?.trim()) return jsonResponse({ error: "Identifiant cible manquant." }, 400);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return jsonResponse({ error: "Non authentifié." }, 401);

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) return jsonResponse({ error: "Session invalide." }, 401);

    const callerId = userData.user.id;
    const callerRole = await getCallerRole(userClient, callerId);
    if (!isStaffRole(callerRole)) return jsonResponse({ error: "Réservé à l'équipe pédagogique." }, 403);

    const { data: target, error: targetErr } = await userClient
      .from("profiles")
      .select("id, email, first_name, last_name, role, formateur_id")
      .eq("id", targetUserId)
      .maybeSingle();
    if (targetErr) return jsonResponse({ error: targetErr.message }, 500);
    if (!target) return jsonResponse({ error: "Utilisateur introuvable." }, 404);

    // Jamais usurper un compte admin, même pour un autre admin — indépendant
    // de qui appelle.
    if (target.role === "admin") return jsonResponse({ error: "Impossible de se connecter en tant qu'administrateur." }, 403);

    // Un formateur ne peut se connecter qu'en tant que SES élèves attitrés
    // (même restriction que Planning, cf. profiles.formateur_id) — l'admin
    // peut lui se connecter en tant qu'élève ou formateur.
    if (callerRole === "formateur") {
      if (target.role !== "student" || target.formateur_id !== callerId) {
        return jsonResponse({ error: "Tu ne peux te connecter qu'en tant que tes propres élèves." }, 403);
      }
    }

    const serviceClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: linkData, error: linkError } = await serviceClient.auth.admin.generateLink({
      type: "magiclink",
      email: target.email,
    });
    if (linkError || !linkData?.properties?.hashed_token) {
      return jsonResponse({ error: linkError?.message ?? "Échec de la génération du lien de connexion." }, 500);
    }

    return jsonResponse({
      email: target.email,
      tokenHash: linkData.properties.hashed_token,
      firstName: target.first_name,
      lastName: target.last_name,
    });
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : "Erreur inconnue." }, 500);
  }
});
