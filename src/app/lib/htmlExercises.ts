// Couche d'accès admin/formateur pour les exercices "Exercices pour vous"
// (curation globale/privée) — le travail de l'élève sur un exercice reste
// dans lib/htmlExercise.ts (côté élève), inchangé dans sa mécanique.
import { supabase } from "@/app/lib/supabase/client";
import type { ExerciseVisibility } from "@/app/lib/supabase/database.types";
import { listExerciseTagsForExercises, type ExerciseTag } from "@/app/lib/exerciseTags";

export interface HtmlExerciseRow {
  id: string;
  name: string;
  description: string | null;
  htmlContent: string;
  visibility: ExerciseVisibility;
  createdAt: string;
  updatedAt: string;
  assigneeCount: number;
  tags: ExerciseTag[];
}

export async function listHtmlExercises(visibility: ExerciseVisibility): Promise<HtmlExerciseRow[]> {
  const { data: exercises, error } = await supabase
    .from("html_exercises")
    .select("id, name, description, html_content, visibility, created_at, updated_at")
    .eq("visibility", visibility)
    .order("created_at", { ascending: false });
  if (error) throw error;
  if (!exercises?.length) return [];

  const { data: assignments, error: assignmentsError } = await supabase
    .from("html_exercise_assignments")
    .select("exercise_id")
    .in("exercise_id", exercises.map((e) => e.id));
  if (assignmentsError) throw assignmentsError;

  const counts = new Map<string, number>();
  for (const a of assignments ?? []) counts.set(a.exercise_id, (counts.get(a.exercise_id) ?? 0) + 1);

  const tagsByExercise = await listExerciseTagsForExercises(exercises.map((e) => e.id));

  return exercises.map((e) => ({
    id: e.id,
    name: e.name,
    description: e.description,
    htmlContent: e.html_content,
    visibility: e.visibility,
    createdAt: e.created_at,
    updatedAt: e.updated_at,
    assigneeCount: counts.get(e.id) ?? 0,
    tags: tagsByExercise.get(e.id) ?? [],
  }));
}

export async function listExercisesForStudent(studentId: string): Promise<HtmlExerciseRow[]> {
  const { data: assignments, error } = await supabase
    .from("html_exercise_assignments")
    .select("exercise_id")
    .eq("student_id", studentId);
  if (error) throw error;
  const exerciseIds = (assignments ?? []).map((a) => a.exercise_id);
  if (!exerciseIds.length) return [];

  const { data: exercises, error: exercisesError } = await supabase
    .from("html_exercises")
    .select("id, name, description, html_content, visibility, created_at, updated_at")
    .in("id", exerciseIds)
    .eq("visibility", "private")
    .order("created_at", { ascending: false });
  if (exercisesError) throw exercisesError;
  const tagsByExercise = await listExerciseTagsForExercises((exercises ?? []).map((e) => e.id));
  return (exercises ?? []).map((e) => ({
    id: e.id, name: e.name, description: e.description, htmlContent: e.html_content, visibility: e.visibility,
    createdAt: e.created_at, updatedAt: e.updated_at, assigneeCount: 0,
    tags: tagsByExercise.get(e.id) ?? [],
  }));
}

export async function getExerciseAssignees(exerciseId: string): Promise<string[]> {
  const { data, error } = await supabase.from("html_exercise_assignments").select("student_id").eq("exercise_id", exerciseId);
  if (error) throw error;
  return (data ?? []).map((a) => a.student_id);
}

export interface HtmlExercisePayload {
  name: string;
  description: string | null;
  htmlContent: string;
  visibility: ExerciseVisibility;
  studentIds: string[];
  createdBy: string;
}

export async function createHtmlExercise(payload: HtmlExercisePayload): Promise<HtmlExerciseRow> {
  const { data, error } = await supabase
    .from("html_exercises")
    .insert({ name: payload.name, description: payload.description, html_content: payload.htmlContent, visibility: payload.visibility, created_by: payload.createdBy })
    .select("id, name, description, html_content, visibility, created_at, updated_at")
    .single();
  if (error || !data) throw error ?? new Error("Erreur inconnue");

  if (payload.visibility === "private" && payload.studentIds.length) {
    const { error: assignError } = await supabase
      .from("html_exercise_assignments")
      .insert(payload.studentIds.map((studentId) => ({ exercise_id: data.id, student_id: studentId, assigned_by: payload.createdBy })));
    if (assignError) throw assignError;
  }

  return {
    id: data.id,
    name: data.name,
    description: data.description,
    htmlContent: data.html_content,
    visibility: data.visibility,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    assigneeCount: payload.studentIds.length,
    tags: [],
  };
}

export interface HtmlExerciseUpdate {
  name: string;
  description: string | null;
  htmlContent: string;
  visibility: ExerciseVisibility;
  studentIds: string[];
  updatedBy: string;
}

export async function updateHtmlExercise(id: string, patch: HtmlExerciseUpdate): Promise<void> {
  const { error } = await supabase
    .from("html_exercises")
    .update({ name: patch.name, description: patch.description, html_content: patch.htmlContent, visibility: patch.visibility })
    .eq("id", id);
  if (error) throw error;

  // Repart d'une base propre pour les assignations — simple et fiable vu le
  // faible volume (même pattern que le quiz d'une leçon).
  const { error: deleteError } = await supabase.from("html_exercise_assignments").delete().eq("exercise_id", id);
  if (deleteError) throw deleteError;
  if (patch.visibility === "private" && patch.studentIds.length) {
    const { error: insertError } = await supabase
      .from("html_exercise_assignments")
      .insert(patch.studentIds.map((studentId) => ({ exercise_id: id, student_id: studentId, assigned_by: patch.updatedBy })));
    if (insertError) throw insertError;
  }
}

export async function deleteHtmlExercise(id: string): Promise<void> {
  const { error } = await supabase.from("html_exercises").delete().eq("id", id);
  if (error) throw error;
}

export async function updateHtmlExerciseContent(id: string, htmlContent: string): Promise<void> {
  const { error } = await supabase.from("html_exercises").update({ html_content: htmlContent }).eq("id", id);
  if (error) throw error;
}
