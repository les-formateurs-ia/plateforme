// Espace fichiers formateur → élèves d'une entreprise. Bucket privé
// "company-files" + URL signée (même pattern que rdv-bilan-attachments,
// voir lib/availability.ts).
import { supabase } from "@/app/lib/supabase/client";

export interface CompanyFileRow {
  id: string;
  companyId: string;
  name: string;
  description: string | null;
  storagePath: string;
  mimeType: string | null;
  fileSize: number | null;
  isVisible: boolean;
  createdAt: string;
}

function mapRow(row: {
  id: string; company_id: string; name: string; description: string | null; storage_path: string;
  mime_type: string | null; file_size: number | null; is_visible: boolean; created_at: string;
}): CompanyFileRow {
  return {
    id: row.id, companyId: row.company_id, name: row.name, description: row.description,
    storagePath: row.storage_path, mimeType: row.mime_type, fileSize: row.file_size,
    isVisible: row.is_visible, createdAt: row.created_at,
  };
}

export async function listCompanyFiles(companyId: string): Promise<CompanyFileRow[]> {
  const { data, error } = await supabase
    .from("company_files")
    .select("id, company_id, name, description, storage_path, mime_type, file_size, is_visible, created_at")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapRow);
}

export async function listVisibleCompanyFiles(companyId: string): Promise<CompanyFileRow[]> {
  const { data, error } = await supabase
    .from("company_files")
    .select("id, company_id, name, description, storage_path, mime_type, file_size, is_visible, created_at")
    .eq("company_id", companyId)
    .eq("is_visible", true)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapRow);
}

export async function uploadCompanyFile(
  companyId: string, name: string, description: string | null, file: File, uploadedBy: string,
): Promise<CompanyFileRow> {
  const storagePath = `${companyId}/${crypto.randomUUID()}-${file.name}`;
  const { error: uploadError } = await supabase.storage.from("company-files").upload(storagePath, file, { contentType: file.type });
  if (uploadError) throw uploadError;

  const { data, error } = await supabase
    .from("company_files")
    .insert({
      company_id: companyId, name, description, storage_path: storagePath,
      mime_type: file.type || null, file_size: file.size, uploaded_by: uploadedBy,
    })
    .select("id, company_id, name, description, storage_path, mime_type, file_size, is_visible, created_at")
    .single();
  if (error || !data) { await supabase.storage.from("company-files").remove([storagePath]); throw error ?? new Error("Erreur inconnue"); }
  return mapRow(data);
}

export async function toggleCompanyFileVisibility(id: string, isVisible: boolean): Promise<void> {
  const { error } = await supabase.from("company_files").update({ is_visible: isVisible }).eq("id", id);
  if (error) throw error;
}

export async function deleteCompanyFile(id: string, storagePath: string): Promise<void> {
  await supabase.storage.from("company-files").remove([storagePath]);
  const { error } = await supabase.from("company_files").delete().eq("id", id);
  if (error) throw error;
}

export async function getCompanyFileDownloadUrl(storagePath: string): Promise<string> {
  const { data, error } = await supabase.storage.from("company-files").createSignedUrl(storagePath, 3600);
  if (error) throw error;
  return data.signedUrl;
}
