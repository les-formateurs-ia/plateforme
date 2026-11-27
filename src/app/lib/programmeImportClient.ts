// Côté navigateur de l'import d'un programme : lecture du fichier (Word par
// mammoth, PDF par pdf.js), envoi à la fonction import-programme (Claude via
// Runware), attente de la réponse, puis fusion dans la fiche programme.
// pdf.js et mammoth sont chargés à la demande.
import { supabase } from "@/app/lib/supabase/client";
import { convertDocxToHtml, renderPdfPagesToJpeg } from "@/app/lib/chatDocumentConversion";
import { extractJson, htmlToPlainText, mergeImportedProgramme, type ProgrammeImport } from "@/app/lib/documents/programmeImport";
import type { Formation } from "@/app/lib/documents/types";

export const PROGRAMME_ACCEPT = ".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const MAX_BYTES = 15 * 1024 * 1024;
// En dessous, le PDF est sans doute scanné : ses pages partent en images.
const MIN_PDF_TEXT = 300;
const MAX_SCANNED_PAGES = 12;
const POLL_MS = 3000;
const POLL_TIMEOUT_MS = 5 * 60_000;

export type ImportStep = "lecture" | "analyse";

async function functionError(error: { message: string; context?: Response }): Promise<string> {
  try {
    const body = await error.context?.clone().json();
    if (body?.error) return body.error;
  } catch {
    // corps non-JSON : on garde le message par défaut
  }
  return error.message;
}

async function invoke(body: Record<string, unknown>): Promise<{ status: string; text?: string; taskUUID?: string; error?: string }> {
  const { data, error } = await supabase.functions.invoke("import-programme", { body });
  if (error) throw new Error(await functionError(error));
  if (data?.error) throw new Error(data.error);
  return data;
}

async function pdfText(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  const { default: workerUrl } = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
  const task = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) });
  const doc = await task.promise;
  try {
    const pages: string[] = [];
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const { items } = await page.getTextContent();
      pages.push(items.map((it) => ("str" in it ? it.str + (it.hasEOL ? "\n" : " ") : "")).join("").replace(/[ \t]+/g, " "));
      page.cleanup();
    }
    return pages.join("\n\n").trim();
  } finally {
    await task.destroy();
  }
}

const blobToDataUrl = (blob: Blob) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result));
  reader.onerror = () => reject(reader.error);
  reader.readAsDataURL(blob);
});

async function readDocument(file: File): Promise<{ text?: string; images?: string[] }> {
  const name = file.name.toLowerCase();
  if (file.size > MAX_BYTES) throw new Error("Fichier trop lourd (15 Mo au plus).");
  if (name.endsWith(".docx")) {
    const text = htmlToPlainText(await convertDocxToHtml(file));
    if (!text) throw new Error("Ce document Word ne contient pas de texte.");
    return { text };
  }
  if (name.endsWith(".pdf") || file.type === "application/pdf") {
    const text = await pdfText(file);
    if (text.length >= MIN_PDF_TEXT) return { text };
    const pages = await renderPdfPagesToJpeg(file);
    if (pages.length > MAX_SCANNED_PAGES) throw new Error(`Ce PDF scanné compte ${pages.length} pages : ${MAX_SCANNED_PAGES} au plus.`);
    return { images: await Promise.all(pages.map(blobToDataUrl)) };
  }
  if (name.endsWith(".doc")) throw new Error("Ancien format Word (.doc) : enregistrez-le en .docx ou en PDF, puis réessayez.");
  throw new Error("Format non pris en charge : importez un PDF ou un document Word (.docx).");
}

/**
 * Lit le programme, le fait relever par Claude et le fusionne dans base
 * (le programme de départ, dont les rubriques absentes du document sont
 * gardées et signalées).
 */
export async function importProgramme(file: File, base: Formation, onStep?: (step: ImportStep) => void): Promise<ProgrammeImport> {
  onStep?.("lecture");
  const doc = await readDocument(file);
  onStep?.("analyse");
  let res = await invoke({ action: "start", fileName: file.name, ...doc });
  // Seule la soumission renvoie l'identifiant de la tâche : le suivi répond
  // { status: "pending" } sans le rappeler, on le garde donc ici.
  const taskUUID = res.taskUUID;
  const deadline = Date.now() + POLL_TIMEOUT_MS;
  while (res.status === "pending") {
    if (!taskUUID) throw new Error("Réponse inattendue du serveur (tâche sans identifiant).");
    if (Date.now() > deadline) throw new Error("Claude met trop de temps à lire ce programme : réessayez dans un instant.");
    await new Promise((r) => setTimeout(r, POLL_MS));
    res = await invoke({ action: "poll", taskUUID });
  }
  if (res.status === "failed") throw new Error(res.error ?? "La lecture du programme a échoué.");
  if (res.status !== "ready" || !res.text) throw new Error("Réponse inattendue du serveur.");
  return mergeImportedProgramme(base, extractJson(res.text));
}
