// Appelée en boucle courte par le client tant que le statut est "pending".
// Chaque appel ne fait qu'une vérification HeyGen + éventuellement un
// téléchargement/upload (E/S, pas de gros parse JSON/base64), donc reste
// largement sous le quota CPU fixe des Edge Functions.
import { createClient } from "npm:@supabase/supabase-js@2.48.1";
import { CORS_HEADERS, jsonResponse } from "../_shared/podcast-utils.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });

  try {
    const heygenApiKey = Deno.env.get("HEYGEN_API_KEY");
    if (!heygenApiKey) return jsonResponse({ error: "HEYGEN_API_KEY non configurée côté serveur." }, 500);

    const { lessonId } = await req.json();
    if (!lessonId) return jsonResponse({ error: "lessonId manquant." }, 400);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return jsonResponse({ error: "Non authentifié." }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) return jsonResponse({ error: "Session invalide." }, 401);
    const userId = userData.user.id;

    const { data: row, error: rowErr } = await supabase
      .from("ai_generated_content").select("id, content")
      .eq("user_id", userId).eq("lesson_id", lessonId).eq("content_type", "avatar_video")
      .order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (rowErr) return jsonResponse({ error: rowErr.message }, 500);
    if (!row) return jsonResponse({ status: "none" });

    const content = row.content as { status: string; heygen_video_id?: string; transcript?: string; storage_path?: string; error?: string };
    if (content.status !== "pending") return jsonResponse({ status: content.status, storagePath: content.storage_path, error: content.error });

    const statusResp = await fetch(`https://api.heygen.com/v3/videos/${content.heygen_video_id}`, {
      headers: { "x-api-key": heygenApiKey },
    });
    if (!statusResp.ok) return jsonResponse({ error: `HeyGen (statut) a échoué : ${await statusResp.text()}` }, 502);
    const statusJson = await statusResp.json();
    const heygenStatus = statusJson?.data?.status ?? statusJson?.status;

    if (heygenStatus === "completed") {
      const videoUrl = statusJson?.data?.video_url ?? statusJson?.video_url;
      if (!videoUrl) return jsonResponse({ error: "HeyGen indique 'completed' mais n'a fourni aucune video_url." }, 502);

      const videoResp = await fetch(videoUrl);
      if (!videoResp.ok) return jsonResponse({ error: `Téléchargement de la vidéo HeyGen échoué (${videoResp.status}).` }, 502);
      const videoBytes = new Uint8Array(await videoResp.arrayBuffer());

      const storagePath = `${userId}/${lessonId}.mp4`;
      const { error: uploadErr } = await supabase.storage
        .from("lesson-avatar-videos")
        .upload(storagePath, videoBytes, { contentType: "video/mp4", upsert: true });
      if (uploadErr) return jsonResponse({ error: `Échec de l'enregistrement vidéo : ${uploadErr.message}` }, 500);

      await supabase.from("ai_generated_content").update({
        content: { status: "ready", storage_path: storagePath, transcript: content.transcript },
      }).eq("id", row.id);

      return jsonResponse({ status: "ready", storagePath });
    }

    if (heygenStatus === "failed" || heygenStatus === "error") {
      const errMsg = statusJson?.data?.error?.message ?? statusJson?.data?.error ?? "Échec de génération HeyGen.";
      await supabase.from("ai_generated_content").update({
        content: { status: "failed", transcript: content.transcript, error: String(errMsg) },
      }).eq("id", row.id);
      return jsonResponse({ status: "failed", error: String(errMsg) });
    }

    return jsonResponse({ status: "pending" });
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : "Erreur inconnue." }, 500);
  }
});
