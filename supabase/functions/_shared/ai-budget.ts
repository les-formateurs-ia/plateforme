// Budget IA Runware par élève (plafond 50 $, cf. migration
// 0071_ai_usage_budget.sql). Point d'entrée partagé par tous les edge
// functions qui déclenchent un appel Runware (image/vidéo/texte) : le check
// avant l'appel, la capture du coût après.
export const AI_BUDGET_CAP_USD = 50;

// Les identifiants de modèle Runware suivent la convention "provider:id@version"
// (ex. "openai:gpt-image@2", "runware:101@1", "bfl:5@1") — cf.
// _shared/studio-models.ts / studio-video-models.ts.
export function deriveProvider(model: string): string {
  return model.split(":")[0] || model;
}

// deno-lint-ignore no-explicit-any
export async function checkAiBudget(userClient: any, userId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data, error } = await userClient.from("profiles").select("spent_usd").eq("id", userId).single();
  if (error || !data) return { ok: false, error: "Impossible de vérifier le budget IA." };
  if ((data.spent_usd ?? 0) >= AI_BUDGET_CAP_USD) {
    return { ok: false, error: "Vous avez atteint votre limite de crédits." };
  }
  return { ok: true };
}

type MediaType = "image" | "video" | "audio" | "text";
type UsageSource = "studio_image" | "studio_video" | "studio_music" | "studio_talkinghead" | "studio_tts" | "studio_doublage" | "studio_chat" | "battle_ground" | "reverse_prompt";

// deno-lint-ignore no-explicit-any
export async function recordAiUsage(userClient: any, params: { userId: string; mediaType: MediaType; model: string; cost: number | undefined; source: UsageSource }): Promise<void> {
  if (!params.cost || params.cost <= 0) return;
  const { error } = await userClient.from("ai_usage_events").insert({
    user_id: params.userId,
    media_type: params.mediaType,
    provider: deriveProvider(params.model),
    model: params.model,
    cost_usd: params.cost,
    source: params.source,
  });
  if (error) console.error("ai_usage_events insert failed:", error.message);
}
