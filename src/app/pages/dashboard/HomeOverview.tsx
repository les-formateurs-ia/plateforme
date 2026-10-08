import { useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { ArrowRight, Bot, Check, Clock, Code2, Lock, Play, Sparkles, Target, Percent, CheckCircle, type LucideIcon } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { NeuralField } from "@/app/components/particles/NeuralField";
import { SymbolCard } from "@/app/components/common/SymbolCard";
import { sparkLine } from "@/app/lib/particles/burst";
import { formatDuration, type CourseOutline, type LessonWithState, type BadgeRow } from "@/app/lib/learning";
import { moduleProgress, nextLessonOf, MODULE_STATUS_LABEL, type ModuleProgress } from "@/app/lib/journey";
import { cx } from "@/app/lib/cx";
import { SectionHead } from "@/app/components/common/SectionHead";

// Accueil de l'élève, pensé autour d'une question : « qu'est-ce que je fais
// maintenant ? ». D'abord la reprise (la prochaine leçon, sur le panneau noir
// au réseau de la marque), puis le parcours en frise, les chiffres, et les
// trois façons de pratiquer.
export function HomeOverview({ outline, states, badges, earnedIds }: {
  outline: CourseOutline; states: LessonWithState[]; badges: BadgeRow[]; earnedIds: Set<string>;
}) {
  const modules = moduleProgress(outline, states);
  const total = states.length;
  const done = states.filter((s) => s.progress?.status === "completed").length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const time = states.reduce((sum, s) => sum + (s.progress?.timeSpentSeconds ?? 0), 0);
  const scores = states.map((s) => s.progress?.bestQuizScore).filter((s): s is number => s != null);
  const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;

  return (
    <div className="space-y-10">
      <ResumeHero outline={outline} states={states} modules={modules} pct={pct} done={done} total={total} />
      <JourneyTimeline modules={modules} />
      <KeyFigures figures={[
        { Icon: Clock, value: formatDuration(time), unit: "", label: "de formation suivie", grad: "var(--grad-bleu)" },
        { Icon: CheckCircle, value: String(done), unit: `/${total}`, label: "leçons validées", grad: "var(--grad-violet)" },
        { Icon: Target, value: String(modules.filter((m) => m.status === "done").length), unit: `/${modules.length}`, label: "modules validés", grad: "var(--grad-bleu)" },
        { Icon: Percent, value: avg != null ? String(avg) : "—", unit: avg != null ? "%" : "", label: "de réussite aux quiz", grad: "var(--grad-beige)" },
      ]} />
      <PracticeShortcuts />
      <BadgesStrip badges={badges} earnedIds={earnedIds} />
    </div>
  );
}

// ── Reprise ────────────────────────────────────────────────────────────────

function ResumeHero({ outline, states, modules, pct, done, total }: {
  outline: CourseOutline; states: LessonWithState[]; modules: ModuleProgress[]; pct: number; done: number; total: number;
}) {
  const navigate = useNavigate();
  const th = useTh();
  const next = nextLessonOf(states);
  const current = modules.find((m) => m.section.lessons.some((l) => l.id === next?.lesson.id));
  const lessonIndex = current && next ? current.section.lessons.findIndex((l) => l.id === next.lesson.id) : -1;
  const finished = total > 0 && done === total;

  return (
    // Panneau noir dans les deux thèmes (comme les sections sombres du site public).
    <section className="relative overflow-hidden rounded-[10px] bg-black text-white fade-up"
      style={{ border: th.isDark ? `1px solid ${th.sep}` : undefined }} aria-labelledby="resume-title">
      <NeuralField dark density={4} band={0.95} />
      {/* Voile : le texte garde son contraste sur le réseau. */}
      <div aria-hidden className="absolute inset-0" style={{ background: "linear-gradient(90deg,rgba(0,0,0,0.88) 0%,rgba(0,0,0,0.55) 42%,rgba(0,0,0,0) 72%)" }} />
      <div className="relative grid gap-10 p-6 sm:p-9 lg:p-11 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div className="max-w-2xl">
          <p className="eyebrow text-white/60">
            {finished ? "Parcours terminé" : next ? `Reprendre · Module ${String((current?.index ?? 0) + 1).padStart(2, "0")}${lessonIndex >= 0 ? ` · Leçon ${lessonIndex + 1} sur ${current?.total}` : ""}` : "Prochaine étape"}
          </p>
          <h2 id="resume-title" className="mt-4 text-[1.9rem] sm:text-[2.6rem] lg:text-[3rem] font-extrabold leading-[1.02] tracking-[-0.035em]" style={{ textWrap: "balance" }}>
            {finished ? "Bravo, toutes les leçons sont validées." : next ? next.lesson.title : "Ton formateur ouvre bientôt le module suivant."}
          </h2>
          <p className="mt-4 text-base text-white/65 leading-relaxed">
            {finished
              ? "Il te reste à préparer ta soutenance pour obtenir la certification."
              : next
                ? <>{current?.section.title}{next.lesson.durationMinutes ? <> · <span className="tabular-nums">{next.lesson.durationMinutes} min</span></> : null}</>
                : "En attendant, entraîne-toi dans les exercices ou le Studio."}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
            {next && !finished && (
              <button type="button" onClick={() => navigate(`/lesson/${next.lesson.id}`)}
                className="sweep inline-flex items-center gap-2.5 min-h-[50px] px-6 rounded-[2px] bg-white text-black text-base font-semibold">
                <Play className="w-4 h-4" fill="currentColor" />{next.progress ? "Reprendre la leçon" : "Commencer la leçon"}
              </button>
            )}
            {finished && (
              <button type="button" onClick={() => navigate("/profile")}
                className="sweep inline-flex items-center gap-2.5 min-h-[50px] px-6 rounded-[2px] bg-white text-black text-base font-semibold">
                S'entraîner pour la soutenance<ArrowRight className="w-4 h-4" />
              </button>
            )}
            <button type="button" onClick={() => navigate("/lessons")} className="group inline-flex items-center gap-1.5 text-sm font-semibold text-white/80 hover-fine:text-white">
              <span className="ink-link">Voir tout le parcours</span><ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
        </div>
        <ProgressRing pct={pct} caption={`${done} / ${total} leçons`} title={outline.instanceName} />
      </div>
    </section>
  );
}

// Anneau de progression au dégradé iris, sur fond noir.
function ProgressRing({ pct, caption, title }: { pct: number; caption: string; title: string }) {
  const size = 168, stroke = 6, r = (size - stroke) / 2, c = 2 * Math.PI * r;
  return (
    <figure className="flex lg:flex-col items-center gap-5 lg:gap-4" aria-label={`${pct} % du parcours ${title}`}>
      <div className="relative shrink-0 w-[120px] h-[120px] sm:w-[168px] sm:h-[168px]">
        <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full -rotate-90">
          <defs>
            <linearGradient id="home-ring" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#b58de0" /><stop offset="0.45" stopColor="#78d5e2" /><stop offset="0.75" stopColor="#6adeb1" /><stop offset="1" stopColor="#fbc2ad" />
            </linearGradient>
          </defs>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={stroke} />
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="url(#home-ring)" strokeWidth={stroke} strokeLinecap="round"
            strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)} className="home-ring-arc" style={{ ["--ring-c" as string]: c }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[2rem] sm:text-[2.6rem] font-extrabold leading-none tracking-[-0.04em] tabular-nums">{pct}<span className="text-white/60 text-[0.55em]">%</span></span>
          <span className="mt-1 text-[11px] text-white/55 uppercase tracking-[0.08em] font-semibold">du parcours</span>
        </div>
      </div>
      <figcaption className="text-sm text-white/60 tabular-nums lg:text-center">{caption}</figcaption>
    </figure>
  );
}

