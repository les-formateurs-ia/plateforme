import { useEffect, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router";
import { AlertTriangle, ArrowLeft, Check, Copy, MoveHorizontal } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { GT } from "@/app/components/common/GT";
import { NeuralField } from "@/app/components/particles/NeuralField";
import { cx } from "@/app/lib/cx";
import { ANNOTATION_GREEN as GREEN, ANNOTATION_RED as RED, scoreTone, type LocatedCorrection } from "@/app/lib/textAnnotation";

// Briques communes des exercices (Exercices prompts, Images & vidéos,
// Rétro-ingénierie) — même langage que Battle Ground : en-tête à eyebrow,
// scène noire où le réseau de la marque s'active quand l'IA travaille, note
// en anneau, frise des tentatives, comparaison avant/après à glisser.

export function ExerciseHeader({ backTo, backLabel, eyebrow, icon, title, intro, action }: {
  backTo: string; backLabel: string; eyebrow: string; icon: ReactNode; title: string; intro: ReactNode; action?: ReactNode;
}) {
  const th = useTh();
  const navigate = useNavigate();
  return (
    <div className="flex items-end justify-between gap-4 flex-wrap">
      <div className="min-w-0">
        <button onClick={() => navigate(backTo)} className="flex items-center gap-1.5 text-sm mb-2 transition-colors hover:opacity-70" style={{ color: th.fg3 }}>
          <ArrowLeft className="w-4 h-4" />{backLabel}
        </button>
        <p className="eyebrow flex items-center gap-2" style={{ color: th.fg3 }}>{icon}{eyebrow}</p>
        <h2 className="mt-2 text-[1.75rem] sm:text-[2.1rem] leading-[1.08] font-black" style={{ color: th.fg }}><GT>{title}</GT></h2>
        <p className="text-[15px] sm:text-base mt-2 max-w-3xl leading-relaxed" style={{ color: th.fg2 }}>{intro}</p>
      </div>
      {action}
    </div>
  );
}

// Scène noire : le réseau de la marque en fond, qui s'emballe quand `active`.
export function Stage({ active = false, children, className }: { active?: boolean; children: ReactNode; className?: string }) {
  return (
    <section className={cx("relative overflow-hidden rounded-[10px] bg-black text-white", className)}>
      <NeuralField dark density={3.2} band={1} active={active} className="opacity-80" />
      <div aria-hidden className="absolute inset-0" style={{ background: "radial-gradient(ellipse 70% 80% at 50% 45%, rgba(0,0,0,0.8) 30%, rgba(0,0,0,0.4) 100%)" }} />
      <div className="relative">{children}</div>
    </section>
  );
}

// Champ de saisie sur la scène noire (Cmd/Ctrl + Entrée pour valider).
export function StageTextarea({ id, value, onChange, onSubmit, placeholder, disabled, rows = 6, max }: {
  id?: string; value: string; onChange: (v: string) => void; onSubmit?: () => void;
  placeholder?: string; disabled?: boolean; rows?: number; max?: number;
}) {
  return (
    <div>
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => { if (onSubmit && e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); onSubmit(); } }}
        rows={rows}
        disabled={disabled}
        placeholder={placeholder}
        className="w-full rounded-[6px] px-4 py-3.5 text-[15px] leading-relaxed resize-y outline-none transition-colors placeholder:text-white/35 focus:border-white/60 disabled:opacity-60"
        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.22)", color: "#fff" }}
      />
      {max !== undefined && (
        <p className={cx("mt-1.5 text-right text-[11px] tabular-nums", value.length > max ? "text-[#fbc2ad]" : "text-white/40")}>{value.length}/{max}</p>
      )}
    </div>
  );
}

// Bouton principal sur la scène noire (aplat blanc, dégradé iris au survol).
export function StageButton({ onClick, disabled, children }: { onClick: () => void; disabled?: boolean; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled}
      className="sweep inline-flex items-center justify-center gap-2.5 min-h-[52px] px-7 rounded-[2px] bg-white text-black text-base font-semibold shrink-0 disabled:opacity-40 disabled:pointer-events-none">
      {children}
    </button>
  );
}

