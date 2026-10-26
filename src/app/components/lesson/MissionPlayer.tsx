// Passage d'une mission de fin de module (leçon "Mission", cf. data/missions),
// dans l'esprit du test de positionnement (QuestionStepper) : un grand encart,
// une étape à la fois — introduction, contexte de chaque exercice, une
// question par écran, grille de notation, puis récapitulatif et validation.
// Le plan de la mission reste visible à gauche pour circuler librement.
//
// Enregistrement : bouton toujours accessible (et Ctrl/Cmd+S), plus un
// enregistrement silencieux à chaque changement d'étape s'il y a des
// modifications. La validation n'est proposée qu'à la dernière étape.
import { Fragment, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { ArrowLeft, ArrowRight, Check, CircleAlert, CloudUpload, FileText, ImagePlus, Loader2, Plus, Save, Send, Trash2, type LucideIcon } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { DialogHero, GhostButton, HueButton, HueProvider, IconAction, ProgressBar, useHue } from "@/app/components/entreprise/EntrepriseKit";
import { Dialog, DialogContent, DialogFooter } from "@/app/components/ui/dialog";
import { NeuralField } from "@/app/components/particles/NeuralField";
import { sparkLine } from "@/app/lib/particles/burst";
import { cx } from "@/app/lib/cx";
import { missionQuestions } from "@/app/data/missions";
import type { MissionAnswer, MissionAnswers, MissionBlock, MissionDefinition, MissionField, MissionQuestion } from "@/app/data/missions/types";
import { emptyAnswer, isAnswered, readMissionAnswers } from "@/app/lib/missionAnswers";
import { buildMissionDocument } from "@/app/components/lesson/MissionPrintDocument";

type Step =
  | { kind: "intro" }
  | { kind: "context"; ex: number }
  | { kind: "question"; ex: number; q: number }
  | { kind: "grading" }
  | { kind: "review" };

function buildSteps(mission: MissionDefinition): Step[] {
  const steps: Step[] = [{ kind: "intro" }];
  mission.exercises.forEach((e, ex) => {
    if (e.context.length) steps.push({ kind: "context", ex });
    e.questions.forEach((_, q) => steps.push({ kind: "question", ex, q }));
  });
  steps.push({ kind: "grading" }, { kind: "review" });
  return steps;
}

export function MissionPlayer({ mission, savedHtml, studentName, readOnly, onSave, onSubmit }: {
  mission: MissionDefinition;
  // Dernier document enregistré (brouillon ou mission validée), d'où l'on relit les réponses.
  savedHtml: string | null;
  // Nom affiché en tête du document imprimable (PDF).
  studentName: string;
  readOnly: boolean;
  // Reçoivent le document imprimable à enregistrer ; onSave renvoie false en
  // cas d'échec (l'appelant affiche l'erreur).
  onSave: (html: string, opts: { silent: boolean }) => Promise<boolean>;
  onSubmit: (html: string) => Promise<void>;
}) {
  const th = useTh();
  const steps = useMemo(() => buildSteps(mission), [mission]);
  const questions = useMemo(() => missionQuestions(mission), [mission]);
  const [answers, setAnswers] = useState<MissionAnswers>(() => readMissionAnswers(mission, savedHtml));
  const [index, setIndex] = useState(0);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const answersRef = useRef(answers);
  answersRef.current = answers;
  const versionRef = useRef(0);
  const savingRef = useRef(false);

  const setAnswer = useCallback((id: string, value: MissionAnswer) => {
    versionRef.current += 1;
    setDirty(true);
    setAnswers((prev) => ({ ...prev, [id]: value }));
  }, []);

  const save = useCallback(async (silent: boolean) => {
    if (readOnly || savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    const version = versionRef.current;
    try {
      const ok = await onSave(buildMissionDocument(mission, answersRef.current, studentName), { silent });
      if (ok) {
        setSavedAt(new Date());
        if (versionRef.current === version) setDirty(false);
      }
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }, [readOnly, onSave, mission, studentName]);

  // Ctrl/Cmd+S : enregistre au lieu d'ouvrir la boîte "Enregistrer la page".
  useEffect(() => {
    if (readOnly) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") { e.preventDefault(); void save(false); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [readOnly, save]);

  // Fermeture de l'onglet avec des modifications non enregistrées : alerte du navigateur.
  useEffect(() => {
    if (!dirty || readOnly) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty, readOnly]);

  const cardRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const goTo = (i: number) => {
    if (i < 0 || i >= steps.length || i === index) return;
    if (dirty && !readOnly) void save(true);
    if (i > index && progressRef.current) sparkLine(progressRef.current, (i + 1) / steps.length, { count: 14 });
    setIndex(i);
    const card = cardRef.current;
    if (card && card.getBoundingClientRect().top < 0) card.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // En cas de succès, l'appelant quitte la page (écran "Mission envoyée").
  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await onSubmit(buildMissionDocument(mission, answersRef.current, studentName));
    } finally {
      setSubmitting(false);
      setConfirmOpen(false);
    }
  };

  const answeredCount = questions.filter((q) => isAnswered(answers[q.field.id])).length;
  const missing = questions.length - answeredCount;
  const step = steps[index];
  const stepDone = (s: Step) => s.kind === "question" && isAnswered(answers[mission.exercises[s.ex].questions[s.q].field.id]);

  return (
    <HueProvider hue="violet">
      <style>{PROSE_CSS}</style>
      <div className="grid lg:grid-cols-[250px_minmax(0,1fr)] gap-6 items-start pb-6" style={{ color: th.fg2 }}>
        <MissionOutline mission={mission} steps={steps} index={index} done={stepDone} onJump={goTo} />

        <div ref={cardRef} className="relative overflow-hidden rounded-[10px] border fade-up scroll-mt-4 min-w-0" style={{ background: th.card, borderColor: th.sep }}>
          <div aria-hidden className="absolute inset-x-0 top-0 h-40 pointer-events-none" style={{ maskImage: "linear-gradient(180deg,#000 0%,transparent 100%)", WebkitMaskImage: "linear-gradient(180deg,#000 0%,transparent 100%)", opacity: th.isDark ? 0.8 : 0.55 }}>
            <NeuralField dark={th.isDark} density={2.2} band={0.7} center={0.35} speed={0.6} />
          </div>
          {step.kind === "question" && (
            <div className="pointer-events-none absolute -bottom-10 right-4 sm:right-10 text-[11rem] sm:text-[15rem] font-black leading-none tabular-nums select-none"
              style={{ color: th.fg, opacity: th.isDark ? 0.06 : 0.04 }}>
              {mission.exercises[step.ex].questions[step.q].num.padStart(2, "0")}
            </div>
          )}

          <div className="relative min-h-[60vh] p-5 sm:p-7 lg:p-9 flex flex-col gap-6">
            {/* Progression + enregistrement */}
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <StepChip mission={mission} step={step} />
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold tabular-nums" style={{ color: th.fg3 }}>{answeredCount}/{questions.length} réponse{answeredCount > 1 ? "s" : ""}</span>
                  {!readOnly && <SaveStatus dirty={dirty} saving={saving} savedAt={savedAt} onSave={() => void save(false)} />}
                </div>
              </div>
              <div ref={progressRef}><ProgressBar value={((index + 1) / steps.length) * 100} height={6} /></div>
            </div>

            <div key={index} className="fade-up flex-1 flex flex-col gap-6 min-w-0">
              {step.kind === "intro" && <IntroStep mission={mission} readOnly={readOnly} />}
              {step.kind === "context" && (
                <>
                  <StepTitle eyebrow={mission.exercises[step.ex].eyebrow} title={mission.exercises[step.ex].title} />
                  {mission.exercises[step.ex].context.map((b, i) => <BlockView key={i} block={b} />)}
                </>
              )}
              {step.kind === "question" && (
                <QuestionStep mission={mission} ex={step.ex} question={mission.exercises[step.ex].questions[step.q]}
                  value={answers[mission.exercises[step.ex].questions[step.q].field.id]} readOnly={readOnly} onChange={setAnswer} />
              )}
              {step.kind === "grading" && (
                <>
                  <StepTitle eyebrow={mission.grading.eyebrow} title={mission.grading.title} />
                  <div className="mission-prose max-w-4xl">{mission.grading.body}</div>
                </>
              )}
              {step.kind === "review" && <ReviewStep mission={mission} steps={steps} answers={answers} readOnly={readOnly} onJump={goTo} />}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between gap-3 flex-wrap pt-4" style={{ borderTop: `1px solid ${th.sep}` }}>
              <GhostButton Icon={ArrowLeft} onClick={() => goTo(index - 1)} disabled={index === 0}>Précédent</GhostButton>
              {step.kind === "review" ? (
                !readOnly && <HueButton Icon={Send} onClick={() => setConfirmOpen(true)} disabled={submitting || saving}>Valider ma mission</HueButton>
              ) : (
                <HueButton onClick={() => goTo(index + 1)}>
                  {steps[index + 1]?.kind === "review" ? "Récapitulatif" : "Suivant"}<ArrowRight className="w-4 h-4" />
                </HueButton>
              )}
            </div>
          </div>
        </div>
      </div>

      <Dialog open={confirmOpen} onOpenChange={(v) => { if (!submitting) setConfirmOpen(v); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHero Icon={Send} hue="violet" title="Valider ma mission ?"
            desc="Ta mission sera transformée en PDF et envoyée à ton formateur. Tu ne pourras plus la modifier ensuite." />
          {missing > 0 && (
            <p className="text-sm rounded-[4px] px-3.5 py-2.5 flex gap-2" style={{ background: "rgba(238,184,90,0.14)", color: th.warn }}>
              <CircleAlert className="w-4 h-4 shrink-0 mt-0.5" />
              {missing} question{missing > 1 ? "s restent" : " reste"} sans réponse.
            </p>
          )}
          <DialogFooter>
            <GhostButton onClick={() => setConfirmOpen(false)} disabled={submitting}>Revenir à ma mission</GhostButton>
            <HueButton Icon={Send} onClick={() => void handleSubmit()} disabled={submitting}>
              {submitting ? "Envoi en cours…" : "Valider et envoyer"}
            </HueButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </HueProvider>
  );
}

// ── Plan de la mission ─────────────────────────────────────────────────────

function stepLabel(mission: MissionDefinition, s: Step): string {
  if (s.kind === "intro") return "Avant de commencer";
  if (s.kind === "context") return "Le cas et les consignes";
  if (s.kind === "question") return `Question ${mission.exercises[s.ex].questions[s.q].num}`;
  if (s.kind === "grading") return mission.grading.eyebrow;
  return "Récapitulatif et validation";
}

function MissionOutline({ mission, steps, index, done, onJump }: {
  mission: MissionDefinition; steps: Step[]; index: number; done: (s: Step) => boolean; onJump: (i: number) => void;
}) {
  const th = useTh();
  const h = useHue();
  // Groupes : introduction, un par exercice, puis la remise.
  const groups: { title: string; items: { step: Step; i: number }[] }[] = [];
  steps.forEach((step, i) => {
    const title = step.kind === "context" || step.kind === "question" ? mission.exercises[step.ex].eyebrow : step.kind === "intro" ? "Introduction" : "Remise";
    const last = groups[groups.length - 1];
    if (last?.title === title) last.items.push({ step, i });
    else groups.push({ title, items: [{ step, i }] });
  });
  const partOf = (s: Step | undefined) => (s?.kind === "question" ? mission.exercises[s.ex].questions[s.q].part ?? "" : "");
  return (
    <nav aria-label="Étapes de la mission" className="lg:sticky lg:top-0 flex lg:flex-col gap-4 overflow-x-auto lg:overflow-visible -mx-1 px-1 pb-1">
      {groups.map((g) => (
        <div key={g.title} className="shrink-0 lg:shrink">
          <div className="text-[10px] font-black uppercase tracking-widest mb-1.5 flex items-center gap-2" style={{ color: th.fg3 }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: h.gradient }} />{g.title}
          </div>
          <div className="flex lg:flex-col gap-1">
            {g.items.map(({ step, i }, k) => {
              const current = i === index;
              // Intitulé de la partie (I, II…) au-dessus de sa première question.
              const part = partOf(step);
              const showPart = !!part && part !== partOf(g.items[k - 1]?.step);
              return (
                <Fragment key={i}>
                  {showPart && <div className="hidden lg:block text-[11px] leading-snug font-semibold pl-2.5 pt-1.5" style={{ color: th.fg3 }}>{part}</div>}
                  <button type="button" onClick={() => onJump(i)} aria-current={current ? "step" : undefined}
                    className={cx("text-left rounded-[4px] px-2.5 py-1.5 text-[13px] leading-snug flex items-center gap-2 whitespace-nowrap lg:whitespace-normal transition-colors", !current && "hover-fine:[background:var(--nav-hover)]")}
                    style={{ ["--nav-hover" as string]: th.navA, ...(current ? { background: th.ink, color: th.onInk, fontWeight: 700 } : { color: th.fg2 }) }}>
                    <span className="w-4 h-4 rounded-full shrink-0 flex items-center justify-center"
                      style={done(step) ? { background: h.gradient, color: "#000" } : { border: `1px solid ${current ? th.onInk : th.inputB}` }}>
                      {done(step) && <Check className="w-2.5 h-2.5" strokeWidth={3} />}
                    </span>
                    <span className="min-w-0">{stepLabel(mission, step)}</span>
                  </button>
                </Fragment>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

function StepChip({ mission, step }: { mission: MissionDefinition; step: Step }) {
  const h = useHue();
  let label = stepLabel(mission, step);
  if (step.kind === "context") label = `${mission.exercises[step.ex].eyebrow} · Contexte`;
  if (step.kind === "question") {
    // La numérotation repart à 1 dans chaque partie (I, II…) d'un exercice.
    const e = mission.exercises[step.ex];
    const q = e.questions[step.q];
    label = `${e.eyebrow} · Question ${q.num} sur ${e.questions.filter((o) => o.part === q.part).length}`;
  }
  return (
    <span className="inline-flex items-center rounded-[2px] px-2.5 py-1 text-xs font-black uppercase tracking-widest" style={{ background: h.gradient, color: "#000" }}>
      {label}
    </span>
  );
}

function SaveStatus({ dirty, saving, savedAt, onSave }: { dirty: boolean; saving: boolean; savedAt: Date | null; onSave: () => void }) {
  const th = useTh();
  const status = saving ? "Enregistrement…"
    : dirty ? "Modifications non enregistrées"
    : savedAt ? `Enregistré à ${savedAt.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}` : "";
  return (
    <div className="flex items-center gap-2.5">
      {status && <span className="hidden sm:inline text-xs" style={{ color: dirty && !saving ? th.warn : th.fg3 }}>{status}</span>}
      <GhostButton sm Icon={Save} onClick={onSave} disabled={saving || !dirty}>Enregistrer</GhostButton>
    </div>
  );
}

// ── Étapes ─────────────────────────────────────────────────────────────────

function StepTitle({ eyebrow, title }: { eyebrow?: string; title: string }) {
  const th = useTh();
  return (
    <div>
      {eyebrow && <div className="eyebrow mb-2" style={{ color: th.fg3 }}>{eyebrow}</div>}
      <h2 className="text-2xl sm:text-3xl lg:text-[2.1rem] font-black leading-tight max-w-4xl" style={{ color: th.fg }}>{title}</h2>
    </div>
  );
}

function IntroStep({ mission, readOnly }: { mission: MissionDefinition; readOnly: boolean }) {
  const th = useTh();
  return (
    <>
      <StepTitle title={mission.title} />
      <div className="mission-prose text-base sm:text-[17px] max-w-4xl">{mission.intro}</div>
      {!readOnly && (
        <div className="grid sm:grid-cols-3 gap-3 max-w-4xl">
          <HowTo Icon={FileText} title="Une étape à la fois" text="Le cas, puis chaque question sur son propre écran. Le plan à gauche te permet de circuler librement." />
          <HowTo Icon={CloudUpload} title="Enregistre quand tu veux" text="Le bouton « Enregistrer » est toujours en haut. Ton travail est aussi enregistré à chaque changement d'étape." />
          <HowTo Icon={Send} title="Valide à la fin" text="Au récapitulatif, ta mission est envoyée en PDF à ton formateur. Elle n'est plus modifiable ensuite." />
        </div>
      )}
      {mission.introBlocks.map((b, i) => <BlockView key={i} block={b} />)}
      {mission.footnote && <p className="text-xs" style={{ color: th.fg3 }}>{mission.footnote}</p>}
    </>
  );
}

function HowTo({ Icon, title, text }: { Icon: LucideIcon; title: string; text: string }) {
  const th = useTh();
  const h = useHue();
  return (
    <div className="rounded-[6px] p-4 space-y-2" style={{ border: `1px solid ${th.sep}`, background: th.card }}>
      <span className="w-8 h-8 rounded-full inline-flex items-center justify-center" style={{ background: h.gradient, color: "#000" }}><Icon className="w-4 h-4" /></span>
      <div className="text-sm font-bold" style={{ color: th.fg }}>{title}</div>
      <p className="text-[13px] leading-relaxed" style={{ color: th.fg3 }}>{text}</p>
    </div>
  );
}

function QuestionStep({ mission, ex, question, value, readOnly, onChange }: {
  mission: MissionDefinition; ex: number; question: MissionQuestion; value: MissionAnswer | undefined; readOnly: boolean;
  onChange: (id: string, v: MissionAnswer) => void;
}) {
  const th = useTh();
  const e = mission.exercises[ex];
  // Rappel du cas (situation et textes de travail) sans quitter la question.
  const reminder = e.context.filter((b) => b.variant === "case" || b.variant === "prompt");
  return (
    <>
      <div className="space-y-3 max-w-4xl">
        <div className="eyebrow" style={{ color: th.fg3 }}>{question.part || e.title}</div>
        <div className="mission-prose mission-question" style={{ color: th.fg }}>{question.prompt}</div>
      </div>
      {reminder.length > 0 && (
        <details className="group rounded-[6px] max-w-4xl" style={{ border: `1px solid ${th.sep}` }}>
          <summary className="cursor-pointer select-none list-none px-4 py-2.5 text-sm font-semibold flex items-center justify-between gap-2" style={{ color: th.fg2 }}>
            Revoir le cas de l'{e.eyebrow.toLowerCase()}
            <ArrowRight className="w-4 h-4 transition-transform group-open:rotate-90" />
          </summary>
          <div className="px-4 pb-4 space-y-3">{reminder.map((b, i) => <BlockView key={i} block={b} />)}</div>
        </details>
      )}
      <FieldInput field={question.field} value={value ?? emptyAnswer(question.field)} readOnly={readOnly} onChange={(v) => onChange(question.field.id, v)} />
    </>
  );
}

function ReviewStep({ mission, steps, answers, readOnly, onJump }: {
  mission: MissionDefinition; steps: Step[]; answers: MissionAnswers; readOnly: boolean; onJump: (i: number) => void;
}) {
  const th = useTh();
  const h = useHue();
  const stepIndexOf = (ex: number, q: number) => steps.findIndex((s) => s.kind === "question" && s.ex === ex && s.q === q);
  const missing = missionQuestions(mission).filter((q) => !isAnswered(answers[q.field.id])).length;
  return (
    <div className="space-y-6 max-w-4xl">
      <StepTitle eyebrow="Remise" title={readOnly ? "Ta mission a été envoyée" : "Récapitulatif avant validation"} />
      {readOnly ? (
        <div className="rounded-[6px] p-4 text-sm font-semibold" style={{ background: "rgba(106,222,177,0.12)", color: th.success }}>
          Mission envoyée — en attente de ton formateur. Tes réponses restent consultables ci-dessous.
        </div>
      ) : (
        <p className="text-base leading-relaxed" style={{ color: th.fg2 }}>
          Vérifie tes réponses avant de valider. À la validation, ta mission est transformée en PDF et envoyée à ton formateur : tu ne pourras plus la modifier.
          {missing > 0 ? ` Il reste ${missing} question${missing > 1 ? "s" : ""} sans réponse.` : " Toutes les questions ont une réponse."}
        </p>
      )}
      {mission.exercises.map((e, ex) => (
        <div key={ex} className="space-y-2">
          <div className="text-xs font-black uppercase tracking-widest" style={{ color: th.fg3 }}>{e.eyebrow} — <span className="normal-case tracking-normal font-semibold">{e.title}</span></div>
          <div className="rounded-[6px] overflow-hidden" style={{ border: `1px solid ${th.sep}` }}>
            {e.questions.map((q, qi) => {
              const ok = isAnswered(answers[q.field.id]);
              return (
                <button key={q.field.id} type="button" onClick={() => onJump(stepIndexOf(ex, qi))}
                  className="w-full text-left px-4 py-3 flex items-center gap-3 text-sm transition-colors hover-fine:[background:var(--row-hover)]"
                  style={{ ["--row-hover" as string]: th.navA, borderTop: qi ? `1px solid ${th.sep}` : undefined }}>
                  <span className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-[11px] font-black"
                    style={ok ? { background: h.gradient, color: "#000" } : { border: `1px solid ${th.warn}`, color: th.warn }}>
                    {ok ? <Check className="w-3.5 h-3.5" strokeWidth={3} /> : "!"}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="font-semibold" style={{ color: th.fg }}>Question {q.num}</span>
                    {q.part && <span style={{ color: th.fg3 }}> · {q.part}</span>}
                    <span className="block text-xs mt-0.5" style={{ color: ok ? th.fg3 : th.warn }}>{ok ? answerSummary(q.field, answers[q.field.id]) : "Pas encore de réponse"}</span>
                  </span>
                  <ArrowRight className="w-4 h-4 shrink-0" style={{ color: th.fg3 }} />
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function answerSummary(field: MissionField, value: MissionAnswer | undefined): string {
  if (!value) return "";
  if (field.type === "image") return "Visuel importé";
  if (field.type === "table") {
    const rows = (value as string[][]).filter((r) => r.some((c) => c.trim())).length;
    return `${rows} ligne${rows > 1 ? "s" : ""} remplie${rows > 1 ? "s" : ""}`;
  }
  const words = (value as string).trim().split(/\s+/).filter(Boolean).length;
  return `${words} mot${words > 1 ? "s" : ""}`;
}

// ── Encadrés de contenu ────────────────────────────────────────────────────

function BlockView({ block }: { block: MissionBlock }) {
  const th = useTh();
  const h = useHue();
  const isCase = block.variant === "case";
  const bar = block.variant === "instr" ? th.warn : block.variant === "note" ? th.sep : h.gradient;
  return (
    <div className="relative rounded-[6px] overflow-hidden max-w-4xl" style={{ background: isCase ? th.navA : th.card, border: `1px solid ${th.sep}` }}>
      {!isCase && <div className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ background: bar }} />}
      <div className={cx("px-5 py-4", !isCase && "pl-6")}>
        {block.label && (
          <div className="text-[11px] font-black uppercase tracking-widest mb-2" style={{ color: block.variant === "instr" ? th.warn : th.fg3 }}>{block.label}</div>
        )}
        <div className={cx("mission-prose", block.variant === "prompt" && "mission-quote")}>{block.body}</div>
      </div>
    </div>
  );
}

// ── Champs de réponse ──────────────────────────────────────────────────────

function FieldInput({ field, value, readOnly, onChange }: { field: MissionField; value: MissionAnswer; readOnly: boolean; onChange: (v: MissionAnswer) => void }) {
  if (field.type === "text") return <div className="max-w-4xl"><TextBox value={value as string} placeholder={field.placeholder} readOnly={readOnly} onChange={onChange} single /></div>;
  if (field.type === "textarea") return <div className="max-w-4xl"><TextBox value={value as string} placeholder={field.placeholder} readOnly={readOnly} onChange={onChange} minRows={field.tall ? 10 : 5} /></div>;
  if (field.type === "image") return <ImageField hint={field.hint} value={value as string} readOnly={readOnly} onChange={onChange} />;
  return <TableField columns={field.columns} rows={value as string[][]} readOnly={readOnly} onChange={onChange} />;
}

// Hauteur ajustée au texte : pas de barre de défilement interne.
function useAutoHeight(value: string) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const ta = ref.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${ta.scrollHeight + 2}px`;
  }, [value]);
  return ref;
}

function TextBox({ value, placeholder, readOnly, onChange, single, minRows = 3 }: {
  value: string; placeholder?: string; readOnly: boolean; onChange: (v: string) => void; single?: boolean; minRows?: number;
}) {
  const th = useTh();
  const ref = useAutoHeight(value);
  const style = { background: th.inputBg, border: `1px solid ${th.inputB}`, color: th.fg, ["--ring-c" as string]: th.ink };
  const cls = "w-full rounded-[6px] px-4 py-3 text-[15px] leading-relaxed outline-none transition-shadow focus:shadow-[0_0_0_2px_var(--ring-c)] disabled:opacity-80";
  return single ? (
    <input type="text" value={value} placeholder={placeholder} disabled={readOnly} onChange={(e) => onChange(e.target.value)} className={cls} style={style} />
  ) : (
    <textarea ref={ref} value={value} placeholder={placeholder} disabled={readOnly} rows={minRows} onChange={(e) => onChange(e.target.value)}
      className={cx(cls, "resize-none overflow-hidden")} style={style} />
  );
}

function CellInput({ value, label, readOnly, onChange }: { value: string; label: string; readOnly: boolean; onChange: (v: string) => void }) {
  const th = useTh();
  const ref = useAutoHeight(value);
  return (
    <textarea ref={ref} value={value} aria-label={label} disabled={readOnly} rows={3} onChange={(e) => onChange(e.target.value)}
      className="block w-full resize-none overflow-hidden bg-transparent px-3 py-2.5 text-sm leading-relaxed outline-none focus:bg-[var(--cell-focus)] disabled:opacity-90"
      style={{ color: th.fg, ["--cell-focus" as string]: th.navA }} />
  );
}

// Tableau à remplir, présenté comme dans la mission d'origine : une colonne
// par rubrique, une ligne par élément analysé, lignes ajoutables/supprimables.
// Défilement horizontal sur les écrans étroits plutôt que des colonnes illisibles.
function TableField({ columns, rows, readOnly, onChange }: { columns: string[]; rows: string[][]; readOnly: boolean; onChange: (v: string[][]) => void }) {
  const th = useTh();
  const setCell = (r: number, c: number, v: string) => onChange(rows.map((row, ri) => (ri === r ? row.map((cell, ci) => (ci === c ? v : cell)) : row)));
  const border = `1px solid ${th.sep}`;
  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-[6px]" style={{ border }}>
        <table className="w-full border-collapse" style={{ minWidth: columns.length * 160 + (readOnly ? 0 : 48) }}>
          <thead>
            <tr style={{ background: th.navA }}>
              {columns.map((c) => (
                <th key={c} className="text-left align-bottom px-3 py-2.5 text-[11px] font-black uppercase tracking-wider leading-snug" style={{ color: th.fg2, borderBottom: border, borderRight: border }}>{c}</th>
              ))}
              {!readOnly && <th className="w-12" style={{ borderBottom: border }} aria-label="Actions" />}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, r) => (
              <tr key={r} style={{ borderTop: r ? border : undefined }}>
                {columns.map((c, ci) => (
                  <td key={c} className="align-top p-0" style={{ borderRight: border }}>
                    <CellInput value={row[ci] ?? ""} label={`${c} — ligne ${r + 1}`} readOnly={readOnly} onChange={(v) => setCell(r, ci, v)} />
                  </td>
                ))}
                {!readOnly && (
                  <td className="align-middle text-center px-1.5">
                    <IconAction Icon={Trash2} tone="danger" title={`Supprimer la ligne ${r + 1}`} onClick={() => onChange(rows.filter((_, ri) => ri !== r))} />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!readOnly && <GhostButton sm Icon={Plus} onClick={() => onChange([...rows, columns.map(() => "")])}>Ajouter une ligne</GhostButton>}
    </div>
  );
}

// Visuel importé : gardé en data URL dans les réponses (comme l'ancienne page),
// réduit au besoin pour ne pas alourdir l'enregistrement et le PDF.
const MAX_IMAGE_SIDE = 2000;
async function readImage(file: File): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
  if (file.size < 1.5 * 1024 * 1024) return dataUrl;
  const img = new Image();
  img.src = dataUrl;
  await img.decode();
  const scale = Math.min(1, MAX_IMAGE_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.naturalWidth * scale);
  canvas.height = Math.round(img.naturalHeight * scale);
  canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.88);
}

function ImageField({ hint, value, readOnly, onChange }: { hint: string; value: string; readOnly: boolean; onChange: (v: string) => void }) {
  const th = useTh();
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setLoading(true);
    try { onChange(await readImage(file)); } finally { setLoading(false); }
  };
  return (
    <div className="space-y-3 max-w-4xl">
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => void onFile(e)} />
      {value ? (
        <div className="rounded-[6px] p-3 space-y-3" style={{ border: `1px solid ${th.sep}`, background: th.card }}>
          <img src={value} alt="Visuel importé" className="max-h-[420px] w-auto mx-auto rounded-[4px]" />
          {!readOnly && (
            <div className="flex gap-2 justify-center flex-wrap">
              <GhostButton sm Icon={ImagePlus} onClick={() => inputRef.current?.click()}>Remplacer le visuel</GhostButton>
              <GhostButton sm Icon={Trash2} onClick={() => onChange("")}>Retirer le visuel</GhostButton>
            </div>
          )}
        </div>
      ) : (
        <button type="button" disabled={readOnly || loading} onClick={() => inputRef.current?.click()}
          className="w-full rounded-[6px] px-6 py-10 flex flex-col items-center gap-2 text-sm transition-colors disabled:cursor-not-allowed hover-fine:[border-color:var(--ink)]"
          style={{ border: `1.5px dashed ${th.inputB}`, color: th.fg2 }}>
          {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <ImagePlus className="w-6 h-6" />}
          <span className="font-semibold" style={{ color: th.fg }}>{readOnly ? "Aucun visuel importé" : "Importer le visuel final"}</span>
          {!readOnly && <span style={{ color: th.fg3 }}>Un seul fichier image</span>}
        </button>
      )}
      {hint && !readOnly && <p className="text-xs" style={{ color: th.fg3 }}>{hint}</p>}
    </div>
  );
}

// Mise en forme du texte des missions (paragraphes, listes, tableaux de la
// grille de notation), aux couleurs du thème courant.
const PROSE_CSS = `
.mission-prose{font-size:15.5px;line-height:1.7}
.mission-prose p+p,.mission-prose p+ul,.mission-prose ul+p,.mission-prose p+ol,.mission-prose ol+p{margin-top:.75em}
.mission-prose ul{list-style:disc;margin:.6em 0 .6em 1.3em}
.mission-prose ol{list-style:decimal;margin:.6em 0 .6em 1.3em}
.mission-prose li{margin-bottom:.35em}
.mission-prose li::marker{color:currentColor;opacity:.55}
.mission-prose strong{font-weight:700}
.mission-prose em{font-style:italic}
.mission-prose a{text-decoration:underline;text-underline-offset:3px}
.mission-prose h3{font-size:1.15rem;font-weight:800;margin:1.6em 0 .6em}
.mission-prose h3:first-child{margin-top:0}
.mission-prose table{width:100%;border-collapse:collapse;margin:1em 0;font-size:14px;line-height:1.55}
.mission-prose th,.mission-prose td{border:1px solid rgba(127,127,127,.28);padding:9px 12px;text-align:left;vertical-align:top}
.mission-prose th{font-size:10.5px;letter-spacing:.08em;text-transform:uppercase;font-weight:800;background:rgba(127,127,127,.09)}
.mission-prose td:first-child{font-weight:700}
.mission-prose td.note,.mission-prose th.note{width:80px;text-align:center;white-space:nowrap}
.mission-prose tr.total td{background:rgba(181,141,224,.16)}
.mission-question>p:first-child{font-size:clamp(1.1rem,1.9vw,1.3rem);line-height:1.45;font-weight:700}
.mission-quote{font-style:italic;font-size:16px}
`;
