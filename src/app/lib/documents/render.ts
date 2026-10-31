import type { Creneau, DocumentContext, Financement, LigneTarif, Modalite, NatureAction, Organisme } from "./types";

// Briques communes aux modèles : échappement, formats français, mise en page
// A4 (en-tête, pied de page légal) et blocs récurrents (signatures, tarifs).

export function esc(s: string | number): string {
  return String(s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

// Donnée manquante : visible à l'écran et à l'impression, jamais devinée.
export function todo(label: string): string {
  return `<mark class="todo">[À compléter : ${esc(label)}]</mark>`;
}

export function val(v: string | number | null | undefined, label: string): string {
  return v === null || v === undefined || v === "" ? todo(label) : esc(v);
}

const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
const JOURS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];

// Dates ISO (AAAA-MM-JJ) lues en calendrier local, sans décalage de fuseau.
function parseIso(iso: string): Date {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function dateFr(iso: string): string {
  const d = parseIso(iso);
  return `${d.getDate() === 1 ? "1er" : d.getDate()} ${MOIS[d.getMonth()]} ${d.getFullYear()}`;
}

export function dateLongueFr(iso: string): string {
  return `${JOURS[parseIso(iso).getDay()]} ${dateFr(iso)}`;
}

export function periodeFr(debut: string, fin: string): string {
  return debut === fin ? `le ${dateFr(debut)}` : `du ${dateFr(debut)} au ${dateFr(fin)}`;
}

export function eur(n: number): string {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n).replace(/\u202f|\u00a0/g, " ");
}

export function heures(n: number): string {
  return `${String(Math.round(n * 100) / 100).replace(".", ",")} h`;
}

// "09:00" → "9h00"
export function heureFr(hhmm: string): string {
  const [h, m] = hhmm.split(":");
  return `${Number(h)}h${m}`;
}

export function creneauDuree(c: Creneau): number {
  const [h1, m1] = c.debut.split(":").map(Number);
  const [h2, m2] = c.fin.split(":").map(Number);
  return (h2 * 60 + m2 - h1 * 60 - m1) / 60;
}

export function demiJournee(c: Creneau): string {
  return Number(c.debut.split(":")[0]) < 13 ? "Matin" : "Après-midi";
}

export function list(items: string[]): string {
  return items.length ? `<ul>${items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>` : "";
}

export function checkbox(checked: boolean, label: string): string {
  return `<span class="check">${checked ? "☒" : "☐"} ${esc(label)}</span>`;
}

export const NATURE_LABELS: Record<NatureAction, string> = {
  formation: "Action de formation",
  bilan: "Bilan de compétences",
  vae: "Action permettant de faire valider les acquis de l'expérience",
  apprentissage: "Action de formation par apprentissage",
};

export const MODALITE_LABELS: Record<Modalite, string> = {
  presentiel: "En présentiel",
  distanciel_synchrone: "À distance, en classe virtuelle (synchrone)",
  foad: "Formation ouverte et à distance (e-learning)",
  hybride: "Mixte : e-learning et séances avec un formateur",
};

export const FINANCEMENT_LABELS: Record<Financement, string> = {
  entreprise: "Financement par l'entreprise",
  opco: "Prise en charge par un OPCO",
  cpf: "Compte personnel de formation (CPF)",
  particulier: "Financement personnel",
};

export function aDistance(m: Modalite): boolean {
  return m === "foad" || m === "hybride";
}

export function totalHt(lignes: LigneTarif[]): number {
  return lignes.reduce((s, l) => s + l.quantite * l.prixUnitaireHt, 0);
}

// Formation professionnelle continue exonérée de TVA (art. 261-4-4° a du
// CGI), comme sur les devis Digiforma : le TTC est égal au HT.
export function tableTarifs(lignes: LigneTarif[]): string {
  const rows = lignes.map((l) => `
    <tr><td>${esc(l.designation)}</td><td class="num">${esc(l.quantite)}</td>
    <td class="num">${eur(l.prixUnitaireHt)}</td><td class="num">${eur(l.quantite * l.prixUnitaireHt)}</td></tr>`).join("");
  const total = totalHt(lignes);
  return `
  <table class="grid">
    <thead><tr><th>Désignation</th><th class="num">Quantité</th><th class="num">Prix unitaire HT</th><th class="num">Total HT</th></tr></thead>
    <tbody>${rows}</tbody>
    <tfoot>
      <tr><td colspan="3">Total HT</td><td class="num">${eur(total)}</td></tr>
      <tr><td colspan="3">TVA : exonération, article 261-4-4° a du CGI</td><td class="num">${eur(0)}</td></tr>
      <tr class="strong"><td colspan="3">Total TTC</td><td class="num">${eur(total)}</td></tr>
    </tfoot>
  </table>`;
}

export type SignatureRole = "organisme" | "client";

// Cases de signature. Le rôle permet de les remplir après coup : celle de
// l'organisme à l'émission du document, celle du client quand il a signé.
export function signatures(parts: { titre: string; nom: string; mention?: string; role: SignatureRole }[]): string {
  return `<div class="signatures">${parts.map((p) => `
    <div class="sign">
      <p class="sign-title">${esc(p.titre)}</p>
      <p>${p.nom}</p>
      ${p.mention ? `<p class="muted small">${esc(p.mention)}</p>` : ""}
      <div class="sign-box" data-sign="${p.role}"></div>
    </div>`).join("")}</div>`;
}

// Remplit toutes les cases d'un rôle avec la mention de signature électronique.
export function stampSignature(html: string, role: SignatureRole, nom: string, signeLe: string): string {
  const quand = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeStyle: "short", timeZone: "Europe/Paris" }).format(new Date(signeLe));
  const stamp = `<div class="sign-box signed" data-sign="${role}"><span class="sig-name">${esc(nom)}</span><span class="sig-meta">Signé électroniquement le ${esc(quand)}</span></div>`;
  return html.split(`<div class="sign-box" data-sign="${role}"></div>`).join(stamp);
}

