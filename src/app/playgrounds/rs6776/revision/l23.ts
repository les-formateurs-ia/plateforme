import type { RevisionData } from "./types";
// Leçon 2.3 « Rédaction assistée par IA » — fiche de révision.
// Source : docs/formation-rs6776/lecon-2.3/cours.html (rien n'est ajouté au cours).
// Le cours compare ChatGPT et Gemini seulement : pas de bloc « tools » (cinq outils).
export const data: RevisionData = {
  lesson: "2.3",
  title: "Rédaction assistée par IA",
  highlight: "Rédaction",
  keyPoints: [
    ["Un environnement, pas une réputation", "Choisir d'après le besoin, les autorisations et les contrôles, après un essai sur un cas représentatif."],
    ["Un assistant se vérifie", "Un Project ne garantit pas la confidentialité ; un assistant du catalogue n'est pas validé par son seul référencement."],
    ["Une chaîne maîtrisée", "De l'autorisation d'enregistrer jusqu'à la validation humaine du compte-rendu."],
  ],
  modules: [
    {
      id: "comparer", title: "ChatGPT ou Gemini", teaser: "La comparaison factuelle du cours.", tint: "bleu", icon: "scale", wide: true,
      blocks: [
        { type: "table", caption: "Usage rédactionnel courant", headers: ["Critère", "ChatGPT", "Google Gemini"], rows: [
          ["Rédaction, reformulation, résumé", "Solide sur plusieurs styles et longueurs", "Solide sur plusieurs styles et longueurs"],
          ["Structuration d'un texte long", "Possible avec cadrage, sources et contrôles explicites", "Possible avec cadrage, sources et contrôles explicites"],
          ["Intégration bureautique", "Import, traitement et export selon le format, l'offre et les outils activés", "Docs, Sheets et Gmail selon l'offre Workspace et les droits"],
          ["Personnalisation durable", "Projects et GPT selon l'offre et les réglages", "Gems selon l'offre et les réglages"],
        ] },
        { type: "rule", text: "La qualité varie selon le modèle, la langue, les documents fournis et la demande : un essai court sur un cas représentatif vaut mieux qu'un classement général." },
        { type: "compare", left: { title: "Mode rapide", text: "Une tâche courante, comme reformuler une phrase." }, right: { title: "Mode approfondi", text: "Une demande complexe qui croise plusieurs contraintes. Son nom et son emplacement changent : retenez son existence." } },
      ],
    },
    {
      id: "assistants", title: "Projects et GPT Store", teaser: "Ce qu'il faut contrôler avant usage.", tint: "corail", icon: "shield",
      blocks: [
        { type: "flip", items: [
          { title: "Project", front: "Regroupe échanges, instructions et fichiers autour d'un même dossier.", back: "Ni garantie de confidentialité, ni séparation automatique des accès : vérifier membres, partages, fichiers, paramètres de données.", icon: "layers" },
          { title: "GPT du catalogue", front: "Un assistant préconfiguré pour un usage précis.", back: "Pas validé par son seul référencement : contrôler éditeur, objectif, connexions, données reçues, autorisations, qualité sur données fictives.", icon: "search" },
        ] },
        { type: "text", text: "Les droits de créer, modifier, publier ou utiliser un assistant dépendent de l'offre et des réglages administrateur : consultez l'aide officielle au moment de l'usage." },
      ],
    },
    {
      id: "choisir", title: "Quel choix ?", teaser: "Une manche du jeu du cours.", tint: "violet", icon: "target",
      blocks: [
        { type: "choice", question: "Votre organisation utilise Google Workspace, Gemini y est activé et autorisé, et plusieurs collègues doivent compléter le texte dans un document partagé. Quel choix ?", options: [
          { label: "Google Gemini, pour son intégration à Google Docs", correct: true, why: "Dans ce contexte précis, l'intégration déjà activée répond au besoin de collaboration directe." },
          { label: "ChatGPT, pour son intégration à Google Docs", why: "Ce n'est pas l'intégration décrite par le cours pour ce contexte." },
          { label: "Les deux se valent", why: "Ici, l'environnement en place fait la différence." },
        ] },
        { type: "choice", question: "Vous devez reformuler une seule phrase pour l'alléger. Quel réglage ?", options: [
          { label: "Le mode de raisonnement le plus approfondi", why: "Réservé aux tâches complexes." },
          { label: "Créer un Project dédié avant de commencer", why: "Utile pour un travail récurrent, pas pour une reformulation ponctuelle." },
          { label: "Le mode rapide standard", correct: true, why: "Il suffit largement à une tâche simple et ponctuelle." },
        ] },
      ],
    },
    {
      id: "chaine", title: "De l'oral au compte-rendu", teaser: "La méthode en six étapes.", tint: "vert", icon: "list",
      blocks: [
        { type: "steps", items: [
          { title: "Cadrer avant d'enregistrer", text: "Finalité, information des participants, autorisation, accès, stockage, suppression." },
          { title: "Enregistrer le strict nécessaire", text: "Uniquement si le cadre le permet." },
          { title: "Transcrire dans un outil approuvé", text: "Local ou hors ligne si la sensibilité l'exige ; sinon, la transcription fictive du formateur." },
          { title: "Contrôler la fidélité", text: "Réécouter, corriger noms et chiffres, distinguer les locuteurs, signaler l'inaudible." },
          { title: "Minimiser et protéger", text: "Retirer l'inutile, pseudonymiser si besoin, clé de correspondance à part." },
          { title: "Faire rédiger puis vérifier", text: "Comparer à la transcription, confirmer les décisions, faire valider les actions." },
        ] },
        { type: "rule", text: "« Local » se vérifie : traitement réel sur l'appareil, absence d'envoi secondaire, fichiers, sauvegardes, conservation et suppression. Une pseudonymisation n'est pas une anonymisation." },
      ],
    },
    {
      id: "cr", title: "Un compte-rendu vérifiable", teaser: "Le prompt et le tableau du cours.", tint: "mauve", icon: "file",
      blocks: [
        { type: "example", label: "Contraintes clés du prompt (exemple du cours)", lines: ["À partir de la seule transcription ci-dessous, produis un brouillon vérifiable.", "N'invente aucune décision, personne, date ni action ; indique « à confirmer » lorsqu'une information manque ou se contredit."], stamp: "Sans invention", danger: false },
        { type: "table", caption: "Format demandé", headers: ["Action", "Responsable", "Échéance", "Statut", "Repère dans la transcription"], rows: [["…", "…", "…", "confirmé / à confirmer", "repère temporel"]] },
        { type: "text", text: "Le repère temporel ou la citation courte sert de **piste de vérification**. Si le modèle attribue un responsable ou une échéance absente, le brouillon est corrigé avant validation." },
      ],
    },
  ],
  profiles: {
    sirh: {
      id: "metier", title: "Votre métier", teaser: "Consultante SIRH : guide coécrit et session enregistrée.", tint: "mauve", icon: "briefcase",
      blocks: [
        { type: "cards", items: [
          { title: "Guide coécrit chez le client", text: "Si Gemini est activé et autorisé dans son Workspace, l'intégration simplifie la coédition dans Google Docs.", tint: "bleu", icon: "file" },
          { title: "Un espace par client", text: "Un Project ne cloisonne pas automatiquement : membres, partages, fichiers, paramètres de données à vérifier.", tint: "corail", icon: "lock" },
          { title: "Session de formation", text: "L'enregistrement est-il permis ? Cadrer avant de transcrire, ou travailler sur la transcription fictive.", tint: "vert", icon: "shield" },
        ] },
        { type: "checklist", title: "À conserver pour le formateur", items: ["Le cadrage de départ", "Le prompt", "Le brouillon annoté", "La version validée"] },
      ],
    },
  },
  exam: {
    exercise: 2,
    label: "produire un écrit professionnel vérifiable",
    steps: ["Choisir un environnement autorisé et le justifier", "Rédiger le prompt avec ses contraintes d'invention", "Relier chaque décision et action à sa source", "Faire valider avant diffusion"],
  },
  flashcards: [
    ["Selon le cours, de quoi dépend surtout le choix entre ChatGPT et Gemini ?", "De l'environnement de travail autorisé : intégration, fichiers et droits, collaboration, export, traçabilité, politique de données."],
    ["Pourquoi le nom du mode rapide ou approfondi n'est-il pas à mémoriser ?", "Le sélecteur change régulièrement de nom et d'emplacement : c'est son existence qu'il faut retenir."],
    ["Le consentement est-il la seule base possible pour enregistrer une réunion ?", "Pas automatiquement : il faut vérifier la règle de l'organisation et le cadre juridique du contexte."],
    ["Que faire d'un passage inaudible dans une transcription ?", "Le signaler comme tel plutôt que l'inventer."],
    ["À quoi sert le repère temporel dans le tableau du compte-rendu ?", "À retrouver chaque décision et chaque action dans la source pour les vérifier."],
  ],
};
