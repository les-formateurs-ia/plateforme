// Graphiques comparatifs du Hub IA, à partir des classements Artificial
// Analysis :
//   * texte (llm)  : nuage de points Intelligence × prix (échelle log) ;
//   * médias (Elo) : classement en points avec intervalle de confiance, le
//     top 10 + les modèles du Hub. Points plutôt que barres : l'Elo n'a pas
//     de zéro significatif, une barre tronquée mentirait sur les écarts.
// Mise en avant : les modèles présents dans le Hub en bleu (série 1 de la
// palette de référence dataviz), le reste en gris de contexte. Le gris est
// sous 3:1 de contraste : d'où les étiquettes directes + la vue tableau.
import { useMemo, useState } from "react";
import {
  CartesianGrid, Cell, ErrorBar, LabelList, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis,
} from "recharts";
import { BarChart3, ExternalLink, Table2 } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { GCard } from "@/app/components/common/GCard";
import type { AiModel } from "@/app/data/aiModels";
import {
  AA_URL, BOARD_LABELS, blendedPrice, findEntry, formatFetchedAt,
  type BenchmarkSnapshot, type BoardId,
} from "@/app/lib/aiBenchmarks";

const TOP_N = 10;

function useChartColors() {
  const th = useTh();
  return th.isDark
    ? { hub: "#3987e5", other: "#6b6a65", grid: "#2c2c2a", axis: "#383835", muted: "#898781" }
    : { hub: "#2a78d6", other: "#b9b8b1", grid: "#e1e0d9", axis: "#c3c2b7", muted: "#898781" };
}

interface Point {
  key: string;
  name: string;
  creator: string;
  rank: number;
  total: number;
  score: number;
  ci?: number;
  price?: number;
  model?: AiModel;
  /** Étiquette directe (modèles du Hub seulement). */
  label?: string;
}

function ChartTooltip({ active, payload, metric }: { active?: boolean; payload?: { payload: Point }[]; metric: "intelligence" | "elo" }) {
  const th = useTh();
  const p = payload?.[0]?.payload;
  if (!active || !p) return null;
  return (
    <div className="rounded-lg px-3 py-2 text-xs shadow-lg" style={{ background: th.card, border: `1px solid ${th.sep}`, color: th.fg2 }}>
      <div className="font-bold" style={{ color: th.fg }}>{p.name}</div>
      <div style={{ color: th.fg3 }}>{p.creator}</div>
      <div className="mt-1">#{p.rank} sur {p.total}</div>
      {metric === "intelligence" ? (
        <>
          <div>Intelligence Index : <b style={{ color: th.fg }}>{p.score.toLocaleString("fr-FR")}</b></div>
          {p.price != null && <div>Prix mixte : <b style={{ color: th.fg }}>{p.price.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} $</b> / million de tokens</div>}
        </>
      ) : (
        <div>Elo : <b style={{ color: th.fg }}>{p.score}</b>{p.ci ? ` ± ${Math.round(p.ci)}` : ""}</div>
      )}
      {p.model && <div className="mt-1 font-semibold" style={{ color: th.navAC }}>Dans le Hub · cliquer pour la fiche</div>}
    </div>
  );
}

function Legend() {
  const th = useTh();
  const c = useChartColors();
  return (
    <div className="flex flex-wrap items-center gap-4 text-[11px]" style={{ color: th.fg3 }}>
      <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ background: c.hub }} />Dans notre Hub</span>
      <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ background: c.other }} />Autres modèles classés</span>
    </div>
  );
}

