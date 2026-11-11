// Fiches des cinq outils de référence de la formation RS6776 — source unique
// pour les Playgrounds (et pour l'habillage Remotion des vidéos). Même ordre et
// mêmes libellés partout (voir docs/formation-rs6776/bible.md, « Les cinq outils »).
// Pas de prix ici : les tarifs changent souvent, on renvoie vers la page
// officielle de l'éditeur, à vérifier au moment de chiffrer un budget.

export type ToolId = "chatgpt" | "claude" | "gemini" | "copilot" | "firefly";

export type ToolSheet = {
  id: ToolId;
  name: string;
  editor: string;
  strengths: string;
  uses: string;
  integration: string;
  access: string;
  pricingUrl: string;
  inPlatform: string | null; // où le pratiquer sur la plateforme, sinon null
};

export const TOOL_SHEETS: ToolSheet[] = [
  {
    id: "chatgpt", name: "ChatGPT", editor: "OpenAI",
    strengths: "Polyvalence, rédaction naturelle, création d'images, personnalisation (assistants sur mesure).",
    uses: "Réflexion, rédaction, images, analyse de fichiers, assistants pour des tâches répétées.",
    integration: "Web, mobile, ordinateur ; extensions et interface de programmation.",
    access: "Version gratuite, abonnements individuels, offres pour les équipes et les entreprises.",
    pricingUrl: "https://openai.com/chatgpt/pricing/",
    inPlatform: "/studio/chatgpt",
  },
  {
    id: "claude", name: "Claude", editor: "Anthropic",
    strengths: "Raisonnement, rigueur, respect précis de consignes détaillées.",
    uses: "Analyse de longs documents, rapports de fond, documents techniques, code.",
    integration: "Web, mobile, ordinateur ; outils pour développeurs.",
    access: "Accès gratuit limité, abonnements, offres pour les équipes et les entreprises.",
    pricingUrl: "https://claude.com/pricing",
    inPlatform: "/studio/claude",
  },
  {
    id: "gemini", name: "Gemini", editor: "Google",
    strengths: "Intégration aux outils Google, informations récentes, texte, audio et vidéo.",
    uses: "Travailler depuis son Drive, synthèses de longs documents, analyse de vidéos.",
    integration: "Google Workspace : Gmail, Docs, Sheets, Drive, Meet ; Android.",
    access: "Version gratuite, abonnement, inclus dans certaines offres Google Workspace.",
    pricingUrl: "https://gemini.google/subscriptions/",
    inPlatform: "/studio/gemini",
  },
  {
    id: "copilot", name: "Copilot", editor: "Microsoft",
    strengths: "Dans sa version professionnelle, s'appuie sur les mails, réunions et documents de l'entreprise ; automatisation bureautique.",
    uses: "Rédiger et mettre en forme dans Word, PowerPoint, Excel ; résumer une réunion Teams.",
    integration: "Microsoft 365 (Word, Excel, PowerPoint, Outlook, Teams) et Windows.",
    access: "Version web gratuite ; version complète avec une licence professionnelle Microsoft 365.",
    pricingUrl: "https://www.microsoft.com/fr-fr/microsoft-365/copilot",
    inPlatform: null,
  },
  {
    id: "firefly", name: "Firefly", editor: "Adobe",
    strengths: "Images de qualité et retouchables ; Adobe met en avant des données d'entraînement sous licence.",
    uses: "Création graphique, ajout ou suppression d'éléments dans une image.",
    integration: "Photoshop, Illustrator, Express ; application web.",
    access: "Accès gratuit limité ; inclus dans les offres Adobe.",
    pricingUrl: "https://www.adobe.com/fr/products/firefly/plans.html",
    inPlatform: null,
  },
];
