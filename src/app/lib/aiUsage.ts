// Données de consommation IA Runware de l'élève ("Mon utilisation IA", cf.
// migration 0071_ai_usage_budget.sql). AI_BUDGET_CAP_USD doit rester en phase
// avec _shared/ai-budget.ts côté edge functions (même convention que
// BATTLE_MODELS/ALLOWED_BATTLE_MODELS).
import { supabase } from "@/app/lib/supabase/client";
import type { AiUsageMediaType, AiUsageSource } from "@/app/lib/supabase/database.types";

// Plafond par défaut d'un nouveau compte (profiles.ai_budget_usd default 50) ;
// le plafond réel est personnel et rechargeable par l'admin.
export const AI_BUDGET_CAP_USD = 50;

// Même règle que checkAiBudget (_shared/ai-budget.ts). Number() : numeric
// Postgres peut arriver en chaîne selon le canal (REST vs realtime).
export function isAiBudgetExhausted(spentUsd: number | string | null | undefined, budgetUsd: number | string | null | undefined): boolean {
  return Number(spentUsd ?? 0) >= Number(budgetUsd ?? AI_BUDGET_CAP_USD);
}

export const MEDIA_TYPE_LABELS: Record<AiUsageMediaType, string> = {
  image: "Photos",
  video: "Vidéos",
  audio: "Sons",
  text: "Texte",
};

// Les identifiants de modèle Runware sont préfixés "provider:..." (cf.
// _shared/ai-budget.ts deriveProvider) — libellés lisibles pour l'affichage,
// fallback sur le préfixe brut pour tout fournisseur non listé ici.
export const PROVIDER_LABELS: Record<string, string> = {
  openai: "OpenAI",
  google: "Google",
  anthropic: "Anthropic",
  runware: "Runware (FLUX)",
  bfl: "Black Forest Labs",
  bytedance: "ByteDance",
  alibaba: "Alibaba",
  klingai: "KlingAI",
  luma: "Luma",
  recraft: "Recraft",
  runway: "Runway ML",
  imagineart: "ImagineArt",
};

export function providerLabel(provider: string): string {
  return PROVIDER_LABELS[provider] ?? provider;
}

export interface AiUsageEvent {
  id: string;
  mediaType: AiUsageMediaType;
  provider: string;
  model: string;
  costUsd: number;
  source: AiUsageSource;
  createdAt: string;
}

export async function getMyAiUsageEvents(userId: string): Promise<AiUsageEvent[]> {
  const { data, error } = await supabase
    .from("ai_usage_events")
    .select("id, media_type, provider, model, cost_usd, source, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    mediaType: row.media_type,
    provider: row.provider,
    model: row.model,
    costUsd: row.cost_usd,
    source: row.source,
    createdAt: row.created_at,
  }));
}

export interface AiBudgetTopup {
  id: string;
  amountUsd: number;
  createdAt: string;
}

export async function getStudentAiBudget(studentId: string): Promise<{ spentUsd: number; budgetUsd: number; topups: AiBudgetTopup[] }> {
  const [{ data: p, error: pErr }, { data: t, error: tErr }] = await Promise.all([
    supabase.from("profiles").select("spent_usd, ai_budget_usd").eq("id", studentId).single(),
    supabase.from("ai_budget_topups").select("id, amount_usd, created_at").eq("user_id", studentId).order("created_at", { ascending: false }),
  ]);
  if (pErr) throw pErr;
  if (tErr) throw tErr;
  return {
    spentUsd: Number(p.spent_usd ?? 0),
    budgetUsd: Number(p.ai_budget_usd ?? AI_BUDGET_CAP_USD),
    topups: (t ?? []).map((r) => ({ id: r.id, amountUsd: Number(r.amount_usd), createdAt: r.created_at })),
  };
}

// Réservé à l'admin (vérifié dans la fonction SQL admin_add_ai_credits). Renvoie le nouveau plafond.
export async function addAiCredits(studentId: string, amountUsd: number): Promise<number> {
  const { data, error } = await supabase.rpc("admin_add_ai_credits", { p_user_id: studentId, p_amount: amountUsd });
  if (error) throw new Error(error.message);
  return Number(data);
}