// Pastille cliquable de la scène (défis, repères, idées).
export function StageChip({ active, onClick, disabled, title, children }: { active?: boolean; onClick: () => void; disabled?: boolean; title?: string; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} title={title}
      className={cx("inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors disabled:opacity-40",
        active ? "bg-white text-black" : "text-white/75 hover-fine:text-white hover-fine:bg-white/10")}
      style={active ? undefined : { border: "1px solid rgba(255,255,255,0.22)" }}>
      {children}
    </button>
  );
}

// L'IA travaille : le réseau s'active, avec un chrono qui rassure sur les
// générations longues.
export function ThinkingPanel({ label, hint, height = 220, dark }: { label: string; hint?: string; height?: number; dark?: boolean }) {
  const th = useTh();
  const isDark = dark ?? th.isDark;
  const [started] = useState(() => Date.now());
  const [now, setNow] = useState(started);
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 100);
    return () => window.clearInterval(id);
  }, []);
  return (
    <div className="relative rounded-[6px] overflow-hidden flex flex-col items-center justify-center gap-1.5 text-center px-4"
      style={{ height, background: dark ? "rgba(255,255,255,0.04)" : th.navA }}>
      <NeuralField dark={isDark} density={4} band={0.9} active />
      <p className="relative text-sm font-semibold" style={{ color: dark ? "#fff" : th.fg }}>{label}</p>
      <p className="relative text-xs tabular-nums" style={{ color: dark ? "rgba(255,255,255,0.55)" : th.fg3 }}>
        {((now - started) / 1000).toFixed(1).replace(".", ",")} s{hint ? ` · ${hint}` : ""}
      </p>
    </div>
  );
}

// Note sur 20 en anneau, qui se dessine à l'apparition.
export function ScoreRing({ score, size = 112 }: { score: number; size?: number }) {
  const th = useTh();
  const tone = scoreTone(score);
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const id = window.requestAnimationFrame(() => setShown(score));
    return () => window.cancelAnimationFrame(id);
  }, [score]);
  const stroke = Math.max(6, size / 14);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} role="img" aria-label={`Note : ${score} sur 20`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={th.sep} strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={tone.color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - shown / 20)}
          style={{ transition: "stroke-dashoffset 1100ms cubic-bezier(.2,.8,.2,1)" }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-black leading-none tabular-nums" style={{ color: th.fg, fontSize: size * 0.3 }}>{score}</span>
        <span className="text-[11px] font-semibold mt-0.5" style={{ color: th.fg3 }}>/20</span>
      </div>
    </div>
  );
}

// Écart avec la tentative précédente (+3, −1…).
export function ScoreDelta({ delta }: { delta: number | null }) {
  const th = useTh();
  if (delta === null) return null;
  const color = delta > 0 ? GREEN : delta < 0 ? RED : th.fg3;
  return (
    <span className="text-xs font-bold tabular-nums" style={{ color }}>
      {delta > 0 ? `+${delta}` : delta < 0 ? `−${Math.abs(delta)}` : "="} vs tentative précédente
    </span>
  );
}

