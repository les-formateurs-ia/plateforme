// Sessions de formation (migration 20261031120000_training_sessions) :
// créneaux, stagiaires, émargement en ligne, documents émis et signés, et
// construction du contexte des modèles à partir des données réelles.
import { supabase } from "@/app/lib/supabase/client";
import type { Database, Json } from "@/app/lib/supabase/database.types";
import { renderTemplate, signataire, type DocumentTemplate } from "@/app/lib/documents/catalog";
import { stampSignature } from "@/app/lib/documents/render";
import type { Client, DocumentContext, Formation, Intervenant, LigneTarif } from "@/app/lib/documents/types";
import type {
  ActivityRow, AttendanceSignature, SessionBundle as PureBundle, SessionSlot, SessionTrainee, TrainingSession,
} from "@/app/lib/documents/session";

export * from "@/app/lib/documents/session";

type SessionRow = Database["public"]["Tables"]["training_sessions"]["Row"];
type TraineeRow = Database["public"]["Tables"]["training_session_trainees"]["Row"];
type DocumentRow = Database["public"]["Tables"]["session_documents"]["Row"];

export type SessionDocument = Omit<DocumentRow, "html">;
export type SessionBundle = PureBundle & { documents: SessionDocument[]; clientToken: string; autoEmails: boolean };

const DOCUMENT_COLUMNS = "id, session_id, trainee_id, template_id, title, html_sha256, requires_signature, sign_token, signer_name, signer_email, issued_by, issued_at, signed_at, signed_ip, signed_user_agent";

function mapSession(r: SessionRow): TrainingSession {
  return {
    id: r.id, reference: r.reference, financement: r.financement, financeur: r.financeur, companyId: r.company_id,
    client: r.client as Client, formation: r.formation as Formation, lignes: r.lignes as LigneTarif[],
    conditionsPaiement: r.conditions_paiement, dateDebut: r.date_debut, dateFin: r.date_fin, lieu: r.lieu,
    lienConnexion: r.lien_connexion, intervenants: r.intervenants as Intervenant[],
  };
}

function mapTrainee(r: TraineeRow): SessionTrainee {
  return {
    id: r.id, profileId: r.profile_id, civilite: r.civilite, prenom: r.prenom, nom: r.nom,
    email: r.email, fonction: r.fonction, resultatEvaluation: r.resultat_evaluation,
  };
}

// Postgres renvoie "09:00:00" ; les modèles attendent "09:00".
const hhmm = (t: string) => t.slice(0, 5);

function toRow(s: Omit<TrainingSession, "id">): Database["public"]["Tables"]["training_sessions"]["Insert"] {
  return {
    reference: s.reference, financement: s.financement, financeur: s.financeur, company_id: s.companyId,
    client: s.client as unknown as Json, formation: s.formation as unknown as Json, lignes: s.lignes as unknown as Json,
    conditions_paiement: s.conditionsPaiement, date_debut: s.dateDebut, date_fin: s.dateFin, lieu: s.lieu,
    lien_connexion: s.lienConnexion, intervenants: s.intervenants as unknown as Json,
  };
}

// ── Sessions ──────────────────────────────────────────────────────────

export async function listSessions(): Promise<TrainingSession[]> {
  const { data, error } = await supabase.from("training_sessions").select("*").order("date_debut", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapSession);
}

export async function createSession(s: Omit<TrainingSession, "id">): Promise<string> {
  const { data: auth } = await supabase.auth.getUser();
  const { data, error } = await supabase.from("training_sessions")
    .insert({ ...toRow(s), created_by: auth.user?.id ?? null }).select("id").single();
  if (error) throw error;
  return data.id;
}

export async function updateSession(s: TrainingSession): Promise<void> {
  const { error } = await supabase.from("training_sessions")
    .update({ ...toRow(s), updated_at: new Date().toISOString() }).eq("id", s.id);
  if (error) throw error;
}

export async function deleteSession(id: string): Promise<void> {
  // RLS : un refus ne lève pas d'erreur, il supprime zéro ligne.
  const { data, error } = await supabase.from("training_sessions").delete().eq("id", id).select("id");
  if (error) throw error;
  if (!data?.length) throw new Error("La suppression a été refusée.");
}

