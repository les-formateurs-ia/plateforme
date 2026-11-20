// Supprime un lien Visiteur et tous les comptes de démonstration qu'il a
// ouverts (page « Liens visiteurs »). Réservé à l'admin. Même nettoyage que
// delete-student pour chaque compte : fichiers de Storage via
// admin_reset_student_stats (session de l'admin), puis auth.admin.deleteUser
// (cascade sur profiles et toutes les tables élève).
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2.48.1";
import { CORS_HEADERS, jsonResponse, getCallerRole } from "../_shared/podcast-utils.ts";

const CONCURRENCY = 5;

async function deleteVisitor(userClient: SupabaseClient, serviceClient: SupabaseClient, profileId: string): Promise<string | null> {
  const { data: files, error: resetErr } = await userClient.rpc("admin_reset_student_stats", { p_student_id: profileId });
  if (resetErr) return resetErr.message;
  const byBucket = new Map<string, string[]>();
  for (const f of (files ?? []) as { bucket: string; path: string }[]) {
    byBucket.set(f.bucket, [...(byBucket.get(f.bucket) ?? []), f.path]);
  }
  await Promise.all([...byBucket].map(async ([bucket, paths]) => {
    const { error } = await serviceClient.storage.from(bucket).remove(paths);
    if (error) console.warn(`Suppression des fichiers ${bucket} incomplète :`, error.message);
  }));
  const { error: deleteErr } = await serviceClient.auth.admin.deleteUser(profileId);
  return deleteErr?.message ?? null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });

  try {
    const { linkId } = await req.json();
    if (typeof linkId !== "string" || !linkId) return jsonResponse({ error: "linkId est obligatoire." }, 400);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return jsonResponse({ error: "Non authentifié." }, 401);

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) return jsonResponse({ error: "Session invalide." }, 401);

    const role = await getCallerRole(userClient, userData.user.id);
    if (role !== "admin") return jsonResponse({ error: "Réservé aux administrateurs." }, 403);

    const serviceClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Seuls des comptes marqués visiteur sont supprimés.
    const { data: accounts, error: accountsErr } = await serviceClient
      .from("visitor_accounts").select("profile_id, profiles!inner(is_visitor, role)")
      .eq("link_id", linkId).eq("profiles.is_visitor", true).eq("profiles.role", "student");
    if (accountsErr) return jsonResponse({ error: accountsErr.message }, 500);

    const ids = (accounts ?? []).map((a) => a.profile_id as string);
    const failures: string[] = [];
    for (let i = 0; i < ids.length; i += CONCURRENCY) {
      const results = await Promise.all(ids.slice(i, i + CONCURRENCY).map((id) => deleteVisitor(userClient, serviceClient, id)));
      failures.push(...results.filter((r): r is string => !!r));
    }
    if (failures.length) {
      return jsonResponse({ error: `${failures.length} compte(s) visiteur non supprimé(s) : ${failures[0]}` }, 500);
    }

    const { error: linkErr } = await serviceClient.from("visitor_links").delete().eq("id", linkId);
    if (linkErr) return jsonResponse({ error: linkErr.message }, 500);

    return jsonResponse({ deleted: ids.length });
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : "Erreur inconnue." }, 500);
  }
});
