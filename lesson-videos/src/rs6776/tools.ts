// Fiches des cinq outils de référence, sans prix (voir docs/formation-rs6776/bible.md,
// « Les cinq outils »). Même contenu que src/app/playgrounds/rs6776/tools.ts côté
// plateforme : toute modification se fait dans les deux fichiers.
import { C } from "../theme";

export type Tool = { id: string; name: string; editor: string; logo: string; logoBg: string; accent: string; rows: { label: string; value: string }[] };

export const TOOLS: Tool[] = [
  { id: "chatgpt", name: "ChatGPT", editor: "OpenAI", logo: "tools/chatgpt.png", logoBg: "#FDFBF9", accent: C.bleuVert, rows: [
    { label: "Points forts", value: "Polyvalence, rédaction naturelle, personnalisation" },
    { label: "Usages", value: "Réflexion, rédaction, images, assistants sur mesure" },
    { label: "Intégration", value: "Web, mobile, ordinateur" },
    { label: "Accès", value: "Gratuit · abonnements · offres entreprise" },
  ] },
  { id: "claude", name: "Claude", editor: "Anthropic", logo: "tools/claude.png", logoBg: "#FDFBF9", accent: C.beige, rows: [
    { label: "Points forts", value: "Raisonnement, rigueur, respect des consignes" },
    { label: "Usages", value: "Longs documents, rapports complexes, code" },
    { label: "Intégration", value: "Web, mobile, outils pour développeurs" },
    { label: "Accès", value: "Gratuit limité · abonnements · offres entreprise" },
  ] },
  { id: "gemini", name: "Gemini", editor: "Google", logo: "tools/gemini.png", logoBg: "#FDFBF9", accent: C.bleu, rows: [
    { label: "Points forts", value: "Intégration Google, informations récentes, formats variés" },
    { label: "Usages", value: "Travailler depuis son Drive, synthèses de longs documents" },
    { label: "Intégration", value: "Gmail, Docs, Sheets, Drive, Meet" },
    { label: "Accès", value: "Gratuit · abonnement · offres Google Workspace" },
  ] },
  { id: "copilot", name: "Copilot", editor: "Microsoft", logo: "tools/copilot.svg", logoBg: "#FDFBF9", accent: C.violet, rows: [
    { label: "Points forts", value: "Données de l'entreprise, automatisation bureautique" },
    { label: "Usages", value: "Documents, présentations, tableaux, résumés de réunions" },
    { label: "Intégration", value: "Microsoft 365 et Windows" },
    { label: "Accès", value: "Version web gratuite · licence professionnelle" },
  ] },
  { id: "firefly", name: "Firefly", editor: "Adobe", logo: "tools/firefly.svg", logoBg: "#FDFBF9", accent: C.violetLight, rows: [
    { label: "Points forts", value: "Images de qualité, retouchables" },
    { label: "Usages", value: "Création graphique, ajout ou suppression d'éléments" },
    { label: "Intégration", value: "Photoshop, Illustrator, Express, application web" },
    { label: "Accès", value: "Gratuit limité · inclus dans les offres Adobe" },
  ] },
];
