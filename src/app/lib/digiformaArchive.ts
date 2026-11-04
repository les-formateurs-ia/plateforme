// Archives Digiforma : les PDF du dossier de chaque session reprise (devis
// signés, conventions, émargements, certificats…), dans le bucket privé
// digiforma-archives (migration 20261107120000_digiforma_import), lus et
// déposés par l'administrateur seul.
import { supabase } from "@/app/lib/supabase/client";
import type { ArchiveDocument, TrainingSession } from "@/app/lib/trainingSessions";

const BUCKET = "digiforma-archives";

export const ARCHIVE_CATEGORY_LABELS: Record<string, string> = {
  devis: "Devis", facture: "Factures", convention: "Conventions", programme: "Programme", convocation: "Convocations",
  emargement: "Émargements", attestations: "Certificats et attestations", intervenant: "Intervenants",
  supports: "Supports remis aux stagiaires", autre: "Autres documents",
};

// Lien temporaire (10 minutes) vers un document archivé.
export async function archiveDocumentUrl(chemin: string): Promise<string> {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(chemin, 600);
  if (error || !data) throw new Error("Document introuvable : importez d'abord le dossier Digiforma (page Sessions).");
  return data.signedUrl;
}

export type ArchiveUploadResult = { uploaded: number; skipped: number; errors: string[] };

// Dépôt du dossier « Sessions » de l'export Digiforma, choisi dans le
// navigateur : chaque fichier « … (AF…)/<sous-dossier>/<fichier> » rejoint
// le document attendu par la session de même code. Les fichiers inconnus
// (sessions non reprises, particuliers) sont ignorés.
export async function uploadDigiformaFolder(
  files: File[], sessions: TrainingSession[], onProgress?: (done: number, total: number) => void,
): Promise<ArchiveUploadResult> {
  const byKey = new Map<string, ArchiveDocument>();
  for (const s of sessions) {
    for (const d of s.archive?.documents ?? []) byKey.set(`${s.archive!.code}/${d.dossier}/${d.nom}`.normalize("NFC"), d);
  }
  const jobs: { file: File; doc: ArchiveDocument }[] = [];
  let skipped = 0;
  for (const file of files) {
    const parts = (file.webkitRelativePath || file.name).normalize("NFC").split("/");
    const code = parts.slice(0, -2).map((p) => p.match(/\((AF\d+)\)$/)?.[1]).find(Boolean);
    const doc = code ? byKey.get(`${code}/${parts[parts.length - 2]}/${parts[parts.length - 1]}`) : undefined;
    if (doc) jobs.push({ file, doc }); else skipped++;
  }
  const result: ArchiveUploadResult = { uploaded: 0, skipped, errors: [] };
  const total = jobs.length;
  let done = 0;
  const worker = async () => {
    for (let job = jobs.shift(); job; job = jobs.shift()) {
      const { error } = await supabase.storage.from(BUCKET).upload(job.doc.chemin, job.file, {
        upsert: true, contentType: job.file.type || "application/octet-stream",
      });
      if (error) result.errors.push(`${job.doc.nom} : ${error.message}`); else result.uploaded++;
      onProgress?.(++done, total);
    }
  };
  onProgress?.(0, total);
  await Promise.all(Array.from({ length: 4 }, worker));
  return result;
}
