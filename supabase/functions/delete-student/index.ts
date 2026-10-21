// Supprime définitivement le compte d'un élève depuis "Élèves & formateurs".
// Réservé à l'admin. Nécessite la clé service-role (auth.admin.deleteUser) :
// supprimer auth.users efface profiles en cascade, puis toutes les tables
// élève (progression, missions, conversations, créations Studio…) qui
// référencent profiles(id) on delete cascade.
//
// Les fichiers de Storage ne suivent pas la cascade : on passe d'abord par
// admin_reset_student_stats (appelée avec la session de l'admin, elle vérifie
// is_admin() et le rôle élève) qui renvoie les fichiers de l'élève, retirés
// ensuite du stockage avant la suppression du compte.
import { createClient } from "npm:@supabase/supabase-js@2.48.1";
import { CORS_HEADERS, jsonResponse, getCallerRole } from "../_shared/podcast-utils.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });

  try {
    const { studentId } = await req.json();
    if (typeof studentId !== "string" || !studentId.trim()) return jsonResponse({ error: "studentId est obligatoire." }, 400);

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

    const { data: target, error: targetErr } = await serviceClient
      .from("profiles")
      .select("id, role")
      .eq("id", studentId)
      .maybeSingle();
    if (targetErr) return jsonResponse({ error: targetErr.message }, 500);
    if (!target) return jsonResponse({ error: "Élève introuvable." }, 404);
    if (target.role !== "student") return jsonResponse({ error: "Seuls les comptes élèves peuvent être supprimés ici." }, 400);

    const { data: files, error: resetErr } = await userClient.rpc("admin_reset_student_stats", { p_student_id: studentId });
    if (resetErr) return jsonResponse({ error: resetErr.message }, 400);

    const byBucket = new Map<string, string[]>();
    for (const f of (files ?? []) as { bucket: string; path: string }[]) {
      byBucket.set(f.bucket, [...(byBucket.get(f.bucket) ?? []), f.path]);
    }
    await Promise.all([...byBucket].map(async ([bucket, paths]) => {
      const { error: storageError } = await serviceClient.storage.from(bucket).remove(paths);
      if (storageError) console.warn(`Suppression des fichiers ${bucket} incomplète :`, storageError.message);
    }));

    const { error: deleteErr } = await serviceClient.auth.admin.deleteUser(studentId);
    if (deleteErr) return jsonResponse({ error: deleteErr.message }, 500);

    return jsonResponse({ ok: true });
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : "Erreur inconnue." }, 500);
  }
});
