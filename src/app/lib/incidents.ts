// Signalement d'incidents techniques (bouton topbar) + suivi admin.
import { supabase } from "@/app/lib/supabase/client";
import type { IncidentPage, IncidentStatus } from "@/app/lib/supabase/database.types";

export const INCIDENT_PAGE_OPTIONS: { value: IncidentPage; label: string }[] = [
  { value: "lecon", label: "Leçon" },
  { value: "tableau_de_bord", label: "Tableau de bord" },
  { value: "outil_ia", label: "Outil IA" },
  { value: "exercice", label: "Exercice" },
  { value: "autre", label: "Autre" },
];

export const INCIDENT_PAGE_LABEL: Record<IncidentPage, string> = Object.fromEntries(
  INCIDENT_PAGE_OPTIONS.map((o) => [o.value, o.label]),
) as Record<IncidentPage, string>;

export const INCIDENT_STATUS_LABEL: Record<IncidentStatus, string> = {
  a_traiter: "À traiter",
  corrige: "Corrigé",
};

export interface ReportedIncident {
  id: string;
  page: IncidentPage;
  description: string;
  status: IncidentStatus;
  createdAt: string;
  reporterName: string;
  reporterEmail: string;
}

export async function reportIncident(userId: string, page: IncidentPage, description: string): Promise<void> {
  const { error } = await supabase.from("reported_incidents").insert({ user_id: userId, page, description: description.trim() });
  if (error) throw error;
}

// Admin uniquement (RLS : reported_incidents_read_own_or_admin). Deux requêtes
// simples plutôt qu'une jointure imbriquée — volumes faibles, même logique
// que buildStudentOverview côté edge functions.
export async function listIncidents(): Promise<ReportedIncident[]> {
  const { data: incidents, error } = await supabase
    .from("reported_incidents")
    .select("id, user_id, page, description, status, created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  const rows = incidents ?? [];

  const userIds = [...new Set(rows.map((r) => r.user_id))];
  const profileById = new Map<string, { first_name: string | null; last_name: string | null; email: string }>();
  if (userIds.length > 0) {
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles").select("id, first_name, last_name, email").in("id", userIds);
    if (profilesError) throw profilesError;
    for (const p of profiles ?? []) profileById.set(p.id, p);
  }

  return rows.map((row) => {
    const profile = profileById.get(row.user_id);
    const name = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ").trim();
    return {
      id: row.id,
      page: row.page,
      description: row.description,
      status: row.status,
      createdAt: row.created_at,
      reporterName: name || "Utilisateur supprimé",
      reporterEmail: profile?.email ?? "",
    };
  });
}

export async function updateIncidentStatus(id: string, status: IncidentStatus): Promise<void> {
  const { error } = await supabase.from("reported_incidents").update({ status }).eq("id", id);
  if (error) throw error;
}
