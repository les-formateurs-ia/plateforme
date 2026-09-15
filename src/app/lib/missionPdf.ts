// Génère le PDF envoyé au formateur à la validation d'une mission (cf.
// missionSubmissions.ts). Entièrement côté navigateur — pas de backend
// dédié au PDF dans ce projet.
//
// Le snapshot HTML (déjà figé — valeurs de formulaire gelées, cf.
// injectMissionBridge dans platformHtml.ts) est parsé avec DOMParser (qui
// n'exécute jamais les <script>, contrairement à une iframe) puis rejoué
// dans un conteneur détaché du document principal, le temps de la capture
// par html2canvas — plus sûr que de rendre ce HTML dans une iframe avec
// allow-same-origin.
import html2pdf from "html2pdf.js";

const A4_WIDTH_PX = 794; // ~210mm à 96dpi

// html2canvas (version embarquée par html2pdf.js) mesure une hauteur de 0
// dès que l'élément capturé est en "position: absolute" ou "fixed" — même
// avec un offsetParent valide — ce qui produit un PDF blanc (vérifié :
// position statique → capture correcte, position absolute/fixed → capture
// vide, à taille de contenu identique). On garde donc le conteneur en flux
// normal ("static") et on le rend invisible via un wrapper "height:0;
// overflow:hidden" plutôt qu'un positionnement hors-écran.
function createOffscreenWrapper(width: number): { wrapper: HTMLDivElement; container: HTMLDivElement } {
  const wrapper = document.createElement("div");
  wrapper.style.height = "0";
  wrapper.style.overflow = "hidden";

  const container = document.createElement("div");
  container.style.width = `${width}px`;
  container.style.background = "#fff";
  wrapper.appendChild(container);

  return { wrapper, container };
}

// Un <textarea>/<input> natif n'affiche que ce qui tient dans sa boîte
// (scroll interne) — html2canvas capture le rendu visuel tel quel, donc une
// réponse longue serait tronquée dans le PDF. On remplace chaque champ par
// un bloc de texte statique en hauteur libre pour que tout le contenu soit
// visible sur le document final.
function expandFormFieldsForPrint(root: HTMLElement): void {
  root.querySelectorAll("textarea").forEach((el) => {
    const div = document.createElement("div");
    div.textContent = el.value;
    div.style.cssText = "white-space:pre-wrap;word-break:break-word;border:1px solid #ccc;border-radius:4px;padding:8px;font:inherit;min-height:1.4em;";
    el.replaceWith(div);
  });
  root.querySelectorAll("input").forEach((el) => {
    if (el.type === "checkbox" || el.type === "radio") {
      const span = document.createElement("span");
      span.textContent = el.checked ? "☑" : "☐";
      span.style.cssText = "font-size:1.1em;";
      el.replaceWith(span);
      return;
    }
    const span = document.createElement("span");
    span.textContent = el.value;
    span.style.cssText = "display:inline-block;border-bottom:1px solid #999;padding:2px 4px;min-width:60px;white-space:pre-wrap;word-break:break-word;font:inherit;";
    el.replaceWith(span);
  });
  root.querySelectorAll("select").forEach((el) => {
    const span = document.createElement("span");
    span.textContent = el.selectedOptions[0]?.textContent ?? el.value;
    span.style.cssText = "display:inline-block;border-bottom:1px solid #999;padding:2px 4px;font:inherit;";
    el.replaceWith(span);
  });
}

export async function generateMissionPdf(snapshotHtml: string): Promise<Blob> {
  const parsed = new DOMParser().parseFromString(snapshotHtml, "text/html");

  const { wrapper, container } = createOffscreenWrapper(A4_WIDTH_PX);

  const style = document.createElement("style");
  style.textContent = Array.from(parsed.head.querySelectorAll("style")).map((s) => s.textContent ?? "").join("\n");
  container.appendChild(style);

  const body = document.createElement("div");
  body.innerHTML = parsed.body.innerHTML;
  expandFormFieldsForPrint(body);
  container.appendChild(body);

  document.body.appendChild(wrapper);
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
        },
        jsPDF: { unit: "pt", format: "a4", orientation: "portrait" },
      })
      .outputPdf("blob");
    return pdfBlob;
  } finally {
    wrapper.remove();
  }
}
