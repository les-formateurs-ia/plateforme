// Podcasts personnalisés par élève × leçon × format (voir generate-podcast-*
// Edge Functions et src/app/lib/podcastFormats.ts pour le catalogue des formats).
import { supabase } from "@/app/lib/supabase/client";
import type { PodcastVariantId } from "@/app/lib/podcastFormats";

export interface Podcast {
  variant: PodcastVariantId;
  storagePath: string;
  transcript: string;
  createdAt: string;
}

// Tous les formats déjà générés pour cette leçon (au plus une ligne par
// variant, grâce au DELETE scopé par variant côté finalize-podcast-audio).
export async function getMyPodcasts(userId: string, lessonId: string): Promise<Podcast[]> {
  const { data, error } = await supabase
    .from("ai_generated_content")
    .select("content, created_at, variant")
    .eq("user_id", userId)
    .eq("lesson_id", lessonId)
    .eq("content_type", "podcast")
    .order("created_at", { ascending: false });
  if (error) throw error;
  const podcasts: Podcast[] = [];
  for (const row of data ?? []) {
    const content = row.content as { storage_path?: string; transcript?: string };
    if (!content?.storage_path || !row.variant) continue;
    podcasts.push({ variant: row.variant as PodcastVariantId, storagePath: content.storage_path, transcript: content.transcript ?? "", createdAt: row.created_at });
  }
  return podcasts;
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
// getMyPodcasts() pour savoir quand le podcast est prêt.
export async function requestPodcastGeneration(lessonId: string, variant: PodcastVariantId): Promise<void> {
  const scriptResult = await supabase.functions.invoke("generate-podcast-script", { body: { lessonId, variant } });
  if (scriptResult.error) throw new Error(await extractFunctionError(scriptResult.error));
  if (scriptResult.data?.error) throw new Error(scriptResult.data.error);
  const script = scriptResult.data?.script;
  if (!script) throw new Error("Le script du podcast n'a pas pu être généré.");
  // Le serveur peut retomber sur un format par défaut si `variant` était invalide :
  // on relaie ce format confirmé plutôt que celui envoyé, pour rester cohérent.
  const confirmedVariant: PodcastVariantId = scriptResult.data?.variant ?? variant;

  const audioResult = await supabase.functions.invoke("generate-podcast-audio", { body: { lessonId, script, variant: confirmedVariant } });
  if (audioResult.error) throw new Error(await extractFunctionError(audioResult.error));
  if (audioResult.data?.error) throw new Error(audioResult.data.error);
}

// Poll getMyPodcasts() jusqu'à apparition d'un résultat pour ce variant
// postérieur à `sinceMs` (important pour une régénération : sans ce filtre,
// on retomberait tout de suite sur l'ancien podcast au lieu d'attendre le
// nouveau), ou jusqu'au timeout.
export async function pollForPodcast(
  userId: string,
  lessonId: string,
  variant: PodcastVariantId,
  sinceMs: number,
  { intervalMs = 5000, timeoutMs = 180000 }: { intervalMs?: number; timeoutMs?: number } = {},
): Promise<Podcast | null> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const podcasts = await getMyPodcasts(userId, lessonId);
    const match = podcasts.find((p) => p.variant === variant && new Date(p.createdAt).getTime() >= sinceMs);
    if (match) return match;
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  return null;
}
