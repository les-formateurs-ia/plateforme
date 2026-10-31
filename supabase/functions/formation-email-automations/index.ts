// Envois automatiques quotidiens (pg_cron, cf. migration 20261103120000),
// pour les sessions dont auto_emails est actif :
//   * convocation à chaque stagiaire dès J-7 (une seule fois) ;
//   * rappel la veille de chaque séance ;
//   * certificat de réalisation après la formation, dès qu'il est émis.
// Protégé par le secret CRON_SECRET (en-tête x-cron-secret), pas de compte.
import { createClient } from "npm:@supabase/supabase-js@2.48.1";
import { CORS_HEADERS, jsonResponse } from "../_shared/podcast-utils.ts";
import { GOOGLE_SCOPES, getPlatformGoogleAccount } from "../_shared/google-platform.ts";
import { sendFormationEmails, type EmailKind } from "../_shared/formation-email.ts";

const parisDate = (offsetDays = 0) => {
  const d = new Date(Date.now() + offsetDays * 86_400_000);
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris" }).format(d);
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });
  const secret = Deno.env.get("CRON_SECRET");
  if (!secret || req.headers.get("x-cron-secret") !== secret) return jsonResponse({ error: "Non autorisé." }, 401);

  try {
    const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const google = await getPlatformGoogleAccount(db);
    if (!google || !google.scopes.includes(GOOGLE_SCOPES.gmailSend)) return jsonResponse({ error: "Compte Google plateforme absent ou sans droit d'envoi." }, 503);
    const frontendUrl = (Deno.env.get("FRONTEND_URL") ?? "https://plateforme.les-formateurs-ia.fr").replace(/\/$/, "");
    const today = parisDate();
    const inSevenDays = parisDate(7);
    const tomorrow = parisDate(1);

    const { data: sessions } = await db.from("training_sessions").select("id, date_debut, date_fin")
      .eq("auto_emails", true).gte("date_fin", parisDate(-30));
    const summary: { sessionId: string; kind: EmailKind; sent: number }[] = [];

    for (const s of sessions ?? []) {
      const [{ data: trainees }, { data: emails }, { data: slots }, { data: certs }] = await Promise.all([
        db.from("training_session_trainees").select("id").eq("session_id", s.id),
        db.from("session_emails").select("kind, trainee_id, sent_at").eq("session_id", s.id).eq("status", "sent"),
        db.from("training_session_slots").select("slot_date").eq("session_id", s.id),
        db.from("session_documents").select("trainee_id").eq("session_id", s.id).eq("template_id", "certificat-realisation").not("trainee_id", "is", null),
      ]);
      const ids = (trainees ?? []).map((t: { id: string }) => t.id);
      const already = (kind: EmailKind, since?: string) => new Set((emails ?? [])
        .filter((e: { kind: string; sent_at: string }) => e.kind === kind && (!since || e.sent_at.slice(0, 10) >= since))
        .map((e: { trainee_id: string }) => e.trainee_id));

      const run = async (kind: EmailKind, traineeIds: string[]) => {
        if (!traineeIds.length) return;
        const r = await sendFormationEmails(db, google, { sessionId: s.id, kind, traineeIds, automatic: true, sentBy: null, frontendUrl });
        summary.push({ sessionId: s.id, kind, sent: r.sent.length });
      };

      // Convocation : dès J-7 et jusqu'au premier jour, une seule fois par stagiaire.
      if (s.date_debut <= inSevenDays && s.date_debut >= today) {
        const sent = already("convocation");
        await run("convocation", ids.filter((id: string) => !sent.has(id)));
      }
      // Rappel : la veille d'une séance, une fois par jour.
      if ((slots ?? []).some((sl: { slot_date: string }) => sl.slot_date === tomorrow)) {
        const sent = already("rappel", today);
        await run("rappel", ids.filter((id: string) => !sent.has(id)));
      }
      // Certificat : après la formation, dès que le certificat individuel est émis.
      if (s.date_fin < today) {
        const sent = already("certificat");
        const withCert = new Set((certs ?? []).map((c: { trainee_id: string }) => c.trainee_id));
        await run("certificat", ids.filter((id: string) => withCert.has(id) && !sent.has(id)));
      }
    }
    return jsonResponse({ ok: true, summary });
  } catch (err) {
    console.error(err);
    return jsonResponse({ error: err instanceof Error ? err.message : "Erreur inconnue." }, 500);
  }
});
