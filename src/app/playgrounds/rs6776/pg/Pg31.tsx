import { useEffect, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router";
import { ArrowRight, Check, Copy, Eye, EyeOff, RotateCcw, X } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { GCard } from "@/app/components/common/GCard";
import { ShimBtn, VBtn } from "@/app/components/common/Buttons";
import type { PlaygroundProps } from "@/app/playgrounds/registry";
import { Chip, Hero, ProgressRing, alpha, celebrate } from "@/app/playgrounds/ui";

// Playground natif de la leçon 3.1 « Produire des contenus inclusifs » (version SIRH),
// converti depuis docs/formation-rs6776/lecon-3.1/playground-nathalie.html.
// Quatre activités sur un même cas fictif (Brivelune Distribution) :
//  1. quel besoin d'accessibilité est prioritaire ? (5 situations, seuil 80 %) ;
//  2. cette correction répond-elle au besoin ? (5 corrections, seuil 80 %) ;
//  3. repérer un prompt d'accessibilité complet (3 besoins, seuil 80 %) ;
//  4. à vous d'adapter : brouillon à remettre, sauvegardé dans le navigateur, corrigé indicatif.

/* ---------- Contenu (repris du HTML d'origine) ---------- */

type Option = { label: string; ok: boolean; why: string };
type Question = { id: string; prompt: string; context?: { label: string; text: string }; options: Option[] };
type Exercise = { title: string; short: string; instructions: string; questions: Question[]; retain: string };

const VAC = (ok: "v" | "a" | "c", why: [string, string, string]): Option[] => [
  { label: "Visuel", ok: ok === "v", why: why[0] },
  { label: "Auditif", ok: ok === "a", why: why[1] },
  { label: "Cognitif", ok: ok === "c", why: why[2] },
];
// Exercice 2 : une seule explication, affichée quelle que soit la réponse.
const YN = (adapted: boolean, why: string): Option[] => [
  { label: "Adaptée", ok: adapted, why },
  { label: "Pas adaptée", ok: !adapted, why },
];

const EX1: Exercise = {
  title: "Quel besoin d'accessibilité est prioritaire ?",
  short: "Besoin prioritaire",
  instructions:
    "Pour chaque situation, partez de l'obstacle décrit et choisissez le besoin principalement concerné : visuel, auditif ou cognitif. Ces catégories servent de repères pédagogiques ; dans une situation réelle, plusieurs besoins peuvent se cumuler et la solution doit être vérifiée avec la personne concernée.",
  questions: [
    {
      id: "ex1-a",
      prompt: "Sur l'espace candidature en ligne de Brivelune Distribution, le bouton pour postuler n'est qu'une icône de flèche, sans aucun texte associé. Un candidat aveugle utilisant un lecteur d'écran entend seulement « bouton » sans savoir à quoi il sert.",
      options: VAC("v", [
        "Un lecteur d'écran a besoin d'un texte associé à chaque bouton pour être utile : une icône seule, sans label, est un obstacle typique pour une personne aveugle ou malvoyante.",
        "Le son n'est pas en cause ici : le problème est l'absence de texte associé à un élément visuel, ce qui relève du handicap visuel.",
        "Il ne s'agit pas d'une difficulté de compréhension du contenu, mais d'une absence totale d'information transmise par le lecteur d'écran : c'est un obstacle visuel.",
      ]),
    },
    {
      id: "ex1-b",
      prompt: "Brivelune Distribution a publié une vidéo de présentation de ses entrepôts sur sa page carrières, sans aucun sous-titre. Un candidat sourd ne peut pas suivre ce que dit la personne interviewée.",
      options: VAC("a", [
        "Le candidat voit bien la vidéo : ce qui lui manque, c'est le contenu sonore, absent de toute retranscription visuelle.",
        "Sans sous-titres ni transcription, tout le contenu sonore de la vidéo est inaccessible à une personne sourde ou malentendante : c'est un obstacle auditif classique.",
        "Le contenu n'est pas trop complexe à comprendre : il est simplement inaccessible sans le son, ce qui relève du handicap auditif.",
      ]),
    },
    {
      id: "ex1-c",
      prompt: "Une offre pour un poste de préparateur de commandes chez Brivelune Distribution contient un paragraphe unique de 15 lignes, sans puces ni retours à la ligne, mêlant missions, avantages et conditions de travail. Un candidat dyslexique abandonne sa lecture au bout de trois lignes.",
      options: VAC("c", [
        "Dans ce cas, l'obstacle décrit porte d'abord sur le traitement d'un texte dense. Une mise en page illisible pourrait aussi créer un besoin visuel, mais ce n'est pas l'information donnée ici.",
        "Aucun contenu sonore n'est en cause ici : le texte est écrit, le problème est sa structure.",
        "Le besoin prioritaire décrit concerne la compréhension et le traitement d'un texte dense. Des phrases courtes, une structure claire et des informations concrètes peuvent aider. Cela ne signifie pas que toute personne dyslexique a besoin de FALC, ni qu'un texte simplifié peut être appelé FALC sans la démarche de validation correspondante.",
      ]),
    },
    {
      id: "ex1-d",
      prompt: "Une infographie « Vos avantages chez Brivelune Distribution » (mutuelle, primes, RTT) illustre la page carrières, sans aucun texte alternatif renseigné.",
      options: VAC("v", [
        "Sans texte alternatif, un lecteur d'écran ne transmet aucune information sur le contenu de l'infographie à une personne aveugle ou malvoyante : c'est un obstacle visuel.",
        "Aucun contenu sonore n'est concerné : l'infographie est un élément visuel, sans son.",
        "Le problème n'est pas la complexité du contenu mais son absence totale de retranscription pour un lecteur d'écran : c'est un obstacle visuel.",
      ]),
    },
    {
      id: "ex1-e",
      prompt: "Pour certains postes, Brivelune Distribution ne propose qu'un entretien téléphonique comme unique étape avant embauche, sans alternative écrite ni visio sous-titrée. Une candidate sourde ne peut pas postuler dans ces conditions.",
      options: VAC("a", [
        "Rien n'indique un obstacle de perception visuelle ici : le canal proposé, le téléphone, est simplement inaccessible sans le son.",
        "Un canal exclusivement téléphonique, sans alternative écrite ou visio sous-titrée, exclut de fait les candidats sourds ou malentendants : c'est un obstacle auditif, ici au niveau du processus de recrutement lui-même, pas seulement du contenu.",
        "Ce n'est pas la complexité du contenu qui pose problème, mais l'absence de canal alternatif au téléphone.",
      ]),
    },
  ],
  retain:
    "Partez toujours de l'obstacle décrit. Visuel, auditif et cognitif sont des repères : une même personne peut cumuler plusieurs besoins, et l'obstacle peut tenir au processus lui-même (un canal unique), pas seulement au contenu. La solution se vérifie avec la personne concernée.",
};

const EX2: Exercise = {
  title: "Cette correction répond-elle au besoin ?",
  short: "Correction adaptée ?",
  instructions: "Le contexte est donné avant la correction apportée. Jugez si elle répond réellement au besoin d'accessibilité identifié.",
  questions: [
    {
      id: "ex2-a",
      // HTML d'origine : « utilisable au clavier et au lecteur d'écran ». Le cas 1a et la correction
      // ne portent que sur le lecteur d'écran : la consigne est alignée sur ce point.
      prompt: "Le bouton icône seule pour postuler (situation 1a) doit devenir compréhensible au lecteur d'écran.",
      context: { label: "Correction apportée", text: "Le bouton conserve son icône mais reçoit un texte associé « Postuler à cette offre », lu par le lecteur d'écran même si le texte visible reste l'icône." },
      options: YN(true, "Le lecteur d'écran annonce désormais clairement la fonction du bouton : c'est exactement ce qui manquait, l'apparence visuelle peut rester inchangée."),
    },
    {
      id: "ex2-b",
      prompt: "La vidéo de présentation des entrepôts (situation 1b) doit devenir suivable par une personne sourde.",
      context: { label: "Correction apportée", text: "Des sous-titres synchronisés ont été ajoutés à la vidéo, et une transcription complète est également disponible en téléchargement sous le lecteur." },
      options: YN(true, "Les sous-titres synchronisés permettent de suivre la vidéo en temps réel, et la transcription offre une alternative pour retrouver un passage précis : les deux besoins sont couverts."),
    },
    {
      id: "ex2-c",
      prompt: "L'offre au paragraphe dense de 15 lignes (situation 1c) doit devenir lisible par un candidat dyslexique.",
      context: { label: "Correction apportée", text: "Le paragraphe a été transformé en trois listes à puces (missions, avantages, conditions), mais chaque puce reprend les phrases longues et le vocabulaire d'origine sans les raccourcir." },
      options: YN(false, "La structure en listes aide, mais le vrai obstacle pour une personne dyslexique tient aussi à la longueur des phrases et au vocabulaire employé, pas seulement à la mise en forme : ces deux points restent inchangés."),
    },
    {
      id: "ex2-d",
      prompt: "L'infographie « Vos avantages » sans texte alternatif (situation 1d) doit devenir accessible à un lecteur d'écran.",
      context: { label: "Correction apportée", text: "Le texte alternatif renseigné est désormais « Infographie avantages salariés », sans détail sur le contenu réel. Aucune description détaillée ni liste accessible des trois avantages n'est proposée dans la page." },
      options: YN(false, "Le texte alternatif répète seulement le titre. Pour une infographie complexe, il faut une alternative courte qui l'identifie, puis une description détaillée ou une liste accessible transmettant la mutuelle, les primes et les RTT."),
    },
    {
      id: "ex2-e",
      prompt: "Le processus reposant uniquement sur un entretien téléphonique (situation 1e) doit devenir accessible à une candidate sourde.",
      context: { label: "Correction apportée", text: "Un entretien par écrit (questionnaire détaillé) ou en visio sous-titrée est désormais proposé comme alternative explicite à l'entretien téléphonique, mentionnée dans l'offre." },
      options: YN(true, "Une alternative accessible et clairement annoncée dans l'offre permet à une candidate sourde de postuler dans les mêmes conditions que les autres candidats."),
    },
  ],
  retain:
    "Une correction est adaptée quand elle lève réellement l'obstacle identifié. Changer la mise en forme sans raccourcir les phrases ni simplifier le vocabulaire, ou répéter un titre en guise de texte alternatif, ne suffit pas : l'information doit rester complète et accessible.",
};

const ALT_PROMPT =
  "Voici une infographie présentant trois avantages salariés : mutuelle, primes, RTT. Propose un texte alternatif court qui identifie l'infographie et son message, puis une liste détaillée accessible à placer juste après l'image. Conserve exactement ces trois informations et n'en invente aucune.";

const EX3: Exercise = {
  title: "Repérer un prompt d'accessibilité complet",
  short: "Le bon prompt",
  instructions: "Pour chaque besoin, un seul prompt pose vraiment la contrainte d'accessibilité et précise ce qui doit être conservé.",
  questions: [
    {
      id: "ex3-a",
      prompt: "Obtenir un texte alternatif utile pour l'infographie « Vos avantages chez Brivelune Distribution » (mutuelle, primes, RTT).",
      options: [
        { label: "« Décris cette image. »", ok: false, why: "« Décris cette image » ne précise ni le public visé (lecteur d'écran) ni l'exigence de transmettre le contenu informatif plutôt que l'apparence." },
        { label: `« ${ALT_PROMPT} »`, ok: true, why: "Le prompt distingue l'alternative courte de l'équivalent détaillé dans la page, protège les trois informations utiles et interdit d'inventer des avantages absents de la source." },
        { label: "« Trouve-moi un titre court pour cette infographie. »", ok: false, why: "Un simple titre répété n'apporte aucune information sur le contenu réel de l'infographie à une personne qui ne la voit pas." },
        { label: "« Décris les couleurs et la mise en page de cette infographie. »", ok: false, why: "Cette description reste purement visuelle et esthétique : elle ne transmet aucune des trois informations utiles à un candidat qui ne voit pas l'image." },
      ],
    },
    {
      id: "ex3-b",
      prompt: "Reformuler l'offre au paragraphe dense de 15 lignes pour un candidat dyslexique, sans perdre les missions, avantages et conditions déjà présents.",
      options: [
        { label: "« Simplifie ce texte. »", ok: false, why: "« Simplifie ce texte » ne précise ni les règles à appliquer, ni ce qui doit être conservé, ni le format de sortie attendu." },
        { label: "« Résume ce texte en trois phrases. »", ok: false, why: "Résumer risque de perdre des informations obligatoires (une mission, une condition) sans qu'aucune règle de structure ou de vocabulaire ne soit posée." },
        { label: "« Voici une offre d'emploi : [coller le texte]. Réécris-la avec une idée par phrase, un vocabulaire courant, en listes séparées pour les missions, les avantages et les conditions. Ne supprime et n'invente aucune information. Signale tout passage trop vague pour être reformulé fidèlement. Présente la sortie comme un brouillon à faire tester avant publication. »", ok: true, why: "Le prompt pose des règles de langage clair et d'accessibilité cognitive, protège les informations obligatoires et demande de signaler les ambiguïtés. La sortie reste un brouillon à tester ; elle ne peut être appelée FALC qu'après application complète de cette démarche, dont la participation de personnes en situation de handicap intellectuel." },
        { label: "« Rends ce texte plus dynamique. »", ok: false, why: "Un ton plus dynamique ne résout pas le problème identifié, qui porte sur la structure et la longueur des phrases, pas sur le registre." },
      ],
    },
    {
      id: "ex3-c",
      prompt: "Obtenir des sous-titres fiables pour la vidéo de présentation des entrepôts, avant publication.",
      options: [
        { label: "« Génère des sous-titres pour cette vidéo et publie-la directement. »", ok: false, why: "Publier des sous-titres générés automatiquement sans relecture risque de transmettre des erreurs, en particulier sur les noms propres ou les termes techniques." },
        { label: "« Génère un premier jeu de sous-titres synchronisés pour cette vidéo à partir de sa bande son. Signale les passages où un nom propre ou un terme technique est incertain, pour que je les relise moi-même avant publication. »", ok: true, why: "Le prompt demande une première génération, mais prévoit explicitement une relecture humaine avant publication, en particulier sur les noms propres, ce qui est la bonne méthode." },
        // HTML d'origine : explication parlant d'une « transcription seule » pour une option qui demande un résumé.
        { label: "« Fais-moi juste un résumé de ce qui est dit dans la vidéo. »", ok: false, why: "Un résumé n'est ni complet ni synchronisé : sans sous-titres sur la vidéo elle-même, il ne permet pas de suivre la vidéo en temps réel." },
        { label: "« Retire le son de la vidéo pour éviter tout problème d'accessibilité. »", ok: false, why: "Retirer le son ne résout rien : le problème est l'absence d'équivalent textuel du contenu sonore, pas la présence du son lui-même." },
      ],
    },
  ],
  retain:
    "L'IA ne produit pas un contenu accessible par défaut : la contrainte s'écrit dans le prompt. Un prompt complet nomme le public, précise ce qui doit être conservé, interdit d'inventer et prévoit une relecture humaine avant publication.",
};

const EX4 = {
  title: "À vous d'adapter (à remettre)",
  short: "À vous d'adapter",
  storageKey: "nathalie_playground_3_1_ex4", // même clé que le HTML d'origine : les brouillons déjà saisis sont retrouvés
  source:
    "« Le titulaire du poste assurera la réception des candidatures entrantes, leur enregistrement dans le SIRH et la sollicitation des pièces manquantes dans un délai de 48 heures. Après une relance restée sans réponse, le dossier sera signalé comme incomplet au responsable du recrutement, sans rejet automatique. Le poste implique des échanges avec les responsables d'entrepôt et le service RH. Une première expérience en logistique est appréciée mais ne constitue pas un prérequis. »",
  audience:
    "Public visé : une personne présentant un handicap cognitif qui rencontre des difficultés avec les phrases longues, les implicites et les consignes regroupant plusieurs actions. Rédigez vos critères fonctionnels, puis votre prompt et la version adaptée. Comparez chaque information au texte source, signalez tout ajout ou perte et expliquez comment vous feriez tester le résultat. Si vous souhaitez qualifier le document de FALC, précisez la participation de personnes en situation de handicap intellectuel à sa rédaction et à sa relecture.",
  placeholder: "Critères d'accessibilité :\nPrompt d'adaptation :\nVersion adaptée :\nVérification par rapport à la source :",
  version: [
    "Vos missions :",
    "Vous recevez les candidatures.",
    "Vous enregistrez chaque candidature dans le logiciel SIRH.",
    "S'il manque un document, vous le demandez dans les 48 heures.",
    "Si le document manque encore après votre relance, vous signalez le dossier au responsable du recrutement.",
    "Vous ne rejetez pas automatiquement la candidature.",
    "Vous échangez avec les responsables d'entrepôt et le service RH.",
    "Vous pouvez postuler sans expérience en logistique.",
  ],
  justification: [
    ["Vocabulaire", "les verbes décrivent directement les actions attendues."],
    ["Structure", "une action par phrase et un ordre proche du déroulement du travail."],
    ["Fond préservé", "le SIRH, le délai exact de 48 heures, la relance, le signalement sans rejet automatique, les interlocuteurs et le caractère facultatif de l'expérience sont conservés. Cette version relève du langage clair et de l'accessibilité cognitive ; elle ne devient FALC qu'après application de la démarche de participation et de validation correspondante."],
  ] as [string, string][],
  retain:
    "Simplifier sans appauvrir : chaque information du texte source doit se retrouver dans la version adaptée, sans ajout. Un texte en langage clair n'est pas un FALC validé tant que des personnes en situation de handicap intellectuel n'ont pas participé à sa rédaction et à sa relecture.",
};

const TINTS = ["#b58de0", "#78d5e2", "#6adeb1", "#fbc2ad"];
const PASS = 0.8;

/* ---------- Composant ---------- */

export default function Pg31(_props: PlaygroundProps) {
  const th = useTh();
  const [step, setStep] = useState(0);
  const [done, setDone] = useState<boolean[]>([false, false, false, false]);
  const markDone = (i: number) => setDone((d) => (d[i] ? d : d.map((v, j) => (j === i ? true : v))));
  const navRef = useRef<HTMLElement>(null);
  const doneCount = done.filter(Boolean).length;
  const prevDone = useRef(0);
  useEffect(() => {
    if (doneCount > prevDone.current) celebrate(navRef.current, 0.6);
    prevDone.current = doneCount;
  }, [doneCount]);

  const exercises = [EX1, EX2, EX3];
  const labels = [EX1.short, EX2.short, EX3.short, EX4.short];

  return (
    <div className="flex flex-col gap-5">
      <Hero>
        <div className="flex flex-col md:flex-row md:items-center gap-5 md:pr-24">
          <div className="flex-1">
            <p className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: th.fg3 }}>Playground · Leçon 3.1</p>
            <h2 className="text-2xl md:text-3xl font-semibold leading-tight mb-2" style={{ color: th.fg }}>
              Produire des contenus <span className="hl">accessibles</span>, cas pratiques
            </h2>
            <p className="text-sm max-w-[70ch]" style={{ color: th.fg2 }}>
              Mettez en pratique la méthode de cette leçon sur des cas fictifs, tous liés au même contexte : vous accompagnez
              Brivelune Distribution, une enseigne de distribution qui recrute pour ses entrepôts et ses points de vente, sur la
              rédaction de ses offres et le paramétrage de son espace candidature en ligne. Chaque exercice a son propre bouton
              de correction et son propre score.
            </p>
            <div className="mt-3"><Chip tint="#fbc2ad">Exemple fictif</Chip></div>
          </div>
          <ProgressRing value={doneCount / labels.length} label="réalisé" />
        </div>
      </Hero>

      <nav ref={navRef} className="grid grid-cols-2 lg:grid-cols-4 gap-2" aria-label="Activités">
        {labels.map((label, i) => {
          const tint = TINTS[i];
          const active = step === i;
          return (
            <button key={label} type="button" onClick={() => setStep(i)} aria-current={active ? "step" : undefined}
              className="pg-tile flex items-center gap-2.5 rounded-[12px] px-3 py-3 text-left text-xs font-semibold"
              style={{ background: active ? `linear-gradient(135deg, ${alpha(tint, 0.9)}, ${alpha(tint, 0.55)})` : alpha(tint, th.isDark ? 0.1 : 0.12), border: `1px solid ${alpha(tint, active ? 1 : 0.5)}`, color: active ? "#111" : th.fg }}>
              <span className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold" style={{ background: done[i] ? "var(--grad-iris)" : active ? "rgba(255,255,255,.55)" : alpha(tint, 0.35), color: "#111" }}>
                {done[i] ? <Check className="w-3.5 h-3.5" aria-label="Terminé" /> : i + 1}
              </span>
              {label}
            </button>
          );
        })}
      </nav>

      {step < 3 && (
        <QuizExercise key={step} n={step + 1} ex={exercises[step]} tint={TINTS[step]}
          onPass={() => markDone(step)} onNext={() => setStep(step + 1)} />
      )}
      {step === 3 && <WrittenExercise tint={TINTS[3]} onDone={() => markDone(3)} />}

      <ContinueOnPlatform />

      <p className="text-xs" style={{ color: th.fg3 }}>Toutes les entreprises, personnes et données chiffrées de cet exercice sont fictives.</p>
    </div>
  );
}

