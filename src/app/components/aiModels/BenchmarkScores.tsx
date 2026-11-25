// Notes d'un modèle du Hub IA : issues du benchmark Artificial Analysis
// quand le modèle y est classé, sinon note éditoriale (champs /5 du
// catalogue) clairement signalée comme telle.
import { BarChart3, ExternalLink, PenLine, Trophy } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import type { AiModel } from "@/app/data/aiModels";
import {
  AA_URL, BOARD_LABELS, DOMAIN_LABELS, boardResult, formatFetchedAt, llmExtraNotes,
  type BenchmarkSnapshot, type BoardResult, type LlmDomainIndexes,
} from "@/app/lib/aiBenchmarks";

export interface ScoreBar {
  label: string;
  /** Note /10. */
  note: number;
  hint?: string;
}

export interface ModelScores {
  source: "benchmark" | "editorial";
  /** Classement principal (premier de model.benchmarks trouvé). */
  primary: BoardResult | null;
  results: BoardResult[];
  bars: ScoreBar[];
}

const fmt = (v: number, digits = 1) => v.toLocaleString("fr-FR", { maximumFractionDigits: digits });

export function getModelScores(model: AiModel, snapshot: BenchmarkSnapshot | null): ModelScores {
  const results = (model.benchmarks ?? [])
    .map((ref) => boardResult(snapshot, ref))
    .filter((r): r is BoardResult => r != null);

  if (results.length === 0) {
    return {
      source: "editorial",
      primary: null,
      results,
      bars: [
        { label: "Raisonnement", note: model.reasoning * 2 },
        { label: "Accès", note: model.access * 2 },
        { label: "Vitesse", note: model.speed * 2 },
      ],
    };
  }

  const primary = results[0];
  if (primary.ref.board === "llm") {
    const extra = llmExtraNotes(snapshot, primary.entry);
    const bars: ScoreBar[] = [{ label: "Intelligence", note: primary.note, hint: `Intelligence Index ${fmt(primary.entry.score)}` }];
    if (extra.speed != null) bars.push({ label: "Vitesse", note: extra.speed, hint: `${fmt(primary.entry.speed ?? 0, 0)} tokens/s` });
    if (extra.price != null) bars.push({ label: "Prix doux", note: extra.price, hint: "10 = parmi les moins chers" });
    return { source: "benchmark", primary, results, bars };
  }

  return {
    source: "benchmark",
    primary,
    results,
    bars: results.slice(0, 3).map((r) => ({
      label: BOARD_LABELS[r.ref.board].short,
      note: r.note,
      hint: `#${r.entry.rank} sur ${r.total} · Elo ${r.entry.score}`,
    })),
  };
}

export function ScoreBarView({ bar }: { bar: ScoreBar }) {
  const th = useTh();
  return (
    <div className="min-w-[84px]" title={bar.hint}>
      <div className="flex items-center justify-between gap-2 text-[11px] mb-1" style={{ color: th.fg3 }}>
        <span className="truncate">{bar.label}</span>
        <span className="font-semibold shrink-0" style={{ color: th.fg2 }}>{fmt(bar.note)}/10</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: th.isDark ? "rgba(255,255,255,0.08)" : "rgba(15,14,20,0.06)" }}>
        <div className="h-full rounded-full" style={{ width: `${bar.note * 10}%`, background: th.iris }} />
      </div>
    </div>
  );
}

export function SourceBadge({ source }: { source: ModelScores["source"] }) {
  const th = useTh();
  const isBench = source === "benchmark";
  const Icon = isBench ? BarChart3 : PenLine;
  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-[2px] whitespace-nowrap"
      style={isBench
        ? { background: th.gradShadow(0.12), color: th.navAC, border: `1px solid ${th.gradShadow(0.3)}` }
        : { background: th.inputBg, color: th.fg3, border: `1px dashed ${th.inputB}` }}
      title={isBench ? "Notes calculées à partir des classements Artificial Analysis" : "Pas de classement public : note de l'équipe Les Formateurs IA"}
    >
      <Icon className="w-3 h-3" />
      {isBench ? "Benchmark" : "Avis éditorial"}
    </span>
  );
}

const MEDALS = ["#f5b301", "#a3a9b5", "#c98243"];

export function RankBadge({ result }: { result: BoardResult }) {
  const th = useTh();
  const medal = MEDALS[result.entry.rank - 1];
  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-[2px] whitespace-nowrap"
      style={{ background: medal ? `${medal}1f` : th.inputBg, color: medal ?? th.fg2, border: `1px solid ${medal ? `${medal}66` : th.inputB}` }}
      title={`${BOARD_LABELS[result.ref.board].long} : ${result.entry.rank}e sur ${result.total} modèles classés`}
    >
      <Trophy className="w-3 h-3" />
      #{result.entry.rank} sur {result.total}
    </span>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  const th = useTh();
  return (
    <div className="rounded-xl p-3" style={{ background: th.inputBg, border: `1px solid ${th.inputB}` }}>
      <div className="text-[11px]" style={{ color: th.fg3 }}>{label}</div>
      <div className="text-sm font-bold mt-0.5" style={{ color: th.fg }}>{value}</div>
      {sub && <div className="text-[11px] mt-0.5" style={{ color: th.fg3 }}>{sub}</div>}
    </div>
  );
}

