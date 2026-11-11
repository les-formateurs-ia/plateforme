import type { RevisionData } from "./types";
// Leçon 3.2 « Cadre légal : IA Act, RGPD et veille » — fiche de révision.
// Source unique : docs/formation-rs6776/lecon-3.2/cours.html (rien n'est ajouté au cours).
export const data: RevisionData = {
  lesson: "3.2",
  title: "Cadre légal : IA Act, RGPD et veille",
  highlight: "veille",
  keyPoints: [
    ["Qualifier", "Les obligations de l'IA Act dépendent de la fonction, de la finalité prévue, du contexte et du risque pour les personnes."],
    ["Articuler", "Le RGPD s'applique toujours dès qu'il y a des données personnelles : deux analyses séparées, puis articulées."],
    ["Vérifier", "Une échéance peut changer : s'appuyer sur la version la plus récente des textes, dans une source officielle datée."],
  ],
  modules: [
    {
      id: "risques", title: "L'IA Act : une régulation par les risques", teaser: "La grille pédagogique en quatre niveaux.", tint: "violet", icon: "scale", wide: true,
      blocks: [
        { type: "text", text: "Le règlement (UE) 2024/1689, dit **IA Act**, encadre des systèmes et des modèles d'IA, leurs **fournisseurs**, leurs **déployeurs** et certains usages. La grille ci-dessous est un **repère pédagogique** : le texte juridique ne se résume pas à une étiquette commerciale." },
        { type: "table", caption: "Grille pédagogique du cours", headers: ["Niveau", "Exemple", "Obligation principale"], rows: [
          ["Inacceptable (article 5)", "Reconnaissance des émotions au travail hors motif médical ou de sécurité ; notation sociale entraînant un traitement préjudiciable injustifié.", "Ne pas déployer la pratique interdite et vérifier précisément son champ."],
          ["Élevé (article 6 et annexes)", "Système destiné à analyser, filtrer ou évaluer des candidatures et à influencer une présélection.", "Exigences selon le rôle, dont la supervision humaine effective."],
          ["Transparence spécifique (article 50)", "Agent conversationnel, contenu synthétique, diffusion professionnelle d'un deepfake.", "Informer les personnes, marquage ou divulgation selon les cas prévus."],
          ["Faible ou minimal", "Brouillon d'un e-mail interne sans donnée sensible ni décision affectant une personne.", "Pas d'exigence « haut risque », mais RGPD, droit du travail, propriété intellectuelle toujours applicables."],
        ] },
      ],
    },
    {
      id: "qualifier", title: "Qualifier un cas", teaser: "Les quatre situations du cours.", tint: "bleu", icon: "target",
      blocks: [
        { type: "sort", prompt: "Quel régime principal pour chaque situation ?", categories: ["Interdit", "Haut risque", "Transparence spécifique", "Faible ou minimal"], items: [
          { text: "Un éditeur de jeu vidéo génère les dialogues de personnages secondaires, sans décision affectant une personne réelle.", answer: "Faible ou minimal" },
          { text: "Un outil trie et note les CV, la note influençant directement qui est convoqué.", answer: "Haut risque", why: "Informer les candidats ne suffit pas : c'est un usage de recrutement listé à l'annexe III." },
          { text: "Un chatbot généraliste d'e-commerce précise qu'il s'agit d'une IA.", answer: "Transparence spécifique" },
          { text: "Une entreprise analyse les expressions du visage de ses salariés pour déduire leur motivation, sans motif médical ou de sécurité.", answer: "Interdit", why: "La documentation et la supervision ne rendent pas une pratique interdite acceptable." },
        ] },
        { type: "rule", text: "Un premier repère seulement : une analyse professionnelle vérifie ensuite la finalité, les définitions, les exceptions, les rôles et les autres textes applicables." },
      ],
    },
    {
      id: "rgpd", title: "Le RGPD, toujours là", teaser: "Les sept principes de l'article 5.", tint: "vert", icon: "shield",
      blocks: [
        { type: "flip", items: [
          { title: "Licéité, loyauté, transparence", front: "Premier principe.", back: "Une base légale avant tout traitement, et des personnes informées." },
          { title: "Limitation des finalités", front: "Deuxième principe.", back: "Des données de candidats collectées pour un poste ne servent pas à un autre usage sans nouvelle base légale." },
          { title: "Minimisation", front: "Troisième principe.", back: "Seulement les données nécessaires à la tâche, jamais un dossier complet « pour aller plus vite »." },
          { title: "Exactitude", front: "Quatrième principe.", back: "Une IA peut halluciner un fait sur une personne réelle : vérifier avant tout usage." },
          { title: "Limitation de la conservation", front: "Cinquième principe.", back: "Les échanges ne sont pas conservés au-delà du nécessaire." },
          { title: "Intégrité et confidentialité", front: "Sixième principe.", back: "Vérifier l'outil, ses conditions d'utilisation et l'endroit où transitent les données." },
          { title: "Responsabilité", front: "Septième principe.", back: "C'est l'organisation qui utilise l'outil qui démontre sa conformité, pas l'éditeur." },
        ] },
      ],
    },
    {
      id: "supervision", title: "Supervision ou décision automatisée", teaser: "Article 14 de l'IA Act, article 22 du RGPD.", tint: "corail", icon: "users",
      blocks: [
        { type: "compare", left: { title: "IA Act · article 14", text: "Supervision humaine effective d'un système à haut risque : comprendre ses limites et pouvoir ignorer, remplacer ou inverser sa sortie." }, right: { title: "RGPD · article 22", text: "Décision fondée exclusivement sur un traitement automatisé, avec un effet juridique ou significatif : un principe, des exceptions et des garanties." } },
        { type: "rule", text: "Un humain qui ouvre le dossier ne suffit pas : son intervention doit être compétente, réelle et capable de modifier la décision." },
        { type: "steps", items: [
          { title: "IA Act", text: "Usage à haut risque à qualifier : finalité prévue, rôles fournisseur et déployeur, supervision effective." },
          { title: "RGPD · minimisation", text: "Seulement les données pertinentes pour le poste." },
          { title: "RGPD · exactitude", text: "Vérifier chaque note ou synthèse avant toute décision." },
          { title: "RGPD · article 22 et transparence", text: "Décision exclusivement automatisée et significative ? Exception mobilisée, garanties, intervention humaine, contestation." },
        ] },
      ],
    },
    {
      id: "veille", title: "Organiser sa veille", teaser: "Sources officielles, trace datée.", tint: "mauve", icon: "search", wide: true,
      blocks: [
        { type: "example", label: "Calendrier donné par le cours", lines: [
          "État vérifié le 14 septembre 2026 (source : Commission européenne).",
          "AI Omnibus entré en vigueur le 27 juillet 2026.",
          "Haut risque, annexe III : à partir du 2 décembre 2027 ; annexe I : à partir du 2 août 2028.",
          "Article 50, transparence : depuis le 2 août 2026.",
        ], stamp: "À revérifier", note: "Une date retenue aujourd'hui peut changer dans les mois qui suivent, y compris après un accord annoncé comme acquis." },
        { type: "cards", items: [
          { title: "CNIL", text: "Actualité RGPD et positions sur l'IA.", icon: "shield" },
          { title: "EUR-Lex", text: "Texte consolidé et à jour des règlements européens.", icon: "book", tint: "bleu" },
          { title: "Légifrance", text: "Droit français.", icon: "scale", tint: "vert" },
          { title: "Bureau de l'IA", text: "Publications de la Commission européenne pour le suivi de l'IA Act.", icon: "search", tint: "mauve" },
        ] },
        { type: "checklist", title: "Pour chaque règle citée", items: ["La source primaire", "Le lien", "La date de consultation", "La version du texte", "Son statut juridique"] },
        { type: "choice", question: "Une IA connectée au web vous donne une date d'application. Que faites-vous ?", options: [
          { label: "Je la cite : elle a fait une recherche en ligne.", why: "Elle peut utiliser une version ancienne, confondre une proposition avec un texte en vigueur ou omettre une exception." },
          { label: "Je vérifie dans la source primaire et je note lien, date de consultation, version et statut.", correct: true, why: "La réponse d'une IA n'est jamais une source juridique." },
        ] },
      ],
    },
  ],
  profiles: {
    sirh: {
      id: "metier", title: "Votre métier", teaser: "Consultante SIRH : paramétrer un logiciel de recrutement.", tint: "mauve", icon: "briefcase",
      blocks: [
        { type: "text", text: "Vous connaissez le RGPD et la CNIL. L'enjeu ici : distinguer ce que l'**IA Act** ajoute, pour ne jamais attribuer une règle au mauvais texte quand vous conseillez un client." },
        { type: "compare", tone: true, left: { title: "Paramétrage à proposer", text: "Le score trie seulement l'ordre d'affichage ; le recruteur examine chaque CV avant toute décision. (Cas fictif de votre Playground.)" }, right: { title: "Paramétrage à corriger", text: "Toute candidature sous un seuil est rejetée sans relecture : supervision effective et article 22 du RGPD à analyser." } },
        { type: "checklist", title: "Avant de livrer un paramétrage", items: ["Usage qualifié au regard de l'IA Act, rôles identifiés", "Seulement les données utiles au poste", "Durée de conservation fixée", "Candidats informés, intervention humaine possible", "Biais recherchés", "Chaque règle appuyée sur une source officielle datée"] },
      ],
    },
  },
  exam: {
    exercise: 6,
    label: "directives réglementaires et éthique",
    steps: [
      "Décrire la finalité et les personnes affectées par le contenu ou le système.",
      "Qualifier le cas et les rôles au regard de l'IA Act, sans s'arrêter à une étiquette.",
      "Analyser séparément le RGPD (données d'une personne réelle, exactitude, transparence) et les biais.",
      "Proposer des corrections et un prompt correctif précis.",
      "Vérifier chaque conclusion dans une source officielle datée (lien, date de consultation, version, statut).",
    ],
  },
  flashcards: [
    ["Qui doit démontrer la conformité au RGPD quand on utilise un outil d'IA générative ?", "L'organisation qui utilise l'outil, pas l'éditeur de l'outil."],
    ["Un usage à risque faible ou minimal au regard de l'IA Act échappe-t-il au RGPD ?", "Non : le RGPD, le droit du travail, la propriété intellectuelle ou les règles sectorielles peuvent toujours s'appliquer."],
    ["Que doivent pouvoir faire les personnes chargées de la supervision humaine (article 14) ?", "Comprendre les limites du système et pouvoir ignorer, remplacer ou inverser sa sortie."],
    ["Des données de candidats collectées pour un poste peuvent-elles alimenter un autre usage ?", "Pas sans nouvelle base légale : c'est la limitation des finalités."],
    ["La décision du Garante italien sur ClothOff est-elle une sanction prononcée au titre de l'IA Act ?", "Non : l'autorité s'y réfère, mais le constat de violation repose sur les articles 5 et 25 du RGPD."],
  ],
};