export async function getSessionBundle(id: string): Promise<SessionBundle | null> {
  const [sessionRes, slotsRes, traineesRes, docsRes] = await Promise.all([
    supabase.from("training_sessions").select("*").eq("id", id).maybeSingle(),
    supabase.from("training_session_slots").select("id, slot_date, start_time, end_time").eq("session_id", id)
      .order("slot_date").order("start_time"),
    supabase.from("training_session_trainees").select("*").eq("session_id", id).order("nom"),
    supabase.from("session_documents").select(DOCUMENT_COLUMNS).eq("session_id", id).order("issued_at", { ascending: false }),
  ]);
  for (const r of [sessionRes, slotsRes, traineesRes, docsRes]) if (r.error) throw r.error;
  if (!sessionRes.data) return null;
  const slots = (slotsRes.data ?? []).map((r) => ({ id: r.id, date: r.slot_date, debut: hhmm(r.start_time), fin: hhmm(r.end_time) }));
  let signatures: AttendanceSignature[] = [];
  if (slots.length) {
    const { data, error } = await supabase.from("attendance_signatures")
      .select("id, slot_id, trainee_id, signer_role, signer_name, signed_at, ip").in("slot_id", slots.map((s) => s.id));
    if (error) throw error;
    signatures = (data ?? []).map((r) => ({
      id: r.id, slotId: r.slot_id, traineeId: r.trainee_id, role: r.signer_role, signerName: r.signer_name, signedAt: r.signed_at, ip: r.ip,
    }));
  }
  return {
    session: mapSession(sessionRes.data),
    clientToken: sessionRes.data.client_token,
    autoEmails: sessionRes.data.auto_emails ?? true,
    slots,
    trainees: (traineesRes.data ?? []).map(mapTrainee),
    signatures,
    documents: (docsRes.data ?? []) as SessionDocument[],
  };
}

// ── Créneaux et stagiaires ────────────────────────────────────────────

export async function addSlot(sessionId: string, date: string, debut: string, fin: string): Promise<void> {
  const { error } = await supabase.from("training_session_slots").insert({ session_id: sessionId, slot_date: date, start_time: debut, end_time: fin });
  if (error) throw error;
}

export async function deleteSlot(id: string): Promise<void> {
  const { error } = await supabase.from("training_session_slots").delete().eq("id", id);
  if (error) throw error;
}

export async function addTrainee(sessionId: string, t: Omit<SessionTrainee, "id" | "resultatEvaluation">): Promise<void> {
  const { error } = await supabase.from("training_session_trainees").insert({
    session_id: sessionId, profile_id: t.profileId, civilite: t.civilite, prenom: t.prenom, nom: t.nom,
    email: t.email.trim().toLowerCase(), fonction: t.fonction,
  });
  if (error) throw error;
}

export async function updateTraineeResult(id: string, resultat: string | null): Promise<void> {
  const { error } = await supabase.from("training_session_trainees").update({ resultat_evaluation: resultat }).eq("id", id);
  if (error) throw error;
}

export async function deleteTrainee(id: string): Promise<void> {
  const { error } = await supabase.from("training_session_trainees").delete().eq("id", id);
  if (error) throw error;
}

// Collaborateurs de l'entreprise cliente ; ceux déjà inscrits sont ignorés.
export async function importCompanyEmployees(sessionId: string, companyId: string): Promise<number> {
  const { data, error } = await supabase.from("company_employees")
    .select("first_name, last_name, email, profile_id").eq("company_id", companyId);
  if (error) throw error;
  const rows = (data ?? []).map((e) => ({
    session_id: sessionId, profile_id: e.profile_id, prenom: e.first_name, nom: e.last_name.toUpperCase(), email: e.email.toLowerCase(),
  }));
  if (!rows.length) return 0;
  const { data: inserted, error: insertError } = await supabase.from("training_session_trainees")
    .upsert(rows, { onConflict: "session_id,email", ignoreDuplicates: true }).select("id");
  if (insertError) throw insertError;
  return inserted?.length ?? 0;
}

// Compte plateforme d'un élève CPF, retrouvé par son e-mail.
export async function findProfileIdByEmail(email: string): Promise<string | null> {
  const { data, error } = await supabase.from("profiles").select("id").eq("email", email.trim().toLowerCase()).maybeSingle();
  if (error) throw error;
  return data?.id ?? null;
}

// ── Émargement ────────────────────────────────────────────────────────

