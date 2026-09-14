import { ArrowRight } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { GCard } from "@/app/components/common/GCard";
import { VBtn } from "@/app/components/common/Buttons";
import { AI_CATEGORIES, type AiModel } from "@/app/data/aiModels";

export const LEVEL_COLORS: Record<string, string> = {
  "Idéal Débutant": "#22c55e",
  "Idéal Intermédiaire": "#f59e0b",
  "Idéal Expert": "#fb7185",
};

export function RatingBar({ label, value }: { label: string; value: number }) {
  const th = useTh();
  return (
    <div className="min-w-[84px]">
      <div className="flex items-center justify-between gap-2 text-[11px] mb-1" style={{ color: th.fg3 }}>
        <span className="truncate">{label}</span>
        <span className="font-semibold shrink-0" style={{ color: th.fg2 }}>{value}/5</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: th.isDark ? "rgba(255,255,255,0.08)" : "rgba(15,14,20,0.06)" }}>
        <div className="h-full rounded-full" style={{ width: `${(value / 5) * 100}%`, background: `linear-gradient(90deg,${th.grad1},${th.grad2})` }} />
      </div>
    </div>
  );
}

export function Pill({ children, color }: { children: string; color?: string }) {
  const th = useTh();
  return (
    <span
      className="inline-block text-[10px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap"
      style={color
        ? { background: `${color}1f`, color, border: `1px solid ${color}55` }
        : { background: th.inputBg, color: th.fg2, border: `1px solid ${th.inputB}` }}
    >
      {children}
    </span>
  );
}

export function ModelCard({ model, onOpenDetail, dense = false }: { model: AiModel; onOpenDetail: () => void; dense?: boolean }) {
  const th = useTh();
  const category = AI_CATEGORIES.find((c) => c.id === model.category);
  const initials = model.name.replace(/[^A-Za-z0-9]/g, "").slice(0, 2).toUpperCase();

  return (
    <GCard className={dense ? "p-3.5" : "p-4 sm:p-5"}>
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-start gap-3 sm:w-[210px] shrink-0">
          <div className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center text-xs font-black text-white" style={{ background: `linear-gradient(135deg,${th.grad1},${th.grad2})` }}>
            {initials}
          </div>
          <div className="min-w-0">
            <div className="font-bold text-sm truncate" style={{ color: th.fg }}>{model.name}</div>
            <div className="text-xs truncate" style={{ color: th.fg3 }}>{model.provider}</div>
            <div className="text-xs font-medium mt-0.5 line-clamp-2" style={{ color: th.navAC }}>{model.tagline}</div>
            {dense && category && <Pill>{category.label}</Pill>}
          </div>
        </div>

        {!dense && (
          <p className="text-sm flex-1 min-w-0" style={{ color: th.fg2 }}>{model.description}</p>
        )}

        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          <RatingBar label="Raisonnement" value={model.reasoning} />
          <RatingBar label="Accès" value={model.access} />
          <RatingBar label="Vitesse" value={model.speed} />
        </div>

        <div className="flex flex-col items-stretch gap-2 sm:w-[160px] shrink-0">
          <div className="flex flex-wrap gap-1.5 sm:justify-end">
            <Pill>{model.priceBadge}</Pill>
            <Pill color={LEVEL_COLORS[model.levelBadge]}>{model.levelBadge}</Pill>
          </div>
          <VBtn sm full onClick={onOpenDetail}>
            <span className="inline-flex items-center gap-1.5 justify-center w-full">Découvrir la fiche<ArrowRight className="w-3.5 h-3.5" /></span>
          </VBtn>
        </div>
      </div>
    </GCard>
  );
}
