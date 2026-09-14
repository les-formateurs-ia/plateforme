import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { GT } from "@/app/components/common/GT";
import { VSelect } from "@/app/components/common/Select";
import { ModelCard } from "@/app/components/aiModels/ModelCard";
import { ModelDetailSheet } from "@/app/components/aiModels/ModelDetailSheet";
import { AI_CATEGORIES, AI_MODELS, type AiModel } from "@/app/data/aiModels";

export function AiModelsListPage() {
  const th = useTh();
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selected, setSelected] = useState<AiModel | null>(null);

  const categoryOptions = useMemo(
    () => [{ value: "all", label: "Toutes les catégories" }, ...AI_CATEGORIES.map((c) => ({ value: c.id, label: c.label }))],
    [],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return AI_MODELS.filter((m) =>
      (categoryFilter === "all" || m.category === categoryFilter) &&
      (!q || `${m.name} ${m.provider} ${m.tagline}`.toLowerCase().includes(q)));
  }, [query, categoryFilter]);

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-5">
      <div>
        <h2 className="text-2xl font-black" style={{ fontFamily: "'Funnel Display',sans-serif", color: th.fg }}><GT>Liste des IA</GT></h2>
        <p className="text-sm mt-0.5" style={{ color: th.fg3 }}>
          {AI_MODELS.length} modèles à travers 8 catégories — raisonnement, vitesse, accès et prix en un coup d'œil.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: th.fg3 }} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un modèle ou un fournisseur..."
            className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm outline-none"
            style={{ background: th.inputBg, border: `1px solid ${th.inputB}`, color: th.fg }}
          />
        </div>
        <div className="sm:w-64 shrink-0">
          <VSelect value={categoryFilter} onValueChange={setCategoryFilter} options={categoryOptions} />
        </div>
      </div>

      <div className="space-y-2.5">
        {filtered.map((model) => (
          <ModelCard key={model.id} model={model} dense onOpenDetail={() => setSelected(model)} />
        ))}
        {filtered.length === 0 && (
          <p className="text-sm py-8 text-center" style={{ color: th.fg3 }}>Aucun modèle ne correspond à cette recherche.</p>
        )}
      </div>

      <ModelDetailSheet model={selected} open={!!selected} onOpenChange={(open) => { if (!open) setSelected(null); }} />
    </div>
  );
}
