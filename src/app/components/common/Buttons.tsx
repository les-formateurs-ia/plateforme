import type { ReactNode } from "react";
import { useTh } from "@/app/theme/theme";
import { cx } from "@/app/lib/cx";

// Shimmer — only for key CTAs
export function ShimBtn({ children, onClick, sm, full, disabled }: { children: ReactNode; onClick?: () => void; sm?: boolean; full?: boolean; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{ background: "linear-gradient(135deg,#7C3AED 0%,#DDAEEA 40%,#9B5DE5 60%,#DDAEEA 100%)", backgroundSize: "300% auto", animation: "shimmer 4s linear infinite", boxShadow: "0 0 32px rgba(155,93,229,0.35),0 4px 16px rgba(0,0,0,0.3)", color: "#08060F" }}
      className={cx("rounded-xl font-bold transition-all duration-200 hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none", full && "w-full", sm ? "px-4 py-2.5 text-sm" : "px-7 py-3.5 text-base")}>
      {children}
    </button>
  );
}

// Regular violet button — no animation
export function VBtn({ children, onClick, sm, full, disabled }: { children: ReactNode; onClick?: () => void; sm?: boolean; full?: boolean; disabled?: boolean }) {
  const th = useTh();
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ background: th.isDark ? "rgba(221,174,234,0.1)" : "rgba(155,93,229,0.1)", border: `1px solid ${th.navAB}`, color: th.navAC }}
      className={cx("rounded-xl font-semibold transition-all duration-200 hover:opacity-80 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none", full && "w-full", sm ? "px-4 py-2 text-sm" : "px-5 py-2.5 text-sm")}>
      {children}
    </button>
  );
}
