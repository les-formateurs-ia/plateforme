import { createClient } from "npm:@supabase/supabase-js@2.48.1";
import { CORS_HEADERS } from "./podcast-utils.ts";
// Budget IA Runware par élève : bloqué dès que spent_usd >= ai_budget_usd
// (plafond personnel, 50 $ par défaut, rechargé par l'admin via
// admin_add_ai_credits — cf. migration 20260923160000_ai_budget_topups.sql).
// Point d'entrée partagé par tous les edge functions qui déclenchent un appel
// Runware (image/vidéo/texte) : le check avant l'appel, la capture du coût après.
export const AI_BUDGET_CAP_USD = 50;

// Les identifiants de modèle Runware suivent la convention "provider:id@version"
// (ex. "openai:gpt-image@2", "runware:101@1", "bfl:5@1") — cf.
// _shared/studio-models.ts / studio-video-models.ts.
export function deriveProvider(model: string): string {
  return model.split(":")[0] || model;
}

// deno-lint-ignore no-explicit-any
export async function checkAiBudget(userClient: any, userId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  // select("*") : reste valable même si la colonne is_visitor n'existe pas encore.
  const { data, error } = await userClient.from("profiles").select("*").eq("id", userId).single();
  if (error || !data) return { ok: false, error: "Impossible de vérifier le budget IA." };
  if (Number(data.spent_usd ?? 0) >= Number(data.ai_budget_usd ?? AI_BUDGET_CAP_USD)) {
    return {
      ok: false,
      error: data.is_visitor
        ? "Mode visiteur : vos crédits d'essai sont utilisés. Inscrivez-vous à la formation pour profiter du Studio sans limite."
        : "Vous avez atteint votre limite de crédits.",
    };
  }
  return { ok: true };
}

// Mode Visiteur : avant une génération, on estime son coût par la moyenne
// des dernières générations du même modèle (ai_usage_events, tous comptes) ;
// si le reste du budget d'essai ne la couvre pas, on refuse d'avance en
// invitant à un essai plus léger plutôt que de consommer les crédits sur une
// génération coûteuse. Sans historique pour un modèle, on laisse passer
// (checkAiBudget reste le garde-fou). null = autorisé.
export const VISITOR_TOO_HEAVY_MESSAGE =
  "En version d'essai, vous pouvez seulement générer quelque chose de léger. Faites une demande plus simple pour tester : un modèle plus léger, une durée plus courte ou un texte plus court.";
const COST_SAMPLE = 20;

// deno-lint-ignore no-explicit-any
export async function checkVisitorCost(userClient: any, userId: string, models: string[]): Promise<Response | null> {
  const { data: profile } = await userClient.from("profiles").select("*").eq("id", userId).single();
  if (!profile?.is_visitor) return null;
  const remaining = Number(profile.ai_budget_usd ?? 0) - Number(profile.spent_usd ?? 0);
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  let estimate = 0;
  for (const model of models) {
    const { data: rows } = await admin.from("ai_usage_events").select("cost_usd")
      .eq("model", model).order("created_at", { ascending: false }).limit(COST_SAMPLE);
    if (rows?.length) estimate += rows.reduce((sum: number, r: { cost_usd: number }) => sum + Number(r.cost_usd), 0) / rows.length;
  }
  if (estimate <= remaining) return null;
  return new Response(JSON.stringify({ error: VISITOR_TOO_HEAVY_MESSAGE, code: "visitor_too_heavy" }), {
    status: 402,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
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
