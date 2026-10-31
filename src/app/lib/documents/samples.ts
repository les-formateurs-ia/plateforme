import type { DocumentContext, Formation } from "./types";
import { ORGANISME } from "./organisme";

// Dossiers fictifs pour prévisualiser les modèles avant le branchement sur
// les sessions réelles. Les programmes reprennent les contenus existants
// (programme RS6776 V2 et parcours entreprise IA & Performance), les
// clients et stagiaires sont inventés.

export const FORMATION_RS6776: Formation = {
  intitule: "Création de contenus rédactionnels et visuels par l'usage responsable de l'IA générative",
  accroche: "Comprendre, tester et maîtriser l'IA générative pour transformer sa façon de travailler, en alternant e-learning, exercices pratiques et séances avec un formateur.",
  nature: "formation",
  dureeHeures: 24,
  dureeJours: 3,
  modalite: "hybride",
  publicVise: [
    "Salariés et demandeurs d'emploi du secteur tertiaire produisant des contenus rédactionnels (e-mails, notes, rapports, articles) ou visuels (réseaux sociaux, images, sites).",
    "Professionnels de l'assistanat, du secrétariat, du marketing, de la communication, des ressources humaines et du juridique.",
  ],
  prerequis: [
    "Une première expérience du monde professionnel.",
    "Être à l'aise avec l'utilisation d'internet.",
    "Un ordinateur avec connexion internet, webcam et micro.",
  ],
  objectifs: [
    "Définir la stratégie d'implémentation de l'IA générative selon son contexte professionnel et les outils existants (ChatGPT, Gemini, Firefly, Copilot), et en dégager un plan d'intégration sur son poste.",
    "Utiliser les outils d'IA générative pour créer des contenus rédactionnels et visuels adaptés à la demande, accessibles aux personnes en situation de handicap et sans risque pour la confidentialité des données.",
    "Évaluer et résoudre les problématiques éthiques et réglementaires pour produire des contenus conformes à l'AI Act et au RGPD.",
  ],
  contenu: [
    { titre: "Module 1 : Comprendre, installer et planifier l'IA dans son travail", duree: "8 h", objectif: "Analyser ses besoins, installer les bons outils et bâtir un plan IA concret pour son poste.", points: [
      "Comprendre l'IA générative et ses usages : ChatGPT, Copilot, Gemini, Firefly.",
      "Analyser son poste et identifier les tâches de création de contenus automatisables.",
      "Installer et configurer les outils, prise en main des interfaces.",
      "Sécurité et gestion des données : anonymisation, restriction, bonnes pratiques.",
      "Mission : plan IA personnel appliqué à son métier.",
    ] },
    { titre: "Module 2 : Maîtriser le prompt engineering et créer des contenus", duree: "8 h", objectif: "Produire des contenus clairs, efficaces et professionnels avec les bons prompts.", points: [
      "Structure d'un prompt : consignes, rôle, format, ton.",
      "Prompts avancés : zero-shot, few-shot, chaîne de raisonnement.",
      "Contenus rédactionnels : e-mails, comptes rendus, articles.",
      "Contenus visuels : Firefly, DALL-E, Copilot Image, cohérence graphique.",
      "Mission : un contenu texte et un visuel IA sous contraintes.",
    ] },
    { titre: "Module 3 : Produire une IA responsable, conforme et accessible", duree: "8 h", objectif: "Sécuriser son usage, respecter les règles et garantir une production accessible à tous.", points: [
      "Accessibilité : loi de 2005, descriptions alternatives, sous-titres, FALC.",
      "Cadre légal : AI Act, RGPD appliqué à l'IA, mise en place d'une veille.",
      "Mission : livrable IA optimisé, sécurisé, conforme et accessible.",
    ] },
  ],
  methodes: [
    "Leçons vidéo et exercices interactifs sur la plateforme e-learning.",
    "Missions pratiques appliquées au métier du stagiaire, corrigées par un formateur.",
    "Séances individuelles en visioconférence avec un formateur à la fin de chaque module.",
  ],
  moyensTechniques: [
    "Plateforme e-learning Les Formateurs IA accessible 24 h/24, avec suivi de progression.",
    "Studio d'outils IA intégré (texte, image, audio, vidéo).",
    "Visioconférence Google Meet pour les séances avec formateur.",
  ],
  modalitesEvaluation: [
    "Test de positionnement en début de parcours.",
    "Quiz et missions évaluées à la fin de chaque module.",
    "Questionnaire de satisfaction à chaud en fin de formation et à froid à 3 mois.",
    "Examen de certification : écrit à rendre sous 10 jours après la formation (6 cas pratiques), puis soutenance orale de 20 minutes.",
  ],
  delaiAcces: "Inscription via Mon Compte Formation. Entrée en formation au plus tôt 11 jours ouvrés après la validation de la commande, puis accès à la plateforme dès réception des identifiants.",
  accessibilite: "Formation accessible aux personnes en situation de handicap : contenus sous-titrés, rythme adaptable, aménagements possibles des séances et des épreuves après échange avec le référent handicap.",
  tarif: "1 800 € net de taxe (exonération de TVA, art. 261-4-4° a du CGI)",
  indicateurs: [{ libelle: "Taux de satisfaction des stagiaires", valeur: "100 %" }, { libelle: "Taux de réussite à la certification", valeur: "100 %" }],
  certification: {
    intitule: "Création de contenus rédactionnels et visuels par l'usage responsable de l'intelligence artificielle générative",
    code: "RS6776",
    certificateur: "InKréa Certifications (INKREA FORMATIONS)",
    dateEnregistrement: "2024-10-01",
    modalites: "Mise en situation professionnelle autour de 6 cas pratiques : rapport écrit à rendre sous 10 jours après la fin de la formation, puis présentation orale de 20 minutes devant un jury. La certification est obtenue avec un taux de réussite global, écrit et oral confondus, d'au moins 70 %.",
    blocs: "Pas de validation par blocs : la certification se valide dans son ensemble.",
    equivalences: "Aucune équivalence ni passerelle (fiche France Compétences : aucune correspondance).",
    suitesDebouches: "Certification de compétences transverses, valorisable dans l'emploi occupé ou en recherche d'emploi dans les métiers du tertiaire visés (assistanat, secrétariat, marketing, communication, ressources humaines, juridique). Enregistrement valable jusqu'au 1er octobre 2029.",
  },
  activitesDistance: [
    { activite: "Leçons vidéo et lectures (3 modules)", dureeEstimee: "9 h" },
    { activite: "Exercices pratiques et studio IA", dureeEstimee: "6 h" },
    { activite: "Missions à rendre (3)", dureeEstimee: "6 h" },
  ],
  assistance: "Un formateur répond aux questions pédagogiques sous 48 h ouvrées depuis la plateforme ou par e-mail ; l'assistance technique est joignable à contact@les-formateurs-ia.fr du lundi au vendredi, de 9 h à 18 h.",
};

