
import { TenderPlanningItem } from './types';

export const GEMINI_MODEL = 'gemini-3-flash-preview';

export const TENDER_TASK_DEFINITIONS: Omit<TenderPlanningItem, 'level' | 'isParent' | 'startDate' | 'endDate' | 'responsible' | 'comments'>[] = [
  { id: '1', name: 'Gérer le projet', estimatedDurationDays: 0 },
  { id: '1.1', name: 'Cahier des charges', parentId: '1', estimatedDurationDays: 3 },
  { id: '1.2', name: 'Réunion de lancement', parentId: '1', estimatedDurationDays: 1 },
  { id: '1.3', name: 'Visites de sites', parentId: '1', estimatedDurationDays: 2 },
  { id: '1.4', name: 'Point d\'avancement', parentId: '1', estimatedDurationDays: 1 },
  { id: '1.5', name: 'Revue d\'offre', parentId: '1', estimatedDurationDays: 1 },
  { id: '1.6', name: 'Comité d\'engagement régional', parentId: '1', estimatedDurationDays: 1 },
  { id: '1.7', name: 'Comité d\'engagement National', parentId: '1', estimatedDurationDays: 1 },

  { id: '2', name: 'Construction offre technique', estimatedDurationDays: 0 },
  { id: '2.1', name: 'Etude P1', parentId: '2', estimatedDurationDays: 5 },
  { id: '2.2', name: 'Etude P2/P3 + planning', parentId: '2', estimatedDurationDays: 7 },
  { id: '2.3', name: 'Chiffrages travaux + planning', parentId: '2', estimatedDurationDays: 5 },
  { id: '2.4', name: 'Chiffrages GTC/Télégestion + planning', parentId: '2', estimatedDurationDays: 4 },
  { id: '2.5', name: 'Organisation et pilotage opérationnel', parentId: '2', estimatedDurationDays: 3 },
  { id: '2.6', name: 'Chiffrage cogénération', parentId: '2', estimatedDurationDays: 3 },
  { id: '2.7', name: 'Etude récupération de chaleur', parentId: '2', estimatedDurationDays: 3 },
  { id: '2.8', name: 'Cotations énergies', parentId: '2', estimatedDurationDays: 2 },
  { id: '2.9', name: 'Etude des subventions et aides', parentId: '2', estimatedDurationDays: 3 },

  { id: '3', name: 'Construction offre financière', estimatedDurationDays: 0 },
  { id: '3.1', name: 'Réalisation BP', parentId: '3', estimatedDurationDays: 5 },
  { id: '3.2', name: 'Compte d\'exploitation client', parentId: '3', estimatedDurationDays: 4 },

  { id: '4', name: 'Rédaction Dossier de candidature', estimatedDurationDays: 0 },
  { id: '4.1', name: 'Constitution et Rédaction notice 1', parentId: '4', estimatedDurationDays: 4 },
  { id: '4.2', name: 'Construction et Rédaction notice 2', parentId: '4', estimatedDurationDays: 4 },
  { id: '4.3', name: 'Construction et Rédaction notice 3', parentId: '4', estimatedDurationDays: 4 },

  { id: '5', name: 'Rédaction de l\'offre', estimatedDurationDays: 0 },
  { id: '5.1', name: 'Rédaction Notice juridique', parentId: '5', estimatedDurationDays: 5 },
  { id: '5.2', name: 'Rédaction Notice technique (Base + variante)', parentId: '5', estimatedDurationDays: 7 },
  { id: '5.3', name: 'Rédaction Notice économique et financière (Base+variante)', parentId: '5', estimatedDurationDays: 7 },
  { id: '5.4', name: 'Rédaction Notice qualité du service rendu aux usagers', parentId: '5', estimatedDurationDays: 5 },
  { id: '5.5', name: 'Rédaction Notice environnementale', parentId: '5', estimatedDurationDays: 5 },
  { id: '5.6', name: 'Synthèse', parentId: '5', estimatedDurationDays: 3 },

  { id: '6', name: 'Packaging de l\'offre', estimatedDurationDays: 0 },
  { id: '6.1', name: 'Commande des boîtes', parentId: '6', estimatedDurationDays: 2 },
  { id: '6.2', name: 'Prise de photo site', parentId: '6', estimatedDurationDays: 2 },
  { id: '6.3', name: 'Définir trame', parentId: '6', estimatedDurationDays: 2 },
  { id: '6.4', name: 'Clé USB + dématérialisation', parentId: '6', estimatedDurationDays: 2 },

  { id: '7', name: 'Juridique', estimatedDurationDays: 5 },
  { id: '8', name: 'Gestion relation client', estimatedDurationDays: 5 },
  { id: '9', name: 'Remise Offre', estimatedDurationDays: 1 },
];

export const TASK_SECTIONS = [
  { id: '1', name: 'Gérer le projet' },
  { id: '2', name: 'Construction offre technique' },
  { id: '3', name: 'Construction offre financière' },
  { id: '4', name: 'Rédaction Dossier de candidature' },
  { id: '5', name: 'Rédaction de l\'offre' },
  { id: '6', name: 'Packaging de l\'offre' },
  { id: '7', name: 'Juridique' },
  { id: '8', name: 'Gestion relation client' },
  { id: '9', name: 'Remise Offre' },
];