function DomainBars({ domains }: { domains: LlmDomainIndexes }) {
  const th = useTh();
  const rows = (Object.keys(DOMAIN_LABELS) as (keyof LlmDomainIndexes)[])
    .map((k) => ({ label: DOMAIN_LABELS[k], value: domains[k] }))
    .filter((r): r is { label: string; value: number } => r.value != null);
  if (rows.length === 0) return null;
  return (
    <div>
      <h4 className="text-xs font-bold mb-1" style={{ color: th.fg }}>Par métier</h4>
      <p className="text-[11px] mb-2.5" style={{ color: th.fg3 }}>Score sur 100 dans les tests propres à chaque domaine professionnel.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-2">
        {rows.map((r) => (
          <div key={r.label}>
            <div className="flex justify-between text-[11px] mb-1" style={{ color: th.fg3 }}>
              <span>{r.label}</span><span className="font-semibold" style={{ color: th.fg2 }}>{fmt(r.value)}</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: th.isDark ? "rgba(255,255,255,0.08)" : "rgba(15,14,20,0.06)" }}>
              <div className="h-full rounded-full" style={{ width: `${Math.min(100, r.value)}%`, background: th.iris }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const usd = (v: number) => `${v.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} $`;

/** Bloc « Ce que disent les benchmarks » de la fiche détaillée. */
export function BenchmarkDetails({ scores, snapshot }: { scores: ModelScores; snapshot: BenchmarkSnapshot | null }) {
  const th = useTh();
  const date = formatFetchedAt(snapshot);

  return (
    <div className="rounded-2xl p-4 space-y-4" style={{ background: th.card, border: `1px solid ${th.sep}` }}>
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-bold" style={{ color: th.fg }}>
          {scores.source === "benchmark" ? "Ce que disent les benchmarks" : "Notre évaluation"}
        </h3>
        <SourceBadge source={scores.source} />
      </div>

      <div className="flex flex-wrap items-center gap-5">
        {scores.bars.map((b) => <ScoreBarView key={b.label} bar={b} />)}
      </div>

      {scores.source === "editorial" ? (
        <p className="text-xs leading-relaxed" style={{ color: th.fg3 }}>
          Ce modèle n'a pas de classement public chez Artificial Analysis (outil ou produit plutôt que modèle, ou trop récent).
          Les notes ci-dessus sont l'avis de l'équipe Les Formateurs IA.
        </p>
      ) : (
        <>
          <div className="space-y-2">
            {scores.results.map((r) => (
              <div key={r.ref.board} className="flex items-center justify-between gap-3 text-sm">
                <span style={{ color: th.fg2 }}>{BOARD_LABELS[r.ref.board].long}</span>
                <span className="flex items-center gap-2 shrink-0">
                  <span className="text-xs" style={{ color: th.fg3 }}>
                    {r.ref.board === "llm" ? `Indice ${fmt(r.entry.score)}` : `Elo ${r.entry.score}${r.entry.ci ? ` ± ${Math.round(r.entry.ci)}` : ""}`}
                  </span>
                  <RankBadge result={r} />
                </span>
              </div>
            ))}
          </div>

          {scores.primary?.ref.board === "llm" ? (
            <>
              <div className="grid grid-cols-2 gap-2">
                {scores.primary.entry.priceIn != null && scores.primary.entry.priceOut != null && (
                  <Stat label="Prix API (par million de tokens)" value={`${usd(scores.primary.entry.priceIn)} / ${usd(scores.primary.entry.priceOut)}`} sub="texte envoyé / texte généré" />
                )}
                {scores.primary.entry.speed != null && (
                  <Stat label="Vitesse d'écriture" value={`${fmt(scores.primary.entry.speed, 0)} tokens/s`} sub="1 token ≈ un morceau de mot" />
                )}
                {scores.primary.entry.ttft != null && (
                  <Stat label="Délai avant la réponse" value={`${fmt(scores.primary.entry.ttft)} s`} sub="avant le premier mot" />
                )}
                {scores.primary.entry.costPerTask != null && (
                  <Stat label="Coût moyen d'une tâche test" value={usd(scores.primary.entry.costPerTask)} sub="via l'API, réflexion comprise" />
                )}
              </div>
              {scores.primary.entry.domains && <DomainBars domains={scores.primary.entry.domains} />}
              {scores.primary.entry.variant && (
                <p className="text-[11px]" style={{ color: th.fg3 }}>Réglage mesuré : effort de réflexion « {scores.primary.entry.variant} » (le mieux noté).</p>
              )}
            </>
          ) : (
            <p className="text-xs leading-relaxed" style={{ color: th.fg3 }}>
              Elo : des milliers de personnes comparent à l'aveugle deux résultats générés à partir de la même consigne et votent pour le meilleur.
              Plus l'Elo est élevé, plus le modèle gagne de duels.
            </p>
          )}
        </>
      )}

      {date && (
        <a href={AA_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11px] hover:underline" style={{ color: th.fg3 }}>
          Source : Artificial Analysis · données du {date}<ExternalLink className="w-3 h-3" />
        </a>
      )}
    </div>
  );
}
