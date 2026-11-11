import { useEffect, useId, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
import { useNavigate } from "react-router";
import { ArrowRight, Check, Copy, Download, Eye, EyeOff } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { GCard } from "@/app/components/common/GCard";
import { ShimBtn, VBtn } from "@/app/components/common/Buttons";
import type { PlaygroundProps } from "@/app/playgrounds/registry";
import { Chip, Hero, ProgressRing, alpha, celebrate } from "@/app/playgrounds/ui";

// Playground natif de la leçon 1.5 « Sécuriser son usage de l'IA »
// (version SIRH de Nathalie), converti depuis
// docs/formation-rs6776/lecon-1.5/playground-nathalie.html :
//  1. Retirer, anonymiser, ou garder ? (quatre informations) ;
//  2. Est-ce déjà le bon réflexe ? (quatre comportements) ;
//  3. À vous de corriger et de justifier (prompt fictif à corriger, corrigé indicatif).

const TINTS = ["#fbc2ad", "#b58de0", "#6adeb1"];
const STORAGE_KEY = "pg-rs6776-1.5-sirh-prompt-corrige";

export default function Pg15({ params }: PlaygroundProps) {
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

  const steps = ["Retirer, anonymiser, ou garder ?", "Est-ce déjà le bon réflexe ?", "À vous de corriger et de justifier"];

  return (
    <div className="flex flex-col gap-5">
      <Hero>
        <div className="flex flex-col md:flex-row md:items-center gap-5 md:pr-24">
          <div className="flex-1">
            <p className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: th.fg3 }}>Playground · Leçon 1.5</p>
            <h2 className="text-2xl md:text-3xl font-semibold leading-tight mb-2" style={{ color: th.fg }}>Nathalie, sécurisez vos <span className="hl">supports de formation</span> SIRH</h2>
            <p className="text-sm max-w-[70ch] mb-2" style={{ color: th.fg2 }}>
              Ce Playground reprend votre activité de préparation de guides et supports de formation SIRH pour vos clients. Toutes les
              données proposées sont fictives : n'utilisez aucune information réelle de vos clients.
            </p>
            <p className="text-sm max-w-[70ch]" style={{ color: th.fg2 }}>
              Trois temps : décider quoi faire d'une information avant de l'envoyer à une IA, vérifier si un comportement courant est déjà
              le bon réflexe, puis corriger vous-même un prompt et justifier vos choix.
            </p>
          </div>
          <ProgressRing value={doneCount / steps.length} label="réalisé" />
        </div>
      </Hero>

      <div className="rounded-[12px] px-5 py-4 text-sm" style={{ background: alpha(TINTS[0], th.isDark ? 0.12 : 0.14), border: `1px solid ${alpha(TINTS[0], 0.7)}`, color: th.fg2 }}>
        <span className="block text-[11px] font-bold uppercase tracking-widest mb-1" style={{ color: th.fg }}>Un repère avant de commencer</span>
        Retirer, anonymiser ou garder : trois réponses possibles à la même question, selon que l'information est utile ou non à la tâche
        demandée, et selon qu'elle identifie ou non une personne ou une structure précise.
      </div>

      <ActivityNav navRef={navRef} steps={steps} step={step} done={done} onSelect={setStep} />

      {step === 0 && (
        <Quiz key="q1" tint={TINTS[0]} title="Retirer, anonymiser, ou garder ?" fictive
          intro="Quatre informations que vous pourriez rencontrer en préparant un support de formation SIRH. Pour chacune, dites ce qu'il faut en faire avant de la soumettre à une IA."
          questions={EX1} onDone={() => markDone(0)} onNext={() => setStep(1)}
          retain="Première question : l'information est-elle nécessaire à la tâche ? Sinon, retirez-la entièrement. Si elle reste utile, réduisez sa précision ou remplacez les identifiants. Ce qui n'identifie personne et sert la tâche, comme le nom d'un module SIRH, se garde tel quel." />
      )}
      {step === 1 && (
        <Quiz key="q2" tint={TINTS[1]} title="Est-ce déjà le bon réflexe ?" fictive
          intro="Vous intervenez chez plusieurs clients en parallèle. Pour chaque comportement décrit, dites s'il s'agit déjà du bon réflexe."
          questions={EX2} onDone={() => markDone(1)} onNext={() => setStep(2)}
          retain="Un fil par mission ne suffit pas : contrôlez aussi le compte, la mémoire, les fichiers joints et les permissions. Révoquez l'accès d'un client à la fin de la mission (moindre privilège). Et relisez toujours la sortie : vérifiez chaque réglage dans la version du SIRH du client et qu'aucun nom réel ne s'y est glissé." />
      )}
      {step === 2 && <FixPrompt tint={TINTS[2]} onDone={() => markDone(2)} />}

      <ContinueOnPlatform />

      <p className="text-xs px-1" style={{ color: th.fg3 }}>
        Toutes les entreprises, personnes et données de cet exercice sont fictives. Ce support ne remplace pas la politique interne de
        vos clients ni les consignes de leur DSI ou de leur DPO.
      </p>
    </div>
  );
}

