import {
  credentials, normalizePhone, NOTICE_VERSION, ORIGINS, PHONE, PublicError,
  tokenHash, validateContact, type Analysis, type Contact, type Lead, type Project,
} from "./domain.ts";

export interface AdvisorStore {
  find(requestId: string): Promise<Lead | null>;
  create(contact: Contact, requestId: string, hash: string): Promise<Lead>;
  quota(key: string, limit: number, seconds: number): Promise<boolean>;
  claim(requestId: string, hash: string): Promise<Lead | null>;
  finish(lead: Lead, analysis: Analysis | null): Promise<void>;
  callback(lead: Lead, phone: string, at: string): Promise<void>;
}

type Dependencies = {
  store: AdvisorStore;
  generate(project: Project): Promise<Analysis>;
  hashIdentity(value: string): Promise<string>;
  origins?: string[];
  now?: () => number;
};

async function readBody(req: Request): Promise<Record<string, unknown>> {
  if (!req.headers.get("content-type")?.startsWith("application/json")) {
    throw new PublicError(415, "FORMAT", "Format de requête invalide.");
  }
  const reader = req.body?.getReader();
  if (!reader) throw new PublicError(400, "FORMAT", "Formulaire vide.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 16384) {
      await reader.cancel();
      throw new PublicError(413, "SIZE", "Le formulaire est trop volumineux.");
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  try {
    const body = JSON.parse(new TextDecoder().decode(bytes));
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error();
    return body;
  } catch { throw new PublicError(400, "FORMAT", "Formulaire invalide."); }
}

export function createAdvisorHandler(deps: Dependencies) {
  const origins = new Set(deps.origins ?? ORIGINS);
  const now = deps.now ?? Date.now;
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
      // CORS is not authentication: token checks and DB quotas apply as well.
      if (!origins.has(origin)) throw new PublicError(403, "ORIGIN", "Origine non autorisée.");
      if (req.method === "OPTIONS") return new Response(null, { status: 204, headers });
      if (req.method !== "POST") return json({ error: "Méthode non autorisée." }, 405);
      const body = await readBody(req);
      if (!["submit", "analyze", "callback"].includes(String(body.action))) {
        throw new PublicError(400, "ACTION", "Action inconnue.");
      }
      const { requestId, accessToken } = credentials(body);
      const hash = await tokenHash(accessToken);
      const existing = await store.find(requestId);
      const authorize = (lead: Lead | null): Lead => {
        if (!lead || lead.access_token_hash !== hash || now() - Date.parse(lead.created_at) > 86400000) {
          throw new PublicError(403, "SESSION", "Cette session a expiré. Veuillez remplir un nouveau formulaire.");
        }
        return lead;
      };

      if (body.action === "submit") {
        const contact = validateContact(body);
        if (existing) {
          authorize(existing);
          // A retry is the same submission; a changed form must use a new ID.
          if (Object.entries(contact).some(([key, value]) => existing[key as keyof Contact] !== value)) {
            throw new PublicError(409, "CHANGED", "Le formulaire a changé. Veuillez recommencer l'envoi.");
          }
          return json({ saved: true, phone: PHONE, noticeVersion: NOTICE_VERSION });
        }
        const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
        // Global caps remain effective even if a caller spoofs forwarded IP headers.
        const ipKey = await deps.hashIdentity("ip:" + ip);
        const emailKey = await deps.hashIdentity("email:" + contact.email);
        if (!await store.quota("submissions:global", 500, 86400)
          || !await store.quota("ip:" + ipKey, 10, 3600)
          || !await store.quota("email:" + emailKey, 3, 3600)) {
          throw new PublicError(429, "LIMIT", "Trop de demandes. Réessayez plus tard ou appelez-nous au 09 80 87 40 46.");
        }
        // The INSERT commits before the browser can request an analysis.
        authorize(await store.create(contact, requestId, hash));
        return json({ saved: true, phone: PHONE, noticeVersion: NOTICE_VERSION });
      }

      const lead = authorize(existing);
      if (body.action === "callback") {
        const phone = normalizePhone(body.phone);
        if (lead.status !== "callback_requested" || lead.phone !== phone) {
          await store.callback(lead, phone, lead.callback_requested_at ?? new Date(now()).toISOString());
        }
        return json({ confirmed: true, message: "C'est noté ! Un conseiller vous rappellera sous 24h." });
      }

      if (lead.analysis_status === "ready" && lead.analysis) return json({ analysis: lead.analysis });
      const claimed = await store.claim(requestId, hash);
      if (!claimed) {
        const current = authorize(await store.find(requestId));
        if (current.analysis_status === "ready" && current.analysis) return json({ analysis: current.analysis });
        if (current.analysis_status === "processing") return json({ pending: true }, 202);
        throw new PublicError(429, "ATTEMPTS", "L'analyse n'est pas disponible. Vous pouvez demander à être rappelé.");
      }
      try {
        if (!await store.quota("analyses:global", 150, 86400)) {
          throw new PublicError(429, "LIMIT", "L'analyse est momentanément indisponible. Votre demande est enregistrée, vous pouvez demander un rappel.");
        }
        // Contact fields, phone, token and IP are deliberately excluded from AI input.
        const analysis = await deps.generate({ profile: claimed.profile, sector: claimed.sector, need: claimed.need });
        await store.finish(claimed, analysis);
        return json({ analysis });
      } catch (error) {
        await store.finish(claimed, null);
        if (error instanceof PublicError) throw error;
        throw new PublicError(503, "ANALYSIS", "Votre demande est enregistrée, mais l'analyse a été interrompue. Réessayez ou demandez un rappel.");
      }
    } catch (error) {
      if (error instanceof PublicError) return json({ error: error.message, code: error.code }, error.status);
      // Do not echo database/provider errors or contact data to the public client/logs.
      console.error("project-advisor: request failed");
      return json({ error: "Le service est momentanément indisponible. Réessayez ou appelez-nous au 09 80 87 40 46.", code: "SERVICE" }, 503);
    }
  };
}