export const FORMATION_ENTREPRISE: Formation = {
  intitule: "IA générative et performance : parcours entreprise",
  accroche: "Un socle commun pour acculturer les équipes, adopter les bons réflexes de sécurité et structurer ses prompts, puis des ateliers appliqués aux métiers de l'entreprise.",
  nature: "formation",
  dureeHeures: 14,
  dureeJours: 2,
  modalite: "presentiel",
  publicVise: ["Collaborateurs des fonctions techniques, commerciales et support."],
  prerequis: ["Un ordinateur par personne avec accès internet.", "Un compte (gratuit ou professionnel) sur au moins une plateforme d'IA avant le début de la formation."],
  objectifs: [
    "Paramétrer la confidentialité des outils d'IA et manipuler des données sensibles sans compromettre le secret de l'entreprise.",
    "Expliquer la logique probabiliste des modèles de langage pour en faire un usage maîtrisé.",
    "Structurer ses instructions pour obtenir un résultat précis dès la première requête.",
    "Détecter les hallucinations et vérifier la cohérence des réponses produites.",
    "Automatiser les tâches rédactionnelles chronophages : e-mails, synthèses, comptes rendus.",
    "Choisir l'outil adapté (Copilot, ChatGPT, Claude) selon la tâche et la sensibilité des données.",
  ],
  contenu: [
    { titre: "Jour 1 : Comprendre la machine et l'art du prompt", duree: "7 h", points: [
      "Fonctionnement réel d'un modèle de langage.",
      "Cadre réglementaire : AI Act et responsabilités de l'employé.",
      "Sécurité et confidentialité des données.",
      "Méthode Contexte, Tâche, Format ; techniques contre les hallucinations.",
    ] },
    { titre: "Jour 2 : Ateliers métiers", duree: "7 h", points: [
      "Rédaction complexe, synthèse de réunions, traduction technique.",
      "Analyse de données et de documents métier.",
      "Productivité Office 365 avec Copilot.",
    ] },
  ],
  methodes: ["Apports théoriques courts et démonstrations comparées des outils.", "Ateliers pratiques sur des cas réels de l'entreprise.", "Bibliothèque de prompts partagée après la formation."],
  moyensTechniques: ["Salle équipée d'un écran de présentation dans les locaux du client.", "Accès à la plateforme Les Formateurs IA pendant et après la formation."],
  modalitesEvaluation: ["Test de positionnement avant la formation.", "Exercices pratiques évalués pendant les ateliers.", "Quiz d'évaluation des acquis en fin de formation.", "Questionnaire de satisfaction à chaud et à froid."],
  delaiAcces: "Formation organisée à la demande, dans un délai de 2 à 4 semaines après signature de la convention.",
  accessibilite: "Les besoins d'adaptation sont étudiés avec le référent handicap avant la formation (supports, rythme, accessibilité des locaux avec le client).",
  tarif: "Sur devis",
  indicateurs: [{ libelle: "Taux de satisfaction des stagiaires", valeur: "100 %" }],
  certification: null,
  activitesDistance: [],
  assistance: null,
};

