// Surlignage inline des corrections IA (extrait fautif barré en rouge →
// suggestion en vert, numérotée) sur un texte de prompt. Partagé par
// PromptExercisePage et MediaExercisePage — même mécanique de diff verbatim,
// deux exercices différents.
import type { ReactNode } from "react";
import type { Th } from "@/app/theme/theme";

export const ANNOTATION_RED = "#e5484d";
export const ANNOTATION_GREEN = "#6adeb1";

export interface AnnotationSource { excerpt: string; suggestion: string; explanation: string }
export interface LocatedCorrection extends AnnotationSource { index: number; start: number; end: number; anchored: boolean }

// Retrouve chaque "excerpt" (cité verbatim par l'IA, cf. contrainte du prompt
// d'évaluation) dans le texte original pour pouvoir le surligner inline. Les
// occurrences répétées sont gérées via usedRanges (une même sous-chaîne ne
// peut pas être réutilisée par deux corrections). Si un excerpt n'est
// vraiment pas trouvé (l'IA n'a pas respecté la contrainte), on dégrade
// proprement : la correction reste listée plus bas, juste sans surlignage.
export function locateCorrections(text: string, corrections: AnnotationSource[]): { anchored: LocatedCorrection[]; unanchored: LocatedCorrection[] } {
  const usedRanges: [number, number][] = [];
  const found: { start: number; end: number; correction: AnnotationSource }[] = [];
  const missed: AnnotationSource[] = [];
  for (const c of corrections) {
    if (!c.excerpt?.trim()) { missed.push(c); continue; }
    let searchFrom = 0;
    let start = -1;
    while (searchFrom <= text.length) {
      const idx = text.indexOf(c.excerpt, searchFrom);
      if (idx === -1) break;
      const overlaps = usedRanges.some(([s, e]) => idx < e && idx + c.excerpt.length > s);
      if (!overlaps) { start = idx; break; }
      searchFrom = idx + 1;
    }
    if (start === -1) { missed.push(c); continue; }
    usedRanges.push([start, start + c.excerpt.length]);
    found.push({ start, end: start + c.excerpt.length, correction: c });
  }
  found.sort((a, b) => a.start - b.start);
  const anchored: LocatedCorrection[] = found.map((f, i) => ({ ...f.correction, index: i + 1, start: f.start, end: f.end, anchored: true }));
  const unanchored: LocatedCorrection[] = missed.map((c, i) => ({ ...c, index: anchored.length + i + 1, start: -1, end: -1, anchored: false }));
  return { anchored, unanchored };
}

export function renderAnnotatedText(text: string, anchored: LocatedCorrection[], th: Th): ReactNode[] {
  const nodes: ReactNode[] = [];
  let cursor = 0;
  for (const c of anchored) {
    if (c.start > cursor) nodes.push(<span key={`t${cursor}`}>{text.slice(cursor, c.start)}</span>);
    nodes.push(
      <span key={`c${c.index}`}>
        <span style={{ color: ANNOTATION_RED, textDecoration: "line-through", textDecorationThickness: "2px" }}>{c.excerpt}</span>
        <span style={{ color: th.fg3 }}> → </span>
        <span style={{ color: ANNOTATION_GREEN, fontWeight: 600 }}>{c.suggestion}</span>
        <sup className="inline-flex items-center justify-center rounded-full font-bold ml-1" style={{ width: 15, height: 15, fontSize: 9, background: th.navAC, color: th.isDark ? "#06121c" : "#fff", verticalAlign: "super" }}>{c.index}</sup>
      </span>,
    );
    cursor = c.end;
  }
  if (cursor < text.length) nodes.push(<span key="tend">{text.slice(cursor)}</span>);
  return nodes;
}

export function scoreTone(score: number): { color: string; bg: string } {
  if (score >= 16) return { color: ANNOTATION_GREEN, bg: "rgba(106,222,177,0.12)" };
  if (score >= 10) return { color: "#fbc2ad", bg: "rgba(251,194,173,0.12)" };
  return { color: ANNOTATION_RED, bg: "rgba(229,72,77,0.12)" };
}
