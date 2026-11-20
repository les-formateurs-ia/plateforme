// Mode Visiteur (cf. migration 20261119120000_visitor_mode.sql) : un prospect
// ouvre /visite/:jeton et découvre la plateforme sur un compte élève de
// démonstration. Ce fichier regroupe ce que le visiteur peut voir, et l'API
// admin des liens (page « Liens visiteurs »).
//
// Garde-fous serveur : modules suivants fermés (instance_sections), budget IA
// (checkAiBudget), Agent IA en mode test, pas de réservation de rendez-vous.
// Le reste (Hub, Guide, Exercices) est un aperçu limité côté interface.
import { supabase } from "@/app/lib/supabase/client";
import { ASTUCE_CAS } from "@/app/data/astuces";

export const VISITOR_PATH = "/visite";

// Leçons ouvertes : seulement la première du programme.
export const VISITOR_OPEN_LESSONS = 1;
// Vidéo de la leçon ouverte au visiteur : null tant qu'aucune vidéo de
// démonstration n'est prête (emplacement affiché à la place, et la vidéo
// habituelle de la leçon n'est pas chargée).
export const VISITOR_LESSON_VIDEO_URL: string | null = null;
// Hub IA : les premiers modèles de chaque catégorie.
export const VISITOR_HUB_MODELS = 3;
// Exercices : Battle Ground uniquement.
export const VISITOR_PRACTICE_PATHS = ["/practice/battle-ground"];
// Budget IA proposé par défaut à la création d'un lien (quelques images).
export const VISITOR_DEFAULT_BUDGET_USD = 1;

// Guide IA : le premier cas pratique de chaque type (Images, Vidéos, Web).
const VISITOR_CAS_IDS = new Set(
  [...new Set(ASTUCE_CAS.map((c) => c.domain))].map((domain) => ASTUCE_CAS.find((c) => c.domain === domain)!.id),
);
export function isCasOpenToVisitor(casId: string): boolean {
  return VISITOR_CAS_IDS.has(casId);
}

// Pages réservées à la formation : remplacées par un encart pour le visiteur.
export const VISITOR_CLOSED_FEATURES = {
  certification: "La certification",
  calendar: "Les rendez-vous avec votre formateur",
  practice: "Cet exercice",
  briques: "La bibliothèque des briques de prompt",
  builder: "Le constructeur de prompt",
  guide: "Ce cas pratique",
} as const;
export type VisitorClosedFeature = keyof typeof VISITOR_CLOSED_FEATURES;

export function visitorLinkUrl(token: string): string {
  return `${window.location.origin}${VISITOR_PATH}/${token}`;
}

// ── API admin ─────────────────────────────────────────────────────────────
export interface VisitorLink {
  id: string;
  token: string;
  label: string;
  profileId: string;
  templateName: string | null;
  createdAt: string;
  expiresAt: string | null;
  revokedAt: string | null;
  openCount: number;
  lastOpenedAt: string | null;
  spentUsd: number;
  budgetUsd: number;
}

export async function listVisitorLinks(): Promise<VisitorLink[]> {
  const { data, error } = await supabase
    .from("visitor_links")
    .select("id, token, label, profile_id, template_id, created_at, expires_at, revoked_at, open_count, last_opened_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  const rows = data ?? [];
  const profileIds = rows.map((r) => r.profile_id);
  const templateIds = [...new Set(rows.map((r) => r.template_id).filter((id): id is string => !!id))];
  const [{ data: profiles, error: pErr }, { data: templates, error: tErr }] = await Promise.all([
    profileIds.length ? supabase.from("profiles").select("id, spent_usd, ai_budget_usd").in("id", profileIds) : Promise.resolve({ data: [], error: null }),
    templateIds.length ? supabase.from("formations").select("id, name").in("id", templateIds) : Promise.resolve({ data: [], error: null }),
  ]);
  if (pErr) throw pErr;
  if (tErr) throw tErr;
  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));
  const templateById = new Map((templates ?? []).map((t) => [t.id, t.name]));
  return rows.map((r) => {
    const p = profileById.get(r.profile_id);
    return {
      id: r.id,
      token: r.token,
      label: r.label,
      profileId: r.profile_id,
      templateName: r.template_id ? templateById.get(r.template_id) ?? null : null,
      createdAt: r.created_at,
      expiresAt: r.expires_at,
      revokedAt: r.revoked_at,
      openCount: r.open_count,
      lastOpenedAt: r.last_opened_at,
      spentUsd: Number(p?.spent_usd ?? 0),
      budgetUsd: Number(p?.ai_budget_usd ?? 0),
    };
  });
}

async function functionError(error: { message: string; context?: Response }): Promise<string> {
  if (error.context) {
    try {
      const body = await error.context.clone().json();
      if (body?.error) return body.error;
    } catch {
      // corps non-JSON
    }
  }
  return error.message;
}

export interface CreateVisitorLinkInput {
  label: string;
  templateId: string;
  budgetUsd: number;
  expiresInDays: number | null;
}

export async function createVisitorLink(input: CreateVisitorLinkInput): Promise<{ token: string }> {
  const { data, error } = await supabase.functions.invoke("create-visitor-link", { body: input });
  if (error) throw new Error(await functionError(error));
  if (data?.error) throw new Error(data.error);
  return { token: data.token };
}

// Désactiver garde le compte (et ce que le visiteur a créé) ; réactiver le
// rouvre tel quel.
export async function setVisitorLinkRevoked(id: string, revoked: boolean): Promise<void> {
  const { error } = await supabase.from("visitor_links").update({ revoked_at: revoked ? new Date().toISOString() : null }).eq("id", id);
  if (error) throw error;
}

// Supprime le compte visiteur (et le lien, en cascade) via delete-student.
export async function deleteVisitorAccount(profileId: string): Promise<void> {
  const { data, error } = await supabase.functions.invoke("delete-student", { body: { studentId: profileId } });
  if (error) throw new Error(await functionError(error));
  if (data?.error) throw new Error(data.error);
}
