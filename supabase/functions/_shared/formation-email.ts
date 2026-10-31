// E-mails des sessions de formation (convocation, rappel, certificat, espace
// client), envoyés par l'API Gmail depuis le compte Google de la plateforme.
// Partagé par send-formation-email (envoi à la demande) et
// formation-email-automations (envois automatiques quotidiens).
// Chaque envoi est journalisé dans session_emails.

import type { PlatformGoogleAccount } from "./google-platform.ts";

export type EmailKind = "espace-client" | "convocation" | "rappel" | "certificat";

const GMAIL_SEND_URL = "https://gmail.googleapis.com/upload/gmail/v1/users/me/messages/send?uploadType=media";
const SENDER_NAME = "Les Formateurs IA";
const INK = "#0f0e14";
const MUTED = "#6b6b76";
const ACCENT = "#2A78D6";
const GREEN = "#1BAF7A";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const utf8Base64 = (s: string) => {
  const bytes = new TextEncoder().encode(s);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
};
const encodeHeader = (s: string) => `=?UTF-8?B?${utf8Base64(s)}?=`;
const wrap76 = (b64: string) => b64.replace(/.{76}/g, "$&\r\n");

export async function sendGmail(google: PlatformGoogleAccount, p: { to: string; subject: string; html: string }): Promise<void> {
  const headers = [
    ...(google.email ? [`From: ${encodeHeader(SENDER_NAME)} <${google.email}>`] : []),
    `To: ${p.to}`,
    `Subject: ${encodeHeader(p.subject)}`,
    "MIME-Version: 1.0",
    'Content-Type: text/html; charset="UTF-8"',
    "Content-Transfer-Encoding: base64",
  ];
  const res = await fetch(GMAIL_SEND_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${google.accessToken}`, "Content-Type": "message/rfc822" },
    body: `${headers.join("\r\n")}\r\n\r\n${wrap76(utf8Base64(p.html))}`,
  });
  if (!res.ok) throw new Error(`Gmail ${res.status} : ${await res.text()}`);
}

// ── Mise en page ──────────────────────────────────────────────────────
// Tableaux et styles en ligne : seule mise en page fiable dans Gmail,
// Outlook et Apple Mail.

const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
const MOIS_COURTS = ["JANV", "FÉVR", "MARS", "AVR", "MAI", "JUIN", "JUIL", "AOÛT", "SEPT", "OCT", "NOV", "DÉC"];
const JOURS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];

export function dateFr(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return `${JOURS[date.getUTCDay()]} ${d === 1 ? "1er" : d} ${MOIS[m - 1]} ${y}`;
}
const heure = (t: string) => { const [h, m] = t.slice(0, 5).split(":"); return `${Number(h)}h${m}`; };

type Layout = {
  preheader: string;
  eyebrow: string;
  title: string;
  intro: string;
  blocks?: string[];
  cta?: { label: string; url: string };
  note?: string;
  frontendUrl: string;
};

function layout(p: Layout): string {
  const button = p.cta ? `
    <table role="presentation" cellspacing="0" cellpadding="0" style="margin:28px 0 8px"><tr><td style="border-radius:4px;background:${INK}">
      <a href="${esc(p.cta.url)}" style="display:inline-block;padding:15px 26px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:4px">${esc(p.cta.label)} &rarr;</a>
    </td></tr></table>` : "";
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(p.title)}</title></head>
<body style="margin:0;padding:0;background:#f2f3f7;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${INK}">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(p.preheader)}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f2f3f7;padding:28px 12px"><tr><td align="center">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 10px rgba(15,14,20,0.06)">
      <tr><td style="background:${INK};padding:26px 32px">
        <img src="${esc(p.frontendUrl)}/email/logo-blanc.png" width="168" alt="Les Formateurs IA" style="display:block;border:0;width:168px;height:auto">
      </td></tr>
      <tr><td style="height:4px;background:linear-gradient(90deg,${ACCENT},${GREEN});background-color:${ACCENT};font-size:0;line-height:0">&nbsp;</td></tr>
      <tr><td style="padding:34px 32px 30px">
        <p style="margin:0 0 10px;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:${MUTED};font-weight:700">${esc(p.eyebrow)}</p>
        <h1 style="margin:0 0 16px;font-size:25px;line-height:1.25;color:${INK};font-weight:800">${esc(p.title)}</h1>
        <div style="font-size:15px;line-height:1.65;color:#3d3d48">${p.intro}</div>
        ${(p.blocks ?? []).join("")}
        ${button}
        ${p.note ? `<p style="margin:18px 0 0;font-size:13px;line-height:1.6;color:${MUTED}">${p.note}</p>` : ""}
      </td></tr>
      <tr><td style="padding:22px 32px;background:#fafafc;border-top:1px solid #ececf2">
        <p style="margin:0;font-size:12px;line-height:1.6;color:${MUTED}">
          <strong style="color:${INK}">Les Formateurs IA</strong> · 29 chemin de Villeneuve, 69130 Écully<br>
          contact@les-formateurs-ia.fr · 09 80 87 40 46<br>
          Organisme certifié Qualiopi au titre des actions de formation · Déclaration d'activité n° 84692541069
        </p>
      </td></tr>
    </table>
  </td></tr></table>
</body></html>`;
}

function infoCard(rows: [string, string][]): string {
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:24px 0 0;background:#f6f7fb;border-radius:10px">
    ${rows.map(([k, v], i) => `<tr><td style="padding:${i ? "10px" : "16px"} 18px ${i === rows.length - 1 ? "16px" : "10px"};border-top:${i ? "1px solid #e8e9f0" : "0"}">
      <p style="margin:0;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:${MUTED};font-weight:700">${esc(k)}</p>
      <p style="margin:3px 0 0;font-size:15px;color:${INK};font-weight:600">${v}</p>
    </td></tr>`).join("")}
  </table>`;
}

function seancesList(slots: SlotRow[]): string {
  if (!slots.length) return "";
  return `<p style="margin:26px 0 8px;font-size:13px;font-weight:700;color:${INK}">Vos séances</p>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
    ${slots.map((s) => {
      const [, m, d] = s.slot_date.split("-").map(Number);
      return `<tr><td style="padding:6px 0">
        <table role="presentation" cellspacing="0" cellpadding="0"><tr>
          <td style="width:52px;text-align:center;background:${INK};color:#fff;border-radius:8px;padding:6px 0">
            <div style="font-size:10px;font-weight:700">${MOIS_COURTS[m - 1]}</div>
            <div style="font-size:20px;font-weight:800;line-height:1">${d}</div>
          </td>
          <td style="padding-left:14px;font-size:14px;color:${INK}"><strong style="text-transform:capitalize">${dateFr(s.slot_date)}</strong><br><span style="color:${MUTED}">${heure(s.start_time)} – ${heure(s.end_time)}</span></td>
        </tr></table>
      </td></tr>`;
    }).join("")}
  </table>`;
}

// ── Données et envoi ──────────────────────────────────────────────────

type SessionRow = {
  id: string; reference: string; financement: string; company_id: string | null; client: { nom: string; email?: string; representant?: { nom: string } | null };
  formation: { intitule: string; dureeHeures: number; modalite: string; prerequis?: string[] }; date_debut: string; date_fin: string;
  lieu: string; lien_connexion: string | null; intervenants: { nom: string; qualite: string }[]; client_token: string;
};
type TraineeRow = { id: string; prenom: string; nom: string; email: string; profile_id: string | null; access_token: string };
type SlotRow = { slot_date: string; start_time: string; end_time: string };

export type SendResult = { sent: string[]; skipped: { email: string; reason: string }[]; errors: { email: string; message: string }[] };

function lieuHtml(s: SessionRow): string {
  if (s.lien_connexion && /^https?:/.test(s.lien_connexion)) return `Classe virtuelle · <a href="${esc(s.lien_connexion)}" style="color:${ACCENT}">rejoindre</a>`;
  if (s.formation.modalite === "foad") return "Plateforme e-learning Les Formateurs IA";
  return esc(s.lieu || "Communiqué prochainement");
}

export function learnerEmail(kind: Exclude<EmailKind, "espace-client">, s: SessionRow, t: TraineeRow, slots: SlotRow[], frontendUrl: string): { subject: string; html: string } {
  // Lien d'accès direct : connecte le stagiaire à son espace sans mot de passe.
  const espace = `${frontendUrl}/acces/${t.access_token}`;
  const formateur = s.intervenants[0]?.nom ?? "Les Formateurs IA";
  if (kind === "convocation") {
    return {
      subject: `Votre convocation · ${s.formation.intitule}`,
      html: layout({
        frontendUrl, preheader: `Votre formation commence le ${dateFr(s.date_debut)}.`, eyebrow: "Convocation à la formation",
        title: `${t.prenom}, votre formation approche !`,
        intro: `<p style="margin:0">Nous avons le plaisir de vous confirmer votre inscription à la formation <strong>${esc(s.formation.intitule)}</strong>. Voici toutes les informations pratiques.</p>`,
        blocks: [
          infoCard([
            ["Dates", s.date_debut === s.date_fin ? esc(dateFr(s.date_debut)) : `Du ${esc(dateFr(s.date_debut))}<br>au ${esc(dateFr(s.date_fin))}`],
            ["Durée", `${s.formation.dureeHeures} heures`],
            ["Lieu", lieuHtml(s)],
            ["Formateur", esc(formateur)],
          ]),
          seancesList(slots),
          ...(s.formation.prerequis?.length ? [`<p style="margin:26px 0 8px;font-size:13px;font-weight:700;color:${INK}">À prévoir</p><ul style="margin:0;padding-left:18px;font-size:14px;line-height:1.7;color:#3d3d48">${s.formation.prerequis.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>`] : []),
        ],
        cta: { label: "Accéder à mon espace formation", url: espace },
        note: "Ce bouton vous connecte directement à votre espace, sans mot de passe : gardez cet e-mail. Vous y trouverez le programme et le règlement intérieur, et pendant la formation vous y signerez votre présence en un clic. Un besoin d'aménagement (handicap) ? Répondez simplement à cet e-mail.",
      }),
    };
  }
  if (kind === "rappel") {
    const demain = slots.filter((x) => x.slot_date > new Date().toISOString().slice(0, 10)).slice(0, 2);
    return {
      subject: `C'est demain · ${s.formation.intitule}`,
      html: layout({
        frontendUrl, preheader: "Rappel : votre séance de formation a lieu demain.", eyebrow: "Rappel",
        title: `À demain, ${t.prenom} !`,
        intro: `<p style="margin:0">Petit rappel : votre séance de formation <strong>${esc(s.formation.intitule)}</strong> a lieu demain.</p>`,
        blocks: [infoCard([["Lieu", lieuHtml(s)], ["Formateur", esc(formateur)]]), seancesList(demain)],
        cta: { label: "Ouvrir mon espace formation", url: espace },
        note: "Pensez à signer votre présence depuis votre espace au début de chaque séance.",
      }),
    };
  }
  return {
    subject: `Votre certificat de réalisation · ${s.formation.intitule}`,
    html: layout({
      frontendUrl, preheader: "Vos documents de fin de formation sont disponibles.", eyebrow: "Formation terminée 🎓",
      title: `Félicitations ${t.prenom} !`,
      intro: `<p style="margin:0">Vous avez terminé la formation <strong>${esc(s.formation.intitule)}</strong>. Votre <strong>certificat de réalisation</strong> et votre <strong>attestation de fin de formation</strong> sont disponibles dans votre espace.</p>`,
      blocks: [infoCard([["Formation", esc(s.formation.intitule)], ["Période", `Du ${esc(dateFr(s.date_debut))} au ${esc(dateFr(s.date_fin))}`]])],
      cta: { label: "Télécharger mes documents", url: espace },
      note: "Votre avis compte : un court questionnaire de satisfaction vous attend aussi dans votre espace. Merci pour votre participation !",
    }),
  };
}