const FORMATEUR = { nom: "Yanis SOUICI", qualite: "Formateur IA générative, dirigeant de Les Formateurs IA" };

export const SAMPLE_ENTREPRISE: DocumentContext = {
  organisme: ORGANISME,
  formation: FORMATION_ENTREPRISE,
  session: {
    reference: "ENT-2026-014",
    dateDebut: "2026-12-03",
    dateFin: "2026-12-04",
    lieu: "Exemple Industrie, 10 rue de la République, 69002 Lyon",
    lienConnexion: null,
    creneaux: [
      { date: "2026-12-03", debut: "09:00", fin: "12:30" }, { date: "2026-12-03", debut: "13:30", fin: "17:00" },
      { date: "2026-12-04", debut: "09:00", fin: "12:30" }, { date: "2026-12-04", debut: "13:30", fin: "17:00" },
    ],
    intervenants: [FORMATEUR],
    effectif: 3,
  },
  client: {
    type: "entreprise",
    nom: "Exemple Industrie SAS",
    adresse: "10 rue de la République",
    codePostal: "69002",
    ville: "Lyon",
    siret: "123 456 789 00012",
    representant: { nom: "Claire DUPONT", qualite: "Directrice des ressources humaines" },
    email: "rh@exemple-industrie.fr",
  },
  stagiaires: [
    { civilite: "Mme", prenom: "Julie", nom: "MARTIN", email: "julie.martin@exemple-industrie.fr", fonction: "Ingénieure d'affaires", heuresRealisees: 14, connexions: [], resultatEvaluation: "Objectifs atteints : 17/20 au quiz final, ateliers validés." },
    { civilite: "M.", prenom: "Karim", nom: "BENALI", email: "karim.benali@exemple-industrie.fr", fonction: "Chargé de projet", heuresRealisees: 14, connexions: [], resultatEvaluation: "Objectifs atteints : 15/20 au quiz final, ateliers validés." },
    { civilite: "Mme", prenom: "Sophie", nom: "LEROY", email: "sophie.leroy@exemple-industrie.fr", fonction: "Comptable", heuresRealisees: 10.5, connexions: [], resultatEvaluation: "Objectifs partiellement atteints : absente le dernier après-midi." },
  ],
  financement: "opco",
  financeur: "OPCO Atlas",
  lignes: [{ designation: "Formation intra-entreprise, 2 jours, jusqu'à 8 participants", quantite: 1, prixUnitaireHt: 3990 }],
  numero: "DEV-2026-0021",
  dateDocument: "2026-11-02",
  validiteDevisJours: 30,
  conditionsPaiement: "Facture émise à l'issue de la formation, payable à 30 jours par virement.",
};

