// Étape 1 du flux OAuth Google Calendar (formateur) : construit l'URL de
// consentement Google et enregistre un état CSRF-safe (google_oauth_states)
// lié au formateur appelant. Le front redirige ensuite le navigateur vers
// cette URL ; google-oauth-callback récupère cet état au retour.
import { createClient } from "npm:@supabase/supabase-js@2.48.1";
import { CORS_HEADERS, jsonResponse, isStaffRole, getCallerRole } from "../_shared/podcast-utils.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });

  try {
    const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
    const redirectUri = Deno.env.get("GOOGLE_OAUTH_REDIRECT_URI");
    if (!clientId || !redirectUri) return jsonResponse({ error: "Google OAuth non configuré côté serveur." }, 500);

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
    if (!isStaffRole(role)) return jsonResponse({ error: "Réservé au staff." }, 403);

    // google_oauth_states n'a aucune policy RLS pour anon/authenticated —
    // seul un client service-role peut y écrire (voir 0037_google_oauth.sql).
    const serviceClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: stateRow, error: stateErr } = await serviceClient
      .from("google_oauth_states")
      .insert({ formateur_id: userData.user.id })
      .select("state")
      .single();
    if (stateErr) throw stateErr;

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      access_type: "offline",
      // Sans "consent" ici, Google ne renvoie un refresh_token qu'à la toute
      // première autorisation — on le force à chaque connexion pour toujours
      // repartir avec un refresh_token utilisable.
      prompt: "consent",
      scope: "https://www.googleapis.com/auth/calendar.events",
      state: stateRow.state,
    });

    return jsonResponse({ url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}` });
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : "Erreur inconnue." }, 500);
  }
});
