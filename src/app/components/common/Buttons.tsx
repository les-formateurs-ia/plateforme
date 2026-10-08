import type { ReactNode } from "react";
import { useTh } from "@/app/theme/theme";
import { cx } from "@/app/lib/cx";

// Bouton principal : aplat d'encre à angles nets, le dégradé iris de la
// charte apparaît au survol (.sweep, theme.css) — le bouton du site public.
export function ShimBtn({ children, onClick, sm, full, disabled }: { children: ReactNode; onClick?: () => void; sm?: boolean; full?: boolean; disabled?: boolean }) {
  const th = useTh();
  return (
    <button onClick={onClick} disabled={disabled} style={{ background: th.ink, color: th.onInk }}
      className={cx("sweep inline-flex items-center justify-center gap-2 rounded-[2px] font-semibold leading-[1.1] disabled:opacity-40 disabled:pointer-events-none", full && "w-full", sm ? "min-h-10 px-4 text-sm" : "min-h-[50px] px-6 text-base")}>
      {children}
    </button>
  );
}

// Choix segmenté — pour les petits ensembles d'options (durée, résolution…).
export function Segmented({ value, onChange, options, disabled }: {
  value: string; onChange: (value: string) => void; options: { value: string; label: string }[]; disabled?: boolean;
}) {
  const th = useTh();
  return (
    <div className="inline-flex items-center gap-0.5 rounded-[4px] p-0.5 shrink-0" style={{ border: `1px solid ${th.inputB}` }}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button key={o.value} type="button" disabled={disabled} onClick={() => onChange(o.value)}
            className={cx("px-3 py-1.5 rounded-[2px] text-xs font-semibold transition-colors disabled:opacity-50 disabled:pointer-events-none", !active && "hover-fine:text-[var(--ink)]")}
            style={active ? { background: th.ink, color: th.onInk } : { color: th.fg3 }}>
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

// Bouton secondaire : filet d'encre sur fond transparent, même survol.
export function VBtn({ children, onClick, sm, full, disabled }: { children: ReactNode; onClick?: () => void; sm?: boolean; full?: boolean; disabled?: boolean }) {
  const th = useTh();
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ background: "transparent", border: `1px solid ${th.ink}`, color: th.fg }}
      className={cx("sweep inline-flex items-center justify-center gap-2 rounded-[2px] font-semibold leading-[1.1] disabled:opacity-40 disabled:pointer-events-none", full && "w-full", sm ? "min-h-9 px-4 text-sm" : "min-h-11 px-5 text-sm")}>
      {children}
    </button>
  );
}
