import type { RevisionData } from "./types";
// Leçon 2.2 « Prompts avancés : méthode pour les tâches complexes » — fiche de révision.
// Source : docs/formation-rs6776/lecon-2.2/cours.html (rien n'est ajouté au cours).
export const data: RevisionData = {
  lesson: "2.2",
  title: "Prompts avancés : méthode pour les tâches complexes",
  highlight: "tâches complexes",
  keyPoints: [
    ["Découper pour contrôler", "Plan, puis section par section, puis harmonisation : chaque étape est un point de validation."],
    ["Corriger un seul élément", "Diagnostiquer ce qui manque et ne corriger que cela, plutôt que tout réécrire."],
    ["Calibrer et réutiliser", "Des exemples autorisés fixent le style ; un espace configuré applique la méthode à chaque conversation."],
  ],
  modules: [
    {
      id: "dilution", title: "La dilution", teaser: "Quand un seul prompt veut tout couvrir.", tint: "corail", icon: "alert",
      blocks: [
        { type: "text", text: "Un prompt long, qui tente de tout préciser d'un coup, produit une réponse qui **touche à tout sans rien approfondir** : phrases interchangeables, et corriger un passage oblige à tout relancer." },
        { type: "rule", text: "Ce n'est pas un manque de compétence du modèle : c'est la dilution des instructions. Un prompt unique peut suffire à un livrable court ; découpez quand il faut valider le plan, les sources ou une section." },
      ],
    },
    {
      id: "chaining", title: "Le prompt chaining", teaser: "Trois étapes, remises dans l'ordre.", tint: "violet", icon: "list", wide: true,
      blocks: [
        { type: "steps", items: [
          { title: "Cadrer le plan avant de rédiger", text: "Sections, ordre, ce que chacune couvre. Rien n'est rédigé : l'architecture se corrige à moindre coût." },
          { title: "Rédiger section par section", text: "Une section par prompt, en rappelant le plan validé, les sources et les contraintes critiques." },
          { title: "Relire et harmoniser", text: "Uniformiser le ton, éviter les répétitions, vérifier la cohérence du vocabulaire." },
        ] },
        { type: "choice", question: "Vous restez dans le même fil pour rédiger la section 3. Que faites-vous ?", options: [
          { label: "Rien de plus : le modèle voit tout l'historique", why: "L'historique visible ne garantit pas que chaque détail ancien sera correctement mobilisé." },
          { label: "Je rappelle le plan validé, les sources et les contraintes critiques", correct: true, why: "C'est la consigne du cours à chaque étape." },
          { label: "Je redemande le plan complet", why: "Le plan est déjà validé : il suffit de le rappeler comme contexte." },
        ] },
      ],
    },
    {
      id: "iterer", title: "Itérer sans tout refaire", teaser: "Un diagnostic, une ligne ajoutée.", tint: "bleu", icon: "pen",
      blocks: [
        { type: "beforeAfter", label: "Exemple du cours", before: "Rédige une annonce pour présenter le nouveau logiciel interne aux salariés.", after: "+ Contexte : ce logiciel remplace un outil utilisé depuis huit ans ; la principale crainte exprimée porte sur la perte des données déjà saisies.", beforeTag: "Générique", afterTag: "Un seul élément corrigé" },
        { type: "sort", prompt: "Les trois manches du cours : quel élément manquait ?", categories: ["Cible", "Format", "Objectif"], items: [
          { text: "Un plan de support « aussi valable pour un expert que pour un grand débutant »", answer: "Cible" },
          { text: "Une FAQ livrée en un seul paragraphe, questions mélangées", answer: "Format" },
          { text: "« Réécris ce message pour qu'il soit meilleur » : une version ni pire ni meilleure", answer: "Objectif", why: "« Meilleur » sans critère vérifiable." },
        ] },
        { type: "text", text: "Si le fil contient un contexte erroné ou contradictoire, repartez au contraire dans un échange propre avec les seuls éléments validés." },
      ],
    },
    {
      id: "fewshot", title: "Few-shot et lecture critique", teaser: "Calibrer par l'exemple, relire un prompt.", tint: "mauve", icon: "eye",
      blocks: [
        { type: "flip", items: [
          { title: "Zero-shot", front: "Un prompt sans exemple.", back: "Le modèle interprète seul le niveau attendu." },
          { title: "Few-shot", front: "Un ou deux exemples du résultat attendu.", back: "Transmet longueur, formalité ou structure. Exemples autorisés, fictifs ou nettoyés ; dire quoi imiter et quoi ne pas reproduire." },
        ] },
        { type: "table", caption: "Signaux d'alerte dans un prompt existant", headers: ["Élément", "Signal d'alerte fréquent"], rows: [
          ["Rôle", "Ton neutre par défaut, aucune posture donnée"],
          ["Cible", "Un même plan conviendrait à un débutant comme à un expert"],
          ["Objectif", "« Meilleur » ou « plus clair » sans préciser selon quoi"],
          ["Contexte", "Le résultat dépend d'un élément que seul l'auteur connaît"],
          ["Format", "Réponse correcte sur le fond mais inutilisable telle quelle"],
        ] },
      ],
    },
    {
      id: "espace", title: "Un espace réutilisable", teaser: "Instructions, Projects, Gems.", tint: "vert", icon: "wand",
      blocks: [
        { type: "example", label: "Contenu à placer dans l'espace (exemple du cours)", lines: ["Quand je te demande de rédiger un prompt, structure toujours ta proposition en cinq blocs : Rôle, Cible, Objectif, Contexte, Format.", "Si l'un d'eux te manque, pose la question correspondante avant de rédiger, plutôt que de deviner."], stamp: "Réutilisable", danger: false },
        { type: "table", headers: ["Outil", "Fonctionnalité", "Où la trouver"], rows: [
          ["ChatGPT", "Instructions personnalisées", "Paramètres, rubrique Personnalisation"],
          ["ChatGPT", "Projects, avec fichiers de référence", "Bouton « Projects », barre latérale"],
          ["Claude", "Projects, avec fichiers de référence", "Bouton « Projects », barre latérale"],
          ["Gemini", "Gems, assistant configuré", "Menu « Gems »"],
        ] },
        { type: "checklist", title: "Un espace dédié ne dispense pas de contrôler", items: ["Les membres", "Les fichiers", "La mémoire", "Les liens de partage", "Les règles de conservation"] },
      ],
    },
  ],
  profiles: {
    sirh: {
      id: "metier", title: "Votre métier", teaser: "Consultante SIRH : un support multi-modules.", tint: "mauve", icon: "briefcase",
      blocks: [
        { type: "steps", items: [
          { title: "Plan des modules", text: "Liste, ordre, contenu de chacun : validé avant toute rédaction." },
          { title: "Un module à la fois", text: "En rappelant le plan, vos sources et les contraintes." },
          { title: "Relecture globale", text: "Puis votre contrôle écran par écran avant livraison." },
        ] },
        { type: "rule", text: "Votre risque principal : valider trop tard une architecture, ou laisser passer une fonctionnalité du logiciel inventée par l'outil." },
        { type: "checklist", title: "Trois preuves à conserver", items: ["Le plan validé", "Une section avec sa source et ses corrections", "La checklist d'harmonisation finale"] },
      ],
    },
  },
  exam: {
    exercise: 2,
    label: "produire un contenu complexe avec une méthode contrôlable",
    steps: ["Faire valider le plan avant de rédiger", "Rédiger section par section en rappelant plan et sources", "Corriger l'élément manquant plutôt que tout réécrire", "Harmoniser puis vérifier l'ensemble"],
  },
  flashcards: [
    ["Qu'est-ce que la dilution des instructions ?", "Un prompt trop chargé perd en précision sur chacune de ses exigences : la réponse touche à tout sans rien approfondir."],
    ["Pourquoi demander d'abord uniquement le plan ?", "Parce que rien n'est encore rédigé : corriger l'architecture coûte peu à ce stade."],
    ["Quel est l'intérêt de ne corriger qu'un seul élément d'un prompt ?", "Cela coûte moins de temps et donne une base plus stable d'un essai à l'autre."],
    ["Quel signal d'alerte trahit un Objectif mal formulé ?", "« Meilleur » ou « plus clair », sans préciser selon quel critère."],
    ["Pourquoi conserver une copie de vos instructions hors de l'outil ?", "Les fonctions de personnalisation changent vite selon l'éditeur, l'offre et le compte ; la méthode doit rester disponible."],
  ],
};
