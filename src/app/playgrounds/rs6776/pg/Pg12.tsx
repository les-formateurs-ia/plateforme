import { useEffect, useId, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
import { useNavigate } from "react-router";
import { ArrowRight, Check, Copy, Download, Plus } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { GCard } from "@/app/components/common/GCard";
import { ShimBtn, VBtn } from "@/app/components/common/Buttons";
import type { PlaygroundProps } from "@/app/playgrounds/registry";
import { Chip, Hero, ProgressRing, alpha, celebrate } from "@/app/playgrounds/ui";

// Playground natif de la leçon 1.2 « Analyser son poste et identifier les tâches
// automatisables » (version SIRH de Nathalie), converti depuis
// docs/formation-rs6776/lecon-1.2/playground-nathalie.html :
//  1. Quick win ou pas ? (cinq situations, quatre profils) ;
//  2. Par lequel commencer ? (quatre décisions de priorisation) ;
//  3. Cartographier mes quick wins (ses six tâches, gain × difficulté, première action).

const TINTS = ["#b58de0", "#78d5e2", "#6adeb1"];
const STORAGE_KEY = "pg-rs6776-1.2-sirh-cartographie";

export default function Pg12({ params }: PlaygroundProps) {
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

  const steps = ["Quick win ou pas ?", "Par lequel commencer ?", "Cartographier mes quick wins"];

  return (
    <div className="flex flex-col gap-5">
      <Hero>
        <div className="flex flex-col md:flex-row md:items-center gap-5 md:pr-24">
          <div className="flex-1">
            <p className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: th.fg3 }}>Playground · Leçon 1.2</p>
            <h2 className="text-2xl md:text-3xl font-semibold leading-tight mb-2" style={{ color: th.fg }}>Nathalie, repérez vos <span className="hl">quick wins</span></h2>
            <p className="text-sm max-w-[70ch] mb-2" style={{ color: th.fg2 }}>
              Ce Playground reprend votre quotidien de consultante SIRH. Toutes les données proposées sont fictives, sauf vos
              propres tâches, que vous avez déjà décrites : n'utilisez aucune information réelle de vos clients.
            </p>
            <p className="text-sm max-w-[70ch]" style={{ color: th.fg2 }}>
              À la fin, vous saurez reconnaître un quick win parmi vos propres tâches, distinguer un projet à planifier d'une
              tâche à écarter, et vous repartirez avec votre propre cartographie et votre première action concrète.
            </p>
          </div>
          <ProgressRing value={doneCount / steps.length} label="réalisé" />
        </div>
      </Hero>

      <ActivityNav navRef={navRef} steps={steps} step={step} done={done} onSelect={setStep} />

      {step === 0 && (
        <Quiz key="q1" tint={TINTS[0]} title="Quick win ou pas ?" fictive
          intro="Cinq situations tirées de votre quotidien de consultante SIRH. Pour chacune, placez-la dans le bon profil."
          questions={EX1} onDone={() => markDone(0)} onNext={() => setStep(1)}
          retain="Un quick win combine un fort gain de temps et une faible difficulté de mise en place : outil autorisé, données d'essai sûres, résultat facile à contrôler. Un fort volume ne suffit pas, et une décision ou un jugement restent de votre ressort." />
      )}
      {step === 1 && (
        <Quiz key="q2" tint={TINTS[1]} title="Par lequel commencer ?" fictive
          intro="Vous avez repéré plusieurs candidats. Choisissez la meilleure décision de priorisation."
          questions={EX2} onDone={() => markDone(1)} onNext={() => setStep(2)}
          retain="À difficulté égale, l'impact tranche. La sensibilité des données fait partie de la difficulté : une tâche qui exige une anonymisation ou une validation devient un projet à planifier. Un quick win réussi fournit ensuite les chiffres qui justifient un chantier plus lourd." />
      )}
      {step === 2 && <TaskMap tint={TINTS[2]} onDone={() => markDone(2)} />}

      <ContinueOnPlatform />

      <p className="text-xs px-1" style={{ color: th.fg3 }}>
        Toutes les entreprises, personnes et données chiffrées de cet exercice sont fictives. Ce support ne remplace pas la
        politique interne de votre entreprise ni les consignes de votre DSI ou de votre DPO.
      </p>
    </div>
  );
}