export async function signAttendanceAsTrainer(slotId: string): Promise<void> {
  const { error } = await supabase.rpc("sign_attendance_as_trainer", { p_slot_id: slotId });
  if (error) throw error;
}

export type MyAttendanceSlot = { slotId: string; date: string; debut: string; fin: string; intitule: string; signedAt: string | null };

export async function listMyAttendanceSlots(): Promise<MyAttendanceSlot[]> {
  const { data, error } = await supabase.rpc("my_attendance_slots");
  if (error) throw error;
  return (data ?? []).map((r) => ({
    slotId: r.slot_id, date: r.slot_date, debut: hhmm(r.start_time), fin: hhmm(r.end_time), intitule: r.intitule ?? "Formation", signedAt: r.signed_at,
  }));
}

export async function signMyAttendance(slotId: string): Promise<string> {
  const { data, error } = await supabase.rpc("sign_attendance", { p_slot_id: slotId });
  if (error) throw error;
  return data;
}

// ── Activité à distance ───────────────────────────────────────────────

export async function getTraineeActivity(profileId: string, from: string, to: string): Promise<ActivityRow[]> {
  const { data, error } = await supabase.rpc("trainee_activity", { p_profile_id: profileId, p_from: from, p_to: to });
  if (error) throw error;
  return (data ?? []).map((r) => ({ date: r.activity_date, activite: r.activite, seconds: r.seconds }));
}

// Activité de chaque stagiaire ayant un compte, sur la période de la session.
export async function getSessionActivity(bundle: SessionBundle): Promise<Record<string, ActivityRow[]>> {
  const entries = await Promise.all(bundle.trainees.filter((t) => t.profileId).map(async (t) =>
    [t.id, await getTraineeActivity(t.profileId!, bundle.session.dateDebut, bundle.session.dateFin)] as const));
  return Object.fromEntries(entries);
}

// ── Documents émis ────────────────────────────────────────────────────

