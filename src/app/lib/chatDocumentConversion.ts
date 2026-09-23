// Conversions faites dans le navigateur avant l'envoi d'un fichier au chat du
// Studio (cf. studioChat.ts) — l'edge function Deno n'a pas de canvas pour
// rendre un PDF, et mammoth tourne déjà côté client ailleurs dans l'app.
// Chargées à la demande : pdfjs/mammoth ne pèsent pas sur le bundle initial.

const PAGE_MAX_SIDE_PX = 1400;
const JPEG_QUALITY = 0.82;

export async function renderPdfPagesToJpeg(file: File): Promise<Blob[]> {
  const pdfjs = await import("pdfjs-dist");
  const { default: workerUrl } = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

  const loadingTask = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) });
  const doc = await loadingTask.promise;
  try {
    const pages: Blob[] = [];
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const base = page.getViewport({ scale: 1 });
      const viewport = page.getViewport({ scale: PAGE_MAX_SIDE_PX / Math.max(base.width, base.height) });
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(viewport.width);
      canvas.height = Math.round(viewport.height);
      await page.render({ canvas, viewport }).promise;
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY));
      if (!blob) throw new Error("Conversion d'une page PDF impossible.");
      pages.push(blob);
      page.cleanup();
    }
    return pages;
  } finally {
    await loadingTask.destroy();
  }
}

// HTML plutôt que texte brut : garde titres, listes et tableaux lisibles par
// le modèle. Les images intégrées (data URI énormes) sont retirées.
export async function convertDocxToHtml(file: File): Promise<string> {
  const mammoth = await import("mammoth");
  const { value } = await mammoth.convertToHtml({ arrayBuffer: await file.arrayBuffer() });
  return value.replace(/<img[^>]*>/g, "[image]");
}
