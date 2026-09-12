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
// (modelSearch category="text") : `openai:gpt@5.4-pro` et
// `anthropic:claude@opus-5` confirmés fonctionnels de bout en bout.
//
// IMPORTANT : la liste BATTLE_MODELS ci-dessous doit rester synchronisée
// avec ALLOWED_BATTLE_MODELS dans src/app/lib/battleGround.ts (même
// convention que _shared/studio-models.ts pour le Studio).
import { createClient } from "npm:@supabase/supabase-js@2.48.1";
import { CORS_HEADERS, jsonResponse } from "../_shared/podcast-utils.ts";
import { submitAndAwaitRunwareText } from "../_shared/runware.ts";

type Provider = "gemini" | "openai" | "anthropic";

interface BattleModel { id: Provider; model: string }

const BATTLE_MODELS: Record<Provider, BattleModel> = {
  gemini: { id: "gemini", model: "gemini-3.6-flash" },
  openai: { id: "openai", model: "openai:gpt@5.4-pro" },
  anthropic: { id: "anthropic", model: "anthropic:claude@opus-5" },
};

interface BattleResponse {
  provider: Provider;
  model: string;
  text: string | null;
  error: string | null;
  latencyMs: number;
}

async function callGemini(prompt: string, apiKey: string | undefined, model: string): Promise<{ text: string | null; error: string | null }> {
  if (!apiKey) return { text: null, error: "GEMINI_API_KEY non configurée côté serveur." };
  const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: "POST",
    headers: { "x-goog-api-key": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
  });
  if (!resp.ok) return { text: null, error: `Gemini a échoué (${resp.status}) : ${(await resp.text()).slice(0, 300)}` };
  const json = await resp.json();
  const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
  return text ? { text, error: null } : { text: null, error: "Gemini n'a renvoyé aucun texte." };
}

async function callRunwareText(prompt: string, apiKey: string | undefined, model: string): Promise<{ text: string | null; error: string | null }> {
  if (!apiKey) return { text: null, error: "RUNWARE_API_KEY non configurée côté serveur." };
  try {
    const text = await submitAndAwaitRunwareText(apiKey, {
      taskType: "textInference",
      model,
      messages: [{ role: "user", content: prompt }],
      settings: { maxTokens: 1024 },
    }, { timeoutMs: 75000 });
    return { text, error: null };
  } catch (err) {
    return { text: null, error: err instanceof Error ? err.message : "Erreur Runware inconnue." };
  }
}

async function callProvider(provider: Provider, prompt: string, keys: Record<string, string | undefined>): Promise<BattleResponse> {
  const { model } = BATTLE_MODELS[provider];
  const started = Date.now();
  try {
    const result = provider === "gemini"
      ? await callGemini(prompt, keys.GEMINI_API_KEY, model)
      : await callRunwareText(prompt, keys.RUNWARE_API_KEY, model);
    return { provider, model, text: result.text, error: result.error, latencyMs: Date.now() - started };
  } catch (err) {
    return { provider, model, text: null, error: err instanceof Error ? err.message : "Erreur inconnue.", latencyMs: Date.now() - started };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });

  try {
    const { prompt, models } = await req.json();
    if (typeof prompt !== "string" || !prompt.trim()) return jsonResponse({ error: "prompt manquant." }, 400);
    if (prompt.length > 2000) return jsonResponse({ error: "Ce prompt est trop long (2000 caractères max)." }, 400);
    if (!Array.isArray(models) || models.length < 2 || models.length > 3) return jsonResponse({ error: "Choisis 2 à 3 modèles à comparer." }, 400);
    const selected = models as Provider[];
    if (!selected.every((m) => m in BATTLE_MODELS)) return jsonResponse({ error: "Modèle inconnu." }, 400);
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

    const keys = {
      GEMINI_API_KEY: Deno.env.get("GEMINI_API_KEY"),
      RUNWARE_API_KEY: Deno.env.get("RUNWARE_API_KEY"),
    };

    const responses = await Promise.all(selected.map((provider) => callProvider(provider, prompt.trim(), keys)));

    const { data: inserted, error: insertErr } = await supabase
      .from("battle_ground_attempts")
      .insert({ user_id: userData.user.id, prompt_text: prompt.trim(), responses })
      .select()
      .single();
    if (insertErr) return jsonResponse({ error: `Échec de l'enregistrement : ${insertErr.message}` }, 500);

    return jsonResponse({ attempt: inserted });
  } catch (err) {
    console.error("generate-battle-responses:", err);
    return jsonResponse({ error: "Erreur inattendue." }, 500);
  }
});
