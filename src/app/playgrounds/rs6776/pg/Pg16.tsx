import { useEffect, useId, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
import { useNavigate } from "react-router";
import { ArrowRight, Check, Copy, Download, ExternalLink, Plus, Trash2 } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { GCard } from "@/app/components/common/GCard";
import { ShimBtn, VBtn } from "@/app/components/common/Buttons";
import type { PlaygroundProps } from "@/app/playgrounds/registry";
import { Chip, Hero, ProgressRing, TOOL_TINT, alpha, celebrate } from "@/app/playgrounds/ui";
import { TOOL_SHEETS } from "../tools";

// Playground natif de la leçon 1.6 « Élaborer son plan d'actions IA »
// (version SIRH de Nathalie), converti depuis
// docs/formation-rs6776/lecon-1.6/playground-nathalie.html :
//  1. Que faire de ces trois tâches ? (impact × risque) ;
//  2. Est-ce déjà le bon réflexe ? (cinq comportements) ;
//  3. Mon plan d'actions IA (trois hypothèses de départ à compléter, lignes ajoutables).

const TINTS = ["#6adeb1", "#dbacf0", "#b58de0"];
const STORAGE_KEY = "pg-rs6776-1.6-sirh-plan";

export default function Pg16({ params }: PlaygroundProps) {
  void params;
  const th = useTh();
  const [step, setStep] = useState(0);
  const [done, setDone] = useState<boolean[]>([false, false, false]);
  const markDone = (i: number) => setDone((d) => d.map((v, j) => (j === i ? true : v)));
  const navRef = useRef<HTMLElement>(null);
  const doneCount = done.filter(Boolean).length;
  const prevDone = useRef(0);
  useEffect(() => {
    if (doneCount > prevDone.current) celebrate(navRef.current, 0.6);
    prevDone.current = doneCount;
  }, [doneCount]);

  const steps = ["Que faire de ces trois tâches ?", "Est-ce déjà le bon réflexe ?", "Mon plan d'actions IA"];

  return (
    <div className="flex flex-col gap-5">
      <Hero>
        <div className="flex flex-col md:flex-row md:items-center gap-5 md:pr-24">
          <div className="flex-1">
            <p className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: th.fg3 }}>Playground · Leçon 1.6</p>
            <h2 className="text-2xl md:text-3xl font-semibold leading-tight mb-2" style={{ color: th.fg }}>Nathalie, construisez <span className="hl">votre plan</span></h2>
            <p className="text-sm max-w-[70ch] mb-2" style={{ color: th.fg2 }}>
              Ce Playground reprend votre quotidien de consultante SIRH. Toutes les données proposées sont fictives, sauf vos propres
              tâches, que vous avez déjà décrites : n'utilisez aucune information réelle de vos clients.
            </p>
            <p className="text-sm max-w-[70ch]" style={{ color: th.fg2 }}>
              Trois temps : prioriser les tâches qu'il vous reste à classer, vérifier vos réflexes sur votre activité multi-clients,
              puis construire les premières lignes de votre propre plan d'actions IA.
            </p>
          </div>
          <ProgressRing value={doneCount / steps.length} label="réalisé" />
        </div>
      </Hero>

      <ActivityNav navRef={navRef} steps={steps} step={step} done={done} onSelect={setStep} />

      {step === 0 && (
        <Quiz key="q1" tint={TINTS[0]} title="Que faire de ces trois tâches ?"
          intro="Vous avez déjà classé vos comptes-rendus, vos offres d'emploi et votre paramétrage SIRH dans une leçon précédente. Il reste trois tâches réelles de votre activité à passer par la même grille : impact d'un côté, risque de l'autre."
          questions={EX1} onDone={() => markDone(0)} onNext={() => setStep(1)}
          retain="Prioritaire maintenant : un fort impact et un risque faible ou maîtrisé. Un risque faible ne suffit pas sans impact comparable aux autres candidats, et un fort impact ne suffit pas si le risque reste élevé : la tâche reste sur la liste, après les plus sûres." />
      )}
      {step === 1 && (
        <Quiz key="q2" tint={TINTS[1]} title="Est-ce déjà le bon réflexe ?" fictive
          intro="Vous travaillez avec plusieurs structures clientes en parallèle. Pour chaque comportement décrit, dites s'il s'agit déjà du bon réflexe."
          questions={EX2} onDone={() => markDone(1)} onNext={() => setStep(2)}
          retain="Commencez par deux ou trois tâches, pas par tout. Anticipez les obstacles avant la mise en œuvre (validation du client, budget, temps d'apprentissage), mesurez le temps gagné sur une base comparable, et adaptez le plan à chaque client : un choix validé chez l'un ne se transpose pas chez l'autre." />
      )}
      {step === 2 && <ActionPlan tint={TINTS[2]} onDone={() => markDone(2)} />}

      <ContinueOnPlatform />

      <p className="text-xs px-1" style={{ color: th.fg3 }}>
        Toutes les entreprises, personnes et données chiffrées de cet exercice sont fictives. Ce support ne remplace pas la politique
        interne de vos clients ni les consignes de leur DSI ou de leur DPO.
      </p>
    </div>
  );
}

