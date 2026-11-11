import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router";
import { Check, Copy, ExternalLink, FileText, HelpCircle, Loader2, RotateCcw, Sparkles, X, ArrowRight } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { GCard } from "@/app/components/common/GCard";
import { ShimBtn, VBtn } from "@/app/components/common/Buttons";
import { cx } from "@/app/lib/cx";
import { askPlatformAi } from "@/app/playgrounds/ai";
import type { PlaygroundProps } from "@/app/playgrounds/registry";
import { CONTENT, TOOLS, type ToolId } from "./lecon11Content";
import { TOOL_SHEETS } from "./tools";
import { Hero, ProgressRing, TOOL_TINT, alpha, celebrate } from "@/app/playgrounds/ui";

// Playground de la leçon 1.1 (RS6776) — trois activités qui suivent la vidéo :
//  1. la prédiction du mot suivant (simulation, pourcentages fictifs) ;
//  2. la même question posée sans source puis avec le texte fourni (vrai modèle,
//     via ai-proxy) : hallucination et variabilité observées pour de vrai ;
//  3. les fiches des cinq outils de référence (ChatGPT, Claude, Gemini, Copilot, Firefly) ;
//  4. le choix de l'outil selon le contexte (prépare l'exercice 1 de l'écrit).
// Variante par profil : paramètre `profil` du marqueur (ex. profil=sirh).

export default function Lecon11Playground({ params }: PlaygroundProps) {
  const th = useTh();
  const content = CONTENT[params.profil ?? ""] ?? CONTENT[""];
  const [step, setStep] = useState(0);
  const [done, setDone] = useState<boolean[]>([false, false, false, false]);
  const markDone = (i: number) => setDone((d) => d.map((v, j) => (j === i ? true : v)));
  const navRef = useRef<HTMLElement>(null);
  const doneCount = done.filter(Boolean).length;
  const prevDone = useRef(0);
  useEffect(() => {
    if (doneCount > prevDone.current) celebrate(navRef.current, 0.6);
    prevDone.current = doneCount;
  }, [doneCount]);

  const steps = ["Le mot suivant", "Sans source, avec source", "Les cinq outils", "Quel outil pour quelle tâche ?"];

  return (
    <div className="flex flex-col gap-5">
      <Hero>
        <div className="flex flex-col md:flex-row md:items-center gap-5 md:pr-24">
          <div className="flex-1">
            <p className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: th.fg3 }}>Playground · Leçon 1.1</p>
            <h2 className="text-2xl md:text-3xl font-semibold leading-tight mb-2" style={{ color: th.fg }}>Voir <span className="hl">l'IA générative</span> à l'œuvre</h2>
            <p className="text-sm max-w-[70ch]" style={{ color: th.fg2 }}>{content.intro}</p>
          </div>
          <ProgressRing value={doneCount / steps.length} label="réalisé" />
        </div>
      </Hero>

      <nav ref={navRef} className="grid grid-cols-2 lg:grid-cols-4 gap-2" aria-label="Activités">
        {steps.map((label, i) => {
          const tint = ["#b58de0", "#fbc2ad", "#78d5e2", "#6adeb1"][i];
          const active = step === i;
          return (
            <button key={label} onClick={() => setStep(i)} aria-current={active ? "step" : undefined}
              className="pg-tile flex items-center gap-2.5 rounded-[12px] px-3 py-3 text-left text-xs font-semibold"
              style={{ background: active ? `linear-gradient(135deg, ${alpha(tint, 0.9)}, ${alpha(tint, 0.55)})` : alpha(tint, th.isDark ? 0.1 : 0.12), border: `1px solid ${alpha(tint, active ? 1 : 0.5)}`, color: active ? "#111" : th.fg }}>
              <span className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold" style={{ background: done[i] ? "var(--grad-iris)" : active ? "rgba(255,255,255,.55)" : alpha(tint, 0.35), color: "#111" }}>
                {done[i] ? <Check className="w-3.5 h-3.5" /> : i + 1}
              </span>
              {label}
            </button>
          );
        })}
      </nav>

      {step === 0 && <PredictionGame rounds={content.rounds} onDone={() => markDone(0)} onNext={() => setStep(1)} />}
      {step === 1 && <SourceLab lab={content.lab} onDone={() => markDone(1)} onNext={() => setStep(2)} />}
      {step === 2 && <ToolSheets onDone={() => markDone(2)} onNext={() => setStep(3)} />}
      {step === 3 && <ToolMatcher cases={content.cases} onDone={() => markDone(3)} />}

      <ContinueOnPlatform suggestion={content.studioQuestion} />
    </div>
  );
}

