import type { ReactNode } from "react";
import { ArrowRight, Lock } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { ToolDemo, type DemoKind } from "@/app/components/common/ToolDemo";
import { cx } from "@/app/lib/cx";

// Carte d'entrée vers un espace ou un atelier (accueil, exercices, studio) : en
// haut, une mini-démo de l'outil (ToolDemo) sur un voile pastel ; en bas,
// sur-titre, titre, description et appel à l'action.
const THEME_WASH = { violet: "rgba(181,141,224,0.22)", bleu: "rgba(120,213,226,0.24)", beige: "rgba(251,194,173,0.28)" } as const;

export function SymbolCard({ demo, logo, demoLabel, theme, eyebrow, title, desc, cta, onClick, disabled, footnote, height = 188 }: {
  demo: DemoKind; logo?: string; demoLabel?: string; theme: "violet" | "bleu" | "beige"; eyebrow?: string; title: string; desc: string; cta: string;
  onClick: () => void; disabled?: boolean; footnote?: ReactNode; height?: number;
}) {
  const th = useTh();
  return (
    <button type="button" onClick={onClick} disabled={disabled} data-symbol-card
      className={cx("group relative overflow-hidden rounded-[10px] text-left flex flex-col transition-colors", disabled ? "opacity-50 cursor-default" : "hover-fine:[border-color:var(--ink)]!")}
      style={{ border: `1px solid ${th.sep}`, background: th.card }}>
      {/* Illustration sur un voile pastel très léger, aux couleurs de la tuile. */}
      {/* w-full : Safari n'étire pas les enfants d'un <button> en flex colonne ;
          sans contenu propre, la zone retombait à 0 px de large. */}
      <div className="relative w-full overflow-hidden" style={{ height, borderBottom: `1px solid ${th.sep}`, background: `radial-gradient(ellipse 75% 90% at 50% 60%, ${THEME_WASH[theme]}, transparent 80%)` }}>
        <ToolDemo kind={demo} logo={logo} label={demoLabel ?? title} />
      </div>
      <div className="w-full p-5 flex-1 flex flex-col">
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
