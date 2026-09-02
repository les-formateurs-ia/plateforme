// Couche d'accès aux données pour le planning natif (disponibilités +
// rendez-vous) — remplace l'ancien système basé sur un lien de réservation
// Google Calendar (voir appointments.ts / platformSettings.ts, supprimés).
import { supabase } from "@/app/lib/supabase/client";
import { createNotification } from "@/app/lib/notifications";

export const SESSION_MINUTES = 60;
const SLOT_MINUTES = 15;

export function toISODate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function addDays(d: Date, n: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + n);
  return copy;
}

export function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + minutes;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(Math.floor(total / 60) % 24)}:${pad(total % 60)}`;
}

// Premier jour réservable : jamais le jour même, à partir de demain.
export function firstBookableDate(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return addDays(d, 1);
}

function formatFR(dateISO: string, time: string): string {
  const d = new Date(`${dateISO}T00:00:00`);
  return `${d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })} à ${time}`;
}

// Formateur/admin attribué à l'élève (profiles.formateur_id, cf.
// 0024_student_formateur.sql) — l'élève ne voit que ses disponibilités.
export async function getAssignedFormateurId(studentId: string): Promise<string | null> {
  const { data, error } = await supabase.from("profiles").select("formateur_id").eq("id", studentId).maybeSingle();
  if (error) throw error;
  return data?.formateur_id ?? null;
}

export async function getFormateurName(formateurId: string): Promise<string> {
  const { data, error } = await supabase.from("profiles").select("first_name, last_name, email").eq("id", formateurId).maybeSingle();
  if (error) throw error;
  return [data?.first_name, data?.last_name].filter(Boolean).join(" ").trim() || data?.email || "Expert";
}

// ── Mon propre agenda (admin/formateur) ────────────────────────────────────

export async function listMyAvailability(formateurId: string, fromDate: string, toDate: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("availability_slots")
    .select("slot_date, start_time")
    .eq("formateur_id", formateurId)
    .gte("slot_date", fromDate)
    .lte("slot_date", toDate);
  if (error) throw error;
  return (data ?? []).map((r) => `${r.slot_date}_${r.start_time.slice(0, 5)}`);
}

// Remplace intégralement les créneaux déclarés sur [fromDate, toDate] par la
// liste fournie (clé "YYYY-MM-DD_HH:mm").
export async function saveAvailability(formateurId: string, fromDate: string, toDate: string, keys: string[]): Promise<void> {
  const { error: delError } = await supabase
    .from("availability_slots")
    .delete()
    .eq("formateur_id", formateurId)
    .gte("slot_date", fromDate)
    .lte("slot_date", toDate);
  if (delError) throw delError;

  if (!keys.length) return;
  const rows = keys.map((key) => {
    const [slot_date, start_time] = key.split("_");
    return { formateur_id: formateurId, slot_date, start_time };
  });
  const { error: insError } = await supabase.from("availability_slots").insert(rows);
  if (insError) throw insError;
}

export interface FormateurBooking {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  slotDate: string;
  startTime: string;
  endTime: string;
  status: "confirmed" | "cancelled";
  message: string | null;
  proposedDate: string | null;
  proposedStartTime: string | null;
  proposedEndTime: string | null;
}

function mapFormateurBooking(r: {
  id: string; student_id: string; slot_date: string; start_time: string; end_time: string;
  status: "confirmed" | "cancelled"; message: string | null;
  proposed_date: string | null; proposed_start_time: string | null; proposed_end_time: string | null;
}, name: string, email: string): FormateurBooking {
  return {
    id: r.id,
    studentId: r.student_id,
    studentName: name,
    studentEmail: email,
    slotDate: r.slot_date,
    startTime: r.start_time.slice(0, 5),
    endTime: r.end_time.slice(0, 5),
    status: r.status,
    message: r.message,
    proposedDate: r.proposed_date,
    proposedStartTime: r.proposed_start_time?.slice(0, 5) ?? null,
    proposedEndTime: r.proposed_end_time?.slice(0, 5) ?? null,
  };
}

export async function listMyBookingsAsFormateur(formateurId: string): Promise<FormateurBooking[]> {
  const { data, error } = await supabase
    .from("rendez_vous")
    .select("*")
    .eq("formateur_id", formateurId)
    .order("slot_date", { ascending: true })
    .order("start_time", { ascending: true });
  if (error) throw error;
  const rows = data ?? [];
  if (!rows.length) return [];

  const studentIds = [...new Set(rows.map((r) => r.student_id))];
  const { data: profiles, error: profError } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, email")
    .in("id", studentIds);
  if (profError) throw profError;
  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  return rows.map((r) => {
    const profile = profileMap.get(r.student_id);
    const name = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ").trim();
    return mapFormateurBooking(r, name || profile?.email || "Élève", profile?.email ?? "");
  });
}

// Le formateur ne peut pas honorer ce créneau : annulation + notification
// obligatoire à l'élève pour qu'il en reprenne un autre.
export async function cancelRdvAsFormateur(rdvId: string, formateurId: string, studentId: string, slotDate: string, startTime: string): Promise<void> {
  const { error } = await supabase.from("rendez_vous").update({ status: "cancelled", cancelled_by: formateurId }).eq("id", rdvId);
  if (error) throw error;
  await createNotification(
    studentId,
    "rdv_cancelled",
    "Rendez-vous annulé",
    `Votre formateur a annulé votre rendez-vous du ${formatFR(slotDate, startTime)}. Réservez un nouveau créneau dans l'onglet Rendez-vous.`,
    rdvId,
  );
}