/* ---------- Données des exercices 1 et 2 (reprises du HTML) ---------- */

const PRIORITY: Opt[] = [
  { v: "now", l: "Prioritaire maintenant" },
  { v: "later", l: "Fort impact, plus tard" },
  { v: "skip", l: "Pas encore une priorité" },
];
const YESNO: Opt[] = [{ v: "oui", l: "Oui, bon réflexe" }, { v: "non", l: "Non, pas encore" }];

const EX1: Q[] = [
  {
    legend: "Vos mails clients, 4 h par semaine : structures qui reviennent (confirmation de rendez-vous, relance, transmission d'informations), déjà traités quotidiennement avec l'aide de l'IA.",
    options: PRIORITY, answer: "now",
    ok: "Exact. Volume élevé, structures qui reviennent, aucun nouvel outil à apprendre : les conditions d'une priorité immédiate sont réunies, sous réserve de rester vigilante sur les informations propres à chaque client.",
    why: "Un fort impact et un risque faible ou maîtrisé : c'est le profil d'une tâche prioritaire maintenant, pas d'une tâche à garder pour plus tard.",
  },
  {
    legend: "Vos articles, 1 h 30 par semaine : rédaction qui engage votre propre point de vue, sans nom ni détail propre à un client.",
    options: PRIORITY, answer: "skip",
    ok: "Exact. Le risque est très faible, mais l'impact reste modeste face à vos autres tâches, et la rédaction d'un article engage davantage votre propre angle qu'un compte-rendu ou un mail type.",
    why: "Un risque faible ne suffit pas à lui seul : sans impact comparable à vos autres candidats, cette tâche n'a pas sa place parmi les toutes premières lignes du plan.",
  },
  {
    legend: "La formation des utilisateurs du SIRH chez vos clients, 3 h par semaine : sessions en direct, avec parfois des fiches salarié ou des bulletins de paie réels visibles à l'écran pendant la démonstration.",
    options: PRIORITY, answer: "later",
    ok: "Exact. Le volume est réel, mais des fiches salarié ou bulletins de paie réels restent visibles à l'écran pendant les sessions, et la relation pédagogique en direct reste fondamentalement humaine : l'IA n'y a qu'un rôle de préparation en amont.",
    why: "Un fort impact en temps ne suffit pas si le risque associé (fiches salarié visibles en session) reste élevé et si la nature même de la tâche limite ce que l'IA peut y apporter : elle reste sur la liste, mais après les tâches plus sûres.",
  },
];