// Frise des tentatives : une barre par essai, hauteur = note. Remplace
// l'ancien pager « 2 / 5 » : on voit la progression d'un coup d'œil et on
// saute à n'importe quel essai.
export function AttemptTrail({ scores, active, onSelect, extra }: {
  scores: (number | null)[]; active: number; onSelect: (i: number) => void; extra?: ReactNode;
}) {
  const th = useTh();
  return (
    <div className="flex items-end gap-1.5 overflow-x-auto pb-1" role="tablist" aria-label="Tes tentatives">
      {scores.map((s, i) => {
        const on = i === active;
        const tone = s !== null ? scoreTone(s) : null;
        return (
          <button key={i} type="button" role="tab" aria-selected={on} onClick={() => onSelect(i)}
            title={s !== null ? `Tentative ${i + 1} · ${s}/20` : `Tentative ${i + 1}`}
            className="group flex flex-col items-center gap-1 shrink-0 w-9">
            <span className="w-full rounded-[3px] flex items-end overflow-hidden" style={{ height: 40, background: th.navA, outline: on ? `1.5px solid ${th.ink}` : "none", outlineOffset: 2 }}>
              <span className="w-full rounded-[3px] transition-[height] duration-500"
                style={{ height: `${s !== null ? Math.max(8, (s / 20) * 100) : 100}%`, background: tone ? tone.color : th.sep, opacity: on ? 1 : 0.55 }} />
            </span>
            <span className="text-[10px] font-semibold tabular-nums" style={{ color: on ? th.fg : th.fg3 }}>{s ?? "·"}</span>
          </button>
        );
      })}
      {extra}
    </div>
  );
}

// Corrections numérotées (extrait barré → suggestion), avec explication.
export function CorrectionList({ corrections, compact = false }: { corrections: LocatedCorrection[]; compact?: boolean }) {
  const th = useTh();
  if (!corrections.length) return null;
  return (
    <ol className={compact ? "space-y-3" : "space-y-4"}>
      {corrections.map((c) => (
        <li key={c.index} className="flex gap-3">
          <span className="shrink-0 rounded-full flex items-center justify-center font-bold text-[11px]" style={{ width: 22, height: 22, background: th.ink, color: th.onInk }}>{c.index}</span>
          <div className="min-w-0 flex-1 space-y-1">
            <p className="text-[13px] leading-relaxed break-words">
              <span style={{ color: RED, textDecoration: "line-through" }}>{c.excerpt}</span>
              <span style={{ color: th.fg3 }}> → </span>
              <span style={{ color: GREEN, fontWeight: 600 }}>{c.suggestion}</span>
            </p>
            {!compact && <p className="text-[13px] leading-relaxed" style={{ color: th.fg2 }}>{c.explanation}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}

export function MissingList({ items }: { items: { title: string; explanation: string }[] }) {
  const th = useTh();
  if (!items.length) return null;
  return (
    <ul className="space-y-3.5">
      {items.map((m, i) => (
        <li key={i} className="flex gap-3">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: th.danger }} />
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-bold" style={{ color: th.fg }}>{m.title}</p>
            <p className="text-[13px] leading-relaxed mt-0.5" style={{ color: th.fg2 }}>{m.explanation}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

// Bloc titré d'un retour (corrections, manques, verdict…).
export function FeedbackBlock({ title, children, accent }: { title: string; children: ReactNode; accent?: boolean }) {
  const th = useTh();
  return (
    <div className="rounded-[10px] p-5 sm:p-6" style={{ background: th.card, border: `1px solid ${accent ? th.ink : th.sep}` }}>
      <p className="eyebrow mb-4" style={{ color: th.fg3 }}>{title}</p>
      {children}
    </div>
  );
}

export function CopyButton({ text, label = "Copier" }: { text: string; label?: string }) {
  const th = useTh();
  const [copied, setCopied] = useState(false);
  return (
    <button type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1600);
        } catch {
          // presse-papiers indisponible : rien à faire
        }
      }}
      className="inline-flex items-center gap-1 text-xs font-semibold transition-opacity hover-fine:opacity-70" style={{ color: th.fg3 }}>
      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}{copied ? "Copié" : label}
    </button>
  );
}

// Comparaison avant/après : on fait glisser la séparation (souris, doigt ou
// flèches du clavier) pour révéler l'une ou l'autre image.
export function CompareSlider({ before, after, beforeLabel, afterLabel }: { before: string; after: string; beforeLabel: string; afterLabel: string }) {
  const [pos, setPos] = useState(50);
  const box = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const moveTo = (clientX: number) => {
    const rect = box.current?.getBoundingClientRect();
    if (!rect) return;
    setPos(Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100)));
  };

  return (
    <div ref={box} className="relative w-full overflow-hidden rounded-[8px] bg-black select-none touch-none cursor-ew-resize"
      style={{ aspectRatio: "1/1" }}
      onPointerDown={(e) => { dragging.current = true; e.currentTarget.setPointerCapture(e.pointerId); moveTo(e.clientX); }}
      onPointerMove={(e) => { if (dragging.current) moveTo(e.clientX); }}
      onPointerUp={() => { dragging.current = false; }}
      onPointerCancel={() => { dragging.current = false; }}>
      <img src={after} alt={afterLabel} draggable={false} className="absolute inset-0 w-full h-full object-cover" />
      <img src={before} alt={beforeLabel} draggable={false} className="absolute inset-0 w-full h-full object-cover" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }} />
      <span className="absolute top-3 left-3 px-2 py-1 rounded-[2px] text-[11px] font-bold bg-black/60 text-white backdrop-blur-sm">{beforeLabel}</span>
      <span className="absolute top-3 right-3 px-2 py-1 rounded-[2px] text-[11px] font-bold bg-black/60 text-white backdrop-blur-sm">{afterLabel}</span>
      <div className="absolute top-0 bottom-0 w-0.5 bg-white" style={{ left: `${pos}%`, transform: "translateX(-50%)" }}>
        <button type="button" aria-label="Déplacer la comparaison"
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft") { e.preventDefault(); setPos((p) => Math.max(0, p - 5)); }
            if (e.key === "ArrowRight") { e.preventDefault(); setPos((p) => Math.min(100, p + 5)); }
          }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shadow-lg">
          <MoveHorizontal className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// Repères d'un bon prompt, allumés au fil de la frappe (détection simple par
