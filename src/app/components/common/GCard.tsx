import type { ReactNode } from "react";
import { useTh } from "@/app/theme/theme";
import { cx } from "@/app/lib/cx";

// Carte : fond plein, filet fin, sans ombre portée (site public). `accent`
// passe le filet à l'encre ; `glow` garde une ombre douce pour les rares
// cartes qui doivent se détacher (aperçus, panneaux flottants).
export function GCard({ children, className = "", glow = false, accent = false, onClick }: {
  children: ReactNode; className?: string; glow?: boolean; accent?: boolean; onClick?: () => void;
}) {
  const th = useTh();
  return (
    <div onClick={onClick} className={cx("rounded-[10px] overflow-hidden", className, onClick && "cursor-pointer")}
      style={{
        background: th.card,
        border: `1px solid ${accent ? th.ink : th.sep}`,
        boxShadow: glow ? "0 30px 60px -36px rgba(0,0,0,0.4)" : "none",
      }}>
      {children}
    </div>
  );
}
