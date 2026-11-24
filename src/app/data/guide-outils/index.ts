// Point d'entrée du guide « Comprendre les outils ». Aucun import d'alias
// "@/" : ce module est relu hors Vite par les tests de contenu.
import { BASES } from "./bases";
import { CHATGPT } from "./chatgpt";
import { CLAUDE } from "./claude";
import { GEMINI } from "./gemini";
import type { GuideArticle, GuideChapter, GuideOutil } from "./types";

export * from "./types";

export const GUIDE_OUTILS: GuideOutil[] = [BASES, CHATGPT, CLAUDE, GEMINI];

export function getOutil(id: string | undefined): GuideOutil | undefined {
  return GUIDE_OUTILS.find((o) => o.id === id);
}

// Tous les articles d'un outil, dans l'ordre de lecture (chapitre par chapitre).
export function outilArticles(outil: GuideOutil): { chapter: GuideChapter; article: GuideArticle }[] {
  return outil.chapters.flatMap((chapter) => chapter.articles.map((article) => ({ chapter, article })));
}

export function findArticle(outil: GuideOutil, articleId: string | undefined) {
  const all = outilArticles(outil);
  const index = all.findIndex((x) => x.article.id === articleId);
  if (index < 0) return undefined;
  return { ...all[index], index, prev: all[index - 1], next: all[index + 1], total: all.length };
}

export function articleCount(outil: GuideOutil): number {
  return outil.chapters.reduce((n, c) => n + c.articles.length, 0);
}

// « 2026-11-23 » → « 23 novembre 2026 ».
export function formatCheckedAt(iso: string): string {
  const months = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${months[m - 1]} ${y}`;
}
