// Couche d'accès aux données pour les rendez-vous avec un expert IA (fin de module).
import { supabase } from "@/app/lib/supabase/client";

export type AppointmentStatus = "requested" | "preparing" | "confirmed" | "completed" | "cancelled";

export interface Appointment {
  id: string;
  userId: string;
  formationId: string;
  sectionId: string | null;
  status: AppointmentStatus;
  requestedAt: string;
  scheduledAt: string | null;
  googleMeetLink: string | null;
  adminMessage: string | null;
  handledBy: string | null;
}

function mapAppointment(row: {
  id: string; user_id: string; formation_id: string; section_id: string | null; status: AppointmentStatus;
  requested_at: string; scheduled_at: string | null; google_meet_link: string | null; admin_message: string | null; handled_by: string | null;
}): Appointment {
  return {
    id: row.id,
    userId: row.user_id,
    formationId: row.formation_id,
    sectionId: row.section_id,
    status: row.status,
    requestedAt: row.requested_at,
    scheduledAt: row.scheduled_at,
    googleMeetLink: row.google_meet_link,
    adminMessage: row.admin_message,
    handledBy: row.handled_by,
  };
}

export async function getMyAppointments(userId: string): Promise<Appointment[]> {
  const { data, error } = await supabase
    .from("appointments")
    .select("*")
    .eq("user_id", userId)
    .order("requested_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapAppointment);
}

export async function requestAppointment(userId: string, formationId: string, sectionId: string | null): Promise<Appointment> {
  const { data, error } = await supabase
    .from("appointments")
    .insert({ user_id: userId, formation_id: formationId, section_id: sectionId, status: "requested" })
    .select("*")
    .single();
  if (error) throw error;
  return mapAppointment(data);
}

export interface AdminAppointmentRow extends Appointment {
  studentName: string;
  studentEmail: string;
  formationName: string;
  sectionTitle: string | null;
}

export async function getAllAppointmentsForAdmin(): Promise<AdminAppointmentRow[]> {
  const { data: appts, error } = await supabase.from("appointments").select("*").order("requested_at", { ascending: false });
  if (error) throw error;
  if (!appts?.length) return [];

  const userIds = [...new Set(appts.map((a) => a.user_id))];
  const formationIds = [...new Set(appts.map((a) => a.formation_id))];
  const sectionIds = [...new Set(appts.map((a) => a.section_id).filter((id): id is string => !!id))];

  const [{ data: profiles }, { data: formations }, { data: sections }] = await Promise.all([
    supabase.from("profiles").select("id, first_name, email").in("id", userIds),
    supabase.from("formations").select("id, name").in("id", formationIds),
    sectionIds.length ? supabase.from("sections").select("id, title").in("id", sectionIds) : Promise.resolve({ data: [] as { id: string; title: string }[] }),
  ]);

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));
  const formationMap = new Map((formations ?? []).map((f) => [f.id, f]));
  const sectionMap = new Map((sections ?? []).map((s) => [s.id, s]));

  return appts.map((a) => {
    const profile = profileMap.get(a.user_id);
    const formation = formationMap.get(a.formation_id);
    const section = a.section_id ? sectionMap.get(a.section_id) : undefined;
    return {
      ...mapAppointment(a),
      studentName: profile?.first_name || profile?.email || "?",
      studentEmail: profile?.email ?? "",
      formationName: formation?.name ?? "?",
      sectionTitle: section?.title ?? null,
    };
  });
}

export interface AppointmentAdminPatch {
  status?: AppointmentStatus;
  scheduledAt?: string | null;
  googleMeetLink?: string | null;
  adminMessage?: string | null;
  handledBy?: string;
}

export async function updateAppointmentAsAdmin(id: string, patch: AppointmentAdminPatch): Promise<void> {
  const payload: Record<string, unknown> = {};
  if (patch.status !== undefined) payload.status = patch.status;
  if (patch.scheduledAt !== undefined) payload.scheduled_at = patch.scheduledAt;
  if (patch.googleMeetLink !== undefined) payload.google_meet_link = patch.googleMeetLink;
  if (patch.adminMessage !== undefined) payload.admin_message = patch.adminMessage;
  if (patch.handledBy !== undefined) payload.handled_by = patch.handledBy;
  const { error } = await supabase.from("appointments").update(payload).eq("id", id);
  if (error) throw error;
}
