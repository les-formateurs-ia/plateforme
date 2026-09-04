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
