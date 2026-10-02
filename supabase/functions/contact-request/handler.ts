import { readBody } from "../project-advisor/handler.ts";
import { ORIGINS, PublicError, validateRequest, type ContactLead } from "./domain.ts";

export interface ContactStore {
  /** Saves the request; resolves `false` when this request ID was already saved. */
  create(lead: ContactLead): Promise<boolean>;
  quota(key: string, limit: number, seconds: number): Promise<boolean>;
}

type Dependencies = {
  store: ContactStore;
  hashIdentity(value: string): Promise<string>;
  origins?: string[];
};

const UNAVAILABLE = "Le service est momentanément indisponible. Réessayez ou appelez-nous au 09 80 87 40 46.";

export function createContactHandler(deps: Dependencies) {
  const origins = new Set(deps.origins ?? ORIGINS);
  const { store } = deps;

  return async (req: Request): Promise<Response> => {
    const origin = req.headers.get("origin") ?? "";
    const headers: Record<string, string> = {
      "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store",
      "Vary": "Origin", "X-Content-Type-Options": "nosniff",
      ...(origins.has(origin) ? {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "content-type",
      } : {}),
    };
    const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers });
    try {
      // CORS is not authentication: the honeypot and DB quotas apply as well.
      if (!origins.has(origin)) throw new PublicError(403, "ORIGIN", "Origine non autorisée.");
      if (req.method === "OPTIONS") return new Response(null, { status: 204, headers });
      if (req.method !== "POST") return json({ error: "Méthode non autorisée." }, 405);
      const lead = validateRequest(await readBody(req));
      const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
      // Global cap stays effective even if a caller spoofs forwarded IP headers.
      const ipKey = await deps.hashIdentity("ip:" + ip);
      const emailKey = await deps.hashIdentity("email:" + lead.email);
      if (!await store.quota("contact:global", 500, 86400)
        || !await store.quota("contact:ip:" + ipKey, 10, 3600)
        || !await store.quota("contact:email:" + emailKey, 5, 3600)) {
        throw new PublicError(429, "LIMIT", "Trop de demandes. Réessayez plus tard ou appelez-nous au 09 80 87 40 46.");
      }
      await store.create(lead);
      return json({ saved: true });
    } catch (error) {
      if (error instanceof PublicError) return json({ error: error.message, code: error.code }, error.status);
      // Do not echo database errors or contact data to the public client/logs.
      console.error("contact-request: request failed");
      return json({ error: UNAVAILABLE, code: "SERVICE" }, 503);
    }
  };
}