function DataTable({ points, metric }: { points: Point[]; metric: "intelligence" | "elo" }) {
  const th = useTh();
  const rows = [...points].sort((a, b) => a.rank - b.rank);
  return (
    <div className="max-h-[360px] overflow-y-auto rounded-xl" style={{ border: `1px solid ${th.sep}` }}>
      <table className="w-full text-xs">
        <thead className="sticky top-0" style={{ background: th.card }}>
          <tr style={{ color: th.fg3 }}>
            <th className="text-left font-semibold px-3 py-2">Rang</th>
            <th className="text-left font-semibold px-3 py-2">Modèle</th>
            <th className="text-right font-semibold px-3 py-2">{metric === "intelligence" ? "Intelligence" : "Elo"}</th>
            {metric === "intelligence" && <th className="text-right font-semibold px-3 py-2">Prix mixte ($/M)</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => (
            <tr key={p.key} style={{ borderTop: `1px solid ${th.sep}`, color: p.model ? th.fg : th.fg2, fontWeight: p.model ? 700 : 400 }}>
              <td className="px-3 py-1.5">#{p.rank}</td>
              <td className="px-3 py-1.5">{p.name}<span style={{ color: th.fg3, fontWeight: 400 }}> · {p.creator}</span>{p.model && <span style={{ color: th.navAC }}> · Hub</span>}</td>
              <td className="px-3 py-1.5 text-right">{p.score.toLocaleString("fr-FR")}{p.ci ? ` ± ${Math.round(p.ci)}` : ""}</td>
              {metric === "intelligence" && <td className="px-3 py-1.5 text-right">{p.price?.toLocaleString("fr-FR", { maximumFractionDigits: 2 }) ?? "—"}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function boardPoints(snapshot: BenchmarkSnapshot, board: BoardId, models: AiModel[]): Point[] {
  const entries = snapshot.boards[board]?.entries ?? [];
  const byKey = new Map<string, AiModel>();
  for (const m of models) {
    for (const ref of m.benchmarks ?? []) {
      if (ref.board !== board) continue;
      const e = findEntry(snapshot, ref);
      if (e) byKey.set(e.key, m);
    }
  }
  return entries.map((e) => {
    const model = byKey.get(e.key);
    return {
      key: e.key, name: e.name, creator: e.creator, rank: e.rank, total: entries.length,
      score: e.score, ci: e.ci, price: blendedPrice(e) ?? undefined, model, label: model ? e.name : undefined,
    };
  });
}

function LlmScatter({ points, onOpenModel }: { points: Point[]; onOpenModel: (m: AiModel) => void }) {
  const th = useTh();
  const c = useChartColors();
  const priced = points.filter((p) => p.price != null && p.price > 0);
  const hub = priced.filter((p) => p.model);
  const others = priced.filter((p) => !p.model);
  const tick = { fill: c.muted, fontSize: 11 };
  return (
    <div className="h-[340px] sm:h-[380px]">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 12, right: 24, bottom: 28, left: 0 }}>
          <CartesianGrid stroke={c.grid} strokeDasharray="0" />
          <XAxis
            type="number" dataKey="price" scale="log" domain={["auto", "auto"]} tick={tick} stroke={c.axis}
            tickFormatter={(v: number) => `${v < 1 ? v.toFixed(2) : v.toFixed(0)} $`}
            label={{ value: "Prix mixte en $ par million de tokens (échelle log) →", position: "insideBottom", offset: -16, fill: c.muted, fontSize: 11 }}
          />
          <YAxis
            type="number" dataKey="score" tick={tick} stroke={c.axis} width={44}
            label={{ value: "Intelligence ↑", angle: -90, position: "insideLeft", offset: 12, fill: c.muted, fontSize: 11 }}
          />
          <Tooltip content={<ChartTooltip metric="intelligence" />} cursor={{ stroke: c.axis }} />
          <Scatter data={others} fill={c.other} isAnimationActive={false} />
          <Scatter
            data={hub} fill={c.hub} stroke={th.card} strokeWidth={2} isAnimationActive={false}
            cursor="pointer" onClick={(p: { payload?: Point }) => p?.payload?.model && onOpenModel(p.payload.model)}
          >
            <LabelList dataKey="label" position="top" offset={8} style={{ fill: th.fg2, fontSize: 11, fontWeight: 600 }} />
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}

function EloDotPlot({ points, onOpenModel }: { points: Point[]; onOpenModel: (m: AiModel) => void }) {
  const th = useTh();
  const c = useChartColors();
  const rows = points
    .filter((p) => p.rank <= TOP_N || p.model)
    .sort((a, b) => a.rank - b.rank)
    .map((p) => ({ ...p, row: `#${p.rank} ${p.name}`, ciRange: p.ci ?? 0 }));
  const tick = { fill: c.muted, fontSize: 11 };
  return (
    <div style={{ height: Math.max(220, rows.length * 30 + 50) }}>
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 8, right: 24, bottom: 24, left: 8 }}>
          <CartesianGrid stroke={c.grid} horizontal={false} />
          <XAxis
            type="number" dataKey="score" domain={["dataMin - 30", "dataMax + 30"]} tick={tick} stroke={c.axis}
            tickFormatter={(v: number) => String(Math.round(v))}
            label={{ value: "Score Elo (votes à l'aveugle) →", position: "insideBottom", offset: -12, fill: c.muted, fontSize: 11 }}
          />
          <YAxis
            type="category" dataKey="row" allowDuplicatedCategory={false} reversed width={190} tick={{ ...tick, fill: th.fg2 }} stroke={c.axis}
            ticks={rows.map((r) => r.row)} interval={0}
          />
          <Tooltip content={<ChartTooltip metric="elo" />} cursor={false} />
          <Scatter
            data={rows} isAnimationActive={false}
            onClick={(p: { payload?: Point }) => p?.payload?.model && onOpenModel(p.payload.model)}
          >
            <ErrorBar dataKey="ciRange" direction="x" stroke={c.axis} width={0} />
            {rows.map((p) => (
              <Cell key={p.key} fill={p.model ? c.hub : c.other} stroke={th.card} strokeWidth={2} cursor={p.model ? "pointer" : "default"} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}

export function BenchmarkCharts({ models, snapshot, onOpenModel }: { models: AiModel[]; snapshot: BenchmarkSnapshot | null; onOpenModel: (m: AiModel) => void }) {
  const th = useTh();
  const boards = useMemo(() => {
    const seen: BoardId[] = [];
    for (const m of models) for (const ref of m.benchmarks ?? []) if (!seen.includes(ref.board)) seen.push(ref.board);
    return seen.filter((b) => snapshot?.boards?.[b]?.entries.length);
  }, [models, snapshot]);
  const [picked, setPicked] = useState<BoardId | null>(null);
  const [asTable, setAsTable] = useState(false);

  if (!snapshot) return null;
  if (boards.length === 0) {
    return (
      <p className="text-xs rounded-xl px-4 py-3" style={{ background: th.inputBg, border: `1px dashed ${th.inputB}`, color: th.fg3 }}>
        Aucun benchmark public ne compare encore ces outils entre eux : les notes de cette catégorie sont l'avis de l'équipe Les Formateurs IA (« Avis éditorial »).
      </p>
    );
  }
  const board = picked && boards.includes(picked) ? picked : boards[0];
  const points = boardPoints(snapshot, board, models);
  const metric = snapshot.boards[board].metric;

  return (
    <GCard className="p-4 sm:p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold flex items-center gap-1.5" style={{ color: th.fg }}>
            <BarChart3 className="w-4 h-4" style={{ color: th.navAC }} />Comparer en un coup d'œil
          </h3>
          <p className="text-xs mt-1 max-w-xl" style={{ color: th.fg3 }}>
            {metric === "intelligence"
              ? "Chaque point est un modèle testé. Plus il est haut, plus il est intelligent ; plus il est à gauche, moins il coûte. Les meilleures affaires sont en haut à gauche."
              : `Les ${TOP_N} meilleurs modèles du classement, plus ceux de notre Hub. Le trait autour du point montre la marge d'incertitude : deux traits qui se chevauchent, c'est quasiment une égalité.`}
          </p>
        </div>
        <button
          onClick={() => setAsTable((v) => !v)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg shrink-0 transition-opacity hover:opacity-80"
          style={{ background: th.inputBg, border: `1px solid ${th.inputB}`, color: th.fg2 }}
        >
          {asTable ? <BarChart3 className="w-3.5 h-3.5" /> : <Table2 className="w-3.5 h-3.5" />}
          {asTable ? "Voir le graphique" : "Voir en tableau"}
        </button>
      </div>

      {boards.length > 1 && (
        <div className="flex flex-wrap gap-1.5">
          {boards.map((b) => (
            <button
              key={b}
              onClick={() => setPicked(b)}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-opacity hover:opacity-85"
              style={b === board
                ? { background: th.ink, color: th.onInk, border: `1px solid ${th.ink}` }
                : { background: "transparent", color: th.fg2, border: `1px solid ${th.sep}` }}
            >
              {BOARD_LABELS[b].long}
            </button>
          ))}
        </div>
      )}

      {asTable ? (
        <DataTable points={metric === "intelligence" ? points : points.filter((p) => p.rank <= TOP_N || p.model)} metric={metric} />
      ) : (
        <>
          <Legend />
          {metric === "intelligence"
            ? <LlmScatter points={points} onOpenModel={onOpenModel} />
            : <EloDotPlot points={points} onOpenModel={onOpenModel} />}
        </>
      )}

      <a href={AA_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11px] hover:underline" style={{ color: th.fg3 }}>
        Source : Artificial Analysis · données du {formatFetchedAt(snapshot)}<ExternalLink className="w-3 h-3" />
      </a>
    </GCard>
  );
}
