import { useEffect, useId, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
import { ArrowRight, Check, Copy, Download } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { GCard } from "@/app/components/common/GCard";
import { ShimBtn, VBtn } from "@/app/components/common/Buttons";
import type { PlaygroundProps } from "@/app/playgrounds/registry";
import { Chip, Hero, ProgressRing, alpha, celebrate } from "@/app/playgrounds/ui";

// Playground natif de la leçon 1.4 « Reconnaître les informations à protéger »
// (version SIRH de Nathalie), converti depuis
// docs/formation-rs6776/lecon-1.4/playground-nathalie.html :
//  1. À protéger, et pour qui ? (niveau de protection et provenance de quatre informations) ;
//  2. Est-ce déjà le bon réflexe ? (quatre décisions de réutilisation).

const TINTS = ["#dbacf0", "#78d5e2"];

export default function Pg14({ params }: PlaygroundProps) {
  void params;
  const th = useTh();
  const [step, setStep] = useState(0);
  const [done, setDone] = useState<boolean[]>([false, false]);
  const markDone = (i: number) => setDone((d) => d.map((v, j) => (j === i ? true : v)));
  const navRef = useRef<HTMLElement>(null);
  const doneCount = done.filter(Boolean).length;
  const prevDone = useRef(0);
  useEffect(() => {
    if (doneCount > prevDone.current) celebrate(navRef.current, 0.6);
    prevDone.current = doneCount;
  }, [doneCount]);

  const steps = ["À protéger, et pour qui ?", "Est-ce déjà le bon réflexe ?"];

  return (
    <div className="flex flex-col gap-5">
      <Hero>
        <div className="flex flex-col md:flex-row md:items-center gap-5 md:pr-24">
          <div className="flex-1">
            <p className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: th.fg3 }}>Playground · Leçon 1.4</p>
            <h2 className="text-2xl md:text-3xl font-semibold leading-tight mb-2" style={{ color: th.fg }}>Nathalie, reconnaissez ce qu'il faut <span className="hl">protéger</span></h2>
            <p className="text-sm max-w-[70ch] mb-2" style={{ color: th.fg2 }}>
              Ce Playground reprend votre quotidien de consultante SIRH indépendante, en mission chez plusieurs clients en parallèle.
              Toutes les données proposées sont fictives : n'utilisez aucune information réelle de vos clients.
            </p>
            <p className="text-sm max-w-[70ch]" style={{ color: th.fg2 }}>
              Deux temps : classer des informations selon leur niveau de protection et leur provenance, puis vérifier vos décisions de
              réutilisation. Ici, « donnée sensible » garde son sens juridique strict ; les autres contenus sont appelés informations à protéger.
            </p>
          </div>
          <ProgressRing value={doneCount / steps.length} label="réalisé" />
        </div>
      </Hero>

      <div className="rounded-[12px] px-5 py-4 text-sm" style={{ background: alpha(TINTS[0], th.isDark ? 0.12 : 0.14), border: `1px solid ${alpha(TINTS[0], 0.7)}`, color: th.fg2 }}>
        <span className="block text-[11px] font-bold uppercase tracking-widest mb-1" style={{ color: th.fg }}>Un repère avant de commencer</span>
        Pour vous, l'interne, c'est votre propre activité : vos tarifs, votre méthode, votre liste de clients. Tout le reste est externe,
        y compris ce qu'un client considère lui-même comme interne chez lui.
      </div>

      <ActivityNav navRef={navRef} steps={steps} step={step} done={done} onSelect={setStep} />

      {step === 0 && (
        <Quiz key="q1" tint={TINTS[0]} title="À protéger, et pour qui ?" fictive
          intro="Pour chaque information, choisissez son niveau de protection dans ce contexte et sa provenance de votre point de vue."
          questions={EX1} onDone={() => markDone(0)} onNext={() => setStep(1)}
          retain="Deux questions distinctes : faut-il protéger cette information, et à qui appartient-elle ? Votre tarif est interne et à protéger sans être une donnée sensible au sens de l'article 9 ; les données du personnel d'un client sont externes pour vous. Anonymiser des personnes ne transfère ni la propriété ni le droit de réutiliser un support." />
      )}
      {step === 1 && (
        <Quiz key="q2" tint={TINTS[1]} title="Est-ce déjà le bon réflexe ?" fictive
          intro="Vous travaillez avec plusieurs structures clientes en parallèle. Pour chaque comportement décrit, dites s'il s'agit déjà du bon réflexe."
          questions={EX2} onDone={() => markDone(1)}
          retain="Lisez chaque document fragment par fragment : chaque nom, chaque chiffre, chaque situation individuelle. Cloisonnez mission par mission, une conversation par client. Et une information publique n'est pas pour autant libre de droits, exacte ou à jour : vérifiez la source, la date, les droits et les données personnelles résiduelles." />
      )}

      <ContinueOnPlatform />

      <p className="text-xs px-1" style={{ color: th.fg3 }}>
        Toutes les entreprises, personnes et données de cet exercice sont fictives. Ce support ne remplace pas la politique interne de
        vos clients ni les consignes de leur DSI ou de leur DPO.
      </p>
    </div>
  );
}

