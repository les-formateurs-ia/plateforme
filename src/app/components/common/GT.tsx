import type { ReactNode } from "react";
import { useTh } from "@/app/theme/theme";

export function GT({ children, from = "#FFFFFF", to = "#dbacf0", className = "" }: {
  children: ReactNode; from?: string; to?: string; className?: string;
}) {
  const th = useTh();
  const f = th.isDark ? from : "#b58de0", t = th.isDark ? to : "#dbacf0";
  return (
    <span className={className} style={{ background: `linear-gradient(135deg,${f} 0%,${t} 100%)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
      {children}
    </span>
  );
}