async function sha256(text: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Documents qui existent aussi pour chaque stagiaire : il les retrouve dans
// son espace et les reçoit par e-mail (convocation, attestations, certificat).
export const PER_TRAINEE_TEMPLATES = ["convocation", "attestation-assiduite", "certificat-realisation", "attestation-fin-formation", "releve-connexions"];

async function insertDocument(row: Database["public"]["Tables"]["session_documents"]["Insert"]): Promise<SessionDocument> {
  const { data, error } = await supabase.from("session_documents").insert(row).select(DOCUMENT_COLUMNS).single();
  if (error) throw error;
  return data as SessionDocument;
}

// Fige le document tel qu'il est envoyé : c'est cette version qui est signée
// et archivée. traineeIds (dans l'ordre de ctx.stagiaires) : un exemplaire
// individuel est aussi émis pour chaque stagiaire.
export async function issueDocument(sessionId: string, template: DocumentTemplate, ctx: DocumentContext, logoSvg: string, traineeIds: string[] = []): Promise<SessionDocument> {
  const { data: auth } = await supabase.auth.getUser();
  const issuedBy = auth.user?.id ?? null;
  // L'organisme signe à l'émission : sa case est remplie avant le calcul de
  // l'empreinte, la version archivée porte donc sa signature.
  const render = (c: DocumentContext) => stampSignature(renderTemplate(template, c, logoSvg), "organisme", c.organisme.representant.nom, new Date().toISOString());
  const html = render(ctx);
  const signer = template.signable ? signataire(ctx) : null;
  const doc = await insertDocument({
    session_id: sessionId, template_id: template.id, title: `${template.titre} · ${ctx.numero}`,
    html, html_sha256: await sha256(html), requires_signature: !!template.signable,
    signer_name: signer?.nom ?? null, signer_email: signer?.email ?? null, issued_by: issuedBy,
  });
  if (PER_TRAINEE_TEMPLATES.includes(template.id)) {
    for (const [i, stagiaire] of ctx.stagiaires.entries()) {
      const traineeId = traineeIds[i];
      if (!traineeId) continue;
      const own = render({ ...ctx, stagiaires: [stagiaire] });
      await insertDocument({
        session_id: sessionId, trainee_id: traineeId, template_id: template.id, title: `${template.titre} · ${stagiaire.prenom} ${stagiaire.nom}`,
        html: own, html_sha256: await sha256(own), issued_by: issuedBy,
      });
    }
  }
  return doc;
}

export async function getDocumentHtml(id: string): Promise<string> {
  const { data, error } = await supabase.from("session_documents").select("html").eq("id", id).single();
  if (error) throw error;
  return data.html;
}

export async function deleteDocument(id: string): Promise<void> {
  const { error } = await supabase.from("session_documents").delete().eq("id", id);
  if (error) throw error;
}

export function signingUrl(token: string): string {
  return `${window.location.origin}/signer/${token}`;
}

// Lien de l'espace client d'une formation (documents, dates, signatures).
export function clientPortalUrl(token: string): string {
  return `${window.location.origin}/espace-client/${token}`;
}

// ── Signature publique (sans compte) ──────────────────────────────────

export type DocumentToSign = { title: string; html: string; sha256: string; signerName: string | null; signedAt: string | null };

export async function getDocumentForSigning(token: string): Promise<DocumentToSign | null> {
  const { data, error } = await supabase.rpc("get_document_for_signing", { p_token: token });
  if (error) throw error;
  const row = data?.[0];
  return row ? { title: row.title, html: row.html, sha256: row.html_sha256, signerName: row.signer_name, signedAt: row.signed_at } : null;
}

export async function signDocument(token: string): Promise<string> {
  const { data, error } = await supabase.rpc("sign_document", { p_token: token });
  if (error) throw error;
  return data;
}

// ── Espace client (sans compte, le jeton de la session fait foi) ─────

export type PortalDocument = {
  id: string; templateId: string; title: string; issuedAt: string;
  requiresSignature: boolean; signedAt: string | null; signerName: string | null;
};

export type PortalTrainee = { id: string; prenom: string; nom: string; fonction: string | null };
export type PortalSeance = { id: string; date: string; debut: string; fin: string; presents: string[]; intervenantSigne: boolean };

export type ClientPortal = {
  reference: string;
  financement: string;
  client: string;
  formation: Formation;
  dateDebut: string;
  dateFin: string;
  lieu: string;
  lienConnexion: string | null;
  intervenants: { nom: string; qualite: string }[];
  stagiaires: PortalTrainee[];
  seances: PortalSeance[];
  documents: PortalDocument[];
};

export async function getClientPortal(token: string): Promise<ClientPortal | null> {
  const { data, error } = await supabase.rpc("get_client_portal", { p_token: token });
  if (error) throw error;
  if (!data) return null;
  // Tolère l'ancienne réponse (avant 20261102120000) : compteur de
  // stagiaires et séances sans présence, programme partiel.
  const raw = data as unknown as Omit<ClientPortal, "stagiaires" | "seances" | "formation"> & {
    stagiaires: PortalTrainee[] | number; seances: Partial<PortalSeance>[]; formation: Partial<Formation>;
  };
  const f = raw.formation;
  return {
    ...raw,
    formation: {
      publicVise: [], prerequis: [], objectifs: [], contenu: [], methodes: [], moyensTechniques: [], modalitesEvaluation: [],
      indicateurs: [], activitesDistance: [], accroche: "", delaiAcces: "", accessibilite: "", tarif: "", certification: null, assistance: null,
      nature: "formation", dureeJours: 0, modalite: "presentiel", intitule: "", dureeHeures: 0, ...f,
    } as Formation,
    stagiaires: Array.isArray(raw.stagiaires) ? raw.stagiaires : [],
    seances: raw.seances.map((s, i) => ({
      id: s.id ?? String(i), date: s.date ?? "", debut: hhmm(s.debut ?? "00:00"), fin: hhmm(s.fin ?? "00:00"),
      presents: s.presents ?? [], intervenantSigne: s.intervenantSigne ?? false,
    })),
  };
}

export type ClientDocument = {
  title: string; html: string; sha256: string; issuedAt: string; requiresSignature: boolean;
  signerName: string | null; signedAt: string | null; signedIp: string | null; signedUserAgent: string | null;
};

export async function getClientDocument(token: string, documentId: string): Promise<ClientDocument | null> {
  const { data, error } = await supabase.rpc("get_client_document", { p_token: token, p_document_id: documentId });
  if (error) throw error;
  const r = data?.[0];
  return r ? {
    title: r.title, html: r.html, sha256: r.html_sha256, issuedAt: r.issued_at, requiresSignature: r.requires_signature,
    signerName: r.signer_name, signedAt: r.signed_at, signedIp: r.signed_ip, signedUserAgent: r.signed_user_agent,
  } : null;
}

export async function signClientDocument(token: string, documentId: string): Promise<string> {
  const { data, error } = await supabase.rpc("sign_client_document", { p_token: token, p_document_id: documentId });
  if (error) throw error;
  return data;
}

// ── E-mails (Gmail, fonction send-formation-email) ────────────────────

export type EmailKind = "espace-client" | "convocation" | "rappel" | "certificat";
export type EmailResult = { sent: string[]; skipped: { email: string; reason: string }[]; errors: { email: string; message: string }[] };
export type SessionEmail = Database["public"]["Tables"]["session_emails"]["Row"];

export async function sendFormationEmail(sessionId: string, kind: EmailKind, traineeIds?: string[]): Promise<EmailResult> {
  const { data, error } = await supabase.functions.invoke("send-formation-email", { body: { sessionId, kind, traineeIds } });
  if (error) {
    // Message de la fonction (compte Google non connecté…) plutôt que le statut HTTP.
    const body = await (error as { context?: Response }).context?.json?.().catch(() => null);
    throw new Error(body?.error ?? error.message);
  }
  return data as EmailResult;
}

export async function listSessionEmails(sessionId: string): Promise<SessionEmail[]> {
  const { data, error } = await supabase.from("session_emails").select("*").eq("session_id", sessionId).order("sent_at", { ascending: false }).limit(50);
  if (error) throw error;
  return data ?? [];
}

export async function setAutoEmails(sessionId: string, enabled: boolean): Promise<void> {
  const { error } = await supabase.from("training_sessions").update({ auto_emails: enabled }).eq("id", sessionId);
  if (error) throw error;
}

// ── Accès Entreprise des stagiaires ───────────────────────────────────

// Chaque stagiaire d'une formation entreprise devient collaborateur de
// l'entreprise et reçoit son invitation : il émarge, suit sa formation et
// retrouve ses documents dans l'espace Entreprise. Le rattachement du
// compte au stagiaire se fait en base (trigger propagate_employee_profile).
export async function createCompanyAccess(bundle: SessionBundle): Promise<{ invited: number; errors: string[] }> {
  const companyId = bundle.session.companyId;
  if (!companyId) throw new Error("Cette formation n'est rattachée à aucune entreprise.");
  const sansCompte = bundle.trainees.filter((t) => !t.profileId);
  if (!sansCompte.length) return { invited: 0, errors: [] };
  const { error: upsertError } = await supabase.from("company_employees").upsert(
    sansCompte.map((t) => ({ company_id: companyId, first_name: t.prenom, last_name: t.nom, email: t.email.toLowerCase() })),
    { onConflict: "company_id,email", ignoreDuplicates: true },
  );
  if (upsertError) throw upsertError;
  const { data: employees, error } = await supabase.from("company_employees").select("id, email, profile_id")
    .eq("company_id", companyId).in("email", sansCompte.map((t) => t.email.toLowerCase()));
  if (error) throw error;
  const toInvite = (employees ?? []).filter((e) => !e.profile_id).map((e) => e.id);
  if (!toInvite.length) return { invited: 0, errors: [] };
  const { data, error: inviteError } = await supabase.functions.invoke("send-company-invite", { body: { employeeIds: toInvite } });
  if (inviteError) throw inviteError;
  const res = data as { sent: string[]; errors: { message: string }[] };
  return { invited: res.sent.length, errors: res.errors.map((e) => e.message) };
}

// ── Documents de l'apprenant (son espace) ─────────────────────────────

export type MyTrainingDocument = { id: string; templateId: string; title: string; issuedAt: string; intitule: string; dateDebut: string; dateFin: string };

export async function listMyTrainingDocuments(): Promise<MyTrainingDocument[]> {
  const { data, error } = await supabase.rpc("my_training_documents");
  if (error) throw error;
  return (data ?? []).map((r) => ({ id: r.id, templateId: r.template_id, title: r.title, issuedAt: r.issued_at, intitule: r.intitule ?? "", dateDebut: r.date_debut, dateFin: r.date_fin }));
}

export async function getMyTrainingDocumentHtml(id: string): Promise<string | null> {
  const { data, error } = await supabase.rpc("get_my_training_document", { p_document_id: id });
  if (error) throw error;
  return data?.[0]?.html ?? null;
}
