import { useEffect, useId, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
import { useNavigate } from "react-router";
import { ArrowRight, Check, Copy, Download } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { GCard } from "@/app/components/common/GCard";
import { ShimBtn, VBtn } from "@/app/components/common/Buttons";
import type { PlaygroundProps } from "@/app/playgrounds/registry";
import { Chip, Hero, ProgressRing, TOOL_TINT, alpha, celebrate } from "@/app/playgrounds/ui";

// Playground natif de la leçon 1.3 « Installer et configurer les outils IA »
// (version SIRH de Nathalie), converti depuis
// docs/formation-rs6776/lecon-1.3/playground-nathalie.html :
//  1. Quel compte, pour quelle situation ? (quatre situations) ;
//  2. Est-ce déjà le bon réflexe ? (quatre comportements) ;
//  3. Mon tableau de bord des comptes (statut réel des quatre outils traités par le cours).

const TINTS = ["#78d5e2", "#fbc2ad", "#6adeb1"];
const STORAGE_KEY = "pg-rs6776-1.3-sirh-comptes";

export default function Pg13({ params }: PlaygroundProps) {
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

  const steps = ["Quel compte, pour quelle situation ?", "Est-ce déjà le bon réflexe ?", "Mon tableau de bord des comptes"];

  return (
    <div className="flex flex-col gap-5">
      <Hero>
        <div className="flex flex-col md:flex-row md:items-center gap-5 md:pr-24">
          <div className="flex-1">
            <p className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: th.fg3 }}>Playground · Leçon 1.3</p>
            <h2 className="text-2xl md:text-3xl font-semibold leading-tight mb-2" style={{ color: th.fg }}>Nathalie, cadrez <span className="hl">vos accès</span></h2>
            <p className="text-sm max-w-[70ch] mb-2" style={{ color: th.fg2 }}>
              Vous travaillez avec plusieurs structures clientes : choisissez un accès autorisé selon le contexte et séparez strictement
              les comptes. Il n'est ni nécessaire ni souhaitable de créer un compte sur chaque outil.
            </p>
            <p className="text-sm max-w-[70ch]" style={{ color: th.fg2 }}>
              Trois temps : choisir l'accès adapté, vérifier vos réflexes de sécurité, puis documenter le statut réel des quatre outils,
              y compris « non retenu » ou « non autorisé ».
            </p>
          </div>
          <ProgressRing value={doneCount / steps.length} label="réalisé" />
        </div>
      </Hero>

      <ActivityNav navRef={navRef} steps={steps} step={step} done={done} onSelect={setStep} />

      {step === 0 && (
        <Quiz key="q1" tint={TINTS[0]} title="Quel compte, pour quelle situation ?" fictive
          intro="Quatre situations tirées de votre activité de consultante SIRH freelance. Pour chacune, choisissez la meilleure décision."
          questions={EX1} onDone={() => markDone(0)} onNext={() => setStep(1)}
          retain="Pas de compte sur chaque outil : un accès autorisé, choisi selon le contexte. Réutilisez l'accès fourni par une structure cliente dans le cadre qu'elle pose, testez sur des données fictives, et protégez chaque compte par un mot de passe distinct (gestionnaire de mots de passe) et la double authentification." />
      )}
      {step === 1 && (
        <Quiz key="q2" tint={TINTS[1]} title="Est-ce déjà le bon réflexe ?" fictive
          intro="Pour chaque comportement décrit, dites s'il s'agit déjà du bon réflexe."
          questions={EX2} onDone={() => markDone(1)} onNext={() => setStep(2)}
          retain="Comptes clients et comptes personnels restent strictement séparés. Notez pour chaque mission qui fournit le compte : cela conditionne ce que vous avez le droit d'y faire. Un accès fourni dépend de l'administrateur du client, et une connexion via Google ou Microsoft reste révocable depuis le compte pivot." />
      )}
      {step === 2 && <AccountBoard tint={TINTS[2]} onDone={() => markDone(2)} />}

      <ContinueOnPlatform />

      <p className="text-xs px-1" style={{ color: th.fg3 }}>
        Toutes les entreprises, personnes et données de cet exercice sont fictives. Ce support ne remplace pas la politique interne de
        vos clients ni les consignes de leur DSI ou de leur DPO.
      </p>
    </div>
  );
}

/* ---------- Données des exercices 1 et 2 (reprises du HTML) ---------- */

const YESNO: Opt[] = [{ v: "oui", l: "Oui, bon réflexe" }, { v: "non", l: "Non, pas encore" }];

