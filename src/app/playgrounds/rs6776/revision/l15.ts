import type { RevisionData } from "./types";
// Leçon 1.5 « Sécuriser son usage de l'IA » — fiche de révision.
// Source unique : docs/formation-rs6776/lecon-1.5/cours.html (rien n'est ajouté au cours).
export const data: RevisionData = {
  lesson: "1.5",
  title: "Sécuriser son usage de l'IA",
  highlight: "Sécuriser",
  keyPoints: [
    ["Retirer l'inutile, généraliser l'utile", "Corriger un prompt, c'est décider information par information, et pouvoir justifier chaque choix."],
    ["Pseudonyme n'est pas anonyme", "Tant qu'une correspondance existe, la donnée reste personnelle au sens du RGPD."],
    ["Moindre privilège et relecture", "Des accès limités en amont, une revue manuelle de ce qui sort en aval."],
  ],
  modules: [
    {
      id: "reflexes", title: "Les quatre réflexes", teaser: "Du besoin à la vérification.", tint: "violet", icon: "list",
      blocks: [
        { type: "steps", items: [
          { title: "Supprimer ce qui est inutile", text: "L'information est-elle nécessaire à la tâche ? Sinon, retirez-la." },
          { title: "Anonymiser ou pseudonymiser", text: "Si elle reste utile : réduire sa précision ou remplacer les identifiants, en sachant ce que l'on fait réellement." },
          { title: "Un cadre autorisé, des accès limités", text: "Uniquement un outil et une offre autorisés." },
          { title: "Vérifier la sortie", text: "Relire avant tout usage." },
        ] },
        { type: "rule", text: "La réintégration éventuelle des vraies informations se fait hors de l'outil, dans l'environnement autorisé, avec une nouvelle validation." },
      ],
    },
    {
      id: "anonymiser", title: "Anonymiser ou pseudonymiser", teaser: "La différence qui change tout.", tint: "bleu", icon: "shield",
      blocks: [
        { type: "compare",
          left: { title: "Anonymisation", text: "Le lien avec la personne est supprimé de façon irréversible. La législation sur les données personnelles ne s'applique plus ; confidentialité, propriété intellectuelle ou secret peuvent subsister." },
          right: { title: "Pseudonymisation", text: "Le nom est remplacé, mais une correspondance reste conservée (tableau, document d'origine). La donnée reste personnelle au sens du RGPD." } },
        { type: "choice", question: "Vous remplacez un nom par « Personne A » et gardez le document d'origine. Qu'avez-vous fait ?", options: [
          { label: "Une anonymisation : le nom n'apparaît plus", why: "L'identité peut être retrouvée grâce au document d'origine." },
          { label: "Une pseudonymisation", correct: true, why: "Une correspondance reste possible : la donnée reste personnelle, et l'envoi à un service d'IA n'est pas autorisé pour autant." },
        ] },
      ],
    },
    {
      id: "corriger", title: "Un prompt corrigé", teaser: "L'exemple travaillé du cours.", tint: "vert", icon: "pen", wide: true,
      blocks: [
        { type: "beforeAfter", label: "Réclamation client · exemple fictif du cours", beforeTag: "À ne pas envoyer tel quel", afterTag: "Prompt corrigé",
          before: "« Réponds à cette réclamation client de façon empathique et propose un geste commercial : Amélie Kernaléguen, cliente depuis 2019, commande n°77452 d'un montant de 1 240 euros pour la société Bréhat Matériaux, insatisfaite d'un délai de livraison de trois semaines, menace de résilier son contrat annuel. Coordonnées : amelie.kernaleguen@brehatmateriaux.fr, IBAN … pour un éventuel remboursement. »",
          after: "« Réponds à cette réclamation client de façon empathique et propose un geste commercial adapté à un retard de livraison de trois semaines sur une commande de niveau intermédiaire. La cliente est fidèle depuis plusieurs années et évoque une possible résiliation de son contrat annuel : le ton doit rassurer sans sur-promettre. »" },
        { type: "sort", prompt: "Pour chaque élément, quelle décision a été prise ?", categories: ["Retiré", "Généralisé"], items: [
          { text: "Nom, adresse mail et entreprise de la cliente", answer: "Retiré", why: "Ils n'apportent rien à la rédaction : la réponse reste générique jusqu'à l'envoi." },
          { text: "L'IBAN", answer: "Retiré", why: "Retiré entièrement, pas masqué : aucune utilité, et jamais dans un outil grand public." },
          { text: "Le montant exact de la commande", answer: "Généralisé", why: "Devenu « niveau intermédiaire » : suffisant pour calibrer le geste commercial." },
          { text: "La menace de résiliation", answer: "Généralisé", why: "Nécessaire au bon ton de la réponse, donc conservée sous forme générale." },
        ] },
      ],
    },
    {
      id: "acces", title: "Le moindre privilège", teaser: "Protéger en amont de la saisie.", tint: "corail", icon: "lock",
      blocks: [
        { type: "text", text: "Le **moindre privilège** : n'accorder à chaque personne, compte ou outil que les droits strictement nécessaires à ce qu'il a réellement à faire." },
        { type: "table", headers: ["Mesure", "Ce qu'elle évite"], rows: [
          ["Compte professionnel distinct du compte personnel", "Une donnée client associée à un historique personnel"],
          ["Autorisations limitées par outil ou par mission", "Un accès à plus de données que la tâche n'en exige"],
          ["Révocation en fin de mission", "Un accès oublié utilisé longtemps après le besoin"],
          ["Catégories interdites de saisie", "Se demander s'il faut anonymiser une donnée qui n'aurait jamais dû être saisie"],
        ] },
        { type: "rule", text: "Liste d'exclusion des services grand public non approuvés : secrets d'authentification, clés, mots de passe, coordonnées bancaires réelles, dossiers de santé, informations sous secret professionnel. Un secret d'accès réel n'est jamais fourni au modèle." },
      ],
    },
    {
      id: "relire", title: "La revue manuelle", teaser: "Le dernier filet de sécurité.", tint: "mauve", icon: "search",
      blocks: [
        { type: "checklist", title: "Avant tout usage de la réponse", items: [
          "Aucune donnée retirée n'a réapparu",
          "Aucun détail inventé, absent de ma demande",
          "Le ton et le contenu conviennent à un usage professionnel réel",
        ] },
        { type: "rule", text: "La correction du prompt réduit le risque en amont ; la revue manuelle vérifie ce qui en ressort réellement, et corrige avant tout usage." },
      ],
    },
  ],
  profiles: {
    sirh: {
      id: "metier", title: "Votre métier", teaser: "Consultante SIRH : vos supports de formation.", tint: "mauve", icon: "briefcase",
      blocks: [
        { type: "sort", prompt: "En préparant un support de formation SIRH, que faites-vous de chaque information ?", categories: ["Retirer", "Garder"], items: [
          { text: "Le numéro de sécurité sociale d'un salarié sur une fiche de paie d'exemple", answer: "Retirer", why: "Aucune utilité pour rédiger un pas-à-pas." },
          { text: "Le nom du module à documenter, par exemple « gestion des congés »", answer: "Garder", why: "L'outil en a besoin pour un texte pertinent." },
          { text: "Le nom et le prénom d'un salarié dans une capture d'écran", answer: "Retirer", why: "Préférez une capture de démonstration entièrement fictive." },
          { text: "Le nom du client dans un paragraphe de méthode qui ne le concerne pas", answer: "Retirer", why: "Il n'apporte rien à la reformulation." },
        ] },
        { type: "rule", text: "Une conversation distincte par client, et une relecture de chaque réglage décrit : il doit exister dans la version du SIRH de ce client." },
      ],
    },
  },
  exam: {
    exercise: 3, label: "confidentialité des données",
    steps: [
      "Repérer chaque information à protéger dans le prompt",
      "Retirer l'inutile, généraliser l'utile",
      "Justifier chaque choix, information par information",
      "Relire la réponse produite avant tout usage",
    ],
    table: { headers: ["Avant", "Après"], row: ["Montant exact de la commande", "Commande de niveau intermédiaire"] },
  },
  flashcards: [
    ["Une donnée réellement anonyme est-elle libre de toute obligation ?", "Non : le RGPD ne s'applique plus, mais confidentialité, propriété intellectuelle ou secret peuvent subsister."],
    ["Corriger un prompt, est-ce tout supprimer par prudence ?", "Non : on retire ce qui est sensible et inutile, on généralise ce qui est sensible et utile."],
    ["Une solution locale ou contractuellement autorisée suit-elle la même liste d'exclusion ?", "Elle peut relever d'un autre cadre, mais un secret d'accès réel n'est jamais fourni au modèle."],
    ["Quelle mesure évite qu'un accès oublié serve après la fin du besoin ?", "La révocation des accès en fin de mission ou de collaboration."],
    ["Où réintégrer les vraies informations dans le texte final ?", "Hors de l'outil, dans l'environnement autorisé, avec une nouvelle validation."],
  ],
};