const EX2: Q[] = [
  {
    legend: "Vous ajoutez vos six tâches réelles à votre plan en même temps, dès la première semaine.",
    options: YESNO, answer: "non",
    ok: "Exact. La méthode consiste à retenir deux à trois tâches pour commencer, pas l'ensemble d'un coup.",
    why: "Un plan qui liste trop de tâches en même temps ne se met généralement pas en œuvre : commencer petit est exactement le bon réflexe.",
  },
  {
    legend: "Avant de changer la façon dont vous traitez les dossiers d'un client avec l'aide de l'IA, vous lui demandez son accord.",
    options: YESNO, answer: "oui",
    ok: "Exact. Cette validation se prépare avant la mise en œuvre, pas après coup.",
    why: "Demander l'accord d'un client avant de changer la façon dont vous traitez ses dossiers avec l'aide de l'IA est exactement la validation nécessaire vue dans la leçon.",
  },
  {
    legend: "Pour une nouvelle mission, vous retenez un outil nécessitant un compte payant, sans avoir vérifié le coût de l'abonnement au préalable.",
    options: YESNO, answer: "non",
    ok: "Exact. Le budget éventuel doit être identifié avant de compter sur la justification prévue, pas découvert après coup.",
    why: "Retenir un outil sans avoir vérifié son coût revient à ignorer l'un des trois obstacles à anticiper avant la mise en œuvre.",
  },
  {
    legend: "Vous comparez le temps passé sur un compte-rendu avant et après avoir utilisé l'IA, pour vérifier le gain réel.",
    options: YESNO, answer: "oui",
    ok: "Exact. C'est l'indicateur de temps gagné, mesuré sur une base comparable.",
    why: "Comparer le temps passé avant et après, sur une tâche comparable, est exactement la façon de mesurer cet indicateur.",
  },
  {
    legend: "Pour une nouvelle mission chez un client, vous reprenez tel quel le plan déjà validé chez un autre client.",
    options: YESNO, answer: "non",
    ok: "Exact. Chaque structure a ses propres priorités, son propre budget et sa propre tolérance au risque : un choix validé pour l'une ne se transpose pas automatiquement à une autre.",
    why: "Reprendre tel quel un plan validé ailleurs revient à ignorer que chaque mission a son propre contexte, ce qui peut transposer par erreur un choix jamais vérifié pour ce client précis.",
  },
];

/* ---------- 3. Mon plan d'actions IA ---------- */

type Row = { id: string; tache: string; freq: string; outil: string; justif: string; budget: string; delai: string; validation: string; indicateur: string };
type FieldKey = Exclude<keyof Row, "id">;

const FIELDS: { k: FieldKey; label: string; long?: boolean }[] = [
  { k: "tache", label: "Tâche cible" },
  { k: "freq", label: "Fréquence" },
  { k: "outil", label: "Outil choisi" },
  { k: "budget", label: "Budget éventuel" },
  { k: "delai", label: "Délai de mise en œuvre" },
  { k: "validation", label: "Responsable ou valideur" },
  { k: "indicateur", label: "Indicateur et situation de départ", long: true },
  { k: "justif", label: "Justification", long: true },
];
const SUMMARY_ORDER: FieldKey[] = ["freq", "outil", "justif", "budget", "delai", "validation", "indicateur"];

