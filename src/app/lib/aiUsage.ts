// Données de consommation IA Runware de l'élève ("Mon utilisation IA", cf.
// migration 0071_ai_usage_budget.sql). AI_BUDGET_CAP_USD doit rester en phase
// avec _shared/ai-budget.ts côté edge functions (même convention que
// BATTLE_MODELS/ALLOWED_BATTLE_MODELS).
import { supabase } from "@/app/lib/supabase/client";
import type { AiUsageMediaType, AiUsageSource } from "@/app/lib/supabase/database.types";

export const AI_BUDGET_CAP_USD = 50;

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
