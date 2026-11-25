// Récupération et mise en forme des benchmarks Artificial Analysis
// (https://artificialanalysis.ai) pour le Hub IA.
//
// Utilisé par :
//   * scripts/sync-ai-benchmarks.mjs : snapshot local
//     (src/app/data/aiBenchmarks.snapshot.json) ;
//   * la fonction sync-ai-benchmarks (pg_cron hebdomadaire) : écrit la même
//     forme dans la table public.ai_benchmarks.
// Garder ce fichier sans API Deno ni Node : TypeScript « effaçable »
// uniquement (pas d'enum), pour que Node puisse l'importer directement.
//
// Seuls les endpoints /free sont appelés : 4 pages LLM + 9 classements
// média, soit 13 requêtes par synchronisation (quota gratuit : 100/24 h).
// Attribution obligatoire (CGU de l'API) : l'UI cite la source et la date.
//
// Le type BenchmarkSnapshot est dupliqué côté client dans
// src/app/lib/aiBenchmarks.ts : garder les deux synchronisés.

export const AA_API_BASE = "https://artificialanalysis.ai/api/v2";

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

export type BoardMetric = "intelligence" | "elo";

export const MEDIA_BOARDS: { id: Exclude<BoardId, "llm">; path: string }[] = [
  { id: "text-to-image", path: "media/text-to-image/models/free" },
  { id: "image-editing", path: "media/image-editing/models/free" },
  { id: "text-to-video", path: "media/text-to-video/models/free" },
  { id: "image-to-video", path: "media/image-to-video/models/free" },
  { id: "text-to-video-audio", path: "media/text-to-video-audio/models/free" },
  { id: "image-to-video-audio", path: "media/image-to-video-audio/models/free" },
  { id: "text-to-speech", path: "media/text-to-speech/models/free" },
  { id: "music-vocals", path: "media/music/with-vocals/models/free" },
  { id: "music-instrumental", path: "media/music/instrumental/models/free" },
];

/** Indices métier publiés par AA pour les LLM (0-100, null si non évalué). */
export interface LlmDomainIndexes {
  finance: number | null;
  strategy: number | null;
  legal: number | null;
  health: number | null;
  engineering: number | null;
  economics: number | null;
}

export interface BenchmarkEntry {
  /** Slug AA ; pour la musique (pas de slug fourni) : nom normalisé. */
  key: string;
  name: string;
  creator: string;
  /** Intelligence Index (llm) ou Elo (média). */
  score: number;
  /** Intervalle de confiance à 95 % de l'Elo (média). */
  ci?: number;
  /** Rang dans le classement, 1 = meilleur. */
  rank: number;
  // ── Champs LLM uniquement ──
  /** Slugs des autres réglages d'effort du même modèle (moins bien notés). */
  aliases?: string[];
  /** Réglage retenu (« Max », « High »…). */
  variant?: string | null;
  releaseDate?: string;
  /** Prix en $ par million de tokens. */
  priceIn?: number | null;
  priceOut?: number | null;
  /** Débit médian en tokens/seconde. */
  speed?: number | null;
  /** Délai médian avant le premier token, en secondes. */
  ttft?: number | null;
  /** Coût moyen en $ par tâche de l'Intelligence Index. */
  costPerTask?: number | null;
  domains?: LlmDomainIndexes;
}

export interface BenchmarkBoard {
  id: BoardId;
  metric: BoardMetric;
  entries: BenchmarkEntry[];
}

export interface BenchmarkSnapshot {
  source: "artificialanalysis.ai";
  fetchedAt: string;
  intelligenceIndexVersion: number | null;
  boards: Record<BoardId, BenchmarkBoard>;
}

type Json = Record<string, any>;

export const musicKey = (name: string) =>
  name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);
const round = (v: number | null, digits = 2) => (v == null ? null : Math.round(v * 10 ** digits) / 10 ** digits);

function withRanks<T extends { score: number }>(rows: T[]): (T & { rank: number })[] {
  return [...rows].sort((a, b) => b.score - a.score).map((r, i) => ({ ...r, rank: i + 1 }));
}

async function getJson(path: string, apiKey: string, fetchImpl: typeof fetch): Promise<Json> {
  const res = await fetchImpl(`${AA_API_BASE}/${path}`, { headers: { "x-api-key": apiKey } });
  if (!res.ok) throw new Error(`Artificial Analysis ${path} : HTTP ${res.status}`);
  return res.json();
}

