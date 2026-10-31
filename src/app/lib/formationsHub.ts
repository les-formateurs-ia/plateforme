// Espace « Formations » (staff) : tous les clients, entreprises et élèves
// CPF, avec leurs sessions et ce qui reste à faire (signatures, émargement).
import { supabase } from "@/app/lib/supabase/client";
import { listCompanies } from "@/app/lib/entreprise/companies";
import { listSessions, todayIso, type TrainingSession } from "@/app/lib/trainingSessions";
import { computeJourney, type Journey } from "@/app/lib/documents/journey";
import type { AttendanceSignature, SessionSlot, SessionTrainee } from "@/app/lib/documents/session";

export type ClientKind = "entreprise" | "cpf";

export type HubClient = {
  key: string;
  kind: ClientKind;
  name: string;
  detail: string;
  companyId: string | null;
  studentId: string | null;
  studentEmail: string | null;
  activeInstanceId: string | null;
  sessions: TrainingSession[];
};

export type PendingSignature = { documentId: string; sessionId: string; title: string; signerName: string | null; issuedAt: string };
export type TodaySlot = { slotId: string; sessionId: string; debut: string; fin: string; trainerSigned: boolean; signedCount: number; traineeCount: number };

export type HubSlot = SessionSlot & { sessionId: string };

export type FormationsHub = {
  clients: HubClient[];
  sessions: TrainingSession[];
  // Parcours de chaque session (progression, prochaine étape), par id.
  journeys: Record<string, Journey>;
  slots: HubSlot[];
  pendingSignatures: PendingSignature[];
  todaySlots: TodaySlot[];
};

