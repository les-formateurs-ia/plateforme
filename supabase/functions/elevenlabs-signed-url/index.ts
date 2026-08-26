// Proxy ElevenLabs pour l'onglet "Agent" (widget vocal Conversational AI).
// L'agent est privé (authentification requise côté ElevenLabs) : le widget
// front ne peut pas se connecter avec juste un agent-id, il lui faut une
// "signed URL" à usage limité (15 min) générée avec la clé API — donc côté
// serveur uniquement, jamais dans le navigateur. On vérifie que l'appelant
// est un utilisateur authentifié de la plateforme avant de la générer.
import { createClient } from "npm:@supabase/supabase-js@2.48.1";
import { CORS_HEADERS, jsonResponse } from "../_shared/podcast-utils.ts";

const AGENT_ID = "agent_2001m0z9v5qhfkytppq64fnc5j4x";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });

  try {
    const apiKey = Deno.env.get("ELEVEN_LABS_API_KEY");
    if (!apiKey) return jsonResponse({ error: "ELEVEN_LABS_API_KEY non configurée côté serveur." }, 500);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return jsonResponse({ error: "Non authentifié." }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) return jsonResponse({ error: "Session invalide." }, 401);

    const resp = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${AGENT_ID}`,
      { headers: { "xi-api-key": apiKey } },
    );
    if (!resp.ok) return jsonResponse({ error: `ElevenLabs a échoué : ${await resp.text()}` }, 502);

    const json = await resp.json();
    return jsonResponse({ signedUrl: json.signed_url });
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : "Erreur inconnue." }, 500);
  }
});
