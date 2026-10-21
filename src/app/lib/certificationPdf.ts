// PDF de l'épreuve écrite (admin) : sujet complet + réponses de l'élève,
// visuel de l'exercice 2 inclus. Construit en texte avec jsPDF (et non par
// capture d'écran comme missionPdf.ts) pour rester léger et sélectionnable.
import { jsPDF } from "jspdf";
import {
  EXAM_CERTIFICATION_TITLE, EXAM_EXERCISES, EXAM_IDENTITY_FIELDS, EXAM_INTRO, type ExamBlock, type ExamField,
} from "@/app/data/certificationExam";
import { getExamImageUrl, formatDateFR, type CertificationExam } from "@/app/lib/certification";

const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 18;
const CONTENT_W = PAGE_W - 2 * MARGIN;
const NAVY: [number, number, number] = [31, 51, 80];
const ACCENT: [number, number, number] = [232, 145, 107];
const GREY: [number, number, number] = [70, 70, 70];

// Les polices standard de jsPDF ne couvrent que le Latin-1.
function pdfText(s: string): string {
  return s
    .replace(/[’‘‛]/g, "'").replace(/[“”„]/g, "\"")
    .replace(/œ/g, "oe").replace(/Œ/g, "OE")
    .replace(/€/g, " EUR").replace(/[–—]/g, "-").replace(/…/g, "...")
    .replace(/[  ]/g, " ")
    .replace(/[^\n\x20-\xff]/g, "");
}

function stripMarkup(s: string): string {
  return s.replace(/\*\*|\/\/|\+\+/g, "");
}

async function imageAsDataUrl(path: string): Promise<{ data: string; w: number; h: number } | null> {
  try {
    const url = await getExamImageUrl(path);
    const blob = await (await fetch(url)).blob();
    const bitmap = await createImageBitmap(blob);
    // Ré-encodé en JPEG via un canvas : jsPDF ne lit pas le WebP.
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0);
    return { data: canvas.toDataURL("image/jpeg", 0.9), w: bitmap.width, h: bitmap.height };
  } catch (err) {
    console.error(err);
    return null;
  }
}

