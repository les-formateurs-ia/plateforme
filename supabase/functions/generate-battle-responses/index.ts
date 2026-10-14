// "Battle Ground" — un même prompt envoyé à 2-3 vrais fournisseurs IA en
// parallèle (Gemini, GPT, Claude), affichés côte à côte côté client.
// Chaque appel est isolé (Promise.allSettled) : l'échec d'un fournisseur
// (clé manquante, quota, timeout) n'empêche pas d'afficher les autres.
//
// Gemini reste appelé directement (GEMINI_API_KEY, déjà utilisé partout
// dans ce projet). GPT et Claude sont routés via Runware (textInference,
// deliveryMethod "async") plutôt que d'exiger des clés OpenAI/Anthropic
// séparées — le compte Runware déjà crédité pour Le Studio couvre aussi
// ces modèles tiers en texte. Catalogue vérifié en direct le 2026-09-12
// (modelSearch category="text"). GPT : `openai:gpt@5.5` (le défaut du chat
// du Studio) plutôt que `gpt@5.4-pro` — ce dernier raisonne longuement et
// dépassait régulièrement le délai ("La génération de texte Runware prend
// plus de temps que prévu").
//
// Deux usages :
//   - persist: false (client actuel) → 1 seul modèle par appel, réponse
//     renvoyée sans enregistrement : le client lance un appel par modèle en
//     parallèle pour afficher chaque réponse dès qu'elle arrive, puis
//     enregistre lui-même le combat (RLS : l'élève écrit ses propres lignes).
//   - sinon (anciens clients) → 2 à 3 modèles, enregistrés ici.
//
// Les trois combattants s'affrontent toujours dans la même gamme (BATTLE_TIERS) :
// comparer Gemini Flash à Claude Opus n'aurait pas de sens, ni en qualité ni
// en vitesse. Identifiants repris du catalogue du chat du Studio
// (_shared/studio-chat-models.ts).
//
// IMPORTANT : BATTLE_TIERS doit rester synchronisée avec BATTLE_TIERS dans
// src/app/lib/battleGround.ts.
import { createClient } from "npm:@supabase/supabase-js@2.48.1";
import { CORS_HEADERS, jsonResponse } from "../_shared/podcast-utils.ts";
import { submitAndAwaitRunwareText } from "../_shared/runware.ts";
import { checkAiBudget, recordAiUsage } from "../_shared/ai-budget.ts";

type Provider = "gemini" | "openai" | "anthropic";

type Tier = "rapide" | "polyvalent" | "expert";

const BATTLE_TIERS: Record<Tier, Record<Provider, string>> = {
  rapide: { gemini: "gemini-3.5-flash-lite", openai: "openai:gpt@5.4-mini", anthropic: "anthropic:claude@haiku-4.5" },
  polyvalent: { gemini: "gemini-3.8-flash", openai: "openai:gpt@5.4", anthropic: "anthropic:claude@sonnet-4.6" },
  expert: { gemini: "gemini-3.1-pro-preview", openai: "openai:gpt@5.5", anthropic: "anthropic:claude@opus-5" },
};

// Anciens clients (sans `tier`) : l'ancien trio, inchangé.
const LEGACY_MODELS: Record<Provider, string> = {
  gemini: "gemini-3.6-flash", openai: "openai:gpt@5.5", anthropic: "anthropic:claude@opus-5",
};

interface BattleResponse {
  provider: Provider;
  model: string;
  text: string | null;
  error: string | null;
  latencyMs: number;
  cost?: number;
}

async function callGemini(prompt: string, apiKey: string | undefined, model: string): Promise<{ text: string | null; error: string | null; cost?: number }> {
  if (!apiKey) return { text: null, error: "GEMINI_API_KEY non configurée côté serveur." };
  const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: "POST",
    headers: { "x-goog-api-key": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
  });
  if (!resp.ok) return { text: null, error: `Gemini a échoué (${resp.status}) : ${(await resp.text()).slice(0, 300)}` };
  const json = await resp.json();
  // Les modèles Pro peuvent renvoyer plusieurs parts (dont des résumés de
  // raisonnement marqués `thought`) : on ne garde que le texte de la réponse.
  const parts = (json?.candidates?.[0]?.content?.parts ?? []) as { text?: string; thought?: boolean }[];
  const text = parts.filter((p) => p.text && !p.thought).map((p) => p.text).join("");
  return text ? { text, error: null } : { text: null, error: "Gemini n'a renvoyé aucun texte." };
}

