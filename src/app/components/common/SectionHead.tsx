import { ArrowRight } from "lucide-react";
import { useTh } from "@/app/theme/theme";

// En-tête de section : sur-titre, titre, lien éventuel à droite.
export function SectionHead({ id, eyebrow, title, action }: { id?: string; eyebrow: string; title: string; action?: { label: string; onClick: () => void } }) {
  const th = useTh();
  return (
    <div className="flex items-end justify-between gap-4 mb-6">
      <div>
        <p className="eyebrow" style={{ color: th.fg3 }}>{eyebrow}</p>
        <h3 id={id} className="mt-2 text-[1.35rem] sm:text-[1.6rem] font-black leading-tight" style={{ color: th.fg }}>{title}</h3>
      </div>
      {action && (
        <button type="button" onClick={action.onClick} className="group hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold shrink-0" style={{ color: th.fg }}>
          <span className="ink-link">{action.label}</span><ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
        </button>
      )}
    </div>
  );
}
