import { useEffect, useRef } from "react";
import type { LucideIcon } from "lucide-react";
import { mountSymbolField, SYMBOL_THEMES } from "@/app/lib/particles/symbol-field";
import { cx } from "@/app/lib/cx";

// Nuage de particules qui dessine l'icône quand la carte parente est survolée
// ou focalisée (cartes de formation du site public). À poser dans un élément
// positionné : la carte qui réagit est le plus proche ancêtre [data-symbol-card].
export function SymbolCloud({ Icon, theme = "violet", dark = false, className }: {
  Icon: LucideIcon; theme?: keyof typeof SYMBOL_THEMES; dark?: boolean; className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const iconRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current, holder = iconRef.current;
    const svg = holder?.querySelector("svg");
    const card = canvas?.closest<HTMLElement>("[data-symbol-card]") ?? canvas?.parentElement;
    if (!canvas || !svg || !card) return;
    const markup = new XMLSerializer().serializeToString(svg);
    const field = mountSymbolField(card, canvas, markup, { colors: SYMBOL_THEMES[theme], dark });
    return () => field.destroy();
  }, [Icon, theme, dark]);

  return (
    <>
      {/* L'icône n'est rendue que pour être sérialisée en SVG, jamais affichée. */}
      <span ref={iconRef} hidden><Icon /></span>
      <canvas ref={canvasRef} aria-hidden className={cx("pointer-events-none absolute", className)} />
    </>
  );
}