// Le formateur propose un autre créneau — l'élève garde son rendez-vous
// actuel tant qu'il n'a pas accepté la proposition.
export async function proposeReschedule(rdvId: string, formateurId: string, studentId: string, proposedDate: string, proposedStartTime: string): Promise<void> {
  const proposedEndTime = addMinutes(proposedStartTime, SESSION_MINUTES);
  const { error } = await supabase
    .from("rendez_vous")
    .update({ proposed_date: proposedDate, proposed_start_time: proposedStartTime, proposed_end_time: proposedEndTime, proposed_by: formateurId, proposed_at: new Date().toISOString() })
    .eq("id", rdvId);
  if (error) throw error;
  await createNotification(
    studentId,
    "rdv_reschedule_proposed",
    "Nouveau créneau proposé",
    `Votre formateur propose de déplacer votre rendez-vous au ${formatFR(proposedDate, proposedStartTime)}. Réponds depuis l'onglet Rendez-vous.`,
    rdvId,
  );
}

// ── Vue élève : disponibilités du formateur/admin qui lui est attribué ────

export interface ExpertAvailableSlot {
  formateurId: string;
  formateurName: string;
  slotDate: string;
  startTime: string;
  endTime: string;
}

interface BookedRange { formateurId: string; date: string; start: string; end: string }

function computeHourlyStarts(
  availableByFormateurDay: Map<string, Set<string>>,
  booked: BookedRange[],
): { formateurId: string; date: string; start: string }[] {
  const bookedByKey = new Map<string, BookedRange[]>();
  for (const b of booked) {
    const key = `${b.formateurId}_${b.date}`;
    if (!bookedByKey.has(key)) bookedByKey.set(key, []);
    bookedByKey.get(key)!.push(b);
  }

  const results: { formateurId: string; date: string; start: string }[] = [];
  for (const [key, cells] of availableByFormateurDay) {
    const [formateurId, date] = key.split("_");
    const ranges = bookedByKey.get(key) ?? [];
    for (const start of cells) {
      // Les 4 créneaux de 15 min de l'heure complète doivent tous être libres.
      let full = true;
      for (let m = 0; m < SESSION_MINUTES; m += SLOT_MINUTES) {
        if (!cells.has(addMinutes(start, m))) { full = false; break; }
      }
      if (!full) continue;

      const end = addMinutes(start, SESSION_MINUTES);
      const overlaps = ranges.some((r) => start < r.end && end > r.start);
      if (overlaps) continue;

      results.push({ formateurId, date, start });
    }
  }
  return results.sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));
}

// N'affiche que les disponibilités du formateur/admin attribué à l'élève
// (profiles.formateur_id) — jamais celles des autres membres du staff.
export async function listAvailableSlotsForBooking(assignedFormateurId: string, fromDate: string, toDate: string): Promise<ExpertAvailableSlot[]> {
  const [{ data: slots, error: slotsError }, { data: booked, error: bookedError }] = await Promise.all([
    supabase.from("availability_slots").select("slot_date, start_time").eq("formateur_id", assignedFormateurId).gte("slot_date", fromDate).lte("slot_date", toDate),
    supabase.from("rendez_vous").select("slot_date, start_time, end_time").eq("formateur_id", assignedFormateurId).eq("status", "confirmed").gte("slot_date", fromDate).lte("slot_date", toDate),
  ]);
  if (slotsError) throw slotsError;
  if (bookedError) throw bookedError;

  const availableByFormateurDay = new Map<string, Set<string>>();
  for (const s of slots ?? []) {
    const key = `${assignedFormateurId}_${s.slot_date}`;
    if (!availableByFormateurDay.has(key)) availableByFormateurDay.set(key, new Set());
    availableByFormateurDay.get(key)!.add(s.start_time.slice(0, 5));
  }
  const bookedRanges: BookedRange[] = (booked ?? []).map((b) => ({ formateurId: assignedFormateurId, date: b.slot_date, start: b.start_time.slice(0, 5), end: b.end_time.slice(0, 5) }));

  const starts = computeHourlyStarts(availableByFormateurDay, bookedRanges);
  if (!starts.length) return [];

  const { data: profile, error: profError } = await supabase.from("profiles").select("first_name, last_name, email").eq("id", assignedFormateurId).maybeSingle();
  if (profError) throw profError;
  const name = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ").trim() || profile?.email || "Expert";

  return starts.map((s) => ({ formateurId: s.formateurId, formateurName: name, slotDate: s.date, startTime: s.start, endTime: addMinutes(s.start, SESSION_MINUTES) }));
}

