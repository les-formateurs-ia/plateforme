// Mail "mission validée" : appelé par l'élève juste après la validation de sa
// mission (cf. src/app/lib/missionSubmissions.ts submitMission). Prévient son
// formateur assigné et tous les administrateurs, PDF de la mission en pièce
// jointe et lien vers la fiche de l'élève. Envoi par l'API Gmail depuis le
// compte Google de la plateforme (celui des Meet, connecté par un admin
// depuis son profil — il doit avoir autorisé l'envoi de mails).
//
// Un seul envoi par mission : la colonne mission_submissions.email_notified_at
// est réservée avant l'envoi (et libérée s'il échoue, pour pouvoir réessayer).
import { createClient } from "npm:@supabase/supabase-js@2.48.1";
import { CORS_HEADERS, jsonResponse } from "../_shared/podcast-utils.ts";
import { GOOGLE_SCOPES, getPlatformGoogleAccount } from "../_shared/google-platform.ts";

// Point d'envoi "upload" : accepte le message MIME brut jusqu'à 35 Mo (le PDF
// joint dépasse vite la limite de l'envoi JSON classique).
const GMAIL_SEND_URL = "https://gmail.googleapis.com/upload/gmail/v1/users/me/messages/send?uploadType=media";
const SENDER_NAME = "Les Formateurs IA";

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// Encodage par tranches : String.fromCharCode(...bytes) sur un PDF de
// plusieurs Mo dépasserait la taille maximale de la pile d'appels.
function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
}

const utf8Base64 = (s: string) => toBase64(new TextEncoder().encode(s));
// En-tête non ASCII (objet, nom de fichier, expéditeur) : encodage RFC 2047.
const encodeHeader = (s: string) => `=?UTF-8?B?${utf8Base64(s)}?=`;
// Base64 coupé en lignes de 76 caractères, comme l'exige MIME.
const wrap76 = (b64: string) => b64.replace(/.{76}/g, "$&\r\n");

