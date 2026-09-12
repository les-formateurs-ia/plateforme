// Atelier "Détection Image IA" — galerie administrable par le staff
// (upload + statut IA/réelle + explication), consommée par les élèves sous
// forme de quiz réel-vs-IA avec feedback immédiat.
import { supabase } from "@/app/lib/supabase/client";

export interface AiDetectionImage {
  id: string;
  imageUrl: string;
  isAi: boolean;
  explanation: string;
  createdAt: string;
}

interface Row {
  id: string;
  image_path: string;
  is_ai: boolean;
  explanation: string;
  created_at: string;
}

function publicUrlFor(path: string): string {
  return supabase.storage.from("ai-detection-images").getPublicUrl(path).data.publicUrl;
}

function mapRow(row: Row): AiDetectionImage {
  return { id: row.id, imageUrl: publicUrlFor(row.image_path), isAi: row.is_ai, explanation: row.explanation, createdAt: row.created_at };
}

// ── Admin/formateur ─────────────────────────────────────────────────────

export async function listAiDetectionImagesAdmin(): Promise<AiDetectionImage[]> {
  const { data, error } = await supabase
    .from("ai_detection_images")
    .select("id, image_path, is_ai, explanation, created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => mapRow(row as Row));
}

export async function createAiDetectionImage({ file, isAi, explanation }: { file: File; isAi: boolean; explanation: string }): Promise<AiDetectionImage> {
  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  const path = `${Date.now()}-${safeName}`;
  const { error: uploadError } = await supabase.storage.from("ai-detection-images").upload(path, file, { upsert: true });
  if (uploadError) throw uploadError;

  const { data: userData } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("ai_detection_images")
    .insert({ image_path: path, is_ai: isAi, explanation, created_by: userData.user?.id ?? null })
    .select()
    .single();
  if (error) throw error;
  return mapRow(data as Row);
}

export async function updateAiDetectionImage(id: string, patch: { isAi?: boolean; explanation?: string; file?: File }): Promise<AiDetectionImage> {
  let imagePath: string | undefined;
  if (patch.file) {
    const safeName = patch.file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    imagePath = `${Date.now()}-${safeName}`;
    const { error: uploadError } = await supabase.storage.from("ai-detection-images").upload(imagePath, patch.file, { upsert: true });
    if (uploadError) throw uploadError;
  }
  const { data, error } = await supabase
    .from("ai_detection_images")
    .update({
      ...(patch.isAi !== undefined ? { is_ai: patch.isAi } : {}),
      ...(patch.explanation !== undefined ? { explanation: patch.explanation } : {}),
      ...(imagePath ? { image_path: imagePath } : {}),
    })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return mapRow(data as Row);
}

export async function deleteAiDetectionImage(id: string): Promise<void> {
  const { data: row, error: fetchErr } = await supabase.from("ai_detection_images").select("image_path").eq("id", id).maybeSingle();
  if (fetchErr) throw fetchErr;
  await supabase.from("ai_detection_images").delete().eq("id", id);
  if (row?.image_path) await supabase.storage.from("ai-detection-images").remove([row.image_path]);
}

// ── Élève ────────────────────────────────────────────────────────────────

export async function listAiDetectionImagesForStudent(): Promise<AiDetectionImage[]> {
  const { data, error } = await supabase
    .from("ai_detection_images")
    .select("id, image_path, is_ai, explanation, created_at");
  if (error) throw error;
  const images = (data ?? []).map((row) => mapRow(row as Row));
  // Mélange côté client pour que l'ordre de la galerie change à chaque visite.
  for (let i = images.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [images[i], images[j]] = [images[j], images[i]];
  }
  return images;
}

export async function submitAiDetectionGuess(imageId: string, guessedIsAi: boolean): Promise<{ correct: boolean; isAi: boolean; explanation: string }> {
  const { data: image, error: imageErr } = await supabase
    .from("ai_detection_images")
    .select("is_ai, explanation")
    .eq("id", imageId)
    .single();
  if (imageErr) throw imageErr;

  const correct = image.is_ai === guessedIsAi;
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Non authentifié.");

  const { error: insertErr } = await supabase
    .from("ai_detection_attempts")
    .insert({ student_id: userData.user.id, image_id: imageId, guessed_is_ai: guessedIsAi, correct });
  if (insertErr) throw insertErr;

  return { correct, isAi: image.is_ai, explanation: image.explanation };
}
