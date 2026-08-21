// Vidéos avatar HeyGen personnalisées par élève × leçon (Étape 3).
import { supabase } from "@/app/lib/supabase/client";

export interface AvatarVideo {
  status: "pending" | "ready" | "failed";
  storagePath: string | null;
  transcript: string;
  error: string | null;
}

export async function getMyAvatarVideo(userId: string, lessonId: string): Promise<AvatarVideo | null> {
  const { data, error } = await supabase
    .from("ai_generated_content")
    .select("content")
    .eq("user_id", userId)
    .eq("lesson_id", lessonId)
    .eq("content_type", "avatar_video")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  const content = data?.content as { status?: string; storage_path?: string; transcript?: string; error?: string } | undefined;
  if (!content) return null;
  return {
    status: (content.status as AvatarVideo["status"]) ?? "pending",
    storagePath: content.storage_path ?? null,
    transcript: content.transcript ?? "",
    error: content.error ?? null,
  };
}

export async function getAvatarVideoSignedUrl(storagePath: string): Promise<string> {
  const { data, error } = await supabase.storage.from("lesson-avatar-videos").createSignedUrl(storagePath, 3600);
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

export async function requestAvatarVideoGeneration(lessonId: string): Promise<void> {
  const scriptResult = await supabase.functions.invoke("generate-avatar-script", { body: { lessonId } });
  if (scriptResult.error) throw new Error(await extractFunctionError(scriptResult.error));
  if (scriptResult.data?.error) throw new Error(scriptResult.data.error);
  const script = scriptResult.data?.script;
  if (!script) throw new Error("Le script de la vidéo n'a pas pu être généré.");

  const videoResult = await supabase.functions.invoke("generate-avatar-video", { body: { lessonId, script } });
  if (videoResult.error) throw new Error(await extractFunctionError(videoResult.error));
  if (videoResult.data?.error) throw new Error(videoResult.data.error);
}

// HeyGen peut prendre plusieurs minutes à rendre une vidéo — on relance de
// courts appels de vérification plutôt qu'une seule invocation longue (même
// leçon apprise que pour les podcasts).
export async function pollAvatarVideoStatus(
  lessonId: string,
  { intervalMs = 8000, timeoutMs = 360000 }: { intervalMs?: number; timeoutMs?: number } = {},
): Promise<AvatarVideo | null> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const { data, error } = await supabase.functions.invoke("check-avatar-video-status", { body: { lessonId } });
    if (error) throw new Error(await extractFunctionError(error));
    if (data?.error) throw new Error(data.error);
    if (data?.status === "ready" || data?.status === "failed") {
      return { status: data.status, storagePath: data.storagePath ?? null, transcript: "", error: data.error ?? null };
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  return null;
}
