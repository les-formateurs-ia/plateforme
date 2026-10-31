import { ArrowRight, Check, Lock } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { ShimBtn } from "@/app/components/common/Buttons";
import { NeuralField } from "@/app/components/particles/NeuralField";
import type { Journey, JourneyAction, JourneyStep } from "@/app/lib/documents/journey";

// Briques visuelles du tableau de bord d'un dossier de formation : jauge de
// progression, pastilles d'étape et boutons d'action.

export const GREEN = "#1BAF7A";

function Ring({ value }: { value: number }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 120 120" className="w-32 h-32 sm:w-36 sm:h-36 -rotate-90">
      <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="10" />
      <circle cx="60" cy="60" r={r} fill="none" stroke="url(#journey-grad)" strokeWidth="10" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c * (1 - value / 100)} style={{ transition: "stroke-dashoffset 900ms cubic-bezier(.2,.8,.2,1)" }} />
      <defs>
        <linearGradient id="journey-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#2A78D6" /><stop offset="100%" stopColor={GREEN} />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function ActionButtons({ actions, onAction, busy, primary }: { actions: JourneyAction[]; onAction: (a: JourneyAction) => void; busy: boolean; primary?: boolean }) {
  const th = useTh();
  if (!actions.length) return null;
  return (
    <div className="flex gap-2 flex-wrap">
      {actions.map((a, i) => primary && i === 0 ? (
        <ShimBtn key={a.label} sm onClick={() => onAction(a)} disabled={busy}>{a.label}<ArrowRight className="w-4 h-4" /></ShimBtn>
      ) : (
        <button key={a.label} type="button" disabled={busy} onClick={() => onAction(a)}
          className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-[2px] hover:opacity-70 disabled:opacity-40"
          style={{ border: `1px solid ${th.sep}`, color: th.fg }}>
          {a.label}<ArrowRight className="w-3.5 h-3.5" />
        </button>
      ))}
    </div>
  );
}

export function StepIcon({ step, index }: { step: JourneyStep; index: number }) {
  const th = useTh();
  if (step.status === "done") {
    return <span className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-white" style={{ background: GREEN }}><Check className="w-4 h-4" /></span>;
  }
  if (step.status === "locked") {
    return <span className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: th.navA, color: th.fg3 }}><Lock className="w-3.5 h-3.5" /></span>;
  }
  return (
    <span className="relative w-9 h-9 shrink-0">
      {step.status === "current" && <span className="absolute inset-0 rounded-full animate-ping" style={{ background: th.ink, opacity: 0.18 }} />}
      <span className="relative w-9 h-9 rounded-full flex items-center justify-center text-sm font-black tabular-nums" style={{ background: th.ink, color: th.onInk }}>{index + 1}</span>
    </span>
  );
}

// Où en est le dossier : jauge, niveau, une barre par étape, frise des dates.
export function JourneyHero({ journey, dateDebut, dateFin, onStep }: {
  journey: Journey; dateDebut: string; dateFin: string; onStep: (id: string) => void;
}) {
  const th = useTh();
  const court = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  return (
    <section className="relative overflow-hidden rounded-[10px] bg-black text-white" style={{ border: th.isDark ? `1px solid ${th.sep}` : undefined }}>
      <NeuralField dark density={3} band={0.9} />
      <div aria-hidden className="absolute inset-0" style={{ background: "linear-gradient(90deg,rgba(0,0,0,0.92) 0%,rgba(0,0,0,0.65) 55%,rgba(0,0,0,0.2) 100%)" }} />
      <div className="relative flex items-center gap-6 sm:gap-10 p-6 sm:p-8 flex-wrap">
        <div className="relative">
          <Ring value={journey.progress} />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[2rem] sm:text-[2.3rem] font-extrabold leading-none tabular-nums">{journey.progress}<span className="text-base text-white/60">%</span></span>
            <span className="text-[11px] text-white/60 mt-1">{journey.done}/{journey.steps.length} étapes</span>
          </div>
        </div>
        <div className="flex-1 min-w-[220px]">
          <p className="eyebrow text-white/55">Niveau du dossier</p>
          <p className="text-[1.6rem] sm:text-[2rem] font-extrabold leading-tight mt-1">{journey.level.emoji} {journey.level.label}</p>
          <div className="flex gap-1.5 mt-4">
            {journey.steps.map((s) => (
              <button key={s.id} type="button" title={s.titre} onClick={() => onStep(s.id)} className="h-2 flex-1 rounded-full transition-transform hover:scale-y-150"
                style={{ background: s.status === "done" ? GREEN : s.status === "current" ? "rgba(255,255,255,0.75)" : "rgba(255,255,255,0.15)" }} />
            ))}
          </div>
          <div className="mt-5">
            <div className="flex justify-between text-xs text-white/60">
              <span>{court(dateDebut)}</span>
              <span className="font-semibold text-white/85">{journey.timeline.label}</span>
              <span>{court(dateFin)}</span>
            </div>
            <div className="mt-1.5 h-1 rounded-full bg-white/15 overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${journey.timeline.ratio * 100}%`, background: "rgba(255,255,255,0.75)" }} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
