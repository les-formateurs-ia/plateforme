// Tags pour "Exercices pour vous" — référentiel partagé (créer/renommer/
// supprimer un tag réservé à l'admin côté RLS, voir migration
// 0032_exercise_tags.sql) qu'admin et formateur attribuent ensuite librement
// aux exercices HTML via html_exercise_tag_assignments.
import { supabase } from "@/app/lib/supabase/client";

export interface ExerciseTag {
  id: string;
  name: string;
}

export async function listExerciseTags(): Promise<ExerciseTag[]> {
  const { data, error } = await supabase.from("exercise_tags").select("id, name").order("name", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function createExerciseTag(name: string, createdBy: string): Promise<ExerciseTag> {
  const { data, error } = await supabase
    .from("exercise_tags")
    .insert({ name, created_by: createdBy })
    .select("id, name")
    .single();
  if (error || !data) throw error ?? new Error("Erreur inconnue");
  return data;
}

export async function renameExerciseTag(id: string, name: string): Promise<void> {
  const { error } = await supabase.from("exercise_tags").update({ name }).eq("id", id);
  if (error) throw error;
}

export async function deleteExerciseTag(id: string): Promise<void> {
  const { error } = await supabase.from("exercise_tags").delete().eq("id", id);
  if (error) throw error;
}

// Tags attribués à un exercice donné (pour pré-cocher l'éditeur).
export async function getTagIdsForExercise(exerciseId: string): Promise<string[]> {
  const { data, error } = await supabase.from("html_exercise_tag_assignments").select("tag_id").eq("exercise_id", exerciseId);
  if (error) throw error;
  return (data ?? []).map((r) => r.tag_id);
}

// Repart d'une base propre — même pattern que updateHtmlExercise pour les
// assignations d'élèves (simple et fiable vu le faible volume).
export async function setExerciseTags(exerciseId: string, tagIds: string[], assignedBy: string): Promise<void> {
  const { error: deleteError } = await supabase.from("html_exercise_tag_assignments").delete().eq("exercise_id", exerciseId);
  if (deleteError) throw deleteError;
  if (tagIds.length) {
    const { error: insertError } = await supabase
      .from("html_exercise_tag_assignments")
      .insert(tagIds.map((tagId) => ({ exercise_id: exerciseId, tag_id: tagId, assigned_by: assignedBy })));
    if (insertError) throw insertError;
  }
}

// Tags de plusieurs exercices en une fois, pour les cartes d'une liste —
// deux requêtes plates (jointure + référentiel) fusionnées en JS, comme le
// reste de ce fichier plutôt qu'un embed PostgREST.
export async function listExerciseTagsForExercises(exerciseIds: string[]): Promise<Map<string, ExerciseTag[]>> {
  const map = new Map<string, ExerciseTag[]>();
  if (!exerciseIds.length) return map;

  const { data: links, error } = await supabase
    .from("html_exercise_tag_assignments")
    .select("exercise_id, tag_id")
    .in("exercise_id", exerciseIds);
  if (error) throw error;
  if (!links?.length) return map;

  const tags = await listExerciseTags();
  const tagById = new Map(tags.map((t) => [t.id, t]));

  for (const link of links) {
    const tag = tagById.get(link.tag_id);
    if (!tag) continue;
    const list = map.get(link.exercise_id) ?? [];
    list.push(tag);
    map.set(link.exercise_id, list);
  }
  return map;
}