/* ---------- Données des exercices 1 et 2 (reprises du HTML) ---------- */

const PROFILES: Opt[] = [
  { v: "quickwin", l: "Quick win" },
  { v: "projet", l: "Projet à planifier" },
  { v: "mineur", l: "Amélioration mineure" },
  { v: "ecarter", l: "À écarter pour l'instant" },
];

const EX1: Q[] = [
  {
    legend: "Rédiger un compte-rendu de réunion client à partir de vos notes prises en direct, une tâche qui revient chaque semaine avec la même structure, sans nouvel outil à apprendre.",
    options: PROFILES, answer: "quickwin",
    ok: "Exact, si l'outil est autorisé et l'essai réalisé sur des données fictives : la tâche est fréquente, vérifiable et simple à tester.",
    why: "Un quick win combine un gain potentiel élevé et une faible difficulté. Confirmez-le ensuite par une mesure du temps total et de la qualité, corrections comprises.",
  },
  {
    legend: "Migrer l'ensemble de vos modèles de mails et de comptes-rendus vers un nouvel outil de gestion, avec reparamétrage complet de vos automatisations existantes.",
    options: PROFILES, answer: "projet",
    ok: "Exact. Le gain visé est réel, mais migrer des modèles existants et reparamétrer des automatisations est un chantier, pas un point de départ.",
    why: "Un fort gain potentiel ne suffit pas : dès que la mise en place suppose plusieurs étapes lourdes (migration, reparamétrage), la tâche devient un projet à planifier, pas un quick win.",
  },
  {
    legend: "Décider, à la place de votre client, s'il doit recruter en interne ou passer par un prestataire externe.",
    options: PROFILES, answer: "ecarter",
    ok: "Exact. C'est une décision, pas une production de texte ou d'image : elle reste hors du champ de cette méthode, quel que soit le temps qu'elle prendrait à réfléchir.",
    why: "Le gain que l'IA générative peut apporter à une décision stratégique est quasi nul : cette méthode s'applique aux tâches de production, pas aux tâches de jugement.",
  },
  {
    legend: "Reformuler une seule fois le titre d'une offre d'emploi déjà rédigée, pour un poste précis.",
    options: PROFILES, answer: "mineur",
    ok: "Exact. Très facile, mais le gain reste modeste pris isolément : un bon réflexe, pas un chantier prioritaire.",
    why: "Difficulté quasi nulle, mais gain limité sur un cas unique : c'est une amélioration mineure, pas un quick win au sens plein.",
  },
  {
    legend: "Rédiger une offre d'emploi complète à partir du brief transmis par un client, une tâche qui revient à chaque nouveau poste à pourvoir avec une structure toujours similaire.",
    options: PROFILES, answer: "quickwin",
    ok: "Exact, pour un premier essai fictif avec un outil autorisé. Contrôlez ensuite les critères, les chiffres, les mentions obligatoires et l'absence de discrimination.",
    why: "La structure récurrente en fait un bon candidat, mais le classement doit être confirmé par la qualité du brouillon et le temps de correction.",
  },
];

