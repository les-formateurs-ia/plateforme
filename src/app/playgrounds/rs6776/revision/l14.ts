import type { RevisionData } from "./types";
// Leçon 1.4 « Reconnaître les informations à protéger » — fiche de révision.
// Source unique : docs/formation-rs6776/lecon-1.4/cours.html (rien n'est ajouté au cours).
export const data: RevisionData = {
  lesson: "1.4",
  title: "Reconnaître les informations à protéger",
  highlight: "informations à protéger",
  keyPoints: [
    ["Trois familles qui se cumulent", "Donnée personnelle, information confidentielle, information stratégique : un même contenu peut relever de plusieurs."],
    ["« Sensible » a un sens juridique", "Au sens de l'article 9 du RGPD, seules certaines catégories de données personnelles sont des données sensibles."],
    ["Nature et provenance", "Interne ou externe, l'enjeu diffère ; un document se lit fragment par fragment."],
  ],
  modules: [
    {
      id: "familles", title: "Trois familles", teaser: "Personnelle, confidentielle, stratégique.", tint: "violet", icon: "layers",
      blocks: [
        { type: "text", text: "Une **information à protéger** est une information dont la divulgation, la perte ou l'usage détourné peut causer un préjudice à une personne, une organisation ou un client." },
        { type: "cards", items: [
          { title: "Donnée personnelle", text: "Identifie ou permet d'identifier une personne physique : nom, coordonnées, date de naissance, santé, situation familiale, rémunération individuelle.", icon: "users" },
          { title: "Information confidentielle", text: "Couverte par un engagement de discrétion ou un secret professionnel : contrat en négociation, dossier client en cours.", icon: "lock", tint: "corail" },
          { title: "Information stratégique", text: "Fonctionnement ou position concurrentielle d'une structure : chiffres non publiés, méthode interne, code source, projet non annoncé.", icon: "target", tint: "bleu" },
        ] },
        { type: "rule", text: "Les familles ne s'excluent pas : un compte-rendu d'entretien annuel est à la fois une donnée personnelle et une information confidentielle." },
      ],
    },
    {
      id: "sensible", title: "Sensible, au sens du RGPD", teaser: "L'article 9 et le croisement.", tint: "corail", icon: "scale",
      blocks: [
        { type: "flip", items: [
          { title: "Donnée sensible (article 9)", front: "Origine raciale ou ethnique, opinions politiques, convictions religieuses ou philosophiques, appartenance syndicale.", back: "Aussi : données génétiques ou biométriques servant à identifier, santé, vie ou orientation sexuelle. Protection renforcée.", icon: "shield" },
          { title: "Tarif, secret d'affaires", front: "À protéger, sans aucun doute.", back: "Mais ce n'est pas une « donnée sensible » au sens de l'article 9.", icon: "lock" },
          { title: "Le croisement", front: "Un prénom fictif isolé n'identifie personne.", back: "Associé à une date de naissance, une rémunération et un état de santé, il peut identifier quelqu'un et révéler une donnée sensible.", icon: "search" },
        ] },
      ],
    },
    {
      id: "provenance", title: "Interne ou externe", teaser: "D'où vient l'information.", tint: "bleu", icon: "eye",
      blocks: [
        { type: "compare",
          left: { title: "Donnée interne", text: "Concerne votre structure : stratégie, finances, méthodes, données de son personnel. Une fuite l'affaiblit d'abord elle-même." },
          right: { title: "Donnée externe", text: "Concerne un tiers : client, prospect, partenaire, candidat, fournisseur. Une fuite engage en plus votre responsabilité envers lui." } },
        { type: "rule", text: "Interne ne veut pas dire librement réutilisable. Nature, provenance, finalité et destinataires sont quatre questions distinctes." },
        { type: "sort", prompt: "Classez chaque information selon sa provenance, du point de vue de la structure qui l'utilise.", categories: ["Interne", "Externe"], items: [
          { text: "L'état de santé d'un collaborateur de la structure", answer: "Interne", why: "Donnée personnelle, interne : elle concerne le personnel de la structure." },
          { text: "Le montant du contrat d'un client", answer: "Externe", why: "Information commerciale confidentielle concernant un tiers." },
          { text: "Les coordonnées d'un candidat à un recrutement", answer: "Externe", why: "Un candidat est un tiers à la structure." },
          { text: "Une méthode de travail propre à la structure", answer: "Interne", why: "Elle concerne le fonctionnement propre de la structure." },
        ] },
      ],
    },
    {
      id: "phrase", title: "Une phrase, plusieurs informations", teaser: "L'exemple du cours, fragment par fragment.", tint: "vert", icon: "scan", wide: true,
      blocks: [
        { type: "example", label: "Exemple fictif du cours", stamp: "À protéger", danger: true,
          lines: ["« Rédige un message pour informer l'équipe que Julien Blanc, actuellement en arrêt pour raisons médicales jusqu'au 15 mars, sera remplacé par intérim par Sophie Roux, dont le salaire vient d'être revalorisé à 42 000 euros, sur les dossiers du client Meranto dont le contrat représente 180 000 euros de chiffre d'affaires annuel. »"],
          note: "Nom et santé de Julien Blanc : personnelle, interne. Salaire de Sophie Roux : personnelle, interne. Client Meranto et montant du contrat : commerciale confidentielle, externe." },
        { type: "steps", items: [
          { title: "Lire par fragments", text: "Chaque nom, chiffre, date ou situation individuelle séparément." },
          { title: "Poser trois questions", text: "Identifie-t-il quelqu'un ? Est-il couvert par un engagement de discrétion ? À qui appartient-il ?" },
          { title: "Appliquer la règle la plus protectrice", text: "Un classement global peut masquer un fragment critique." },
        ] },
      ],
    },
    {
      id: "risques", title: "Les risques concrets", teaser: "Pas besoin de piratage.", tint: "mauve", icon: "alert",
      blocks: [
        { type: "cards", items: [
          { title: "Fuite vers l'extérieur", text: "Transmise par inadvertance à un tiers ou à un service qui n'aurait pas dû la recevoir.", icon: "alert", tint: "corail" },
          { title: "Engagement rompu", text: "Un secret ou une clause de discrétion diffusé au-delà de ce qui était convenu.", icon: "lock", tint: "corail" },
          { title: "Exposition disproportionnée", text: "Une information personnelle communiquée sans lien avec l'objectif poursuivi.", icon: "eye", tint: "corail" },
          { title: "Perte de confiance", text: "Un client ou un collaborateur revoit, parfois durablement, la confiance accordée.", icon: "users", tint: "corail" },
        ] },
        { type: "rule", text: "Un outil d'IA générative ajoute un canal à évaluer. Une conversation séparée aide à s'organiser mais ne garantit pas la confidentialité : identifiez, minimisez, puis vérifiez l'outil, l'offre, les réglages, les destinataires et l'autorisation." },
      ],
    },
  ],
  profiles: {
    sirh: {
      id: "metier", title: "Votre métier", teaser: "Consultante SIRH : votre activité, chaque client.", tint: "mauve", icon: "briefcase",
      blocks: [
        { type: "compare",
          left: { title: "Interne, pour vous", text: "Votre propre activité : vos tarifs, votre méthode, votre liste de clients. Pas sensibles au sens du RGPD, mais à protéger." },
          right: { title: "Externe, pour vous", text: "Tout ce qui vient d'un client, même ce qu'il considère comme interne chez lui : organigramme, fiches salarié, bulletins de paie." } },
        { type: "checklist", title: "Vos réflexes multi-clients", items: [
          "Pendant une formation, j'utilise un environnement de test et des profils fictifs",
          "Je ne mélange jamais deux clients dans un même échange avec un outil d'IA",
          "Je ne mélange pas mes données avec celles d'une mission en cours",
        ] },
      ],
    },
  },
  exam: {
    exercise: 3, label: "confidentialité des données",
    steps: [
      "Lire le contenu fragment par fragment",
      "Qualifier chaque information : nature et provenance",
      "Réserver le mot « sensible » aux catégories de l'article 9",
      "Justifier le niveau de protection retenu",
    ],
    table: { headers: ["Fragment", "Nature", "Provenance"], row: ["Salaire d'une collaboratrice", "Donnée personnelle", "Interne"] },
  },
  flashcards: [
    ["Une information confidentielle est-elle forcément une donnée personnelle ?", "Non : un contrat en négociation peut être confidentiel sans identifier personne. Mais les familles peuvent se cumuler."],
    ["Le code source d'une structure relève de quelle famille ?", "De l'information stratégique."],
    ["Pourquoi une fuite externe est-elle plus engageante ?", "Elle engage en plus votre responsabilité envers un tiers qui vous a fait confiance."],
    ["Un candidat à un recrutement : donnée interne ou externe ?", "Externe : il est un tiers à la structure."],
    ["Quelle forme prend le plus souvent une violation de confidentialité ?", "Rarement un piratage : une fuite par inadvertance, un engagement rompu, une exposition disproportionnée, une perte de confiance."],
  ],
};
