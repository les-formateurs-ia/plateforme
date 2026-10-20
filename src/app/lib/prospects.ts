// Couche d'accès de l'espace "Prospects" (admin uniquement, cf. migration
// 20261020120000_prospects_pipeline) : les demandes du conseiller IA et des
// pages contact du site, leur étape dans le tableau, le journal et les rappels.
import { addDays, isToday } from "date-fns";
import { supabase } from "@/app/lib/supabase/client";
import type { Database, ProspectActivityKind, ProspectManualSource, ProspectStage } from "@/app/lib/supabase/database.types";

export type { ProspectActivityKind, ProspectManualSource, ProspectStage };

type LeadRow = Database["public"]["Tables"]["project_advisor_leads"]["Row"];
export type Lead = Pick<LeadRow,
  "id" | "first_name" | "last_name" | "email" | "profile" | "sector" | "need" | "phone" | "status" | "created_at" | "callback_requested_at"
  | "source" | "company" | "challenges" | "employment_status" | "cpf_balance" | "pipeline_stage" | "stage_changed_at" | "deal_value">;
export type Activity = Database["public"]["Tables"]["prospect_activities"]["Row"];
export type Reminder = Database["public"]["Tables"]["prospect_reminders"]["Row"];

const LEAD_COLUMNS = "id,first_name,last_name,email,profile,sector,need,phone,status,created_at,callback_requested_at,source,company,challenges,employment_status,cpf_balance,pipeline_stage,stage_changed_at,deal_value";
// Le tableau charge tout d'un coup ; au-delà, les plus anciennes restent en base.
const MAX_LEADS = 2000;

// Colonnes du tableau, dans l'ordre du parcours commercial.
export const STAGES: { id: ProspectStage; label: string; hint: string; color: string }[] = [
  { id: "nouveau", label: "Nouveaux", hint: "Demandes pas encore traitées", color: "#b58de0" },
  { id: "a_rappeler", label: "À rappeler", hint: "Rappel prévu ou demandé", color: "#eeb85a" },
  { id: "contacte", label: "Contactés", hint: "Premier échange fait", color: "#78d5e2" },
  { id: "proposition", label: "Proposition", hint: "Devis ou programme envoyé", color: "#7fa8f0" },
  { id: "gagne", label: "Gagnés", hint: "Inscrits / signés", color: "#6adeb1" },
  { id: "archive", label: "Archivés", hint: "Sans suite, perdus, doublons", color: "#a3a3a3" },
];
export const STAGE_LABEL = Object.fromEntries(STAGES.map(s => [s.id, s.label])) as Record<ProspectStage, string>;

export const ACTIVITY_KINDS: { id: Exclude<ProspectActivityKind, "etape">; label: string }[] = [
  { id: "note", label: "Note" },
  { id: "appel", label: "Appel" },
  { id: "email", label: "E-mail" },
  { id: "rdv", label: "Rendez-vous" },
];

// Origines saisies à la main par l'admin (prospects venus hors du site).
export const MANUAL_SOURCES: Record<ProspectManualSource, string> = {
  google: "Google",
  maformation: "MaFormation",
  "reseaux-sociaux": "Réseaux sociaux",
  "appel-direct": "Appel direct",
};

// Origine de la demande : le conseiller, une des pages contact du site
// (supabase/functions/contact-request, valeurs du site : src/data/contact.ts)
// ou une saisie manuelle.
export const SOURCES: Record<Lead["source"], string> = {
  "conseiller-ia": "Conseiller IA",
  "contact-general": "Contact général",
  "contact-entreprise": "Contact entreprise",
  "contact-particulier": "Contact particulier",
  ...MANUAL_SOURCES,
};
export const isManual = (lead: Lead) => lead.source in MANUAL_SOURCES;

/** Numéro au format international attendu par la base (+33…), ou null s'il est invalide. */
export function normalizePhone(input: string): string | null {
  let digits = input.replace(/[\s.\-()]/g, "");
  if (digits.startsWith("00")) digits = `+${digits.slice(2)}`;
  else if (/^0[1-9]\d{8}$/.test(digits)) digits = `+33${digits.slice(1)}`;
  return /^\+[1-9]\d{7,14}$/.test(digits) ? digits : null;
}

const CHALLENGES: Record<string, string> = {
  "charge-equipes": "Alléger la charge de travail des équipes",
  automatisation: "Automatiser le traitement de données / documents",
  "charte-conformite": "Charte IA & conformité RGPD / AI Act",
  cadrage: "Autre / cadrage global",
};
const STATUSES: Record<string, string> = { salarie: "Salarié", "demandeur-emploi": "Demandeur d’emploi", "independant-autre": "Indépendant / autre" };
const CPF: Record<string, string> = { oui: "Connaît son solde CPF", non: "Ne connaît pas son solde CPF", aide: "Souhaite de l’aide pour consulter son solde CPF" };

