// Génère le PDF envoyé au formateur à la validation d'une mission (cf.
// missionSubmissions.ts). Entièrement côté navigateur — pas de backend
// dédié au PDF dans ce projet.
//
// Le snapshot HTML (déjà figé — valeurs de formulaire gelées en attributs,
// cf. injectMissionBridge dans platformHtml.ts) est parsé avec DOMParser
// (qui n'exécute jamais les <script>, contrairement à une iframe) puis
// rejoué dans un conteneur détaché du document principal (style de l'entête
// + corps), attaché hors-écran le temps de la capture par html2canvas — plus
// sûr que de rendre ce HTML dans une iframe avec allow-same-origin.
import html2pdf from "html2pdf.js";

const A4_WIDTH_PX = 794; // ~210mm à 96dpi

export async function generateMissionPdf(snapshotHtml: string): Promise<Blob> {
  const parsed = new DOMParser().parseFromString(snapshotHtml, "text/html");

  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.left = "-9999px";
  container.style.top = "0";
  container.style.width = `${A4_WIDTH_PX}px`;
  container.style.background = "#fff";

  const style = document.createElement("style");
  style.textContent = Array.from(parsed.head.querySelectorAll("style")).map((s) => s.textContent ?? "").join("\n");
  container.appendChild(style);

  const body = document.createElement("div");
  body.innerHTML = parsed.body.innerHTML;
  container.appendChild(body);

  document.body.appendChild(container);
  try {
    const pdfBlob: Blob = await html2pdf()
      .from(container)
      .set({
        margin: 10,
        image: { type: "jpeg", quality: 0.95 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: "#ffffff" },
        jsPDF: { unit: "pt", format: "a4", orientation: "portrait" },
      })
      .outputPdf("blob");
    return pdfBlob;
  } finally {
    container.remove();
  }
}