const EX1: Q[] = [
  {
    legend: "Une structure cliente vous donne accès à son environnement Microsoft 365, qui inclut Copilot, pour travailler sur ses documents.",
    options: [
      { v: "fourni", l: "Utiliser cet accès fourni, sans créer de compte personnel supplémentaire pour cette mission" },
      { v: "perso", l: "Créer quand même un compte Copilot personnel, par sécurité" },
      { v: "ignorer", l: "Ignorer cet accès et continuer avec votre outil habituel" },
    ],
    answer: "fourni",
    ok: "Exact. Un accès fourni par une structure cliente a ses propres règles d'usage : le réutiliser évite de dupliquer un accès déjà en place, et respecte le cadre posé par cette structure.",
    why: "Créer un compte personnel supplémentaire n'apporte rien ici : l'accès existe déjà, avec des règles propres à cette structure qu'un compte personnel ne reproduirait pas.",
  },
  {
    legend: "Vous voulez tester Google Gemini pour une tâche qui ne concerne aucun client en particulier.",
    options: [
      { v: "google", l: "Après vérification du cadre, utiliser un compte Google dédié au test sur données fictives" },
      { v: "email", l: "Créer un compte avec n'importe quelle adresse e-mail" },
      { v: "attendre", l: "Attendre qu'un client vous en fournisse un" },
    ],
    answer: "google",
    ok: "Exact, après avoir vérifié que le test et l'usage d'un compte personnel sont autorisés. Gemini repose sur un compte Google.",
    why: "Le type de compte technique ne remplace pas l'autorisation d'usage. Testez uniquement avec des données fictives et séparez les contextes clients.",
  },
  {
    legend: "Vous voulez essayer rapidement ChatGPT sans créer un nouveau mot de passe de plus.",
    options: [
      { v: "sso", l: "Vous connecter directement avec votre compte Google ou Microsoft déjà existant" },
      { v: "nouveau", l: "Créer un compte avec une adresse e-mail et un nouveau mot de passe" },
      { v: "attendre2", l: "Renoncer à tester l'outil pour l'instant" },
    ],
    answer: "sso",
    ok: "Exact, si ce compte pivot est autorisé et protégé par une double authentification. Vous devez aussi savoir révoquer l'accès.",
    why: "Une connexion fédérée évite un mot de passe supplémentaire, mais rattache l'outil au compte choisi : contrôlez les autorisations et ne mélangez pas les clients.",
  },
  {
    legend: "Vous gérez plusieurs comptes autorisés et hésitez entre réutiliser le même mot de passe ou adopter une autre solution.",
    options: [
      { v: "gestionnaire", l: "Utiliser un gestionnaire de mots de passe qui génère un mot de passe distinct pour chaque compte" },
      { v: "meme", l: "Réutiliser le même mot de passe, plus simple à retenir" },
      { v: "noter", l: "Noter tous les mots de passe identiques dans un fichier texte sur le bureau" },
    ],
    answer: "gestionnaire",
    ok: "Exact. Un gestionnaire de mots de passe génère et retient un secret distinct ; ajoutez la double authentification lorsqu'elle est disponible.",
    why: "Réutiliser le même mot de passe multiplie le risque en cas de fuite d'un seul service.",
  },
];

