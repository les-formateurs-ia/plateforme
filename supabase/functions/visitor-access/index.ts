// Ouverture d'un lien Visiteur (/visite/:jeton → ici). Quiconque a le lien
// entre sans compte à créer : on crée en coulisse un compte élève de
// démonstration (profiles.is_visitor), on lui attribue la formation du lien
// avec le budget IA du lien, puis on renvoie un jeton de connexion à usage
// unique (generateLink, jamais expédié) que la page /visite/:jeton échange
// elle-même contre une session (verifyOtp) : pas de redirection, donc rien à
// déclarer dans les URL de redirection Supabase.
//
// Un navigateur déjà connecté à son compte visiteur ne repasse pas par ici
// (cf. VisitorAccessPage) : il retrouve sa visite. Le compte reçoit une
// adresse technique qui n'existe pas, aucun e-mail n'est jamais envoyé.
//
// Garde-fous : lien actif, nombre maximal de comptes par lien, et
// IP_DAILY_LIMIT nouveaux comptes par jour et par adresse IP au plus.
import { createClient } from "npm:@supabase/supabase-js@2.48.1";
import { CORS_HEADERS, jsonResponse } from "../_shared/podcast-utils.ts";

const VISITOR_EMAIL_DOMAIN = "visiteur.les-formateurs-ia.fr";
const IP_DAILY_LIMIT = 5;

async function sha256(text: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function clientIp(req: Request): string | null {
  return req.headers.get("cf-connecting-ip")
    ?? req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? req.headers.get("x-real-ip");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });

  // reason = code affiché par la page de connexion (/login?visite=…), suivi
  // éventuellement du détail technique (journal uniquement).
  const fail = (reason: string) => {
    console.error("visitor-access:", reason);
    return jsonResponse({ error: reason.split(":")[0] });
  };

  try {
    const token = new URL(req.url).searchParams.get("t") ?? "";
    if (!/^[0-9a-f-]{36}$/i.test(token)) return fail("lien_invalide");

    const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: link } = await db.from("visitor_links")
      .select("id, label, template_id, budget_usd, max_accounts, accounts_count, created_by, expires_at, revoked_at, open_count")
      .eq("token", token).maybeSingle();
    if (!link || !link.template_id) return fail("lien_invalide");
    if (link.revoked_at || (link.expires_at && new Date(link.expires_at).getTime() < Date.now())) return fail("lien_expire");
    if (link.max_accounts != null && link.accounts_count >= link.max_accounts) return fail("lien_complet");

    const ip = clientIp(req);
    const ipHash = ip ? await sha256(`${link.id}:${ip}`) : null;
    if (ipHash) {
      const since = new Date(Date.now() - 86_400_000).toISOString();
      const { count } = await db.from("visitor_accounts")
        .select("profile_id", { count: "exact", head: true })
        .eq("ip_hash", ipHash).gte("created_at", since);
      if ((count ?? 0) >= IP_DAILY_LIMIT) return fail("lien_sature");
    }

    const email = `visiteur-${crypto.randomUUID().slice(0, 12)}@${VISITOR_EMAIL_DOMAIN}`;
    const { data: created, error: createError } = await db.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { first_name: "Visiteur", visitor_label: link.label },
    });
    if (createError || !created?.user) return fail(`creation: ${createError?.message}`);
    const visitorId = created.user.id;

    // En cas d'échec plus loin, on ne laisse pas de compte orphelin.
    const rollback = async (reason: string) => {
      await db.auth.admin.deleteUser(visitorId);
      return fail(reason);
    };

    // Le trigger on_auth_user_created a déjà inséré la ligne profiles.
    const { error: profileError } = await db.from("profiles").update({
      first_name: "Visiteur",
      last_name: null,
      must_onboard: false,
      is_visitor: true,
      ai_budget_usd: link.budget_usd,
    }).eq("id", visitorId);
    if (profileError) return await rollback(`creation: ${profileError.message}`);

    const { error: onboardingError } = await db.from("student_onboarding").upsert({ user_id: visitorId });
    if (onboardingError) return await rollback(`creation: ${onboardingError.message}`);

    const { error: assignError } = await db.rpc("assign_formation_to_visitor", {
      p_template_id: link.template_id,
      p_student_id: visitorId,
      p_staff_id: link.created_by,
    });
    if (assignError) return await rollback(`creation: ${assignError.message}`);

    const { error: accountError } = await db.from("visitor_accounts").insert({ profile_id: visitorId, link_id: link.id, ip_hash: ipHash });
    if (accountError) return await rollback(`creation: ${accountError.message}`);

    await db.from("visitor_links").update({
      accounts_count: (link.accounts_count ?? 0) + 1,
      open_count: (link.open_count ?? 0) + 1,
      last_opened_at: new Date().toISOString(),
    }).eq("id", link.id);

    const { data: magic, error: linkError } = await db.auth.admin.generateLink({ type: "magiclink", email });
    const tokenHash = magic?.properties?.hashed_token;
    if (linkError || !tokenHash) return fail(`lien_connexion: ${linkError?.message}`);
    return jsonResponse({ tokenHash });
  } catch (err) {
    return fail(err instanceof Error ? err.message : "erreur");
  }
});
