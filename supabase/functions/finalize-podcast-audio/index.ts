// Dernière étape : recolle les morceaux PCM déjà décodés (par
// process-podcast-chunk) en un seul fichier WAV, l'enregistre, met à jour
// ai_generated_content, puis nettoie les fichiers temporaires. Ne fait que de
// l'E/S et des copies d'octets déjà binaires (pas de parse JSON/base64 d'un
// gros payload), donc reste largement sous le quota CPU fixe de 2s.
import { createClient } from "npm:@supabase/supabase-js@2.48.1";
import { CORS_HEADERS, jsonResponse, pcmToWav, concatUint8Arrays, getCallerRole, isStaffRole } from "../_shared/podcast-utils.ts";
import { resolvePodcastFormat } from "../_shared/podcast-formats.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });

  try {
    const { lessonId, chunkCount, sampleRate, channels, transcript, variant } = await req.json();
    if (!lessonId || !chunkCount || !transcript) {
      return jsonResponse({ error: "lessonId, chunkCount ou transcript manquant." }, 400);
    }
    const format = resolvePodcastFormat(variant);

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

    // Barrière réelle (pas seulement côté generate-podcast-script) : c'est ici
    // qu'est écrite la ligne finale ai_generated_content, donc c'est ici que
    // la règle "un élève ne régénère pas" doit être appliquée pour de vrai.
    const isStaff = isStaffRole(await getCallerRole(supabase, userId));
    if (!isStaff) {
      const { data: existing } = await supabase
        .from("ai_generated_content")
        .select("id")
        .eq("user_id", userId).eq("lesson_id", lessonId).eq("content_type", "podcast").eq("variant", format.id)
        .maybeSingle();
      if (existing) {
        return jsonResponse({ error: "Ce format de podcast a déjà été généré — seuls un admin ou un formateur peuvent le régénérer." }, 403);
      }
    }

    const tmpPaths: string[] = [];
    const pcmParts: Uint8Array[] = [];
    for (let i = 0; i < chunkCount; i++) {
      const path = `${userId}/tmp/${lessonId}/${format.id}/${i}.pcm`;
      tmpPaths.push(path);
      const { data, error } = await supabase.storage.from("lesson-podcasts").download(path);
      if (error) return jsonResponse({ error: `Échec de lecture du morceau ${i} : ${error.message}` }, 500);
      pcmParts.push(new Uint8Array(await data.arrayBuffer()));
    }

    const fullPcm = concatUint8Arrays(pcmParts);
    const wavBytes = pcmToWav(fullPcm, sampleRate ?? 24000, channels ?? 1);

    const storagePath = `${userId}/${lessonId}/${format.id}.wav`;
    const { error: uploadErr } = await supabase.storage
      .from("lesson-podcasts")
      .upload(storagePath, wavBytes, { contentType: "audio/wav", upsert: true });
    if (uploadErr) return jsonResponse({ error: `Échec de l'enregistrement audio : ${uploadErr.message}` }, 500);

    // Scopé par variant (et non plus par lesson seule) : plusieurs formats de
    // podcast doivent coexister pour une même leçon, seule une régénération du
    // même format doit écraser sa propre ligne précédente.
    await supabase.from("ai_generated_content").delete()
      .eq("user_id", userId).eq("lesson_id", lessonId).eq("content_type", "podcast").eq("variant", format.id);
    const { error: insertErr } = await supabase.from("ai_generated_content").insert({
      user_id: userId,
      lesson_id: lessonId,
      content_type: "podcast",
      variant: format.id,
      source_prompt: `Voir generate-podcast-script (script personnalisé du dialogue, format=${format.id}).`,
      content: { storage_path: storagePath, transcript },
      model: "gemini-3.6-flash+gemini-3.1-flash-tts-preview",
    });
    if (insertErr) return jsonResponse({ error: `Échec de l'enregistrement : ${insertErr.message}` }, 500);

    await supabase.storage.from("lesson-podcasts").remove(tmpPaths);

    return jsonResponse({ status: "ok", storagePath, variant: format.id });
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : "Erreur inconnue." }, 500);
  }
});