// ── Parcours ───────────────────────────────────────────────────────────────

// Frise des modules : numéros, statut, et un filet au dégradé iris qui se
// remplit jusqu'au module en cours (une traînée d'étincelles à la pointe).
function JourneyTimeline({ modules }: { modules: ModuleProgress[] }) {
  const th = useTh();
  const navigate = useNavigate();
  const lineRef = useRef<HTMLDivElement>(null);
  const reached = Math.max(0, modules.reduce((last, m, i) => (m.status === "done" || m.status === "current" || m.status === "started" ? i : last), -1));
  const currentIdx = modules.findIndex((m) => m.status === "current");
  const tip = modules.length > 1 ? (currentIdx >= 0 ? currentIdx : reached) / (modules.length - 1) : 1;

  useEffect(() => {
    const el = lineRef.current;
    if (!el) return;
    const t = window.setTimeout(() => sparkLine(el, tip, { count: 30 }), 650);
    return () => window.clearTimeout(t);
  }, [tip]);

  return (
    <section aria-labelledby="journey-title" className="fade-up" style={{ animationDelay: "80ms" }}>
      <SectionHead id="journey-title" eyebrow="Ton parcours" title="Module par module, jusqu'à la certification" action={{ label: "Voir les leçons", onClick: () => navigate("/lessons") }} />
      <div className="relative">
        {/* Filet de fond + remplissage iris jusqu'au module en cours (bureau). */}
        <div ref={lineRef} aria-hidden className="hidden md:block absolute left-[18px] right-[18px] top-[17px] h-[2px]" style={{ background: th.sep }}>
          <div className="journey-fill h-full origin-left" style={{ background: "var(--grad-iris)", transform: `scaleX(${tip})` }} />
        </div>
        <ol className="relative grid gap-4 md:gap-6" style={{ gridTemplateColumns: `repeat(auto-fit, minmax(${modules.length > 4 ? 150 : 190}px, 1fr))` }}>
          {modules.map((m) => {
            const active = m.status === "current";
            return (
              <li key={m.section.id}>
                <button type="button" onClick={() => navigate(`/lessons#module-${m.section.id}`)} disabled={m.status === "locked"}
                  className="group w-full text-left disabled:cursor-default">
                  <span className={cx("relative z-10 w-9 h-9 rounded-full flex items-center justify-center text-sm font-black tabular-nums transition-transform", m.status !== "locked" && "group-hover:scale-105")}
                    style={m.status === "done" ? { background: "var(--grad-bleu)", color: "#000" }
                      : active ? { background: th.ink, color: th.onInk, boxShadow: `0 0 0 4px ${th.bg}, 0 0 0 5px ${th.ink}` }
                      : { background: th.bg, color: m.status === "locked" ? th.fg3 : th.fg, border: `1px solid ${m.status === "locked" ? th.sep : th.inputB}` }}>
                    {m.status === "done" ? <Check className="w-4 h-4" strokeWidth={2.6} /> : m.status === "locked" ? <Lock className="w-3.5 h-3.5" /> : String(m.index + 1).padStart(2, "0")}
                  </span>
                  <span className="block mt-4 eyebrow" style={{ color: active ? th.fg : th.fg3 }}>{MODULE_STATUS_LABEL[m.status]}</span>
                  <span className="block mt-1.5 text-[17px] font-bold leading-snug" style={{ color: m.status === "locked" ? th.fg3 : th.fg }}>
                    <span className={cx(m.status !== "locked" && "ink-link")}>{m.section.title}</span>
                  </span>
                  <span className="block mt-1.5 text-sm tabular-nums" style={{ color: th.fg3 }}>
                    {m.done}/{m.total} leçon{m.total > 1 ? "s" : ""}{m.minutes ? ` · ${m.minutes} min` : ""}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

// ── Chiffres ───────────────────────────────────────────────────────────────

function KeyFigures({ figures }: { figures: { Icon: LucideIcon; value: string; unit: string; label: string; grad: string }[] }) {
  const th = useTh();
  return (
    <section aria-label="Tes chiffres" className="fade-up grid grid-cols-2 lg:grid-cols-4" style={{ animationDelay: "140ms", borderTop: `1px solid ${th.sep}`, borderBottom: `1px solid ${th.sep}` }}>
      {figures.map(({ Icon, value, unit, label, grad }, i) => (
        <div key={label} className={cx("figure-cell py-6 px-1 sm:px-6", i > 0 && "lg:border-l", i % 2 === 1 && "border-l", i >= 2 && "border-t lg:border-t-0")} style={{ borderColor: th.sep }}>
          <span className="w-7 h-7 rounded-full flex items-center justify-center mb-4" style={{ background: grad }}><Icon className="w-3.5 h-3.5" style={{ color: "#000" }} /></span>
          <p className="flex items-baseline gap-1">
            <span className="text-[2.2rem] sm:text-[2.6rem] leading-none font-extrabold tracking-[-0.04em] tabular-nums" style={{ color: th.fg }}>{value}</span>
            <span className="text-lg font-bold" style={{ color: th.fg3 }}>{unit}</span>
          </p>
          <p className="mt-2 text-sm" style={{ color: th.fg2 }}>{label}</p>
        </div>
      ))}
    </section>
  );
}

// ── Pratique ───────────────────────────────────────────────────────────────

const PRACTICE: { Icon: LucideIcon; theme: "violet" | "bleu" | "beige"; title: string; desc: string; path: string; cta: string }[] = [
  { Icon: Code2, theme: "violet", title: "Exercices", desc: "Écris des prompts, compare les modèles, devine l'image : l'IA te corrige.", path: "/practice", cta: "S'entraîner" },
  { Icon: Sparkles, theme: "bleu", title: "Le Studio", desc: "Image, vidéo, musique, voix : crée avec de vrais modèles d'IA.", path: "/studio", cta: "Créer" },
  { Icon: Bot, theme: "beige", title: "Mon Agent IA", desc: "Une question sur une leçon ou ton métier ? Ton agent connaît ton parcours.", path: "/agent", cta: "Discuter" },
];

function PracticeShortcuts() {
  const th = useTh();
  const navigate = useNavigate();
  return (
    <section aria-labelledby="practice-title" className="fade-up" style={{ animationDelay: "200ms" }}>
      <SectionHead id="practice-title" eyebrow="Continuer à pratiquer" title="Ce qu'on apprend, on le pratique" />
      <div className="grid gap-4 md:grid-cols-3">
        {PRACTICE.map(({ Icon, theme, title, desc, path, cta }) => (
          <SymbolCard key={path} Icon={Icon} theme={theme} title={title} desc={desc} cta={cta} onClick={() => navigate(path)} />
        ))}
      </div>
    </section>
  );
}

// ── Badges ─────────────────────────────────────────────────────────────────

function BadgesStrip({ badges, earnedIds }: { badges: BadgeRow[]; earnedIds: Set<string> }) {
  const th = useTh();
  if (!badges.length) return null;
  const earned = badges.filter((b) => earnedIds.has(b.id));
  const nextBadge = badges.find((b) => !earnedIds.has(b.id));
  return (
    <section aria-labelledby="badges-title" className="fade-up" style={{ animationDelay: "260ms" }}>
      <SectionHead id="badges-title" eyebrow="Badges" title={earned.length ? `${earned.length} badge${earned.length > 1 ? "s" : ""} obtenu${earned.length > 1 ? "s" : ""}` : "Ton premier badge t'attend"} />
      <div className="flex flex-wrap gap-3">
        {earned.map((b) => (
          <span key={b.id} className="inline-flex items-center gap-2.5 px-3.5 py-2.5 rounded-[4px]" style={{ border: `1px solid ${th.sep}` }}>
            <span className="text-lg">{b.icon}</span><span className="text-sm font-semibold" style={{ color: th.fg }}>{b.name}</span>
          </span>
        ))}
        {nextBadge && (
          <span className="inline-flex items-center gap-2.5 px-3.5 py-2.5 rounded-[4px]" style={{ border: `1px dashed ${th.inputB}`, color: th.fg3 }}>
            <span className="text-lg grayscale opacity-60">{nextBadge.icon}</span><span className="text-sm">Prochain : {nextBadge.name}</span>
          </span>
        )}
      </div>
    </section>
  );
}