/* ---------- Exercices à choix (1 à 3) ---------- */

function QuizExercise({ n, ex, tint, onPass, onNext }: { n: number; ex: Exercise; tint: string; onPass: () => void; onNext: () => void }) {
  const th = useTh();
  const [picks, setPicks] = useState<Record<string, number>>({});
  const [corrected, setCorrected] = useState(false);
  const total = ex.questions.length;
  const score = ex.questions.filter((q) => picks[q.id] !== undefined && q.options[picks[q.id]].ok).length;
  const pct = Math.round((score / total) * 100);
  const passed = corrected && score / total >= PASS;

  const pick = (qid: string, i: number) => { setPicks((p) => ({ ...p, [qid]: i })); setCorrected(false); };
  const correct = () => { setCorrected(true); if (score / total >= PASS) onPass(); };
  const reset = () => { setPicks({}); setCorrected(false); };

  return (
    <GCard className="p-6">
      <ExerciseHeader n={n} title={ex.title} tint={tint} />
      <p className="text-sm mb-5" style={{ color: th.fg2 }}>{ex.instructions}</p>
      <div className="flex flex-col gap-4">
        {ex.questions.map((q, qi) => {
          const chosen = picks[q.id];
          const short = q.options.every((o) => o.label.length < 24);
          const fb = corrected
            ? chosen === undefined
              ? { tone: "bad" as const, text: "Pas de réponse sélectionnée." }
              : q.options[chosen].ok
                ? { tone: "ok" as const, text: `Bonne réponse. ${q.options[chosen].why}` }
                : { tone: "bad" as const, text: `À revoir. ${q.options[chosen].why}` }
            : null;
          return (
            <fieldset key={q.id} className="rounded-[10px] p-4" style={{ border: `1px solid ${th.sep}`, background: alpha(tint, th.isDark ? 0.05 : 0.05) }}>
              <legend className="sr-only">Cas {qi + 1}</legend>
              <p className="text-sm mb-3" style={{ color: th.fg }}><strong>{String.fromCharCode(97 + qi)}.</strong> {q.prompt}</p>
              {q.context && (
                <div className="rounded-[8px] px-4 py-3 mb-3" style={{ background: th.card, border: `1px solid ${th.sep}` }}>
                  <span className="block text-[10.5px] font-bold uppercase tracking-widest mb-1" style={{ color: th.fg3 }}>{q.context.label}</span>
                  <p className="text-sm" style={{ color: th.fg }}>{q.context.text}</p>
                </div>
              )}
              <div className={short ? "flex flex-wrap gap-2" : "flex flex-col gap-2"}>
                {q.options.map((o, oi) => (
                  <OptionButton key={oi} label={o.label} tint={tint} selected={chosen === oi}
                    state={!corrected ? "idle" : chosen === oi ? (o.ok ? "ok" : "bad") : o.ok ? "reveal" : "idle"}
                    onClick={() => pick(q.id, oi)} />
                ))}
              </div>
              <div role="status" aria-live="polite">
                {fb && (
                  <p className="pg-pop text-sm mt-3 rounded-[8px] px-3 py-2"
                    style={{ background: alpha(fb.tone === "ok" ? "#6adeb1" : "#fbc2ad", th.isDark ? 0.12 : 0.18), color: fb.tone === "ok" ? th.success : th.danger }}>
                    {fb.text}
                  </p>
                )}
              </div>
            </fieldset>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 mt-5 pt-4" style={{ borderTop: `1px dashed ${th.sep}` }}>
        <div className="flex flex-wrap gap-2">
          <ShimBtn sm onClick={correct}>Corriger mes réponses</ShimBtn>
          {Object.keys(picks).length > 0 && <VBtn sm onClick={reset}><RotateCcw className="w-4 h-4" />Recommencer</VBtn>}
        </div>
        <p className="text-sm" style={{ color: th.fg2 }} aria-live="polite">
          Score : <strong style={{ color: th.fg }}>{corrected ? score : 0} / {total}</strong> · seuil de réussite : 80 %
        </p>
      </div>
      <div role="status" aria-live="polite">
        {corrected && (
          <p className="pg-pop mt-3 rounded-[8px] px-4 py-2.5 text-sm font-semibold"
            style={{ background: alpha(passed ? "#6adeb1" : "#f6d38e", th.isDark ? 0.14 : 0.22), color: passed ? th.success : th.warn }}>
            {passed ? `Seuil atteint (${pct} %). Bon travail.` : `Sous le seuil de réussite (${pct} %). Relisez les explications ci-dessus et retentez.`}
          </p>
        )}
      </div>
      {passed && (
        <>
          <Retain tint={tint}>{ex.retain}</Retain>
          <div className="mt-4"><ShimBtn sm onClick={onNext}>Activité suivante <ArrowRight className="w-4 h-4" /></ShimBtn></div>
        </>
      )}
    </GCard>
  );
}

function OptionButton({ label, tint, selected, state, onClick }: {
  label: string; tint: string; selected: boolean; state: "idle" | "ok" | "bad" | "reveal"; onClick: () => void;
}) {
  const th = useTh();
  const border = state === "ok" || state === "reveal" ? th.success : state === "bad" ? th.danger : selected ? tint : th.sep;
  const bg = state === "ok" ? alpha("#6adeb1", th.isDark ? 0.14 : 0.18) : state === "bad" ? alpha("#fbc2ad", th.isDark ? 0.14 : 0.22) : selected ? alpha(tint, th.isDark ? 0.2 : 0.22) : th.card;
  return (
    <button type="button" onClick={onClick} aria-pressed={selected}
      className="flex items-start gap-2.5 text-left rounded-[8px] px-3.5 py-2.5 text-sm transition-colors"
      style={{ border: `1.5px ${state === "reveal" ? "dashed" : "solid"} ${border}`, background: bg, color: th.fg }}>
      <span aria-hidden className="mt-0.5 w-4 h-4 rounded-full shrink-0 flex items-center justify-center"
        style={{ border: `1.5px solid ${selected ? th.fg : th.fg3}` }}>
        {selected && <span className="w-2 h-2 rounded-full" style={{ background: th.fg }} />}
      </span>
      <span className="flex-1">{label}</span>
      {state === "ok" && <Check className="w-4 h-4 shrink-0" style={{ color: th.success }} aria-hidden />}
      {state === "bad" && <X className="w-4 h-4 shrink-0" style={{ color: th.danger }} aria-hidden />}
      {state === "reveal" && <span className="sr-only">(bonne réponse)</span>}
      {state === "reveal" && <span className="text-[11px] font-semibold shrink-0" style={{ color: th.success }} aria-hidden>Bonne réponse</span>}
    </button>
  );
}

/* ---------- 4. À vous d'adapter ---------- */

function WrittenExercise({ tint, onDone }: { tint: string; onDone: () => void }) {
  const th = useTh();
  const [text, setText] = useState(() => {
    try { return window.localStorage.getItem(EX4.storageKey) ?? ""; } catch { return ""; }
  });
  const [shown, setShown] = useState(false);
  const change = (v: string) => {
    setText(v);
    try { window.localStorage.setItem(EX4.storageKey, v); } catch { /* stockage local indisponible */ }
  };
  const toggle = () => setShown((s) => !s);
  // Activité réalisée : un brouillon rédigé et le corrigé consulté.
  useEffect(() => { if (shown && text.trim()) onDone(); }, [shown, text, onDone]);

  return (
    <GCard className="p-6">
      <ExerciseHeader n={4} title={EX4.title} tint={tint} />
      <p className="text-sm mb-4" style={{ color: th.fg2 }}>
        Votre brouillon est sauvegardé automatiquement dans ce navigateur. Remettez au formateur le texte de départ, votre prompt,
        la version adaptée et votre propre vérification.
      </p>
      <div className="rounded-[10px] px-4 py-3 mb-4" style={{ background: alpha(tint, th.isDark ? 0.1 : 0.14), border: `1px solid ${alpha(tint, 0.6)}` }}>
        <span className="block text-[10.5px] font-bold uppercase tracking-widest mb-1" style={{ color: th.fg3 }}>Extrait d'offre généré, à adapter</span>
        <p className="text-sm" style={{ color: th.fg }}>{EX4.source}</p>
      </div>
      <p className="text-sm mb-4" style={{ color: th.fg2 }}>{EX4.audience}</p>
      <label htmlFor="pg31-ex4" className="block text-xs font-semibold mb-1.5" style={{ color: th.fg3 }}>
        Vos critères, votre prompt, la version adaptée et votre vérification
      </label>
      <textarea id="pg31-ex4" value={text} onChange={(e) => change(e.target.value)} placeholder={EX4.placeholder} rows={9}
        className="w-full rounded-[8px] p-3.5 text-sm leading-relaxed resize-y outline-none focus-visible:ring-2"
        style={{ background: th.card, color: th.fg, border: `1px solid ${th.inputB}` }} />
      <p className="text-xs mt-1.5" style={{ color: th.fg3 }}>Votre brouillon est enregistré automatiquement pendant que vous écrivez.</p>

      <div className="mt-5 pt-4" style={{ borderTop: `1px dashed ${th.sep}` }}>
        <VBtn sm onClick={toggle}>
          {shown ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          {shown ? "Masquer le corrigé indicatif" : "Voir un corrigé indicatif"}
        </VBtn>
        {!text.trim() && !shown && (
          <p className="text-xs mt-2" style={{ color: th.fg3 }}>Rédigez votre brouillon avant de consulter le corrigé : l'activité sera alors comptée comme réalisée.</p>
        )}
        <div aria-live="polite">
          {shown && (
            <div className="pg-pop mt-4 grid gap-3">
              <div className="rounded-[10px] px-4 py-3" style={{ border: `1px solid ${th.sep}` }}>
                <span className="block text-[10.5px] font-bold uppercase tracking-widest mb-2" style={{ color: th.fg3 }}>Une version possible</span>
                <div className="text-sm flex flex-col gap-0.5" style={{ color: th.fg }}>
                  {EX4.version.map((l, i) => <p key={i}>{i === 0 ? "« " : ""}{l}{i === EX4.version.length - 1 ? " »" : ""}</p>)}
                </div>
              </div>
              <div className="rounded-[10px] px-4 py-3" style={{ border: `1px solid ${th.sep}` }}>
                <span className="block text-[10.5px] font-bold uppercase tracking-widest mb-2" style={{ color: th.fg3 }}>Justification indicative</span>
                <div className="text-sm flex flex-col gap-1.5" style={{ color: th.fg }}>
                  {EX4.justification.map(([k, v]) => <p key={k}><strong>{k} :</strong> {v}</p>)}
                </div>
              </div>
              <Retain tint={tint}>{EX4.retain}</Retain>
            </div>
          )}
        </div>
      </div>
    </GCard>
  );
}

/* ---------- Commun ---------- */

function ExerciseHeader({ n, title, tint }: { n: number; title: string; tint: string }) {
  const th = useTh();
  return (
    <div className="flex flex-wrap items-center gap-3 mb-3">
      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold shrink-0" style={{ background: tint, color: "#111" }}>{n}</span>
      <h3 className="text-lg font-semibold flex-1 min-w-[12rem]" style={{ color: th.fg }}>{title}</h3>
      <Chip tint={tint}>Exemple fictif · Brivelune Distribution</Chip>
    </div>
  );
}

function Retain({ children, tint = "#b58de0" }: { children: ReactNode; tint?: string }) {
  const th = useTh();
  return (
    <div className="pg-pop mt-4 rounded-[10px] px-4 py-3 text-sm" style={{ background: alpha(tint, th.isDark ? 0.12 : 0.14), borderLeft: `3px solid ${tint}`, color: th.fg2 }}>
      <span className="block text-[11px] font-bold uppercase tracking-widest mb-1" style={{ color: th.fg }}>Ce qu'il faut retenir</span>
      {children}
    </div>
  );
}

function ContinueOnPlatform() {
  const th = useTh();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(ALT_PROMPT); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* presse-papiers refusé */ }
  };
  return (
    <GCard className="p-6">
      <p className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: th.fg3 }}>Pour aller plus loin sur la plateforme</p>
      <p className="text-sm mb-3" style={{ color: th.fg2 }}>
        <strong style={{ color: th.fg }}>Un texte alternatif dans les chats du Studio.</strong> Reprenez le prompt complet de l'exercice 3,
        adaptez-le à un visuel que vous connaissez (sans donnée personnelle), puis relisez la sortie : elle reste un brouillon à vérifier.
      </p>
      <div className="flex items-start gap-2 rounded-[4px] px-4 py-3 mb-3" style={{ border: `1px solid ${th.sep}` }}>
        <p className="text-sm flex-1" style={{ color: th.fg }}>{ALT_PROMPT}</p>
        <button type="button" onClick={() => void copy()} className="inline-flex items-center gap-1 text-xs font-semibold shrink-0" style={{ color: th.fg2 }} aria-live="polite">
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}{copied ? "Copié" : "Copier"}
        </button>
      </div>
      <div className="flex flex-wrap gap-2 mb-5">
        <VBtn sm onClick={() => navigate("/studio/chatgpt")}>Studio · ChatGPT</VBtn>
        <VBtn sm onClick={() => navigate("/studio/claude")}>Studio · Claude</VBtn>
        <VBtn sm onClick={() => navigate("/studio/gemini")}>Studio · Gemini</VBtn>
      </div>
      <p className="text-sm mb-3" style={{ color: th.fg2 }}>
        <strong style={{ color: th.fg }}>Une version audio de votre texte.</strong> Dans le Studio, « Du texte à l'audio » transforme un
        texte en fichier audio : écoutez par exemple la version adaptée de l'exercice 4 pour vérifier qu'elle reste claire à l'oral.
      </p>
      <VBtn sm onClick={() => navigate("/studio/text-to-speech")}>Studio · Du texte à l'audio</VBtn>
    </GCard>
  );
}
