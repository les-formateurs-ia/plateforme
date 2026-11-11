import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router";
import { ArrowRight, Check, Copy, RotateCcw, X } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { GCard } from "@/app/components/common/GCard";
import { ShimBtn, VBtn } from "@/app/components/common/Buttons";
import type { PlaygroundProps } from "@/app/playgrounds/registry";
import { Chip, Hero, ProgressRing, alpha, celebrate } from "@/app/playgrounds/ui";

// Playground natif de la leçon 2.1 (version SIRH), converti depuis
// docs/formation-rs6776/lecon-2.1/playground-nathalie.html.
//
// Ce fichier porte aussi les briques communes des Playgrounds 2.1 à 2.5
// (questionnaires corrigés, brouillon sauvegardé avec corrigé indicatif,
// enveloppe à tuiles, encadré « Ce qu'il faut retenir », bloc « Pour aller plus
// loin »), réutilisées par Pg22 à Pg25.

/* ====================================================================== */
/* Briques communes                                                       */
/* ====================================================================== */

export const PG_TINTS = ["#b58de0", "#fbc2ad", "#78d5e2", "#6adeb1", "#dbacf0"] as const;

export type Activity = {
  nav: string;
  title: string;
  tag?: string;
  fictive?: boolean;
  intro?: ReactNode;
  render: (markDone: () => void) => ReactNode;
  retain: ReactNode;
};

/** Enveloppe d'un Playground : bandeau, tuiles d'activités, panneaux, bloc final. */
export function PgShell({ lesson, title, intro, activities, further, footnote = "Toutes les entreprises, personnes et données chiffrées de cet exercice sont fictives." }: {
  lesson: string; title: ReactNode; intro: ReactNode; activities: Activity[]; further: ReactNode; footnote?: string;
}) {
  const th = useTh();
  const [step, setStep] = useState(0);
  const [done, setDone] = useState<boolean[]>(() => activities.map(() => false));
  const navRef = useRef<HTMLElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const doneCount = done.filter(Boolean).length;
  const prevDone = useRef(0);
  useEffect(() => {
    if (doneCount > prevDone.current) celebrate(navRef.current, 0.6);
    prevDone.current = doneCount;
  }, [doneCount]);
  const markers = useRef<(() => void)[]>([]);
  activities.forEach((_, i) => {
    markers.current[i] ??= () => setDone((d) => (d[i] ? d : d.map((v, j) => (j === i ? true : v))));
  });
  const go = (i: number) => {
    setStep(i);
    requestAnimationFrame(() => panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  return (
    <div className="flex flex-col gap-5">
      <Hero>
        <div className="flex flex-col md:flex-row md:items-center gap-5 md:pr-24">
          <div className="flex-1">
            <p className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: th.fg3 }}>Playground · Leçon {lesson}</p>
            <h2 className="text-2xl md:text-3xl font-semibold leading-tight mb-2" style={{ color: th.fg }}>{title}</h2>
            <p className="text-sm max-w-[70ch]" style={{ color: th.fg2 }}>{intro}</p>
          </div>
          <ProgressRing value={doneCount / activities.length} label="réalisé" />
        </div>
      </Hero>

      <nav ref={navRef} className={`grid grid-cols-2 gap-2 ${activities.length === 4 ? "lg:grid-cols-4" : "lg:grid-cols-3"}`} aria-label="Activités">
        {activities.map((a, i) => {
          const tint = PG_TINTS[i % PG_TINTS.length];
          const active = step === i;
          return (
            <button key={a.nav} type="button" onClick={() => go(i)} aria-current={active ? "step" : undefined}
              className="pg-tile flex items-center gap-2.5 rounded-[12px] px-3 py-3 text-left text-xs font-semibold"
              style={{ background: active ? `linear-gradient(135deg, ${alpha(tint, 0.9)}, ${alpha(tint, 0.55)})` : alpha(tint, th.isDark ? 0.1 : 0.12), border: `1px solid ${alpha(tint, active ? 1 : 0.5)}`, color: active ? "#111" : th.fg }}>
              <span className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold" style={{ background: done[i] ? "var(--grad-iris)" : active ? "rgba(255,255,255,.55)" : alpha(tint, 0.35), color: "#111" }}>
                {done[i] ? <Check className="w-3.5 h-3.5" aria-label="Réalisé" /> : i + 1}
              </span>
              {a.nav}
            </button>
          );
        })}
      </nav>

      <div ref={panelRef} className="scroll-mt-4">
        {activities.map((a, i) => {
          const tint = PG_TINTS[i % PG_TINTS.length];
          return (
            <section key={a.nav} hidden={step !== i} aria-label={a.title}>
              <GCard className="p-5 md:p-6">
                <div className="h-1 -mx-5 md:-mx-6 -mt-5 md:-mt-6 mb-5" style={{ background: tint }} aria-hidden />
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  {a.tag && <Chip tint={tint}>{a.tag}</Chip>}
                  {a.fictive && <Chip tint={PG_TINTS[4]}>Exemple fictif</Chip>}
                </div>
                <h3 className="text-lg md:text-xl font-semibold mb-2" style={{ color: th.fg }}>{a.title}</h3>
                {a.intro && <div className="text-sm mb-5 max-w-[80ch] flex flex-col gap-2" style={{ color: th.fg2 }}>{a.intro}</div>}
                {a.render(markers.current[i])}
                {done[i] && (
                  <>
                    <Retain>{a.retain}</Retain>
                    {i < activities.length - 1 && (
                      <div className="mt-4"><ShimBtn sm onClick={() => go(i + 1)}>Activité suivante <ArrowRight className="w-4 h-4" /></ShimBtn></div>
                    )}
                  </>
                )}
              </GCard>
            </section>
          );
        })}
      </div>

      {further}

      <p className="text-xs text-center" style={{ color: th.fg3 }}>{footnote}</p>
    </div>
  );
}