/** « Claude Opus 5.5 (Max, Default Fallback) » → { base: « Claude Opus 5.5 », variant: « Max » }. */
export function splitLlmName(name: string): { base: string; variant: string | null } {
  const m = name.match(/^(.*?)\s*\(([^)]*)\)\s*$/);
  if (!m) return { base: name.trim(), variant: null };
  const variant = m[2].split(",")[0].trim();
  return { base: m[1].trim(), variant: variant || null };
}

/**
 * LLM : seuls les modèles ayant un Intelligence Index sont gardés, et un
 * seul réglage par modèle (le mieux noté) : AA publie chaque niveau d'effort
 * (Low, Medium, High, Max…) comme une ligne à part, ce qui gonflerait le
 * nombre de « modèles » et fausserait les rangs. Les slugs des autres
 * réglages restent dans `aliases` pour que le catalogue puisse s'y référer.
 */
export function buildLlmBoard(rows: Json[]): BenchmarkBoard {
  const scored = rows
    .filter((m) => num(m?.evaluations?.artificial_analysis_intelligence_index) != null)
    .map((m) => {
      const ev = m.evaluations;
      const { base, variant } = splitLlmName(String(m.name));
      return {
        key: String(m.slug),
        aliases: [] as string[],
        name: base,
        variant,
        creator: String(m.model_creator?.name ?? ""),
        score: round(num(ev.artificial_analysis_intelligence_index), 1)!,
        releaseDate: m.release_date ?? undefined,
        priceIn: num(m.pricing?.price_1m_input_tokens),
        priceOut: num(m.pricing?.price_1m_output_tokens),
        speed: round(num(m.performance?.median_output_tokens_per_second), 0),
        ttft: round(num(m.performance?.median_time_to_first_token_seconds), 2),
        costPerTask: round(num(m.artificial_analysis_intelligence_index_cost?.cost_per_task?.total_cost), 3),
        domains: {
          finance: num(ev.artificial_analysis_finance_and_accounting_index),
          strategy: num(ev.artificial_analysis_strategy_and_ops_index),
          legal: num(ev.artificial_analysis_legal_index),
          health: num(ev.artificial_analysis_healthcare_and_medical_index),
          engineering: num(ev.artificial_analysis_engineering_index),
          economics: num(ev.artificial_analysis_economics_index),
        },
      };
    });

  const best = new Map<string, (typeof scored)[number]>();
  for (const row of scored) {
    const family = `${row.creator}|${row.name}`.toLowerCase();
    const kept = best.get(family);
    if (!kept) best.set(family, row);
    else if (row.score > kept.score) {
      best.set(family, { ...row, aliases: [...kept.aliases, kept.key] });
    } else kept.aliases.push(row.key);
  }
  return { id: "llm", metric: "intelligence", entries: withRanks([...best.values()]) };
}

export function buildMediaBoard(id: Exclude<BoardId, "llm">, rows: Json[]): BenchmarkBoard {
  const scored = rows
    .filter((m) => num(m?.elo) != null)
    .map((m) => ({
      key: m.slug ? String(m.slug) : musicKey(String(m.name)),
      name: String(m.name),
      creator: String(m.model_creator?.name ?? ""),
      score: Math.round(num(m.elo)!),
      ci: num(m.ci_95) ?? undefined,
    }));
  return { id, metric: "elo", entries: withRanks(scored) };
}

/** Appelle l'API (13 requêtes environ) et renvoie le snapshot complet. */
export async function fetchBenchmarkSnapshot(apiKey: string, fetchImpl: typeof fetch = fetch): Promise<BenchmarkSnapshot> {
  if (!apiKey) throw new Error("Clé ARTIFICIAL_ANALYSIS_API_KEY manquante.");

  const llmRows: Json[] = [];
  let intelligenceIndexVersion: number | null = null;
  for (let page = 1; page <= 10; page++) {
    const body = await getJson(`language/models/free?page=${page}`, apiKey, fetchImpl);
    intelligenceIndexVersion ??= num(body.intelligence_index_version);
    llmRows.push(...(body.data ?? []));
    if (!body.pagination?.has_more) break;
  }

  const boards = { llm: buildLlmBoard(llmRows) } as Record<BoardId, BenchmarkBoard>;
  for (const { id, path } of MEDIA_BOARDS) {
    const body = await getJson(path, apiKey, fetchImpl);
    boards[id] = buildMediaBoard(id, body.data ?? []);
  }

  return { source: "artificialanalysis.ai", fetchedAt: new Date().toISOString(), intelligenceIndexVersion, boards };
}
