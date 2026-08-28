// Dossiers d'exercice (Pratique IA), partagés par les trois exercices
// (prompt/media/html) — voir migration 0017_exercise_sessions.sql. Un dossier
// est une vraie ligne créée explicitement au clic sur "Nouveau test" (donc
// renommable dès sa création, avant toute tentative), et référencé par
// session_id (foreign key, delete cascade) dans les tables de tentatives.
import { supabase } from "@/app/lib/supabase/client";

export type ExerciseType = "prompt" | "media" | "html";

export interface ExerciseSessionMeta {
  id: string;
  name: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

function mapRow(row: { id: string; name: string | null; description: string | null; created_at: string; updated_at: string }): ExerciseSessionMeta {
  return { id: row.id, name: row.name, description: row.description, createdAt: row.created_at, updatedAt: row.updated_at };
}

export async function createExerciseSession(userId: string, exerciseType: ExerciseType): Promise<ExerciseSessionMeta> {
  const { data, error } = await supabase
    .from("exercise_sessions")
    .insert({ user_id: userId, exercise_type: exerciseType })
    .select()
    .single();
  if (error) throw error;
  return mapRow(data);
}

export async function listExerciseSessions(userId: string, exerciseType: ExerciseType): Promise<ExerciseSessionMeta[]> {
  const { data, error } = await supabase
    .from("exercise_sessions")
    .select("id, name, description, created_at, updated_at")
    .eq("user_id", userId)
    .eq("exercise_type", exerciseType)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(mapRow);
}

export async function renameExerciseSession(sessionId: string, patch: { name?: string | null; description?: string | null }): Promise<void> {
  const { error } = await supabase.from("exercise_sessions").update(patch).eq("id", sessionId);
  if (error) throw error;
}

// Cascade en base sur les tentatives (prompt/html) — pour media, le storage
// des images/vidéos doit être nettoyé séparément AVANT cet appel (voir
// deleteMediaExerciseSession), la suppression de fichiers ne cascade pas.
export async function deleteExerciseSession(sessionId: string): Promise<void> {
  const { error } = await supabase.from("exercise_sessions").delete().eq("id", sessionId);
  if (error) throw error;
}