/** Encadré « Ce qu'il faut retenir ». */
export function Retain({ children }: { children: ReactNode }) {
  const th = useTh();
  return (
    <div className="pg-pop mt-5 rounded-[10px] px-4 py-3 text-sm" style={{ background: alpha("#b58de0", th.isDark ? 0.12 : 0.14), borderLeft: "3px solid #b58de0", color: th.fg2 }}>
      <span className="block text-[11px] font-bold uppercase tracking-widest mb-1" style={{ color: th.fg }}>Ce qu'il faut retenir</span>
      {children}
    </div>
  );
}

/** Encadré de texte étiqueté (situation, prompt, résultat, version proposée…). */
export function Box({ label, children, tint, quote }: { label?: string; children: ReactNode; tint?: string; quote?: boolean }) {
  const th = useTh();
  return (
    <div className="rounded-[8px] px-4 py-3 text-sm" style={{ background: tint ? alpha(tint, th.isDark ? 0.1 : 0.1) : th.isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)", border: `1px solid ${tint ? alpha(tint, 0.45) : th.sep}`, color: th.fg }}>
      {label && <span className="block text-[10.5px] font-bold uppercase tracking-widest mb-1" style={{ color: th.fg3 }}>{label}</span>}
      <div className={quote ? "italic" : undefined}>{children}</div>
    </div>
  );
}

export type QOpt = { label: string; ok?: boolean; why?: string };
export type Question = {
  id: string;
  /** Intitulé court au-dessus de la question (ex. « 1. Compte-rendu confidentiel »). */
  heading?: string;
  /** Encadrés affichés avant la question. */
  boxes?: { label?: string; text: string; quote?: boolean }[];
  legend: string;
  options: QOpt[];
  /** Explications communes à la question (quand les options n'ont pas la leur). */
  okText?: string;
  koText?: string;
};

export type ScoreText = (r: { correct: number; total: number; pct: number; allAnswered: boolean }) => string;

/**
 * Questionnaire à choix unique, corrigé par un bouton.
 * - `instant` : explication affichée dès qu'une réponse est choisie (le bouton calcule le score) ;
 * - `prefix` : « Bonne réponse. » / « À revoir. » devant l'explication ;
 * - `revealCorrect` : à la correction, la bonne option est signalée et son explication affichée.
 */
export function Quiz({ questions, onComplete, scoreText, instant, prefix, revealCorrect, tint, threshold = 80, hint }: {
  questions: Question[]; onComplete: () => void; scoreText: ScoreText; instant?: boolean; prefix?: boolean; revealCorrect?: boolean; tint: string; threshold?: number; hint?: string;
}) {
  const th = useTh();
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [graded, setGraded] = useState<Record<string, number> | null>(null);
  const [result, setResult] = useState<{ text: string; pass: boolean } | null>(null);
  const scoreRef = useRef<HTMLParagraphElement>(null);

  const grade = () => {
    const snap = { ...answers };
    const correct = questions.filter((q) => q.options[snap[q.id]]?.ok).length;
    const total = questions.length;
    const pct = total ? Math.round((correct / total) * 100) : 0;
    const allAnswered = questions.every((q) => snap[q.id] !== undefined);
    const pass = pct >= threshold;
    setGraded(snap);
    setResult({ text: scoreText({ correct, total, pct, allAnswered }), pass });
    if (allAnswered) onComplete();
    if (pass) requestAnimationFrame(() => celebrate(scoreRef.current, 0.8));
  };
  const reset = () => { setAnswers({}); setGraded(null); setResult(null); };

  return (
    <div className="flex flex-col gap-4">
      {questions.map((q, qi) => {
        const pick = answers[q.id];
        const shown = instant ? pick : graded ? graded[q.id] : undefined;
        const showFeedback = instant ? pick !== undefined : graded !== null;
        const legendId = `${q.id}-legend`;
        let fb: { ok: boolean; text: string } | null = null;
        if (showFeedback) {
          if (shown === undefined) fb = { ok: false, text: "Pas de réponse sélectionnée." };
          else {
            const o = q.options[shown];
            const ok = !!o.ok;
            const base = o.why ?? (ok ? q.okText : q.koText) ?? (ok ? "Correct." : "À revoir.");
            fb = { ok, text: prefix ? `${ok ? "Bonne réponse." : "À revoir."} ${base}` : base };
          }
        }
        const right = q.options.findIndex((o) => o.ok);
        const revealRight = revealCorrect && showFeedback && shown !== right && right >= 0;
        return (
          <div key={q.id} role="group" aria-labelledby={legendId} className="rounded-[10px] p-4" style={{ border: `1px solid ${th.sep}`, background: th.isDark ? "rgba(255,255,255,0.02)" : alpha(tint, 0.04) }}>
            {q.heading && <p className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: th.fg3 }}>{q.heading}</p>}
            {q.boxes && q.boxes.length > 0 && (
              <div className="flex flex-col gap-2 mb-3">
                {q.boxes.map((b, k) => <Box key={k} label={b.label} quote={b.quote}>{b.text}</Box>)}
              </div>
            )}
            <p id={legendId} className="text-sm font-medium mb-3" style={{ color: th.fg }}>
              {!q.heading && <span className="font-bold">{qi + 1}. </span>}{q.legend}
            </p>
            <div className="flex flex-col gap-2">
              {q.options.map((o, oi) => {
                const selected = pick === oi;
                const evaluated = showFeedback && shown === oi;
                const isRight = revealRight && oi === right;
                const color = evaluated ? (o.ok ? th.success : th.danger) : isRight ? th.success : selected ? th.ink : th.sep;
                return (
                  <button key={oi} type="button" aria-pressed={selected}
                    onClick={() => setAnswers((a) => ({ ...a, [q.id]: oi }))}
                    className="flex items-start gap-2.5 rounded-[6px] px-3.5 py-2.5 text-left text-sm transition-colors"
                    style={{ border: `1px ${isRight && !evaluated ? "dashed" : "solid"} ${color}`, background: selected ? alpha(tint, th.isDark ? 0.14 : 0.16) : "transparent", color: th.fg }}>
                    <span className="mt-0.5 w-4 h-4 rounded-full shrink-0 flex items-center justify-center" style={{ border: `1.5px solid ${selected ? th.ink : th.fg3}` }} aria-hidden>
                      {selected && <span className="w-2 h-2 rounded-full" style={{ background: th.ink }} />}
                    </span>
                    <span className="flex-1">{o.label}</span>
                    {evaluated && (o.ok ? <Check className="w-4 h-4 shrink-0" style={{ color: th.success }} aria-label="Bonne réponse" /> : <X className="w-4 h-4 shrink-0" style={{ color: th.danger }} aria-label="Réponse incorrecte" />)}
                    {isRight && !evaluated && <span className="text-[11px] font-semibold shrink-0" style={{ color: th.success }}>Bonne réponse</span>}
                  </button>
                );
              })}
            </div>
            <div aria-live="polite">
              {fb && (
                <p className="pg-pop text-sm mt-3" style={{ color: fb.ok ? th.success : th.danger }}>{fb.text}</p>
              )}
              {revealRight && q.options[right].why && (shown === undefined || q.options[right].why !== q.options[shown].why) && (
                <p className="text-sm mt-2" style={{ color: th.fg2 }}>
                  <strong>{q.options[right].label.length <= 80 ? `Bonne réponse : ${q.options[right].label}.` : "Bonne réponse (signalée ci-dessus) :"}</strong> {q.options[right].why}
                </p>
              )}
            </div>
          </div>
        );
      })}
      <div className="flex flex-wrap items-center gap-3">
        <ShimBtn sm onClick={grade}>Corriger mes réponses</ShimBtn>
        {graded && <VBtn sm onClick={reset}><RotateCcw className="w-4 h-4" />Recommencer</VBtn>}
        {hint && <span className="text-xs" style={{ color: th.fg3 }}>{hint}</span>}
      </div>
      <p ref={scoreRef} aria-live="polite" className="text-sm font-semibold min-h-5" style={{ color: result ? (result.pass ? th.success : th.danger) : th.fg3 }}>
        {result?.text}
      </p>
    </div>
  );
}