export function faitA(ctx: DocumentContext, iso = ctx.dateDocument): string {
  return `<p>Fait à ${esc(ctx.organisme.villeSignature)}, le ${dateFr(iso)}.</p>`;
}

export function identiteOrganisme(o: Organisme): string {
  return `<strong>${esc(o.nomCommercial)}</strong> (${esc(o.raisonSociale)}${o.formeJuridique ? `, ${esc(o.formeJuridique)}` : ""}),
  ${esc(o.adresse)}, ${esc(o.codePostal)} ${esc(o.ville)}, SIRET ${esc(o.siret)},
  déclaration d'activité enregistrée sous le n° ${esc(o.nda)} auprès du préfet de région ${esc(o.ndaRegion)},
  représenté par ${esc(o.representant.nom)}, ${esc(o.representant.qualite)}`;
}

export function identiteClient(ctx: DocumentContext): string {
  const c = ctx.client;
  const adresse = `${esc(c.adresse)}, ${esc(c.codePostal)} ${esc(c.ville)}`;
  if (c.type === "particulier") return `<strong>${esc(c.nom)}</strong>, demeurant ${adresse}`;
  return `<strong>${esc(c.nom)}</strong>, ${adresse}, SIRET ${val(c.siret, "SIRET du client")},
  représentée par ${c.representant ? `${esc(c.representant.nom)}, ${esc(c.representant.qualite)}` : todo("représentant du client")}`;
}

// Mentions de pied de page, dont celle imposée par l'article L6352-12 pour
// tout usage du numéro de déclaration d'activité.
export function mentionsPied(o: Organisme): string[] {
  return [
    `${o.nomCommercial} · ${o.raisonSociale} · ${o.adresse}, ${o.codePostal} ${o.ville} · SIRET ${o.siret} · TVA ${o.tvaIntracom}`,
    `Déclaration d'activité enregistrée sous le n° ${o.nda} auprès du préfet de région ${o.ndaRegion}. Cet enregistrement ne vaut pas agrément de l'État.`,
  ];
}

