// Atelier "Battle Ground" — un même prompt envoyé à 2-3 vrais fournisseurs IA
// (Gemini, GPT-4o, Claude), affichés côte à côte. Voir
// supabase/functions/generate-battle-responses.
//
// IMPORTANT : ALLOWED_BATTLE_MODELS doit rester synchronisée avec
// BATTLE_MODELS côté edge function.
import { supabase } from "@/app/lib/supabase/client";

export type BattleProvider = "gemini" | "openai" | "anthropic";

export const ALLOWED_BATTLE_MODELS: { id: BattleProvider; label: string }[] = [
  { id: "gemini", label: "Gemini (Google)" },
  { id: "openai", label: "GPT-4o (OpenAI)" },
  { id: "anthropic", label: "Claude Sonnet (Anthropic)" },
];

export interface BattleResponse {
  provider: BattleProvider;
  model: string;
  text: string | null;
  error: string | null;
  latencyMs: number;
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

export async function runBattleGround(promptText: string, models: BattleProvider[]): Promise<BattleGroundAttempt> {
  const { data, error } = await supabase.functions.invoke("generate-battle-responses", { body: { prompt: promptText, models } });
  if (error) throw new Error(await extractFunctionError(error));
  if (data?.error) throw new Error(data.error);
  if (!data?.attempt) throw new Error("Réponse inattendue du serveur.");
  return mapRow(data.attempt);
}

export async function listMyBattleGroundAttempts(userId: string, limit = 10): Promise<BattleGroundAttempt[]> {
  const { data, error } = await supabase
    .from("battle_ground_attempts")
    .select("id, prompt_text, responses, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map((row) => mapRow(row as unknown as Row));
}
