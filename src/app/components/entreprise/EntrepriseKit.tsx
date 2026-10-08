// Kit visuel de l'espace Entreprise, dans la direction artistique du site
// public : cartes plates à filet fin (le filet passe à l'encre au survol),
// actions à l'encre, angles nets. Chaque rubrique garde sa teinte de la
// charte (HUES), mais seulement en repère : pastille pastel à icône noire,
// filet, barre de progression — jamais en texte (contraste insuffisant sur
// blanc) ni sur les boutons. La teinte est transmise par HueProvider : un
// composant posé dans la rubrique "Quiz de validation" prend
// automatiquement l'ambre, sans prop à faire descendre.
import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { ArrowLeft, Loader2, type LucideIcon } from "lucide-react";
import { useTh, hexToRgb } from "@/app/theme/theme";
import { GT } from "@/app/components/common/GT";
import { VSwitch } from "@/app/components/common/VSwitch";
import { DialogHeader, DialogTitle, DialogDescription } from "@/app/components/ui/dialog";
import { cx } from "@/app/lib/cx";
import { NeuralField } from "@/app/components/particles/NeuralField";
import { burst } from "@/app/lib/particles/burst";

// Teintes pastel de la charte (violet / turquoise / pêche + dérivés).
export const HUES = {
  violet: ["#b58de0", "#dbacf0"],
  teal: ["#78d5e2", "#6adeb1"],
  peach: ["#f4a98c", "#fbc2ad"],
  blue: ["#7fa8f0", "#a9c6f7"],
  pink: ["#e48fbf", "#f3b7d6"],
  amber: ["#eeb85a", "#f6d38e"],
} as const;
export type Hue = keyof typeof HUES;
// Ordre de rotation quand une liste n'a pas de teinte métier (entreprises…).
export const HUE_ORDER: Hue[] = ["violet", "teal", "blue", "peach", "pink", "amber"];

export const SUCCESS = "#3fbf8f";
export const DANGER = "#ef8a74";

const HueCtx = createContext<Hue>("violet");

export function HueProvider({ hue, children }: { hue: Hue; children: ReactNode }) {
  return <HueCtx.Provider value={hue}>{children}</HueCtx.Provider>;
}

export function useHue(override?: Hue) {
  const th = useTh();
  const ctx = useContext(HueCtx);
  const hue = override ?? ctx;
  const [c1, c2] = HUES[hue];
  const rgb = hexToRgb(c1);
  return {
    hue, c1, c2, rgb,
    // Texte coloré : l'encre (les pastels de la charte n'ont pas le
    // contraste nécessaire sur fond blanc).
    text: th.fg,
    gradient: `linear-gradient(135deg,${c1},${c2})`,
    alpha: (a: number) => `rgba(${rgb},${a})`,
  };
}

// ── Transitions ───────────────────────────────────────────────────────────

// Transition "morph" entre deux vues, en JS pur (Web Animations, compatible
// avec tous les navigateurs) : l'élément cliqué (tuile) et celui qui le
// remplace (bandeau de titre) portent le même data-morph. Au clic,
// runMorph() mesure la position de départ et efface le reste de la vue ;
// au montage, useMorph() fait glisser la cible depuis cette position en la
// dévoilant (clip-path) jusqu'à sa taille finale. Fonctionne aussi quand la
// nouvelle vue est rendue en différé (navigation du routeur).
const MORPH_MS = 300;
const EXIT_MS = 120;
const EASE = "cubic-bezier(0.2, 0.8, 0.2, 1)";

let pendingMorph: { name: string; rect: DOMRect; at: number } | null = null;

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const takePending = (name?: string) =>
  name && pendingMorph?.name === name && performance.now() - pendingMorph.at < 1500 ? pendingMorph : null;

export function runMorph(name: string, update: () => void) {
  const from = document.querySelector<HTMLElement>(`[data-morph="${CSS.escape(name)}"]`);
  if (!from || reducedMotion()) { update(); return; }
  pendingMorph = { name, rect: from.getBoundingClientRect(), at: performance.now() };
  // Efface le reste de la vue (sauf l'élément cliqué et ce qui le contient).
  const scope = from.closest("[data-morph-scope]") ?? document.body;
  const others = Array.from(scope.querySelectorAll<HTMLElement>("[data-morph-fade]"))
    .filter((el) => el !== from && !el.contains(from) && !from.contains(el));
  others.forEach((el) => el.animate(
    [{ opacity: 1, transform: "none" }, { opacity: 0, transform: "scale(0.97)" }],
    { duration: EXIT_MS, easing: "ease-out", fill: "forwards" },
  ));
  window.setTimeout(update, others.length ? EXIT_MS - 20 : 0);
}