function cssString(s: string): string {
  return `"${s.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

const CSS = `
  @page { size: A4; margin: 16mm 16mm 22mm; }
  * { box-sizing: border-box; }
  html, body { margin: 0; background: #fff; }
  body { font-family: "Helvetica Neue", Arial, sans-serif; font-size: 10pt; line-height: 1.45; color: #1d2433; }
  .page { max-width: 178mm; margin: 0 auto; padding: 8mm 0 0; }
  @media screen { body { background: #eef0f4; padding: 16px 0; } .page { background: #fff; padding: 14mm 16mm 10mm; max-width: 210mm; box-shadow: 0 1px 6px rgba(0,0,0,.12); margin-bottom: 16px; } }
  .break { break-before: page; }
  @media screen { .break { margin-top: 0; } }
  header.doc { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; padding-bottom: 10px; border-bottom: 2px solid #2A78D6; margin-bottom: 16px; }
  header.doc .logo svg { height: 26px; width: auto; fill: #1d2433; }
  header.doc .coords { text-align: right; font-size: 8.5pt; color: #555; }
  h1 { font-size: 17pt; margin: 6px 0 4px; color: #1d2433; }
  .subtitle { color: #555; margin: 0 0 14px; }
  h2 { font-size: 11.5pt; margin: 18px 0 6px; color: #2A78D6; break-after: avoid; }
  h3 { font-size: 10.5pt; margin: 12px 0 4px; break-after: avoid; }
  p { margin: 4px 0; }
  ul { margin: 4px 0 4px 18px; padding: 0; }
  li { margin: 2px 0; }
  .muted { color: #666; }
  .small { font-size: 8.5pt; }
  .box { border: 1px solid #d9dee8; border-radius: 4px; padding: 8px 10px; margin: 8px 0; background: #f8f9fc; }
  table { border-collapse: collapse; width: 100%; margin: 6px 0; }
  table.grid th, table.grid td { border: 1px solid #cfd5e1; padding: 5px 6px; text-align: left; vertical-align: top; }
  table.grid th { background: #f1f4f9; font-size: 9pt; }
  table.kv td { padding: 3px 6px 3px 0; vertical-align: top; }
  table.kv td:first-child { width: 38%; color: #555; }
  .num { text-align: right; white-space: nowrap; }
  tfoot td { font-weight: 600; }
  tr.strong td { background: #f1f4f9; }
  tr { break-inside: avoid; }
  td.sig { height: 38px; min-width: 90px; }
  .check { display: inline-block; margin-right: 14px; }
  .signatures { display: flex; gap: 24px; margin-top: 18px; break-inside: avoid; }
  .sign { flex: 1; }
  .sign-title { font-weight: 600; }
  .sign-box { border: 1px dashed #b8c0cf; height: 70px; margin-top: 6px; border-radius: 4px; }
  .sign-box.signed { border: 1px solid #1BAF7A; background: #f1faf6; display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 2px; }
  .sig-name { font-family: "Snell Roundhand", "Segoe Script", "Brush Script MT", cursive; font-size: 17pt; color: #1d2433; line-height: 1.1; }
  .sig-meta { font-size: 7.5pt; color: #2c6a48; }
  mark.todo { background: #ffe8a3; color: #6b4a00; padding: 0 2px; border-radius: 2px; }
  footer.doc { margin-top: 22px; padding-top: 6px; border-top: 1px solid #d9dee8; font-size: 7.5pt; color: #666; text-align: center; }
  @media print { footer.doc { display: none; } }
`;

export type DocumentPage = { titre: string; sousTitre?: string; body: string };

// Plusieurs pages (une convocation par stagiaire…) dans un seul document.
export function renderDocument(titreDocument: string, pages: DocumentPage[], o: Organisme, logoSvg = ""): string {
  const pagesHtml = pages.map((p, i) => `
  <section class="page${i > 0 ? " break" : ""}">
    <header class="doc">
      <div class="logo">${logoSvg || `<strong>${esc(o.nomCommercial)}</strong>`}</div>
      <div class="coords">${esc(o.adresse)}, ${esc(o.codePostal)} ${esc(o.ville)}<br>${esc(o.email)} · ${esc(o.telephone)}</div>
    </header>
    <h1>${esc(p.titre)}</h1>
    ${p.sousTitre ? `<p class="subtitle">${p.sousTitre}</p>` : ""}
    ${p.body}
    <footer class="doc">${mentionsPied(o).map(esc).join("<br>")}</footer>
  </section>`).join("");
  // À l'impression, les mentions passent dans la marge basse de chaque page,
  // avec la pagination ; à l'écran, elles closent chaque page.
  const pied = `@page { @bottom-center { content: ${mentionsPied(o).map(cssString).join(' "\\A" ')} "\\A Page " counter(page) " / " counter(pages); white-space: pre-wrap; font: 7pt Arial, sans-serif; color: #666; text-align: center; } }`;
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><title>${esc(titreDocument)}</title><style>${CSS}${pied}</style></head><body>${pagesHtml}</body></html>`;
}

export type SignatureProof = {
  titre: string;
  sha256: string;
  emisLe: string;
  emisPar: string;
  signataire: string;
  signeLe: string;
  ip: string | null;
  navigateur: string | null;
};

function dateHeureFr(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeStyle: "medium", timeZone: "Europe/Paris" }).format(new Date(iso));
}

// Page finale d'un document signé en ligne : qui a signé, quand, depuis
// quelle adresse, et l'empreinte du document tel qu'il a été présenté.
export function withSignatureProof(html: string, p: SignatureProof): string {
  const page = `
  <section class="page break">
    <h1>Certificat de signature électronique</h1>
    <p class="subtitle">${esc(p.titre)}</p>
    <table class="kv">
      <tr><td>Document émis le</td><td>${esc(dateHeureFr(p.emisLe))}, par ${esc(p.emisPar)} pour l'organisme de formation</td></tr>
      <tr><td>Signataire</td><td><strong>${esc(p.signataire)}</strong></td></tr>
      <tr><td>Signé le</td><td><strong>${esc(dateHeureFr(p.signeLe))}</strong> (heure de Paris)</td></tr>
      <tr><td>Adresse IP</td><td>${p.ip ? esc(p.ip) : "non transmise"}</td></tr>
      <tr><td>Navigateur</td><td class="small">${p.navigateur ? esc(p.navigateur) : "non transmis"}</td></tr>
      <tr><td>Empreinte SHA-256 du document</td><td class="small" style="word-break:break-all">${esc(p.sha256)}</td></tr>
    </table>
    <p class="small muted">Le signataire a coché la case « J'ai lu le document et j'en accepte les termes » puis cliqué sur « Signer », depuis un lien personnel. Signature électronique simple au sens du règlement eIDAS (UE n° 910/2014) et de l'article 1367 du Code civil. L'empreinte permet de vérifier que le document n'a pas été modifié depuis son émission.</p>
  </section>`;
  return stampSignature(html, "client", p.signataire, p.signeLe).replace("</body>", `${page}</body>`);
}