/* ---------- 1. Le mot suivant ---------- */

function PredictionGame({ rounds, onDone, onNext }: { rounds: typeof CONTENT[""]["rounds"]; onDone: () => void; onNext: () => void }) {
  const th = useTh();
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const round = rounds[i];
  const order = useMemo(() => [...round.cands].sort(() => Math.random() - 0.5), [round]);
  const sorted = [...round.cands].sort((a, b) => b.p - a.p);
  const top = sorted[0].w;
  const last = i === rounds.length - 1;

  return (
    <GCard className="p-6">
      <p className="text-xs mb-4" style={{ color: th.fg3 }}>
        Simulation pédagogique : les pourcentages sont illustratifs, ils ne proviennent pas d'un vrai modèle.
        Devinez la suite que l'outil jugerait la plus probable.
      </p>
      <p className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: th.fg3 }}>Phrase {i + 1} sur {rounds.length}</p>
      <p className="text-lg mb-4" style={{ color: th.fg }}>« {round.stem} … »</p>
      <div className="grid sm:grid-cols-2 gap-2">
        {order.map((c) => {
          const isTop = picked && c.w === top;
          const isMine = picked === c.w;
          return (
            <button key={c.w} disabled={!!picked} onClick={() => { setPicked(c.w); if (last) onDone(); }}
              className="text-left rounded-[4px] px-4 py-3 text-sm transition-colors disabled:cursor-default"
              style={{ border: `1px solid ${isTop ? th.success : isMine ? th.warn : th.sep}`, color: th.fg }}>
              <span className="flex items-center justify-between gap-3">
                <span>{c.w}{isMine ? " (votre choix)" : ""}</span>
                {picked && <span className="tabular-nums text-xs" style={{ color: isTop ? th.success : th.fg3 }}>{c.p} %</span>}
              </span>
              {picked && (
                <span className="block h-1.5 mt-2 rounded-full overflow-hidden" style={{ background: th.sep }}>
                  <span className="block h-full rounded-full" style={{ width: `${c.p}%`, background: isTop ? th.success : th.fg3 }} />
                </span>
              )}
            </button>
          );
        })}
      </div>
      {picked && (
        <p className="text-sm mt-4" style={{ color: th.fg2 }}>
          {picked === top ? "Exact : c'est la suite la plus probable." : `La suite la plus probable était « ${top} ».`}{" "}
          Les autres restent possibles : c'est pour cela qu'un même prompt ne donne pas toujours la même réponse.
        </p>
      )}
      <div className="flex gap-2 mt-5">
        {picked && !last && <VBtn sm onClick={() => { setI(i + 1); setPicked(null); }}>Phrase suivante</VBtn>}
      </div>
      {picked && last && <Retain>L'outil choisit une suite probable, fragment après fragment. Il ne vérifie pas ce qu'il écrit : une phrase fluide n'est pas une phrase exacte.</Retain>}
      {picked && last && <div className="mt-4"><ShimBtn sm onClick={onNext}>Activité suivante <ArrowRight className="w-4 h-4" /></ShimBtn></div>}
    </GCard>
  );
}

/* ---------- 2. Sans source, avec source ---------- */

type Answer = { mode: "sans" | "avec"; text: string };