// Message MIME complet (corps HTML + PDF joint), entièrement ASCII.
function buildRawMessage(p: { from: string | null; to: string[]; subject: string; html: string; attachment: { filename: string; base64: string } | null }): string {
  const boundary = `lfia-${crypto.randomUUID()}`;
  const headers = [
    ...(p.from ? [`From: ${encodeHeader(SENDER_NAME)} <${p.from}>`] : []),
    `To: ${p.to.join(", ")}`,
    `Subject: ${encodeHeader(p.subject)}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
  ];
  const parts = [
    [`--${boundary}`, 'Content-Type: text/html; charset="UTF-8"', "Content-Transfer-Encoding: base64", "", wrap76(utf8Base64(p.html))].join("\r\n"),
  ];
  if (p.attachment) {
    const name = encodeHeader(p.attachment.filename);
    parts.push([
      `--${boundary}`,
      `Content-Type: application/pdf; name="${name}"`,
      `Content-Disposition: attachment; filename="${name}"`,
      "Content-Transfer-Encoding: base64",
      "",
      wrap76(p.attachment.base64),
    ].join("\r\n"));
  }
  return `${headers.join("\r\n")}\r\n\r\n${parts.join("\r\n")}\r\n--${boundary}--`;
}

function mailHtml(p: { studentName: string; lessonTitle: string; formationName: string; submittedAt: string; link: string }): string {
  const row = (label: string, value: string) =>
    `<tr><td style="padding:6px 16px 6px 0;color:#6e6e6e;font-size:13px;white-space:nowrap">${label}</td><td style="padding:6px 0;font-size:14px;color:#000">${escapeHtml(value)}</td></tr>`;
  return `<!doctype html><html lang="fr"><body style="margin:0;padding:24px;background:#f5f5f5;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
  <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #e6e6e6;border-radius:8px;padding:28px">
    <p style="margin:0 0 6px;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#6e6e6e;font-weight:700">Mission validée</p>
    <h1 style="margin:0 0 18px;font-size:22px;line-height:1.25;color:#000">${escapeHtml(p.studentName)} vient de valider sa mission</h1>
    <table style="border-collapse:collapse;margin-bottom:22px">
      ${row("Mission", p.lessonTitle)}${p.formationName ? row("Formation", p.formationName) : ""}${row("Validée le", p.submittedAt)}
    </table>
    <p style="margin:0 0 22px;font-size:14px;line-height:1.6;color:#4d4d4d">La copie de l'élève est jointe en PDF. Elle est aussi disponible sur sa fiche, où vous pourrez préparer l'entretien d'évaluation.</p>
    <a href="${escapeHtml(p.link)}" style="display:inline-block;background:#000;color:#fff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 20px;border-radius:2px">Ouvrir la fiche de l'élève</a>
  </div>
</body></html>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });

  try {
    const { submissionId } = await req.json();
    if (!submissionId) return jsonResponse({ error: "submissionId manquant." }, 400);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return jsonResponse({ error: "Non authentifié." }, 401);
    const userClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) return jsonResponse({ error: "Session invalide." }, 401);

    const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const google = await getPlatformGoogleAccount(db);
    if (!google) return jsonResponse({ error: "Aucun compte Google plateforme connecté : mail non envoyé." }, 503);
    if (!google.scopes.includes(GOOGLE_SCOPES.gmailSend)) {
      return jsonResponse({ error: "Le compte Google plateforme n'autorise pas l'envoi de mails : reconnecte-le depuis le profil admin." }, 503);
    }
    const { data: submission } = await db
      .from("mission_submissions")
      .select("id, lesson_id, student_id, status, pdf_path, submitted_at, email_notified_at")
      .eq("id", submissionId)
      .maybeSingle();
    // Seul l'élève auteur de la mission peut déclencher le mail, une fois validée.
    if (!submission || submission.student_id !== userData.user.id) return jsonResponse({ error: "Mission introuvable." }, 404);
    if (submission.status !== "submitted") return jsonResponse({ error: "Mission pas encore validée." }, 409);
    if (submission.email_notified_at) return jsonResponse({ ok: true, alreadySent: true });

    const { data: claimed } = await db
      .from("mission_submissions")
      .update({ email_notified_at: new Date().toISOString() })
      .eq("id", submission.id)
      .is("email_notified_at", null)
      .select("id");
    if (!claimed?.length) return jsonResponse({ ok: true, alreadySent: true });

    let sent = 0;
    try {
      const [{ data: student }, { data: lesson }, { data: admins }] = await Promise.all([
        db.from("profiles").select("first_name, last_name, email, formateur_id").eq("id", submission.student_id).maybeSingle(),
        db.from("instance_lessons").select("title, instance_sections(formation_instances(name))").eq("id", submission.lesson_id).maybeSingle(),
        db.from("profiles").select("email").eq("role", "admin"),
      ]);
      const { data: formateur } = student?.formateur_id
        ? await db.from("profiles").select("email").eq("id", student.formateur_id).maybeSingle()
        : { data: null };

      const studentName = [student?.first_name, student?.last_name].filter(Boolean).join(" ").trim() || student?.email || "Un élève";
      const lessonTitle = lesson?.title ?? "Mission";
      // deno-lint-ignore no-explicit-any
      const formationName = (lesson as any)?.instance_sections?.formation_instances?.name ?? "";
      const submittedAt = new Date(submission.submitted_at ?? Date.now()).toLocaleString("fr-FR", {
        timeZone: "Europe/Paris", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
      });

      let attachment: { filename: string; base64: string } | null = null;
      if (submission.pdf_path) {
        const { data: pdf } = await db.storage.from("mission-pdfs").download(submission.pdf_path);
        if (pdf) {
          const safeName = `${lessonTitle} - ${studentName}`.replace(/[\\/:*?"<>|]+/g, " ").trim();
          attachment = { filename: `${safeName}.pdf`, base64: toBase64(new Uint8Array(await pdf.arrayBuffer())) };
        }
      }

      // Le lien de la fiche élève dépend de l'espace (admin / formateur) : un
      // mail par espace, le formateur n'étant pas destinataire du mail admin.
      const frontendUrl = (Deno.env.get("FRONTEND_URL") ?? "").replace(/\/$/, "");
      const adminEmails = [...new Set((admins ?? []).map((a) => a.email).filter(Boolean))];
      const formateurEmail = formateur?.email && !adminEmails.includes(formateur.email) ? formateur.email : null;
      const batches = [
        { to: adminEmails, link: `${frontendUrl}/admin/planning/students/${submission.student_id}` },
        { to: formateurEmail ? [formateurEmail] : [], link: `${frontendUrl}/formateur/planning/students/${submission.student_id}` },
      ].filter((b) => b.to.length);
      if (!batches.length) return jsonResponse({ ok: true, recipients: 0 });

      for (const batch of batches) {
        const message = buildRawMessage({
          from: google.email,
          to: batch.to,
          subject: `Mission validée — ${studentName} · ${lessonTitle}`,
          html: mailHtml({ studentName, lessonTitle, formationName, submittedAt, link: batch.link }),
          attachment,
        });
        const res = await fetch(GMAIL_SEND_URL, {
          method: "POST",
          headers: { Authorization: `Bearer ${google.accessToken}`, "Content-Type": "message/rfc822" },
          body: message,
        });
        if (!res.ok) throw new Error(`Gmail ${res.status} : ${await res.text()}`);
        sent += 1;
      }
      return jsonResponse({ ok: true, recipients: batches.reduce((n, b) => n + b.to.length, 0) });
    } catch (err) {
      // Rien n'est parti : on libère la réservation pour qu'un nouvel appel réessaie.
      if (!sent) await db.from("mission_submissions").update({ email_notified_at: null }).eq("id", submission.id);
      throw err;
    }
  } catch (err) {
    console.error(err);
    return jsonResponse({ error: err instanceof Error ? err.message : "Erreur inconnue." }, 500);
  }
});