const EX2: Q[] = [
  {
    legend: "Un client vous transmet ses identifiants Microsoft 365 pour Copilot : vous réutilisez ce même mot de passe pour votre compte ChatGPT personnel.",
    options: YESNO, answer: "non",
    ok: "Exact. Le mot de passe d'un accès fourni par un client n'a rien à faire sur un compte personnel : les deux doivent rester complètement séparés.",
    why: "Mélanger un identifiant fourni par un client avec un compte personnel expose ce client en cas de problème sur votre propre compte, et inversement.",
  },
  {
    legend: "Pour chaque mission, vous notez si le compte utilisé est personnel ou fourni par le client.",
    options: YESNO, answer: "oui",
    ok: "Exact. Cette information vous servira directement à compléter la colonne « Outil choisi » de votre plan d'actions.",
    why: "Savoir si un compte est personnel ou fourni par un client conditionne ce que vous avez le droit d'y faire, et pour combien de temps il reste disponible.",
  },
  {
    legend: "L'accès à Copilot fourni par un client cesse soudainement de fonctionner. Quel est le premier réflexe ?",
    options: [
      { v: "verifier", l: "Vérifier auprès du client si son administrateur a modifié ou retiré cet accès" },
      { v: "reinitialiser", l: "Réinitialiser directement le mot de passe sans en parler au client" },
      { v: "creer", l: "Créer immédiatement un compte personnel de remplacement" },
    ],
    answer: "verifier",
    ok: "Exact. Un accès fourni par une structure dépend souvent d'une activation par son administrateur : c'est le premier point à vérifier en cas de blocage.",
    why: "Un accès fourni par une structure ne fonctionne pas comme un compte personnel : le faire réinitialiser sans vérifier ce point revient à ignorer la cause la plus probable.",
  },
  {
    legend: "Vous savez que l'accès donné à un outil via « se connecter avec Google » peut être révoqué à tout moment depuis les paramètres de sécurité de ce compte Google.",
    options: YESNO, answer: "oui",
    ok: "Exact. Cet accès reste révocable à tout moment depuis les paramètres de sécurité du compte pivot : le savoir permet de réagir vite en cas de doute.",
    why: "Un compte connecté via Google ou Microsoft reste sous le contrôle de ce compte pivot : vérifier qu'il peut être révoqué à tout moment est exactement le bon réflexe de sécurité.",
  },
];

/* ---------- 3. Mon tableau de bord des comptes ---------- */

type ToolRow = { name: string; site: string; statut: string; explore: boolean; note: string };

const TOOLS_DEFAULT: ToolRow[] = [
  { name: "ChatGPT", site: "chatgpt.com", statut: "", explore: false, note: "" },
  { name: "Google Gemini", site: "gemini.google.com", statut: "", explore: false, note: "" },
  { name: "Microsoft Copilot", site: "copilot.com", statut: "", explore: false, note: "" },
  { name: "Adobe Firefly", site: "firefly.adobe.com", statut: "", explore: false, note: "" },
];
const TOOL_KEY = ["chatgpt", "gemini", "copilot", "firefly"];
const STATUTS = ["Autorisé — personnel gratuit", "Autorisé — personnel payant", "Autorisé — fourni par un client", "À étudier / validation requise", "Non retenu ou non autorisé"];

