// Uploads élève avec catégorie (ex. "Photo Générée") — bucket privé
// "company-student-uploads", chemin {company_id}/{student_id}/{uuid}-{filename}.
import { supabase } from "@/app/lib/supabase/client";

export interface CompanyStudentUploadRow {
  id: string;
  companyId: string;
  studentId: string;
  categoryId: string | null;
  categoryName: string | null;
  storagePath: string;
  fileName: string;
  createdAt: string;
}

interface Row {
  id: string; company_id: string; student_id: string; category_id: string | null;
  storage_path: string; file_name: string; created_at: string;
}

// Pas de jointure embarquée (company_file_categories(name)) : les types
// maison (database.types.ts) ne modélisent pas les relations de clé
// étrangère nécessaires à un embed typé — on récupère les catégories à
// part et on les mappe côté client, comme pour les tags ailleurs (voir
// listExerciseTagsForExercises).
async function attachCategoryNames(rows: Row[]): Promise<CompanyStudentUploadRow[]> {
  const categoryIds = [...new Set(rows.map((r) => r.category_id).filter((id): id is string => !!id))];
  const nameById = new Map<string, string>();
  if (categoryIds.length) {
    const { data, error } = await supabase.from("company_file_categories").select("id, name").in("id", categoryIds);
    if (error) throw error;
    for (const c of data ?? []) nameById.set(c.id, c.name);
  }
  return rows.map((r) => ({
    id: r.id, companyId: r.company_id, studentId: r.student_id, categoryId: r.category_id,
    categoryName: r.category_id ? (nameById.get(r.category_id) ?? null) : null,
    storagePath: r.storage_path, fileName: r.file_name, createdAt: r.created_at,
  }));
}

export async function listMyCompanyUploads(companyId: string, studentId: string): Promise<CompanyStudentUploadRow[]> {
  const { data, error } = await supabase
    .from("company_student_uploads")
    .select("id, company_id, student_id, category_id, storage_path, file_name, created_at")
    .eq("company_id", companyId)
    .eq("student_id", studentId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return attachCategoryNames(data ?? []);
}

export async function uploadCompanyStudentFile(
  companyId: string, studentId: string, categoryId: string | null, file: File,
): Promise<CompanyStudentUploadRow> {
  const storagePath = `${companyId}/${studentId}/${crypto.randomUUID()}-${file.name}`;
  const { error: uploadError } = await supabase.storage.from("company-student-uploads").upload(storagePath, file, { contentType: file.type });
  if (uploadError) throw uploadError;

  const { data, error } = await supabase
    .from("company_student_uploads")
    .insert({
      company_id: companyId, student_id: studentId, category_id: categoryId,
      storage_path: storagePath, file_name: file.name, mime_type: file.type || null, file_size: file.size,
    })
    .select("id, company_id, student_id, category_id, storage_path, file_name, created_at")
    .single();
  if (error || !data) { await supabase.storage.from("company-student-uploads").remove([storagePath]); throw error ?? new Error("Erreur inconnue"); }
  return { id: data.id, companyId: data.company_id, studentId: data.student_id, categoryId: data.category_id, categoryName: null, storagePath: data.storage_path, fileName: data.file_name, createdAt: data.created_at };
}

export async function deleteCompanyStudentUpload(id: string, storagePath: string): Promise<void> {
  await supabase.storage.from("company-student-uploads").remove([storagePath]);
  const { error } = await supabase.from("company_student_uploads").delete().eq("id", id);
  if (error) throw error;
}

export async function getCompanyStudentUploadUrl(storagePath: string): Promise<string> {
  const { data, error } = await supabase.storage.from("company-student-uploads").createSignedUrl(storagePath, 3600);
  if (error) throw error;
  return data.signedUrl;
}

// ── Staff : consultation des dépôts élèves d'une entreprise ────────────────

export async function listCompanyStudentUploads(companyId: string): Promise<CompanyStudentUploadRow[]> {
  const { data, error } = await supabase
    .from("company_student_uploads")
    .select("id, company_id, student_id, category_id, storage_path, file_name, created_at")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return attachCategoryNames(data ?? []);
}
