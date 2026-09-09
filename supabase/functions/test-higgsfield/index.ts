// Script de test ponctuel — PAS destiné au déploiement/à la feature finale.
// Sert uniquement à vérifier que HIGGSFIELD_API_ID / HIGGSFIELD_API_SECRET
// fonctionnent et à inspecter la forme réelle de la réponse Soul v2, avant
// de concevoir le vrai proxy + schéma DB du module "Créer vos images".
// À supprimer une fois le test effectué.
import { CORS_HEADERS, jsonResponse } from "../_shared/podcast-utils.ts";

const BASE_URL = "https://api.higgsfield.ai";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });

  const keyId = Deno.env.get("HIGGSFIELD_API_ID");
  const keySecret = Deno.env.get("HIGGSFIELD_API_SECRET");
  if (!keyId || !keySecret) return jsonResponse({ error: "HIGGSFIELD_API_ID / HIGGSFIELD_API_SECRET non configurées." }, 500);

  const authHeader = `Key ${keyId}:${keySecret}`;

  try {
    const submitResp = await fetch(`${BASE_URL}/higgsfield-ai/soul/v2/standard`, {
      method: "POST",
      headers: { Authorization: authHeader, "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: "A quiet alpine lake at sunrise, editorial photography" }),
    });
    const submitText = await submitResp.text();
    if (!submitResp.ok) return jsonResponse({ step: "submit", status: submitResp.status, body: submitText }, 502);

    const submitJson = JSON.parse(submitText);
    const requestId = submitJson.request_id;
    const statusUrl = submitJson.status_url ?? `${BASE_URL}/requests/${requestId}/status`;

    // Poll jusqu'à 60s (Soul v2 = image, censé être rapide) — au-delà on
    // renvoie l'état "en cours" tel quel plutôt que de bloquer indéfiniment.
    const deadline = Date.now() + 60_000;
    let last = submitJson;
    while (Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 2500));
      const pollResp = await fetch(statusUrl, { headers: { Authorization: authHeader } });
      const pollText = await pollResp.text();
      if (!pollResp.ok) return jsonResponse({ step: "poll", status: pollResp.status, body: pollText, submit: submitJson }, 502);
      last = JSON.parse(pollText);
      if (last.status === "completed" || last.status === "failed") {
        return jsonResponse({ step: "done", submit: submitJson, final: last });
      }
    }
    return jsonResponse({ step: "timeout", submit: submitJson, last });
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : "Erreur inconnue." }, 500);
  }
});
