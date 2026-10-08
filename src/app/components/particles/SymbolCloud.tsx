import { useEffect, useRef } from "react";
import type { LucideIcon } from "lucide-react";
import { mountSymbolField, SYMBOL_THEMES } from "@/app/lib/particles/symbol-field";
import { cx } from "@/app/lib/cx";

// Illustration en particules d'une carte (cartes de formation du site public).
// La forme vient d'une icône de l'app (Icon) ou d'un logo sur fond uni (image).
//   rest="cloud"  : nuage au repos, la forme se dessine au survol (site public)
//   rest="symbol" : forme dessinée au repos, elle se disperse et se reforme au survol
// La carte qui réagit est le plus proche ancêtre [data-symbol-card].
export function SymbolCloud({ Icon, image, theme = "violet", dark = false, rest = "cloud", className }: {
  Icon?: LucideIcon; image?: string; theme?: keyof typeof SYMBOL_THEMES; dark?: boolean; rest?: "cloud" | "symbol"; className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const iconRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const card = canvas?.closest<HTMLElement>("[data-symbol-card]") ?? canvas?.parentElement;
    if (!canvas || !card) return;
    let shape: { svg: string } | { image: string } | null = null;
    if (image) shape = { image };
    else {
      const svg = iconRef.current?.querySelector("svg");
      if (svg) shape = { svg: new XMLSerializer().serializeToString(svg) };
    }
    if (!shape) return;
    const field = mountSymbolField(card, canvas, shape, { colors: SYMBOL_THEMES[theme], dark, rest });
    return () => field.destroy();
  }, [Icon, image, theme, dark, rest]);

  return (
    <>
      {/* L'icône n'est rendue que pour être sérialisée en SVG, jamais affichée. */}
      {Icon && <span ref={iconRef} hidden><Icon /></span>}
      <canvas ref={canvasRef} aria-hidden className={cx("pointer-events-none absolute", className)} />
    </>
  );
}
