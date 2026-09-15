import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { planPdfPages, type PrintInterval } from "./missionPdfPagination";

const PAGE_WIDTH_MM = 210;
const PAGE_HEIGHT_MM = 297;
const MARGIN_MM = 15;
const FOOTER_MM = 7;
// Match the printable width exactly, not a full A4 sheet inside narrower margins.
const CONTENT_WIDTH_PX = Math.floor((PAGE_WIDTH_MM - 2 * MARGIN_MM) * 96 / 25.4);
const MM_PER_PX = (PAGE_WIDTH_MM - 2 * MARGIN_MM) / CONTENT_WIDTH_PX;
const PAGE_HEIGHT_PX = Math.floor((PAGE_HEIGHT_MM - 2 * MARGIN_MM - FOOTER_MM) / MM_PER_PX);

const PRINT_CSS = `
  html { background: #fff !important; overflow: hidden !important; }
  body {
    display: flow-root !important; margin: 0 !important; padding: 0 0 12px !important; width: 100% !important;
    min-width: 0 !important; max-width: none !important;
    height: auto !important; min-height: 0 !important; background: #fff !important;
  }
  *, *::before, *::after { box-sizing: border-box; animation: none !important; transition: none !important; }
  body * { overflow-wrap: anywhere; }
  img, svg, canvas, video { max-width: 100% !important; object-fit: contain; }
  img { height: auto; }
  table { width: 100% !important; max-width: 100% !important; table-layout: auto; }
  table { font-size: 0.9em; line-height: 1.5; }
  th, td { min-width: 0 !important; overflow-wrap: break-word; word-break: normal; }
  pre { white-space: pre-wrap !important; overflow-wrap: anywhere !important; }
  [data-pdf-field] {
    display: block !important; height: auto !important; max-height: none !important;
    min-height: 1.5em; white-space: pre-wrap !important; overflow: visible !important;
    border: 1px solid #d8d8d8; border-radius: 4px; padding: 8px; font: inherit;
  }
  [hidden], input[type=hidden], [data-pdf-hide], .no-print { display: none !important; }
`;

function expandFormFields(doc: Document): void {
  doc.querySelectorAll("textarea, input, select").forEach((field) => {
    const input = field as HTMLInputElement;
    if (input.tagName === "INPUT" && ["hidden", "button", "submit", "reset", "image"].includes(input.type)) {
      field.remove();
      return;
    }
    const replacement = doc.createElement("div");
    replacement.className = field.className;
    replacement.id = field.id;
    replacement.setAttribute("data-pdf-field", "");
    if (input.tagName === "INPUT" && ["checkbox", "radio"].includes(input.type)) {
      replacement.textContent = input.checked ? "[x]" : "[ ]";
      replacement.style.setProperty("display", "inline-block", "important");
      replacement.style.padding = "0 4px";
      replacement.style.border = "0";
    } else if (field.tagName === "SELECT") {
      replacement.textContent = Array.from((field as HTMLSelectElement).selectedOptions)
        .map((option) => option.textContent).join(", ");
    } else {
      replacement.textContent = (field as HTMLInputElement | HTMLTextAreaElement).value;
    }
    if ((field as HTMLElement).hidden) replacement.hidden = true;
    field.replaceWith(replacement);
  });
}

// Preserve body styles, CSS variables and fonts in an isolated document.
// The sandbox and CSP prevent lesson scripts/handlers from accessing the app.
function prepareDocument(snapshotHtml: string): string {
  const doc = new DOMParser().parseFromString(snapshotHtml, "text/html");
  doc.querySelectorAll("script, iframe, object, embed, base, meta[http-equiv]").forEach((el) => el.remove());
  doc.querySelectorAll("*").forEach((el) => {
    Array.from(el.attributes).forEach((attr) => {
      if (/^on/i.test(attr.name) || /^(?:javascript|vbscript):/i.test(attr.value.trim())) el.removeAttribute(attr.name);
    });
  });
  expandFormFields(doc);
  const policy = doc.createElement("meta");
  policy.httpEquiv = "Content-Security-Policy";
  policy.content = "script-src 'none'; object-src 'none'; frame-src 'none'; connect-src 'none'; form-action 'none'; base-uri 'none'";
  doc.head.prepend(policy);
  const style = doc.createElement("style");
  style.textContent = PRINT_CSS;
  doc.head.append(style);
  return `<!doctype html>${doc.documentElement.outerHTML}`;
}