const DEFAULT_ROWS: Row[] = [
  { id: "r1", tache: "Rédiger mes comptes-rendus de réunion", freq: "Hebdomadaire",
    outil: "Outil autorisé à confirmer",
    justif: "Hypothèse : gagner 20 minutes par occurrence sur trois essais fictifs. Comparer le brouillon aux notes et relever toute erreur ou omission.",
    budget: "À confirmer : offre, période et utilisateurs", delai: "",
    validation: "Nathalie, avant toute diffusion", indicateur: "Référence à mesurer ; cible : temps total réduit et 0 erreur de décision, date ou montant sur 3 essais" },
  { id: "r2", tache: "Rédiger et traiter mes mails clients", freq: "Hebdomadaire",
    outil: "Outil autorisé à confirmer",
    justif: "Hypothèse à chronométrer sur des cas fictifs. Contrôler le sens, les engagements, les destinataires et les informations à protéger.",
    budget: "À confirmer : offre, période et utilisateurs", delai: "",
    validation: "Nathalie, avant envoi", indicateur: "Référence à mesurer ; cible : temps total réduit, 0 engagement ou donnée ajoutés" },
  { id: "r3", tache: "Rédiger des offres d'emploi", freq: "À chaque nouveau poste à pourvoir",
    outil: "Outil à confirmer avec le client",
    justif: "Structure connue, matière fournie par le brief client. Vérifier les éléments chiffrés (rémunération, avantages) avant envoi, un outil pouvant être tenté de les inventer.",
    budget: "À préciser selon le client", delai: "",
    validation: "Nathalie puis valideur client si requis", indicateur: "Référence à mesurer ; cible : 0 critère inventé ou discriminatoire, mentions et chiffres exacts" },
];
const emptyRow = (): Row => ({ id: `r${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, tache: "", freq: "", outil: "", justif: "", budget: "", delai: "", validation: "", indicateur: "" });
const isComplete = (r: Row) => FIELDS.every((f) => r[f.k].trim().length > 0);

function ActionPlan({ tint, onDone }: { tint: string; onDone: () => void }) {
  const th = useTh();
  const uid = useId();
  const [rows, setRows] = useStored<Row[]>(STORAGE_KEY, () => DEFAULT_ROWS,
    (v) => Array.isArray(v) && v.every((r) => r && typeof r.id === "string"));
  const statusRef = useRef<HTMLDivElement>(null);
  const completeCount = rows.filter(isComplete).length;
  const ok = completeCount > 0;
  const wasOk = useRef(ok);
  useEffect(() => {
    if (ok) onDone();
    if (ok && !wasOk.current) celebrate(statusRef.current, 0.8);
    wasOk.current = ok;
  }, [ok]);

  const set = (id: string, k: FieldKey, v: string) => setRows((rs) => rs.map((r) => (r.id === id ? { ...r, [k]: v } : r)));
  const summary = () => {
    const lines = ["Mon plan d'actions IA", ""];
    rows.forEach((r, i) => {
      lines.push(`Ligne ${i + 1} : ${r.tache || "(tâche non renseignée)"}`);
      SUMMARY_ORDER.forEach((k) => lines.push(`- ${FIELDS.find((f) => f.k === k)!.label} : ${r[k] || "à compléter"}`));
      lines.push("");
    });
    return lines.join("\n");
  };

  return (
    <ActivityCard tint={tint} title="Mon plan d'actions IA">
      <div className="rounded-[10px] px-4 py-3 mb-4 text-sm" style={{ background: alpha(tint, th.isDark ? 0.1 : 0.12), borderLeft: `3px solid ${tint}`, color: th.fg2 }}>
        <span className="block text-[11px] font-bold uppercase tracking-widest mb-1" style={{ color: th.fg }}>Ce que ce plan mobilise</span>
        Ce plan reprend les six éléments attendus et ajoute deux repères de pilotage : qui valide et comment la réussite sera mesurée
        par rapport à la situation de départ.
      </div>
      <p className="text-sm mb-4" style={{ color: th.fg2 }}>
        Trois hypothèses de départ sont proposées. Modifiez-les, chiffrez le gain attendu, indiquez le valideur, la référence actuelle et
        le critère d'arrêt ou de réussite. Un outil ou un prix non vérifié doit rester noté « à confirmer ».
      </p>

      <ol className="flex flex-col gap-3">
        {rows.map((r, i) => {
          const full = isComplete(r);
          return (
            <li key={r.id} className="rounded-[12px] p-4" style={{ border: `1px solid ${full ? alpha(tint, 0.9) : th.sep}`, background: alpha(tint, th.isDark ? 0.05 : 0.04) }}>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="text-[11px] font-bold uppercase tracking-widest flex-1" style={{ color: th.fg3 }}>Ligne {i + 1}</span>
                {full && <Chip tint={tint}>Complète</Chip>}
                {rows.length > 1 && (
                  <button type="button" onClick={() => setRows((rs) => rs.filter((x) => x.id !== r.id))}
                    className="inline-flex items-center gap-1 text-xs font-semibold" style={{ color: th.danger }} aria-label={`Supprimer la ligne ${i + 1}`}>
                    <Trash2 className="w-3.5 h-3.5" />Supprimer cette ligne
                  </button>
                )}
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                {FIELDS.map((f) => {
                  const id = `${uid}-${r.id}-${f.k}`;
                  return (
                    <div key={f.k} className={f.long ? "sm:col-span-2" : ""}>
                      <label htmlFor={id} className="block text-[11px] font-bold uppercase tracking-widest mb-1" style={{ color: th.fg3 }}>{f.label}</label>
                      {f.long ? (
                        <textarea id={id} value={r[f.k]} onChange={(e) => set(r.id, f.k, e.target.value)} rows={2}
                          className="w-full rounded-[4px] px-3 py-2 text-sm bg-transparent" style={{ border: `1px solid ${th.sep}`, color: th.fg }} />
                      ) : (
                        <input id={id} type="text" value={r[f.k]} onChange={(e) => set(r.id, f.k, e.target.value)}
                          className="w-full rounded-[4px] px-3 py-2 text-sm bg-transparent" style={{ border: `1px solid ${r[f.k].trim() ? th.sep : alpha(tint, 0.8)}`, color: th.fg }} />
                      )}
                    </div>
                  );
                })}
              </div>
            </li>
          );
        })}
      </ol>

      <div className="flex flex-wrap items-center gap-3 mt-4">
        <VBtn sm onClick={() => setRows((rs) => [...rs, emptyRow()])}><Plus className="w-4 h-4" />Ajouter une ligne</VBtn>
        <div ref={statusRef} role="status" aria-live="polite" className="text-sm font-semibold" style={{ color: ok ? th.success : th.fg3 }}>
          {completeCount} ligne{completeCount > 1 ? "s" : ""} complète{completeCount > 1 ? "s" : ""} sur {rows.length}
        </div>
      </div>
      <p className="text-xs mt-2" style={{ color: th.fg3 }}>
        Vos réponses sont sauvegardées automatiquement dans ce navigateur. Pour en garder une copie durable ou l'emporter sur un autre
        appareil, téléchargez-les avec le bouton ci-dessous.
      </p>

      <details className="mt-4 rounded-[10px] px-4 py-3" style={{ border: `1px solid ${th.sep}` }}>
        <summary className="text-sm font-semibold cursor-pointer" style={{ color: th.fg }}>Pour renseigner la colonne « Budget éventuel » : accès des cinq outils</summary>
        <ul className="mt-3 grid gap-2">
          {TOOL_SHEETS.map((t) => (
            <li key={t.id} className="text-sm flex flex-wrap items-baseline gap-x-2 gap-y-1" style={{ color: th.fg2 }}>
              <span className="font-semibold" style={{ color: th.fg }}><span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ background: TOOL_TINT[t.id] }} aria-hidden />{t.name}</span>
              <span className="flex-1 min-w-[200px]">{t.access}</span>
              <a href={t.pricingUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold underline underline-offset-2" style={{ color: th.fg }}>
                Tarifs officiels <ExternalLink className="w-3 h-3" aria-hidden /><span className="sr-only">(nouvel onglet)</span>
              </a>
            </li>
          ))}
        </ul>
        <p className="text-xs mt-3" style={{ color: th.fg3 }}>Les tarifs changent souvent : vérifiez-les sur la page officielle de l'éditeur au moment de chiffrer, sinon notez « à confirmer ».</p>
      </details>

      <ExportBar filename="mon-plan-actions-ia.txt" build={summary} downloadLabel="Télécharger mon plan" />

      {ok && (
        <Retain>
          Chaque ligne suit le même ordre : tâche, fréquence, outil, justification, budget, délai, puis le valideur et l'indicateur
          mesuré par rapport à la situation de départ. Une à trois lignes pour commencer ; relisez et ajustez le plan après chaque essai.
        </Retain>
      )}
    </ActivityCard>
  );
}

/* ---------- Pour aller plus loin ---------- */

function ContinueOnPlatform() {
  const th = useTh();
  const navigate = useNavigate();
  return (
    <GCard className="p-6">
      <p className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: th.fg3 }}>Pour aller plus loin sur la plateforme</p>
      <p className="text-sm mb-3" style={{ color: th.fg2 }}>
        Le Hub IA présente les outils par catégorie, avec leurs conditions d'accès : utile pour compléter les colonnes « Outil choisi »
        et « Budget éventuel ». Après la mission du module, prenez rendez-vous avec votre formateur pour relire votre plan ensemble.
      </p>
      <div className="flex flex-wrap gap-2">
        <VBtn sm onClick={() => navigate("/hub")}>Hub IA</VBtn>
        <VBtn sm onClick={() => navigate("/calendar")}>Rendez-vous <ArrowRight className="w-4 h-4" /></VBtn>
      </div>
    </GCard>
  );
}

/* ---------- Commun ---------- */

type Opt = { v: string; l: string };
type Q = { legend: string; options: Opt[]; answer: string; ok: string; why: string };

function ActivityNav({ navRef, steps, step, done, onSelect }: { navRef: RefObject<HTMLElement>; steps: string[]; step: number; done: boolean[]; onSelect: (i: number) => void }) {
  const th = useTh();
  return (
    <nav ref={navRef} className="grid grid-cols-1 sm:grid-cols-3 gap-2" aria-label="Activités">
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
