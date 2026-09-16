import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router";
import { useTh } from "@/app/theme/theme";
import { GCard } from "@/app/components/common/GCard";
import { ShimBtn, VBtn } from "@/app/components/common/Buttons";
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
  const navigate = useNavigate();
  const studioTarget = model.studioTarget;
  const category = AI_CATEGORIES.find((c) => c.id === model.category);
  const initials = model.name.replace(/[^A-Za-z0-9]/g, "").slice(0, 2).toUpperCase();

  return (
    <GCard className={dense ? "@container p-3.5" : "@container p-4 sm:p-6"}>
      <div className={`grid grid-cols-1 items-center gap-5 @[560px]:grid-cols-2 @[1080px]:gap-6 ${dense ? "@[1080px]:grid-cols-[minmax(220px,1fr)_minmax(150px,0.8fr)_144px_208px]" : "@[1080px]:grid-cols-[minmax(220px,1.2fr)_minmax(0,340px)_minmax(150px,0.85fr)_144px_208px]"}`}>
        <div className="flex min-w-0 items-center gap-4">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl shrink-0 flex items-center justify-center text-xs font-black text-white" style={{ background: `linear-gradient(135deg,${th.grad1},${th.grad2})` }}>
            {initials}
          </div>
          <div className="min-w-0">
            <div className="font-bold text-sm break-words" style={{ color: th.fg }}>{model.name}</div>
            <div className="text-xs truncate" style={{ color: th.fg3 }}>{model.provider}</div>
            <div className="text-xs font-medium mt-1" style={{ color: th.navAC }}>{model.tagline}</div>
            {dense && category && <Pill>{category.label}</Pill>}
          </div>
        </div>

        {!dense && (
          <p className="w-full min-w-0 text-center text-sm leading-relaxed" style={{ color: th.fg2 }}>{model.description}</p>
        )}

        <div className="flex min-w-0 flex-col gap-1.5">
          <RatingBar label="Raisonnement" value={model.reasoning} />
          <RatingBar label="Accès" value={model.access} />
          <RatingBar label="Vitesse" value={model.speed} />
        </div>

        <div className="flex w-full flex-wrap items-center justify-center gap-1.5 @[1080px]:flex-col">
          <Pill>{model.priceBadge}</Pill>
          <Pill color={LEVEL_COLORS[model.levelBadge]}>{model.levelBadge}</Pill>
        </div>
        <div className="grid min-w-0 grid-cols-1 gap-2 @[560px]:col-span-2 @[560px]:grid-cols-2 @[1080px]:col-span-1 @[1080px]:grid-cols-1 [&_button]:min-w-0 @[220px]:[&_button]:whitespace-nowrap">
          <VBtn sm full onClick={onOpenDetail}>
            <span className="inline-flex items-center gap-1.5 justify-center w-full">Découvrir la fiche<ArrowRight className="w-3.5 h-3.5" /></span>
          </VBtn>
          {studioTarget ? (
            <ShimBtn sm full onClick={() => navigate(`/studio/${studioTarget.path}?model=${encodeURIComponent(studioTarget.modelId)}`)}>
              Essayer dans le studio
            </ShimBtn>
          ) : (
            <VBtn sm full disabled>Non disponible en studio</VBtn>
          )}
        </div>
      </div>
    </GCard>
  );
}
