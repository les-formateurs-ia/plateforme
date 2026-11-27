// Côté navigateur de l'import d'un programme : Claude relève le document
// (fonction import-programme), puis la réponse est fusionnée dans la fiche.
import { DOCUMENT_ACCEPT, runDocumentTask, type DocumentStep } from "@/app/lib/claudeDocumentTask";
import { extractJson, mergeImportedProgramme, type ProgrammeImport } from "@/app/lib/documents/programmeImport";
import type { Formation } from "@/app/lib/documents/types";

export const PROGRAMME_ACCEPT = DOCUMENT_ACCEPT;
export type ImportStep = DocumentStep;

/**
 * Lit le programme, le fait relever par Claude et le fusionne dans base
 * (le programme de départ, dont les rubriques absentes du document sont
 * gardées et signalées).
 */
export async function importProgramme(file: File, base: Formation, onStep?: (step: ImportStep) => void): Promise<ProgrammeImport> {
  const text = await runDocumentTask("import-programme", file, { onStep });
  return mergeImportedProgramme(base, extractJson(text));
}
