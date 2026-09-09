// Couche d'accès "Entreprise" — liste des entreprises. Création réservée à
// l'admin côté RLS (migration 0053) ; le staff (admin+formateur) lit tout.
import { supabase } from "@/app/lib/supabase/client";

export interface CompanyRow {
  id: string;
  name: string;
  createdAt: string;
  employeeCount: number;
}

export async function listCompanies(): Promise<CompanyRow[]> {
  const { data: companies, error } = await supabase
    .from("companies")
    .select("id, name, created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  if (!companies?.length) return [];

  const { data: employees, error: employeesError } = await supabase
    .from("company_employees")
    .select("company_id")
    .in("company_id", companies.map((c) => c.id));
  if (employeesError) throw employeesError;

  const counts = new Map<string, number>();
  for (const e of employees ?? []) counts.set(e.company_id, (counts.get(e.company_id) ?? 0) + 1);

  return companies.map((c) => ({ id: c.id, name: c.name, createdAt: c.created_at, employeeCount: counts.get(c.id) ?? 0 }));
}

export async function getCompany(companyId: string): Promise<{ id: string; name: string } | null> {
  const { data, error } = await supabase.from("companies").select("id, name").eq("id", companyId).maybeSingle();
  if (error) throw error;
  return data;
}

export async function createCompany(name: string, createdBy: string): Promise<CompanyRow> {
  const { data, error } = await supabase
    .from("companies")
    .insert({ name, created_by: createdBy })
    .select("id, name, created_at")
    .single();
  if (error || !data) throw error ?? new Error("Erreur inconnue");
  return { id: data.id, name: data.name, createdAt: data.created_at, employeeCount: 0 };
}

export async function renameCompany(companyId: string, name: string): Promise<void> {
  const { error } = await supabase.from("companies").update({ name }).eq("id", companyId);
  if (error) throw error;
}
