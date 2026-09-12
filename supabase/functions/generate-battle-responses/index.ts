// "Battle Ground" — un même prompt envoyé à 2-3 vrais fournisseurs IA en
// parallèle (Gemini, GPT-4o, Claude), affichés côte à côte côté client.
// Chaque appel est isolé (Promise.allSettled) : l'échec d'un fournisseur
// (clé manquante, quota, timeout) n'empêche pas d'afficher les autres.
//
// IMPORTANT : la liste BATTLE_MODELS ci-dessous doit rester synchronisée
// avec ALLOWED_BATTLE_MODELS dans src/app/lib/battleGround.ts (même
// convention que _shared/studio-models.ts pour le Studio).
import { createClient } from "npm:@supabase/supabase-js@2.48.1";
import { CORS_HEADERS, jsonResponse } from "../_shared/podcast-utils.ts";

type Provider = "gemini" | "openai" | "anthropic";

interface BattleModel { id: Provider; model: string }

const BATTLE_MODELS: Record<Provider, BattleModel> = {
  gemini: { id: "gemini", model: "gemini-3.6-flash" },
  openai: { id: "openai", model: "gpt-4o" },
  anthropic: { id: "anthropic", model: "claude-sonnet-5" },
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

async function callOpenAi(prompt: string, apiKey: string | undefined, model: string): Promise<{ text: string | null; error: string | null }> {
  if (!apiKey) return { text: null, error: "OPENAI_API_KEY non configurée côté serveur." };
  const resp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model, messages: [{ role: "user", content: prompt }] }),
  });
  if (!resp.ok) return { text: null, error: `OpenAI a échoué (${resp.status}) : ${(await resp.text()).slice(0, 300)}` };
  const json = await resp.json();
  const text = json?.choices?.[0]?.message?.content;
  return text ? { text, error: null } : { text: null, error: "OpenAI n'a renvoyé aucun texte." };
}

async function callAnthropic(prompt: string, apiKey: string | undefined, model: string): Promise<{ text: string | null; error: string | null }> {
  if (!apiKey) return { text: null, error: "ANTHROPIC_API_KEY non configurée côté serveur." };
  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
    body: JSON.stringify({ model, max_tokens: 1024, messages: [{ role: "user", content: prompt }] }),
  });
  if (!resp.ok) return { text: null, error: `Claude a échoué (${resp.status}) : ${(await resp.text()).slice(0, 300)}` };
  const json = await resp.json();
  const text = json?.content?.[0]?.text;
  return text ? { text, error: null } : { text: null, error: "Claude n'a renvoyé aucun texte." };
}

async function callProvider(provider: Provider, prompt: string, keys: Record<string, string | undefined>): Promise<BattleResponse> {
  const { model } = BATTLE_MODELS[provider];
  const started = Date.now();
  try {
    const result = provider === "gemini"
      ? await callGemini(prompt, keys.GEMINI_API_KEY, model)
      : provider === "openai"
      ? await callOpenAi(prompt, keys.OPENAI_API_KEY, model)
      : await callAnthropic(prompt, keys.ANTHROPIC_API_KEY, model);
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
      OPENAI_API_KEY: Deno.env.get("OPENAI_API_KEY"),
      ANTHROPIC_API_KEY: Deno.env.get("ANTHROPIC_API_KEY"),
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