function applyPrintLayout(doc: Document): void {
  // html2canvas uses screen styles. Also activate the author's print overrides.
  function activatePrintRules(rules: CSSRuleList): void {
    Array.from(rules).forEach((rule) => {
      if (rule.type === 4) {
        const media = rule as CSSMediaRule;
        if (/\bprint\b/.test(media.conditionText) && !/\bnot\s+print\b/.test(media.conditionText)) media.media.mediaText = "all";
        activatePrintRules(media.cssRules);
      }
    });
  }
  Array.from(doc.styleSheets).forEach((sheet) => {
    try { activatePrintRules(sheet.cssRules); } catch { /* Cross-origin font stylesheets. */ }
  });
  const win = doc.defaultView!;
  doc.body.querySelectorAll<HTMLElement>("*").forEach((el) => {
    const style = win.getComputedStyle(el);
    if (style.display === "none") return;
    if (style.display === "grid" && style.gridTemplateColumns.split(" ").length > 2 &&
      Array.from(el.children).some((child) => (child.textContent?.length ?? 0) > 180)) {
      el.style.setProperty("grid-template-columns", "repeat(2, minmax(0, 1fr))", "important");
    }
    if (style.position === "fixed" || style.position === "sticky") el.style.setProperty("position", "static", "important");
    if (!["IMG", "SVG", "CANVAS", "VIDEO"].includes(el.tagName)) {
      if (el.scrollHeight > el.clientHeight + 1 && /(auto|scroll|hidden|clip)/.test(style.overflowY)) {
        el.style.setProperty("height", "auto", "important");
        el.style.setProperty("max-height", "none", "important");
        el.style.setProperty("overflow", "visible", "important");
      }
      if (el.scrollWidth > CONTENT_WIDTH_PX || el.getBoundingClientRect().width > CONTENT_WIDTH_PX) {
        el.style.setProperty("min-width", "0", "important");
        el.style.setProperty("max-width", "100%", "important");
      }
    }
  });
  doc.querySelectorAll<HTMLTableElement>("table").forEach((table) => {
    if (table.scrollWidth > CONTENT_WIDTH_PX) {
      table.style.tableLayout = "fixed";
      table.querySelectorAll<HTMLElement>("th, td").forEach((cell) => { cell.style.overflowWrap = "anywhere"; });
    }
  });
}

function measurePageBreaks(doc: Document): { lines: PrintInterval[]; blocks: PrintInterval[]; forced: number[] } {
  const rootTop = doc.body.getBoundingClientRect().top;
  const lines: PrintInterval[] = [];
  const blocks: PrintInterval[] = [];
  const forced: number[] = [];
  const interval = (rect: DOMRect): PrintInterval => ({ start: Math.max(0, rect.top - rootTop - 1), end: rect.bottom - rootTop + 1 });
  const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
  const range = doc.createRange();
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (!node.textContent?.trim() || node.parentElement?.closest("style, script")) continue;
    range.selectNodeContents(node);
    Array.from(range.getClientRects()).filter((r) => r.width && r.height).forEach((r) => lines.push(interval(r)));
  }
  doc.body.querySelectorAll<HTMLElement>("*").forEach((el) => {
    const rect = el.getBoundingClientRect();
    if (!rect.height || !rect.width) return;
    const style = doc.defaultView!.getComputedStyle(el);
    if (style.visibility === "hidden") return;
    const bounds = interval(rect);
    if (/^(page|always|left|right)$/.test(style.breakBefore)) forced.push(Math.max(0, rect.top - rootTop));
    if (/^(page|always|left|right)$/.test(style.breakAfter) || el.classList.contains("html2pdf__page-break")) forced.push(rect.bottom - rootTop);
    // Adjacent table rows share an edge: padding their protected bounds would
    // overlap every row and push an entire table backwards, one row per page.
    if (el.matches("img, svg, canvas, video, tr")) lines.push({ start: rect.top - rootTop, end: rect.bottom - rootTop });
    if (el.matches("p, li, blockquote, pre, figure, [data-pdf-field]") || /avoid/.test(style.breakInside)) blocks.push(bounds);
    if (el.matches("div, section, aside") && parseFloat(style.borderTopWidth) > 0 && rect.height < PAGE_HEIGHT_PX) blocks.push(bounds);
    if (el.matches("h1, h2, h3, h4, h5, h6, label, thead")) {
      const nextLine = lines.filter((line) => line.start >= bounds.end - 1).sort((a, b) => a.start - b.start)[0];
      blocks.push({ start: bounds.start, end: nextLine?.end ?? bounds.end });
    }
    if (el.tagName === "FOOTER" && el.previousElementSibling && rect.height < PAGE_HEIGHT_PX * 0.2) {
      blocks.push({ start: interval(el.previousElementSibling.getBoundingClientRect()).start, end: bounds.end });
    }
  });
  return { lines, blocks, forced };
}

