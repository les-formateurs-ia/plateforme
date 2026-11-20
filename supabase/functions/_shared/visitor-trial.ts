// Essais IA du mode Visiteur (cf. migration 20261119120000_visitor_mode.sql) :
// un visiteur teste chaque outil IA une fois. À appeler juste avant l'appel au
// fournisseur, avec le client de l'appelant (JWT élève) ; sans effet pour un
// compte qui n'est pas visiteur. Si l'appel au fournisseur échoue, release()
// rend l'essai.
import { createClient } from "npm:@supabase/supabase-js@2.48.1";
import { jsonResponse } from "./podcast-utils.ts";

// Repéré par le front (lib/supabase/client.ts) pour afficher la présentation
// de l'outil et l'invitation à s'inscrire.
export const VISITOR_TRIAL_CODE = "visitor_trial_used";

export type VisitorTrial =
  | { ok: true; release: () => Promise<void> }
  | { ok: false; response: Response };

// deno-lint-ignore no-explicit-any
export async function claimVisitorTrial(userClient: any, tool: string, limit = 1): Promise<VisitorTrial> {
  const { data, error } = await userClient.rpc("claim_visitor_trial", { p_tool: tool, p_limit: limit });
  if (error) {
    // Vérification impossible : un élève ou le staff ne doit jamais être
    // bloqué pour autant ; seul un visiteur (ou un doute) est refusé.
    const { data: userData } = await userClient.auth.getUser();
    const { data: profile } = userData?.user
      ? await userClient.from("profiles").select("*").eq("id", userData.user.id).maybeSingle()
      : { data: null };
    if (profile && profile.is_visitor !== true) return { ok: true, release: async () => {} };
    return { ok: false, response: jsonResponse({ error: "Impossible de vérifier l'accès à cet outil." }, 500) };
  }
  if (!data?.allowed) {
    return {
      ok: false,
      response: jsonResponse({
        error: "Mode visiteur : vous avez déjà testé cet outil. Inscrivez-vous à la formation pour l'utiliser sans limite.",
        code: VISITOR_TRIAL_CODE,
        tool,
      }, 403),
    };
  }
  const useId: string | undefined = data.use_id;
  return {
    ok: true,
    release: async () => {
      if (!useId) return;
      const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      const { error: releaseError } = await admin.from("visitor_ai_uses").delete().eq("id", useId);
      if (releaseError) console.error("visitor trial release failed:", releaseError.message);
    },
  };
}

export interface TrialScope {
  // Réserve l'essai ; renvoie la réponse à retourner telle quelle s'il est
  // refusé, sinon null.
  // deno-lint-ignore no-explicit-any
  claim(userClient: any, tool: string, limit?: number): Promise<Response | null>;
}

// Deno.serve avec essai visiteur : l'essai réservé par trial.claim() est
// rendu si la requête finit en erreur (statut >= 400 ou exception).
export function serveWithVisitorTrial(handler: (req: Request, trial: TrialScope) => Promise<Response>) {
  Deno.serve(async (req) => {
    let release: (() => Promise<void>) | null = null;
    const scope: TrialScope = {
      claim: async (userClient, tool, limit = 1) => {
        const trial = await claimVisitorTrial(userClient, tool, limit);
        if (!trial.ok) return trial.response;
        release = trial.release;
        return null;
      },
    };
    try {
      const res = await handler(req, scope);
      if (release && res.status >= 400) await (release as () => Promise<void>)();
      return res;
    } catch (err) {
      if (release) await (release as () => Promise<void>)();
      throw err;
    }
  });
}

// Génération asynchrone en échec (check-*-status) : on rend le dernier essai
// de l'outil, pour que le visiteur ne reste pas sur un échec.
export async function refundVisitorTrial(userId: string, tool: string): Promise<void> {
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data } = await admin.from("visitor_ai_uses").select("id")
    .eq("profile_id", userId).eq("tool", tool).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (data) await admin.from("visitor_ai_uses").delete().eq("id", data.id);
}
