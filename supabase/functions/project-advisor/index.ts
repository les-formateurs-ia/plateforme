import { createClient } from "npm:@supabase/supabase-js@2.116.0";
import { createAdvisorHandler, type AdvisorStore } from "./handler.ts";
import { ANALYSIS_SCHEMA, ORIGINS, systemPrompt, validateAnalysis, type Lead } from "./domain.ts";

const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const db = createClient(Deno.env.get("SUPABASE_URL")!, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const table = () => db.from("project_advisor_leads");

const store: AdvisorStore = {
  async find(requestId) {
    const { data, error } = await table().select("*").eq("request_id", requestId).maybeSingle();
    if (error) throw error;
    return data as Lead | null;
  },
  async create(contact, requestId, hash) {
    const { data, error } = await table().insert({ ...contact, request_id: requestId, access_token_hash: hash }).select("*").single();
    if (error?.code === "23505") {
      const existing = await store.find(requestId);
      if (existing) return existing; // Handler verifies the capability before responding.
    }
    if (error) throw error;
    return data as Lead;
  },
  async quota(key, limit, seconds) {
    const { data, error } = await db.rpc("project_advisor_take_quota", { p_key: key, p_limit: limit, p_seconds: seconds });
    if (error) throw error;
    return data === true;
  },
  async claim(requestId, hash) {
    const { data, error } = await db.rpc("project_advisor_claim_analysis", { p_request_id: requestId, p_token_hash: hash });
    if (error) throw error;
    return (data?.[0] ?? null) as Lead | null;
  },
  async finish(lead, analysis) {
    const { error } = await table().update({ analysis, analysis_status: analysis ? "ready" : "failed" })
      .eq("id", lead.id).eq("analysis_status", "processing").eq("analysis_attempts", lead.analysis_attempts);
    if (error) throw error;
  },
  async callback(lead, phone, at) {
    const { data, error } = await table().update({ phone, status: "callback_requested", callback_requested_at: at })
      .eq("id", lead.id).eq("access_token_hash", lead.access_token_hash).select("id").single();
    if (error || !data) throw error ?? new Error("Callback not saved");
  },
};

const identityKey = await crypto.subtle.importKey("raw", new TextEncoder().encode(serviceKey),
  { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);

Deno.serve(createAdvisorHandler({
  store,
  // Local origins must be explicitly configured on the local function only.
  origins: Deno.env.get("PROJECT_ADVISOR_ORIGINS")?.split(",").map(s => s.trim()) ?? ORIGINS,
  async hashIdentity(value) {
    const result = await crypto.subtle.sign("HMAC", identityKey, new TextEncoder().encode(value));
    return Array.from(new Uint8Array(result), b => b.toString(16).padStart(2, "0")).join("");
  },
  async generate(project) {
    const key = Deno.env.get("GEMINI_API_KEY");
    if (!key) throw new Error("AI not configured");
    const model = Deno.env.get("PROJECT_ADVISOR_MODEL") ?? "gemini-3.6-flash";
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: "POST", signal: AbortSignal.timeout(45000),
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt(project.profile) }] },
        contents: [{ role: "user", parts: [{ text: JSON.stringify(project) }] }],
        generationConfig: { responseMimeType: "application/json", responseSchema: ANALYSIS_SCHEMA, maxOutputTokens: 3000, temperature: 0.5 },
      }),
    });
    if (!response.ok) {
      console.warn("project-advisor: provider HTTP status", response.status);
      throw new Error("AI unavailable");
    }
    const result = await response.json();
    const candidate = result.candidates?.[0];
    if (candidate?.finishReason !== "STOP") {
      console.warn("project-advisor: provider finish reason", candidate?.finishReason ?? "none");
      throw new Error("Incomplete AI response");
    }
    const content = candidate.content?.parts?.filter((p: { thought?: boolean }) => !p.thought)
      .map((p: { text?: string }) => p.text ?? "").join("");
    return validateAnalysis(JSON.parse(content));
  },
}));
