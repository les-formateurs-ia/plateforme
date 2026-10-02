// Page publique /definir-mot-de-passe#<jeton> (lien créé par
// generate-password-link) : l'élève, pas encore connecté, remplace le mot de
// passe de test par le sien sur son compte EXISTANT (profil, formations et
// progression inchangés). Appelée sans session (verify_jwt = false dans
// config.toml) : le jeton est la seule preuve, c'est pourquoi tout se vérifie
// ici — le compte et l'email viennent de la ligne du jeton, jamais du client.
//   • action "inspect"  : dit si le lien est valable et renvoie prénom + email
//                         à afficher. Un lien invalide ne renvoie rien d'autre.
//   • action "complete" : applique le nouveau mot de passe via Supabase Auth
//                         (hash bcrypt côté Auth : l'ancien cesse de marcher).
// Usage unique : le jeton est réclamé par un DELETE … RETURNING, atomique —
// sur N requêtes simultanées, une seule récupère la ligne. Si Supabase Auth
// refuse ensuite le mot de passe, la ligne est remise en place pour que
// l'élève puisse réessayer avec le même lien.
// Le mot de passe n'est ni stocké, ni journalisé, ni renvoyé.
import { createClient } from "npm:@supabase/supabase-js@2.48.1";
import { CORS_HEADERS, jsonResponse } from "../_shared/podcast-utils.ts";
import { hashToken, isWellFormedToken } from "../_shared/password-setup-token.ts";
import { passwordProblem } from "../_shared/password-policy.ts";

const INVALID_LINK = "Ce lien n'est plus valable : il a expiré, a déjà servi ou a été remplacé par un lien plus récent. Demande un nouveau lien à ton administrateur.";

function invalidLink() {
  return jsonResponse({ error: INVALID_LINK, invalid: true }, 410);
}

function sameEmail(a: string | null | undefined, b: string | null | undefined): boolean {
  return !!a && !!b && a.trim().toLowerCase() === b.trim().toLowerCase();
}

function translateAuthError(error: { code?: string; message: string }): string {
  const message = error.message.toLowerCase();
  if (error.code === "same_password" || message.includes("different from the old password")) {
    return "Ce mot de passe est celui qui t'a été fourni : choisis-en un nouveau.";
  }
  if (error.code === "weak_password" || message.includes("password should")) {
    return "Mot de passe jugé trop faible : choisis-en un plus long ou plus varié.";
  }
  return "Impossible d'enregistrer ton mot de passe pour le moment. Réessaie dans quelques instants.";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });
  if (req.method !== "POST") return jsonResponse({ error: "Méthode non autorisée." }, 405);

  let body: { action?: unknown; token?: unknown; password?: unknown };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Requête invalide." }, 400);
  }

  try {
    const { action, token, password } = body;
    if (action !== "inspect" && action !== "complete") return jsonResponse({ error: "Action inconnue." }, 400);
    if (!isWellFormedToken(token)) return invalidLink();

    const serviceClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const tokenHash = await hashToken(token);

    const { data: row, error: rowErr } = await serviceClient
      .from("password_setup_tokens")
      .select("user_id, email, expires_at")
      .eq("token_hash", tokenHash)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();
    if (rowErr) return jsonResponse({ error: "Vérification du lien impossible. Réessaie dans quelques instants." }, 500);
    if (!row) return invalidLink();

    // Le lien est lié à l'email du compte au moment de sa création : si
    // l'email de connexion a changé depuis, il est annulé.
    const { data: authUser } = await serviceClient.auth.admin.getUserById(row.user_id);
    if (!authUser?.user || !sameEmail(authUser.user.email, row.email)) {
      await serviceClient.from("password_setup_tokens").delete().eq("token_hash", tokenHash);
      return invalidLink();
    }
    const email = authUser.user.email!;

    if (action === "inspect") {
      const { data: profile } = await serviceClient.from("profiles").select("first_name").eq("id", row.user_id).maybeSingle();
      const firstName = profile?.first_name?.trim() || (authUser.user.user_metadata?.first_name as string | undefined)?.trim() || null;
      return jsonResponse({ valid: true, firstName, email, expiresAt: row.expires_at });
    }

    const newPassword = typeof password === "string" ? password : "";
    const problem = passwordProblem(newPassword, email);
    if (problem) return jsonResponse({ error: problem }, 400);

    const { data: claimed, error: claimErr } = await serviceClient
      .from("password_setup_tokens")
      .delete()
      .eq("token_hash", tokenHash)
      .gt("expires_at", new Date().toISOString())
      .select("user_id, token_hash, email, created_by, created_at, expires_at");
    if (claimErr) return jsonResponse({ error: "Vérification du lien impossible. Réessaie dans quelques instants." }, 500);
    const claim = claimed?.[0];
    if (!claim || claim.user_id !== row.user_id) return invalidLink();

    const { error: updateErr } = await serviceClient.auth.admin.updateUserById(claim.user_id, { password: newPassword });
    if (updateErr) {
      // Échec côté Auth : le lien n'a pas servi, on le rend à l'élève — sauf si
      // l'admin en a généré un nouveau entre-temps (conflit sur user_id).
      await serviceClient.from("password_setup_tokens").upsert(claim, { onConflict: "user_id", ignoreDuplicates: true });
      return jsonResponse({ error: translateAuthError(updateErr) }, 400);
    }

    return jsonResponse({ ok: true, email });
  } catch {
    return jsonResponse({ error: "Erreur inattendue. Réessaie dans quelques instants." }, 500);
  }
});