/* ---------- Données des exercices 1 et 2 (reprises du HTML) ---------- */

const ACTIONS: Opt[] = [
  { v: "remove", l: "Retirer entièrement" },
  { v: "anon", l: "Anonymiser / généraliser" },
  { v: "keep", l: "Garder tel quel" },
];
const YESNO: Opt[] = [{ v: "oui", l: "Oui, bon réflexe" }, { v: "non", l: "Non, pas encore" }];

const EX1: Q[] = [
  {
    legend: "Le numéro de sécurité sociale d'un salarié, visible sur une fiche de paie que vous utilisez comme exemple pour rédiger un pas-à-pas SIRH.",
    options: ACTIONS, answer: "remove",
    ok: "Exact. Un numéro de sécurité sociale n'a aucune utilité pour un pas-à-pas générique : il se retire entièrement, il n'y a rien à en garder ni à anonymiser.",
    why: "Anonymiser suppose qu'un élément reste utile sous une forme générique. Ici, rien dans la tâche ne demande un numéro de sécurité sociale, même fictif : le bon réflexe est de le retirer entièrement.",
  },
  {
    legend: "Le nom du module SIRH précis à documenter (par exemple « gestion des congés »), nécessaire pour que l'IA rédige un texte pertinent.",
    options: ACTIONS, answer: "keep",
    ok: "Exact. Le nom du module SIRH n'identifie ni une personne ni une structure précise, et il est indispensable pour que l'IA rédige un texte pertinent : rien à en retirer ni à anonymiser.",
    why: "Retirer ou anonymiser cette information priverait l'IA du contexte nécessaire à la tâche, alors qu'elle ne présente elle-même aucun caractère sensible.",
  },
  {
    legend: "Le nom et le prénom d'un salarié apparaissant en exemple dans une capture d'écran que vous voulez faire commenter par l'IA.",
    options: ACTIONS, answer: "remove",
    ok: "Exact. Le commentaire d'une interface générique n'a pas besoin d'un nom. Retirez-le et, si un repère est indispensable, recréez une capture de démonstration entièrement fictive.",
    why: "Remplacer le nom sur une capture réelle ne garantit pas que les métadonnées, autres champs ou détails visuels ne permettent plus d'identifier la personne. La minimisation prime.",
  },
  {
    legend: "Le nom de la structure cliente elle-même, dans un prompt demandant de reformuler un paragraphe générique de méthode pédagogique, sans rapport avec ce client précis.",
    options: ACTIONS, answer: "remove",
    ok: "Exact. Le paragraphe est générique et sans rapport avec ce client précis : son nom n'apporte rien à la tâche, il se retire entièrement.",
    why: "Le nom du client n'est utile que si la tâche en dépend. Ici, la reformulation porte sur une méthode générale : ce nom n'a aucune raison de figurer dans le prompt.",
  },
];

