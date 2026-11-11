import type { RevisionData } from "./types";
// Leçon 1.3 « Installer et configurer les outils IA » — fiche de révision.
// Source unique : docs/formation-rs6776/lecon-1.3/cours.html (rien n'est ajouté au cours).
// Le cours traite ChatGPT, Gemini, Copilot et Firefly ; aucune date ni version système n'est reprise.
export const data: RevisionData = {
  lesson: "1.3",
  title: "Installer et configurer les outils IA",
  highlight: "configurer",
  keyPoints: [
    ["Un outil autorisé, pas quatre comptes", "Retenez uniquement un outil utile, autorisé et compatible avec les données traitées."],
    ["Sécuriser avant le premier prompt", "Double authentification, mot de passe unique, contrôles de données vérifiés, premier essai fictif."],
    ["Les mêmes repères partout", "Zone de saisie, nouvelle conversation, historique, fichier joint, et surtout le sélecteur de mode."],
  ],
  modules: [
    {
      id: "avant", title: "Avant toute inscription", teaser: "Quatre vérifications, la page officielle.", tint: "violet", icon: "shield",
      blocks: [
        { type: "checklist", title: "Je vérifie d'abord", items: [
          "La politique de ma structure ou du client",
          "Le type de données prévu",
          "L'offre autorisée",
          "La personne qui administre l'accès",
        ] },
        { type: "rule", text: "Les modalités évoluent : utilisez toujours la page officielle de l'éditeur au moment de l'installation, et téléchargez les applications uniquement depuis elle (ou Microsoft Store pour Copilot)." },
      ],
    },
    {
      id: "comptes", title: "Quel compte pour quel outil", teaser: "Quatre outils, quatre logiques d'accès.", tint: "bleu", icon: "users", wide: true,
      blocks: [
        { type: "table", headers: ["Outil", "Site officiel", "Compte nécessaire"], rows: [
          ["ChatGPT", "chatgpt.com", "Compte OpenAI par e-mail, connexion Google, Microsoft ou Apple, ou SSO de l'organisation selon l'offre"],
          ["Google Gemini", "gemini.google.com", "Un compte Google, personnel ou professionnel : aucune autre option"],
          ["Microsoft Copilot", "copilot.com", "Usage limité sans connexion ; compte personnel Microsoft, Apple ou Google, ou compte Microsoft Entra si l'organisation l'autorise"],
          ["Adobe Firefly", "firefly.adobe.com", "Un identifiant Adobe, par e-mail ou connexion sociale proposée dans votre région"],
        ] },
        { type: "text", text: "Compte Google **fourni par une structure** : l'accès à Gemini peut dépendre d'une activation par l'administrateur. Sur **Copilot**, le même nom désigne aussi des fonctions de Microsoft 365 : ne déduisez pas vos droits d'un logo, contrôlez le compte actif, l'offre et les sources accessibles." },
      ],
    },
    {
      id: "securiser", title: "Sécuriser le compte", teaser: "Connexion fédérée et configuration minimale.", tint: "corail", icon: "lock",
      blocks: [
        { type: "compare", left: { title: "Connexion avec Google, Microsoft ou Apple", text: "Évite un mot de passe supplémentaire ; l'accès reste révocable depuis les paramètres de sécurité du compte pivot." }, right: { title: "Mais", text: "Elle relie l'accès au compte choisi : ce compte pivot doit être particulièrement bien protégé." } },
        { type: "steps", items: [
          { title: "Double authentification", text: "Activée lorsqu'elle est proposée." },
          { title: "Mot de passe unique", text: "Géré par un gestionnaire de mots de passe." },
          { title: "Contrôles de données et historique", text: "Vérifiés avant le premier prompt." },
          { title: "Premier essai fictif", text: "Puis notez l'outil, l'offre, le propriétaire du compte et la date de vérification." },
        ] },
        { type: "rule", text: "Pas de compte client pour un autre client, pas de compte personnel de contournement quand un accès professionnel est bloqué." },
      ],
    },
    {
      id: "interface", title: "Les repères de l'interface", teaser: "Retrouver les commandes partout.", tint: "vert", icon: "scan",
      blocks: [
        { type: "cards", items: [
          { title: "Zone de saisie", text: "Là où vous écrivez le prompt.", icon: "pen" },
          { title: "Nouvelle conversation", text: "Pour repartir de zéro.", icon: "message", tint: "bleu" },
          { title: "Historique", text: "Les échanges précédents.", icon: "book", tint: "vert" },
          { title: "Joindre un fichier", text: "Document ou image à analyser.", icon: "file", tint: "mauve" },
        ] },
        { type: "choice", question: "Une tâche complexe demande d'enchaîner plusieurs étapes de réflexion. Que faites-vous ?", options: [
          { label: "Je laisse le réglage par défaut", why: "Le défaut n'est pas forcément adapté à la tâche." },
          { label: "J'ouvre le sélecteur de mode et je choisis un mode plus approfondi", correct: true, why: "Le mode rapide convient aux tâches courantes, le mode approfondi aux tâches complexes. Les noms changent : repérez le sélecteur." },
          { label: "Je mémorise le nom exact du mode pour la prochaine fois", why: "Les noms changent régulièrement d'une mise à jour à l'autre." },
        ] },
      ],
    },
    {
      id: "avance", title: "Les fonctionnalités avancées", teaser: "À quoi servent ces boutons.", tint: "mauve", icon: "layers",
      blocks: [
        { type: "flip", items: [
          { title: "Assistants personnalisés", front: "Parfois « GPT » ou « Gem ».", back: "Instructions, ton et documents fixés une fois pour une tâche récurrente.", icon: "wand" },
          { title: "Espace documentaire", front: "Notebook ou équivalent.", back: "L'outil ne répond qu'à partir des documents déposés : plus facile de vérifier d'où vient la réponse.", icon: "book" },
          { title: "Projets", front: "Un dossier de conversations.", back: "Instructions et fichiers de référence communs à plusieurs conversations sur un même sujet.", icon: "layers" },
          { title: "Canvas", front: "Un panneau de co-édition.", back: "Vous et l'outil modifiez le même document, avec suivi des versions.", icon: "pen" },
          { title: "Recherche approfondie", front: "Plusieurs minutes de recherche.", back: "De nombreuses sources explorées pour un dossier documenté : à réserver aux questions qui le justifient.", icon: "search" },
          { title: "Connecteurs", front: "Liaison avec une autre application.", back: "L'outil lit ou écrit dans votre messagerie, agenda ou stockage : il peut accéder à plus que la conversation.", icon: "sparkles" },
        ] },
        { type: "rule", text: "Ces fonctions ne sont ni disponibles sur toutes les offres ni activées par défaut. Avant d'activer un connecteur ou un espace partagé pour un usage professionnel, vérifiez la politique de votre structure ou du client." },
      ],
    },
  ],
  profiles: {
    sirh: {
      id: "metier", title: "Votre métier", teaser: "Consultante SIRH : un accès par mission.", tint: "mauve", icon: "briefcase",
      blocks: [
        { type: "choice", question: "Un client vous ouvre son environnement Microsoft 365, qui inclut Copilot. Que faites-vous ?", options: [
          { label: "J'utilise cet accès fourni, uniquement pour sa mission", correct: true, why: "Pas de compte personnel supplémentaire : l'accès fourni a ses propres règles." },
          { label: "Je crée quand même un compte Copilot personnel", why: "Cela sort du cadre fixé par le client." },
          { label: "Je continue avec mon outil habituel", why: "L'outil autorisé par le client est celui à utiliser pour sa mission." },
        ] },
        { type: "checklist", title: "Votre carte d'accès", items: [
          "Un espace pour mon activité, un espace séparé par client",
          "Outil autorisé, offre, propriétaire du compte, données admises",
          "Un mot de passe distinct par compte, dans un gestionnaire",
          "En fin de mission, je demande le retrait de mes droits",
        ] },
      ],
    },
  },
  exam: {
    exercise: 1, label: "choix et justification des outils",
    steps: [
      "Retenir un outil réellement accessible et autorisé pour chaque tâche",
      "Noter l'offre, le propriétaire du compte et la date de vérification",
      "Vérifier l'accès et les droits d'usage sur la page officielle",
      "Accepter « non retenu » comme une décision valable",
    ],
    table: { headers: ["Outil d'IA", "Accès", "Propriétaire du compte", "Vérifié le"], row: ["Outil retenu", "Offre autorisée", "Structure ou personnel", "Date de vérification"] },
  },
  flashcards: [
    ["Faut-il créer un compte sur chaque outil ?", "Non : retenez uniquement un outil utile, autorisé et compatible avec les données traitées."],
    ["Quel compte faut-il pour Google Gemini ?", "Un compte Google, personnel ou professionnel : il n'existe pas d'autre option."],
    ["Copilot est-il utilisable sans connexion ?", "Oui, de façon limitée ; se connecter débloque l'historique et davantage d'usages."],
    ["Un projet ou un espace partagé garantit-il la confidentialité ?", "Non : un connecteur ou un espace documentaire peut exposer des données au-delà de la conversation."],
    ["Que devient un accès professionnel en fin de mission ?", "Il doit pouvoir être retiré sans affecter vos comptes personnels."],
  ],
};
