import type { RevisionData } from "./types";
// Leçon 2.1 « Les bases du prompt engineering » — fiche de révision.
// Source : docs/formation-rs6776/lecon-2.1/cours.html (rien n'est ajouté au cours).
export const data: RevisionData = {
  lesson: "2.1",
  title: "Les bases du prompt engineering",
  highlight: "prompt engineering",
  keyPoints: [
    ["Un prompt vague, un résultat imprévisible", "Sans destinataire, circonstances ni format, le modèle comble les vides avec les choix les plus probables, pas avec votre contexte."],
    ["Cinq éléments distincts", "Rôle, Cible, Objectif, Contexte, Format : cinq décisions à prendre une par une avant la génération."],
    ["Adapté, conforme, puis vérifié", "Une bonne structure augmente les chances d'un bon brouillon ; elle ne garantit ni le premier essai ni l'exactitude."],
  ],
  modules: [
    {
      id: "vague", title: "Le prompt vague", teaser: "Même demande, résultats très différents.", tint: "corail", icon: "alert",
      blocks: [
        { type: "text", text: "Un modèle de langage ne connaît, par défaut, ni le **destinataire réel**, ni les **circonstances**, ni la **forme attendue**. Il complète une suite de mots à partir de ce qui lui est fourni." },
        { type: "example", label: "Prompt volontairement incomplet (exemple du cours)", lines: ["« Écris un message pour informer l'équipe du changement. »", "→ un mail long et formel sur des horaires", "→ un message court et informel sur un nouvel outil", "→ une note très officielle sur une réorganisation"], stamp: "Imprévisible", note: "Aucune version n'est objectivement meilleure : rien, dans le prompt, ne permettait de trancher." },
        { type: "rule", text: "La structure consiste à fixer ces choix avant la génération, plutôt que de les découvrir une fois la réponse produite." },
      ],
    },
    {
      id: "cinq", title: "Les cinq éléments", teaser: "Retournez chaque carte : la question, puis le piège.", tint: "violet", icon: "layers", wide: true,
      blocks: [
        { type: "flip", items: [
          { title: "Rôle", front: "Quelle posture l'IA doit-elle adopter ?", back: "Il oriente vocabulaire et angles, sans donner de qualification réelle : « agis comme un juriste » ne produit pas un avis juridique validé.", icon: "users" },
          { title: "Cible", front: "À qui le résultat s'adresse-t-il ?", back: "L'élément le plus souvent oublié. Il ajuste le vocabulaire, la longueur tolérée et les précisions à développer.", icon: "target" },
          { title: "Objectif", front: "Que doit accomplir le résultat, précisément ?", back: "« Parler de sécurité » est vague ; « cinq réflexes activables dès le premier jour » est vérifiable.", icon: "check" },
          { title: "Contexte", front: "Quelles informations de fond sont nécessaires ?", back: "Donner ce qui change la réponse, pas tout ce que l'on sait : trop peu rend générique, trop dilue l'attention.", icon: "book" },
          { title: "Format", front: "Sous quelle forme livrer le résultat ?", back: "Structure, longueur, registre, éléments à inclure ou exclure. Souvent le plus rentable à préciser.", icon: "list" },
        ] },
      ],
    },
    {
      id: "trier", title: "À quel élément ?", teaser: "Classez les fragments du prompt cybersécurité.", tint: "bleu", icon: "scan",
      blocks: [
        { type: "sort", prompt: "Exemple du cours : rangez chaque fragment dans l'élément qu'il fixe.", categories: ["Rôle", "Cible", "Objectif", "Contexte", "Format"], items: [
          { text: "« Tu es un formateur en sécurité informatique. »", answer: "Rôle" },
          { text: "« Ce message s'adresse à des nouveaux employés qui n'ont jamais suivi de formation cybersécurité. »", answer: "Cible" },
          { text: "« Rédige une liste de cinq réflexes essentiels à adopter dès leur premier jour. »", answer: "Objectif" },
          { text: "« L'entreprise vient de subir une tentative de phishing ciblée sur les adresses email professionnelles. »", answer: "Contexte" },
          { text: "« Liste à puces, une phrase d'explication par réflexe, ton rassurant et non technique. »", answer: "Format" },
        ] },
        { type: "beforeAfter", label: "Le même besoin", before: "Rédige quelque chose sur les réflexes de cybersécurité pour les nouveaux employés.", after: "Rôle, Cible, Objectif, Contexte et Format précisés : un brouillon bien plus facile à évaluer.", beforeTag: "Trop générique", afterTag: "Structuré" },
      ],
    },
    {
      id: "piege", title: "Cible et objectif séparés", teaser: "Le piège de la tâche formulée en creux.", tint: "mauve", icon: "target",
      blocks: [
        { type: "compare", left: { title: "Deux décisions", text: "Une phrase pour la cible, une phrase pour l'objectif : le modèle n'a rien à deviner." }, right: { title: "Une tâche en creux", text: "« Aide-moi à rédiger quelque chose sur ce sujet » : il doit deviner pour qui écrire et ce que le résultat doit accomplir." }, tone: true },
        { type: "choice", question: "Dans les Exercices prompts, six repères s'allument : Rôle, Contexte, Tâche, Format, Ton & public, Contraintes. Comment les relier aux cinq éléments du cours ?", options: [
          { label: "Ce sont d'autres critères, sans rapport avec la structure du cours", why: "Non : ce sont les mêmes décisions, découpées autrement." },
          { label: "La Tâche correspond à l'Objectif, Ton & public à la Cible, et les Contraintes complètent le Format", correct: true, why: "Oui. La cible reste bien distincte de l'objectif. Un repère allumé signale un mot-clé détecté, pas une décision prise." },
          { label: "Il suffit que les six repères soient allumés pour que le prompt soit bon", why: "Non : les repères s'allument par détection de mots-clés. C'est le contenu de chaque élément qui compte." },
        ] },
        { type: "text", text: "Quand une tâche revient sous une forme proche, fixez un **prompt type** : seul le contexte change d'une fois à l'autre." },
      ],
    },
    {
      id: "verifier", title: "Adapté, conforme, vérifié", teaser: "Deux vérifications, puis un second contrôle.", tint: "vert", icon: "shield",
      blocks: [
        { type: "cards", items: [
          { title: "Adapté", text: "Le fond correspond-il réellement à la cible et au contexte donnés ?", tint: "vert", icon: "target" },
          { title: "Conforme", text: "La forme livrée est-elle celle qui était précisée, ni plus courte, ni plus longue, ni dans un autre format ?", tint: "bleu", icon: "list" },
        ] },
        { type: "checklist", title: "Second contrôle, indépendant", items: ["Faits et sources", "Chiffres et dates", "Omissions", "Biais", "Confidentialité", "Droits et actions promises"] },
        { type: "rule", text: "Un résultat peut respecter parfaitement le format tout en étant faux, incomplet ou impropre à la diffusion. Documentez la correction quand l'enjeu est important." },
      ],
    },
  ],
  profiles: {
    sirh: {
      id: "metier", title: "Votre métier", teaser: "Consultante SIRH : un pas-à-pas réutilisable.", tint: "mauve", icon: "briefcase",
      blocks: [
        { type: "beforeAfter", label: "Pas-à-pas pour un client", before: "Explique comment poser un congé dans le logiciel RH.", after: "Rôle : rédacteur technique de supports SIRH. Cible : salariés qui utilisent l'outil pour la première fois. Objectif : la demande de congé, du premier clic à la confirmation. Contexte : le parcours exact, écran par écran. Format : liste numérotée, une action par étape, sans jargon.", beforeTag: "Écrit entre deux rendez-vous", afterTag: "Prompt type" },
        { type: "table", caption: "D'un client à l'autre", headers: ["Élément", "Ce qui se passe"], rows: [["Rôle, Cible, Format", "Restent presque identiques"], ["Objectif", "Varie un peu selon la tâche"], ["Contexte", "Change à chaque client : logiciel, module, parcours"]] },
        { type: "rule", text: "Le prompt type porte sur la structure : il ne change rien au cloisonnement de vos données entre clients." },
      ],
    },
  },
  exam: {
    exercise: 2,
    label: "rédiger des prompts structurés pour produire un contenu",
    steps: ["Identifier la cible et l'objectif vérifiable", "Rédiger le prompt en Rôle, Cible, Objectif, Contexte, Format", "Vérifier que le résultat est adapté et conforme", "Contrôler faits, omissions et confidentialité"],
  },
  flashcards: [
    ["Pourquoi deux générations d'un même prompt incomplet peuvent-elles différer en longueur et en ton ?", "Parce que le modèle remplace les éléments non précisés par les choix les plus probables de son entraînement, pas par votre contexte réel."],
    ["Que ne donne jamais le Rôle au modèle ?", "Une qualification réelle ou un accès à des sources fiables : il oriente seulement la posture rédactionnelle."],
    ["Quel risque concret présente une « tâche » qui fusionne cible et objectif ?", "Le modèle doit deviner deux inconnues : pour qui écrire et ce que le résultat doit précisément accomplir."],
    ["Que se passe-t-il avec un contexte excessif ou hors sujet ?", "Il dilue l'attention du modèle sur ce qui compte : il faut donner ce qui change la réponse, pas tout ce que l'on sait."],
    ["Quel test simple permet de juger la clarté d'un prompt avant l'envoi ?", "Le montrer à un collègue sans contexte : s'il serait perdu pour le suivre à la lettre, le modèle le sera aussi."],
  ],
};
