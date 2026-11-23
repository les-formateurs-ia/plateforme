// ═══════════════════════════════════════════════════════════════════════════
// Guide IA — « Comprendre les outils » : comment fonctionnent ChatGPT,
// Claude et Gemini (fonctionnalités, modèles, réglages), ce qu'on n'a pas le
// temps de détailler dans les vidéos.
//
// Chaque outil → des chapitres → de petits articles. Un article est une
// suite de blocs typés : chaque article choisit les blocs qui expliquent le
// mieux SON sujet (pas-à-pas, comparatif, maquette annotée, FAQ, quiz…), d'où
// des formats différents d'un article à l'autre.
//
// Fichiers PURS (aucun import React / alias "@/") : relus par les tests.
// Texte en ligne : **gras** et `code` sont interprétés à l'affichage.
// Les faits viennent UNIQUEMENT des sources officielles listées dans
// chaque article (`sources`), vérifiées à la date `checkedAt`.
// ═══════════════════════════════════════════════════════════════════════════

// « bases » : les notions communes à toutes les IA (tokens, contexte…).
export type OutilId = "bases" | "chatgpt" | "claude" | "gemini";

// Le format annoncé sur la carte de l'article.
export type ArticleFormat =
  | "fiche"        // définition + points clés
  | "visite"       // visite guidée d'une interface
  | "pas-a-pas"    // étapes numérotées
  | "comparatif"   // deux options côte à côte
  | "tableau"      // référence à consulter
  | "atelier"      // exercice à faire soi-même
  | "faq"          // questions / réponses
  | "checklist"    // liste à cocher
  | "decryptage"   // explique un mécanisme interne, schémas à l'appui
  | "idees-recues"; // idées reçues confrontées à la réalité

export const FORMAT_LABELS: Record<ArticleFormat, string> = {
  fiche: "Fiche",
  visite: "Visite guidée",
  "pas-a-pas": "Pas-à-pas",
  comparatif: "Comparatif",
  tableau: "Tableau de référence",
  atelier: "Atelier",
  faq: "FAQ",
  checklist: "Checklist",
  decryptage: "Décryptage",
  "idees-recues": "Idées reçues",
};

export type CalloutTone = "tip" | "warning" | "info" | "key";

export type Block =
  // Chapeau : la phrase à retenir, en grand.
  | { type: "lead"; text: string }
  | { type: "text"; title?: string; paragraphs: string[] }
  // Chiffres clés en tuiles.
  | { type: "keyfacts"; title?: string; items: { value: string; label: string }[] }
  | { type: "steps"; title?: string; steps: { title: string; text: string; tip?: string }[] }
  | { type: "compare"; title?: string; columns: { title: string; badge?: string; points: string[]; bestFor?: string }[] }
  | { type: "table"; title?: string; headers: string[]; rows: string[][]; note?: string }
  | { type: "callout"; tone: CalloutTone; title: string; text: string }
  | { type: "checklist"; title: string; items: string[] }
  | { type: "faq"; title?: string; items: { q: string; a: string }[] }
  // Reproduction schématique d'un écran : chaque champ est annoté.
  | { type: "mockup"; title: string; caption?: string; tabs?: string[]; activeTab?: number; fields: { label: string; value: string; note: string }[] }
  // Conversation simulée (exemple d'échange).
  | { type: "chat"; title: string; turns: { from: "user" | "ai"; text: string }[]; note?: string }
  | { type: "prompt"; label: string; text: string; placeholders?: boolean }
  | { type: "glossary"; title?: string; items: { term: string; def: string }[] }
  | { type: "quiz"; title?: string; questions: { q: string; options: string[]; answer: number; explain: string }[] }
  // « Sous le capot » : le mécanisme technique, expliqué simplement.
  | { type: "deep"; title: string; paragraphs: string[]; analogy?: string }
  // Schéma en chaîne : ce qui se passe, étape par étape (ex. de ton message à la réponse).
  | { type: "flow"; title: string; caption?: string; nodes: { label: string; detail: string }[] }
  // Barre proportionnelle : de quoi est fait un tout (ex. la fenêtre de contexte).
  | { type: "stack"; title: string; caption?: string; total?: string; segments: { label: string; value: number; note: string }[] }
  // Idée reçue → ce qui se passe vraiment.
  | { type: "myths"; title?: string; items: { myth: string; truth: string }[] }
  // Les infos peu connues, qu'on ne trouve pas en surface.
  | { type: "insider"; title?: string; items: { title: string; text: string }[] }
  // Même demande, deux versions : ce qui change et pourquoi.
  | { type: "beforeAfter"; title: string; before: { label: string; text: string }; after: { label: string; text: string }; why: string };

export interface Source {
  label: string;
  url: string;
}

export interface GuideArticle {
  id: string;
  title: string;
  // Une ligne pour la carte.
  summary: string;
  format: ArticleFormat;
  // Temps de lecture affiché (« 4 min »).
  duration: string;
  blocks: Block[];
  sources: Source[];
}

export interface GuideChapter {
  id: string;
  title: string;
  intro: string;
  articles: GuideArticle[];
}

export interface GuideOutil {
  id: OutilId;
  name: string;
  vendor: string;
  tagline: string;
  intro: string;
  // Date de dernière vérification des faits (AAAA-MM-JJ).
  checkedAt: string;
  chapters: GuideChapter[];
  // Sources officielles de référence de l'outil.
  sources: Source[];
}