const EX2: Q[] = [
  {
    legend: "Vous avez repéré deux quick wins : le premier vous ferait gagner environ 20 minutes par semaine, le second environ 3 heures par semaine. Les deux sont aussi simples à mettre en place l'un que l'autre. Par lequel commencez-vous ?",
    options: [
      { v: "premier", l: "Par le premier" },
      { v: "second", l: "Par le second, il a le plus fort impact" },
      { v: "indifferent", l: "Peu importe, l'ordre n'a pas d'incidence" },
    ],
    answer: "second",
    ok: "Exact. À difficulté égale, l'impact fait la différence : commencez par celui qui vous fait gagner le plus de temps.",
    why: "Quand la difficulté de mise en place est identique, seul le gain de temps doit trancher la priorité.",
  },
  {
    legend: "Une tâche vous semble avoir un très fort potentiel de gain, mais elle implique de saisir des informations confidentielles d'un client dans un outil grand public non validé par votre organisation. Que faites-vous ?",
    options: [
      { v: "priorite", l: "Je la traite en priorité, le gain est trop important pour attendre" },
      { v: "verifier", l: "Je vérifie d'abord si les données doivent être anonymisées, et je la classe en projet à planifier en attendant" },
      { v: "abandon", l: "J'abandonne définitivement cette tâche" },
    ],
    answer: "verifier",
    ok: "Exact. Un fort gain apparent ne fait pas un quick win si une vérification de confidentialité s'impose d'abord : la tâche se reclasse en projet à planifier le temps de trouver une solution conforme.",
    why: "La difficulté de mise en place inclut la sensibilité des données : une tâche qui exige une anonymisation ou une validation préalable n'est jamais un quick win immédiat, même si le gain semble élevé.",
  },
  {
    legend: "Vous hésitez entre deux tâches à fort potentiel de gain : l'une est facile à mettre en place tout de suite, l'autre suppose de convaincre un client de changer d'outil. Laquelle traitez-vous en premier ?",
    options: [
      { v: "facile", l: "Celle qui est facile à mettre en place tout de suite" },
      { v: "lourde", l: "Celle qui suppose de convaincre le client" },
      { v: "ensemble", l: "Les deux en même temps, pour aller plus vite" },
    ],
    answer: "facile",
    ok: "Exact. À gain, qualité et risque comparables, privilégiez l'essai dont les prérequis sont déjà réunis ; le projet plus lourd reste sur la liste.",
    why: "Le quick win sert à produire rapidement une preuve mesurable, sans contourner une validation ni abaisser le niveau de contrôle.",
  },
  {
    legend: "Après avoir traité votre premier quick win pendant plusieurs semaines, quelle est la meilleure suite logique ?",
    options: [
      { v: "rien", l: "Ne rien changer, un seul quick win suffit" },
      { v: "justifier", l: "Utiliser le temps gagné pour justifier de s'attaquer à un projet plus lourd de la liste" },
      { v: "recommencer", l: "Recommencer immédiatement toute la méthode de zéro" },
    ],
    answer: "justifier",
    ok: "Exact. Un quick win réussi n'est pas une fin en soi : ses résultats mesurables aident à justifier de s'attaquer ensuite à un chantier plus lourd.",
    why: "Le temps gagné et les résultats obtenus sur un quick win constituent un argument concret pour justifier, chiffres à l'appui, le passage à un projet plus lourd de la liste.",
  },
];

/* ---------- 3. Cartographier mes quick wins ---------- */

type Task = { n: string; h: number; why: string };
type Gain = "fort" | "moyen" | "faible";
type Diff = "basse" | "haute";
type Quad = "quickwin" | "projet" | "mineur" | "ecarter";
type MapState = { tasks: Task[]; gain: Record<number, Gain>; diff: Record<number, Diff>; firstAction: string; oneThing: string };

const DEFAULT_TASKS: Task[] = [
  { n: "Rédiger et traiter mes mails clients", h: 4,
    why: "Volume élevé, structures qui reviennent (confirmation de rendez-vous, relance, transmission d'informations). Vous fournissez la matière en quelques lignes, l'outil propose une formulation professionnelle : c'est déjà votre réflexe avec ChatGPT." },
  { n: "Rédiger mes comptes-rendus de réunion", h: 6,
    why: "C'est votre charge rédactionnelle récurrente la plus importante. Structure connue et matière fournie : testez sur trois occurrences fictives, puis mesurez le temps total et les omissions." },
  { n: "Rédiger des offres d'emploi", h: 3,
    why: "À partir d'un brief client, la structure d'une offre revient toujours : intitulé, missions, profil, modalités. Un excellent candidat, sous réserve de vérifier les éléments chiffrés qu'un outil peut être tenté d'inventer." },
  { n: "Rédiger des articles", h: 1.5,
    why: "Production rédactionnelle également, mais qui engage davantage votre point de vue : l'IA peut structurer un premier jet, la valeur ajoutée reste dans l'angle et l'argumentation." },
  { n: "Paramétrer et connecter les logiciels de recrutement (SIRH, site carrière)", h: 10,
    why: "Le paramétrage lui-même exige vos accès et votre expertise. L'IA peut seulement assister des tâches périphériques sur données fictives (checklist, cas de test, guide), à cadrer et valider séparément." },
  { n: "Former les utilisateurs du SIRH chez mes clients", h: 3,
    why: "La relation pédagogique en direct et l'adaptation à chaque interlocuteur restent humaines. L'IA peut, au mieux, vous aider à préparer un support en amont." },
];

