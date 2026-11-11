import type { RevisionData } from "./types";
// Leçon 2.4 « Créer des contenus visuels » — fiche de révision.
// Source : docs/formation-rs6776/lecon-2.4/cours.html (rien n'est ajouté au cours).
// Le cours prend Copilot et Firefly comme exemples : pas de bloc « tools » (cinq outils).
export const data: RevisionData = {
  lesson: "2.4",
  title: "Créer des contenus visuels",
  highlight: "contenus visuels",
  keyPoints: [
    ["Autoriser et cadrer d'abord", "Six questions avant le premier prompt ; sans autorisation, rien à importer, un cas fictif."],
    ["Un prompt visuel testable", "Finalité et public, sujet, composition, style, marque, format, exclusions."],
    ["Comparer, vérifier, documenter", "Variantes jugées sur une grille, dossier de preuve, et parfois : ne pas générer."],
  ],
  modules: [
    {
      id: "cadrer", title: "Six questions", teaser: "Avant le premier prompt.", tint: "bleu", icon: "list",
      blocks: [
        { type: "checklist", title: "Avant le premier prompt", items: ["Qui verra le visuel ?", "Quelles données ou références entreront dans l'outil ?", "Quelle charte et quelles contraintes techniques ?", "Quels droits sur les entrées et la sortie ?", "Quelle traçabilité conserver ?", "Qui validera le résultat ?"] },
        { type: "rule", text: "Si l'outil, les données ou l'usage ne sont pas autorisés, n'importez rien et employez un jeu de données fictif." },
      ],
    },
    {
      id: "outil", title: "Copilot, Firefly, ou aucun", teaser: "Les situations du cours.", tint: "violet", icon: "scale", wide: true,
      blocks: [
        { type: "table", caption: "Comparatif à vérifier sur l'offre réellement utilisée", headers: ["Critère", "Microsoft Copilot", "Adobe Firefly"], rows: [
          ["Flux de travail", "Intégration possible à des services Microsoft selon l'offre", "Intégration possible à des applications Adobe selon l'offre"],
          ["Production", "Génération rapide, fonctions variables selon le point d'accès", "Génération et retouche dans un environnement orienté création"],
          ["Droits et protections", "Lire les conditions du service et de l'offre", "Positionnement Firefly et protections éventuelles à vérifier"],
          ["Provenance", "Vérifier si l'export conserve des informations de provenance", "Content Credentials possibles ; vérifier leur présence après export"],
        ] },
        { type: "sort", prompt: "Pour chaque situation du cours, quel choix ?", categories: ["Copilot", "Firefly", "Aucun pour l'instant"], items: [
          { text: "Icône abstraite pour une slide interne, environnement Microsoft autorisé, aucune référence tierce", answer: "Copilot" },
          { text: "Fichier retouchable dans le flux Adobe du client, provenance exigée, offre approuvée", answer: "Firefly" },
          { text: "Importer la photo d'une salariée et un logo client sans savoir si l'usage est autorisé", answer: "Aucun pour l'instant", why: "Le choix d'un éditeur ne régularise pas les entrées." },
          { text: "Procédure réglementaire de douze étapes, sans source validée", answer: "Aucun pour l'instant", why: "Il manque la source ; ensuite, un outil de diagramme." },
          { text: "Équipe sous Microsoft 365, trois pistes de composition fictives à comparer", answer: "Copilot" },
        ] },
      ],
    },
    {
      id: "droits", title: "Droits et provenance", teaser: "Positionnement, contrat, contrôle.", tint: "corail", icon: "shield",
      blocks: [
        { type: "flip", items: [
          { title: "« Commercially safe »", front: "Adobe présente Firefly comme entraîné sur des contenus autorisés.", back: "Ce positionnement peut réduire certains risques ; ce n'est pas une autorisation juridique universelle. Protections selon produit, offre, territoire, conditions, sortie.", icon: "scale" },
          { title: "Content Credentials", front: "Des informations de provenance fondées sur le standard C2PA.", back: "Elles documentent l'outil et certaines étapes ; elles ne prouvent ni la véracité, ni tous les droits, et peuvent se perdre lors d'une capture ou d'une conversion.", icon: "scan" },
          { title: "Vos entrées", front: "Logos, photographies, marques, données personnelles, créations de tiers.", back: "Vous restez responsable de ce que vous fournissez, quel que soit l'éditeur.", icon: "lock" },
        ] },
        { type: "checklist", title: "Dossier de preuve", items: ["Besoin initial", "Références et autorisations", "Prompt et paramètres utiles", "Fichier source et export original", "Contrôles effectués", "Date, version de l'outil, valideur"] },
      ],
    },
    {
      id: "prompt", title: "Le prompt visuel", teaser: "Sept rubriques, un exemple.", tint: "vert", icon: "image",
      blocks: [
        { type: "beforeAfter", label: "Exemple du cours", before: "Un prompt qui ne précise ni la finalité, ni le public, ni la composition, ni le format, ni les exclusions.", after: "Pour la page de garde d'un guide interne destiné à des managers, une illustration sobre d'un atelier collaboratif, vue isométrique, personnages divers sans visage identifiable, palette bleu nuit et vert d'eau, zone vide en haut pour le titre, format paysage 16:9, sans logo, sans texte intégré, sans reproduire le style d'un artiste nommé.", beforeTag: "Vague", afterTag: "Testable" },
        { type: "steps", items: [{ title: "Générer des variantes" }, { title: "Choisir selon une grille préparée" }, { title: "Retoucher" }, { title: "Ajouter titre et texte alternatif dans un outil adapté" }] },
      ],
    },
    {
      id: "controle", title: "Contrôler ou ne pas générer", teaser: "Grille, accessibilité, limites.", tint: "mauve", icon: "eye",
      blocks: [
        { type: "checklist", title: "Grille de contrôle", items: ["Détails incohérents", "Personnes et stéréotypes", "Symboles et marques", "Lisibilité", "Dimensions", "Adéquation au message"] },
        { type: "compare", left: { title: "Image générée", text: "Illustration, ambiance, éléments décoratifs contrôlés." }, right: { title: "Outil de diagramme", text: "Organigramme, procédure, graphique chiffré : relié à une source vérifiée, plus précis et plus facile à mettre à jour." } },
        { type: "rule", text: "Une image séduisante mais trompeuse, illisible ou inaccessible n'est pas un livrable abouti." },
      ],
    },
  ],
  profiles: {
    sirh: {
      id: "metier", title: "Votre métier", teaser: "Consultante SIRH : la page de garde d'un guide client.", tint: "mauve", icon: "briefcase",
      blocks: [
        { type: "checklist", title: "Mini-brief", items: ["Public du guide", "Lieu de diffusion", "Couleurs, dimensions, zones de texte", "Références et logos autorisés ?", "Valideur côté client"] },
        { type: "compare", left: { title: "Client sous Microsoft", text: "Exploration rapide dans un environnement approuvé : Copilot peut convenir." }, right: { title: "Flux Adobe exigé", text: "Fichier retouchable et provenance : une offre Firefly approuvée répond mieux." } },
        { type: "rule", text: "Gardez le brief, les autorisations, le prompt, les variantes écartées, l'export original, la grille et la version validée." },
      ],
    },
  },
  exam: {
    exercise: 2,
    label: "produire un visuel avec un prompt structuré",
    steps: ["Cadrer le besoin et vérifier les autorisations", "Rédiger un prompt visuel testable", "Comparer des variantes avec une grille", "Finaliser, documenter et faire valider"],
  },
  flashcards: [
    ["Quelles sont les six questions à poser avant le premier prompt visuel ?", "Qui verra le visuel, quelles données ou références, quelle charte, quels droits, quelle traçabilité, qui validera."],
    ["Pourquoi ne pas intégrer le texte final dans l'image générée ?", "Le titre et le texte alternatif s'ajoutent dans un outil adapté, pour un livrable lisible et accessible."],
    ["Que peut faire perdre une capture d'écran d'un visuel ?", "Les Content Credentials, qui ne sont pas toujours préservés par une capture, une conversion ou une publication."],
    ["Faut-il créer un compte supplémentaire pour chaque outil ?", "Non : utiliser d'abord l'environnement validé, activer l'authentification multifacteur si possible, vérifier les paramètres de données."],
    ["Que vérifie un lecteur C2PA compatible ?", "L'intégrité des déclarations de provenance, pas la vérité de la scène ni l'existence de toutes les autorisations."],
  ],
};