/** Les réponses propres au formulaire de la demande, une ligne chacune. */
export function leadAnswers(lead: Lead): string[] {
  return [
    lead.company,
    ...(lead.challenges ?? []).map(c => CHALLENGES[c] ?? c),
    lead.employment_status && (STATUSES[lead.employment_status] ?? lead.employment_status),
    lead.cpf_balance && (CPF[lead.cpf_balance] ?? lead.cpf_balance),
    lead.need,
  ].filter((line): line is string => Boolean(line?.trim()));
}

export const leadName = (lead: Lead) => `${lead.first_name} ${lead.last_name}`.trim();

/** Échéance d'un rappel, relative quand elle est proche (« Demain 09:00 »). */
export const dueLabel = (iso: string) => {
  const d = new Date(iso);
  const time = d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  if (isToday(d)) return `Aujourd’hui ${time}`;
  if (isToday(addDays(d, -1))) return `Demain ${time}`;
  if (isToday(addDays(d, 1))) return `Hier ${time}`;
  return d.toLocaleString("fr-FR", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
};

export interface Board {
  leads: Lead[];
  reminders: Reminder[]; // rappels non faits, tous prospects confondus
  lastContact: Map<number, string>; // dernier appel / e-mail / RDV / note
  activityCount: Map<number, number>;
}

export async function loadBoard(): Promise<Board> {
  const [leads, reminders, activities] = await Promise.all([
    supabase.from("project_advisor_leads").select(LEAD_COLUMNS)
      .order("created_at", { ascending: false }).limit(MAX_LEADS),
    supabase.from("prospect_reminders").select("*").is("done_at", null).order("due_at"),
    supabase.from("prospect_activities").select("lead_id,created_at").neq("kind", "etape"),
  ]);
  if (leads.error) throw leads.error;
  if (reminders.error) throw reminders.error;
  if (activities.error) throw activities.error;
  const lastContact = new Map<number, string>();
  const activityCount = new Map<number, number>();
  for (const a of activities.data ?? []) {
    activityCount.set(a.lead_id, (activityCount.get(a.lead_id) ?? 0) + 1);
    if ((lastContact.get(a.lead_id) ?? "") < a.created_at) lastContact.set(a.lead_id, a.created_at);
  }
  return { leads: (leads.data ?? []) as Lead[], reminders: reminders.data ?? [], lastContact, activityCount };
}

export type NewProspect = Database["public"]["Tables"]["project_advisor_leads"]["Insert"];

export async function createProspect(prospect: NewProspect): Promise<Lead> {
  const { data, error } = await supabase.from("project_advisor_leads").insert(prospect).select(LEAD_COLUMNS).single();
  if (error) throw error;
  return data as Lead;
}

export async function deleteProspect(leadId: number): Promise<void> {
  const { error } = await supabase.from("project_advisor_leads").delete().eq("id", leadId);
  if (error) throw error;
}

export async function setStage(leadId: number, stage: ProspectStage): Promise<void> {
  const { error } = await supabase.from("project_advisor_leads").update({ pipeline_stage: stage }).eq("id", leadId);
  if (error) throw error;
}

export async function setDealValue(leadId: number, value: number | null): Promise<void> {
  const { error } = await supabase.from("project_advisor_leads").update({ deal_value: value }).eq("id", leadId);
  if (error) throw error;
}

export async function listActivities(leadId: number): Promise<Activity[]> {
  const { data, error } = await supabase.from("prospect_activities").select("*")
    .eq("lead_id", leadId).order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function addActivity(leadId: number, kind: ProspectActivityKind, body: string): Promise<Activity> {
  const { data, error } = await supabase.from("prospect_activities").insert({ lead_id: leadId, kind, body }).select("*").single();
  if (error) throw error;
  return data;
}

export async function deleteActivity(id: number): Promise<void> {
  const { error } = await supabase.from("prospect_activities").delete().eq("id", id);
  if (error) throw error;
}

export async function listLeadReminders(leadId: number): Promise<Reminder[]> {
  const { data, error } = await supabase.from("prospect_reminders").select("*")
    .eq("lead_id", leadId).order("due_at");
  if (error) throw error;
  return data ?? [];
}

export async function addReminder(leadId: number, dueAt: Date, title: string): Promise<Reminder> {
  const { data, error } = await supabase.from("prospect_reminders")
    .insert({ lead_id: leadId, due_at: dueAt.toISOString(), title }).select("*").single();
  if (error) throw error;
  return data;
}

export async function setReminderDone(id: number, done: boolean): Promise<void> {
  const { error } = await supabase.from("prospect_reminders").update({ done_at: done ? new Date().toISOString() : null }).eq("id", id);
  if (error) throw error;
}

export async function deleteReminder(id: number): Promise<void> {
  const { error } = await supabase.from("prospect_reminders").delete().eq("id", id);
  if (error) throw error;
}
