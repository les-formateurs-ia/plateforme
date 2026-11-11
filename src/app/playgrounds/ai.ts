import { supabase } from "@/app/lib/supabase/client";

// Appel à l'IA de la plateforme pour les Playgrounds natifs : même fonction
// `ai-proxy` que les Playgrounds HTML (clé Gemini côté serveur, utilisateur
// authentifié requis). Hors budget IA personnel de l'élève.
export async function askPlatformAi(prompt: string, opts: { system?: string; temperature?: number; maxOutputTokens?: number } = {}): Promise<string> {
  const { data, error } = await supabase.functions.invoke("ai-proxy", {
    body: {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      ...(opts.system ? { systemInstruction: { parts: [{ text: opts.system }] } } : {}),
      generationConfig: { temperature: opts.temperature ?? 0.7, maxOutputTokens: opts.maxOutputTokens ?? 800 },
    },
  });
  if (error) throw new Error("L'outil n'a pas répondu. Réessayez dans un instant.");
  const parts: { text?: string; thought?: boolean }[] = data?.candidates?.[0]?.content?.parts ?? [];
  const text = parts.filter((p) => !p.thought && p.text).map((p) => p.text).join("").trim();
  if (!text) throw new Error("Réponse vide. Réessayez.");
  return text;
}