// mots-clés : un coup de pouce, pas une note — la vraie note vient de l'IA).
export function PromptCues({ text, cues }: { text: string; cues: { label: string; test: RegExp; hint: string }[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {cues.map((c) => {
        const on = c.test.test(text);
        return (
          <span key={c.label} title={c.hint}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors duration-300"
            style={on ? { background: "var(--grad-iris)", color: "#000" } : { border: "1px solid rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.5)" }}>
            {on ? <Check className="w-3 h-3" strokeWidth={3} /> : <span className="w-1.5 h-1.5 rounded-full bg-white/30" />}
            {c.label}
          </span>
        );
      })}
    </div>
  );
}

// Repères d'un prompt d'image (Images & vidéos, Rétro-ingénierie).
export const IMAGE_CUES = [
  { label: "Sujet", test: /\w{3,}/, hint: "Ce qu'on voit : le sujet principal, précisément décrit." },
  { label: "Style", test: /(photo|photographie|illustration|aquarelle|3d|rendu|réaliste|cinématographique|minimaliste|dessin|peinture|style)/i, hint: "Photo réaliste, illustration, 3D, aquarelle…" },
  { label: "Lumière", test: /(lumière|éclairage|soleil|ombre|contre-jour|golden hour|néon|tamisé|studio|lumineux|sombre)/i, hint: "Lumière naturelle, studio, coucher de soleil…" },
  { label: "Cadrage", test: /(gros plan|plan large|vue de|plongée|contre-plongée|cadrage|angle|portrait|paysage|format|premier plan|arrière-plan)/i, hint: "Gros plan, plan large, vue de dessus…" },
  { label: "Couleurs", test: /(couleur|tons?|teintes?|palette|pastel|noir et blanc|vif|chaud|froid|bleu|rouge|vert|jaune|orange|violet|rose|beige)/i, hint: "Palette, tons chauds ou froids…" },
  { label: "Ambiance", test: /(ambiance|atmosphère|mood|calme|dynamique|joyeux|mystérieux|chaleureux|élégant|moderne|cosy)/i, hint: "L'émotion que l'image doit dégager." },
];
