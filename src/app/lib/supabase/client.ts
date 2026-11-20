import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { VISITOR_TRIAL_CODE, VISITOR_TRIAL_EVENT } from "@/app/lib/visitorTrialEvent";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error("Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY — copy .env.example to .env and fill in your project's values.");
}

// supabase-js@2.116.0 coordinates session refreshes internally without
// needing the "lock" option at all (deprecated, removed in v3 — see
// https://github.com/supabase/supabase-js/blob/master/packages/core/auth-js/migrations/lockless-coordination.md).
// A previous workaround here forced a no-op lock to avoid a stuck Web Locks
// mutex on older versions; with this version that override instead let
// concurrent refresh calls race each other and reuse an already-spent
// (single-use) refresh token, causing real `400` refresh failures and
// downstream `401`s on API calls. Just use the client's default behavior.
//
// fetch enrobé : un essai IA déjà utilisé en mode Visiteur (403 avec
// VISITOR_TRIAL_CODE, cf. _shared/visitor-trial.ts) est signalé à toute
// l'app, qui présente l'outil (VisitorTrialDialog).
const visitorAwareFetch: typeof fetch = async (input, init) => {
  const res = await fetch(input, init);
  if (res.status === 403 && String(input instanceof Request ? input.url : input).includes("/functions/v1/")) {
    res.clone().json().then((body) => {
      if (body?.code === VISITOR_TRIAL_CODE) window.dispatchEvent(new CustomEvent(VISITOR_TRIAL_EVENT, { detail: { tool: body.tool } }));
    }).catch(() => {});
  }
  return res;
};

export const supabase = createClient<Database>(url, anonKey, { global: { fetch: visitorAwareFetch } });