const GAIN: { v: Gain; l: string; d: string }[] = [
  { v: "fort", l: "Fort", d: "Tâche répétitive qui produit du texte : gain de temps important." },
  { v: "moyen", l: "Moyen", d: "Une part peut être assistée, l'autre exige votre jugement." },
  { v: "faible", l: "Faible", d: "Repose sur votre expertise ou votre jugement : gain quasi nul." },
];
const DIFF: { v: Diff; l: string; d: string }[] = [
  { v: "basse", l: "Faible", d: "Outil et autorisations déjà disponibles, données d'essai sûres, résultat facile à contrôler." },
  { v: "haute", l: "Élevée", d: "Suppose un nouvel outil, une validation, ou une donnée sensible à traiter d'abord." },
];
const GAINLABEL: Record<Gain, string> = { fort: "fort", moyen: "moyen", faible: "faible" };
const DIFFLABEL: Record<Diff, string> = { basse: "faible", haute: "élevée" };
const QUADLABEL: Record<Quad, string> = { quickwin: "Quick win", projet: "Projet à planifier", mineur: "Amélioration mineure", ecarter: "À écarter pour l'instant" };
const QUADORDER: Quad[] = ["quickwin", "projet", "mineur", "ecarter"];

function quadrantOf(g: Gain, d: Diff): Quad {
  if (d === "basse" && g === "fort") return "quickwin";
  if (d === "basse") return "mineur";
  if (g === "fort" || g === "moyen") return "projet";
  return "ecarter";
}
const fmtH = (h: number) => h.toString().replace(".", ",");