export async function loadFormationsHub(): Promise<FormationsHub> {
  const [companies, sessions, studentsRes, instancesRes, traineesRes, docsRes, slotsRes] = await Promise.all([
    listCompanies(),
    listSessions(),
    supabase.from("profiles").select("id, first_name, last_name, email").eq("role", "student").is("company_id", null).order("last_name"),
    supabase.from("formation_instances").select("id, user_id, name").eq("status", "active").order("assigned_at", { ascending: false }),
    supabase.from("training_session_trainees").select("*"),
    supabase.from("session_documents").select("id, session_id, template_id, title, signer_name, issued_at, requires_signature, signed_at")
      .order("issued_at", { ascending: false }),
    supabase.from("training_session_slots").select("id, session_id, slot_date, start_time, end_time").order("slot_date").order("start_time"),
  ]);
  for (const r of [studentsRes, instancesRes, traineesRes, docsRes, slotsRes]) if (r.error) throw r.error;

  const allSlots: HubSlot[] = (slotsRes.data ?? []).map((r) => ({ id: r.id, sessionId: r.session_id, date: r.slot_date, debut: r.start_time.slice(0, 5), fin: r.end_time.slice(0, 5) }));
  let allSignatures: (AttendanceSignature & { slotId: string })[] = [];
  if (allSlots.length) {
    const { data, error } = await supabase.from("attendance_signatures")
      .select("id, slot_id, trainee_id, signer_role, signer_name, signed_at, ip").in("slot_id", allSlots.map((s) => s.id));
    if (error) throw error;
    allSignatures = (data ?? []).map((r) => ({ id: r.id, slotId: r.slot_id, traineeId: r.trainee_id, role: r.signer_role, signerName: r.signer_name, signedAt: r.signed_at, ip: r.ip }));
  }
  const allDocs = docsRes.data ?? [];
  const allTrainees = traineesRes.data ?? [];

  // Parcours de chaque session, calculé comme sur sa fiche (sans le détail
  // des connexions à distance, inutile pour la vue d'ensemble).
  const journeys: Record<string, Journey> = {};
  for (const session of sessions) {
    const slots = allSlots.filter((s) => s.sessionId === session.id);
    const trainees: SessionTrainee[] = allTrainees.filter((t) => t.session_id === session.id).map((t) => ({
      id: t.id, profileId: t.profile_id, civilite: t.civilite, prenom: t.prenom, nom: t.nom, email: t.email, fonction: t.fonction, resultatEvaluation: t.resultat_evaluation,
    }));
    const signatures = allSignatures.filter((g) => slots.some((s) => s.id === g.slotId));
    journeys[session.id] = computeJourney({ session, slots, trainees, signatures }, allDocs.filter((d) => d.session_id === session.id), {});
  }

  // Formation active la plus récente de chaque élève (liste triée par date).
  const instanceByStudent = new Map<string, { id: string; name: string }>();
  for (const i of instancesRes.data ?? []) if (!instanceByStudent.has(i.user_id)) instanceByStudent.set(i.user_id, { id: i.id, name: i.name });

  const sessionsByProfile = new Map<string, Set<string>>();
  const traineeCount = new Map<string, number>();
  for (const t of traineesRes.data ?? []) {
    traineeCount.set(t.session_id, (traineeCount.get(t.session_id) ?? 0) + 1);
    if (!t.profile_id) continue;
    sessionsByProfile.set(t.profile_id, (sessionsByProfile.get(t.profile_id) ?? new Set()).add(t.session_id));
  }

  const used = new Set<string>();
  const take = (list: TrainingSession[]) => { list.forEach((s) => used.add(s.id)); return list; };

  const companyClients: HubClient[] = companies.map((c) => ({
    key: `c:${c.id}`, kind: "entreprise", name: c.name,
    detail: `${c.employeeCount} collaborateur${c.employeeCount > 1 ? "s" : ""}`,
    companyId: c.id, studentId: null, studentEmail: null, activeInstanceId: null,
    sessions: take(sessions.filter((s) => s.companyId === c.id)),
  }));

  const studentClients: HubClient[] = (studentsRes.data ?? []).map((p) => {
    const ids = sessionsByProfile.get(p.id) ?? new Set<string>();
    const instance = instanceByStudent.get(p.id) ?? null;
    return {
      key: `p:${p.id}`, kind: "cpf", name: [p.first_name, p.last_name].filter(Boolean).join(" ") || p.email,
      detail: instance?.name ?? "Aucune formation active",
      companyId: null, studentId: p.id, studentEmail: p.email, activeInstanceId: instance?.id ?? null,
      sessions: take(sessions.filter((s) => !s.companyId && ids.has(s.id))),
    };
  });

  // Sessions dont le client n'a pas (encore) de compte ni d'entreprise.
  const orphanClients: HubClient[] = sessions.filter((s) => !used.has(s.id)).map((s) => ({
    key: `s:${s.id}`, kind: s.client.type === "entreprise" ? "entreprise" : "cpf", name: s.client.nom,
    detail: "Sans compte sur la plateforme", companyId: null, studentId: null, studentEmail: null, activeInstanceId: null, sessions: [s],
  }));

  const today = todayIso();
  const todays = allSlots.filter((s) => s.date === today);
  return {
    clients: [...companyClients, ...studentClients, ...orphanClients],
    sessions,
    journeys,
    slots: allSlots,
    pendingSignatures: allDocs.filter((d) => d.requires_signature && !d.signed_at)
      .map((d) => ({ documentId: d.id, sessionId: d.session_id, title: d.title, signerName: d.signer_name, issuedAt: d.issued_at })),
    todaySlots: todays.map((s) => ({
      slotId: s.id, sessionId: s.sessionId, debut: s.debut, fin: s.fin,
      trainerSigned: allSignatures.some((g) => g.slotId === s.id && g.role === "intervenant"),
      signedCount: allSignatures.filter((g) => g.slotId === s.id && g.role === "stagiaire").length,
      traineeCount: traineeCount.get(s.sessionId) ?? 0,
    })),
  };
}

export function sessionStatus(s: TrainingSession, today = todayIso()): "a_venir" | "en_cours" | "terminee" {
  if (today < s.dateDebut) return "a_venir";
  if (today > s.dateFin) return "terminee";
  return "en_cours";
}
