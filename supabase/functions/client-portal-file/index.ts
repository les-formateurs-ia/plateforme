// Téléchargement d'un document de rendez-vous depuis l'espace client
// (/espace-client/:token), sans compte : le lien personnel est la seule
// preuve d'accès. Le bucket session-meetings reste privé ; on renvoie une
// URL signée de 5 minutes, seulement si le rendez-vous appartient à la
// session de ce lien (client_meeting_file).
import { createClient } from "npm:@supabase/supabase-js@2.48.1";
import { CORS_HEADERS, jsonResponse } from "../_shared/podcast-utils.ts";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });
  if (req.method !== "POST") return jsonResponse({ error: "Méthode non autorisée." }, 405);
  try {
    const body = await req.json().catch(() => null);
    const token = body?.token;
    const meetingId = body?.meetingId;
    if (typeof token !== "string" || !UUID.test(token) || typeof meetingId !== "string" || !UUID.test(meetingId)) {
      return jsonResponse({ error: "Lien invalide." }, 400);
    }
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data, error } = await admin.rpc("client_meeting_file", { p_token: token, p_meeting_id: meetingId });
    if (error) throw error;
    const file = data?.[0];
    if (!file) return jsonResponse({ error: "Document introuvable." }, 404);
    const { data: signed, error: signError } = await admin.storage.from("session-meetings")
      .createSignedUrl(file.file_path, 300, { download: file.file_name ?? true });
    if (signError || !signed) throw signError ?? new Error("URL non signée.");
    return jsonResponse({ url: signed.signedUrl });
  } catch (err) {
    console.error("client-portal-file:", err);
    return jsonResponse({ error: "Téléchargement impossible pour le moment." }, 500);
  }
});