function TaskMap({ tint, onDone }: { tint: string; onDone: () => void }) {
  const th = useTh();
  const quadTint: Record<Quad, string> = { quickwin: th.success, projet: th.info, mineur: th.warn, ecarter: th.fg3 };
  const [state, setState] = useStored<MapState>(STORAGE_KEY, () => ({ tasks: DEFAULT_TASKS, gain: {}, diff: {}, firstAction: "", oneThing: "" }),
    (s) => !!s && Array.isArray((s as MapState).tasks));
  const [openWhy, setOpenWhy] = useState<Set<number>>(() => new Set());
  const [newTask, setNewTask] = useState("");
  const [shown, setShown] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  const patch = (p: Partial<MapState>) => setState((s) => ({ ...s, ...p }));
  const rows = state.tasks.flatMap((t, i) => (state.gain[i] && state.diff[i] ? [{ n: t.n, h: t.h, quad: quadrantOf(state.gain[i], state.diff[i]) }] : []));
  const byQuad = QUADORDER.reduce((acc, q) => ({ ...acc, [q]: rows.filter((r) => r.quad === q) }), {} as Record<Quad, typeof rows>);
  const quickwinTotal = byQuad.quickwin.reduce((s, r) => s + r.h, 0);
  const enough = rows.length >= 3;

  const showMap = () => {
    setShown(true);
    if (rows.length >= 3) { onDone(); celebrate(resultRef.current, 0.8); }
  };

  const addTask = () => {
    const name = newTask.trim();
    if (!name) return;
    patch({ tasks: [...state.tasks, { n: name, h: 1, why: "" }] });
    setNewTask("");
  };

  const summary = () => {
    const lines = ["Ma cartographie quick win", ""];
    state.tasks.forEach((t, i) => {
      const g = state.gain[i] ? GAINLABEL[state.gain[i]] : "non renseigné";
      const d = state.diff[i] ? DIFFLABEL[state.diff[i]] : "non renseignée";
      const quad = state.gain[i] && state.diff[i] ? QUADLABEL[quadrantOf(state.gain[i], state.diff[i])] : "non classée";
      lines.push(`- ${t.n} : ${fmtH(t.h)} h par semaine, gain ${g}, difficulté ${d} -> ${quad}.`);
    });
    lines.push("");
    if (enough) {
      lines.push("Mes quick wins :");
      if (byQuad.quickwin.length) byQuad.quickwin.forEach((r) => lines.push(`- ${r.n} (${fmtH(r.h)} h/semaine)`));
      else lines.push("(aucun pour l'instant)");
      lines.push("");
    }
    lines.push("Mon quick win, et ma toute première action", state.firstAction || "(non renseigné)", "");
    lines.push("Ma phrase à retenir", state.oneThing || "(non renseigné)");
    return lines.join("\n");
  };

  const profileCards: { q: Quad; text: string }[] = [
    { q: "quickwin", text: "Fort gain, faible difficulté. À traiter en premier." },
    { q: "projet", text: "Gain fort ou moyen, difficulté élevée. À garder sur la liste." },
    { q: "mineur", text: "Gain moyen ou faible, faible difficulté. Un réflexe, pas une priorité." },
    { q: "ecarter", text: "Gain faible, difficulté élevée. Hors priorité pour l'instant." },
  ];

  return (
    <ActivityCard tint={tint} title="Cartographier mes quick wins">
      <blockquote className="rounded-[10px] px-4 py-3 mb-4 text-sm" style={{ background: alpha(tint, th.isDark ? 0.1 : 0.12), borderLeft: `3px solid ${tint}`, color: th.fg2 }}>
        <span className="block text-[11px] font-bold uppercase tracking-widest mb-1" style={{ color: th.fg }}>Compétence attestée n° 1</span>
        « Définir la stratégie d'implémentation de l'IA Générative en fonction du <em>contexte professionnel</em> […], en identifiant
        les <em>optimisations envisageables</em>… »
      </blockquote>
      <p className="text-sm mb-4" style={{ color: th.fg2 }}>
        Vos tâches sont déjà là : ce sont celles que vous avez décrites. Pour chacune, indiquez le temps actuel, le gain estimé et la
        difficulté de mise en place. Traitez ce classement comme une hypothèse : après un essai, mesurez aussi le temps de préparation,
        de correction et de validation, ainsi que les erreurs ou omissions.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 mb-4">
        {profileCards.map((c) => (
          <div key={c.q} className="rounded-[10px] px-4 py-3" style={{ background: alpha(tint, th.isDark ? 0.08 : 0.07), border: `1px solid ${th.sep}` }}>
            <span className="block text-[10.5px] font-bold uppercase tracking-widest mb-1" style={{ color: quadTint[c.q] }}>{QUADLABEL[c.q].replace(" pour l'instant", "")}</span>
            <span className="text-sm" style={{ color: th.fg2 }}>{c.text}</span>
          </div>
        ))}
      </div>

      <dl className="grid md:grid-cols-2 gap-x-6 gap-y-1 text-xs mb-4" style={{ color: th.fg3 }}>
        {GAIN.map((g) => <div key={g.v}><dt className="inline font-semibold" style={{ color: th.fg2 }}>Gain {g.l.toLowerCase()} : </dt><dd className="inline">{g.d}</dd></div>)}
        {DIFF.map((d) => <div key={d.v}><dt className="inline font-semibold" style={{ color: th.fg2 }}>Difficulté {d.l.toLowerCase()} : </dt><dd className="inline">{d.d}</dd></div>)}
      </dl>

      <ul className="flex flex-col gap-3">
        {state.tasks.map((t, i) => {
          const g = state.gain[i];
          const d = state.diff[i];
          const quad = g && d ? quadrantOf(g, d) : null;
          const whyOpen = openWhy.has(i);
          return (
            <li key={`${t.n}-${i}`} className="rounded-[10px] p-4" style={{ border: `1px solid ${quad ? alpha(tint, 0.7) : th.sep}` }}>
              <div className="flex flex-wrap items-start gap-2 mb-3">
                <p className="text-sm font-semibold flex-1 min-w-[200px]" style={{ color: th.fg }}>{t.n}</p>
                {quad && <span className="pg-pop"><Chip tint={tint}>{QUADLABEL[quad]}</Chip></span>}
              </div>
              <div className="grid gap-3 md:grid-cols-[110px_1fr_1fr]">
                <label className="flex flex-col gap-1 text-[11px] font-bold uppercase tracking-widest" style={{ color: th.fg3 }}>
                  Heures / sem.
                  <input type="number" min={0} max={40} step={0.5} value={t.h}
                    onChange={(e) => patch({ tasks: state.tasks.map((x, j) => (j === i ? { ...x, h: parseFloat(e.target.value) || 0 } : x)) })}
                    className="rounded-[4px] px-2 py-1.5 text-sm font-normal normal-case tracking-normal bg-transparent w-full"
                    style={{ border: `1px solid ${th.sep}`, color: th.fg }} />
                </label>
                <ChoiceRow label="Gain de temps" options={GAIN} value={g} tint={tint}
                  onPick={(v) => patch({ gain: { ...state.gain, [i]: v as Gain } })} />
                <ChoiceRow label="Difficulté" options={DIFF} value={d} tint={tint}
                  onPick={(v) => patch({ diff: { ...state.diff, [i]: v as Diff } })} />
              </div>
              {t.why && (
                <>
                  <button type="button" aria-expanded={whyOpen} onClick={() => setOpenWhy((s) => { const n = new Set(s); if (n.has(i)) n.delete(i); else n.add(i); return n; })}
                    className="mt-3 text-xs font-semibold underline underline-offset-2" style={{ color: th.fg2 }}>
                    {whyOpen ? "Masquer l'avis de la formation" : "L'avis de la formation"}
                  </button>
                  {whyOpen && <p className="pg-pop text-sm mt-2 rounded-[6px] px-3 py-2" style={{ background: alpha(tint, th.isDark ? 0.1 : 0.1), color: th.fg2 }}>{t.why}</p>}
                </>
              )}
            </li>
          );
        })}
      </ul>

      <div className="flex flex-wrap items-end gap-2 mt-4">
        <label className="flex flex-col gap-1 text-xs font-semibold flex-1 min-w-[220px]" style={{ color: th.fg2 }}>
          Ajouter une tâche de votre poste
          <input type="text" value={newTask} onChange={(e) => setNewTask(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") addTask(); }}
            placeholder="Ex. préparer un support de formation"
            className="rounded-[4px] px-3 py-2 text-sm font-normal bg-transparent" style={{ border: `1px solid ${th.sep}`, color: th.fg }} />
        </label>
        <VBtn sm onClick={addTask} disabled={!newTask.trim()}><Plus className="w-4 h-4" />Ajouter</VBtn>
        <ShimBtn sm onClick={showMap}>Voir ma cartographie</ShimBtn>
      </div>
      <p className="text-xs mt-2" style={{ color: th.fg3 }}>
        Vos réponses sont sauvegardées automatiquement dans ce navigateur. Pour en garder une copie durable ou l'emporter sur un autre
        appareil, téléchargez-les avec le bouton ci-dessous.
      </p>

      <div ref={resultRef} aria-live="polite">
        {shown && (
          <div className="pg-pop mt-4 rounded-[12px] p-5" style={{ background: alpha(tint, th.isDark ? 0.12 : 0.14), border: `1px solid ${alpha(tint, 0.8)}` }}>
            <p className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: th.fg }}>Ma cartographie</p>
            {!enough ? (
              <p className="text-sm" style={{ color: th.fg2 }}>Qualifiez le gain et la difficulté d'au moins trois tâches pour obtenir votre cartographie.</p>
            ) : (
              <>
                <p className="text-sm mb-3" style={{ color: th.fg2 }}>
                  {byQuad.quickwin.length
                    ? <>Vous avez identifié <strong>{byQuad.quickwin.length} quick win{byQuad.quickwin.length > 1 ? "s" : ""}</strong>, pour un total d'environ {fmtH(quickwinTotal)} h par semaine actuellement passées sur ces tâches. C'est par là qu'il faut commencer.</>
                    : "Aucune tâche n'est encore classée quick win. Ce résultat peut être légitime : ne forcez pas le classement. Identifiez d'abord le prérequis qui manque : autorisation, données fictives, outil ou critère de contrôle."}
                </p>
                <div className="grid md:grid-cols-2 gap-3">
                  {QUADORDER.filter((q) => byQuad[q].length).map((q) => (
                    <div key={q}>
                      <p className="text-[11px] font-bold uppercase tracking-widest mb-1" style={{ color: quadTint[q] }}>{QUADLABEL[q]}</p>
                      <ul className="flex flex-col gap-1">
                        {byQuad[q].map((r) => (
                          <li key={r.n} className="text-sm flex justify-between gap-3" style={{ color: th.fg }}>
                            <span>{r.n}</span><span className="tabular-nums text-xs shrink-0" style={{ color: th.fg3 }}>{fmtH(r.h)} h / sem.</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <label className="block text-sm font-semibold mt-5 mb-1" style={{ color: th.fg }} htmlFor="pg12-first">Mon quick win, et ma toute première action</label>
      <textarea id="pg12-first" value={state.firstAction} onChange={(e) => patch({ firstAction: e.target.value })} rows={3}
        placeholder="Quelle tâche allez-vous traiter en premier, et quand faites-vous votre premier essai ?"
        className="w-full rounded-[4px] px-3 py-2 text-sm bg-transparent" style={{ border: `1px solid ${th.sep}`, color: th.fg }} />
      <label className="block text-sm font-semibold mt-4 mb-1" style={{ color: th.fg }} htmlFor="pg12-one">Ma phrase à retenir de cette leçon</label>
      <textarea id="pg12-one" value={state.oneThing} onChange={(e) => patch({ oneThing: e.target.value })} rows={2} placeholder="En une phrase…"
        className="w-full rounded-[4px] px-3 py-2 text-sm bg-transparent" style={{ border: `1px solid ${th.sep}`, color: th.fg }} />

      <ExportBar filename="mes-reponses-lecon-1-2.txt" build={summary} downloadLabel="Télécharger mes réponses" />

      {shown && enough && (
        <Retain>
          Commencez par un ou deux quick wins, testés sur des données fictives avec un outil autorisé, et mesurez le temps total,
          corrections comprises. Le jugement, la négociation et la décision restent de votre ressort ; le cœur du paramétrage SIRH
          reste votre expertise.
        </Retain>
      )}
    </ActivityCard>
  );
}

function ChoiceRow({ label, options, value, tint, onPick }: { label: string; options: { v: string; l: string; d: string }[]; value?: string; tint: string; onPick: (v: string) => void }) {
  const th = useTh();
  return (
    <div role="group" aria-label={label}>
      <span className="block text-[11px] font-bold uppercase tracking-widest mb-1" style={{ color: th.fg3 }}>{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => {
          const on = value === o.v;
          return (
            <button key={o.v} type="button" aria-pressed={on} title={o.d} onClick={() => onPick(o.v)}
              className="rounded-[2px] px-3 min-h-9 text-xs font-semibold"
              style={on ? { background: tint, color: "#111", border: `1px solid ${tint}` } : { border: `1px solid ${th.sep}`, color: th.fg2 }}>
              {o.l}
            </button>
          );
        })}
      </div>
    </div>
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
        Ouvrez Mon Agent IA et choisissez la question de départ « Comment utiliser l'IA dans mon métier ? » : il connaît votre métier et
        votre progression. Confrontez ses pistes à votre cartographie, sans lui confier aucune information réelle de vos clients.
      </p>
      <div className="flex flex-wrap gap-2">
        <VBtn sm onClick={() => navigate("/agent")}>Mon Agent IA <ArrowRight className="w-4 h-4" /></VBtn>
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