/** Rédaction libre sauvegardée dans le navigateur, avec corrigé indicatif à afficher. */
export function DraftExercise({ storageKey, placeholder, label, corrige, onComplete, statusInit = "Votre texte est sauvegardé automatiquement dans ce navigateur au fur et à mesure de la saisie.", statusRestored = "Brouillon restauré depuis votre dernière visite.", statusSaved, stamp }: {
  storageKey: string; placeholder: string; label: string; corrige: ReactNode; onComplete: () => void;
  statusInit?: string; statusRestored?: string; statusSaved?: string; stamp?: boolean;
}) {
  const th = useTh();
  const id = useId();
  const [text, setText] = useState("");
  const [status, setStatus] = useState(statusInit);
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(storageKey);
      if (saved) { setText(saved); setStatus(statusRestored); }
    } catch { setStatus("Sauvegarde automatique indisponible dans ce navigateur ; pensez à copier votre texte."); }
  }, [storageKey, statusRestored]);
  const change = (v: string) => {
    setText(v);
    try {
      window.localStorage.setItem(storageKey, v);
      if (statusSaved) {
        const now = new Date();
        setStatus(stamp ? `${statusSaved} (${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}).` : statusSaved);
      }
    } catch { setStatus("Sauvegarde automatique indisponible dans ce navigateur ; pensez à copier votre texte."); }
  };
  const written = text.trim().length >= 20;
  const toggle = () => setOpen((o) => !o);
  useEffect(() => { if (open && written) onComplete(); }, [open, written, onComplete]);
  const copy = async () => {
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* presse-papiers refusé */ }
  };

  return (
    <div className="flex flex-col gap-3">
      <label htmlFor={`${id}-ta`} className="text-xs font-semibold" style={{ color: th.fg3 }}>{label}</label>
      <textarea id={`${id}-ta`} value={text} onChange={(e) => change(e.target.value)} placeholder={placeholder} rows={9}
        className="w-full rounded-[8px] px-4 py-3 text-sm leading-relaxed resize-y outline-none focus-visible:ring-2"
        style={{ background: th.inputBg, border: `1px solid ${th.inputB}`, color: th.fg }} />
      <p className="text-xs" style={{ color: th.fg3 }} aria-live="polite">{status}</p>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={toggle} aria-expanded={open} aria-controls={`${id}-corrige`}
          className="sweep inline-flex items-center justify-center gap-2 rounded-[2px] font-semibold leading-[1.1] min-h-9 px-4 text-sm"
          style={{ background: "transparent", border: `1px solid ${th.ink}`, color: th.fg }}>
          {open ? "Masquer le corrigé indicatif" : "Voir un corrigé indicatif"}
        </button>
        {text.trim() && (
          <button type="button" onClick={() => void copy()} className="inline-flex items-center gap-1 text-xs font-semibold px-2 min-h-9" style={{ color: th.fg2 }}>
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}{copied ? "Copié" : "Copier mon brouillon"}
          </button>
        )}
      </div>
      {open && !written && (
        <p className="text-xs" style={{ color: th.warn }}>Rédigez d'abord votre version, puis comparez-la au corrigé : l'activité sera comptée comme réalisée.</p>
      )}
      <div id={`${id}-corrige`} hidden={!open} aria-live="polite">
        {open && (
          <div className="pg-pop rounded-[8px] px-4 py-3 text-sm flex flex-col gap-2" style={{ background: alpha("#78d5e2", th.isDark ? 0.1 : 0.12), borderLeft: "3px solid #78d5e2", color: th.fg2 }}>
            {corrige}
          </div>
        )}
      </div>
    </div>
  );
}