// Cible d'un morph : à poser via ref + data-morph={name}. Renvoie aussi si
// l'élément arrive par un morph (dans ce cas pas de fade-up d'entrée).
export function useMorph<T extends HTMLElement>(name?: string) {
  const ref = useRef<T>(null);
  const [incoming] = useState(() => !!takePending(name));
  useLayoutEffect(() => {
    const pending = takePending(name);
    const el = ref.current;
    if (!pending || !el) return;
    pendingMorph = null;
    const to = el.getBoundingClientRect();
    const from = pending.rect;
    // Plus petite au départ : on ne montre que la zone de l'ancienne tuile
    // (clip-path), qui s'ouvre jusqu'à la taille finale en glissant.
    const right = Math.max(0, to.width - from.width);
    const bottom = Math.max(0, to.height - from.height);
    el.animate([
      { transform: `translate(${from.left - to.left}px, ${from.top - to.top}px)`, clipPath: `inset(0px ${right}px ${bottom}px 0px round 10px)` },
      { transform: "translate(0px, 0px)", clipPath: "inset(0px 0px 0px 0px round 10px)" },
    ], { duration: MORPH_MS, easing: EASE });
  }, [name]);
  return { ref, incoming };
}

// ── Surfaces ──────────────────────────────────────────────────────────────

// Carte de base : fond plein, filet fin, sans ombre. Interactive (onClick) :
// le filet passe à l'encre au survol. `watermark` et `halo` sont conservés
// dans la signature mais n'affichent plus rien (décor sans fonction).
export function Panel({ children, hue: _hue, watermark: _watermark, onClick, index, className, halo: _halo = true, morphName }: {
  children: ReactNode; hue?: Hue; watermark?: LucideIcon; onClick?: () => void; index?: number; className?: string; halo?: boolean;
  morphName?: string; // cible d'une transition (cf. runMorph)
}) {
  const morph = useMorph<HTMLDivElement>(morphName);
  const th = useTh();
  const interactive = !!onClick;
  const vars = {
    "--kit-b0": th.sep,
    "--kit-b1": th.ink,
    background: th.card,
    ...(index !== undefined ? { animationDelay: `${Math.min(index, 12) * 40}ms` } : {}),
  } as CSSProperties;
  return (
    <div ref={morph.ref} data-morph={morphName} data-morph-fade="" style={vars} onClick={onClick}
      role={interactive ? "button" : undefined} tabIndex={interactive ? 0 : undefined}
      onKeyDown={interactive ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } } : undefined}
      className={cx(
        "group relative overflow-hidden rounded-[10px] border transition-colors duration-200 [border-color:var(--kit-b0)]",
        index !== undefined && !morph.incoming && "fade-up",
        interactive && "cursor-pointer hover-fine:[border-color:var(--kit-b1)] focus-visible:[border-color:var(--kit-b1)]",
        className,
      )}>
      <div className="relative">{children}</div>
    </div>
  );
}

// Pastille d'icône : le dégradé pastel de la rubrique, icône à l'encre noire
// (comme les repères numérotés du site public).
export function IconBadge({ Icon, hue, size = "md" }: { Icon: LucideIcon; hue?: Hue; size?: "sm" | "md" | "lg" | "xl" }) {
  const h = useHue(hue);
  const box = { sm: "w-9 h-9 rounded-[4px]", md: "w-11 h-11 rounded-[6px]", lg: "w-14 h-14 rounded-[6px]", xl: "w-14 h-14 sm:w-[4.5rem] sm:h-[4.5rem] rounded-[8px]" }[size];
  const icon = { sm: "w-4 h-4", md: "w-5 h-5", lg: "w-6 h-6", xl: "w-6 h-6 sm:w-8 sm:h-8" }[size];
  return (
    <div className={cx(box, "flex items-center justify-center shrink-0")} style={{ background: h.gradient }}>
      <Icon className={icon} style={{ color: "#000" }} strokeWidth={2} />
    </div>
  );
}

// Initiales en pastille dégradée (collaborateurs).
export function Initials({ name, hue }: { name: string; hue?: Hue }) {
  const h = useHue(hue);
  const letters = name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("") || "?";
  return (
    <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 text-sm font-black"
      style={{ background: h.gradient, color: "#000" }}>
      {letters}
    </div>
  );
}