export function clientEmail(s: SessionRow, frontendUrl: string, aSigner: string[]): { subject: string; html: string } {
  const url = `${frontendUrl}/espace-client/${s.client_token}`;
  const nom = s.client.representant?.nom || s.client.nom;
  return {
    subject: aSigner.length ? `${aSigner.length > 1 ? "Documents" : aSigner[0]} à signer · ${s.formation.intitule}` : `Votre espace formation · ${s.formation.intitule}`,
    html: layout({
      frontendUrl, preheader: "Dates, programme, documents et signatures : tout est dans votre espace.", eyebrow: "Votre espace formation",
      title: aSigner.length ? "Un document attend votre signature" : "Votre espace formation est prêt",
      intro: `<p style="margin:0">Bonjour ${esc(nom)},</p><p style="margin:12px 0 0">Retrouvez dans votre espace dédié tout ce qui concerne la formation <strong>${esc(s.formation.intitule)}</strong> : dates, programme, collaborateurs inscrits et documents${aSigner.length ? `, dont ${aSigner.length > 1 ? "les documents" : "le document"} à signer en ligne en un clic` : ""}.</p>`,
      blocks: [
        infoCard([
          ["Formation", esc(s.formation.intitule)],
          ["Dates", s.date_debut === s.date_fin ? esc(dateFr(s.date_debut)) : `Du ${esc(dateFr(s.date_debut))} au ${esc(dateFr(s.date_fin))}`],
          ...(aSigner.length ? [["À signer", aSigner.map(esc).join("<br>")] as [string, string]] : []),
        ]),
      ],
      cta: { label: aSigner.length ? "Lire et signer" : "Ouvrir mon espace", url },
      note: "Ce lien reste valable après la formation : vous y retrouverez le certificat de réalisation et les attestations de vos collaborateurs.",
    }),
  };
}