function AccountBoard({ tint, onDone }: { tint: string; onDone: () => void }) {
  const th = useTh();
  const uid = useId();
  const [tools, setTools] = useStored<ToolRow[]>(STORAGE_KEY, () => TOOLS_DEFAULT,
    (v) => Array.isArray(v) && v.length === TOOLS_DEFAULT.length);
  const boxRef = useRef<HTMLDivElement>(null);
  const set = (i: number, p: Partial<ToolRow>) => setTools((ts) => ts.map((t, j) => (j === i ? { ...t, ...p } : t)));
  const filled = tools.filter((t) => !!t.statut).length;
  const explored = tools.filter((t) => t.explore).length;
  const complete = filled === tools.length;
  const wasComplete = useRef(complete);
  useEffect(() => {
    if (complete) onDone();
    if (complete && !wasComplete.current) celebrate(boxRef.current, 0.8);
    wasComplete.current = complete;
  }, [complete]);

  const summary = () => {
    const lines = ["Mon tableau de bord des comptes IA", ""];
    tools.forEach((t) => {
      lines.push(`${t.name} (${t.site})`);
      lines.push(`- Statut du compte : ${t.statut || "à compléter"}`);
      lines.push(`- Interface explorée : ${t.explore ? "oui" : "non"}`);
      lines.push(`- Notes : ${t.note || "aucune"}`);
      lines.push("");
    });
    return lines.join("\n");
  };

  return (
    <ActivityCard tint={tint} title="Mon tableau de bord des comptes">
      <div className="rounded-[10px] px-4 py-3 mb-4 text-sm" style={{ background: alpha(tint, th.isDark ? 0.1 : 0.12), borderLeft: `3px solid ${tint}`, color: th.fg2 }}>
        <span className="block text-[11px] font-bold uppercase tracking-widest mb-1" style={{ color: th.fg }}>À quoi ça sert</span>
        Reportez dans votre plan uniquement l'outil retenu avec son propriétaire, son offre, son autorisation et la date de vérification.
        « Non retenu » est une décision valable.
      </div>
      <p className="text-sm mb-4" style={{ color: th.fg2 }}>
        Pour chacun des quatre outils, indiquez son statut réel, sans créer de compte uniquement pour remplir le tableau.
      </p>

      <div className="grid md:grid-cols-2 gap-3">
        {tools.map((t, i) => {
          const tTint = TOOL_TINT[TOOL_KEY[i]] ?? tint;
          return (
            <div key={t.name} className="rounded-[12px] p-4" style={{ background: alpha(tTint, th.isDark ? 0.1 : 0.1), border: `1px solid ${alpha(tTint, t.statut ? 0.9 : 0.45)}` }}>
              <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
                <span className="text-base font-semibold" style={{ color: th.fg }}>{t.name}</span>
                <span className="text-xs" style={{ color: th.fg3 }}>{t.site}</span>
              </div>
              <label htmlFor={`${uid}-s${i}`} className="block text-[11px] font-bold uppercase tracking-widest mb-1" style={{ color: th.fg3 }}>Statut du compte</label>
              <select id={`${uid}-s${i}`} value={t.statut} onChange={(e) => set(i, { statut: e.target.value })}
                className="w-full rounded-[4px] px-2 py-2 text-sm mb-3" style={{ border: `1px solid ${th.sep}`, color: th.fg, background: th.card }}>
                <option value="">Choisissez…</option>
                {STATUTS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <label htmlFor={`${uid}-n${i}`} className="block text-[11px] font-bold uppercase tracking-widest mb-1" style={{ color: th.fg3 }}>Notes</label>
              <input id={`${uid}-n${i}`} type="text" value={t.note} onChange={(e) => set(i, { note: e.target.value })}
                placeholder="Ex. compte fourni par tel client, à ne pas mélanger avec mon usage personnel"
                className="w-full rounded-[4px] px-3 py-2 text-sm bg-transparent mb-3" style={{ border: `1px solid ${th.sep}`, color: th.fg }} />
              <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: th.fg2 }}>
                <input type="checkbox" checked={t.explore} onChange={(e) => set(i, { explore: e.target.checked })} className="w-4 h-4" style={{ accentColor: tTint }} />
                Interface explorée (commandes principales repérées)
              </label>
            </div>
          );
        })}
      </div>

      <div ref={boxRef} role="status" aria-live="polite" className="mt-4 rounded-[8px] px-4 py-3 text-sm font-semibold"
        style={{ border: `1px solid ${complete ? th.success : th.sep}`, color: complete ? th.success : th.fg2 }}>
        {filled} statut{filled > 1 ? "s" : ""} sur 4 renseigné{filled > 1 ? "s" : ""}, {explored} interface{explored > 1 ? "s" : ""} sur 4 explorée{explored > 1 ? "s" : ""}.
      </div>
      <p className="text-xs mt-2" style={{ color: th.fg3 }}>
        Vos réponses sont sauvegardées automatiquement dans ce navigateur. Pour en garder une copie durable ou l'emporter sur un autre
        appareil, téléchargez-les avec le bouton ci-dessous.
      </p>
      <p className="text-xs mt-2" style={{ color: th.fg3 }}>
        Claude, le cinquième outil de référence de la formation, se pratique directement dans le Studio de la plateforme ; le cours de cette
        leçon traite les quatre autres.
      </p>

      <ExportBar filename="mon-tableau-de-bord-comptes-ia.txt" build={summary} downloadLabel="Télécharger mon suivi" />

      {complete && (
        <Retain>
          Un outil utile, autorisé et compatible avec les données traitées suffit. Pour chaque outil retenu, notez qui possède le
          compte, l'offre, l'autorisation et la date de vérification ; « non retenu » ou « non autorisé » sont des statuts tout aussi
          valables à reporter dans votre plan.
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
        Le Hub IA présente chaque outil sur une fiche, avec un bouton « Essayer dans le studio » quand il est intégré. Dans le Studio,
        retrouvez sur les chats ChatGPT, Claude et Gemini les repères de l'interface vus dans le cours : zone de saisie, nouvelle
        conversation, historique.
      </p>
      <div className="flex flex-wrap gap-2">
        <VBtn sm onClick={() => navigate("/hub")}>Hub IA</VBtn>
        <VBtn sm onClick={() => navigate("/studio/chatgpt")}>Studio · ChatGPT</VBtn>
        <VBtn sm onClick={() => navigate("/studio/claude")}>Studio · Claude</VBtn>
        <VBtn sm onClick={() => navigate("/studio/gemini")}>Studio · Gemini</VBtn>
      </div>
      <p className="text-xs mt-3" style={{ color: th.fg3 }}>
        Copilot et Firefly ne sont pas intégrés à la plateforme : découvrez-les sur leur site officiel, uniquement si leur usage est autorisé.
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
