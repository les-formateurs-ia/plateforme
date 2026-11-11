import type { RevisionData } from "./types";
// Leçon 1.6 « Élaborer son plan d'actions IA » — fiche de révision.
// Source unique : docs/formation-rs6776/lecon-1.6/cours.html (rien n'est ajouté au cours).
export const data: RevisionData = {
  lesson: "1.6",
  title: "Élaborer son plan d'actions IA",
  highlight: "plan d'actions",
  keyPoints: [
    ["Six colonnes, deux repères", "Tâche, fréquence, outil, justification, budget, délai ; plus un valideur et un critère de réussite."],
    ["Une justification qui tient", "Elle croise le gain estimé, le risque évalué et la raison du choix de l'outil."],
    ["Commencer petit, mesurer, ajuster", "Une à trois tâches d'abord, trois indicateurs, un plan vivant."],
  ],
  modules: [
    {
      id: "colonnes", title: "Les six colonnes", teaser: "Toujours dans le même ordre.", tint: "violet", icon: "list", wide: true,
      blocks: [
        { type: "table", headers: ["Colonne", "Ce qu'elle contient"], rows: [
          ["Tâche cible", "La tâche précise à déléguer en partie, issue de votre grille d'analyse"],
          ["Fréquence", "Hebdomadaire, mensuelle, ponctuelle : un gain ne vaut que rapporté à sa fréquence réelle"],
          ["Outil choisi", "L'outil pressenti et son statut de compte (gratuit, payant, fourni par une structure)"],
          ["Justification", "Le gain visé, le risque évalué, ce qui rend l'outil adapté à cette tâche"],
          ["Budget éventuel", "Montant, période, nombre d'utilisateurs ; si le prix n'est pas confirmé, la source à vérifier"],
          ["Délai de mise en œuvre", "La date ou la période où le changement doit être en place"],
        ] },
        { type: "rule", text: "Une ligne qui ne peut pas être remplie précisément, colonne par colonne, n'est pas encore prête : clarifiez-la d'abord." },
        { type: "example", label: "Piloter une ligne · exemple du cours", lines: ["Valideur : la personne qui valide chaque compte-rendu", "Temps actuel : 45 minutes · cible : 25 minutes", "Zéro erreur de date, de montant ou de décision sur trois essais"], note: "Le délai dit quand tester ; l'indicateur dit s'il faut poursuivre, corriger ou arrêter." },
      ],
    },
    {
      id: "justifier", title: "Écrire une justification", teaser: "Gain, risque, outil.", tint: "bleu", icon: "pen",
      blocks: [
        { type: "beforeAfter", label: "Colonne justification", beforeTag: "Ne tient pas", afterTag: "Tient",
          before: "« Cet outil est pratique et fera gagner du temps. »",
          after: "« Tâche répétitive à structure stable, réalisée chaque semaine : le gain estimé est de 20 à 30 minutes par occurrence. Aucune donnée confidentielle n'est nécessaire pour un premier essai, le risque est donc faible. L'outil retenu est déjà utilisé quotidiennement pour des tâches comparables, ce qui ne demande aucun temps d'apprentissage supplémentaire. »" },
      ],
    },
    {
      id: "prioriser", title: "Prioriser", teaser: "Une à trois tâches pour commencer.", tint: "vert", icon: "target",
      blocks: [
        { type: "cards", items: [
          { title: "Impact attendu", text: "Ce que la tâche peut rapporter.", icon: "gauge" },
          { title: "Effort de mise en place", text: "Ce qu'il faut pour démarrer.", icon: "wand", tint: "bleu" },
          { title: "Niveau de risque", text: "Données, validation, conséquences d'une erreur.", icon: "alert", tint: "corail" },
          { title: "Facilité de contrôle", text: "Peut-on vérifier le résultat simplement ?", icon: "check", tint: "vert" },
        ] },
        { type: "choice", question: "Une tâche a un fort impact, mais un risque élevé. Que faites-vous ?", options: [
          { label: "Je la traite en premier, l'impact prime", why: "Les premières tâches doivent être les plus sûres." },
          { label: "Je l'écarte définitivement", why: "Elle n'est pas écartée pour autant." },
          { label: "Je la garde sur la liste, après les premières tâches plus sûres", correct: true, why: "Elle viendra une fois les réflexes de sécurité solidement pris." },
        ] },
        { type: "rule", text: "Un usage prioritaire est autorisé, testable sur un périmètre limité et assorti d'un critère d'arrêt si la qualité se dégrade." },
      ],
    },
    {
      id: "obstacles", title: "Obstacles et indicateurs", teaser: "Anticiper, puis mesurer.", tint: "corail", icon: "gauge",
      blocks: [
        { type: "sort", prompt: "Obstacle à anticiper ou indicateur à mesurer ?", categories: ["Obstacle", "Indicateur"], items: [
          { text: "Un outil nouvellement configuré demande quelques essais", answer: "Obstacle", why: "Le temps d'apprentissage : à prévoir dans le délai." },
          { text: "Le feu vert contractuel d'un client", answer: "Obstacle", why: "La validation nécessaire se prépare avant la mise en œuvre." },
          { text: "Un abonnement payant pas encore confirmé", answer: "Obstacle", why: "Le budget se confirme avant, pas après." },
          { text: "Le temps passé, comparé à la façon de faire précédente", answer: "Indicateur", why: "Le temps gagné." },
          { text: "Le contenu, une fois relu, reste au moins aussi bon qu'avant", answer: "Indicateur", why: "La qualité du résultat." },
          { text: "L'avis des personnes qui reçoivent le résultat", answer: "Indicateur", why: "La satisfaction." },
        ] },
        { type: "text", text: "Le temps gagné peut se traduire en valeur : **temps gagné × taux horaire de référence**. C'est une estimation pour comparer un bénéfice et un coût, pas une facturation. Un chiffre approximatif suivi régulièrement vaut mieux qu'un calcul précis jamais refait." },
      ],
    },
    {
      id: "vivant", title: "Un plan vivant", teaser: "Relire, ajuster, partager.", tint: "mauve", icon: "calendar",
      blocks: [
        { type: "checklist", title: "Faire vivre le plan", items: [
          "Je retire ou revois une tâche qui ne donne pas le bénéfice attendu au délai prévu",
          "J'ajoute une tâche écartée pour son risque une fois les réflexes de sécurité installés",
          "Je documente le prompt qui fonctionne, la vérification appliquée et le temps gagné",
          "Je réserve une plage fixe chaque semaine au suivi du plan",
        ] },
        { type: "rule", text: "Documenté sérieusement, un plan individuel peut nourrir une bibliothèque de prompts, et devenir la preuve qui manque pour faire autoriser un outil." },
      ],
    },
  ],
  profiles: {
    sirh: {
      id: "metier", title: "Votre métier", teaser: "Consultante SIRH : vos trois premières lignes.", tint: "mauve", icon: "briefcase",
      blocks: [
        { type: "table", caption: "Les hypothèses de départ de votre Playground", headers: ["Tâche", "Fréquence", "Outil", "Critère de réussite"], rows: [
          ["Comptes rendus de réunion", "Hebdomadaire", "Outil autorisé à confirmer", "Temps total réduit, 0 erreur de décision, date ou montant sur 3 essais"],
          ["Mails clients", "Hebdomadaire", "Outil autorisé à confirmer", "Temps total réduit, 0 engagement ou donnée ajoutés"],
          ["Offres d'emploi", "À chaque nouveau poste", "Outil à confirmer avec le client", "0 critère inventé ou discriminatoire, chiffres exacts"],
        ] },
        { type: "rule", text: "Un plan par client : chaque structure a ses priorités, son budget et sa tolérance au risque. Et l'accord du client avant de changer la façon de traiter ses dossiers." },
      ],
    },
  },
  exam: {
    exercise: 1, label: "plan d'optimisation des tâches",
    steps: [
      "Retenir une à trois tâches avec les quatre critères",
      "Remplir les colonnes : tâche, fréquence, outil, justification, budget",
      "Justifier par le gain, le risque et le choix de l'outil",
      "Noter « à confirmer » tout prix non vérifié",
    ],
    table: { headers: ["Tâche à optimiser", "Fréquence", "Outil d'IA", "Utilisation/justification", "Budget"], row: ["Compte rendu de réunion", "Hebdomadaire", "Outil autorisé", "Gain estimé, risque faible, outil déjà maîtrisé", "À confirmer"] },
  },
  flashcards: [
    ["Pourquoi rapporter un gain à la fréquence de la tâche ?", "Un gain de temps ne vaut que rapporté à la fréquence réelle de la tâche."],
    ["Que contient la colonne outil choisi à ce stade ?", "Le nom de l'outil pressenti et son statut de compte ; le réglage précis viendra plus tard dans le parcours."],
    ["Quand la validation nécessaire se prépare-t-elle ?", "Avant la mise en œuvre, pas après coup."],
    ["Qu'est-ce qu'un mauvais indicateur pour ce plan ?", "Un indicateur qu'on ne peut pas observer simplement, sans outil de mesure compliqué."],
    ["Pourquoi tenir un plan distinct par structure cliente ?", "Pour ne pas transposer par erreur un outil ou un budget validé chez l'une vers une autre où il n'a pas été vérifié."],
  ],
};
