import type { DocumentContext } from "./types";
import { renderDocument, type DocumentPage } from "./render";
import { cgv, contratParticulier, convention, convocation, devis, programme, reglementInterieur } from "./templates/avant";
import { emargement, releveConnexions } from "./templates/pendant";
import { attestationAssiduite, attestationFinFormation, certificatRealisation } from "./templates/apres";

export type DocumentPhase = "avant" | "pendant" | "apres";

export type DocumentTemplate = {
  id: string;
  titre: string;
  phase: DocumentPhase;
  description: string;
  // Textes et indicateurs Qualiopi sur lesquels le modèle s'appuie.
  references: string[];
  // Le document n'a pas de sens pour ce dossier (ex. convention pour un CPF).
  applicable: (ctx: DocumentContext) => boolean;
  pages: (ctx: DocumentContext) => DocumentPage[];
  // Contrat accepté en ligne par le client (case à cocher + « Signer »).
  signable?: boolean;
};

export const PHASE_LABELS: Record<DocumentPhase, string> = {
  avant: "Avant la formation",
  pendant: "Pendant la formation",
  apres: "Après la formation",
};

const entreprise = (ctx: DocumentContext) => ctx.financement === "entreprise" || ctx.financement === "opco";
const toujours = () => true;

export const DOCUMENT_TEMPLATES: DocumentTemplate[] = [
  {
    id: "devis", signable: true, titre: "Devis", phase: "avant",
    description: "Proposition chiffrée, valant commande une fois signée.",
    references: ["L6313-1 (nature de l'action)", "Art. 261-4-4° a CGI (exonération de TVA)"],
    applicable: (ctx) => ctx.financement !== "cpf", pages: devis,
  },
  {
    id: "programme", titre: "Programme de formation", phase: "avant",
    description: "Objectifs, contenu, méthodes, évaluation, accessibilité, indicateurs de résultats.",
    references: ["L6353-1", "D6313-3-1 (FOAD)", "Qualiopi ind. 1, 2, 3, 5, 6, 26"],
    applicable: toujours, pages: programme,
  },
  {
    id: "convention", signable: true, titre: "Convention de formation", phase: "avant",
    description: "Contrat entre l'organisme et l'entreprise cliente.",
    references: ["L6353-1, L6353-2, D6353-1", "L6354-1 (inexécution)"],
    applicable: entreprise, pages: convention,
  },
  {
    id: "contrat-particulier", signable: true, titre: "Contrat de formation (particulier)", phase: "avant",
    description: "Pour une personne qui finance elle-même sa formation : rétractation de 14 jours, acompte de 30 % au plus.",
    references: ["L6353-3 à L6353-7", "L612-1 Code de la consommation (médiation)"],
    applicable: (ctx) => ctx.financement === "particulier", pages: contratParticulier,
  },
  {
    id: "cgv", titre: "Conditions générales de vente", phase: "avant",
    description: "Commande, prix, paiement, annulation, réclamations, médiation.",
    references: ["L441-10 Code de commerce", "Qualiopi ind. 31 (réclamations)"],
    applicable: toujours, pages: cgv,
  },
  {
    id: "reglement-interieur", titre: "Règlement intérieur", phase: "avant",
    description: "Hygiène, sécurité, discipline, sanctions et garanties de procédure.",
    references: ["L6352-3 à L6352-5", "R6352-1 à R6352-15"],
    applicable: toujours, pages: reglementInterieur,
  },
  {
    id: "convocation", titre: "Convocation", phase: "avant",
    description: "Informations pratiques envoyées à chaque stagiaire avant le début.",
    references: ["Qualiopi ind. 9 (conditions de déroulement)", "Qualiopi ind. 26 (handicap)"],
    applicable: toujours, pages: convocation,
  },
  {
    id: "emargement", titre: "Feuille d'émargement", phase: "pendant",
    description: "Signature par demi-journée des stagiaires et de l'intervenant.",
    references: ["Justificatif de réalisation demandé par les financeurs", "Qualiopi ind. 12 (suivi de l'assiduité)"],
    applicable: (ctx) => ctx.formation.modalite !== "foad", pages: emargement,
  },
  {
    id: "releve-connexions", titre: "Relevé de connexions (e-learning)", phase: "pendant",
    description: "Activités et temps passé sur la plateforme, justificatif de la formation à distance.",
    references: ["D6313-3-1", "Qualiopi ind. 12 (suivi de l'assiduité)"],
    applicable: (ctx) => ctx.formation.modalite === "foad" || ctx.formation.modalite === "hybride", pages: releveConnexions,
  },
  {
    id: "attestation-assiduite", titre: "Attestation d'assiduité", phase: "apres",
    description: "Heures réalisées et taux d'assiduité de chaque stagiaire.",
    references: ["Qualiopi ind. 12 (suivi de l'assiduité)"],
    applicable: toujours, pages: attestationAssiduite,
  },
  {
    id: "certificat-realisation", titre: "Certificat de réalisation", phase: "apres",
    description: "Modèle du ministère du Travail, demandé par les OPCO et la Caisse des dépôts.",
    references: ["Modèle du ministère du Travail (DGEFP)"],
    applicable: toujours, pages: certificatRealisation,
  },
  {
    id: "attestation-fin-formation", titre: "Attestation de fin de formation", phase: "apres",
    description: "Objectifs, nature, durée et résultats de l'évaluation des acquis.",
    references: ["L6353-1 al. 2", "Qualiopi ind. 11"],
    applicable: toujours, pages: attestationFinFormation,
  },
];

export function renderTemplate(template: DocumentTemplate, ctx: DocumentContext, logoSvg = ""): string {
  return renderDocument(`${template.titre} · ${ctx.formation.intitule}`, template.pages(ctx), ctx.organisme, logoSvg);
}

// Qui signe un contrat côté client : le représentant de l'entreprise ou le
// particulier lui-même.
export function signataire(ctx: DocumentContext): { nom: string; email: string } {
  return { nom: ctx.client.representant?.nom ?? ctx.client.nom, email: ctx.client.email };
}

// Nombre de champs « À compléter » restant dans un document rendu.
export function countTodos(html: string): number {
  return (html.match(/class="todo"/g) ?? []).length;
}
