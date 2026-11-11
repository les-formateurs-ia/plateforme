import type { RevisionData } from "./types";
// Exemple de contenu couvrant tous les blocs (modèle pour les leçons, non publié).
export const data: RevisionData = {
  lesson: "0.0", title: "Exemple de fiche de révision", highlight: "fiche de révision",
  keyPoints: [["Point un", "Une phrase courte."], ["Point deux", "Une phrase courte."], ["Point trois", "Une phrase courte."]],
  modules: [
    { id: "a", title: "Cartes et règle", teaser: "Texte, cartes, règle.", tint: "violet", icon: "sparkles", blocks: [
      { type: "text", text: "Un paragraphe avec du **gras**." },
      { type: "cards", items: [{ title: "Carte 1", text: "Texte.", icon: "file" }, { title: "Carte 2", text: "Texte.", tint: "vert" }, { title: "Carte 3", text: "Texte.", tint: "corail" }] },
      { type: "rule", text: "Une règle à retenir." } ] },
    { id: "b", title: "Retourner", teaser: "Cartes à retourner.", tint: "bleu", icon: "scan", blocks: [
      { type: "flip", items: [{ title: "Notion A", front: "Définition.", back: "Conséquence." }, { title: "Notion B", front: "Définition.", back: "Conséquence." }] },
      { type: "compare", left: { title: "Fiable", text: "Ceci." }, right: { title: "À vérifier", text: "Cela." }, tone: true } ] },
    { id: "c", title: "Trier", teaser: "Classer des éléments.", tint: "corail", icon: "lock", blocks: [
      { type: "sort", prompt: "Classez chaque donnée.", categories: ["Publique", "Interne", "Sensible"], items: [{ text: "Le slogan du site", answer: "Publique" }, { text: "Un avis médical", answer: "Sensible", why: "Donnée de santé." }] },
      { type: "example", label: "Prompt à risque", lines: ["Résume le dossier de M. Dupont, né le 3/4/1980."], stamp: "Donnée personnelle", note: "Nom et date de naissance identifient la personne." } ] },
    { id: "d", title: "Avant / après", teaser: "Exemple, étapes, tableau.", tint: "vert", icon: "pen", wide: true, blocks: [
      { type: "beforeAfter", label: "Anonymisation", before: "Mme Martin, 12 rue X", after: "[Cliente A], [adresse]" },
      { type: "steps", items: [{ title: "Repérer" }, { title: "Remplacer", text: "Ctrl + H" }, { title: "Relire" }] },
      { type: "table", headers: ["Outil", "Usage"], rows: [["ChatGPT", "Rédaction"], ["Copilot", "Microsoft 365"]] },
      { type: "checklist", title: "Mes réflexes", items: ["Un", "Deux"] },
      { type: "choice", question: "Quelle option ?", options: [{ label: "A", why: "Non." }, { label: "B", correct: true, why: "Oui." }] } ] },
  ],
  profiles: { sirh: { id: "metier", title: "Votre métier", teaser: "Consultante SIRH.", tint: "mauve", icon: "briefcase", blocks: [{ type: "text", text: "Bloc métier." }] } },
  exam: { exercise: 3, label: "confidentialité des données", steps: ["Repérer", "Corriger", "Justifier"], table: { headers: ["Avant", "Après"], row: ["Nom", "[Client A]"] } },
  flashcards: [["Question ?", "Réponse."], ["Question 2 ?", "Réponse 2."]],
};
