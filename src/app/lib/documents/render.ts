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

// Charte des documents : Funnel Display, liserés dégradés aux couleurs de la
// marque, titres de section en bandeaux, champs sur fond gris clair.
const IRIS = "linear-gradient(90deg, #b58de0, #dbacf0 25%, #78d5e2 55%, #6adeb1 75%, #fbc2ad)";
const FONTS = `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Funnel+Display:wght@400;500;600;700;800&display=swap">`;

const CSS = `
  @page { size: A4; margin: 18mm 17mm 24mm; }
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  html, body { margin: 0; background: #fff; }
  body { font-family: "Funnel Display", "Helvetica Neue", Arial, sans-serif; font-size: 9.8pt; line-height: 1.5; color: #1a1a1a; }
  .page { position: relative; max-width: 176mm; margin: 0 auto; }
  .break { break-before: page; }
  /* Liserés haut et bas de chaque page imprimée, dans les marges (coins + centre). */
  @page {
    @top-left-corner { content: ""; background: linear-gradient(#b58de0, #b58de0) top / 100% 2.2mm no-repeat; }
    @top-center { content: ""; background: ${IRIS} top / 100% 2.2mm no-repeat; }
    @top-right-corner { content: ""; background: linear-gradient(#fbc2ad, #fbc2ad) top / 100% 2.2mm no-repeat; }
    @bottom-left-corner { content: ""; background: linear-gradient(#b58de0, #b58de0) bottom / 100% 2.2mm no-repeat; }
    @bottom-right-corner { content: ""; background: linear-gradient(#fbc2ad, #fbc2ad) bottom / 100% 2.2mm no-repeat; }
  }
  @media screen {
    body { background: #eceef2; padding: 24px 0; }
    .page { background: #fff; max-width: 210mm; padding: 18mm 17mm 12mm; margin-bottom: 24px; box-shadow: 0 2px 14px rgba(0,0,0,.1); }
    .page::before, .page::after { content: ""; position: absolute; left: 0; right: 0; height: 6px; background: ${IRIS}; }
    .page::before { top: 0; }
    .page::after { bottom: 0; }
  }
  header.doc { display: flex; justify-content: space-between; align-items: center; gap: 16px; margin-bottom: 9mm; }
  header.doc .logo svg { height: 22px; width: auto; fill: #111; }
  header.doc .kind { font-size: 8.5pt; color: #555; text-align: right; line-height: 1.35; }
  header.doc .kind strong { display: block; color: #1a1a1a; font-weight: 600; }
  h1 { font-size: 24pt; line-height: 1.08; font-weight: 800; letter-spacing: -0.02em; margin: 0 0 5px; color: #111; }
  .subtitle { font-size: 10.5pt; color: #555; margin: 2px 0 18px; }
  .subtitle.caps { font-size: 8.5pt; font-weight: 600; letter-spacing: .14em; text-transform: uppercase; color: #6b6b6b; }
  h2 { font-size: 8.6pt; font-weight: 700; letter-spacing: .14em; text-transform: uppercase; color: #1a1a1a;
    margin: 20px 0 10px; padding: 7px 13px; border-radius: 5px; background: linear-gradient(90deg, #e9cdf6, #c9a3ea); break-after: avoid; }
  h2:nth-of-type(4n+2) { background: linear-gradient(90deg, #a6e4ee, #8fe3c4); }
  h2:nth-of-type(4n+3) { background: linear-gradient(90deg, #fde0d2, #f8c4ad); }
  h2:nth-of-type(4n+4) { background: linear-gradient(90deg, #c6dcf8, #a9c6f2); }
  h3 { font-size: 10.5pt; font-weight: 700; margin: 13px 0 4px; break-after: avoid; }
  p { margin: 4px 0; }
  ul { margin: 4px 0 6px 0; padding-left: 16px; }
  li { margin: 2.5px 0; }
  li::marker { color: #b58de0; }
  strong { font-weight: 700; }
  .muted { color: #6b6b6b; }
  .small { font-size: 8.3pt; }
  /* Encadré d'identification : fond pêche, liseré dégradé à gauche. */
  .box { position: relative; border-radius: 6px; padding: 11px 14px 11px 18px; margin: 10px 0 14px; background: #fcebd3; overflow: hidden; }
  .box::before { content: ""; position: absolute; left: 0; top: 0; bottom: 0; width: 4px; background: linear-gradient(180deg, #b58de0, #dbacf0 50%, #fbc2ad); }
  table { border-collapse: collapse; width: 100%; margin: 6px 0; }
  table.grid { border-collapse: separate; border-spacing: 0; border: 1px solid #e4e0ea; border-radius: 6px; }
  table.grid th, table.grid td { padding: 6px 8px; text-align: left; vertical-align: top; border-bottom: 1px solid #ece9f1; }
  table.grid thead th:first-child { border-top-left-radius: 6px; }
  table.grid thead th:last-child { border-top-right-radius: 6px; }
  table.grid th { background: #f4effa; font-size: 8.3pt; font-weight: 700; letter-spacing: .04em; color: #333; }
  table.grid tr:last-child td { border-bottom: 0; }
  /* Couples libellé / valeur présentés comme des champs remplis. */
  table.kv { border-collapse: separate; border-spacing: 0 3px; }
  table.kv td { padding: 3.5px 10px; vertical-align: top; }
  table.kv td:first-child { width: 36%; padding-left: 0; color: #444; }
  table.kv td:last-child { background: #f6f4f4; border-bottom: 1px solid #1a1a1a; }
  .num { text-align: right; white-space: nowrap; }
  tfoot td { font-weight: 600; background: #fbfafc; }
  tr.strong td { background: #f4effa; font-weight: 800; }
  tr { break-inside: avoid; }
  td.sig { height: 38px; min-width: 90px; }
  .check { display: inline-block; margin-right: 14px; }
  .signatures { display: flex; gap: 22px; margin-top: 22px; break-inside: avoid; }
  .sign { flex: 1; }
  .sign-title { font-weight: 700; }
  .sign-box { height: 76px; margin-top: 6px; background: #f6f4f4; border-bottom: 1px solid #1a1a1a; border-radius: 3px 3px 0 0; }
  .sign-box.signed { background: #effaf5; border-bottom-color: #1BAF7A; display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 2px; }
  .sig-name { font-family: "Snell Roundhand", "Segoe Script", "Brush Script MT", cursive; font-size: 17pt; color: #1a1a1a; line-height: 1.1; }
  .sig-meta { font-size: 7.5pt; color: #2c6a48; }
  mark.todo { background: #ffe8a3; color: #6b4a00; padding: 0 2px; border-radius: 2px; }
  footer.doc { margin-top: 26px; padding-top: 8px; border-top: 1px solid #e6e6e6; font-size: 7.3pt; color: #6b6b6b; text-align: center; line-height: 1.45; }
  footer.doc strong { color: #1a1a1a; }
  @media print { footer.doc { display: none; } }
`;

