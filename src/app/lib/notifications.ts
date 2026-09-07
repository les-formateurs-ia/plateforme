// Notifications liées au planning (annulation / proposition de nouveau
// créneau par le formateur) — table générique, cf. 0025_rdv_workflow.sql.
import { supabase } from "@/app/lib/supabase/client";
import type { NotificationType } from "@/app/lib/supabase/database.types";

export interface NotificationRow {
  id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  rdvId: string | null;
  read: boolean;
  createdAt: string;
}

function mapNotification(row: { id: string; type: NotificationType; title: string; body: string | null; rdv_id: string | null; read_at: string | null; created_at: string }): NotificationRow {
  return { id: row.id, type: row.type, title: row.title, body: row.body, rdvId: row.rdv_id, read: !!row.read_at, createdAt: row.created_at };
}

export async function listMyNotifications(userId: string): Promise<NotificationRow[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(30);
  if (error) throw error;
  return (data ?? []).map(mapNotification);
}

export async function markNotificationRead(id: string): Promise<void> {
  const { error } = await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id).is("read_at", null);
  if (error) throw error;
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  const { error } = await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("user_id", userId).is("read_at", null);
  if (error) throw error;
}

export async function createNotification(userId: string, type: NotificationType, title: string, body: string, rdvId: string): Promise<void> {
  const { error } = await supabase.from("notifications").insert({ user_id: userId, type, title, body, rdv_id: rdvId });
  if (error) console.warn("Impossible d'envoyer la notification", error);
}

// Badge de l'onglet Incidents (staff/layout) — un incident signalé notifie
// tous les admins côté DB (trigger notify_admins_of_incident), ces deux
// helpers pilotent juste le pastille "non lu" associée.
export async function countUnreadIncidentNotifications(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("type", "incident_reported")
    .is("read_at", null);
  if (error) throw error;
  return count ?? 0;
}

export async function markIncidentNotificationsRead(userId: string): Promise<void> {
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("type", "incident_reported")
    .is("read_at", null);
  if (error) throw error;
}
