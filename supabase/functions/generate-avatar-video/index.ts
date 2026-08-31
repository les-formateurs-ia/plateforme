// Lance la génération d'une vidéo avatar HeyGen (asynchrone côté HeyGen) et
// enregistre un statut "pending" à relire via check-avatar-video-status. Le
// rendu HeyGen dépasse souvent le temps mur des Edge Functions (même en
// arrière-plan), donc on ne poll PAS ici : le client relance de courts appels
// à check-avatar-video-status jusqu'à complétion (même leçon apprise que pour
// les podcasts — éviter les invocations longues).
import { createClient } from "npm:@supabase/supabase-js@2.48.1";
import { CORS_HEADERS, jsonResponse, getCallerRole, isStaffRole } from "../_shared/podcast-utils.ts";

const HEYGEN_AVATAR_ID = "f5f523196e7e4eaca6325972d36d266d"; // "Rafi Office 2" (look id, requis par POST /v3/videos — pas l'id de groupe renvoyé par GET /v3/avatars)
const HEYGEN_VOICE_ID = "d0d17a7e281f42a9b67002b32f4156d8"; // voix par défaut de Rafi

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });

  try {
    const heygenApiKey = Deno.env.get("HEYGEN_API_KEY");
    if (!heygenApiKey) return jsonResponse({ error: "HEYGEN_API_KEY non configurée côté serveur." }, 500);

    const { lessonId, script } = await req.json();
    if (!lessonId || !script) return jsonResponse({ error: "lessonId ou script manquant." }, 400);

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

    if (!isStaffRole(await getCallerRole(supabase, userId))) {
      return jsonResponse({ error: "Seuls un admin ou un formateur peuvent générer une vidéo avatar." }, 403);
    }

    const { data: lesson } = await supabase.from("instance_lessons").select("title").eq("id", lessonId).maybeSingle();

    const heygenResp = await fetch("https://api.heygen.com/v3/videos", {
      method: "POST",
      headers: { "x-api-key": heygenApiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "avatar",
        avatar_id: HEYGEN_AVATAR_ID,
        script,
        voice_id: HEYGEN_VOICE_ID,
        title: lesson?.title ?? "Leçon",
        resolution: "720p",
        aspect_ratio: "16:9",
      }),
    });
    if (!heygenResp.ok) return jsonResponse({ error: `HeyGen a échoué : ${await heygenResp.text()}` }, 502);
    const heygenJson = await heygenResp.json();
    const heygenVideoId = heygenJson?.data?.video_id ?? heygenJson?.video_id;
    if (!heygenVideoId) return jsonResponse({ error: `HeyGen n'a renvoyé aucun video_id : ${JSON.stringify(heygenJson).slice(0, 300)}` }, 502);

    await supabase.from("ai_generated_content").delete()
      .eq("user_id", userId).eq("lesson_id", lessonId).eq("content_type", "avatar_video");
    const { error: insertErr } = await supabase.from("ai_generated_content").insert({
      user_id: userId,
      lesson_id: lessonId,
      content_type: "avatar_video",
      source_prompt: "Voir generate-avatar-script (script personnalisé du monologue).",
      content: { status: "pending", heygen_video_id: heygenVideoId, transcript: script },
      model: `gemini-3.6-flash+heygen-avatar-v3`,
    });
    if (insertErr) return jsonResponse({ error: `Échec de l'enregistrement : ${insertErr.message}` }, 500);

    return jsonResponse({ status: "pending", heygenVideoId });
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : "Erreur inconnue." }, 500);
  }
});
