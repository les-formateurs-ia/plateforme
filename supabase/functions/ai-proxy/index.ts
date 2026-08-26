// Proxy Gemini générique pour le HTML personnalisé collé par un admin dans
// l'onglet "HTML" d'une leçon (voir LessonPage.tsx / injectPlatformAuth).
// Ce HTML tourne dans une iframe sandboxée sans allow-same-origin : il ne peut
// donc détenir aucune clé et n'a accès qu'au jeton de session déjà injecté par
// la page parente (window.__PLATFORM_AUTH__). Cette fonction garde la clé
// Gemini côté serveur — un seul appel Google, un seul quota, jamais exposé au
// navigateur — et se contente de vérifier que l'appelant est bien un
// utilisateur authentifié de la plateforme avant de relayer sa requête à
// Gemini telle quelle (contents/systemInstruction/generationConfig passés
// tels quels : le HTML personnalisé garde le contrôle total du prompt).
import { createClient } from "npm:@supabase/supabase-js@2.48.1";
import { CORS_HEADERS, jsonResponse } from "../_shared/podcast-utils.ts";

const ALLOWED_MODELS = new Set(["gemini-3.6-flash", "gemini-3-flash-preview"]);
const DEFAULT_MODEL = "gemini-3.6-flash";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });

  try {
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiApiKey) return jsonResponse({ error: "GEMINI_API_KEY non configurée côté serveur." }, 500);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return jsonResponse({ error: "Non authentifié." }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) return jsonResponse({ error: "Session invalide." }, 401);

    const body = await req.json();
    if (!body?.contents) return jsonResponse({ error: "contents manquant." }, 400);

    const model = typeof body.model === "string" && ALLOWED_MODELS.has(body.model) ? body.model : DEFAULT_MODEL;

    const geminiResp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: { "x-goog-api-key": geminiApiKey, "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: body.contents,
          ...(body.systemInstruction ? { systemInstruction: body.systemInstruction } : {}),
          ...(body.generationConfig ? { generationConfig: body.generationConfig } : {}),
        }),
      },
    );
    if (!geminiResp.ok) return jsonResponse({ error: `Gemini a échoué : ${await geminiResp.text()}` }, 502);

    const geminiJson = await geminiResp.json();
    return jsonResponse(geminiJson);
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : "Erreur inconnue." }, 500);
  }
});