export type PillTone = "hue" | "solid" | "done" | "warn" | "danger" | "muted";

export function Pill({ children, tone = "hue", hue, Icon }: { children: ReactNode; tone?: PillTone; hue?: Hue; Icon?: LucideIcon }) {
  const th = useTh();
  const h = useHue(hue);
  const amber = HUES.amber[0];
  const style: CSSProperties =
    tone === "solid" ? { background: h.gradient, color: "#000", borderColor: "transparent" }
    : tone === "done" ? { background: "rgba(106,222,177,0.18)", color: th.isDark ? "#6adeb1" : "#1f7a57", borderColor: "transparent" }
    : tone === "warn" ? { background: `rgba(${hexToRgb(amber)},0.2)`, color: th.isDark ? HUES.amber[1] : "#8a5a00", borderColor: "transparent" }
    : tone === "danger" ? { background: "rgba(239,138,116,0.16)", color: th.isDark ? DANGER : "#b4442b", borderColor: "transparent" }
    : tone === "muted" ? { color: th.fg3, borderColor: th.sep }
    : { background: h.alpha(th.isDark ? 0.2 : 0.16), color: th.fg, borderColor: "transparent" };
  return (
    <span className="inline-flex items-center gap-1 rounded-[2px] border px-2 py-0.5 text-[11px] font-bold whitespace-nowrap" style={style}>
      {Icon && <Icon className="w-3 h-3" />}{children}
    </span>
  );
}

// ── Boutons ───────────────────────────────────────────────────────────────

export function HueButton({ children, onClick, disabled, hue: _hue, Icon, sm, full, type = "button" }: {
  children: ReactNode; onClick?: () => void; disabled?: boolean; hue?: Hue; Icon?: LucideIcon; sm?: boolean; full?: boolean; type?: "button" | "submit";
}) {
  const th = useTh();
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      className={cx(
        "sweep inline-flex items-center justify-center gap-2 rounded-[2px] font-semibold leading-[1.1] disabled:opacity-40 disabled:pointer-events-none",
        sm ? "min-h-9 px-4 text-sm" : "min-h-11 px-5 text-sm", full && "w-full",
      )}
      style={{ background: th.ink, color: th.onInk }}>
      {Icon && <Icon className="w-4 h-4 shrink-0" />}{children}
    </button>
  );
}

export function GhostButton({ children, onClick, disabled, hue: _hue, Icon, sm, full }: {
  children: ReactNode; onClick?: () => void; disabled?: boolean; hue?: Hue; Icon?: LucideIcon; sm?: boolean; full?: boolean;
}) {
  const th = useTh();
  return (
    <button type="button" onClick={onClick} disabled={disabled}
      style={{ border: `1px solid ${th.ink}`, color: th.fg }}
      className={cx(
        "sweep inline-flex items-center justify-center gap-2 rounded-[2px] font-semibold leading-[1.1] disabled:opacity-40 disabled:pointer-events-none",
        sm ? "min-h-9 px-4 text-sm" : "min-h-11 px-5 text-sm", full && "w-full",
      )}>
      {Icon && <Icon className="w-4 h-4 shrink-0" />}{children}
    </button>
  );
}

// Bouton icône seul (éditer, supprimer, monter…) — toujours avec un title.
// active : état "activé" (icône et fond aux couleurs de la rubrique).
export function IconAction({ Icon, onClick, title, tone = "default", disabled, hue, active }: {
  Icon: LucideIcon; onClick: () => void; title: string; tone?: "default" | "danger"; disabled?: boolean; hue?: Hue; active?: boolean;
}) {
  const th = useTh();
  const h = useHue(hue);
  const danger = tone === "danger";
  return (
    <button type="button" title={title} aria-label={title} disabled={disabled}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClick(); }}
      style={{
        background: active ? h.alpha(th.isDark ? 0.24 : 0.2) : "transparent",
        "--kit-b0": active ? th.ink : th.inputB,
        "--kit-b1": danger ? DANGER : th.ink,
        "--kit-bg1": danger ? "rgba(239,138,116,0.12)" : th.navA,
        color: danger ? DANGER : active ? th.fg : th.fg2,
      } as CSSProperties}
      className="w-9 h-9 rounded-[4px] flex items-center justify-center shrink-0 border transition-colors duration-200 [border-color:var(--kit-b0)] hover-fine:[border-color:var(--kit-b1)] hover-fine:[background:var(--kit-bg1)] disabled:opacity-30 disabled:pointer-events-none">
      <Icon className="w-4 h-4" />
    </button>
  );
}