export const SAMPLE_CPF: DocumentContext = {
  organisme: ORGANISME,
  formation: FORMATION_RS6776,
  session: {
    reference: "CPF-2026-102",
    dateDebut: "2026-11-23",
    dateFin: "2027-01-22",
    lieu: "Plateforme e-learning et visioconférence",
    lienConnexion: "Lien Google Meet envoyé avant chaque séance",
    creneaux: [
      { date: "2026-12-04", debut: "10:00", fin: "11:00" },
      { date: "2026-12-18", debut: "14:00", fin: "15:00" },
      { date: "2027-01-15", debut: "10:00", fin: "11:00" },
    ],
    intervenants: [FORMATEUR],
    effectif: 1,
  },
  client: {
    type: "particulier",
    nom: "Camille ROUSSEAU",
    adresse: "5 place Bellecour",
    codePostal: "69002",
    ville: "Lyon",
    siret: null,
    representant: null,
    email: "camille.rousseau@example.com",
  },
  stagiaires: [{
    civilite: "Mme", prenom: "Camille", nom: "ROUSSEAU", email: "camille.rousseau@example.com", fonction: null,
    heuresRealisees: 23.5,
    connexions: [
      { date: "23/11/2026", duree: "1 h 45", activite: "Test de positionnement, leçons 1.1 à 1.3" },
      { date: "27/11/2026", duree: "2 h 30", activite: "Leçons 1.4 à 1.6, studio IA" },
      { date: "02/12/2026", duree: "3 h 10", activite: "Mission 1 : plan IA personnel" },
      { date: "04/12/2026", duree: "1 h 00", activite: "Séance formateur, fin du module 1" },
      { date: "10/12/2026", duree: "4 h 20", activite: "Module 2 : leçons et exercices de prompt" },
      { date: "16/12/2026", duree: "3 h 05", activite: "Mission 2 : contenu pro en 60 min" },
      { date: "18/12/2026", duree: "1 h 00", activite: "Séance formateur, fin du module 2" },
      { date: "08/01/2027", duree: "3 h 40", activite: "Module 3 : accessibilité, AI Act, RGPD" },
      { date: "13/01/2027", duree: "2 h 00", activite: "Mission 3 : livrable conforme et accessible" },
      { date: "15/01/2027", duree: "1 h 00", activite: "Séance formateur, préparation à la certification" },
    ],
    resultatEvaluation: "Objectifs atteints : 3 missions validées, quiz de fin de module réussis (moyenne 82 %).",
  }],
  financement: "cpf",
  financeur: "Caisse des dépôts (Mon Compte Formation)",
  lignes: [{ designation: "Formation certifiante RS6776, parcours mixte 24 h", quantite: 1, prixUnitaireHt: 1800 }],
  numero: "CPF-2026-102",
  dateDocument: "2026-11-09",
  validiteDevisJours: 30,
  conditionsPaiement: "Prise en charge par la Caisse des dépôts selon les conditions générales de Mon Compte Formation.",
};

export const SAMPLE_PARTICULIER: DocumentContext = {
  ...SAMPLE_CPF,
  financement: "particulier",
  financeur: null,
  numero: "CTR-2026-007",
  formation: { ...FORMATION_RS6776, delaiAcces: "Inscription par contrat de formation. Début possible à l'issue du délai de rétractation de 14 jours." },
  conditionsPaiement: "Acompte de 30 % à l'issue du délai de rétractation, puis deux échéances de 35 % à la fin des modules 1 et 2, par virement.",
};

export const SAMPLES = [
  { id: "entreprise", label: "Entreprise (présentiel, OPCO)", ctx: SAMPLE_ENTREPRISE },
  { id: "cpf", label: "CPF (e-learning + séances)", ctx: SAMPLE_CPF },
  { id: "particulier", label: "Particulier (autofinancé)", ctx: SAMPLE_PARTICULIER },
] as const;

// Point de départ d'une nouvelle session : le programme est copié dans la
// session puis ajusté (une session garde la version qu'on lui a vendue).
export const FORMATION_PRESETS: { id: string; label: string; formation: Formation; prix: number }[] = [
  { id: "rs6776", label: "Certifiante RS6776", formation: FORMATION_RS6776, prix: 1800 },
  { id: "entreprise", label: "Parcours entreprise", formation: FORMATION_ENTREPRISE, prix: 3990 },
  {
    id: "vierge", label: "Programme vierge", prix: 0,
    formation: {
      ...FORMATION_ENTREPRISE, intitule: "Nouvelle formation", accroche: "", publicVise: [], prerequis: [], objectifs: [],
      contenu: [], methodes: [], moyensTechniques: [], modalitesEvaluation: [], indicateurs: [], tarif: "Sur devis",
    },
  },
];
