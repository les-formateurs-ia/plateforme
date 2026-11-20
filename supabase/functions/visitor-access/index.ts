// Ouverture d'un lien Visiteur (/visite/:jeton → ici). Le jeton du lien fait
// foi : on vérifie qu'il est actif, puis on génère un lien de connexion à
// usage unique vers le compte visiteur associé et on y redirige — même
// mécanique que learner-access. Ne connecte jamais un compte qui n'est pas
// marqué visiteur.
import { createClient } from "npm:@supabase/supabase-js@2.48.1";

Deno.serve(async (req) => {
  const frontendUrl = (Deno.env.get("FRONTEND_URL") ?? "https://plateforme.les-formateurs-ia.fr").replace(/\/$/, "");
  const fail = (reason: string) => {
    console.error("visitor-access:", reason);
    return Response.redirect(`${frontendUrl}/login?visite=${encodeURIComponent(reason.split(":")[0])}`, 302);
  };

  try {
    const token = new URL(req.url).searchParams.get("t") ?? "";
    if (!/^[0-9a-f-]{36}$/i.test(token)) return fail("lien_invalide");

    const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: link } = await db.from("visitor_links")
      .select("id, profile_id, expires_at, revoked_at, open_count").eq("token", token).maybeSingle();
    if (!link) return fail("lien_invalide");
    if (link.revoked_at || (link.expires_at && new Date(link.expires_at).getTime() < Date.now())) return fail("lien_expire");

    const { data: profile } = await db.from("profiles").select("id, email, role, is_visitor").eq("id", link.profile_id).maybeSingle();
    if (!profile || profile.role !== "student" || !profile.is_visitor) return fail("lien_invalide");

    await db.from("visitor_links")
      .update({ open_count: (link.open_count ?? 0) + 1, last_opened_at: new Date().toISOString() })
      .eq("id", link.id);

    const { data: magic, error: linkError } = await db.auth.admin.generateLink({
      type: "magiclink", email: profile.email, options: { redirectTo: `${frontendUrl}/` },
    });
    const actionLink = magic?.properties?.action_link;
    if (linkError || !actionLink) return fail(`lien_connexion: ${linkError?.message}`);
    return Response.redirect(actionLink, 302);
  } catch (err) {
    return fail(err instanceof Error ? err.message : "erreur");
  }
});