// Interrupteur "Visible / Masqué" des contenus proposés aux élèves.
export function VisibilityToggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  const th = useTh();
  return (
    <label className="inline-flex items-center gap-2 rounded-[4px] pl-3 pr-1 py-1 text-xs font-bold cursor-pointer select-none"
      style={{ border: `1px solid ${th.inputB}`, color: checked ? th.fg : th.fg3 }}
      onClick={(e) => e.stopPropagation()}>
      {checked ? "Visible" : "Masqué"}
      <VSwitch checked={checked} onCheckedChange={onChange} />
    </label>
  );
}

// ── Blocs de mise en page ─────────────────────────────────────────────────

// Ligne d'élément (quiz, fichier, collaborateur…) dans une liste.
export function ItemCard({ leading, Icon, title, subtitle, pills, actions, onClick, hue, index }: {
  leading?: ReactNode; Icon?: LucideIcon; title: ReactNode; subtitle?: ReactNode; pills?: ReactNode; actions?: ReactNode;
  onClick?: () => void; hue?: Hue; index?: number;
}) {
  const th = useTh();
  return (
    <Panel hue={hue} onClick={onClick} index={index}>
      <div className="p-4 sm:p-5 flex flex-wrap items-center gap-x-4 gap-y-3">
        {leading ?? (Icon && <IconBadge Icon={Icon} hue={hue} />)}
        <div className="flex-1 min-w-[180px]">
          <div className="text-base font-bold truncate" style={{ color: th.fg }}>{title}</div>
          {subtitle && <div className="text-sm mt-0.5 truncate" style={{ color: th.fg3 }}>{subtitle}</div>}
          {pills && <div className="flex flex-wrap items-center gap-1.5 mt-2">{pills}</div>}
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0 flex-wrap" onClick={(e) => e.stopPropagation()}>{actions}</div>}
      </div>
    </Panel>
  );
}

export function ItemList({ children }: { children: ReactNode }) {
  return <div className="space-y-3">{children}</div>;
}

// Barre au-dessus d'une liste : résumé à gauche, actions à droite.
export function Toolbar({ summary, children }: { summary?: ReactNode; children?: ReactNode }) {
  const th = useTh();
  return (
    <div className="flex items-center justify-between gap-3 flex-wrap">
      <div className="text-sm font-semibold" style={{ color: th.fg2 }}>{summary}</div>
      {children && <div className="flex items-center gap-2 flex-wrap">{children}</div>}
    </div>
  );
}

export function KitHeading({ children, hue, right }: { children: ReactNode; hue?: Hue; right?: ReactNode }) {
  const th = useTh();
  const h = useHue(hue);
  return (
    <div className="flex items-center justify-between gap-3 mb-3">
      <h4 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest" style={{ color: th.fg2 }}>
        <span className="w-2 h-2 rounded-full" style={{ background: h.gradient }} />{children}
      </h4>
      {right}
    </div>
  );
}

export function EmptyState({ Icon, title, hint, action, hue }: { Icon: LucideIcon; title: string; hint?: string; action?: ReactNode; hue?: Hue }) {
  const th = useTh();
  return (
    <Panel hue={hue} watermark={Icon} className="fade-up">
      <div className="px-6 py-10 flex flex-col items-center text-center gap-3">
        <IconBadge Icon={Icon} hue={hue} size="lg" />
        <div className="text-base font-bold" style={{ color: th.fg }}>{title}</div>
        {hint && <p className="text-sm max-w-md" style={{ color: th.fg3 }}>{hint}</p>}
        {action && <div className="mt-1">{action}</div>}
      </div>
    </Panel>
  );
}

export function Loading({ label = "Chargement…", hue }: { label?: string; hue?: Hue }) {
  const th = useTh();
  const h = useHue(hue);
  return (
    <div className="flex items-center gap-2 py-6 text-sm" style={{ color: th.fg3 }}>
      <Loader2 className="w-4 h-4 animate-spin" style={{ color: h.text }} />{label}
    </div>
  );
}

export function ErrorText({ children }: { children: ReactNode }) {
  return <p className="text-sm rounded-[4px] px-3.5 py-2.5" style={{ background: "rgba(239,138,116,0.12)", color: "#b4442b" }}>{children}</p>;
}

