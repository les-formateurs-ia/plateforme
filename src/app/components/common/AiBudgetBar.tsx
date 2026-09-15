import { useTh } from "@/app/theme/theme";

// Seuils de couleur du plafond budget IA Runware (cf. migration
// 0071_ai_usage_budget.sql) : vert < 70 %, orange 70-90 %, rouge > 90 % —
// utilisé aussi bien dans la sidebar (compact) que dans l'onglet "Mon
// utilisation IA" du tableau de bord (plus grand).
function budgetColor(pct: number): string {
  if (pct > 90) return "#fb7185";
  if (pct > 70) return "#fbc2ad";
  return "#6adeb1";
}

export function AiBudgetBar({ spentUsd, capUsd, size = "sm" }: { spentUsd: number; capUsd: number; size?: "sm" | "lg" }) {
  const th = useTh();
  const pct = capUsd > 0 ? Math.min(100, (spentUsd / capUsd) * 100) : 0;
  const color = budgetColor(pct);
  const large = size === "lg";

  return (
    <div className={large ? "rounded-2xl p-5" : "rounded-xl px-3 py-2.5"} style={{ background: th.isDark ? "rgba(255,255,255,0.05)" : "rgba(15,14,20,0.03)", border: `1px solid ${th.inputB}` }}>
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span className={large ? "text-sm font-semibold" : "text-[11px] font-semibold truncate"} style={{ color: th.fg2 }}>Budget IA Runware</span>
        <span className={large ? "text-sm font-bold shrink-0" : "text-[11px] font-bold shrink-0"} style={{ color }}>{pct.toFixed(2)}%</span>
      </div>
      <div className={large ? "h-2.5 rounded-full overflow-hidden" : "h-1.5 rounded-full overflow-hidden"} style={{ background: th.isDark ? "rgba(255,255,255,0.08)" : "rgba(15,14,20,0.06)" }}>
        <div className="h-full rounded-full transition-all duration-300" style={{ width: `${pct}%`, background: color }} />
      </div>
      <div className={large ? "text-xs mt-2" : "text-[10px] mt-1"} style={{ color: th.fg3 }}>{spentUsd.toFixed(2)} $ / {capUsd.toFixed(2)} $</div>
    </div>
  );
}
