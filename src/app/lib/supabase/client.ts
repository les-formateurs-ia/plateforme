import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error("Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY — copy .env.example to .env and fill in your project's values.");
}

// supabase-js serializes auth calls across tabs with the browser's Web Locks API
// by default. A request that never settles (flaky network, a stuck refresh…)
// can leave that per-origin lock held, and every future getSession()/auth call
// in that browser profile then hangs forever — only a profile with no stored
// lock state (e.g. an incognito window) works again. We don't need cross-tab
// session serialization here, so we skip the lock entirely.
async function noopLock(_name: string, _acquireTimeout: number, fn: () => Promise<any>): Promise<any> {
  return fn();
}

export const supabase = createClient<Database>(url, anonKey, {
  auth: { lock: noopLock },
});