export async function generateMissionPdf(snapshotHtml: string): Promise<Blob> {
  const frame = document.createElement("iframe");
  frame.setAttribute("sandbox", "allow-same-origin");
  frame.setAttribute("aria-hidden", "true");
  frame.setAttribute("scrolling", "no");
  frame.tabIndex = -1;
  frame.style.cssText = `position:fixed;left:-10000px;top:0;width:${CONTENT_WIDTH_PX}px;height:1000px;border:0;pointer-events:none;`;
  try {
    const loaded = new Promise<void>((resolve, reject) => {
      const timeout = window.setTimeout(() => reject(new Error("Le document de la mission n'a pas pu être préparé pour le PDF.")), 15000);
      frame.onload = () => { clearTimeout(timeout); resolve(); };
    });
    frame.srcdoc = prepareDocument(snapshotHtml);
    document.body.append(frame);
    await loaded;
    const doc = frame.contentDocument!;
    await doc.fonts.ready;
    await Promise.all(Array.from(doc.images).map((img) => img.decode().catch(() => undefined)));
    applyPrintLayout(doc);
    await doc.fonts.ready;
    if (!doc.body.textContent?.trim() && !doc.body.querySelector("img, svg, canvas")) throw new Error("La mission est vide : impossible de générer le PDF.");
    const height = Math.ceil(doc.body.getBoundingClientRect().height);
    const { lines, blocks, forced } = measurePageBreaks(doc);
    const pages = planPdfPages(height, PAGE_HEIGHT_PX, lines, blocks, forced);
    const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait", compress: true });
    pdf.setProperties({ title: doc.title || "Mission", creator: "Plateforme - Missions" });
    for (let index = 0; index < pages.length; index++) {
      const page = pages[index];
      // Bounded canvases avoid the browser's canvas height limit on long submissions.
      // Create the canvas in the source document so its web fonts are available.
      const pageCanvas = doc.createElement("canvas");
      pageCanvas.width = CONTENT_WIDTH_PX * 2;
      pageCanvas.height = Math.ceil((page.end - page.start) * 2);
      const canvas = await html2canvas(doc.body, {
        canvas: pageCanvas,
        scale: 2, useCORS: true, backgroundColor: "#ffffff", logging: false,
        windowWidth: CONTENT_WIDTH_PX, windowHeight: 1000, scrollX: 0, scrollY: 0,
        x: 0, y: page.start, width: CONTENT_WIDTH_PX, height: page.end - page.start,
      });
      if (index) pdf.addPage();
      pdf.addImage(canvas, "PNG", MARGIN_MM, MARGIN_MM, PAGE_WIDTH_MM - 2 * MARGIN_MM, (page.end - page.start) * MM_PER_PX);
      canvas.width = canvas.height = 0;
      pdf.setDrawColor(220);
      pdf.line(MARGIN_MM, PAGE_HEIGHT_MM - MARGIN_MM - 3, PAGE_WIDTH_MM - MARGIN_MM, PAGE_HEIGHT_MM - MARGIN_MM - 3);
      pdf.setFontSize(8);
      pdf.setTextColor(115);
      pdf.text(`${index + 1} / ${pages.length}`, PAGE_WIDTH_MM / 2, PAGE_HEIGHT_MM - MARGIN_MM + 1, { align: "center" });
    }
    return pdf.output("blob");
  } finally {
    frame.remove();
  }
}
