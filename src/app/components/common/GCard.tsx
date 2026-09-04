import type { ReactNode } from "react";
import { useTh } from "@/app/theme/theme";
import { cx } from "@/app/lib/cx";

export function GCard({ children, className = "", glow = false, accent = false, onClick }: {
  children: ReactNode; className?: string; glow?: boolean; accent?: boolean; onClick?: () => void;
}) {
  const th = useTh();
  return (
    <div onClick={onClick} className={cx("rounded-2xl overflow-hidden", className, onClick && "cursor-pointer")}
      style={{
        background: th.card,
        border: `1px solid ${accent ? `${th.gradShadow(0.35)}` : th.sep}`,
        boxShadow: glow ? "0 12px 32px rgba(0,0,0,0.35)" : "0 2px 10px rgba(0,0,0,0.18)",
      }}>
      {children}
    </div>
  );
}
