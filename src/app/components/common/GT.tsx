import type { ReactNode } from "react";
import { useTh } from "@/app/theme/theme";

// Ancienne version : dégradé "clippé" au texte via background-clip:text +
// -webkit-text-fill-color:transparent. Abandonné — preuve en main (rapport
// console utilisateur) que Chrome peut, sur certaines conditions de zoom/DPR,
// cesser d'appliquer background-clip:text (il retombe sur border-box) tout en
// gardant -webkit-text-fill-color:transparent actif : le texte devient alors
// invisible sur un bloc plein, sans aucun filet de secours possible en CSS
// pur (text-fill-color gagne toujours sur `color` quand les deux sont
// définis). Une couleur pleine est moins spectaculaire mais ne peut pas
// disparaître.
export function GT({ children, className = "" }: { children: ReactNode; className?: string }) {
  const th = useTh();
  return (
    <span className={className} style={{ color: th.navAC }}>
      {children}
    </span>
  );
}
