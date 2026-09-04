// Étape 2 du flux OAuth Google Calendar : Google redirige le navigateur ici
// avec ?code&state. Fonction PUBLIQUE — pas de header Authorization possible
// (c'est une redirection navigateur, pas un appel authentifié depuis notre
// front) : l'identité du formateur est retrouvée via l'état déposé par
// google-oauth-start (google_oauth_states), à usage unique.
import { createClient } from "npm:@supabase/supabase-js@2.48.1";

Deno.serve(async (req) => {
  const frontendUrl = Deno.env.get("FRONTEND_URL") ?? "/";
  const fail = (reason: string) => {
    console.error("google-oauth-callback:", reason);
    return Response.redirect(`${frontendUrl}/profile?google=error`, 302);
  };

  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    if (!code || !state) return fail("missing_params");

    const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
    const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");
    const redirectUri = Deno.env.get("GOOGLE_OAUTH_REDIRECT_URI");
    if (!clientId || !clientSecret || !redirectUri) return fail("not_configured");

    const serviceClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: stateRow } = await serviceClient
      .from("google_oauth_states")
      .select("formateur_id, created_at")
      .eq("state", state)
      .maybeSingle();
    if (!stateRow) return fail("invalid_state");
    // À usage unique, qu'il soit valide ou non ensuite.
    await serviceClient.from("google_oauth_states").delete().eq("state", state);

    const ageMs = Date.now() - new Date(stateRow.created_at).getTime();
    if (ageMs > 10 * 60 * 1000) return fail("expired_state");

    const tokenResp = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });
    if (!tokenResp.ok) return fail(`token_exchange_failed: ${await tokenResp.text()}`);
    const tokens = await tokenResp.json();
    if (!tokens.refresh_token) return fail("no_refresh_token");

    const userinfoResp = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const userinfo = userinfoResp.ok ? await userinfoResp.json() : {};
    const googleEmail: string | null = userinfo.email ?? null;

    const expiresAt = new Date(Date.now() + (tokens.expires_in ?? 3600) * 1000).toISOString();

    const { error: upsertErr } = await serviceClient.from("google_oauth_tokens").upsert({
      formateur_id: stateRow.formateur_id,
      refresh_token: tokens.refresh_token,
      access_token: tokens.access_token,
      access_token_expires_at: expiresAt,
      google_email: googleEmail,
      connected_at: new Date().toISOString(),
    });
    if (upsertErr) return fail(`token_store_failed: ${upsertErr.message}`);

    await serviceClient.from("profiles").update({ google_calendar_email: googleEmail }).eq("id", stateRow.formateur_id);

    return Response.redirect(`${frontendUrl}/profile?google=connected`, 302);
  } catch (err) {
    return fail(err instanceof Error ? err.message : "unexpected_error");
  }
});