/** Bloc final « Pour aller plus loin sur la plateforme ». */
export function Further({ text, links, note }: { text: ReactNode; links: { label: string; to: string }[]; note?: ReactNode }) {
  const th = useTh();
  const navigate = useNavigate();
  return (
    <GCard className="p-6">
      <p className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: th.fg3 }}>Pour aller plus loin sur la plateforme</p>
      <div className="text-sm mb-4 flex flex-col gap-2" style={{ color: th.fg2 }}>{text}</div>
      <div className="flex flex-wrap gap-2">
        {links.map((l) => <VBtn key={l.label} sm onClick={() => navigate(l.to)}>{l.label}</VBtn>)}
      </div>
      {note && <p className="text-xs mt-3" style={{ color: th.fg3 }}>{note}</p>}
    </GCard>
  );
}

/* ====================================================================== */
/* Leçon 2.1 — Les bases du prompt engineering                            */
/* ====================================================================== */

const STRUCT = ["Rôle", "Cible", "Objectif", "Contexte", "Format"];

const EX1: Question[] = [
  {
    id: "ex1q1",
    boxes: [{ label: "Le prompt que vous rédigez", quote: true, text: "« Tu es une consultante SIRH qui prépare les supports de formation. Ce mail s'adresse aux collaborateurs de Cavarec Ingénierie qui vont suivre la session sur le module Entretiens annuels d'Orbiane. Rédige une convocation à cette session. Présente le mail en trois courts paragraphes, ton professionnel et chaleureux. »" }],
    legend: "Quel élément de la structure est totalement absent de ce prompt ?",
    options: STRUCT.map((s) => ({ label: s, ok: s === "Contexte" })),
    okText: "Exact : le rôle, la cible, l'objectif et le format sont bien présents dans ce prompt, mais aucune information de fond (date, heure, lieu, durée de la session) n'est donnée. Le contexte est le seul élément totalement absent.",
    koText: "Regardez à nouveau : le rôle (consultante SIRH), la cible (les collaborateurs de Cavarec Ingénierie), l'objectif (rédiger la convocation) et le format (trois paragraphes, ton professionnel) sont bien présents dans ce prompt. C'est le contexte, la date, l'heure, le lieu et la durée de la session, qui manque entièrement.",
  },
  {
    id: "ex1q2",
    boxes: [{ label: "Le prompt d'une collègue formatrice", quote: true, text: "« Tu es une consultante SIRH qui rédige des supports de formation. Cette fiche s'adresse aux salariés de Cavarec Ingénierie qui viennent de suivre la session sur le module Entretiens annuels d'Orbiane. Sélectionne et explique les trois étapes clés du processus vues en session afin qu'ils puissent les reproduire. Présente la réponse sous forme de fiche à puces, un titre par étape, sur une seule page recto. »" }],
    legend: "Quel fragment correspond à l'Objectif ?",
    options: [
      { label: "« Tu es une consultante SIRH qui rédige des supports de formation. »" },
      { label: "« Cette fiche s'adresse aux salariés de Cavarec Ingénierie… »" },
      { label: "« Sélectionne et explique les trois étapes clés du processus vues en session afin qu'ils puissent les reproduire. »", ok: true },
      { label: "« Présente la réponse sous forme de fiche à puces, un titre par étape… »" },
    ],
    okText: "Exact : cette phrase indique ce que le résultat doit accomplir — sélectionner et expliquer les trois étapes vues — sans mélanger la contrainte de présentation.",
    koText: "Le Rôle fixe la posture, la Cible désigne les salariés, l'Objectif demande de sélectionner et d'expliquer les trois étapes, et le Format impose une fiche à puces d'une page.",
  },
];