const EX2: Q[] = [
  {
    legend: "Vous utilisez la même conversation IA, ouverte depuis plusieurs semaines, pour avancer successivement sur les supports de trois clients différents, en changeant simplement de sujet d'une question à l'autre.",
    options: YESNO, answer: "non",
    ok: "Exact. Un fil distinct par mission réduit les mélanges de contexte, mais vous devez aussi contrôler le compte, la mémoire, les fichiers joints, les permissions et l'outil autorisé.",
    why: "Le cloisonnement conversationnel est une mesure d'organisation, pas une garantie de sécurité à lui seul.",
  },
  {
    legend: "Avant d'intégrer un paragraphe rédigé par l'IA dans un support de formation, vous vérifiez que chaque réglage ou fonctionnalité mentionné existe réellement dans la version du SIRH utilisée par ce client précis.",
    options: YESNO, answer: "oui",
    ok: "Exact. Vous seule connaissez la configuration réelle de chaque client : cette vérification est précisément la revue manuelle attendue avant tout usage d'un texte généré.",
    why: "Un contenu généré peut décrire un réglage plausible mais inexistant dans la version précise utilisée par ce client : seule une vérification humaine, spécifique à chaque client, permet de l'écarter.",
  },
  {
    legend: "Une mission chez un client vient de se terminer : vous continuez d'utiliser le compte professionnel que ce client vous avait ouvert sur son propre outil d'IA, « au cas où » une question resterait à traiter.",
    options: YESNO, answer: "non",
    ok: "Exact. Une mission terminée doit entraîner la révocation de l'accès qui allait avec, même par commodité : le garder « au cas où » est justement ce que le moindre privilège cherche à éviter.",
    why: "Un accès qui n'a plus de raison d'être, mais qui reste actif, est le scénario même que la révocation en fin de mission est censée prévenir.",
  },
  {
    legend: "Vous relisez systématiquement un texte généré par l'IA pour vérifier qu'aucun nom réel ne s'y est glissé, même quand le prompt de départ était déjà correctement anonymisé.",
    options: YESNO, answer: "oui",
    ok: "Exact. La relecture reste utile même après un prompt bien corrigé : une IA peut réintroduire un détail identifiant dans sa réponse, indépendamment de ce qui lui a été demandé.",
    why: "Corriger le prompt réduit le risque en amont, mais ne garantit rien sur ce que l'outil produit en sortie : la vérification finale reste un réflexe à part entière, à chaque fois.",
  },
];

/* ---------- 3. À vous de corriger et de justifier ---------- */

const PROMPT_TO_FIX = "Rédige un paragraphe d'introduction pour le guide de formation du SIRH que j'anime chez ce client : présente le module de gestion des absences, sachant que Karim Belaïd, responsable RH du client Ossature Bois Vosgienne, a demandé à ce qu'on insiste particulièrement sur le cas d'une salariée actuellement en arrêt longue maladie, dont le dossier n°4521 illustre bien la procédure à suivre.";
const MODEL_PROMPT = "Rédige un paragraphe d'introduction pour un guide de formation SIRH présentant le module de gestion des absences. Illustre uniquement les étapes génériques avec un profil de démonstration fictif et une absence prolongée fictive, sans reprendre le cas, le diagnostic, le numéro de dossier ou l'identité d'une personne réelle. N'invente aucun réglage : signale les informations manquantes.";
const MODEL_WHY = "Le nom, la fonction, la structure, le numéro de dossier et le cas de santé réel ont été retirés : aucun n'est nécessaire. L'exemple est recréé de zéro avec un profil et une absence fictifs. Le modèle doit signaler ce qu'il ignore au lieu d'inventer le fonctionnement du SIRH.";

type Draft = { prompt: string; justif: string };

