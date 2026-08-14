import type { ReactNode } from "react";
import { useTh } from "@/app/theme/theme";

export function GT({ children, from = "#FFFFFF", to = "#DDAEEA", className = "" }: {
  children: ReactNode; from?: string; to?: string; className?: string;
}) {
  const th = useTh();
  const f = th.isDark ? from : "#2D0F6F", t = th.isDark ? to : "#9B5DE5";
  return (
    <span className={className} style={{ background: `linear-gradient(135deg,${f} 0%,${t} 100%)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
      {children}
    </span>
  );
}