// Correction d'incohérence : dans le HTML d'origine, l'exercice 3 disait reprendre
// le prompt de l'exercice 2 (un mail en trois paragraphes) alors que ses questions
// vérifient « une liste à puces, cinq points maximum » et un ton « non technique,
// pour des salariés qui découvrent l'outil ». La mise en situation présente donc ici
// un autre prompt structuré, cohérent avec les deux questions (inchangées).
const EX3: Question[] = [
  {
    id: "ex3q1",
    legend: "Le prompt envoyé demandait explicitement une réponse « sous forme de liste à puces, cinq points maximum ». L'IA renvoie un texte rédigé, en un seul paragraphe de dix lignes, qui couvre bien le sujet demandé. Ce résultat est-il conforme au prompt ?",
    options: [
      { label: "Oui, puisque le sujet demandé est traité" },
      { label: "Non, le format demandé n'est pas respecté", ok: true },
      { label: "Oui, du moment que le contenu est correct" },
      { label: "Non, c'est le rôle qui n'est pas respecté" },
    ],
    okText: "Exact : le fond du message peut être juste, mais la forme livrée ne correspond pas à ce qui avait été demandé. Un résultat conforme respecte la forme précisée dans le prompt, pas seulement le sujet traité.",
    koText: "Le sujet correct ne suffit pas à rendre un résultat conforme. Le prompt demandait explicitement une liste à puces de cinq points maximum ; un texte rédigé en un seul paragraphe de dix lignes ne respecte pas cette consigne de format, même si le contenu est par ailleurs juste.",
  },
  {
    id: "ex3q2",
    legend: "Le même prompt demandait un ton rassurant et non technique, destiné à des salariés qui découvrent l'outil. La réponse obtenue liste bien cinq points, mais utilise des termes très techniques et un ton neutre, presque froid. Ce résultat est-il adapté à la cible visée ?",
    options: [
      { label: "Oui, puisque les cinq points attendus sont là" },
      { label: "Non, le ton ne correspond pas à la cible demandée", ok: true },
      { label: "Oui, un ton technique est toujours préférable" },
    ],
    okText: "Exact : la cible demandait un ton rassurant et non technique. Des termes très techniques et un ton froid ne correspondent pas au destinataire visé, même si les cinq points attendus sont bien présents.",
    koText: "Le nombre de points attendus est respecté, mais ce n'est pas ce qui est en cause ici. Le ton employé (technique, froid) ne correspond pas à ce que la cible demandait (rassurant, non technique) : le résultat n'est donc pas adapté à son destinataire.",
  },
];

