// Benchmarks Artificial Analysis affichés dans le Hub IA.
//
// Source des données, dans l'ordre :
//   1. la table Supabase public.ai_benchmarks (ligne id = 'latest'), remplie
//      chaque semaine par la fonction sync-ai-benchmarks ;
//   2. à défaut (table absente, vide, hors ligne) le snapshot embarqué
//      src/app/data/aiBenchmarks.snapshot.json (npm run benchmarks:sync).
//
// Les types reprennent supabase/functions/_shared/ai-benchmarks.ts : garder
// les deux synchronisés.
//
// Notes /10 : on situe le modèle dans le classement complet AA de sa
// catégorie. 10 = premier, 0 = dernier, linéaire sur le rang. Pour le prix,
// 10 = le moins cher (prix « mixte » 3 tokens d'entrée pour 1 de sortie,
// la pondération usuelle d'AA).
import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase/client";

export type BoardId =
  | "llm"
  | "text-to-image"
  | "image-editing"
  | "text-to-video"
  | "image-to-video"
  | "text-to-video-audio"
  | "image-to-video-audio"
  | "text-to-speech"
  | "music-vocals"
  | "music-instrumental";

export interface LlmDomainIndexes {
  finance: number | null;
  strategy: number | null;
  legal: number | null;
  health: number | null;
  engineering: number | null;
  economics: number | null;
}

export interface BenchmarkEntry {
  key: string;
  name: string;
  creator: string;
  score: number;
  ci?: number;
  rank: number;
  aliases?: string[];
  variant?: string | null;
  releaseDate?: string;
  priceIn?: number | null;
  priceOut?: number | null;
  speed?: number | null;
  ttft?: number | null;
  costPerTask?: number | null;
  domains?: LlmDomainIndexes;
}

export interface BenchmarkBoard {
  id: BoardId;
  metric: "intelligence" | "elo";
  entries: BenchmarkEntry[];
}

export interface BenchmarkSnapshot {
  source: "artificialanalysis.ai";
  fetchedAt: string;
  intelligenceIndexVersion: number | null;
  boards: Record<BoardId, BenchmarkBoard>;
}

/** Libellés courts (cartes) et longs (fiche) de chaque classement. */
export const BOARD_LABELS: Record<BoardId, { short: string; long: string }> = {
  "llm": { short: "Intelligence", long: "Intelligence Index (texte)" },
  "text-to-image": { short: "Création d'image", long: "Texte → image" },
  "image-editing": { short: "Retouche d'image", long: "Retouche d'image" },
  "text-to-video": { short: "Texte → vidéo", long: "Texte → vidéo (sans son)" },
  "image-to-video": { short: "Image → vidéo", long: "Image → vidéo (sans son)" },
  "text-to-video-audio": { short: "Vidéo avec son", long: "Texte → vidéo avec son" },
  "image-to-video-audio": { short: "Image → vidéo + son", long: "Image → vidéo avec son" },
  "text-to-speech": { short: "Qualité de voix", long: "Synthèse vocale" },
  "music-vocals": { short: "Chanson", long: "Musique avec voix" },
  "music-instrumental": { short: "Instrumental", long: "Musique instrumentale" },
};

export const DOMAIN_LABELS: Record<keyof LlmDomainIndexes, string> = {
  finance: "Finance & comptabilité",
  strategy: "Stratégie & opérations",
  legal: "Juridique",
  health: "Santé",
  engineering: "Ingénierie",
  economics: "Économie",
};

export const AA_URL = "https://artificialanalysis.ai/";

/** Référence d'un modèle du catalogue vers une ligne d'un classement AA. */
export interface BenchmarkRef {
  board: BoardId;
  /** Slug AA (ou nom normalisé pour la musique, cf. musicKey). */
  key: string;
}

export function findEntry(snapshot: BenchmarkSnapshot | null, ref: BenchmarkRef): BenchmarkEntry | null {
  const board = snapshot?.boards?.[ref.board];
  if (!board) return null;
  return board.entries.find((e) => e.key === ref.key || e.aliases?.includes(ref.key)) ?? null;
}

const rankNote = (rank: number, total: number) => (total <= 1 ? 10 : Math.round((10 * (total - rank)) / (total - 1) * 10) / 10);

export const blendedPrice = (e: BenchmarkEntry) =>
  e.priceIn == null || e.priceOut == null ? null : (3 * e.priceIn + e.priceOut) / 4;

export interface BoardResult {
  ref: BenchmarkRef;
  entry: BenchmarkEntry;
  total: number;
  /** Note /10 liée au rang dans le classement. */
  note: number;
}

export function boardResult(snapshot: BenchmarkSnapshot | null, ref: BenchmarkRef): BoardResult | null {
  const entry = findEntry(snapshot, ref);
  if (!entry || !snapshot) return null;
  const total = snapshot.boards[ref.board].entries.length;
  return { ref, entry, total, note: rankNote(entry.rank, total) };
}

/** Notes vitesse / prix d'un LLM, calculées sur les modèles qui ont la donnée. */
export function llmExtraNotes(snapshot: BenchmarkSnapshot | null, entry: BenchmarkEntry) {
  const entries = snapshot?.boards.llm.entries ?? [];
  const noteBy = (value: number | null, all: number[], higherIsBetter: boolean) => {
    if (value == null || all.length === 0) return null;
    const better = all.filter((v) => (higherIsBetter ? v > value : v < value)).length;
    return rankNote(better + 1, all.length);
  };
  const speeds = entries.map((e) => e.speed).filter((v): v is number => v != null);
  const prices = entries.map(blendedPrice).filter((v): v is number => v != null);
  return {
    speed: noteBy(entry.speed ?? null, speeds, true),
    price: noteBy(blendedPrice(entry), prices, false),
  };
}

// ── Chargement ─────────────────────────────────────────────────────────────

let pending: Promise<BenchmarkSnapshot | null> | null = null;

async function loadFromSupabase(): Promise<BenchmarkSnapshot | null> {
  // Table pas encore dans database.types.ts : on contourne le typage.
  const { data, error } = await (supabase as any)
    .from("ai_benchmarks")
    .select("payload")
    .eq("id", "latest")
    .maybeSingle();
  if (error || !data?.payload?.boards) return null;
  return data.payload as BenchmarkSnapshot;
}

async function loadSnapshot(): Promise<BenchmarkSnapshot | null> {
  try {
    const mod = await import("@/app/data/aiBenchmarks.snapshot.json");
    return (mod.default ?? mod) as unknown as BenchmarkSnapshot;
  } catch {
    return null;
  }
}

export function loadBenchmarks(): Promise<BenchmarkSnapshot | null> {
  pending ??= (async () => {
    const [remote, local] = await Promise.all([loadFromSupabase().catch(() => null), loadSnapshot()]);
    // On garde le plus récent des deux (le snapshot embarqué peut être plus
    // frais que la table juste après un npm run benchmarks:sync).
    if (remote && local) return remote.fetchedAt >= local.fetchedAt ? remote : local;
    return remote ?? local;
  })();
  return pending;
}

export function useAiBenchmarks() {
  const [snapshot, setSnapshot] = useState<BenchmarkSnapshot | null>(null);
  useEffect(() => {
    let alive = true;
    loadBenchmarks().then((s) => { if (alive) setSnapshot(s); });
    return () => { alive = false; };
  }, []);
  return snapshot;
}

export function formatFetchedAt(snapshot: BenchmarkSnapshot | null) {
  if (!snapshot) return null;
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" }).format(new Date(snapshot.fetchedAt));
}
