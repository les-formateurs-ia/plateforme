import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, Search } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { VBtn } from "@/app/components/common/Buttons";
import { ModelCard } from "@/app/components/aiModels/ModelCard";
import { ModelDetailSheet } from "@/app/components/aiModels/ModelDetailSheet";
import { BenchmarkCharts } from "@/app/components/aiModels/BenchmarkCharts";
import { getModelScores } from "@/app/components/aiModels/BenchmarkScores";
import { AI_CATEGORIES, getModelsByCategory, type AiCategoryId, type AiModel } from "@/app/data/aiModels";
import { useAiBenchmarks } from "@/app/lib/aiBenchmarks";

export function HubCategoryPage() {
  const th = useTh();
  const navigate = useNavigate();
  const { category } = useParams<{ category: string }>();
  const cat = AI_CATEGORIES.find((c) => c.id === category);
  const models = getModelsByCategory((category ?? "") as AiCategoryId);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<AiModel | null>(null);
  const snapshot = useAiBenchmarks();

  // Modèles classés par le benchmark d'abord (du mieux noté au moins bien),
  // puis les modèles en avis éditorial, dans l'ordre du catalogue.
  const filtered = useMemo(() => {
    const note = (m: AiModel) => getModelScores(m, snapshot).primary?.note ?? -1;
    return models
      .filter((m) => `${m.name} ${m.provider}`.toLowerCase().includes(query.toLowerCase()))
      .map((m, i) => ({ m, i, n: note(m) }))
      .sort((a, b) => b.n - a.n || a.i - b.i)
      .map(({ m }) => m);
  }, [models, query, snapshot]);

  if (!cat) {
    return (
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6">
        <VBtn onClick={() => navigate("/hub")}>Retour au Hub IA</VBtn>
      </div>
    );
  }

  const { Icon, label } = cat;

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-5">
      <button onClick={() => navigate("/hub")} className="inline-flex items-center gap-1.5 text-sm transition-colors hover:opacity-70" style={{ color: th.fg3 }}>
        <ArrowLeft className="w-4 h-4" />Retour
      </button>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0" style={{ background: th.gradShadow(0.14), border: `1px solid ${th.ink}` }}>
            <Icon className="w-5 h-5" style={{ color: th.navAC }} />
          </div>
          <div>
            <h2 className="text-xl font-black" style={{ color: th.fg }}>{label}</h2>
            <p className="text-xs mt-0.5" style={{ color: th.fg3 }}>
              {filtered.length} modèle{filtered.length > 1 ? "s" : ""} recommandé{filtered.length > 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: th.fg3 }} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filtrer les modèles..."
            className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm outline-none"
            style={{ background: th.inputBg, border: `1px solid ${th.inputB}`, color: th.fg }}
          />
        </div>
      </div>

      <BenchmarkCharts models={models} snapshot={snapshot} onOpenModel={setSelected} />

      <div className="space-y-3">
        {filtered.map((model) => (
          <ModelCard key={model.id} model={model} onOpenDetail={() => setSelected(model)} />
        ))}
        {filtered.length === 0 && (
          <p className="text-sm py-8 text-center" style={{ color: th.fg3 }}>Aucun modèle ne correspond à cette recherche.</p>
        )}
      </div>

      <ModelDetailSheet model={selected} open={!!selected} onOpenChange={(open) => { if (!open) setSelected(null); }} />
    </div>
  );
}
