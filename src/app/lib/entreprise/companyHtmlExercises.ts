// Exercices HTML d'une entreprise — miroir simplifié de lib/htmlExercises.ts
// (pas de tags/assignation individuelle : visibilité binaire par entreprise).
import { supabase } from "@/app/lib/supabase/client";

export interface CompanyHtmlExerciseRow {
  id: string;
  companyId: string;
  name: string;
  description: string | null;
  htmlContent: string;
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;
}

function mapRow(row: {
  id: string; company_id: string; name: string; description: string | null; html_content: string;
  is_visible: boolean; created_at: string; updated_at: string;
}): CompanyHtmlExerciseRow {
  return {
    id: row.id, companyId: row.company_id, name: row.name, description: row.description,
    htmlContent: row.html_content, isVisible: row.is_visible, createdAt: row.created_at, updatedAt: row.updated_at,
  };
}

const SELECT = "id, company_id, name, description, html_content, is_visible, created_at, updated_at";

export async function listCompanyHtmlExercises(companyId: string): Promise<CompanyHtmlExerciseRow[]> {
  const { data, error } = await supabase.from("company_html_exercises").select(SELECT).eq("company_id", companyId).order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapRow);
}

export async function listVisibleCompanyHtmlExercises(companyId: string): Promise<CompanyHtmlExerciseRow[]> {
  const { data, error } = await supabase
    .from("company_html_exercises").select(SELECT)
    .eq("company_id", companyId).eq("is_visible", true)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapRow);
}

export interface CompanyHtmlExercisePayload { name: string; description: string | null; htmlContent: string; }

export async function createCompanyHtmlExercise(companyId: string, payload: CompanyHtmlExercisePayload, createdBy: string): Promise<CompanyHtmlExerciseRow> {
  const { data, error } = await supabase
    .from("company_html_exercises")
    .insert({ company_id: companyId, name: payload.name, description: payload.description, html_content: payload.htmlContent, created_by: createdBy })
    .select(SELECT)
    .single();
  if (error || !data) throw error ?? new Error("Erreur inconnue");
  return mapRow(data);
}

export async function updateCompanyHtmlExercise(id: string, payload: CompanyHtmlExercisePayload): Promise<void> {
  const { error } = await supabase
    .from("company_html_exercises")
    .update({ name: payload.name, description: payload.description, html_content: payload.htmlContent })
    .eq("id", id);
  if (error) throw error;
}

export async function toggleCompanyHtmlExerciseVisibility(id: string, isVisible: boolean): Promise<void> {
  const { error } = await supabase.from("company_html_exercises").update({ is_visible: isVisible }).eq("id", id);
  if (error) throw error;
}

export async function deleteCompanyHtmlExercise(id: string): Promise<void> {
  const { error } = await supabase.from("company_html_exercises").delete().eq("id", id);
  if (error) throw error;
}

export async function getCompanyHtmlExercise(id: string): Promise<CompanyHtmlExerciseRow | null> {
  const { data, error } = await supabase.from("company_html_exercises").select(SELECT).eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? mapRow(data) : null;
}
