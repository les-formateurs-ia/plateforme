import type { RevisionData } from "./types";
// Leçon 2.5 « Optimiser les contenus générés » — fiche de révision.
// Source : docs/formation-rs6776/lecon-2.5/cours.html (rien n'est ajouté au cours).
export const data: RevisionData = {
  lesson: "2.5",
  title: "Optimiser les contenus générés",
  highlight: "Optimiser",
  keyPoints: [
    ["Le fond avant la forme", "Un premier résultat est une hypothèse de travail : un texte faux se corrige depuis une source, il ne s'embellit pas."],
    ["Des critères observables", "Cinq angles qui se recouvrent et un prompt d'optimisation complet transforment « améliore ça » en critères."],
    ["Comparer et tracer", "Version de départ, consigne, version obtenue : c'est la comparaison documentée qui rend le résultat défendable."],
  ],
  modules: [
    {
      id: "fond", title: "Le fond d'abord", teaser: "Corriger ou repartir ?", tint: "corail", icon: "search",
      blocks: [
        { type: "checklist", title: "Comparer aux sources et au besoin", items: ["Faits", "Chiffres", "Noms", "Omissions", "Raisonnement", "Ton", "Confidentialité", "Droits", "Accessibilité"] },
        { type: "compare", left: { title: "Correction ciblée", text: "Préserve souvent mieux les passages déjà validés qu'une régénération complète." }, right: { title: "Nouvel échange propre", text: "Si la conversation dérive, si les consignes se contredisent ou si le texte de départ est trop fragile." } },
        { type: "rule", text: "Dans tous les cas, conservez la version de départ, la consigne de correction et la version obtenue." },
      ],
    },
    {
      id: "angles", title: "Les cinq angles", teaser: "Classez chaque consigne.", tint: "violet", icon: "layers", wide: true,
      blocks: [
        { type: "sort", prompt: "Exemples de consignes du cours : à quel angle chacune correspond-elle le plus directement ?", categories: ["Contrainte", "Contexte et sources", "Style", "Format", "Accessibilité"], items: [
          { text: "« Pas plus de 100 mots »", answer: "Contrainte" },
          { text: "« N'utilise jamais le mot “simplement” »", answer: "Contrainte" },
          { text: "« À partir de la politique validée jointe, ajoute la règle et cite sa section »", answer: "Contexte et sources" },
          { text: "« Si une donnée manque, écris “à confirmer” »", answer: "Contexte et sources" },
          { text: "« Adopte un ton plus direct, moins commercial »", answer: "Style" },
          { text: "« Transforme les paragraphes en liste à puces »", answer: "Format" },
          { text: "« Adapte pour une lecture à voix haute »", answer: "Accessibilité" },
        ] },
        { type: "text", text: "Ces angles sont une grille pratique, pas une taxonomie universelle : une phrase plus courte touche au **style** et à l'**accessibilité** ; un tableau demandé est à la fois un **format** et une **contrainte**." },
      ],
    },
    {
      id: "gabarit", title: "Le prompt complet", teaser: "Le gabarit réutilisable.", tint: "bleu", icon: "pen",
      blocks: [
        { type: "steps", items: [
          { title: "Version à corriger", text: "Coller le contenu et indiquer sa version." },
          { title: "Besoin et public", text: "L'usage réel." },
          { title: "Sources de vérité", text: "Documents ou faits autorisés ; ne rien inventer." },
          { title: "Conserve", text: "Les éléments déjà vérifiés." },
          { title: "Modifie", text: "Les changements précis." },
          { title: "Critères d'acceptation", text: "Exactitude, longueur, structure, termes, accessibilité…" },
          { title: "Résultat attendu", text: "Version corrigée, bref relevé des changements, points à confirmer." },
        ] },
        { type: "cards", items: [
          { title: "Contrainte mesurable", text: "Comptez ou testez.", tint: "bleu", icon: "gauge" },
          { title: "Fait", text: "Revenez à la source.", tint: "vert", icon: "book" },
          { title: "Accessibilité et usage", text: "Faites tester par une personne représentative du public.", tint: "mauve", icon: "accessibility" },
        ] },
      ],
    },
    {
      id: "exemple", title: "Exemple travaillé", teaser: "Vulgariser un texte technique.", tint: "vert", icon: "sparkles",
      blocks: [
        { type: "beforeAfter", label: "Notification pour des novices · 60 mots maximum", before: "Avec le chiffrement de bout en bout, un message est chiffré avant de quitter l'appareil de l'expéditeur et déchiffré sur celui du destinataire. Le fournisseur du service ne devrait pas disposer des clés nécessaires pour lire le contenu pendant le transport. La protection réelle dépend toutefois de l'implémentation, des appareils, de la gestion des clés et des éventuelles sauvegardes.", after: "Le chiffrement de bout en bout agit comme une enveloppe fermée avant l'envoi : seuls les appareils des participants sont normalement équipés pour l'ouvrir. Le service qui transporte le message ne devrait donc pas le lire. Cette protection dépend toutefois de l'application, de vos appareils et de la façon dont les sauvegardes sont configurées.", beforeTag: "Public technique", afterTag: "Optimisé" },
        { type: "cards", items: [
          { title: "Style", text: "Vocabulaire courant, sans terme technique non expliqué.", tint: "violet" },
          { title: "Contexte", text: "Une comparaison présentée comme une analogie.", tint: "bleu" },
          { title: "Contrainte", text: "Moins de 60 mots, un paragraphe, aucune liste.", tint: "corail" },
          { title: "Fond préservé", text: "L'objectif est conservé sans devenir une garantie absolue ; les limites restent visibles.", tint: "vert" },
        ] },
      ],
    },
    {
      id: "tension", title: "Arbitrer et s'arrêter", teaser: "Quand les exigences se contredisent.", tint: "mauve", icon: "scale",
      blocks: [
        { type: "steps", items: [
          { title: "Exactitude, sécurité, légalité, informations indispensables", text: "Une demande client ne justifie pas de les sacrifier." },
          { title: "Besoins d'accès du public et finalité", text: "Un contenu exact mais inutilisable échoue." },
          { title: "Contraintes contractuelles et techniques compatibles", text: "Si elles se contredisent, demander une décision explicite." },
          { title: "Style et esthétique", text: "Ils servent la compréhension, sans masquer les limites." },
        ] },
        { type: "choice", question: "Un texte pour spécialistes doit faire moins de 80 mots, sans le mot « simplement ». La version proposée fait 76 mots, au bon ton, mais contient « simplement » une fois. Est-elle adaptée ?", options: [
          { label: "Oui, l'essentiel est respecté", why: "Une contrainte de charte non respectée suffit à rendre la version non conforme." },
          { label: "Non, une contrainte imposée n'est pas respectée", correct: true, why: "Chaque critère d'acceptation se vérifie, y compris un mot interdit." },
        ] },
        { type: "rule", text: "Arrêtez d'optimiser dès qu'une nouvelle itération ne change plus la compréhension ou l'usage réel du contenu, seulement son esthétique." },
      ],
    },
  ],
  profiles: {
    sirh: {
      id: "metier", title: "Votre métier", teaser: "Consultante SIRH : un guide référent RH pour un manager.", tint: "mauve", icon: "briefcase",
      blocks: [
        { type: "table", caption: "Les cinq angles sur votre guide (cas fictif)", headers: ["Angle", "Application"], rows: [["Contrainte", "Limiter la sortie à trois actions"], ["Contexte et sources", "Conserver la règle de la politique validée"], ["Format", "Une check-list"], ["Style", "Le vocabulaire"], ["Accessibilité", "Intitulés et ordre explicites"]] },
        { type: "example", label: "Conflit du Playground (politique fictive, version 3)", lines: ["Ajouter la règle des 48 heures…", "… en gardant exactement la même longueur."], stamp: "Arbitrage", note: "Protégez la règle validée et proposez une longueur supérieure ou un renvoi vers une explication : le commanditaire choisit." },
      ],
    },
  },
  exam: {
    exercise: 5,
    label: "un prompt d'optimisation complet et un contenu optimisé conforme au besoin",
    steps: ["Vérifier le fond par rapport aux sources", "Fixer des critères d'acceptation observables", "Rédiger le prompt d'optimisation complet", "Comparer les versions et vérifier chaque critère", "Conserver la trace des corrections"],
  },
  flashcards: [
    ["Pourquoi un premier résultat est-il qualifié d'hypothèse de travail ?", "Parce qu'il doit d'abord être comparé aux sources et au besoin avant toute amélioration de forme."],
    ["Pourquoi le relevé des modifications produit par l'IA ne suffit-il pas ?", "Il facilite la comparaison, mais ce n'est pas une preuve : chaque critère se vérifie soi-même."],
    ["Dans l'exemple travaillé, quel changement relève du contexte ?", "L'ajout d'une comparaison concrète, présentée comme une analogie et non comme une description technique complète."],
    ["Si une limite de longueur empêche de garder une réserve importante, que faire ?", "Négocier la longueur ou prévoir un lien vers une explication complémentaire, plutôt que supprimer la réserve en silence."],
    ["Une version « plus courte » avec émojis, sans comparaison des informations, est-elle validée ?", "Non : rien ne prouve que les mêmes informations sont conservées ; il faut comparer les versions sur des critères explicites."],
  ],
};
