// Ouvre un document de formation seul dans un nouvel onglet, avec un bouton
// « Enregistrer en PDF » qui lance l'impression : le PDF suit alors la mise
// en page A4 (marges, liserés, pagination) et non la page web. L'export
// « Fichier > Exporter au format PDF » de Safari, lui, capture l'écran.
// La barre est ajoutée à l'ouverture, jamais au document archivé et signé.

const TOOLBAR = `
<div id="doc-toolbar" style="position:fixed;top:14px;right:14px;z-index:99;display:flex;gap:8px;align-items:center;font:500 13px 'Funnel Display','Helvetica Neue',Arial,sans-serif">
  <span style="color:#444;background:#fff;padding:9px 12px;border-radius:8px;box-shadow:0 2px 10px rgba(0,0,0,.12)">Destination : « Enregistrer au format PDF »</span>
  <button id="doc-print" type="button" style="font:inherit;font-weight:700;cursor:pointer;border:0;color:#fff;background:#111;padding:10px 16px;border-radius:8px;box-shadow:0 2px 10px rgba(0,0,0,.2)">Enregistrer en PDF</button>
</div>
<style>@media print { #doc-toolbar { display: none !important; } }</style>`;

const LOADING = `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><title>Chargement…</title></head><body style="font:14px Arial,sans-serif;color:#666;padding:32px">Chargement du document…</body></html>`;

/**
 * html peut être une promesse : l'onglet s'ouvre tout de suite (dans le
 * geste de l'utilisateur, sinon le navigateur bloque la fenêtre) puis se
 * remplit. print : la boîte d'impression s'ouvre dès que le document est prêt.
 */
export async function openDocument(html: string | Promise<string>, { print = false } = {}): Promise<void> {
  const w = window.open("", "_blank");
  if (!w) throw new Error("Le navigateur a bloqué l'ouverture du document : autorisez les fenêtres pour ce site.");
  if (typeof html !== "string") {
    w.document.write(LOADING);
    w.document.close();
  }
  let content: string;
  try {
    content = await html;
  } catch (err) {
    w.close();
    throw err;
  }
  w.document.open();
  w.document.write(content.includes("</body>") ? content.replace("</body>", `${TOOLBAR}</body>`) : content + TOOLBAR);
  w.document.close();
  const printNow = () => {
    w.focus();
    // Les polices (Funnel Display) doivent être chargées avant l'impression.
    const ready = w.document.fonts?.ready ?? Promise.resolve();
    void ready.then(() => setTimeout(() => w.print(), 120));
  };
  w.document.getElementById("doc-print")?.addEventListener("click", printNow);
  if (print) {
    if (w.document.readyState === "complete") printNow();
    else w.addEventListener("load", printNow, { once: true });
  }
}