const score21: ScoreText = ({ correct, total, pct }) =>
  `Score : ${correct} / ${total} (${pct} %). ${pct >= 80 ? "Bon niveau de maîtrise sur cet exercice." : "Reprenez les questions en rouge avant de continuer."}`;

export default function Pg21(_props: PlaygroundProps) {
  const th = useTh();
  const activities: Activity[] = [
    {
      nav: "Repérer les cinq éléments",
      title: "Exercice 1 : repérer ce qui manque ou ce qui est présent",
      tag: "Noté · seuil 80 %",
      fictive: true,
      intro: <p>Vous préparez une session chez <strong style={{ color: th.fg }}>Cavarec Ingénierie</strong>, sur le module <strong style={{ color: th.fg }}>Entretiens annuels</strong> de l'outil SIRH <strong style={{ color: th.fg }}>Orbiane</strong>. L'explication s'affiche dès que vous choisissez une réponse ; le bouton calcule votre score.</p>,
      render: (done) => <Quiz questions={EX1} instant onComplete={done} scoreText={score21} tint={PG_TINTS[0]} />,
      retain: <>Cinq décisions distinctes à prendre avant la génération : Rôle, Cible, Objectif, Contexte, Format. Un élément peut manquer sans que le prompt « paraisse » incomplet : le Contexte (date, heure, lieu, durée) est souvent celui qu'on oublie, et l'Objectif dit ce que le résultat doit accomplir, sans se confondre avec sa présentation.</>,
    },
    {
      nav: "Reconstruire un prompt",
      title: "Exercice 2 : reconstruire un prompt et justifier vos choix",
      tag: "Non noté · corrigé indicatif",
      fictive: true,
      intro: (
        <>
          <p>Toujours chez Cavarec Ingénierie, sur la session Entretiens annuels / Orbiane. Votre interlocutrice RH vous écrit simplement :</p>
          <Box label="La demande brute" quote>« Peux-tu nous faire un mail pour prévenir tout le monde du changement de date de la session Orbiane ? »</Box>
          <p>Ce n'est pas encore un prompt exploitable : c'est la demande brute de votre interlocutrice. À vous de le transformer en prompt structuré selon Rôle, Cible, Objectif, Contexte, Format, puis de justifier en quelques lignes ce que chaque ajout change concrètement par rapport à la demande brute ci-dessus. Cet exercice n'est pas noté automatiquement : rédigez votre réponse, puis comparez-la au corrigé indicatif.</p>
        </>
      ),
      render: (done) => (
        <DraftExercise storageKey="nathalie_playground_2_1_ex2" onComplete={done}
          label="Votre prompt reconstruit et votre justification"
          placeholder="Votre prompt reconstruit (les cinq éléments) puis votre justification..."
          corrige={
            <>
              <p><strong style={{ color: th.fg }}>Rôle</strong> : Tu es une consultante SIRH qui rédige des communications aux collaborateurs pour le compte de ses clients.</p>
              <p><strong style={{ color: th.fg }}>Cible</strong> : Ce mail s'adresse à l'ensemble des collaborateurs de Cavarec Ingénierie déjà inscrits à la session sur le module Entretiens annuels d'Orbiane.</p>
              <p><strong style={{ color: th.fg }}>Objectif</strong> : Rédige un mail annonçant le changement de date de cette session et invitant chacun à noter la nouvelle date dans son agenda.</p>
              <p><strong style={{ color: th.fg }}>Contexte</strong> : La session initialement prévue le [date] est reportée au [nouvelle date], même heure, même lieu ; la raison du report n'a pas besoin d'être détaillée.</p>
              <p><strong style={{ color: th.fg }}>Format</strong> : Mail court, trois paragraphes maximum, ton professionnel et rassurant, objet du mail inclus.</p>
              <p><strong style={{ color: th.fg }}>Justification</strong> : chaque élément répond à une question que la demande brute laissait ouverte : qui écrit (Rôle), à qui (Cible), pour dire quoi exactement (Objectif), à partir de quelles informations réelles (Contexte), sous quelle forme (Format). La demande initiale (« un mail pour prévenir tout le monde ») ne précisait aucun de ces points : le résultat obtenu aurait pu varier fortement en ton, en longueur et même dans la façon d'annoncer le changement.</p>
            </>
          } />
      ),
      retain: <>Une demande brute n'est pas un prompt. Chaque élément ajouté répond à une question qu'elle laissait ouverte : qui écrit, à qui, pour dire quoi, à partir de quelles informations réelles, sous quelle forme. Sans ces choix, le modèle comble les vides avec les options les plus probables, pas avec votre contexte.</>,
    },
    {
      nav: "Adapté et conforme ?",
      title: "Exercice 3 : vérifier qu'un résultat est adapté et conforme",
      tag: "Noté · seuil 80 %",
      fictive: true,
      intro: <p>Un autre prompt structuré a été envoyé, cette fois pour une fiche de prise en main destinée aux salariés de Cavarec Ingénierie qui découvrent le module Entretiens annuels d'Orbiane. Deux vérifications s'imposent avant de diffuser le résultat : est-il adapté au besoin, et conforme à ce qui a été demandé ?</p>,
      render: (done) => <Quiz questions={EX3} instant onComplete={done} scoreText={score21} tint={PG_TINTS[2]} />,
      retain: <>Deux vérifications distinctes. <strong>Conforme</strong> : la forme livrée est-elle celle qui était précisée ? <strong>Adapté</strong> : le fond et le ton correspondent-ils réellement à la cible ? Un résultat peut respecter parfaitement le format tout en étant faux, incomplet ou impropre à la diffusion : un second contrôle, indépendant, reste nécessaire.</>,
    },
  ];

  return (
    <PgShell lesson="2.1"
      title={<>Mettre en pratique la <span className="hl">structure en cinq éléments</span></>}
      intro="Trois exercices ancrés dans des situations de préparation de formation SIRH, pour manipuler directement Rôle, Cible, Objectif, Contexte et Format sur des cas proches de ce que vous rédigez réellement. Chaque exercice noté a son propre bouton de correction et son propre score."
      activities={activities}
      further={
        <Further
          text={<p>Entraînez-vous sur d'autres cas dans les Exercices prompts : chaque tentative est notée sur 20, avec les repères Rôle, Contexte, Tâche, Format, Ton & public et Contraintes. Testez ensuite votre prompt reconstruit dans le Studio.</p>}
          links={[
            { label: "Exercices · Prompts (note sur 20)", to: "/practice/prompts" },
            { label: "Studio · ChatGPT", to: "/studio/chatgpt" },
            { label: "Studio · Claude", to: "/studio/claude" },
            { label: "Studio · Gemini", to: "/studio/gemini" },
          ]} />
      } />
  );
}
