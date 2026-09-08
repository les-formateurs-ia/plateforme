// Statut du compte Google plateforme (cf. 0059) : indique s'il est connecté
// et par quel email, sans jamais exposer le token — réservé aux admins,
// seuls habilités à le connecter/déconnecter (google-oauth-start/disconnect).
import { createClient } from "npm:@supabase/supabase-js@2.48.1";
import { CORS_HEADERS, jsonResponse, getCallerRole } from "../_shared/podcast-utils.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return jsonResponse({ error: "Non authentifié." }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) return jsonResponse({ error: "Session invalide." }, 401);

    const role = await getCallerRole(supabase, userData.user.id);
    if (role !== "admin") return jsonResponse({ error: "Réservé aux admins." }, 403);

    const serviceClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: tokenRow } = await serviceClient
      .from("google_oauth_tokens")
      .select("google_email")
      .eq("is_platform_default", true)
      .maybeSingle();

    return jsonResponse({ connected: !!tokenRow, email: tokenRow?.google_email ?? null });
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : "Erreur inconnue." }, 500);
  }
});
