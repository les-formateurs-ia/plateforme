// Données injectées dans les modèles de documents réglementaires (devis,
// convention, émargement, certificat de réalisation…). Un modèle ne lit rien
// d'autre que ce contexte : il reste pur et testable, et la même structure
// servira quand les sessions seront stockées en base.

export type Organisme = {
  nomCommercial: string;
  raisonSociale: string;
  formeJuridique: string | null;
  capitalSocial: string | null;
  rcs: string | null;
  adresse: string;
  codePostal: string;
  ville: string;
  email: string;
  telephone: string;
  siteWeb: string;
  siret: string;
  tvaIntracom: string;
  nda: string;
  ndaRegion: string;
  qualiopi: { numero: string | null; certificateur: string | null; dateValidite: string | null; categories: string };
  representant: { nom: string; qualite: string };
  referentPedagogique: { nom: string; email: string; telephone: string };
  referentHandicap: { nom: string; email: string; telephone: string };
  mediateur: { nom: string | null; site: string | null };
  villeSignature: string;
};

// Modalité de réalisation : conditionne l'émargement (feuille signée en
// présentiel, relevé de connexions en FOAD) et les mentions D6313-3-1.
export type Modalite = "presentiel" | "distanciel_synchrone" | "foad" | "hybride";

// Qui paie : change le document contractuel (convention B2B, contrat
// particulier L6353-3, CGU Mon Compte Formation pour le CPF).
export type Financement = "entreprise" | "opco" | "cpf" | "particulier";

export type NatureAction = "formation" | "bilan" | "vae" | "apprentissage";

export type Formation = {
  intitule: string;
  accroche: string;
  nature: NatureAction;
  dureeHeures: number;
  dureeJours: number;
  modalite: Modalite;
  publicVise: string[];
  prerequis: string[];
  objectifs: string[];
  // Modules du programme : un titre, un objectif facultatif, des points.
  contenu: { titre: string; duree?: string; objectif?: string; points: string[] }[];
  methodes: string[];
  moyensTechniques: string[];
  modalitesEvaluation: string[];
  delaiAcces: string;
  accessibilite: string;
  tarif: string;
  // Indicateurs de résultats (Qualiopi indicateur 2) : affichés tels quels,
  // ou « en cours de mesure » pour une formation trop récente.
  indicateurs: { libelle: string; valeur: string }[];
  certification: {
    intitule: string;
    code: string;
    certificateur: string;
    dateEnregistrement: string | null;
    modalites: string;
    blocs: string | null;
    equivalences: string | null;
    suitesDebouches: string | null;
  } | null;
  // FOAD : activités à distance et leur durée estimée (D6313-3-1, 2°).
  activitesDistance: { activite: string; dureeEstimee: string }[];
  assistance: string | null;
};

export type Intervenant = { nom: string; qualite: string };

export type Creneau = { date: string; debut: string; fin: string };

export type Session = {
  reference: string;
  dateDebut: string;
  dateFin: string;
  lieu: string;
  lienConnexion: string | null;
  creneaux: Creneau[];
  intervenants: Intervenant[];
  effectif: number;
};

export type Stagiaire = {
  civilite: string;
  prenom: string;
  nom: string;
  email: string;
  fonction: string | null;
  // Réalisation (FOAD ou assiduité) : renseignée après la formation.
  heuresRealisees: number | null;
  connexions: { date: string; duree: string; activite: string }[];
  resultatEvaluation: string | null;
};

export type Client = {
  type: "entreprise" | "particulier";
  nom: string;
  adresse: string;
  codePostal: string;
  ville: string;
  siret: string | null;
  representant: { nom: string; qualite: string } | null;
  email: string;
};

export type LigneTarif = { designation: string; quantite: number; prixUnitaireHt: number };

export type DocumentContext = {
  organisme: Organisme;
  formation: Formation;
  session: Session;
  client: Client;
  stagiaires: Stagiaire[];
  financement: Financement;
  financeur: string | null;
  lignes: LigneTarif[];
  // Numéro et date du document (devis, convention…).
  numero: string;
  dateDocument: string;
  validiteDevisJours: number;
  // Acompte et échéancier : uniquement pour un contrat particulier.
  conditionsPaiement: string;
};
