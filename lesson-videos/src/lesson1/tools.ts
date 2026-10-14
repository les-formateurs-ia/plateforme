// Contenu des fiches outils, repris mot pour mot de la version d'origine de la
// leçon 1 (source_video/Leçon_1_Finale.mp4).
export type Tool = {
  id: string;
  name: string;
  logo: string; // chemin dans public/
  logoBg: string; // fond de la tuile du logo
  accent: string; // halo/accents de la fiche
  rows: { label: string; value: string }[];
};

export const TOOLS: Tool[] = [
  {
    id: "chatgpt",
    name: "ChatGPT",
    logo: "tools/chatgpt.png",
    logoBg: "#FDFBF9",
    accent: "#6adeb1",
    rows: [
      { label: "Points forts", value: "Polyvalence, mode vocal ultraréaliste, rédaction créative, catalogue de GPTs" },
      { label: "Cas d'usage", value: "Brainstorming, images DALL‑E, agents personnalisés" },
      { label: "Intégration", value: "Web, mobile, ordinateur, GPTs Store" },
      { label: "Accès", value: "Gratuit (Standard) · Plus (~20 €/mois) · Forfait entreprise" },
    ],
  },
  {
    id: "claude",
    name: "Claude",
    logo: "tools/claude.png",
    logoBg: "#FDFBF9",
    accent: "#fbc2ad",
    rows: [
      { label: "Points forts", value: "Excellence en logique, génération/débogage de code, analyse rigoureuse, respect strict des consignes" },
      { label: "Cas d'usage", value: "Informatique, documents techniques, besoins complexes" },
      { label: "Intégration", value: "Web, mobile, logiciel développeur" },
      { label: "Accès", value: "Gratuit (Standard) · Pro (~15 €/mois) · Max (90 €/mois)" },
    ],
  },
  {
    id: "gemini",
    name: "Gemini",
    logo: "tools/gemini.png",
    logoBg: "#FDFBF9",
    accent: "#78d5e2",
    rows: [
      { label: "Points forts", value: "Accepte de grands volumes de données, traite le texte, l'audio et la vidéo" },
      { label: "Cas d'usage", value: "Analyse de vidéos, longs documents, documents de votre Drive" },
      { label: "Intégration", value: "Google Workspace (Gmail, Docs, Drive, Meet, Sheets), Android, Google Cloud" },
      { label: "Accès", value: "Gratuit (Standard) · Plus (~20 €/mois avec les autres services Google)" },
    ],
  },
  {
    id: "copilot",
    name: "Copilot",
    logo: "tools/copilot.svg",
    logoBg: "#FDFBF9",
    accent: "#b58de0",
    rows: [
      { label: "Points forts", value: "Ancrage dans les données d'entreprise, automatisation bureautique, images rapides" },
      { label: "Cas d'usage", value: "Rédaction/mise en page (Docs, Mails, Slides, Tableaux), résumés de réunions Teams" },
      { label: "Intégration", value: "Intégré à Microsoft 365 (Word, Excel, PowerPoint, Outlook, Teams) & Windows" },
      { label: "Accès", value: "Gratuit (Web) · Forfait professionnel" },
    ],
  },
  {
    id: "firefly",
    name: "Firefly",
    logo: "tools/firefly.svg",
    logoBg: "#FDFBF9",
    accent: "#fbc2ad",
    rows: [
      { label: "Points forts", value: "Usage commercial, génération d'image complète et retouchable" },
      { label: "Cas d'usage", value: "Création graphique & design, extension/suppression d'éléments, textures 3D" },
      { label: "Intégration", value: "Adobe Creative Cloud (Photoshop, Illustrator, Premiere Pro, Express), web app" },
      { label: "Accès", value: "Gratuit (limité) · Inclus dans les forfaits Adobe" },
    ],
  },
];
