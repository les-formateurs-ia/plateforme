// Compteurs affichés sur les tuiles de la fiche entreprise (vue staff) —
// requêtes count/head uniquement, aucune ligne rapatriée.
import { supabase } from "@/app/lib/supabase/client";

export interface CompanyOverview {
  employees: number;
  activated: number;
  positioning: number;
  validation: number;
  files: number;
  html: number;
  surveys: number;
  results: number;
  uploads: number;
  categories: number;
}

type CountTable =
  | "company_employees" | "company_positioning_tests" | "company_files" | "company_html_exercises"
  | "company_satisfaction_tests" | "company_positioning_attempts" | "company_satisfaction_responses"
  | "company_student_uploads" | "company_file_categories";

async function count(table: CountTable, companyId: string, filter?: (q: any) => any): Promise<number> {
  let query = supabase.from(table).select("id", { count: "exact", head: true }).eq("company_id", companyId);
  if (filter) query = filter(query);
  const { count: n, error } = await query;
  if (error) throw error;
  return n ?? 0;
}

export async function getCompanyOverview(companyId: string): Promise<CompanyOverview> {
  const [employees, activated, positioning, validation, files, html, surveys, attempts, responses, uploads, categories] = await Promise.all([
    count("company_employees", companyId),
    count("company_employees", companyId, (q) => q.not("invite_accepted_at", "is", null)),
    count("company_positioning_tests", companyId, (q) => q.eq("kind", "positioning")),
    count("company_positioning_tests", companyId, (q) => q.eq("kind", "validation")),
    count("company_files", companyId),
    count("company_html_exercises", companyId),
    count("company_satisfaction_tests", companyId),
    count("company_positioning_attempts", companyId),
    count("company_satisfaction_responses", companyId),
    count("company_student_uploads", companyId),
    count("company_file_categories", companyId),
  ]);
  return { employees, activated, positioning, validation, files, html, surveys, results: attempts + responses, uploads, categories };
}