// Petite tuile de chiffre (résultats).
export function StatTile({ label, value, color, hue }: { label: string; value: ReactNode; color?: string; hue?: Hue }) {
  const th = useTh();
  return (
    <Panel hue={hue}>
      <div className="px-4 py-3">
        <div className="text-[10px] font-black uppercase tracking-widest" style={{ color: th.fg3 }}>{label}</div>
        <div className="text-2xl font-black tabular-nums mt-0.5" style={{ color: color ?? th.fg, fontFamily: "'Funnel Display',sans-serif" }}>{value}</div>
      </div>
    </Panel>
  );
}

export function BackButton({ label, onClick }: { label: string; onClick: () => void }) {
  const th = useTh();
  return (
    <button onClick={onClick} className="group inline-flex items-center gap-1.5 py-1 text-sm font-semibold transition-colors hover-fine:text-[var(--ink)]"
      style={{ color: th.fg2 }}>
      <ArrowLeft className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-0.5" /><span className="ink-link">{label}</span>
    </button>
  );
}

// En-tête de page, comme les ouvertures de section du site public : pas de
// bandeau ni de halo — la pastille de la rubrique, un grand titre serré,
// le chapô, et un filet qui ferme l'en-tête (au dégradé de la rubrique).
// morphName : même nom que la tuile d'où l'on vient, qui glisse jusqu'ici (cf. runMorph).
export function PageHero({ back, eyebrow, title, desc, Icon, hue, actions, morphName }: {
  back?: { label: string; onClick: () => void }; eyebrow?: string; title: ReactNode; desc?: ReactNode; Icon: LucideIcon; hue?: Hue; actions?: ReactNode; morphName?: string;
}) {
  const th = useTh();
  const h = useHue(hue);
  const morph = useMorph<HTMLDivElement>(morphName);
  return (
    <div className={cx("space-y-4", !morph.incoming && "fade-up")}>
      {back && <BackButton label={back.label} onClick={back.onClick} />}
      <div ref={morph.ref} data-morph={morphName} data-morph-fade="" className="relative" style={{ background: th.bg }}>
        <div className="pb-6 flex items-end justify-between gap-5 flex-wrap">
          <div className="flex items-center gap-4 sm:gap-5 min-w-0">
            <IconBadge Icon={Icon} hue={hue} size="xl" />
            <div className="min-w-0">
              {eyebrow && <div className="eyebrow mb-1.5" style={{ color: th.fg3 }}>{eyebrow}</div>}
              <h1 className="text-[1.8rem] sm:text-4xl lg:text-[2.75rem] font-black leading-[1.02] break-words" style={{ color: th.fg }}>{title}</h1>
              {desc && <p className="text-sm sm:text-base mt-2.5 max-w-2xl leading-relaxed" style={{ color: th.fg2 }}>{desc}</p>}
            </div>
          </div>
          {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
        </div>
        <div className="h-px" style={{ background: th.sep }} />
        <div className="absolute bottom-0 left-0 h-[2px] w-24" style={{ background: h.gradient }} />
      </div>
    </div>
  );
}

// En-tête de fenêtre de dialogue aux couleurs de la rubrique.
export function DialogHero({ Icon, title, desc, hue }: { Icon: LucideIcon; title: string; desc?: string; hue?: Hue }) {
  return (
    <DialogHeader>
      <div className="flex items-center gap-3 text-left">
        <IconBadge Icon={Icon} hue={hue} />
        <div className="min-w-0">
          <DialogTitle className="text-xl font-black" style={{ fontFamily: "'Funnel Display',sans-serif" }}>{title}</DialogTitle>
          {desc && <DialogDescription className="mt-1">{desc}</DialogDescription>}
        </div>
      </div>
    </DialogHeader>
  );
}

// Encadré d'un sous-élément dans un formulaire (question d'un quiz…).
export function SubCard({ children, hue }: { children: ReactNode; hue?: Hue }) {
  const th = useTh();
  const h = useHue(hue);
  return (
    <div className="relative rounded-[6px] p-4 overflow-hidden" style={{ background: th.card, border: `1px solid ${th.sep}` }}>
      <div className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ background: h.gradient }} />
      {children}
    </div>
  );
}

export function NumberBadge({ n, hue }: { n: number; hue?: Hue }) {
  const h = useHue(hue);
  return (
    <span className="w-7 h-7 rounded-full inline-flex items-center justify-center text-xs font-black shrink-0" style={{ background: h.gradient, color: "#000" }}>{n}</span>
  );
}

// Barre de progression / répartition (résultats).
export function ProgressBar({ value, hue, height = 8 }: { value: number; hue?: Hue; height?: number }) {
  const th = useTh();
  const h = useHue(hue);
  return (
    <div className="rounded-full overflow-hidden" style={{ background: th.navA, height }}>
      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: `linear-gradient(90deg,${h.c1},${h.c2})` }} />
    </div>
  );
}