function SourceLab({ lab, onDone, onNext }: { lab: typeof CONTENT[""]["lab"]; onDone: () => void; onNext: () => void }) {
  const th = useTh();
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState<"sans" | "avec" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const sansCount = answers.filter((a) => a.mode === "sans").length;
  const avecCount = answers.filter((a) => a.mode === "avec").length;
  const ready = sansCount >= 2 && avecCount >= 1;

  const ask = async (mode: "sans" | "avec") => {
    setLoading(mode); setError(null);
    const prompt = mode === "sans" ? lab.question : `${lab.question}\n\nVoici le document à utiliser :\n"""\n${lab.source}\n"""`;
    try {
      const text = await askPlatformAi(prompt, {
        system: "Tu es un assistant de bureau. Réponds en français, en deux phrases maximum, sans mise en forme.",
        temperature: 1,
      });
      setAnswers((a) => [{ mode, text }, ...a]);
      const nextSans = sansCount + (mode === "sans" ? 1 : 0);
      const nextAvec = avecCount + (mode === "avec" ? 1 : 0);
      if (nextSans >= 2 && nextAvec >= 1) onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : "L'outil n'a pas répondu. Réessayez dans un instant.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <GCard className="p-6">
      <p className="text-sm mb-4" style={{ color: th.fg2 }}>
        Cette fois, c'est un vrai modèle qui répond. Posez-lui la question <strong>sans source</strong>, au moins deux fois,
        puis <strong>avec le document</strong>. Observez ce qui change d'une réponse à l'autre. Toutes les données sont fictives.
      </p>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-[4px] p-4" style={{ border: `1px solid ${th.sep}` }}>
          <p className="text-[11px] font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5" style={{ color: th.fg3 }}><HelpCircle className="w-3.5 h-3.5" />La question</p>
          <p className="text-sm" style={{ color: th.fg }}>{lab.question}</p>
        </div>
        <div className="rounded-[4px] p-4" style={{ border: `1px solid ${th.sep}` }}>
          <p className="text-[11px] font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5" style={{ color: th.fg3 }}><FileText className="w-3.5 h-3.5" />Le document fourni</p>
          <p className="text-sm whitespace-pre-line" style={{ color: th.fg2 }}>{lab.source}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 mt-4">
        <VBtn sm onClick={() => void ask("sans")} disabled={!!loading}>
          {loading === "sans" ? <Loader2 className="w-4 h-4 animate-spin" /> : sansCount ? <RotateCcw className="w-4 h-4" /> : null}
          {sansCount ? "Reposer sans source" : "Demander sans source"}
        </VBtn>
        <ShimBtn sm onClick={() => void ask("avec")} disabled={!!loading}>
          {loading === "avec" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}Demander avec le document
        </ShimBtn>
      </div>
      {error && <p className="text-sm mt-3" style={{ color: th.danger }}>{error}</p>}
      {answers.length > 0 && (
        <ol className="mt-4 flex flex-col gap-2" aria-live="polite">
          {answers.map((a, k) => (
            <li key={answers.length - k} className="rounded-[4px] px-4 py-3" style={{ border: `1px solid ${a.mode === "avec" ? th.success : th.sep}` }}>
              <span className="block text-[10.5px] font-bold uppercase tracking-widest mb-1" style={{ color: a.mode === "avec" ? th.success : th.fg3 }}>
                {a.mode === "avec" ? "Avec le document" : "Sans source"}
              </span>
              <span className="text-sm" style={{ color: th.fg }}>{a.text}</span>
            </li>
          ))}
        </ol>
      )}
      {ready && (
        <>
          <Retain>
            Sans source, l'outil n'a que deux options : avouer qu'il ne sait pas, ou produire une réponse plausible. Si deux
            réponses diffèrent, aucune n'est fiable : c'est une hallucination possible. Avec le document, il transforme une
            information que vous lui donnez : c'est là qu'il est le plus sûr. Relisez quand même avant d'envoyer.
          </Retain>
          <div className="mt-4"><ShimBtn sm onClick={onNext}>Activité suivante <ArrowRight className="w-4 h-4" /></ShimBtn></div>
        </>
      )}
    </GCard>
  );
}

/* ---------- 4. Quel outil pour quelle tâche ? ---------- */

function ToolMatcher({ cases, onDone }: { cases: typeof CONTENT[""]["cases"]; onDone: () => void }) {
  const th = useTh();
  const [picks, setPicks] = useState<Record<number, ToolId>>({});
  const answered = Object.keys(picks).length;
  const score = cases.filter((c, i) => picks[i] === c.answer || c.alsoOk?.includes(picks[i])).length;

  return (
    <GCard className="p-6">
      <p className="text-sm mb-4" style={{ color: th.fg2 }}>
        Pour chaque situation, choisissez l'outil le plus adapté. C'est le raisonnement attendu dans le premier exercice
        de l'écrit : un outil, une justification.
      </p>
      <div className="flex flex-col gap-3">
        {cases.map((c, i) => {
          const pick = picks[i];
          return (
            <div key={c.task} className="rounded-[4px] p-4" style={{ border: `1px solid ${th.sep}` }}>
              <p className="text-sm mb-3" style={{ color: th.fg }}><strong>{i + 1}.</strong> {c.task}</p>
              <div className="flex flex-wrap gap-2">
                {TOOLS.map((t) => {
                  const good = pick && t.id === c.answer;
                  const ok = pick === t.id && t.id !== c.answer && !!c.alsoOk?.includes(t.id);
                  const bad = pick === t.id && t.id !== c.answer && !ok;
                  return (
                    <button key={t.id} disabled={!!pick}
                      onClick={() => { const next = { ...picks, [i]: t.id }; setPicks(next); if (Object.keys(next).length === cases.length) onDone(); }}
                      className={cx("inline-flex items-center gap-1.5 rounded-[2px] px-3 min-h-9 text-xs font-semibold disabled:cursor-default")}
                      style={{ border: `1px solid ${good ? th.success : ok ? th.info : bad ? th.danger : th.sep}`, color: good ? th.success : ok ? th.info : bad ? th.danger : th.fg2 }}>
                      {good && <Check className="w-3.5 h-3.5" />}{ok && <Check className="w-3.5 h-3.5" />}{bad && <X className="w-3.5 h-3.5" />}{t.label}
                    </button>
                  );
                })}
              </div>
              {pick && <p className="text-xs mt-3" style={{ color: th.fg2 }}>{pick !== c.answer && c.alsoOk?.includes(pick) ? `Défendable. Réponse attendue : ${TOOLS.find((x) => x.id === c.answer)?.label}. ` : ""}{c.why}</p>}
            </div>
          );
        })}
      </div>
      {answered === cases.length && (
        <Retain>
          {score} sur {cases.length}. Le bon outil dépend d'abord de l'environnement déjà en place et de ce que l'entreprise
          autorise, pas d'un classement. Dans tous les cas : un outil autorisé, des données préparées, un résultat vérifié.
        </Retain>
      )}
    </GCard>
  );
}

/* ---------- 3. Les cinq outils ---------- */

function ToolSheets({ onDone, onNext }: { onDone: () => void; onNext: () => void }) {
  const th = useTh();
  const navigate = useNavigate();
  const [active, setActive] = useState(0);
  const [seen, setSeen] = useState<Set<number>>(() => new Set([0]));
  const open = (i: number) => {
    setActive(i);
    setSeen((prev) => { const next = new Set(prev).add(i); if (next.size === TOOL_SHEETS.length) onDone(); return next; });
  };
  const t = TOOL_SHEETS[active];
  const rows: [string, string][] = [["Points forts", t.strengths], ["Usages", t.uses], ["Intégration", t.integration], ["Accès", t.access]];

  return (
    <GCard className="p-6">
      <p className="text-sm mb-4" style={{ color: th.fg2 }}>
        Les cinq outils de référence de la formation, présentés de la même façon. Parcourez les cinq fiches : vous
        réutiliserez ces critères pour justifier vos choix dans le premier exercice de l'écrit.
      </p>
      <div className="flex flex-wrap gap-2 mb-4" role="tablist" aria-label="Outils">
        {TOOL_SHEETS.map((x, i) => (
          <button key={x.id} role="tab" aria-selected={active === i} onClick={() => open(i)}
            className="inline-flex items-center gap-1.5 rounded-[2px] px-3.5 min-h-9 text-xs font-semibold"
            style={active === i ? { background: TOOL_TINT[x.id], color: "#111" } : { border: `1px solid ${alpha(TOOL_TINT[x.id], 0.7)}`, color: th.fg2 }}>
            {seen.has(i) && active !== i && <Check className="w-3 h-3" />}{x.name}
          </button>
        ))}
      </div>
      <div key={t.id} className="pg-pop rounded-[12px] p-5" style={{ background: alpha(TOOL_TINT[t.id], th.isDark ? 0.12 : 0.14), border: `1px solid ${alpha(TOOL_TINT[t.id], 0.8)}` }} role="tabpanel">
        <p className="text-lg font-semibold" style={{ color: th.fg }}>{t.name} <span className="text-sm font-normal" style={{ color: th.fg3 }}>· {t.editor}</span></p>
        <dl className="mt-3 grid gap-3">
          {rows.map(([label, value]) => (
            <div key={label} className="grid sm:grid-cols-[130px_1fr] gap-1">
              <dt className="text-[11px] font-bold uppercase tracking-widest pt-0.5" style={{ color: th.fg3 }}>{label}</dt>
              <dd className="text-sm" style={{ color: th.fg }}>{value}</dd>
            </div>
          ))}
        </dl>
        <div className="flex flex-wrap items-center gap-2 mt-4">
          <a href={t.pricingUrl} target="_blank" rel="noopener noreferrer" className="sweep inline-flex items-center gap-1.5 rounded-[2px] px-3.5 min-h-9 text-xs font-semibold"
            style={{ border: `1px solid ${th.ink}`, color: th.fg }}>
            Tarifs officiels <ExternalLink className="w-3 h-3" />
          </a>
          {t.inPlatform
            ? <VBtn sm onClick={() => navigate(t.inPlatform!)}>Essayer dans le Studio</VBtn>
            : <span className="text-xs" style={{ color: th.fg3 }}>Pas dans la plateforme : vous le découvrirez sur son site à la leçon 1.3.</span>}
        </div>
      </div>
      <p className="text-xs mt-3" style={{ color: th.fg3 }}>
        Les tarifs changent souvent : vérifiez-les toujours sur la page officielle de l'éditeur avant de chiffrer un budget.
      </p>
      {seen.size === TOOL_SHEETS.length && (
        <>
          <Retain>
            Ils reposent sur des principes proches. Ce qui les distingue : leurs points forts, ce à quoi ils sont connectés,
            et leurs conditions d'accès. Le bon choix dépend du besoin, de l'environnement en place et de ce que
            l'entreprise autorise.
          </Retain>
          <div className="mt-4"><ShimBtn sm onClick={onNext}>Activité suivante <ArrowRight className="w-4 h-4" /></ShimBtn></div>
        </>
      )}
    </GCard>
  );
}

/* ---------- Commun ---------- */

function Retain({ children }: { children: ReactNode }) {
  const th = useTh();
  return (
    <div className="pg-pop mt-4 rounded-[10px] px-4 py-3 text-sm" style={{ background: alpha("#b58de0", th.isDark ? 0.12 : 0.14), borderLeft: "3px solid #b58de0", color: th.fg2 }}>
      <span className="block text-[11px] font-bold uppercase tracking-widest mb-1" style={{ color: th.fg }}>Ce qu'il faut retenir</span>
      {children}
    </div>
  );
}

function ContinueOnPlatform({ suggestion }: { suggestion: string }) {
  const th = useTh();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(suggestion); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* presse-papiers refusé */ }
  };
  const links = [
    { label: "Studio · ChatGPT", to: "/studio/chatgpt" },
    { label: "Studio · Claude", to: "/studio/claude" },
    { label: "Studio · Gemini", to: "/studio/gemini" },
  ];
  return (
    <GCard className="p-6">
      <p className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: th.fg3 }}>Pour aller plus loin sur la plateforme</p>
      <p className="text-sm mb-3" style={{ color: th.fg2 }}>
        Posez la même question à trois assistants dans le Studio, puis comparez : longueur, exactitude, ton.
      </p>
      <div className="flex items-start gap-2 rounded-[4px] px-4 py-3 mb-3" style={{ border: `1px solid ${th.sep}` }}>
        <p className="text-sm flex-1" style={{ color: th.fg }}>{suggestion}</p>
        <button onClick={() => void copy()} className="inline-flex items-center gap-1 text-xs font-semibold shrink-0" style={{ color: th.fg2 }}>
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}{copied ? "Copié" : "Copier"}
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {links.map((l) => <VBtn key={l.to} sm onClick={() => navigate(l.to)}>{l.label}</VBtn>)}
        <VBtn sm onClick={() => navigate("/practice/battle-ground")}>Battle Ground · gamme Rapide, défi « Piège »</VBtn>
        <VBtn sm onClick={() => navigate("/hub/texte")}>Hub IA · Générer du texte</VBtn>
      </div>
      <p className="text-xs mt-3" style={{ color: th.fg3 }}>
        Copilot et Firefly ne sont pas intégrés à la plateforme : vous les découvrirez sur leur site dans la leçon 1.3.
      </p>
    </GCard>
  );
}