// Routé via Runware (pas d'appel direct OpenAI/Anthropic) — seul ce chemin
// compte dans le budget IA de l'élève (cf. _shared/ai-budget.ts), Gemini ci-
// dessus reste hors Runware et ne coûte donc rien sur ce budget.
async function callRunwareText(prompt: string, apiKey: string | undefined, model: string): Promise<{ text: string | null; error: string | null; cost?: number }> {
  if (!apiKey) return { text: null, error: "RUNWARE_API_KEY non configurée côté serveur." };
  try {
    const result = await submitAndAwaitRunwareText(apiKey, {
      taskType: "textInference",
      model,
      messages: [{ role: "user", content: prompt }],
      // Les modèles récents raisonnent avant de répondre et ce raisonnement
      // consomme aussi des tokens : 1024 laissait parfois une réponse vide.
      settings: { maxTokens: 4096 },
    }, { timeoutMs: 120000 });
    return { text: result.text, error: null, cost: result.cost };
  } catch (err) {
    return { text: null, error: err instanceof Error ? err.message : "Erreur Runware inconnue." };
  }
}

async function callProvider(provider: Provider, model: string, prompt: string, keys: Record<string, string | undefined>): Promise<BattleResponse> {
  const started = Date.now();
  try {
    const result = provider === "gemini"
      ? await callGemini(prompt, keys.GEMINI_API_KEY, model)
      : await callRunwareText(prompt, keys.RUNWARE_API_KEY, model);
    return { provider, model, text: result.text, error: result.error, latencyMs: Date.now() - started, cost: result.cost };
  } catch (err) {
    return { provider, model, text: null, error: err instanceof Error ? err.message : "Erreur inconnue.", latencyMs: Date.now() - started };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });

  try {
    const { prompt, models, persist: persistParam, tier } = await req.json();
    const persist = persistParam !== false;
    if (typeof prompt !== "string" || !prompt.trim()) return jsonResponse({ error: "prompt manquant." }, 400);
    if (prompt.length > 2000) return jsonResponse({ error: "Ce prompt est trop long (2000 caractères max)." }, 400);
    if (!Array.isArray(models) || models.length < (persist ? 2 : 1) || models.length > 3) return jsonResponse({ error: "Choisis 2 à 3 modèles à comparer." }, 400);
    const selected = models as Provider[];
    if (tier !== undefined && !(tier in BATTLE_TIERS)) return jsonResponse({ error: "Type de demande inconnu." }, 400);
    const modelIds = tier ? BATTLE_TIERS[tier as Tier] : LEGACY_MODELS;
    if (!selected.every((m) => m in modelIds)) return jsonResponse({ error: "Modèle inconnu." }, 400);
    if (new Set(selected).size !== selected.length) return jsonResponse({ error: "Modèles en double." }, 400);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return jsonResponse({ error: "Non authentifié." }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) return jsonResponse({ error: "Session invalide." }, 401);
    const userId = userData.user.id;

    if (selected.some((p) => p !== "gemini")) {
      const budget = await checkAiBudget(supabase, userId);
      if (!budget.ok) return jsonResponse({ error: budget.error }, 402);
    }

    const keys = {
      GEMINI_API_KEY: Deno.env.get("GEMINI_API_KEY"),
      RUNWARE_API_KEY: Deno.env.get("RUNWARE_API_KEY"),
    };

    const responses = await Promise.all(selected.map((provider) => callProvider(provider, modelIds[provider], prompt.trim(), keys)));

    await Promise.all(responses.filter((r) => r.provider !== "gemini" && r.text).map((r) =>
      recordAiUsage(supabase, { userId, mediaType: "text", model: r.model, cost: r.cost, source: "battle_ground" }),
    ));

    if (!persist) return jsonResponse({ responses });

    const { data: inserted, error: insertErr } = await supabase
      .from("battle_ground_attempts")
      .insert({ user_id: userId, prompt_text: prompt.trim(), responses })
      .select()
      .single();
    if (insertErr) return jsonResponse({ error: `Échec de l'enregistrement : ${insertErr.message}` }, 500);

    return jsonResponse({ attempt: inserted });
  } catch (err) {
    console.error("generate-battle-responses:", err);
    return jsonResponse({ error: "Erreur inattendue." }, 500);
  }
});
