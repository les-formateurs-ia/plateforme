import { useTh } from "@/app/theme/theme";

// Pas de couleur par défaut fixe : #dbacf0 (l'accent thème sombre) devenait
// invisible en thème clair sur le track (blanc à 8% sur fond blanc) comme
// sur l'arc — les deux doivent suivre th.isDark comme th.navAC le fait déjà.
export function CircleProgress({ pct, size = 88, color }: { pct: number; size?: number; color?: string }) {
  const th = useTh();
  const resolvedColor = color ?? th.navAC;
  const r = (size - 10) / 2, c = 2 * Math.PI * r, dash = (pct / 100) * c;
  return (
    <svg width={size} height={size}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={th.isDark ? "rgba(255,255,255,0.08)" : "rgba(15,14,20,0.08)"} strokeWidth={5} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={resolvedColor} strokeWidth={5}
        strokeDasharray={`${dash} ${c - dash}`} strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ filter: `drop-shadow(0 0 6px ${resolvedColor})` }} />
    </svg>
  );
}
