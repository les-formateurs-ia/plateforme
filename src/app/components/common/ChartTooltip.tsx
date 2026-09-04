import { useTh } from "@/app/theme/theme";

export function MemTip({ active, payload, label }: any) {
  const th = useTh();
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl px-3 py-2.5 text-xs" style={{ background: th.card, border: `1px solid ${th.gradShadow(0.2)}`, boxShadow: "0 8px 32px rgba(0,0,0,0.2)" }}>
      <div className="mb-1.5 font-medium" style={{ color: th.fg3 }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span style={{ color: p.color }}>{p.name === "ai" ? "🧠 Avec IA" : "📉 Sans révision"} <strong>{p.value}%</strong></span>
        </div>
      ))}
    </div>
  );
}
