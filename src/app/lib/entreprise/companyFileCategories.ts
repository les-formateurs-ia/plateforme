// Catégories de fichiers élève (ex. "Photo Générée") — créées par le staff,
// utilisées par l'élève au moment de l'upload (lib/companyStudentUploads.ts).
import { supabase } from "@/app/lib/supabase/client";

export interface CompanyFileCategoryRow { id: string; companyId: string; name: string; }

export async function listCompanyFileCategories(companyId: string): Promise<CompanyFileCategoryRow[]> {
  const { data, error } = await supabase
    .from("company_file_categories")
    .select("id, company_id, name")
    .eq("company_id", companyId)
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((c) => ({ id: c.id, companyId: c.company_id, name: c.name }));
}

export async function createCompanyFileCategory(companyId: string, name: string): Promise<CompanyFileCategoryRow> {
  const { data, error } = await supabase
    .from("company_file_categories")
    .insert({ company_id: companyId, name })
    .select("id, company_id, name")
    .single();
  if (error || !data) throw error ?? new Error("Erreur inconnue");
  return { id: data.id, companyId: data.company_id, name: data.name };
}

export async function deleteCompanyFileCategory(id: string): Promise<void> {
  const { error } = await supabase.from("company_file_categories").delete().eq("id", id);
  if (error) throw error;
}
