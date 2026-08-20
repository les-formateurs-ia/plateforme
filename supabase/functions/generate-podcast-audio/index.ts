// Étape 2/2 de la génération de podcast : orchestre la synthèse vocale en
// tâche de fond. Le décodage d'un gros extrait audio dépasse le quota CPU
// fixe de 2s des Edge Functions (identique sur tous les plans, indépendant
// du temps mur) — donc au lieu de tout traiter ici, on découpe le script et
// on délègue chaque morceau à process-podcast-chunk (appel HTTP séparé =
// budget CPU neuf), puis on recolle via finalize-podcast-audio. Interface
// client inchangée : {lessonId, script} → 202 immédiat, résultat à relire
// via getMyPodcast() côté client.
import { createClient } from "npm:@supabase/supabase-js@2.48.1";
import { CORS_HEADERS, jsonResponse, runInBackground, splitScriptIntoChunks } from "../_shared/podcast-utils.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });

  try {
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

    const functionsBase = `${Deno.env.get("SUPABASE_URL")}/functions/v1`;
    const callFn = async (name: string, body: unknown) => {
      const resp = await fetch(`${functionsBase}/${name}`, {
        method: "POST",
        headers: { Authorization: authHeader, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await resp.json().catch(() => ({}));
      if (!resp.ok || json?.error) throw new Error(json?.error || `${name} a échoué (${resp.status}).`);
      return json;
    };

    const runGeneration = async () => {
      try {
        const chunks = splitScriptIntoChunks(script);
        let sampleRate = 24000;
        let channels = 1;
        for (let i = 0; i < chunks.length; i++) {
          const result = await callFn("process-podcast-chunk", { lessonId, chunkIndex: i, chunkText: chunks[i] });
          sampleRate = result.sampleRate ?? sampleRate;
          channels = result.channels ?? channels;
        }
        await callFn("finalize-podcast-audio", { lessonId, chunkCount: chunks.length, sampleRate, channels, transcript: script });
        console.log(`Podcast (audio) généré pour user=${userId} lesson=${lessonId} (${chunks.length} morceaux)`);
      } catch (err) {
        console.error(`Échec synthèse audio user=${userId} lesson=${lessonId}:`, err);
      }
    };

    runInBackground(runGeneration());
    return jsonResponse({ status: "processing" }, 202);
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : "Erreur inconnue." }, 500);
  }
});
