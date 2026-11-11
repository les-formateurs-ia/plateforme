import { useEffect, useId, useRef, type ReactNode } from "react";
import { useTh } from "@/app/theme/theme";
import { NeuralField } from "@/app/components/particles/NeuralField";
import { burst } from "@/app/lib/particles/burst";
import "./playgrounds.css";

// Briques visuelles communes aux Playgrounds et Fiches de révision natifs :
// couleurs de la charte (dégradé iris), réseau de particules de la marque,
// gerbes de particules aux moments de réussite.

export const IRIS_STOPS = ["#b58de0", "#dbacf0", "#78d5e2", "#6adeb1", "#fbc2ad"] as const;

// Une teinte de la charte par outil de référence (repère visuel constant dans toute la formation).
export const TOOL_TINT: Record<string, string> = {
  chatgpt: "#6adeb1",
  claude: "#fbc2ad",
  gemini: "#78d5e2",
  copilot: "#b58de0",
  firefly: "#dbacf0",
};

export function alpha(hex: string, a: number) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

/** Bandeau d'en-tête : réseau de particules de la marque en fond, liseré iris. */
export function Hero({ children, active }: { children: ReactNode; active?: boolean }) {
  const th = useTh();
  return (
    <div className="pg-iris-border">
      <div className="pg-inner relative overflow-hidden" style={{ background: th.isDark ? "#07070a" : "#fbfaff" }}>
        <NeuralField dark={th.isDark} density={2.4} band={0.9} speed={0.7} active={active} />
        <div aria-hidden className="absolute inset-0" style={{ background: `radial-gradient(120% 90% at 0% 0%, ${alpha("#b58de0", th.isDark ? 0.22 : 0.16)}, transparent 55%), radial-gradient(90% 80% at 100% 100%, ${alpha("#78d5e2", th.isDark ? 0.2 : 0.14)}, transparent 60%)` }} />
        <div className="relative p-6 md:p-8">{children}</div>
      </div>
    </div>
  );
}

/** Tuile de tableau de bord : teinte propre, halo coloré, état « exploré ». */
export function Tile({ tint, onClick, selected, done, children, className = "", label }: {
  tint: string; onClick?: () => void; selected?: boolean; done?: boolean; children: ReactNode; className?: string; label?: string;
}) {
  const th = useTh();
  const Tag = onClick ? "button" : "div";
  return (
    <Tag onClick={onClick} aria-pressed={onClick ? !!selected : undefined} aria-label={label}
      className={`pg-tile overflow-hidden text-left ${className}`}
      style={{
        background: `linear-gradient(160deg, ${alpha(tint, th.isDark ? 0.16 : 0.12)}, ${th.card} 70%)`,
        border: `1px solid ${selected ? tint : alpha(tint, th.isDark ? 0.35 : 0.5)}`,
        boxShadow: selected ? `0 18px 40px -22px ${alpha(tint, 0.9)}` : "none",
      }}>
      <span className="pg-glow" style={{ background: tint }} aria-hidden />
      <span className="relative block h-full">{children}</span>
      {done && (
        <span className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold" style={{ background: tint, color: "#111" }} aria-label="Exploré">✓</span>
      )}
    </Tag>
  );
}

/** Anneau de progression au dégradé iris ; gerbe de particules à 100 %. */
export function ProgressRing({ value, size = 92, label }: { value: number; size?: number; label: string }) {
  const th = useTh();
  const ref = useRef<HTMLDivElement>(null);
  const prev = useRef(value);
  const gid = `pg-ring-${useId().replace(/:/g, "")}`;
  const r = (size - 10) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100);
  useEffect(() => {
    if (prev.current < 1 && value >= 1 && ref.current) burst(ref.current, { count: 90 });
    prev.current = value;
  }, [value]);
  return (
    <div ref={ref} className="relative shrink-0" style={{ width: size, height: size }} role="img" aria-label={`${label} : ${pct} %`}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={gid} x1="0" x2="1" y1="0" y2="1">
            {IRIS_STOPS.map((s, i) => <stop key={s} offset={`${(i / (IRIS_STOPS.length - 1)) * 100}%`} stopColor={s} />)}
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={th.sep} strokeWidth={8} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={`url(#${gid})`} strokeWidth={8} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)} style={{ transition: "stroke-dashoffset .8s cubic-bezier(.2,.8,.2,1)" }} />
      </svg>
      <span className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-semibold tabular-nums" style={{ color: th.fg }}>{pct}%</span>
        <span className="text-[9.5px] font-bold uppercase tracking-widest" style={{ color: th.fg3 }}>{label}</span>
      </span>
    </div>
  );
}

/** Pastille numérotée au dégradé iris. */
export function IrisNumber({ n }: { n: number | string }) {
  return (
    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold shrink-0"
      style={{ background: "var(--grad-iris)", color: "#111" }}>{n}</span>
  );
}

/** Étiquette colorée. */
export function Chip({ tint, children }: { tint: string; children: ReactNode }) {
  const th = useTh();
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
      style={{ background: alpha(tint, th.isDark ? 0.18 : 0.22), color: th.fg, border: `1px solid ${alpha(tint, 0.6)}` }}>{children}</span>
  );
}

/** Lance une gerbe de particules depuis un élément (moment de réussite). */
export function celebrate(el: Element | null | undefined, power = 1) {
  if (el) burst(el, { count: Math.round(60 * power), power });
}
