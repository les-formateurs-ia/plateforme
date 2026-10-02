// Fiche élève (admin) → "Générer le lien" : crée le lien "Définir votre mot
// de passe" qui permet à l'élève de remplacer le mot de passe de test par le
// sien (cf. Edge Function password-setup). Réservé à l'admin, comme
// "Réinitialiser les statistiques". Un seul lien actif par élève : l'upsert
// sur user_id écrase le hash précédent, ce qui annule l'ancien lien. Seul le
// hash est stocké ; le jeton en clair est renvoyé une seule fois, ici, et
// n'est journalisé nulle part. Nécessite la clé service-role : la table
// password_setup_tokens n'est accessible à aucun rôle client.
import { createClient } from "npm:@supabase/supabase-js@2.48.1";
import { CORS_HEADERS, jsonResponse, getCallerRole } from "../_shared/podcast-utils.ts";
import { generateToken, hashToken } from "../_shared/password-setup-token.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });

  try {
    const { studentId } = await req.json();
    if (typeof studentId !== "string" || !studentId.trim()) return jsonResponse({ error: "Identifiant élève manquant." }, 400);

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
      .select("id, role")
      .eq("id", studentId)
      .maybeSingle();
    if (targetErr) return jsonResponse({ error: targetErr.message }, 500);
    if (!target) return jsonResponse({ error: "Élève introuvable." }, 404);
    if (target.role !== "student") return jsonResponse({ error: "Ce lien est réservé aux comptes élèves." }, 400);

    // L'email de connexion fait foi (auth.users), pas la copie de profiles.
    const { data: authUser, error: authErr } = await serviceClient.auth.admin.getUserById(studentId);
    if (authErr || !authUser?.user?.email) return jsonResponse({ error: "Compte de connexion introuvable pour cet élève." }, 404);

    const token = generateToken();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 72 * 60 * 60 * 1000);

    const { error: upsertErr } = await serviceClient
      .from("password_setup_tokens")
      .upsert({
        user_id: studentId,
        token_hash: await hashToken(token),
        email: authUser.user.email,
        created_by: userData.user.id,
        created_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
      }, { onConflict: "user_id" });
    if (upsertErr) return jsonResponse({ error: "Impossible de générer le lien." }, 500);

    return jsonResponse({ token, expiresAt: expiresAt.toISOString() });
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : "Erreur inconnue." }, 500);
  }
});