export interface StudentBooking {
  id: string;
  formateurId: string;
  formateurName: string;
  slotDate: string;
  startTime: string;
  endTime: string;
  status: "confirmed" | "cancelled";
  proposedDate: string | null;
  proposedStartTime: string | null;
  proposedEndTime: string | null;
}

export async function listMyBookingsAsStudent(studentId: string): Promise<StudentBooking[]> {
  const { data, error } = await supabase
    .from("rendez_vous")
    .select("*")
    .eq("student_id", studentId)
    .order("slot_date", { ascending: true })
    .order("start_time", { ascending: true });
  if (error) throw error;
  const rows = data ?? [];
  if (!rows.length) return [];

  const formateurIds = [...new Set(rows.map((r) => r.formateur_id))];
  const { data: profiles, error: profError } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, email")
    .in("id", formateurIds);
  if (profError) throw profError;
  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  return rows.map((r) => {
    const profile = profileMap.get(r.formateur_id);
    const name = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ").trim();
    return {
      id: r.id,
      formateurId: r.formateur_id,
      formateurName: name || profile?.email || "Expert",
      slotDate: r.slot_date,
      startTime: r.start_time.slice(0, 5),
      endTime: r.end_time.slice(0, 5),
      status: r.status,
      proposedDate: r.proposed_date,
      proposedStartTime: r.proposed_start_time?.slice(0, 5) ?? null,
      proposedEndTime: r.proposed_end_time?.slice(0, 5) ?? null,
    };
  });
}

async function getStudentName(studentId: string): Promise<string> {
  const { data, error } = await supabase.from("profiles").select("first_name, last_name, email").eq("id", studentId).maybeSingle();
  if (error) throw error;
  return [data?.first_name, data?.last_name].filter(Boolean).join(" ").trim() || data?.email || "Votre élève";
}

// L'élève choisit un créneau parmi les disponibilités proposées — le
// formateur/admin attribué doit être notifié immédiatement.
export async function bookSlot(studentId: string, formateurId: string, slotDate: string, startTime: string): Promise<void> {
  const endTime = addMinutes(startTime, SESSION_MINUTES);
  const { data, error } = await supabase
    .from("rendez_vous")
    .insert({ student_id: studentId, formateur_id: formateurId, slot_date: slotDate, start_time: startTime, end_time: endTime })
    .select("id")
    .single();
  if (error) throw error;
  const studentName = await getStudentName(studentId).catch(() => "Votre élève");
  await createNotification(formateurId, "rdv_booked", "Nouveau rendez-vous réservé", `${studentName} a réservé un rendez-vous le ${formatFR(slotDate, startTime)}.`, data.id);
}

// Modifie un rendez-vous existant (au lieu d'en créer un second — un élève
// ne peut en avoir qu'un seul actif à la fois) — le formateur est notifié
// comme pour une nouvelle réservation.
export async function changeBooking(rdvId: string, studentId: string, formateurId: string, slotDate: string, startTime: string): Promise<void> {
  const endTime = addMinutes(startTime, SESSION_MINUTES);
  const { error } = await supabase.from("rendez_vous").update({ formateur_id: formateurId, slot_date: slotDate, start_time: startTime, end_time: endTime }).eq("id", rdvId);
  if (error) throw error;
  const studentName = await getStudentName(studentId).catch(() => "Votre élève");
  await createNotification(formateurId, "rdv_booked", "Rendez-vous modifié", `${studentName} a déplacé son rendez-vous au ${formatFR(slotDate, startTime)}.`, rdvId);
}

export async function cancelBooking(id: string): Promise<void> {
  const { error } = await supabase.from("rendez_vous").update({ status: "cancelled" }).eq("id", id);
  if (error) throw error;
}

export async function acceptReschedule(rdvId: string, formateurId: string, proposedDate: string, proposedStartTime: string, proposedEndTime: string): Promise<void> {
  const { error } = await supabase
    .from("rendez_vous")
    .update({ slot_date: proposedDate, start_time: proposedStartTime, end_time: proposedEndTime, proposed_date: null, proposed_start_time: null, proposed_end_time: null, proposed_by: null, proposed_at: null })
    .eq("id", rdvId);
  if (error) throw error;
  await createNotification(formateurId, "rdv_reschedule_accepted", "Proposition acceptée", `Votre élève a accepté le nouveau créneau du ${formatFR(proposedDate, proposedStartTime)}.`, rdvId);
}

export async function declineReschedule(rdvId: string, formateurId: string): Promise<void> {
  const { error } = await supabase
    .from("rendez_vous")
    .update({ proposed_date: null, proposed_start_time: null, proposed_end_time: null, proposed_by: null, proposed_at: null })
    .eq("id", rdvId);
  if (error) throw error;
  await createNotification(formateurId, "rdv_reschedule_declined", "Proposition refusée", "Votre élève a refusé le nouveau créneau proposé — son rendez-vous initial reste inchangé.", rdvId);
}
