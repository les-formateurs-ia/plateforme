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
  // IMPORTANT : "position: fixed" n'a pas de offsetParent (null dans la
  // plupart des moteurs) — html2canvas s'appuie sur cette chaîne pour situer
  // l'élément et produit alors une capture vide. "absolute" à (0,0) avec un
  // z-index négatif reste invisible (toujours sous le reste de la page) sans
  // casser ce calcul de position.
  container.style.position = "absolute";
  container.style.top = "0";
  container.style.left = "0";
  container.style.zIndex = "-1000";
  container.style.pointerEvents = "none";
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
    // Laisse le navigateur poser la mise en page du conteneur fraîchement
    // attaché (largeurs/hauteurs "auto") avant que html2canvas ne mesure quoi
    // que ce soit — un seul tick JS ne suffit pas toujours.
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

    if (!body.textContent?.trim() && !body.querySelector("img")) {
      console.warn("generateMissionPdf: le contenu à capturer semble vide — le PDF risque d'être blanc.");
    }

    const pdfBlob: Blob = await html2pdf()
      .from(container)
      .set({
        margin: 10,
        image: { type: "jpeg", quality: 0.95 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          backgroundColor: "#ffffff",
          windowWidth: A4_WIDTH_PX,
          x: 0,
          y: 0,
          scrollX: 0,
          scrollY: 0,
        },
        jsPDF: { unit: "pt", format: "a4", orientation: "portrait" },
      })
      .outputPdf("blob");
    return pdfBlob;
  } finally {
    container.remove();
  }
}
