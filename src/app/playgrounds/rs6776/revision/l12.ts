import type { RevisionData } from "./types";
// Leçon 1.2 « Analyser son poste et identifier les tâches automatisables » — fiche de révision.
// Source unique : docs/formation-rs6776/lecon-1.2/cours.html (rien n'est ajouté au cours).
export const data: RevisionData = {
  lesson: "1.2",
  title: "Analyser son poste et identifier les tâches automatisables",
  highlight: "tâches automatisables",
  keyPoints: [
    ["Une méthode, pas une intuition", "Quatre étapes transforment une impression vague en une courte liste de candidats classés par priorité."],
    ["Gain × difficulté", "Croiser le gain de temps et la difficulté de mise en place fait apparaître quatre profils de tâches."],
    ["Un quick win se mesure", "C'est un essai limité, autorisé et mesurable, pas une promesse automatique de gain."],
  ],
  modules: [
    {
      id: "methode", title: "La méthode en 4 étapes", teaser: "Lister, chronométrer, évaluer, croiser.", tint: "violet", icon: "list",
      blocks: [
        { type: "compare", tone: true,
          left: { title: "Avec une méthode", text: "Une courte liste de candidats concrets, classés par priorité." },
          right: { title: "Sans méthode", text: "Soit l'effort se disperse sans résultat mesurable, soit de bons candidats passent inaperçus parce que trop routiniers." } },
        { type: "steps", items: [
          { title: "Lister", text: "Toutes les tâches récurrentes d'une semaine type, sans les trier ni les juger." },
          { title: "Chronométrer", text: "Même approximativement : un ordre de grandeur hebdomadaire suffit, il sert de base au gain potentiel." },
          { title: "Évaluer la répétitivité", text: "Même point de départ, même type de résultat chaque semaine : bon candidat. Une tâche qui change de nature à chaque fois se prête mal au même prompt." },
          { title: "Croiser avec la faisabilité IA", text: "Produit-elle du texte, une image ou une synthèse à partir d'une matière que vous fournissez ? Le jugement, la négociation et la décision restent de votre ressort." },
        ] },
      ],
    },
    {
      id: "departager", title: "Départager les candidats", teaser: "Quatre critères, et les données d'abord.", tint: "bleu", icon: "target",
      blocks: [
        { type: "cards", items: [
          { title: "Impact attendu", text: "Ce que la tâche peut réellement faire gagner.", icon: "gauge" },
          { title: "Répétitivité", text: "Une tâche fréquente rentabilise le même prompt.", icon: "layers", tint: "bleu" },
          { title: "Qualité mesurable", text: "Un résultat que vous pouvez vérifier.", icon: "check", tint: "vert" },
          { title: "Informations à protéger", text: "Réalisable avec des données fictives ou autorisées ?", icon: "lock", tint: "corail" },
        ] },
        { type: "rule", text: "Avant toute saisie de données personnelles ou confidentielles : politique de votre structure, minimisation, anonymisation réelle si possible, outil et compte autorisés, réglages vérifiés. Remplacer un nom par un code ne suffit pas toujours." },
      ],
    },
    {
      id: "quickwin", title: "Les quatre profils", teaser: "Gain de temps × difficulté de mise en place.", tint: "vert", icon: "sparkles", wide: true,
      blocks: [
        { type: "flip", items: [
          { title: "Quick win", front: "Fort gain, faible difficulté.", back: "Autorisations et prérequis déjà réunis : un essai limité et mesurable, souvent le bon point de départ.", icon: "sparkles" },
          { title: "Projet à planifier", front: "Fort gain, difficulté élevée.", back: "Choix d'outil, validation ou réorganisation nécessaires : à garder sur la liste, après les quick wins.", icon: "calendar" },
          { title: "Amélioration mineure", front: "Faible gain, faible difficulté.", back: "Un réflexe à adopter à l'occasion, pas un chantier prioritaire.", icon: "wand" },
          { title: "À écarter pour l'instant", front: "Faible gain, difficulté élevée.", back: "L'effort ne se justifie pas maintenant. On pourra y revenir si le contexte change.", icon: "eye" },
        ] },
        { type: "text", text: "La **difficulté de mise en place**, c'est tout ce qui sépare l'idée de sa réalisation : accès à un outil autorisé, compétence technique, validation d'un tiers, donnée trop sensible pour un outil grand public." },
        { type: "rule", text: "Si aucun candidat ne remplit les conditions, ne forcez pas le classement : préparez d'abord le cadre, les données fictives ou la validation nécessaires." },
      ],
    },
    {
      id: "trier", title: "Quick win ou pas ?", teaser: "Classez cinq tâches.", tint: "corail", icon: "scan",
      blocks: [
        { type: "sort", prompt: "Placez chaque tâche dans son profil.", categories: ["Quick win", "Projet à planifier", "Amélioration mineure", "À écarter pour l'instant"], items: [
          { text: "Un compte rendu hebdomadaire de deux heures, à structure stable, testable sur des notes fictives avec un outil autorisé", answer: "Quick win", why: "Fort gain, prérequis réunis, résultat contrôlable." },
          { text: "Une tâche à fort gain qui suppose de choisir un nouvel outil, migrer des données et faire valider le changement", answer: "Projet à planifier", why: "Le gain est réel, la mise en place est lourde." },
          { text: "Reformuler une seule fois un titre déjà rédigé", answer: "Amélioration mineure", why: "Facile, mais peu déterminant pris isolément." },
          { text: "Une tâche rare et peu rentable, qui demanderait une validation et des données sensibles", answer: "À écarter pour l'instant", why: "L'effort ne justifie pas le résultat aujourd'hui." },
          { text: "Une tâche très chronophage mais complexe à déléguer sans validation", answer: "Projet à planifier", why: "Un fort volume ne fait pas un quick win." },
        ] },
      ],
    },
    {
      id: "exemple", title: "Mauvaise et bonne analyse", teaser: "Ce qui rend une analyse défendable.", tint: "mauve", icon: "pen",
      blocks: [
        { type: "beforeAfter", label: "Analyse d'une tâche", beforeTag: "Trop vague", afterTag: "Précise, mesurable, prudente",
          before: "« Je vais utiliser l'IA pour tout mon travail, ça va me faire gagner du temps partout. »",
          after: "« Mes comptes-rendus de réunion me prennent deux heures par semaine. Je teste pendant trois occurrences sur des notes fictives, puis je compare le temps total, corrections comprises, et le nombre d'erreurs ou d'omissions. »" },
        { type: "checklist", title: "Les erreurs à éviter", items: [
          "Je distingue automatisation classique (macros, règles figées) et IA générative",
          "Je commence par un ou deux quick wins, pas par tout optimiser",
          "Je ne confonds pas un fort volume de travail avec un quick win",
          "Je vérifie les données confidentielles avant de confier une tâche",
        ] },
      ],
    },
  ],
  profiles: {
    sirh: {
      id: "metier", title: "Votre métier", teaser: "Consultante SIRH : vos tâches sur la grille.", tint: "mauve", icon: "briefcase",
      blocks: [
        { type: "table", caption: "Vos tâches, telles que décrites dans votre Playground", headers: ["Tâche", "Temps / semaine", "Profil"], rows: [
          ["Comptes rendus de réunion", "6 h", "Quick win, à confirmer par un essai relu sur notes fictives"],
          ["Offres d'emploi", "3 h", "Presque un quick win : vérifier rémunération et avantages"],
          ["Mails clients", "4 h", "Déjà un réflexe avec ChatGPT"],
          ["Paramétrage et connexion des logiciels de recrutement", "10 h", "Projet à cadrer : seules des tâches documentaires sur données fictives"],
          ["Formation des utilisateurs", "3 h", "La relation en direct reste humaine"],
        ] },
        { type: "rule", text: "L'outil ne reçoit ni vos accès ni le droit d'agir seul dans le système d'un client : le cœur du paramétrage reste votre expertise." },
      ],
    },
  },
  exam: {
    exercise: 1, label: "tableau des tâches à optimiser",
    steps: [
      "Lister les tâches récurrentes de la semaine type",
      "Indiquer la fréquence et le temps actuel de chacune",
      "Estimer le gain et la difficulté de mise en place",
      "Retenir un ou deux quick wins, à mesurer par un essai",
    ],
    table: { headers: ["Tâche à optimiser", "Fréquence", "Gain estimé", "Difficulté"], row: ["Compte rendu de réunion", "Hebdomadaire", "Fort", "Faible"] },
  },
  flashcards: [
    ["Pourquoi chronométrer une tâche, même approximativement ?", "Ce chiffre sert de base au calcul du gain potentiel : un ordre de grandeur hebdomadaire suffit."],
    ["Quelle tâche reste de votre ressort, quel que soit son temps ?", "Celle qui relève du jugement, de la négociation ou de la décision."],
    ["Que manque-t-il au gain de temps pour choisir par où commencer ?", "La difficulté de mise en place : outil autorisé, compétence, validation, données."],
    ["Un quick win réussi, et ensuite ?", "C'est un point de départ : chiffres à l'appui, il aide à justifier le temps ou le budget des projets à planifier."],
    ["Quelle différence entre une macro et l'IA générative ?", "La macro applique des règles figées ; l'IA générative produit un contenu nouveau à partir d'une matière fournie."],
  ],
};
