import type { ReactNode } from "react";
import { useTh } from "@/app/theme/theme";
import { cx } from "@/app/lib/cx";

export function GCard({ children, className = "", glow = false, accent = false, onClick }: {
  children: ReactNode; className?: string; glow?: boolean; accent?: boolean; onClick?: () => void;
}) {
  const th = useTh();
  return (
    <div onClick={onClick} className={cx("rounded-2xl", className, onClick && "cursor-pointer")}
      style={{ background: accent ? "linear-gradient(135deg,rgba(221,174,234,0.5) 0%,rgba(155,93,229,0.3) 40%,rgba(221,174,234,0.15) 100%)" : th.cardGrd, padding: "1px", boxShadow: glow ? "0 0 48px rgba(155,93,229,0.12),0 16px 48px rgba(0,0,0,0.3)" : "0 4px 24px rgba(0,0,0,0.15)" }}>
      <div className="rounded-2xl h-full w-full overflow-hidden" style={{ background: th.card, backdropFilter: "blur(24px)" }}>
        {children}
      </div>
    </div>
  );
}
