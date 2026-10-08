// Passage d'un quiz ou d'un questionnaire, une question à la fois, dans un
// grand encart pleine largeur : progression en haut (pastilles cliquables
// pour revenir sur une question), question en grand, réponses, puis
// Précédent / Suivant (Valider à la dernière). Utilisé par
// CompanyPositioningTestPage (positionnement + validation) et
// CompanySatisfactionTestPage (questionnaires).
import type { ReactNode } from "react";
import { ArrowLeft, ArrowRight, Check, Send } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { GhostButton, HueButton, ProgressBar, useHue } from "@/app/components/entreprise/EntrepriseKit";

export function QuestionStepper({ index, total, answered, onJump, question, suffix, hint, canNext, submitting, submitLabel, onSubmit, children }: {
  index: number; total: number;
  // answered[i] : la question i a une réponse (pastille pleine, et on peut y revenir).
  answered: boolean[]; onJump: (i: number) => void;
  question: ReactNode; suffix?: ReactNode; hint?: ReactNode;
  // Suivant / Valider actif : la question courante est répondue (ou facultative).
  canNext: boolean; submitting: boolean; submitLabel: string; onSubmit: () => void;
  children: ReactNode;
}) {
  const th = useTh();
  const h = useHue();
  const isLast = index === total - 1;
  const answeredCount = answered.filter(Boolean).length;
  // On peut sauter vers une question déjà répondue, ou vers la première non
  // répondue — jamais au-delà (évite de laisser des trous en chemin).
  const firstOpen = answered.findIndex((a) => !a);
  const reachable = (i: number) => answered[i] || i === (firstOpen === -1 ? total - 1 : firstOpen) || i <= index;

  return (
    <div className="relative overflow-hidden rounded-[10px] border fade-up"
      style={{ background: th.card, borderColor: th.sep }}>
      {/* Grand numéro en filigrane */}
      <div className="pointer-events-none absolute -bottom-10 right-4 sm:right-10 text-[11rem] sm:text-[15rem] font-black leading-none tabular-nums select-none"
        style={{ color: th.fg, opacity: th.isDark ? 0.06 : 0.04 }}>
        {String(index + 1).padStart(2, "0")}
      </div>

      <div className="relative min-h-[56vh] p-5 sm:p-7 lg:p-9 flex flex-col gap-6">
        {/* Progression */}
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <span className="inline-flex items-center rounded-[2px] px-3 py-1 text-xs font-black uppercase tracking-widest" style={{ background: h.gradient, color: "#fff" }}>
              Question {index + 1} sur {total}
            </span>
            <span className="text-xs font-bold tabular-nums" style={{ color: th.fg3 }}>{answeredCount}/{total} répondue{answeredCount > 1 ? "s" : ""}</span>
          </div>
          <ProgressBar value={((index + 1) / total) * 100} height={8} />
          {total > 1 && total <= 30 && (
            <div className="flex flex-wrap gap-1.5">
              {answered.map((done, i) => {
                const current = i === index;
                return (
                  <button key={i} type="button" onClick={() => reachable(i) && onJump(i)} disabled={!reachable(i)}
                    title={`Question ${i + 1}`} aria-label={`Aller à la question ${i + 1}`} aria-current={current ? "step" : undefined}
                    className="w-8 h-8 rounded-lg text-xs font-black tabular-nums transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    style={current
                      ? { background: h.gradient, color: "#fff", boxShadow: `0 4px 12px ${h.alpha(0.4)}` }
                      : done ? { background: h.alpha(th.isDark ? 0.2 : 0.14), color: h.text } : { background: th.inputBg, color: th.fg3, border: `1px solid ${th.inputB}` }}>
                    {done && !current ? <Check className="w-3.5 h-3.5 mx-auto" /> : i + 1}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Question courante (key : rejoue l'animation à chaque question) */}
        <div key={index} className="fade-up flex-1 flex flex-col gap-6">
          <div>
            <h2 className="text-2xl sm:text-3xl lg:text-[2.1rem] font-black leading-tight max-w-4xl" style={{ color: th.fg, fontFamily: "'Funnel Display',sans-serif" }}>
              {question}{suffix}
            </h2>
            {hint && <p className="text-sm mt-2" style={{ color: th.fg3 }}>{hint}</p>}
          </div>
          <div className="max-w-4xl">{children}</div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between gap-3 flex-wrap pt-4" style={{ borderTop: `1px solid ${th.sep}` }}>
          <GhostButton Icon={ArrowLeft} onClick={() => onJump(index - 1)} disabled={index === 0}>Précédent</GhostButton>
          {isLast ? (
            <HueButton Icon={Send} onClick={onSubmit} disabled={!canNext || submitting}>{submitting ? "Envoi..." : submitLabel}</HueButton>
          ) : (
            <HueButton onClick={() => onJump(index + 1)} disabled={!canNext}>
              Suivant<ArrowRight className="w-4 h-4" />
            </HueButton>
          )}
        </div>
      </div>
    </div>
  );
}
