import type { ReactNode } from "react";
import { useTh } from "@/app/theme/theme";

export function GT({ children, from = "#FFFFFF", to = "#dbacf0", className = "" }: {
  children: ReactNode; from?: string; to?: string; className?: string;
}) {
  const th = useTh();
  // En thème clair, le dégradé doit rester lisible sur un fond quasi blanc
  // (#F7F7FA) : #dbacf0 est l'accent réservé au thème sombre (cf. th.navAC)
  // — trop pâle ici, il rendait la fin du texte quasi invisible. On assombrit
  // les deux bornes plutôt que de reprendre les couleurs du thème sombre.
  const f = th.isDark ? from : "#7c4fc4", t = th.isDark ? to : "#b58de0";
  return (
    // `color` sert de filet de sécurité : si le clip du gradient au texte
    // échoue pour une raison quelconque (glitch de compositing GPU, contexte
    // qui ne supporte pas background-clip:text, mode contraste élevé…),
    // WebkitTextFillColor est ignoré et ce `color` plein reprend la main —
    // sans lui le texte devient invisible plutôt que juste moins joli.
    <span className={className} style={{ background: `linear-gradient(135deg,${f} 0%,${t} 100%)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", color: f }}>
      {children}
    </span>
  );
}
