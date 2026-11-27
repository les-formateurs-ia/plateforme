// Import d'un programme existant (PDF ou Word) : Claude, appelé par la
// fonction import-programme (consigne et format du JSON dans
// supabase/functions/import-programme/prompt.ts), relève les rubriques du
// document dans un JSON ; ce module le lit et le fusionne dans la fiche
// Formation. Le PDF remis au client est ensuite toujours celui du modèle
// « Programme de formation » (charte de la plateforme, rubriques Qualiopi),
// quel que soit le document d'origine. Partie pure, testée sous Node (scripts/documents.test.mjs).
import type { Formation, Modalite } from "./types";

const MODALITES: Modalite[] = ["presentiel", "distanciel_synchrone", "foad", "hybride"];

export type ProgrammeImport = {
  formation: Formation;
  // Prix HT de la session, s'il figure au document : préremplit le devis.
  prixHt: number | null;
  // Rubriques reprises du modèle de départ, faute d'être dans le document.
  reprises: string[];
  // Rubriques Qualiopi absentes du document, selon Claude.
  manquants: string[];
};

const LABELS: Partial<Record<keyof Formation, string>> = {
  accroche: "Présentation courte", dureeHeures: "Durée", modalite: "Modalité",
  publicVise: "Public visé", prerequis: "Prérequis", objectifs: "Objectifs pédagogiques", contenu: "Contenu",
  methodes: "Méthodes pédagogiques", moyensTechniques: "Moyens techniques", modalitesEvaluation: "Modalités d'évaluation",
  delaiAcces: "Modalités et délais d'accès", accessibilite: "Accessibilité (handicap)", tarif: "Tarif",
  indicateurs: "Indicateurs de résultats", activitesDistance: "Activités à distance", assistance: "Assistance à distance",
};

// Le JSON de la réponse, même entouré de texte ou d'un bloc ```json.
export function extractJson(text: string): unknown {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("Claude n'a pas renvoyé de programme lisible.");
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    throw new Error("La réponse de Claude est incomplète : réessayez, ou importez un document plus court.");
  }
}

const str = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v.trim() : null);
const strList = (v: unknown): string[] =>
  Array.isArray(v) ? v.map((x) => str(x)?.replace(/^[-•*\d.)\s]+(?=\S)/, "")).filter((x): x is string => !!x) : [];
const num = (v: unknown): number | null => {
  const n = typeof v === "number" ? v : typeof v === "string" ? Number(v.replace(",", ".").replace(/[^\d.]/g, "")) : NaN;
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : null;
};
const objList = <T>(v: unknown, map: (o: Record<string, unknown>) => T | null): T[] =>
  Array.isArray(v) ? v.map((o) => (o && typeof o === "object" ? map(o as Record<string, unknown>) : null)).filter((x): x is T => x !== null) : [];

/**
 * Fiche Formation à partir de la réponse de Claude : chaque rubrique trouvée
 * dans le document remplace celle du modèle de départ (base) ; les autres
 * gardent la mention du modèle et sont listées dans reprises.
 */
