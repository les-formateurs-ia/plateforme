// Couche d'accès "Entreprise" — liste des entreprises. Création réservée à
// l'admin côté RLS (migration 0053) ; le staff (admin+formateur) lit tout.
import { supabase } from "@/app/lib/supabase/client";
import type { Json } from "@/app/lib/supabase/database.types";

export interface CompanyRow {
  id: string;
  name: string;
  createdAt: string;
  employeeCount: number;
  city: string | null;
}

export async function listCompanies(): Promise<CompanyRow[]> {
  const { data: companies, error } = await supabase
    .from("companies")
    // « * » : la ville n'existe qu'après la migration 20261107120000.
    .select("*")
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

  return companies.map((c) => ({ id: c.id, name: c.name, createdAt: c.created_at, employeeCount: counts.get(c.id) ?? 0, city: c.city ?? null }));
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
  return { id: data.id, name: data.name, createdAt: data.created_at, employeeCount: 0, city: null };
}

export async function renameCompany(companyId: string, name: string): Promise<void> {
  const { error } = await supabase.from("companies").update({ name }).eq("id", companyId);
  if (error) throw error;
}

// ── Fiche entreprise (CRM) ────────────────────────────────────────────
// Migration 20261107120000_digiforma_import : identité légale, adresse et
// contacts, repris de Digiforma ou saisis ici. Ils préremplissent le
// dossier client des nouvelles sessions.

export type CompanyContactRole = "formation" | "finance" | "representant";
export const CONTACT_ROLE_LABELS: Record<CompanyContactRole, string> = {
  formation: "Contact formation", finance: "Contact facturation", representant: "Représentant légal",
};

export interface CompanyContact {
  civilite: string; prenom: string; nom: string; fonction: string; email: string; telephone: string;
}

export interface CompanyProfile {
  id: string;
  name: string;
  legalName: string;
  siret: string;
  vatNumber: string;
  apeCode: string;
  address: string;
  postalCode: string;
  city: string;
  country: string;
  email: string;
  phone: string;
  website: string;
  notes: string;
  contacts: Partial<Record<CompanyContactRole, CompanyContact>>;
  fromDigiforma: boolean;
}

export async function getCompanyProfile(companyId: string): Promise<CompanyProfile | null> {
  const { data, error } = await supabase.from("companies").select("*").eq("id", companyId).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const s = (v: string | null | undefined) => v ?? "";
  return {
    id: data.id, name: data.name, legalName: s(data.legal_name), siret: s(data.siret), vatNumber: s(data.vat_number),
    apeCode: s(data.ape_code), address: s(data.address), postalCode: s(data.postal_code), city: s(data.city),
    country: data.country ?? "France", email: s(data.email), phone: s(data.phone), website: s(data.website), notes: s(data.notes),
    contacts: (data.contacts ?? {}) as CompanyProfile["contacts"], fromDigiforma: data.digiforma_id != null,
  };
}

export async function updateCompanyProfile(p: CompanyProfile): Promise<void> {
  const n = (v: string) => v.trim() || null;
  const { error } = await supabase.from("companies").update({
    name: p.name.trim(), legal_name: n(p.legalName), siret: n(p.siret.replace(/\s/g, "")), vat_number: n(p.vatNumber),
    ape_code: n(p.apeCode), address: n(p.address), postal_code: n(p.postalCode), city: n(p.city), country: p.country.trim() || "France",
    email: n(p.email), phone: n(p.phone), website: n(p.website), notes: n(p.notes),
    contacts: Object.fromEntries(Object.entries(p.contacts).filter(([, c]) => c && (c.nom.trim() || c.email.trim()))) as unknown as Json,
  }).eq("id", p.id);
  if (error) throw error;
}

// Dossier client d'une session (Client des documents) depuis la fiche.
// Signataire : le représentant légal, à défaut le contact formation.
export function clientFromCompany(p: CompanyProfile) {
  const rep = p.contacts.representant ?? p.contacts.formation ?? null;
  return {
    type: "entreprise" as const,
    nom: p.legalName || p.name,
    adresse: p.address, codePostal: p.postalCode, ville: p.city,
    siret: p.siret || null,
    representant: rep ? { nom: [rep.prenom, rep.nom].filter(Boolean).join(" "), qualite: rep.fonction } : null,
    email: rep?.email || p.email,
  };
}
