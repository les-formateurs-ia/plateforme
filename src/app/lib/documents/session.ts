// Partie pure des sessions de formation : types, fenêtre d'émargement et
// construction du contexte des documents (heures réalisées, relevés). Sans
// dépendance à Supabase, elle est testée sous Node (scripts/documents.test.mjs).
import { ORGANISME } from "./organisme";
import { creneauDuree } from "./render";
import type { Client, DocumentContext, Financement, Formation, Intervenant, LigneTarif, Stagiaire } from "./types";

export type TrainingSession = {
  id: string;
  reference: string;
  financement: Financement;
  financeur: string | null;
  companyId: string | null;
  client: Client;
  formation: Formation;
  lignes: LigneTarif[];
  conditionsPaiement: string;
  dateDebut: string;
  dateFin: string;
  lieu: string;
  lienConnexion: string | null;
  intervenants: Intervenant[];
  // Formateur attribué (profil) : lui seul, avec l'admin, voit la session.
  formateurId: string | null;
  // Suivi commercial et financier (admin seul, masqué au formateur).
  statutCommercial: StatutCommercial;
  factures: Facture[];
  chargesHt: number;
  // Session reprise d'un autre outil (Digiforma) et son dossier d'origine.
  source: "plateforme" | "digiforma";
  archive: SessionArchive | null;
};

export type StatutCommercial = "prospect" | "devis" | "gagne" | "perdu";
export const STATUT_COMMERCIAL_LABELS: Record<StatutCommercial, string> = {
  prospect: "Prospect", devis: "Devis envoyé", gagne: "Gagnée", perdu: "Perdue",
};

export type Facture = {
  numero: string; date: string; destinataire: string | null; montantHt: number;
  statut: "non_payee" | "en_retard" | "payee"; payeHt: number; fichier: string | null;
};
export const FACTURE_STATUT_LABELS: Record<Facture["statut"], string> = { non_payee: "À encaisser", en_retard: "En retard", payee: "Payée" };

export type ArchiveDocument = { categorie: string; dossier: string; nom: string; chemin: string; octets: number };

// Dossier repris de Digiforma. cloture : le dossier administratif y a été
// mené jusqu'au bout, le parcours Qualiopi est donc considéré comme fait.
export type SessionArchive = {
  source: "digiforma";
  code: string;
  etape: "prospect" | "projet" | "planification" | "terminee";
  etapeLibelle: string | null;
  cloture: boolean;
  nomSession: string | null;
  programme: string | null;
  heuresRealisees: number | null;
  satisfaction: { moyenne: number; repondants: number } | null;
  notes: string[];
  documents?: ArchiveDocument[];
};

export type SessionSlot = { id: string; date: string; debut: string; fin: string };
export type SessionTrainee = {
  id: string; profileId: string | null; civilite: string; prenom: string; nom: string;
  // Vide si inconnu (stagiaires repris de Digiforma) : pas d'e-mail ni d'accès possible.
  email: string; fonction: string | null; resultatEvaluation: string | null;
  heuresPrevues?: number | null; heuresRealisees?: number | null;
};
export type AttendanceSignature = {
  id: string; slotId: string; traineeId: string | null; role: "stagiaire" | "intervenant";
  signerName: string; signedAt: string; ip: string | null;
};
export type ActivityRow = { date: string; activite: string; seconds: number };

export type SessionBundle = {
  session: TrainingSession;
  slots: SessionSlot[];
  trainees: SessionTrainee[];
  signatures: AttendanceSignature[];
};

// Fenêtre d'émargement d'un créneau, en heure de Paris (même règle que
// sign_attendance côté base : 15 minutes avant le début jusqu'à la fin).
function slotWindow(slot: { date: string; debut: string; fin: string }, now: Date) {
  const paris = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Paris" })).getTime();
  const at = (hm: string) => {
    const [y, m, d] = slot.date.split("-").map(Number);
    const [h, min] = hm.split(":").map(Number);
    return new Date(y, m - 1, d, h, min).getTime();
  };
  return { paris, opens: at(slot.debut) - 15 * 60_000, ends: at(slot.fin) };
}

export function isSlotOpen(slot: { date: string; debut: string; fin: string }, now = new Date()): boolean {
  const w = slotWindow(slot, now);
  return w.paris >= w.opens && w.paris <= w.ends;
}

export function isSlotUpcoming(slot: { date: string; debut: string; fin: string }, now = new Date()): boolean {
  const w = slotWindow(slot, now);
  return w.paris < w.opens;
}

// ── Contexte des documents ────────────────────────────────────────────

function dureeFr(seconds: number): string {
  if (seconds <= 0) return "—";
  const minutes = Math.round(seconds / 60);
  return `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, "0")}`;
}

const dateCourte = (iso: string) => iso.split("-").reverse().join("/");

export function todayIso(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris" }).format(new Date());
}

// Une séance compte pour un stagiaire s'il l'a émargée ; pour un stagiaire
// seul (CPF), la signature du formateur atteste aussi la séance individuelle.
function slotsAttended(bundle: SessionBundle, trainee: SessionTrainee): SessionSlot[] {
  const solo = bundle.trainees.length === 1;
  return bundle.slots.filter((slot) => bundle.signatures.some((s) =>
    s.slotId === slot.id && (s.traineeId === trainee.id || (solo && s.role === "intervenant"))));
}

export function buildDocumentContext(bundle: SessionBundle, activity: Record<string, ActivityRow[]> = {}): DocumentContext {
  const { session } = bundle;
  const distance = session.formation.modalite === "foad" || session.formation.modalite === "hybride";
  const stagiaires: Stagiaire[] = bundle.trainees.map((t) => {
    const seances = slotsAttended(bundle, t);
    const rows = activity[t.id] ?? [];
    const seancesHeures = seances.reduce((sum, s) => sum + creneauDuree(s), 0);
    const distanceHeures = rows.reduce((sum, r) => sum + r.seconds, 0) / 3600;
    const total = (distance ? distanceHeures : 0) + seancesHeures;
    const mesure = distance ? rows.length > 0 || seances.length > 0 : bundle.slots.length > 0;
    return {
      civilite: t.civilite, prenom: t.prenom, nom: t.nom, email: t.email, fonction: t.fonction,
      heuresRealisees: mesure ? Math.round(total * 100) / 100 : null,
      connexions: [
        ...rows.map((r) => ({ date: dateCourte(r.date), duree: dureeFr(r.seconds), activite: r.activite, tri: r.date })),
        ...seances.map((s) => ({ date: dateCourte(s.date), duree: dureeFr(creneauDuree(s) * 3600), activite: "Séance avec le formateur (émargée)", tri: s.date })),
      ].sort((a, b) => a.tri.localeCompare(b.tri)).map(({ tri: _tri, ...c }) => c),
      resultatEvaluation: t.resultatEvaluation,
    };
  });
  return {
    organisme: ORGANISME,
    formation: session.formation,
    session: {
      reference: session.reference, dateDebut: session.dateDebut, dateFin: session.dateFin, lieu: session.lieu,
      lienConnexion: session.lienConnexion, creneaux: bundle.slots.map(({ date, debut, fin }) => ({ date, debut, fin })),
      intervenants: session.intervenants, effectif: Math.max(bundle.trainees.length, 1),
    },
    client: session.client,
    stagiaires,
    financement: session.financement,
    financeur: session.financeur,
    lignes: session.lignes,
    numero: session.reference,
    dateDocument: todayIso(),
    validiteDevisJours: 30,
    conditionsPaiement: session.conditionsPaiement,
  };
}

