export function CircleProgress({ pct, size = 88, color = "#dbacf0" }: { pct: number; size?: number; color?: string }) {
  const r = (size - 10) / 2, c = 2 * Math.PI * r, dash = (pct / 100) * c;
  return (
    <svg width={size} height={size}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={5} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={5}
        strokeDasharray={`${dash} ${c - dash}`} strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ filter: `drop-shadow(0 0 6px ${color})` }} />
    </svg>
  );
}
