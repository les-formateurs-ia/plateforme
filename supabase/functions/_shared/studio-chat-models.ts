// Catalogue des modules "Discutez avec ChatGPT / Gemini / Claude" (Le Studio).
// Mêmes clés que Battle Ground : Gemini en direct (GEMINI_API_KEY, hors budget
// IA élève), GPT et Claude via Runware textInference (RUNWARE_API_KEY, compté
// dans le budget). Identifiants Runware relevés le 2026-09-23 dans les liens
// "Try in Playground" (modelAIR) de runware.ai/docs/models/* ; seuls
// openai:gpt@5.4-pro et anthropic:claude@opus-5 ont été testés de bout en
// bout (cf. generate-battle-responses). Gemini : ai.google.dev/gemini-api/docs/models.
//
// IMPORTANT : à garder synchronisé avec src/app/lib/studioChat.ts.
export type ChatProvider = "openai" | "gemini" | "anthropic";

export const STUDIO_CHAT_MODELS: Record<ChatProvider, { default: string; models: string[] }> = {
  openai: {
    default: "openai:gpt@5.5",
    models: ["openai:gpt@5.5", "openai:gpt@5.4", "openai:gpt@5.4-pro", "openai:gpt@5.4-mini"],
  },
  gemini: {
    default: "gemini-3.8-flash",
    models: ["gemini-3.8-flash", "gemini-3.6-flash", "gemini-3.1-pro-preview", "gemini-3.5-flash-lite"],
  },
  anthropic: {
    default: "anthropic:claude@opus-5",
    models: ["anthropic:claude@fable-5", "anthropic:claude@opus-5", "anthropic:claude@sonnet-4.6", "anthropic:claude@haiku-4.5"],
  },
};

export function isChatProvider(value: unknown): value is ChatProvider {
  return value === "openai" || value === "gemini" || value === "anthropic";
}
