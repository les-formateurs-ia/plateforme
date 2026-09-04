// Cycle de vie "corbeille" des formations (templates) — réservé à l'admin
// côté DB (trigger formations_protect_soft_delete + policy admin_delete,
// cf. migration 0030). Un formateur qui appellerait ces fonctions recevrait
// une erreur Postgres, ces garde-fous côté client ne sont qu'un confort UX.
import { supabase } from "@/app/lib/supabase/client";
import type { FormationStatus } from "@/app/lib/supabase/database.types";

// Utilisé par le contexte de génération groupée (bulk-generation-context) une
// fois la génération des mindmaps de référence terminée, et pour repasser en
// 'generating' au lancement — un update ciblé plutôt que via saveCourse, qui
// réécrirait aussi tous les autres champs du formulaire.
export async function updateFormationStatus(formationId: string, status: FormationStatus): Promise<void> {
  const { error } = await supabase.from("formations").update({ status }).eq("id", formationId);
  if (error) throw error;
}

export interface TrashedFormationRow {
  id: string;
  name: string;
  description: string | null;
  deletedAt: string;
}

export async function softDeleteFormation(formationId: string): Promise<void> {
  const { error } = await supabase.from("formations").update({ deleted_at: new Date().toISOString() }).eq("id", formationId);
  if (error) throw error;
}

export async function restoreFormation(formationId: string): Promise<void> {
  const { error } = await supabase.from("formations").update({ deleted_at: null }).eq("id", formationId);
  if (error) throw error;
}

// Irréversible : supprime la ligne pour de bon (sections/leçons/quiz liés
// suivent par cascade). Aucun retour en arrière possible après cet appel.
export async function permanentlyDeleteFormation(formationId: string): Promise<void> {
  const { error } = await supabase.from("formations").delete().eq("id", formationId);
  if (error) throw error;
}

export async function listTrashedFormations(): Promise<TrashedFormationRow[]> {
  const { data, error } = await supabase
    .from("formations")
    .select("id, name, description, deleted_at")
    .not("deleted_at", "is", null)
    .order("deleted_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r) => ({ id: r.id, name: r.name, description: r.description, deletedAt: r.deleted_at as string }));
}
