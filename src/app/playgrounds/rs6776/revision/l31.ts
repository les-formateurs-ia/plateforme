import type { RevisionData } from "./types";
// Leçon 3.1 « Produire des contenus inclusifs » — fiche de révision.
// Source unique : docs/formation-rs6776/lecon-3.1/cours.html (rien n'est ajouté au cours).
export const data: RevisionData = {
  lesson: "3.1",
  title: "Produire des contenus inclusifs",
  highlight: "inclusifs",
  keyPoints: [
    ["Une obligation", "L'accessibilité numérique est une obligation, pas une option : on part d'un obstacle réel et on fournit un équivalent utilisable."],
    ["Trois familles de besoins", "Visuel, auditif, cognitif : des repères pédagogiques, une même personne pouvant cumuler plusieurs obstacles."],
    ["La contrainte s'écrit", "L'IA ne produit pas un contenu accessible par défaut : la contrainte se pose dans le prompt, puis le contrôle reste humain."],
  ],
  modules: [
    {
      id: "obligation", title: "Une obligation, pas une option", teaser: "Loi de 2005, RGAA, Acte européen.", tint: "violet", icon: "scale",
      blocks: [
        { type: "cards", items: [
          { title: "Loi du 11 février 2005", text: "Son article 47 pose une obligation d'accessibilité pour les services de communication au public en ligne entrant dans son champ d'application.", icon: "book" },
          { title: "RGAA", text: "Le Référentiel général d'amélioration de l'accessibilité en est la traduction opérationnelle, construit à partir des WCAG, la référence internationale.", icon: "list", tint: "bleu" },
          { title: "Acte européen sur l'accessibilité", text: "Il ajoute des exigences pour des catégories précises de produits et services (commerce électronique, certains services bancaires, télécommunications…). Il ne couvre pas automatiquement tout contenu de toute entreprise.", icon: "shield", tint: "vert" },
        ] },
        { type: "rule", text: "Avant d'affirmer qu'un support relève de l'Acte européen sur l'accessibilité : vérifier le service concerné, l'acteur, les exemptions et la règle nationale applicable." },
        { type: "text", text: "L'enjeu dépasse le droit : un contenu inaccessible peut empêcher une personne d'**accéder à une information**, d'**effectuer une démarche** ou de **prendre une décision**. Concevoir inclusif, c'est fournir un équivalent utilisable **sans appauvrir l'information**." },
      ],
    },
    {
      id: "visuel", title: "Handicap visuel", teaser: "Texte alternatif, titres, contraste.", tint: "bleu", icon: "eye",
      blocks: [
        { type: "compare", left: { title: "Ne voit pas", text: "Utilise un lecteur d'écran, qui se repère par les titres : une hiérarchie cohérente, sans saut de niveau." }, right: { title: "Voit mal", text: "A besoin d'un contraste suffisant et d'une taille de texte adaptable sans que la mise en page ne se casse." } },
        { type: "flip", items: [
          { title: "Image décorative", front: "Elle n'apporte aucune information.", back: "Elle reçoit un texte alternatif vide.", icon: "image" },
          { title: "Image informative", front: "Elle porte une fonction ou un contenu utile.", back: "Le texte alternatif décrit cette fonction. Jamais le nom du fichier, jamais ce qui est déjà écrit juste à côté.", icon: "image" },
          { title: "Graphique complexe", front: "Infographie, graphique chargé de données.", back: "Un texte alternatif bref (le visuel et son message essentiel) + les données dans le contenu voisin : description longue ou tableau accessible.", icon: "gauge" },
        ] },
        { type: "example", label: "Texte alternatif d'une infographie lue au lecteur d'écran", lines: ["alt = « image1.jpg »"], stamp: "Pas adapté", note: "Un nom de fichier n'apporte rien à un lecteur d'écran.", danger: true },
        { type: "rule", text: "Le contraste se vérifie avec un outil dédié, à partir des couleurs réellement utilisées, pas à l'œil. Une description générée par l'IA reste un brouillon à relire et corriger." },
      ],
    },
    {
      id: "auditif", title: "Handicap auditif", teaser: "Sous-titres, transcription, relecture.", tint: "corail", icon: "message",
      blocks: [
        { type: "cards", items: [
          { title: "Sous-titres synchronisés", text: "Ils donnent accès aux paroles et aux sons utiles.", icon: "message" },
          { title: "Transcription", text: "Elle permet de parcourir le contenu sous forme textuelle.", icon: "file", tint: "bleu" },
          { title: "Information seulement visuelle", text: "Elle doit être verbalisée, audiodécrite ou intégrée à une transcription descriptive.", icon: "eye", tint: "mauve" },
        ] },
        { type: "compare", tone: true, left: { title: "Sous-titres relus", text: "Premier jeu produit par l'IA, puis relu, corrigé et vérifié en situation avant publication." }, right: { title: "Sous-titres publiés tels quels", text: "Aucune transcription n'est fiable à 100 % : noms propres, sigles, termes techniques, locuteurs, sons porteurs de sens." } },
        { type: "checklist", title: "Avant de publier une vidéo", items: ["Noms propres et sigles vérifiés", "Termes techniques vérifiés", "Locuteurs identifiés", "Sons porteurs de sens indiqués", "Informations visuelles importantes verbalisées"] },
      ],
    },
    {
      id: "cognitif", title: "Handicap cognitif : FALC", teaser: "Simplifier sans appauvrir.", tint: "vert", icon: "book", wide: true,
      blocks: [
        { type: "steps", items: [
          { title: "Une idée par phrase" },
          { title: "Un vocabulaire courant", text: "Expliquer les termes indispensables." },
          { title: "Des phrases courtes à la voix active" },
          { title: "Une mise en page aérée et des exemples concrets" },
        ] },
        { type: "rule", text: "Le FALC suppose la participation effective de personnes en situation de handicap intellectuel à la rédaction et à la relecture. Sans elle, on parle de langage clair ou de texte simplifié, jamais de FALC validé." },
        { type: "beforeAfter", label: "Exemple du cours : une procédure de télétravail", beforeTag: "Pour gestionnaires RH", afterTag: "Brouillon adapté",
          before: "La demande de télétravail occasionnel doit être formulée par écrit auprès du responsable hiérarchique direct au moins 48 heures ouvrées avant la date souhaitée, sauf circonstance exceptionnelle dûment justifiée, et fera l'objet d'une validation expresse consignée dans l'outil de gestion des temps, à défaut de laquelle la demande est réputée refusée.",
          after: "Vous voulez faire du télétravail un jour précis ? Écrivez à votre responsable au moins 48 heures ouvrées avant ce jour. Si une situation exceptionnelle vous empêche de respecter ce délai, expliquez-la dans votre demande. Votre responsable doit accepter votre demande dans l'outil de gestion des temps. Sans validation enregistrée dans cet outil, votre demande est refusée." },
        { type: "text", text: "**Fond préservé** : le délai de 48 heures ouvrées, le destinataire, l'exception justifiée, la validation dans l'outil et la conséquence d'une absence de validation sont tous conservés." },
      ],
    },
    {
      id: "diagnostic", title: "Diagnostiquer", teaser: "Solution adaptée ou pas ?", tint: "mauve", icon: "scan",
      blocks: [
        { type: "sort", prompt: "Pour chaque situation du cours, la solution proposée est-elle adaptée ?", categories: ["Adaptée", "Pas adaptée"], items: [
          { text: "Infographie lue au lecteur d'écran : texte alternatif « image1.jpg ».", answer: "Pas adaptée", why: "Le nom du fichier ne transmet ni la fonction ni le message." },
          { text: "Tableau d'équipe avec des personnes daltoniennes : en plus du rouge, une icône « ⚠ » et le mot « Sous seuil ».", answer: "Adaptée", why: "L'information ne repose plus sur la seule couleur." },
          { text: "Note pour un handicap cognitif léger : paragraphe dense raccourci de moitié en supprimant des phrases, sans autre changement.", answer: "Pas adaptée", why: "Raccourcir n'est pas simplifier : on perd de l'information sans rendre le texte plus clair." },
          { text: "Vidéo pour un public incluant des salariés malentendants : sous-titres générés par IA publiés sans relecture.", answer: "Pas adaptée", why: "Aucune transcription automatique n'est fiable à 100 % : relecture obligatoire." },
        ] },
      ],
    },
    {
      id: "prompt", title: "Le prompt d'accessibilité", teaser: "Le gabarit réutilisable.", tint: "violet", icon: "pen",
      blocks: [
        { type: "steps", items: [
          { title: "Contenu à adapter", text: "Le coller et préciser son usage." },
          { title: "Public et besoin d'accessibilité", text: "Lecteur d'écran, daltonisme, difficulté de lecture…" },
          { title: "Contrainte d'accessibilité précise", text: "Structure de titres, texte alternatif, vocabulaire courant, une idée par phrase, contraste, sous-titres…" },
          { title: "Conserve", text: "Les informations obligatoires à ne jamais perdre." },
          { title: "Résultat attendu", text: "Le contenu adapté, puis les points à faire valider par une personne concernée ou un outil de contrôle." },
        ] },
        { type: "choice", question: "Quel prompt pose vraiment la contrainte d'accessibilité ?", options: [
          { label: "« Simplifie ce texte. »", why: "Ne suffit pas : ni le besoin, ni les règles, ni les informations à préserver ne sont explicités." },
          { label: "« Rends-le plus facile à lire. »", why: "Même problème : l'outil peut supprimer un délai ou une condition." },
          { label: "Un prompt qui décrit le public, les règles d'écriture, les informations à conserver et demande de signaler ce qui ne peut pas être simplifié sans perte de sens.", correct: true, why: "C'est la méthode du cours. La sortie reste un brouillon à comparer au texte source." },
        ] },
        { type: "rule", text: "Accessibilité et clarté rédactionnelle se recoupent sans se confondre : elles se travaillent ensemble, jamais l'une à la place de l'autre." },
      ],
    },
  ],
  profiles: {
    sirh: {
      id: "metier", title: "Votre métier", teaser: "Consultante SIRH : offres et espaces candidature.", tint: "mauve", icon: "briefcase",
      blocks: [
        { type: "text", text: "Vous rédigez les offres d'emploi de vos clients et paramétrez leurs logiciels de recrutement : une offre ou un espace candidature mal conçu peut écarter un candidat en situation de handicap **avant même qu'il postule**." },
        { type: "sort", prompt: "Quel besoin est prioritaire ? (cas fictifs de votre Playground)", categories: ["Visuel", "Auditif", "Cognitif"], items: [
          { text: "Le bouton pour postuler n'est qu'une icône de flèche : le lecteur d'écran annonce seulement « bouton ».", answer: "Visuel", why: "Il faut un texte associé, par exemple « Postuler à cette offre »." },
          { text: "La vidéo de présentation de la page carrières n'a aucun sous-titre.", answer: "Auditif", why: "Sous-titres synchronisés et transcription." },
          { text: "Une offre en un seul paragraphe de quinze lignes mêle missions, avantages et conditions.", answer: "Cognitif", why: "Une idée par phrase, des listes séparées, sans perdre d'information." },
          { text: "L'unique étape avant embauche est un entretien téléphonique.", answer: "Auditif", why: "Proposer une alternative écrite ou une visio sous-titrée, annoncée dans l'offre." },
        ] },
        { type: "checklist", title: "Avant de publier une offre", items: ["Rôle de chaque visuel traité", "Chaque information de l'offre conservée", "Une idée par phrase", "Résultat testé dans le support final"] },
      ],
    },
  },
  exam: {
    exercise: 4,
    label: "production de contenus inclusifs",
    steps: [
      "Repérer le besoin de la personne décrite (ici, un handicap cognitif) et les informations à conserver.",
      "Choisir l'outil d'IA générative et rédiger un prompt qui pose explicitement la contrainte d'accessibilité.",
      "Produire la note interne : une idée par phrase, vocabulaire courant, mise en page aérée, tous les éléments conservés.",
      "Comparer la sortie au contenu source et corriger toute perte ou tout ajout.",
      "Ne parler de FALC que si des personnes concernées participent à la rédaction et à la relecture.",
    ],
  },
  flashcards: [
    ["Quel texte pose, en France, l'obligation d'accessibilité des services de communication au public en ligne ?", "L'article 47 de la loi du 11 février 2005, traduit concrètement par le RGAA."],
    ["Quel texte alternatif reçoit une image purement décorative ?", "Un texte alternatif vide."],
    ["Comment un lecteur d'écran permet-il d'aller directement à une section ?", "Grâce à une hiérarchie de titres cohérente (h1, h2, h3…), sans saut de niveau."],
    ["Que fait le vérificateur d'accessibilité de Word et PowerPoint ?", "Il signale les textes alternatifs manquants et propose une suggestion, à contrôler."],
    ["Un texte FALC bien rédigé est-il forcément accessible à un lecteur d'écran ?", "Non : si sa mise en page ignore la hiérarchie des titres, il peut rester inaccessible. Les deux exigences se travaillent ensemble."],
  ],
};
