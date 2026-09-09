// Collaborateurs d'une entreprise — liste gérée par l'admin (Nom/Prénom/
// Email), lue par tout le staff. L'envoi d'accès passe par l'Edge Function
// send-company-invite (service-role : crée le compte auth + relie
// profile_id, ce qu'une simple écriture RLS ne peut pas faire).
import { supabase } from "@/app/lib/supabase/client";

export interface CompanyEmployeeRow {
  id: string;
  companyId: string;
  firstName: string;
  lastName: string;
  email: string;
  profileId: string | null;
  inviteSentAt: string | null;
  inviteAcceptedAt: string | null;
}

function mapRow(row: {
  id: string; company_id: string; first_name: string; last_name: string; email: string;
  profile_id: string | null; invite_sent_at: string | null; invite_accepted_at: string | null;
}): CompanyEmployeeRow {
  return {
    id: row.id,
    companyId: row.company_id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    profileId: row.profile_id,
    inviteSentAt: row.invite_sent_at,
    inviteAcceptedAt: row.invite_accepted_at,
  };
}

export async function listCompanyEmployees(companyId: string): Promise<CompanyEmployeeRow[]> {
  const { data, error } = await supabase
    .from("company_employees")
    .select("id, company_id, first_name, last_name, email, profile_id, invite_sent_at, invite_accepted_at")
    .eq("company_id", companyId)
    .order("last_name", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(mapRow);
}

export async function addCompanyEmployee(companyId: string, firstName: string, lastName: string, email: string): Promise<CompanyEmployeeRow> {
  const { data, error } = await supabase
    .from("company_employees")
    .insert({ company_id: companyId, first_name: firstName, last_name: lastName, email })
    .select("id, company_id, first_name, last_name, email, profile_id, invite_sent_at, invite_accepted_at")
    .single();
  if (error || !data) throw error ?? new Error("Erreur inconnue");
  return mapRow(data);
}

export async function updateCompanyEmployee(id: string, firstName: string, lastName: string, email: string): Promise<void> {
  const { error } = await supabase.from("company_employees").update({ first_name: firstName, last_name: lastName, email }).eq("id", id);
  if (error) throw error;
}

export async function deleteCompanyEmployee(id: string): Promise<void> {
  const { error } = await supabase.from("company_employees").delete().eq("id", id);
  if (error) throw error;
}

export interface SendInvitesResult {
  sent: string[];
  skipped: string[];
  errors: { employeeId: string; message: string }[];
}

// Envoie (ou pour un seul élève) le mail d'accès. Les employés déjà invités
// (profile_id renseigné) sont ignorés côté fonction — pas de relance en V1.
export async function sendCompanyInvites(employeeIds: string[]): Promise<SendInvitesResult> {
  const { data, error } = await supabase.functions.invoke("send-company-invite", { body: { employeeIds } });
  if (error) throw error;
  return data as SendInvitesResult;
}
