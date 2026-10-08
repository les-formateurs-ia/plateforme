import type { ReactNode } from "react";
import { ArrowRight, Lock, type LucideIcon } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { SymbolCloud } from "@/app/components/particles/SymbolCloud";
import { cx } from "@/app/lib/cx";

// Carte d'entrée vers un espace ou un atelier (accueil, exercices…) : en haut,
// un nuage de particules qui dessine l'icône au survol (cartes de formation du
// site public) ; en bas, sur-titre, titre, description et appel à l'action.
export function SymbolCard({ Icon, theme, eyebrow, title, desc, cta, onClick, disabled, footnote, height = 144 }: {
  Icon: LucideIcon; theme: "violet" | "bleu" | "beige"; eyebrow?: string; title: string; desc: string; cta: string;
  onClick: () => void; disabled?: boolean; footnote?: ReactNode; height?: number;
}) {
  const th = useTh();
  return (
    <button type="button" onClick={onClick} disabled={disabled} data-symbol-card
      className={cx("group relative overflow-hidden rounded-[10px] text-left flex flex-col transition-colors", disabled ? "opacity-50 cursor-default" : "hover-fine:[border-color:var(--ink)]!")}
      style={{ border: `1px solid ${th.sep}`, background: th.card }}>
      <div className="relative" style={{ height, borderBottom: `1px solid ${th.sep}` }}>
        <SymbolCloud Icon={Icon} theme={theme} dark={th.isDark} className="inset-0 w-full h-full" />
      </div>
      <div className="p-5 flex-1 flex flex-col">
        {eyebrow && <p className="eyebrow mb-2" style={{ color: th.fg3 }}>{eyebrow}</p>}
        <h3 className="text-xl font-black leading-tight" style={{ color: th.fg }}>{title}</h3>
        <p className="mt-1.5 text-sm leading-relaxed flex-1" style={{ color: th.fg2 }}>{desc}</p>
        {footnote}
        <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold" style={{ color: disabled ? th.fg3 : th.fg }}>
          {disabled ? <><Lock className="w-3.5 h-3.5" />{cta}</> : <><span className="ink-link">{cta}</span><ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" /></>}
        </span>
      </div>
    </button>
  );
}