function FixPrompt({ tint, onDone }: { tint: string; onDone: () => void }) {
  const th = useTh();
  const uid = useId();
  const [draft, setDraft] = useStored<Draft>(STORAGE_KEY, () => ({ prompt: "", justif: "" }),
    (v) => !!v && typeof (v as Draft).prompt === "string" && typeof (v as Draft).justif === "string");
  const [show, setShow] = useState(false);
  const [touched, setTouched] = useState(false);
  const modelRef = useRef<HTMLDivElement>(null);
  const written = draft.prompt.trim().length > 0;

  const toggle = () => {
    const next = !show;
    setShow(next);
    if (next && written) { onDone(); celebrate(modelRef.current, 0.8); }
  };
  const edit = (p: Partial<Draft>) => { setDraft((d) => ({ ...d, ...p })); setTouched(true); };
  const summary = () => [
    "Leçon 1.5 · Mon prompt corrigé", "", "Prompt à corriger (exemple fictif)", PROMPT_TO_FIX, "",
    "Mon prompt corrigé", draft.prompt || "(non renseigné)", "", "Ma justification", draft.justif || "(non renseignée)",
  ].join("\n");

  return (
    <ActivityCard tint={tint} title="À vous de corriger et de justifier" fictive>
      <p className="text-sm mb-4" style={{ color: th.fg2 }}>
        Voici un prompt à ne pas envoyer tel quel. Corrigez-le vous-même, puis écrivez la justification de chacun de vos choix, comme
        dans l'exemple travaillé du cours. Il n'y a pas de correction automatique ici : comparez ensuite votre réponse au corrigé indicatif.
      </p>
      <div className="rounded-[10px] px-4 py-3 mb-4" style={{ background: alpha(th.isDark ? "#fbc2ad" : "#b4442b", th.isDark ? 0.1 : 0.06), border: `1px dashed ${th.danger}` }}>
        <span className="block text-[11px] font-bold uppercase tracking-widest mb-1" style={{ color: th.danger }}>Prompt à corriger · à ne pas envoyer</span>
        <p className="text-sm" style={{ color: th.fg }}>« {PROMPT_TO_FIX} »</p>
      </div>

      <label htmlFor={`${uid}-p`} className="block text-sm font-semibold mb-1" style={{ color: th.fg }}>Votre prompt corrigé</label>
      <textarea id={`${uid}-p`} value={draft.prompt} onChange={(e) => edit({ prompt: e.target.value })} rows={5}
        placeholder="Écrivez ici votre version corrigée du prompt…"
        className="w-full rounded-[4px] px-3 py-2 text-sm bg-transparent" style={{ border: `1px solid ${th.sep}`, color: th.fg }} />
      <label htmlFor={`${uid}-j`} className="block text-sm font-semibold mt-4 mb-1" style={{ color: th.fg }}>Votre justification</label>
      <textarea id={`${uid}-j`} value={draft.justif} onChange={(e) => edit({ justif: e.target.value })} rows={4}
        placeholder="Expliquez ce que vous avez retiré, anonymisé ou gardé, et pourquoi…"
        className="w-full rounded-[4px] px-3 py-2 text-sm bg-transparent" style={{ border: `1px solid ${th.sep}`, color: th.fg }} />
      <p className="text-xs mt-1" aria-live="polite" style={{ color: th.fg3 }}>
        {touched ? "Brouillon enregistré dans ce navigateur." : "Votre brouillon est enregistré automatiquement dans ce navigateur."}
      </p>

      <div className="flex flex-wrap gap-2 mt-4">
        <ShimBtn sm onClick={toggle}>
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}{show ? "Masquer le corrigé indicatif" : "Voir le corrigé indicatif"}
        </ShimBtn>
      </div>
      {!written && show && <p className="text-xs mt-2" style={{ color: th.warn }}>Écrivez d'abord votre propre version : la comparaison n'a de sens qu'après votre essai.</p>}

      <div ref={modelRef} aria-live="polite">
        {show && (
          <div className="pg-pop mt-4 rounded-[12px] p-5" style={{ background: alpha(tint, th.isDark ? 0.12 : 0.14), border: `1px solid ${alpha(tint, 0.8)}` }}>
            <span className="block text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: th.fg }}>Corrigé indicatif</span>
            <p className="text-sm font-medium mb-3" style={{ color: th.fg }}>« {MODEL_PROMPT} »</p>
            <p className="text-sm" style={{ color: th.fg2 }}>{MODEL_WHY}</p>
          </div>
        )}
      </div>

      <ExportBar filename="mon-prompt-corrige-lecon-1-5.txt" build={summary} downloadLabel="Télécharger mon brouillon" />

      {show && written && (
        <Retain>
          Supprimer ce qui est inutile, anonymiser ce qui reste utile, travailler dans un cadre autorisé, puis vérifier la sortie. Un
          remplacement de nom (par exemple avec Rechercher et remplacer, Ctrl + H) reste une pseudonymisation tant qu'une correspondance
          existe : la donnée demeure personnelle. Recréer un exemple entièrement fictif est souvent plus sûr.
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
        Préparez un texte de travail anonymisé : dans votre traitement de texte, la commande Rechercher et remplacer (Ctrl + H)
        remplace un nom partout en une fois. Relisez ensuite le texte entier, puis soumettez-le, ou votre prompt corrigé, au
        chat Gemini du Studio. Relisez enfin la réponse : aucun nom réel ne doit y figurer.
      </p>
      <div className="flex flex-wrap gap-2">
        <VBtn sm onClick={() => navigate("/studio/gemini")}>Studio · Gemini <ArrowRight className="w-4 h-4" /></VBtn>
      </div>
      <p className="text-xs mt-3" style={{ color: th.fg3 }}>Le chat Gemini du Studio ne consomme pas votre budget IA personnel.</p>
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
