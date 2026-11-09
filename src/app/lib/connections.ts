// Historique des connexions des élèves (migration 20261109120000) : l'espace
// élève signale sa présence à l'ouverture puis chaque minute tant que
// l'onglet est visible ; la base fixe elle-même l'heure (rien n'est saisi à
// la main ni antidaté). Une pause de plus de 15 minutes ouvre une nouvelle
// connexion.
import { supabase } from "@/app/lib/supabase/client";

export type LearnerConnection = { id: string; startedAt: string; lastSeenAt: string; seconds: number; ip: string | null; userAgent: string | null };

export async function touchConnection(): Promise<void> {
  const { error } = await supabase.rpc("touch_learner_connection");
  if (error) console.warn("Connexion non enregistrée :", error.message);
}

export async function listConnections(userId: string): Promise<LearnerConnection[]> {
  const { data, error } = await supabase.from("learner_connections")
    .select("id, started_at, last_seen_at, ip, user_agent").eq("user_id", userId).order("started_at", { ascending: false }).limit(1000);
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id, startedAt: r.started_at, lastSeenAt: r.last_seen_at, ip: r.ip, userAgent: r.user_agent,
    seconds: Math.max(0, Math.round((new Date(r.last_seen_at).getTime() - new Date(r.started_at).getTime()) / 1000)),
  }));
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return "< 1 min";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h ? `${h} h ${String(m).padStart(2, "0")}` : `${m} min`;
}

const fr = (iso: string, opts: Intl.DateTimeFormatOptions) => new Date(iso).toLocaleString("fr-FR", { timeZone: "Europe/Paris", ...opts });
export const connectionDate = (iso: string) => fr(iso, { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric" });
export const connectionTime = (iso: string) => fr(iso, { hour: "2-digit", minute: "2-digit" });

// Relevé tel qu'enregistré, pour un contrôle ou un dossier (tableur).
export function connectionsCsv(rows: LearnerConnection[]): string {
  const cell = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const lines = [["Date", "Début", "Fin", "Durée (min)", "Adresse IP", "Navigateur"].map(cell).join(";")];
  for (const r of [...rows].reverse()) {
    lines.push([
      fr(r.startedAt, { day: "2-digit", month: "2-digit", year: "numeric" }), connectionTime(r.startedAt), connectionTime(r.lastSeenAt),
      String(Math.round(r.seconds / 60)), r.ip ?? "", r.userAgent ?? "",
    ].map(cell).join(";"));
  }
  return "﻿" + lines.join("\r\n");
}