/* ---------- Données des exercices (reprises du HTML) ---------- */

const LEVELS: Opt[] = [
  { v: "safe", l: "Public, pas de restriction de confidentialité indiquée" },
  { v: "int", l: "À protéger, interne" },
  { v: "ext", l: "À protéger, externe" },
];
const YESNO: Opt[] = [{ v: "oui", l: "Oui, bon réflexe" }, { v: "non", l: "Non, pas encore" }];

const EX1: Q[] = [
  {
    legend: "Le nom de la solution SIRH que vous recommandez le plus souvent, déjà mentionné sur votre propre site professionnel.",
    options: LEVELS, answer: "safe",
    ok: "Exact pour la confidentialité : le nom est déjà public. Avant réutilisation, vérifiez néanmoins la version, l'exactitude, les droits et la finalité.",
    why: "Public ne signifie pas libre de droits ni toujours à jour. La catégorie indique seulement qu'aucune restriction de confidentialité n'est visible dans ce scénario fictif.",
  },
  {
    legend: "Le montant de votre tarif journalier, que vous n'avez pas encore communiqué à un nouveau prospect.",
    options: LEVELS, answer: "int",
    ok: "Exact. C'est une information commerciale non encore communiquée, interne et à protéger, sans être une donnée sensible au sens de l'article 9.",
    why: "Cette information concerne votre propre activité ; son caractère confidentiel vient du contexte de négociation.",
  },
  {
    legend: "L'organigramme complet d'un client, avec les noms et fonctions de chaque salarié, transmis pour préparer un paramétrage SIRH.",
    options: LEVELS, answer: "ext",
    ok: "Exact. Ces informations concernent le personnel d'un client, un tiers pour vous : ce sont des données personnelles à protéger, et externes, même si ce client les considère comme internes chez lui.",
    why: "Le fait que cette information soit interne pour le client ne change rien à sa provenance de votre point de vue : elle concerne un tiers, elle est donc externe pour vous.",
  },
  {
    legend: "Une capture d'écran du tableau de bord SIRH d'un client, entièrement anonymisée, utilisée pour illustrer une méthode générale auprès d'un autre client.",
    options: LEVELS, answer: "ext",
    ok: "Exact. Même si aucune personne n'est identifiable, l'interface, la configuration ou le contenu peut rester confidentiel et appartenir au client source. Une autorisation explicite est nécessaire avant de l'utiliser chez un autre client.",
    why: "Anonymiser les personnes ne transfère ni les droits de réutilisation ni la propriété du support. La capture reste une information externe à protéger tant que le client n'a pas autorisé cet usage.",
  },
];

const EX2: Q[] = [
  {
    legend: "Avant de coller un compte-rendu de réunion dans un outil d'IA, vous relisez chaque nom, chaque chiffre et chaque situation individuelle qu'il contient, plutôt que de juger le document dans son ensemble.",
    options: YESNO, answer: "oui",
    ok: "Exact. Lire un document fragment par fragment, plutôt que de le juger dans son ensemble, est exactement le réflexe vu dans cette leçon.",
    why: "Juger un document dans son ensemble, sans repasser sur chaque nom, chaque chiffre et chaque situation individuelle, risque de laisser passer un fragment à protéger noyé dans un contenu par ailleurs anodin.",
  },
  {
    legend: "Parce qu'une information concerne le personnel d'un de vos clients, vous considérez qu'elle est interne à ce client, et qu'elle ne présente donc pas de risque particulier pour vous.",
    options: YESNO, answer: "non",
    ok: "Exact. Interne au client ne veut pas dire sans risque : de votre point de vue, cette information reste externe et à protéger.",
    why: "Le fait qu'une information soit interne pour le client dont elle parle ne change rien à sa provenance de votre point de vue : elle concerne un tiers, donc elle reste externe, et le besoin de la protéger n'a pas disparu.",
  },
  {
    legend: "Vous utilisez la même conversation avec un outil d'IA pour avancer sur deux missions différentes, chez deux clients différents, le même après-midi.",
    options: YESNO, answer: "non",
    ok: "Exact. Mélanger, dans le même échange, des données de deux clients différents revient à ne plus cloisonner ce qui devrait rester séparé.",
    why: "Même sans intention, faire avancer deux missions dans la même conversation expose à mêler des informations qui n'ont pas à se croiser : le cloisonnement se fait mission par mission, pas seulement entre vous et l'extérieur.",
  },
  {
    legend: "Vous considérez qu'une information déjà publique, par exemple déjà présente sur le site internet d'un client, ne nécessite plus de précaution particulière avant d'être réutilisée.",
    options: YESNO, answer: "non",
    ok: "Exact. Une information publique n'est pas nécessairement libre de droits, exacte, actuelle ou autorisée pour la finalité envisagée. Vérifiez la source, la date, les droits et les données personnelles résiduelles.",
    why: "Le caractère public réduit un risque de confidentialité, mais ne supprime pas les autres contrôles avant réutilisation.",
  },
];

