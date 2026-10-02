import { createClient } from "npm:@supabase/supabase-js@2.116.0";
import { createContactHandler, type ContactStore } from "./handler.ts";
import { ORIGINS } from "./domain.ts";

const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const db = createClient(Deno.env.get("SUPABASE_URL")!, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const store: ContactStore = {
  async create(lead) {
    // Same table as the advisor: every request is read in "Demandes IA".
    const { error } = await db.from("project_advisor_leads").insert(lead);
    if (error?.code === "23505") return false; // Same request ID: a retry of a saved form.
    if (error) throw error;
    return true;
  },
  async quota(key, limit, seconds) {
    // Generic atomic counter, created with the advisor (HMAC keys, purged after two days).
    const { data, error } = await db.rpc("project_advisor_take_quota", { p_key: key, p_limit: limit, p_seconds: seconds });
    if (error) throw error;
    return data === true;
  },
};

const identityKey = await crypto.subtle.importKey("raw", new TextEncoder().encode(serviceKey),
  { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);

Deno.serve(createContactHandler({
  store,
  // Same allowed origins as the advisor; local origins only on a local function.
  origins: Deno.env.get("PROJECT_ADVISOR_ORIGINS")?.split(",").map(s => s.trim()) ?? ORIGINS,
  async hashIdentity(value) {
    const result = await crypto.subtle.sign("HMAC", identityKey, new TextEncoder().encode(value));
    return Array.from(new Uint8Array(result), b => b.toString(16).padStart(2, "0")).join("");
  },
}));