// deno-lint-ignore no-explicit-any
type Db = any;

export async function sendFormationEmails(db: Db, google: PlatformGoogleAccount, p: {
  sessionId: string; kind: EmailKind; traineeIds?: string[]; automatic: boolean; sentBy: string | null; frontendUrl: string;
}): Promise<SendResult> {
  const result: SendResult = { sent: [], skipped: [], errors: [] };
  const [{ data: session }, { data: trainees }, { data: slots }, { data: docs }] = await Promise.all([
    db.from("training_sessions").select("*").eq("id", p.sessionId).maybeSingle(),
    db.from("training_session_trainees").select("id, prenom, nom, email, profile_id, access_token").eq("session_id", p.sessionId),
    db.from("training_session_slots").select("slot_date, start_time, end_time").eq("session_id", p.sessionId).order("slot_date").order("start_time"),
    db.from("session_documents").select("template_id, title, trainee_id, requires_signature, signed_at").eq("session_id", p.sessionId),
  ]);
  if (!session) throw new Error("Formation introuvable.");
  const s = session as SessionRow;

  const log = (row: { trainee_id?: string | null; recipient: string; status: "sent" | "error"; error?: string }) =>
    db.from("session_emails").insert({ session_id: s.id, kind: p.kind, automatic: p.automatic, sent_by: p.sentBy, ...row });

  if (p.kind === "espace-client") {
    const to = s.client.email?.trim();
    if (!to) { result.skipped.push({ email: s.client.nom, reason: "Pas d'e-mail client renseigné." }); return result; }
    const aSigner = (docs ?? []).filter((d: { requires_signature: boolean; signed_at: string | null; trainee_id: string | null }) => d.requires_signature && !d.signed_at && !d.trainee_id)
      .map((d: { title: string }) => d.title.split(" · ")[0]);
    try {
      await sendGmail(google, { to, ...clientEmail(s, p.frontendUrl, [...new Set<string>(aSigner)]) });
      await log({ recipient: to, status: "sent" });
      result.sent.push(to);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await log({ recipient: to, status: "error", error: message });
      result.errors.push({ email: to, message });
    }
    return result;
  }

  const targets = ((trainees ?? []) as TraineeRow[]).filter((t) => !p.traineeIds?.length || p.traineeIds.includes(t.id));
  for (const t of targets) {
    if (!t.email) { result.skipped.push({ email: `${t.prenom} ${t.nom}`, reason: "Pas d'e-mail." }); continue; }
    if (p.kind === "certificat" && !(docs ?? []).some((d: { template_id: string; trainee_id: string | null }) => d.template_id === "certificat-realisation" && d.trainee_id === t.id)) {
      result.skipped.push({ email: t.email, reason: "Certificat individuel pas encore émis." });
      continue;
    }
    try {
      await sendGmail(google, { to: t.email, ...learnerEmail(p.kind, s, t, (slots ?? []) as SlotRow[], p.frontendUrl) });
      await log({ trainee_id: t.id, recipient: t.email, status: "sent" });
      result.sent.push(t.email);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await log({ trainee_id: t.id, recipient: t.email, status: "error", error: message });
      result.errors.push({ email: t.email, message });
    }
  }
  return result;
}