/* ---------- Pour aller plus loin ---------- */

function ContinueOnPlatform() {
  const th = useTh();
  return (
    <GCard className="p-6">
      <p className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: th.fg3 }}>Pour aller plus loin sur la plateforme</p>
      <p className="text-sm" style={{ color: th.fg2 }}>
        Ouvrez le Copilote, dans le panneau de droite de cette leçon, et lancez l'action rapide « Crash test 2 min » pour un court test
        de vos réflexes. Si vous citez un exemple, qu'il soit fictif.
      </p>
      <p className="text-xs mt-3" style={{ color: th.fg3 }}>
        Sur mobile, le Copilote est fermé par défaut : ouvrez-le depuis la page de la leçon.
      </p>
    </GCard>
  );
}

/* ---------- Commun ---------- */

type Opt = { v: string; l: string };
type Q = { legend: string; options: Opt[]; answer: string; ok: string; why: string };

function ActivityNav({ navRef, steps, step, done, onSelect }: { navRef: RefObject<HTMLElement>; steps: string[]; step: number; done: boolean[]; onSelect: (i: number) => void }) {
  const th = useTh();
  return (
    <nav ref={navRef} className="grid grid-cols-1 sm:grid-cols-2 gap-2" aria-label="Activités">
      {steps.map((label, i) => {
        const tint = TINTS[i % TINTS.length];
        const active = step === i;
        return (
          <button key={label} type="button" onClick={() => onSelect(i)} aria-current={active ? "step" : undefined}
            className="pg-tile flex items-center gap-2.5 rounded-[12px] px-3 py-3 text-left text-xs font-semibold"
            style={{ background: active ? `linear-gradient(135deg, ${alpha(tint, 0.9)}, ${alpha(tint, 0.55)})` : alpha(tint, th.isDark ? 0.1 : 0.12), border: `1px solid ${alpha(tint, active ? 1 : 0.5)}`, color: active ? "#111" : th.fg }}>
            <span className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold" style={{ background: done[i] ? "var(--grad-iris)" : active ? "rgba(255,255,255,.55)" : alpha(tint, 0.35), color: "#111" }}>
              {done[i] ? <Check className="w-3.5 h-3.5" aria-label="Terminée" /> : i + 1}
            </span>
            {label}
          </button>
        );
      })}
    </nav>
  );
}

function ActivityCard({ tint, title, fictive, children }: { tint: string; title: string; fictive?: boolean; children: ReactNode }) {
  const th = useTh();
  return (
    <GCard className="p-6">
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className="w-2.5 h-2.5 rounded-full" style={{ background: tint }} aria-hidden />
        <h3 className="text-lg font-semibold flex-1" style={{ color: th.fg }}>{title}</h3>
        {fictive && <Chip tint={tint}>Exemple fictif</Chip>}
      </div>
      {children}
    </GCard>
  );
}