// Choix segmenté (format de réponse…) aux couleurs de la rubrique.
export function HueSegmented<T extends string>({ value, onChange, options, hue }: {
  value: T; onChange: (v: T) => void; options: { value: T; label: string }[]; hue?: Hue;
}) {
  const th = useTh();
  const h = useHue(hue);
  return (
    <div className="inline-flex flex-wrap items-center gap-0.5 p-0.5 rounded-[4px]" style={{ border: `1px solid ${th.inputB}` }}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button key={o.value} type="button" onClick={() => onChange(o.value)}
            className={cx("px-3 py-1.5 rounded-[2px] text-xs font-bold transition-colors", !active && "hover-fine:text-[var(--ink)]")}
            style={active ? { background: th.ink, color: th.onInk } : { color: th.fg2 }}>
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

// Case à cocher libellée aux couleurs de la rubrique.
export function HueCheckbox({ checked, onChange, children, hue }: { checked: boolean; onChange: (v: boolean) => void; children: ReactNode; hue?: Hue }) {
  const th = useTh();
  const h = useHue(hue);
  return (
    <label className="inline-flex items-center gap-2 text-xs font-semibold cursor-pointer select-none" style={{ color: th.fg2 }}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="w-4 h-4" style={{ accentColor: th.ink }} />
      {children}
    </label>
  );
}

// ── Passage d'un quiz / questionnaire (côté élève) ────────────────────────

// Choix de réponse : contour neutre, dégradé de la rubrique une fois choisi.
export function ChoiceButton({ active, onClick, children, indicator, big }: { active: boolean; onClick: () => void; children: ReactNode; indicator?: ReactNode; big?: boolean }) {
  const th = useTh();
  const h = useHue();
  return (
    <button type="button" onClick={onClick}
      className={cx("w-full text-left rounded-[6px] transition-colors duration-200 flex items-center gap-3", big ? "px-5 py-4 text-base min-h-[64px]" : "px-4 py-3 text-sm", !active && "hover-fine:[border-color:var(--ink)]!")}
      style={active
        ? { background: th.ink, color: th.onInk, fontWeight: 700, border: `1px solid ${th.ink}` }
        : { background: th.card, border: `1px solid ${th.inputB}`, color: th.fg, fontWeight: big ? 600 : undefined }}>
      {indicator}{children}
    </button>
  );
}

// Lettre A/B/C… devant un choix de réponse.
export function LetterBadge({ letter, active }: { letter: string; active: boolean }) {
  const th = useTh();
  const h = useHue();
  return (
    <span className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-black shrink-0"
      style={active ? { background: h.gradient, color: "#000" } : { background: h.alpha(th.isDark ? 0.22 : 0.18), color: th.fg }}>
      {letter}
    </span>
  );
}

// Écran de fin (score ou remerciement).
export function CompletionPanel({ Icon, title, big, message, children }: { Icon: LucideIcon; title: string; big?: ReactNode; message: string; children?: ReactNode }) {
  const th = useTh();
  // Fin du quiz : une gerbe de particules part du résultat, sur le réseau de la marque.
  const centerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const t = window.setTimeout(() => { if (centerRef.current) burst(centerRef.current, { count: 80 }); }, 250);
    return () => window.clearTimeout(t);
  }, []);
  return (
    <Panel watermark={Icon} className="fade-up">
      <div aria-hidden className="absolute inset-0 pointer-events-none" style={{ maskImage: "radial-gradient(ellipse 70% 80% at 50% 50%,transparent 30%,#000 75%)", WebkitMaskImage: "radial-gradient(ellipse 70% 80% at 50% 50%,transparent 30%,#000 75%)", opacity: 0.7 }}>
        <NeuralField dark={th.isDark} density={2.4} band={0.95} active />
      </div>
      <div ref={centerRef} className="relative px-6 py-12 flex flex-col items-center text-center gap-3">
        <IconBadge Icon={Icon} size="lg" />
        <div className="text-lg font-black" style={{ color: th.fg, fontFamily: "'Funnel Display',sans-serif" }}>{title}</div>
        {big && <div className="text-5xl font-black tabular-nums" style={{ fontFamily: "'Funnel Display',sans-serif" }}><GT>{big}</GT></div>}
        <p className="text-sm max-w-md" style={{ color: th.fg3 }}>{message}</p>
        {children}
      </div>
    </Panel>
  );
}

