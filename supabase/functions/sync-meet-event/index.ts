// Crée/met à jour/supprime l'évènement Google Meet d'un rendez-vous, sur le
// calendrier du compte Google UNIQUE de la plateforme (google_oauth_tokens,
// is_platform_default = true — connecté par un admin via google-oauth-*,
// cf. 0059) — jamais celui du formateur assigné au rendez-vous : formateur
// et élève ne sont que des invités. Appelée en best-effort depuis
// availability.ts après chaque mutation de rendez_vous — ne doit jamais
// faire échouer la réservation elle-même : si aucun admin n'a connecté de
// compte, ou si l'appel Google échoue, on répond quand même ok:true avec
// meetLink:null (le front retente au prochain chargement).
import { createClient } from "npm:@supabase/supabase-js@2.48.1";
import { CORS_HEADERS, jsonResponse } from "../_shared/podcast-utils.ts";

async function refreshAccessToken(clientId: string, clientSecret: string, refreshToken: string) {
  const resp = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  if (!resp.ok) throw new Error(`Échec du rafraîchissement du token Google : ${await resp.text()}`);
  const json = await resp.json();
  return {
    accessToken: json.access_token as string,
    expiresAt: new Date(Date.now() + (json.expires_in ?? 3600) * 1000).toISOString(),
  };
}

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

    const { rdvId } = await req.json();
    if (!rdvId) return jsonResponse({ error: "rdvId manquant." }, 400);

    // RLS "rendez_vous_read"/"rendez_vous_update" existantes : l'appelant
    // doit déjà être participant (élève ou formateur) du rendez-vous.
    const { data: rdv, error: rdvErr } = await supabase
      .from("rendez_vous")
      .select("id, formateur_id, student_id, slot_date, start_time, end_time, status, google_event_id")
      .eq("id", rdvId)
      .maybeSingle();
    if (rdvErr) throw rdvErr;
    if (!rdv) return jsonResponse({ error: "Rendez-vous introuvable." }, 404);

    // google_oauth_tokens n'est accessible qu'en service-role (voir
    // 0037_google_oauth.sql) — jamais via le client JWT-forwardé ci-dessus.
    // is_platform_default = true identifie LE compte plateforme (0059),
    // indépendamment du formateur assigné à ce rendez-vous.
    const serviceClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: tokenRow } = await serviceClient
      .from("google_oauth_tokens")
      .select("*")
      .eq("is_platform_default", true)
      .maybeSingle();
    if (!tokenRow) return jsonResponse({ ok: true, meetLink: null });

    const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
    const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");
    if (!clientId || !clientSecret) return jsonResponse({ ok: true, meetLink: null });

    let accessToken = tokenRow.access_token as string | null;
    const expiresAtMs = tokenRow.access_token_expires_at ? new Date(tokenRow.access_token_expires_at).getTime() : 0;
    if (!accessToken || expiresAtMs < Date.now() + 60_000) {
      const refreshed = await refreshAccessToken(clientId, clientSecret, tokenRow.refresh_token);
      accessToken = refreshed.accessToken;
      await serviceClient
        .from("google_oauth_tokens")
        .update({ access_token: refreshed.accessToken, access_token_expires_at: refreshed.expiresAt })
        .eq("formateur_id", tokenRow.formateur_id);
    }

    // Annulé → on supprime l'évènement Google s'il existe, rien d'autre à faire.
    if (rdv.status === "cancelled") {
      if (rdv.google_event_id) {
        await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${rdv.google_event_id}?sendUpdates=all`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${accessToken}` },
        }).catch(() => {});
        await supabase.from("rendez_vous").update({ google_event_id: null, meet_link: null }).eq("id", rdv.id);
      }
      return jsonResponse({ ok: true, meetLink: null });
    }

    // Pas confirmé → pas de Meet (garde-fou côté serveur, même si le front
    // n'appelle cette fonction que pour des rendez-vous confirmés).
    if (rdv.status !== "confirmed") {
      return jsonResponse({ ok: true, meetLink: null });
    }

    const { data: profiles } = await supabase.from("profiles").select("id, email").in("id", [rdv.formateur_id, rdv.student_id]);
    const formateurEmail = profiles?.find((p) => p.id === rdv.formateur_id)?.email;
    const studentEmail = profiles?.find((p) => p.id === rdv.student_id)?.email;

    // Pas d'offset numérique fixe : timeZone laisse Google gérer le
    // changement d'heure été/hiver correctement des deux côtés de l'année.
    const eventBody = {
      summary: "Rendez-vous — session de coaching",
      start: { dateTime: `${rdv.slot_date}T${rdv.start_time}`, timeZone: "Europe/Paris" },
      end: { dateTime: `${rdv.slot_date}T${rdv.end_time}`, timeZone: "Europe/Paris" },
      attendees: [formateurEmail, studentEmail].filter((e): e is string => !!e).map((email) => ({ email })),
      conferenceData: {
        createRequest: { requestId: `${rdv.id}-${crypto.randomUUID()}`, conferenceSolutionKey: { type: "hangoutsMeet" } },
      },
    };

    const createEvent = () =>
      fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1&sendUpdates=all`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify(eventBody),
      });

    let eventResp: Response;
    let claimedForCreate = false;
    if (rdv.google_event_id) {
      eventResp = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${rdv.google_event_id}?conferenceDataVersion=1&sendUpdates=all`,
        { method: "PATCH", headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" }, body: JSON.stringify(eventBody) },
      );
      // L'évènement a pu être supprimé côté Google (à la main) — on retente une création.
      if (eventResp.status === 404) eventResp = await createEvent();
    } else {
      // Verrou optimiste : cette fonction est appelée à la fois explicitement
      // après chaque réservation ET par un retry silencieux côté front (tant
      // qu'un rendez-vous confirmé n'a pas de lien) — sans garde, deux appels
      // concurrents (même onglet, ou formateur et élève connectés en même
      // temps) créeraient chacun un évènement Google Meet distinct et
      // enverraient un double email d'invitation. On ne réserve la création
      // que si google_event_id est encore vide ; le perdant de la course
      // renvoie simplement le lien déjà posé par le gagnant (ou null s'il
      // n'a pas encore fini).
      const { data: claimed } = await supabase
        .from("rendez_vous")
        .update({ google_event_id: "pending" })
        .eq("id", rdv.id)
        .is("google_event_id", null)
        .select("id");
      if (!claimed || claimed.length === 0) {
        const { data: current } = await supabase.from("rendez_vous").select("meet_link").eq("id", rdv.id).maybeSingle();
        return jsonResponse({ ok: true, meetLink: current?.meet_link ?? null });
      }
      claimedForCreate = true;
      eventResp = await createEvent();
    }

    if (!eventResp.ok) {
      console.error("sync-meet-event: Google Calendar error", await eventResp.text());
      // Libère le verrou pour qu'un prochain appel puisse retenter la création.
      if (claimedForCreate) await supabase.from("rendez_vous").update({ google_event_id: null }).eq("id", rdv.id);
      return jsonResponse({ ok: true, meetLink: null });
    }

    const event = await eventResp.json();
    const meetLink: string | null =
      event.hangoutLink ?? event.conferenceData?.entryPoints?.find((e: { entryPointType?: string }) => e.entryPointType === "video")?.uri ?? null;

    await supabase.from("rendez_vous").update({ google_event_id: event.id, meet_link: meetLink }).eq("id", rdv.id);

    return jsonResponse({ ok: true, meetLink });
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : "Erreur inconnue." }, 500);
  }
});
