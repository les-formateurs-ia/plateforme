import type { ReactNode } from "react";

// Mise en valeur d'un titre : le surligneur de la charte (dégradé iris sous
// le texte, .hl dans theme.css), comme la promesse du site public. Le texte
// reste à l'encre — pas de background-clip:text, que Chrome peut cesser
// d'appliquer à certains zooms en laissant un texte invisible.
export function GT({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <span className={`hl ${className}`}>{children}</span>;
}