export function mergeImportedProgramme(base: Formation, raw: unknown): ProgrammeImport {
  if (!raw || typeof raw !== "object") throw new Error("Claude n'a pas renvoyé de programme lisible.");
  const r = raw as Record<string, unknown>;
  const reprises: string[] = [];
  const pick = <K extends keyof Formation>(k: K, value: Formation[K] | null): Formation[K] => {
    const empty = value === null || (Array.isArray(value) && value.length === 0);
    if (!empty) return value as Formation[K];
    const fallback = base[k];
    const fallbackEmpty = fallback === null || fallback === "" || (Array.isArray(fallback) && fallback.length === 0);
    if (!fallbackEmpty && LABELS[k]) reprises.push(LABELS[k]!);
    return fallback;
  };

  const intitule = str(r.intitule);
  if (!intitule) throw new Error("Aucun intitulé de formation trouvé dans ce document : est-ce bien un programme ?");

  let heures = num(r.dureeHeures);
  let jours = num(r.dureeJours);
  if (heures && !jours) jours = Math.max(0.5, Math.round((heures / 7) * 2) / 2);
  if (jours && !heures) heures = jours * 7;
  const modalite = MODALITES.includes(r.modalite as Modalite) ? (r.modalite as Modalite) : null;

  const contenu = objList(r.contenu, (m) => {
    const titre = str(m.titre);
    const points = strList(m.points);
    if (!titre && !points.length) return null;
    return { titre: titre ?? "Contenu", ...(str(m.duree) ? { duree: str(m.duree)! } : {}), ...(str(m.objectif) ? { objectif: str(m.objectif)! } : {}), points };
  });
  const indicateurs = objList(r.indicateurs, (i) => {
    const libelle = str(i.libelle);
    const valeur = str(i.valeur);
    return libelle && valeur ? { libelle, valeur } : null;
  });
  const activitesDistance = objList(r.activitesDistance, (a) => {
    const activite = str(a.activite);
    return activite ? { activite, dureeEstimee: str(a.dureeEstimee) ?? "À préciser" } : null;
  });

  const c = r.certification && typeof r.certification === "object" ? r.certification as Record<string, unknown> : null;
  const code = str(c?.code)?.toUpperCase().replace(/\s+/g, "") ?? null;
  const certification: Formation["certification"] = c && code && /^(RS|RNCP)\d+$/.test(code)
    ? {
      intitule: str(c.intitule) ?? intitule, code, certificateur: str(c.certificateur) ?? "",
      dateEnregistrement: null, modalites: str(c.modalites) ?? "", blocs: null, equivalences: null, suitesDebouches: null,
    }
    : null;

  const formation: Formation = {
    intitule,
    accroche: pick("accroche", str(r.accroche)),
    nature: base.nature,
    dureeHeures: pick("dureeHeures", heures),
    dureeJours: jours ?? base.dureeJours,
    modalite: pick("modalite", modalite),
    publicVise: pick("publicVise", strList(r.publicVise)),
    prerequis: pick("prerequis", strList(r.prerequis)),
    objectifs: pick("objectifs", strList(r.objectifs)),
    contenu: pick("contenu", contenu),
    methodes: pick("methodes", strList(r.methodes)),
    moyensTechniques: pick("moyensTechniques", strList(r.moyensTechniques)),
    modalitesEvaluation: pick("modalitesEvaluation", strList(r.modalitesEvaluation)),
    delaiAcces: pick("delaiAcces", str(r.delaiAcces)),
    accessibilite: pick("accessibilite", str(r.accessibilite)),
    tarif: pick("tarif", str(r.tarif)),
    indicateurs: pick("indicateurs", indicateurs),
    // Une certification ne se reprend jamais du modèle : elle est propre à la formation.
    certification,
    activitesDistance: [],
    assistance: null,
  };
  // Mentions FOAD (D6313-3-1) : seulement pour une formation à distance.
  if (formation.modalite === "foad" || formation.modalite === "hybride") {
    formation.activitesDistance = pick("activitesDistance", activitesDistance);
    formation.assistance = pick("assistance", str(r.assistance));
  }

  return { formation, prixHt: num(r.prixHt), reprises, manquants: strList(r.manquants) };
}

// Texte d'un document Word converti en HTML (mammoth) : titres, listes et
// tableaux restent lisibles pour Claude, sans le poids des balises.
export function htmlToPlainText(html: string): string {
  return html
    .replace(/<img[^>]*>/gi, "")
    .replace(/<h([1-6])[^>]*>/gi, (_m, n) => `\n\n${"#".repeat(Number(n))} `)
    .replace(/<li[^>]*>/gi, "\n- ")
    .replace(/<\/t[dh]>/gi, " | ")
    .replace(/<(br|\/p|\/tr|\/h[1-6]|\/ul|\/ol|\/table)[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, "\"").replace(/&#39;/g, "'")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