export async function generateCertificationPdf(exam: CertificationExam, studentName: string): Promise<Blob> {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = MARGIN;

  const ensure = (h: number) => {
    if (y + h > PAGE_H - MARGIN) { doc.addPage(); y = MARGIN; }
  };
  const write = (text: string, opts: { size?: number; style?: "normal" | "bold" | "italic" | "bolditalic"; color?: [number, number, number]; align?: "left" | "center"; gap?: number; indent?: number } = {}) => {
    const { size = 10.5, style = "normal", color = GREY, align = "left", gap = 2.5, indent = 0 } = opts;
    doc.setFont("helvetica", style);
    doc.setFontSize(size);
    doc.setTextColor(...color);
    const lineH = size * 0.45;
    const lines: string[] = doc.splitTextToSize(pdfText(text), CONTENT_W - indent);
    for (const line of lines) {
      ensure(lineH);
      doc.text(line, align === "center" ? PAGE_W / 2 : MARGIN + indent, y + lineH * 0.8, { align });
      y += lineH;
    }
    y += gap;
  };
  const blocks = (list: ExamBlock[]) => {
    for (const b of list) {
      if (b.type === "p") {
        const italic = b.text.startsWith("//") || b.text.startsWith("**//");
        const bold = b.text.startsWith("**") || b.text.startsWith("++**");
        write(stripMarkup(b.text), { style: bold && italic ? "bolditalic" : bold ? "bold" : italic ? "italic" : "normal" });
      } else {
        for (const it of b.items) write(`•  ${stripMarkup(it)}`, { indent: 4, gap: 1 });
        y += 1.5;
      }
    }
  };
  const answer = async (field: ExamField) => {
    const value = exam.answers[field.id];
    if (field.kind === "table") {
      const rows = Array.isArray(value) ? value.filter((r) => r.some((c) => c.trim())) : [];
      if (!rows.length) { write("Pas de réponse", { style: "italic", color: [150, 150, 150] }); return; }
      rows.forEach((row, i) => {
        ensure(12);
        doc.setFillColor(...NAVY);
        doc.rect(MARGIN, y, CONTENT_W, 6, "F");
        doc.setFont("helvetica", "bold"); doc.setFontSize(9.5); doc.setTextColor(255, 255, 255);
        doc.text(`Ligne ${i + 1}`, MARGIN + 2, y + 4.2);
        y += 8;
        field.columns.forEach((col, c) => {
          write(`${col} :`, { style: "bold", size: 9.5, color: NAVY, gap: 0.5, indent: 2 });
          write(row[c]?.trim() || "-", { size: 10, gap: 2, indent: 2 });
        });
        y += 2;
      });
      return;
    }
    write(field.answerLabel, { color: ACCENT, gap: 1.5 });
    if (field.kind === "image") {
      const img = typeof value === "string" && value ? await imageAsDataUrl(value) : null;
      if (!img) { write(value ? "Visuel indisponible" : "Pas de réponse", { style: "italic", color: [150, 150, 150] }); return; }
      const maxH = 120;
      let w = CONTENT_W;
      let h = (img.h / img.w) * w;
      if (h > maxH) { h = maxH; w = (img.w / img.h) * h; }
      ensure(h + 4);
      doc.addImage(img.data, "JPEG", MARGIN, y, w, h);
      y += h + 5;
      return;
    }
    const text = typeof value === "string" ? value.trim() : "";
    write(text || "Pas de réponse", text ? { color: [20, 20, 20] } : { style: "italic", color: [150, 150, 150] });
  };

  // ── Page de garde ──
  write("InKréa Certifications", { size: 11, style: "bold", color: NAVY, align: "center", gap: 6 });
  write("CERTIFICATION :", { size: 12, style: "bold", color: ACCENT, align: "center" });
  write(EXAM_CERTIFICATION_TITLE, { size: 14, style: "bold", color: NAVY, align: "center", gap: 4 });
  write("SUJET DE VOTRE EVALUATION", { size: 16, style: "bold", color: NAVY, align: "center", gap: 8 });
  write("Veuillez indiquer :", { style: "bold", color: NAVY, gap: 1.5 });
  for (const f of EXAM_IDENTITY_FIELDS) {
    const v = exam.answers[f.id];
    write(`${f.label} ${typeof v === "string" && v.trim() ? v.trim() : "-"}`, { gap: 1.5 });
  }
  y += 3;
  blocks(EXAM_INTRO);
  y += 2;
  write(`Élève : ${studentName}`, { size: 9.5, color: [110, 110, 110], gap: 0.5 });
  write(`Épreuve lancée le ${formatDateFR(exam.launchedAt, true)} · à rendre avant le ${formatDateFR(exam.deadlineAt, true)}`, { size: 9.5, color: [110, 110, 110], gap: 0.5 });
  write(exam.submittedAt ? `Écrit validé le ${formatDateFR(exam.submittedAt, true)}` : "Écrit non validé (brouillon)", { size: 9.5, color: [110, 110, 110] });

  // ── Exercices ──
  for (const ex of EXAM_EXERCISES) {
    doc.addPage(); y = MARGIN;
    write(`EXERCICE ${ex.number}`, { size: 16, style: "bold", color: NAVY, align: "center", gap: 1 });
    write(ex.subtitle, { size: 11, style: "bolditalic", color: NAVY, align: "center", gap: 7 });
    blocks(ex.context);
    y += 3;
    for (const part of ex.parts) {
      if (part.heading) write(part.heading, { size: 11.5, style: "bold", color: NAVY, gap: 4 });
      for (const f of part.fields) {
        write(stripMarkup(f.label), { style: "bold", color: NAVY, gap: 2 });
        if (f.kind === "table") for (const b of f.bullets) write(`•  ${b}`, { indent: 4, gap: 1 });
        await answer(f);
        y += 4;
      }
    }
  }

  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(140, 140, 140);
    doc.text(pdfText(`Certification RS6776 · ${studentName}`), MARGIN, PAGE_H - 8);
    doc.text(`${i} / ${pages}`, PAGE_W - MARGIN, PAGE_H - 8, { align: "right" });
  }
  return doc.output("blob");
}

export async function downloadCertificationPdf(exam: CertificationExam, studentName: string): Promise<void> {
  const blob = await generateCertificationPdf(exam, studentName);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Certification RS6776 - ${studentName}.pdf`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
