// Passage d'un quiz ou d'un questionnaire, une question à la fois, dans un
// grand encart pleine largeur : progression en haut (pastilles cliquables
// pour revenir sur une question), question en grand, réponses, puis
// Précédent / Suivant (Valider à la dernière). Utilisé par
// CompanyPositioningTestPage (positionnement + validation) et
// CompanySatisfactionTestPage (questionnaires).
import { useEffect, useRef, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, Check, Send } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { GhostButton, HueButton, ProgressBar, useHue } from "@/app/components/entreprise/EntrepriseKit";
import { NeuralField, type NeuralFieldHandle } from "@/app/components/particles/NeuralField";
import { burst, sparkLine } from "@/app/lib/particles/burst";

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

  // Particules légères : le réseau du haut s'active à chaque réponse, une
  // petite gerbe part de la réponse choisie, la progression lâche quelques
  // étincelles quand on avance.
  const field = useRef<NeuralFieldHandle>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const lastIndex = useRef(index);
  useEffect(() => {
    if (index > lastIndex.current && progressRef.current) sparkLine(progressRef.current, (index + 1) / total, { count: 14 });
    lastIndex.current = index;
  }, [index, total]);
  const onAnswerPointer = (e: ReactPointerEvent) => {
    const choice = (e.target as Element).closest("button, label");
    if (!choice) return;
    field.current?.excite(0.35);
    burst(choice, { count: 18, power: 0.45 });
  };

  return (
    <div className="relative overflow-hidden rounded-[10px] border fade-up"
      style={{ background: th.card, borderColor: th.sep }}>
      {/* Bandeau du réseau de la marque, très léger, qui s'efface vers le bas. */}
      <div aria-hidden className="absolute inset-x-0 top-0 h-40 pointer-events-none" style={{ maskImage: "linear-gradient(180deg,#000 0%,transparent 100%)", WebkitMaskImage: "linear-gradient(180deg,#000 0%,transparent 100%)", opacity: th.isDark ? 0.8 : 0.55 }}>
        <NeuralField ref={field} dark={th.isDark} density={2.2} band={0.7} center={0.35} speed={0.6} />
      </div>
      {/* Grand numéro en filigrane */}
      <div className="pointer-events-none absolute -bottom-10 right-4 sm:right-10 text-[11rem] sm:text-[15rem] font-black leading-none tabular-nums select-none"
        style={{ color: th.fg, opacity: th.isDark ? 0.06 : 0.04 }}>
        {String(index + 1).padStart(2, "0")}
      </div>

      <div className="relative min-h-[56vh] p-5 sm:p-7 lg:p-9 flex flex-col gap-6">
        {/* Progression */}
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <span className="inline-flex items-center rounded-[2px] px-2.5 py-1 text-xs font-black uppercase tracking-widest" style={{ background: h.gradient, color: "#000" }}>
              Question {index + 1} sur {total}
            </span>
            <span className="text-xs font-bold tabular-nums" style={{ color: th.fg3 }}>{answeredCount}/{total} répondue{answeredCount > 1 ? "s" : ""}</span>
          </div>
          <div ref={progressRef}><ProgressBar value={((index + 1) / total) * 100} height={6} /></div>
          {total > 1 && total <= 30 && (
            <div className="flex flex-wrap gap-1.5">
              {answered.map((done, i) => {
                const current = i === index;
                return (
                  <button key={i} type="button" onClick={() => reachable(i) && onJump(i)} disabled={!reachable(i)}
                    title={`Question ${i + 1}`} aria-label={`Aller à la question ${i + 1}`} aria-current={current ? "step" : undefined}
                    className="w-8 h-8 rounded-full text-xs font-black tabular-nums transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    style={current
                      ? { background: th.ink, color: th.onInk }
                      : done ? { background: h.gradient, color: "#000" } : { color: th.fg3, border: `1px solid ${th.inputB}` }}>
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
            <h2 className="text-2xl sm:text-3xl lg:text-[2.1rem] font-black leading-tight max-w-4xl" style={{ color: th.fg }}>
              {question}{suffix}
            </h2>
            {hint && <p className="text-sm mt-2" style={{ color: th.fg3 }}>{hint}</p>}
          </div>
          <div className="max-w-4xl" onPointerUp={onAnswerPointer}>{children}</div>
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