function Quiz({ tint, title, intro, questions, fictive, retain, onDone, onNext }: {
  tint: string; title: string; intro: string; questions: Q[]; fictive?: boolean; retain: string; onDone: () => void; onNext?: () => void;
}) {
  const th = useTh();
  const [picks, setPicks] = useState<Record<number, string>>({});
  const [graded, setGraded] = useState<Record<number, string> | null>(null);
  const scoreRef = useRef<HTMLDivElement>(null);
  const uid = useId();
  // Ordre des choix mélangé une fois par affichage (la bonne réponse n'est pas toujours la première).
  const orders = useMemo(() => questions.map((q) => (q.options.length > 2 ? [...q.options].sort(() => Math.random() - 0.5) : q.options)), [questions]);
  const n = questions.length;
  const threshold = Math.max(1, Math.ceil(n * 0.8));
  const answered = graded ? Object.keys(graded).length : 0;
  const score = graded ? questions.filter((q, i) => graded[i] === q.answer).length : 0;
  const complete = !!graded && answered === n;

  const grade = () => {
    const snap = { ...picks };
    setGraded(snap);
    if (Object.keys(snap).length === n) { onDone(); celebrate(scoreRef.current, 0.7); }
  };

  let message = `Répondez aux ${n} questions`;
  if (graded) {
    if (answered < n) message = `${answered}/${n} réponses données. Score provisoire : ${score}/${n}.`;
    else if (score === n) message = `${score}/${n}. Tout est juste.`;
    else if (score >= threshold) message = `${score}/${n}. Relisez les retours en couleur, puis continuez.`;
    else message = `${score}/${n}. Relisez les retours en couleur avant de poursuivre.`;
  }

  return (
    <ActivityCard tint={tint} title={title} fictive={fictive}>
      <p className="text-sm mb-4" style={{ color: th.fg2 }}>{intro}</p>
      <ol className="flex flex-col gap-3">
        {questions.map((q, i) => {
          const g = graded?.[i];
          const status = !graded ? null : g === undefined ? "missing" : g === q.answer ? "ok" : "ko";
          const border = status === "ok" ? th.success : status === "ko" || status === "missing" ? th.danger : th.sep;
          const legendId = `${uid}-q${i}`;
          return (
            <li key={q.legend} className="rounded-[10px] p-4" style={{ border: `1px solid ${border}` }}>
              <p id={legendId} className="text-sm mb-3" style={{ color: th.fg }}><strong>{i + 1}.</strong> {q.legend}</p>
              <div role="group" aria-labelledby={legendId} className="flex flex-col sm:flex-row sm:flex-wrap gap-2">
                {orders[i].map((o) => {
                  const on = picks[i] === o.v;
                  return (
                    <button key={o.v} type="button" aria-pressed={on} onClick={() => setPicks((p) => ({ ...p, [i]: o.v }))}
                      className="text-left rounded-[4px] px-3 py-2 text-sm"
                      style={on ? { background: alpha(tint, th.isDark ? 0.3 : 0.35), border: `1px solid ${tint}`, color: th.fg } : { border: `1px solid ${th.sep}`, color: th.fg2 }}>
                      {o.l}
                    </button>
                  );
                })}
              </div>
              <p className="text-sm mt-3 empty:hidden" aria-live="polite" style={{ color: status === "ok" ? th.success : th.fg2 }}>
                {status === "missing" && "Choisissez une réponse."}
                {status === "ok" && q.ok}
                {status === "ko" && <><strong style={{ color: th.danger }}>À revoir.</strong> {q.why}</>}
              </p>
            </li>
          );
        })}
      </ol>
      <div ref={scoreRef} className="flex flex-wrap items-center gap-3 mt-4">
        <ShimBtn sm onClick={grade}>Corriger mes réponses</ShimBtn>
        <span role="status" aria-live="polite" className="text-sm font-semibold"
          style={{ color: !graded ? th.fg3 : score >= threshold ? th.success : th.warn }}>{message}</span>
      </div>
      {complete && <Retain>{retain}</Retain>}
      {complete && onNext && <div className="mt-4"><ShimBtn sm onClick={onNext}>Activité suivante <ArrowRight className="w-4 h-4" /></ShimBtn></div>}
    </ActivityCard>
  );
}

function Retain({ children }: { children: ReactNode }) {
  const th = useTh();
  return (
    <div className="pg-pop mt-4 rounded-[10px] px-4 py-3 text-sm" style={{ background: alpha("#b58de0", th.isDark ? 0.12 : 0.14), borderLeft: "3px solid #b58de0", color: th.fg2 }}>
      <span className="block text-[11px] font-bold uppercase tracking-widest mb-1" style={{ color: th.fg }}>Ce qu'il faut retenir</span>
      {children}
    </div>
  );
}

function ExportBar({ filename, build, downloadLabel }: { filename: string; build: () => string; downloadLabel: string }) {
  const [copied, setCopied] = useState(false);
  const download = () => {
    const url = URL.createObjectURL(new Blob([build()], { type: "text/plain;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const copy = async () => {
    try { await navigator.clipboard.writeText(build()); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* presse-papiers refusé */ }
  };
  return (
    <div className="flex flex-wrap items-center gap-2 mt-5">
      <VBtn sm onClick={download}><Download className="w-4 h-4" />{downloadLabel}</VBtn>
      <VBtn sm onClick={() => void copy()}>{copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}{copied ? "Copié" : "Copier le texte"}</VBtn>
      <span className="sr-only" aria-live="polite">{copied ? "Texte copié dans le presse-papiers" : ""}</span>
    </div>
  );
}

function useStored<T>(key: string, init: () => T, valid: (v: unknown) => boolean): [T, (u: T | ((p: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) { const parsed = JSON.parse(raw); if (valid(parsed)) return parsed as T; }
    } catch { /* stockage indisponible */ }
    return init();
  });
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* stockage indisponible : pas de sauvegarde automatique */ }
  }, [key, value]);
  return [value, setValue];
}