export type DocumentPage = { titre: string; sousTitre?: string; body: string };

// Plusieurs pages (une convocation par stagiaire…) dans un seul document.
export function renderDocument(titreDocument: string, pages: DocumentPage[], o: Organisme, logoSvg = ""): string {
  const [genre] = titreDocument.split(" · ");
  const pagesHtml = pages.map((p, i) => `
  <section class="page${i > 0 ? " break" : ""}">
    <header class="doc">
      <div class="logo">${logoSvg || `<strong>${esc(o.nomCommercial)}</strong>`}</div>
      <div class="kind"><strong>${esc(genre)}</strong>${esc(o.adresse)}, ${esc(o.codePostal)} ${esc(o.ville)}<br>${esc(o.email)} · ${esc(o.telephone)}</div>
    </header>
    <h1>${esc(p.titre)}</h1>
    ${p.sousTitre ? `<p class="subtitle${p.sousTitre.length <= 70 ? " caps" : ""}">${p.sousTitre}</p>` : ""}
    ${p.body}
    <footer class="doc">${mentionsPied(o).map(esc).join("<br>")}</footer>
  </section>`).join("");
  // À l'impression, les mentions passent dans la marge basse de chaque page,
  // avec la pagination ; à l'écran, elles closent chaque page.
  const pied = `@page { @bottom-center { content: ${mentionsPied(o).map(cssString).join(' "\\A" ')} "\\A " counter(page) " / " counter(pages); white-space: pre-wrap; font: 7pt "Funnel Display", Arial, sans-serif; color: #6b6b6b; text-align: center; vertical-align: middle; background: ${IRIS} bottom / 100% 2.2mm no-repeat; } }`;
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><title>${esc(titreDocument)}</title>${FONTS}<style>${CSS}${pied}</style></head><body>${pagesHtml}</body></html>`;
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
