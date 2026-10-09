// Atelier "Battle Ground" — un même prompt envoyé à 2-3 vrais fournisseurs IA
// (Gemini, GPT, Claude) de même gamme, réponses comparées côte à côte. Voir
// supabase/functions/generate-battle-responses — GPT et Claude sont routés
// via Runware (pas de clé OpenAI/Anthropic séparée nécessaire).
//
// IMPORTANT : BATTLE_TIERS doit rester synchronisée avec BATTLE_TIERS côté
// edge function.
import { supabase } from "@/app/lib/supabase/client";

export type BattleProvider = "gemini" | "openai" | "anthropic";

export type BattleTier = "rapide" | "polyvalent" | "expert";

// Les trois combattants, toujours dans cet ordre.
export const BATTLE_PROVIDERS: { id: BattleProvider; name: string; maker: string }[] = [
  { id: "gemini", name: "Gemini", maker: "Google" },
  { id: "openai", name: "GPT", maker: "OpenAI" },
  { id: "anthropic", name: "Claude", maker: "Anthropic" },
];

// Une gamme par type de demande, pour comparer des modèles équivalents.
export const BATTLE_TIERS: {
  id: BattleTier; label: string; desc: string; pace: string;
  models: Record<BattleProvider, { model: string; label: string }>;
}[] = [
  {
    id: "rapide", label: "Rapide", desc: "Questions simples, reformulations, réponses courtes.", pace: "Quelques secondes",
    models: {
      gemini: { model: "gemini-3.5-flash-lite", label: "Gemini 3.5 Flash-Lite" },
      openai: { model: "openai:gpt@5.4-mini", label: "GPT-5.4 mini" },
      anthropic: { model: "anthropic:claude@haiku-4.5", label: "Claude Haiku 4.5" },
    },
  },
  {
    id: "polyvalent", label: "Polyvalent", desc: "Rédaction, synthèse, usage professionnel courant.", pace: "Une dizaine de secondes",
    models: {
      gemini: { model: "gemini-3.8-flash", label: "Gemini 3.8 Flash" },
      openai: { model: "openai:gpt@5.4", label: "GPT-5.4" },
      anthropic: { model: "anthropic:claude@sonnet-4.6", label: "Claude Sonnet 4.6" },
    },
  },
  {
    id: "expert", label: "Expert", desc: "Raisonnement, analyse poussée, problèmes complexes.", pace: "Jusqu'à une minute",
    models: {
      gemini: { model: "gemini-3.1-pro-preview", label: "Gemini 3.1 Pro" },
      openai: { model: "openai:gpt@5.5", label: "GPT-5.5" },
      anthropic: { model: "anthropic:claude@opus-5", label: "Claude Opus 5" },
    },
  },
];

// Anciens combats (avant les gammes) : Gemini 3.6 Flash, GPT-5.5, Opus 5.
const LEGACY_LABELS: Record<string, string> = {
  "gemini-3.6-flash": "Gemini 3.6 Flash",
  "openai:gpt@5.4-pro": "GPT-5.4 Pro",
};

export function battleModelLabel(r: Pick<BattleResponse, "provider" | "model">): string {
  for (const tier of BATTLE_TIERS) {
    const m = tier.models[r.provider];
    if (m?.model === r.model) return m.label;
  }
  return LEGACY_LABELS[r.model] ?? BATTLE_PROVIDERS.find((p) => p.id === r.provider)?.name ?? r.provider;
}

export function battleTierOf(responses: BattleResponse[]): BattleTier | null {
  return BATTLE_TIERS.find((t) => responses.some((r) => t.models[r.provider]?.model === r.model))?.id ?? null;
}

export interface BattleResponse {
  provider: BattleProvider;
  model: string;
  text: string | null;
  error: string | null;
  latencyMs: number;
  // Réponse préférée par l'élève — rangé dans le jsonb `responses` plutôt
  // qu'une colonne dédiée (au plus une à true).
  voted?: boolean;
}

export interface BattleGroundAttempt {
  id: string;
  promptText: string;
  responses: BattleResponse[];
  createdAt: string;
}

interface Row {
  id: string;
  prompt_text: string;
  responses: BattleResponse[];
  created_at: string;
}

function mapRow(row: Row): BattleGroundAttempt {
  return { id: row.id, promptText: row.prompt_text, responses: row.responses, createdAt: row.created_at };
}

async function extractFunctionError(error: { message: string; context?: Response }): Promise<string> {
  let message = error.message;
  if (error.context) {
    try {
      const body = await error.context.clone().json();
      if (body?.error) message = body.error;
    } catch {
      // corps non-JSON, on garde le message par défaut
    }
  }
  return message;
}

// Un seul modèle par appel (persist: false) : la page lance un appel par
// combattant en parallèle et affiche chaque réponse dès qu'elle arrive, au
// lieu d'attendre la plus lente. Ne lève jamais : une erreur devient une
// réponse en échec, affichée dans la colonne du modèle.
export async function runBattleModel(promptText: string, provider: BattleProvider, tier: BattleTier): Promise<BattleResponse> {
  const started = Date.now();
  const model = BATTLE_TIERS.find((t) => t.id === tier)!.models[provider].model;
  const failed = (error: string): BattleResponse => ({ provider, model, text: null, error, latencyMs: Date.now() - started });
  try {
    const { data, error } = await supabase.functions.invoke("generate-battle-responses", { body: { prompt: promptText, models: [provider], persist: false, tier } });
    if (error) return failed(await extractFunctionError(error));
    if (data?.error) return failed(data.error);
    const response = data?.responses?.[0] as BattleResponse | undefined;
    return response ?? failed("Réponse inattendue du serveur.");
  } catch (err) {
    return failed(err instanceof Error ? err.message : "Erreur inconnue.");
  }
}

export async function saveBattleGroundAttempt(userId: string, promptText: string, responses: BattleResponse[]): Promise<BattleGroundAttempt> {
  const { data, error } = await supabase
    .from("battle_ground_attempts")
    .insert({ user_id: userId, prompt_text: promptText, responses: responses as unknown as Record<string, unknown>[] })
    .select("id, prompt_text, responses, created_at")
    .single();
  if (error) throw error;
  return mapRow(data as unknown as Row);
}

// Met à jour les réponses d'un combat déjà enregistré (vote, ou modèle relancé
// après un échec).
export async function updateBattleGroundResponses(id: string, responses: BattleResponse[]): Promise<void> {
  const { error } = await supabase.from("battle_ground_attempts").update({ responses: responses as unknown as Record<string, unknown>[] }).eq("id", id);
  if (error) throw error;
}

export async function listMyBattleGroundAttempts(userId: string, limit = 30): Promise<BattleGroundAttempt[]> {
  const { data, error } = await supabase
    .from("battle_ground_attempts")
    .select("id, prompt_text, responses, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map((row) => mapRow(row as unknown as Row));
}

export async function deleteBattleGroundAttempt(id: string): Promise<void> {
  const { error } = await supabase.from("battle_ground_attempts").delete().eq("id", id);
  if (error) throw error;
}
