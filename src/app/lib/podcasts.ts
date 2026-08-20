// Podcasts personnalisés par élève × leçon (Étape 2 — voir generate-podcast Edge Function).
import { supabase } from "@/app/lib/supabase/client";

export interface Podcast {
  storagePath: string;
  transcript: string;
  createdAt: string;
}

export async function getMyPodcast(userId: string, lessonId: string): Promise<Podcast | null> {
  const { data, error } = await supabase
    .from("ai_generated_content")
    .select("content, created_at")
    .eq("user_id", userId)
    .eq("lesson_id", lessonId)
    .eq("content_type", "podcast")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const content = data.content as { storage_path?: string; transcript?: string };
  if (!content?.storage_path) return null;
  return { storagePath: content.storage_path, transcript: content.transcript ?? "", createdAt: data.created_at };
}

export async function getPodcastSignedUrl(storagePath: string): Promise<string> {
  const { data, error } = await supabase.storage.from("lesson-podcasts").createSignedUrl(storagePath, 3600);
  if (error) throw error;
  return data.signedUrl;
}

async function extractFunctionError(error: { message: string; context?: Response }): Promise<string> {
  let message = error.message;
  if (error.context) {
    try {
      const body = await error.context.clone().json();
      if (body?.error) message = body.error;
    } catch {
      // corps non-JSON, on garde le message par défaut
    }
  }
  return message;
}

// Génération en 2 étapes, chacune dans sa propre Edge Function : le script
// (rapide, réponse directe) puis la synthèse audio (~1-2 min, tâche de fond).
// Séparées car combinées elles dépassent le budget d'exécution d'une seule
// invocation. Ne renvoie pas le résultat final : l'appelant doit relire
// getMyPodcast() pour savoir quand le podcast est prêt.
export async function requestPodcastGeneration(lessonId: string): Promise<void> {
  const scriptResult = await supabase.functions.invoke("generate-podcast-script", { body: { lessonId } });
  if (scriptResult.error) throw new Error(await extractFunctionError(scriptResult.error));
  if (scriptResult.data?.error) throw new Error(scriptResult.data.error);
  const script = scriptResult.data?.script;
  if (!script) throw new Error("Le script du podcast n'a pas pu être généré.");

  const audioResult = await supabase.functions.invoke("generate-podcast-audio", { body: { lessonId, script } });
  if (audioResult.error) throw new Error(await extractFunctionError(audioResult.error));
  if (audioResult.data?.error) throw new Error(audioResult.data.error);
}

// Poll getMyPodcast() jusqu'à apparition d'un résultat postérieur à `sinceMs`
// (important pour une régénération : sans ce filtre, on retomberait tout de
// suite sur l'ancien podcast au lieu d'attendre le nouveau), ou jusqu'au timeout.
export async function pollForPodcast(
  userId: string,
  lessonId: string,
  sinceMs: number,
  { intervalMs = 5000, timeoutMs = 180000 }: { intervalMs?: number; timeoutMs?: number } = {},
): Promise<Podcast | null> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const podcast = await getMyPodcast(userId, lessonId);
    if (podcast && new Date(podcast.createdAt).getTime() >= sinceMs) return podcast;
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  return null;
}
