import type { ReactNode } from "react";
import { useTh } from "@/app/theme/theme";
import { cx } from "@/app/lib/cx";

// Primary CTA — solid violet pill
export function ShimBtn({ children, onClick, sm, full, disabled }: { children: ReactNode; onClick?: () => void; sm?: boolean; full?: boolean; disabled?: boolean }) {
  const th = useTh();
  return (
    <button onClick={onClick} disabled={disabled} style={{ background: `linear-gradient(135deg,${th.grad1},${th.grad2})`, boxShadow: `0 2px 12px ${th.gradShadow(0.35)}`, color: "#FFFFFF" }}
      className={cx("rounded-full font-semibold transition-all duration-200 hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none", full && "w-full", sm ? "px-4 py-2.5 text-sm" : "px-7 py-3.5 text-base")}>
      {children}
    </button>
  );
}

// Segmented pill toggle — for short, small choice sets (duration, resolution…)
export function Segmented({ value, onChange, options, disabled }: {
  value: string; onChange: (value: string) => void; options: { value: string; label: string }[]; disabled?: boolean;
}) {
  const th = useTh();
  return (
    <div className="inline-flex items-center gap-1 rounded-full p-1 shrink-0" style={{ background: th.inputBg, border: `1px solid ${th.inputB}` }}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button key={o.value} type="button" disabled={disabled} onClick={() => onChange(o.value)}
            className={cx("px-3 py-1.5 rounded-full text-xs font-semibold transition-all disabled:opacity-50 disabled:pointer-events-none", !active && "hover:opacity-80")}
            style={active ? { background: `linear-gradient(135deg,${th.grad1},${th.grad2})`, color: "#fff" } : { color: th.fg3 }}>
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

// Secondary button — outline pill, no animation
export function VBtn({ children, onClick, sm, full, disabled }: { children: ReactNode; onClick?: () => void; sm?: boolean; full?: boolean; disabled?: boolean }) {
  const th = useTh();
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ background: th.isDark ? "rgba(255,255,255,0.06)" : "rgba(15,14,20,0.04)", border: `1px solid ${th.inputB}`, color: th.fg }}
      className={cx("rounded-full font-semibold transition-all duration-200 hover:opacity-80 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none", full && "w-full", sm ? "px-4 py-2 text-sm" : "px-5 py-2.5 text-sm")}>
      {children}
    </button>
  );
}
