import { useEffect, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router";
import { ArrowRight, Check, Compass, Copy, Eye, EyeOff, RotateCcw, X } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { GCard } from "@/app/components/common/GCard";
import { ShimBtn, VBtn } from "@/app/components/common/Buttons";
import type { PlaygroundProps } from "@/app/playgrounds/registry";
import { Chip, Hero, ProgressRing, alpha, celebrate } from "@/app/playgrounds/ui";

// Playground natif de la leçon 3.2 « Cadre légal : IA Act, RGPD et veille » (version SIRH),
// converti depuis docs/formation-rs6776/lecon-3.2/playground-nathalie.html.
// Quatre activités sur un même cas fictif (Tarnaud Logistique) :
//  1. quel régime principal de l'IA Act ? (5 options du logiciel, seuil 80 %) ;
//  2. cette mesure suffit-elle pour le point contrôlé ? (5 paramétrages, seuil 80 %) ;
//  3. repérer un prompt utile pour la mission (3 besoins, seuil 80 %) ;
//  4. à vous de corriger un paramétrage : brouillon à remettre, sauvegardé dans le navigateur, corrigé indicatif.
// L'analyse d'impact, citée par le HTML d'origine mais absente du cours, est conservée et
// présentée comme une piste d'approfondissement (sans date, article ni montant ajoutés).

/* ---------- Contenu (repris du HTML d'origine) ---------- */

type Option = { label: string; ok: boolean; why: string };
type Question = { id: string; prompt: string; context?: { label: string; text: string }; options: Option[] };
type Exercise = { title: string; short: string; instructions: string; questions: Question[]; retain: string };

const LEVELS = ["Inacceptable", "Élevé", "Limité", "Minimal"] as const;
const RISK = (ok: (typeof LEVELS)[number], why: [string, string, string, string]): Option[] =>
  LEVELS.map((label, i) => ({ label, ok: label === ok, why: why[i] }));
// Exercice 2 : une seule explication, affichée quelle que soit la réponse.
const YN = (compliant: boolean, why: string): Option[] => [
  { label: "Conforme", ok: compliant, why },
  { label: "Pas conforme", ok: !compliant, why },
];

const EX1: Exercise = {
  title: "Quel régime principal de l'IA Act ?",
  short: "Régime IA Act",
  instructions:
    "Pour chaque option, utilisez la grille pédagogique de la leçon : pratique interdite, haut risque, transparence spécifique (« limité » dans les réponses) ou risque faible/minimal. Vérifiez toujours ensuite les définitions et exceptions du texte, ainsi que les autres règles applicables.",
  questions: [
    {
      id: "ex1-a",
      prompt: "Un chatbot est ajouté à la page carrières pour répondre aux questions fréquentes des candidats (horaires, adresse, documents à fournir). Il précise en début d'échange : « Je suis un assistant virtuel. »",
      options: RISK("Limité", [
        "Un chatbot d'assistance générale qui informe qu'il s'agit d'une IA n'a rien d'une pratique interdite.",
        "Ce chatbot ne prend aucune décision sur une candidature : il ne relève pas de la liste des usages à haut risque.",
        "Ce système qui interagit directement avec des personnes relève d'une obligation de transparence spécifique : les candidats doivent savoir qu'ils échangent avec une IA, sauf si cela ressort déjà clairement du contexte. Cette obligation est ici respectée.",
        "Un chatbot qui interagit directement avec des candidats reste soumis à l'obligation de transparence de l'IA Act : ce n'est pas un usage sans aucune obligation.",
      ]),
    },
    {
      id: "ex1-b",
      prompt: "Une option du logiciel analyse chaque CV reçu et attribue une note qui détermine directement quels candidats sont présélectionnés pour un entretien.",
      options: RISK("Élevé", [
        "Cet usage reste autorisé sous conditions : il n'est pas interdit en tant que tel, contrairement à une pratique de risque inacceptable.",
        "Le recrutement figure explicitement dans la liste des usages à haut risque : gestion des risques, documentation et supervision humaine réelle sont exigées.",
        "La seule transparence ne suffit pas ici : une note qui détermine directement une présélection relève du niveau élevé, pas du niveau limité.",
        "Cette option influence directement le devenir d'une candidature réelle : elle ne peut pas être classée en risque minimal.",
      ]),
    },
    {
      id: "ex1-c",
      prompt: "Le service communication de Tarnaud Logistique utilise un outil d'IA générative pour rédiger des accroches marketing pour les annonces, sans lien avec l'évaluation d'un candidat précis.",
      options: RISK("Minimal", [
        "Rédiger une accroche marketing n'a rien d'une pratique interdite.",
        "Aucune décision concernant une personne réelle n'est prise ici : ce n'est pas un usage à haut risque.",
        "Ce contenu marketing ne relève pas d'une obligation de transparence spécifique de l'IA Act : c'est un usage courant sans enjeu pour une personne tierce.",
        "Générer une accroche marketing, sans lien avec l'évaluation d'un candidat, relève de la majorité des usages courants d'assistants génératifs : risque minimal.",
      ]),
    },
    {
      id: "ex1-d",
      prompt: "Tarnaud Logistique envisage d'installer un système qui analyse en temps réel les expressions du visage des candidats pendant leurs entretiens, pour évaluer leur « motivation » et leur « stress », sans lien avec un besoin médical ou de sécurité.",
      options: RISK("Inacceptable", [
        "La reconnaissance des émotions sur le lieu de travail, en dehors de tout motif médical ou de sécurité, fait partie des pratiques interdites par l'IA Act, quelle que soit l'intention affichée.",
        "Ce système n'est pas seulement encadré, il est purement et simplement interdit dans ce contexte, hors motif médical ou de sécurité : c'est un cas de risque inacceptable.",
        "La seule transparence ne suffirait pas à rendre ce système licite : ce type d'usage est interdit, pas seulement encadré.",
        "Ce système ne peut en aucun cas être qualifié de risque minimal : il relève des pratiques interdites.",
      ]),
    },
    {
      id: "ex1-e",
      prompt: "Une vidéo générée par IA montre la directrice réelle de Tarnaud Logistique visitant un entrepôt et tenant un discours qu'elle n'a jamais enregistré. Elle est publiée avec la mention visible « Vidéo générée par intelligence artificielle ».",
      options: RISK("Limité", [
        "La création d'un deepfake professionnel n'est pas automatiquement une pratique interdite, mais sa diffusion et les droits de la personne représentée doivent être contrôlés.",
        "Cette vidéo ne décide ni d'un recrutement ni d'un droit individuel : elle ne relève pas, pour ce seul motif, d'un usage à haut risque de l'annexe III.",
        "La vidéo ressemble à une personne existante et peut paraître authentique : elle répond à la définition du deepfake. Le déployeur doit la signaler clairement au plus tard lors de la première exposition. Cette mention visible ne permet toutefois pas, à elle seule, de vérifier le marquage détectable par machine attendu du fournisseur ni les autres droits applicables.",
        "Ce cas relève d'une obligation de transparence propre aux deepfakes. Une vidéo synthétique qui ne ressemble pas à une personne, un lieu ou un événement existant pourrait recevoir une autre analyse, mais ce n'est pas le cas décrit.",
      ]),
    },
  ],
  retain:
    "La grille en quatre niveaux est un repère pédagogique : on qualifie un usage selon sa fonction, sa finalité et son contexte, pas selon l'étiquette commerciale de l'outil. Une même entreprise peut relever de plusieurs régimes à la fois, et chaque qualification se vérifie ensuite dans le texte, avec ses définitions et ses exceptions.",
};

const EX2: Exercise = {
  title: "Cette mesure suffit-elle pour le point contrôlé ?",
  short: "Mesure suffisante ?",
  instructions:
    "Jugez chaque paramétrage au regard du point précis décrit. Une réponse « conforme » signifie seulement que ce contrôle est correctement traité : elle ne suffit jamais à déclarer l'ensemble du système conforme.",
  questions: [
    {
      id: "ex2-a",
      prompt: "Le service RH souhaite gagner du temps sur les candidatures les plus faibles.",
      context: { label: "Paramétrage envisagé", text: "Toute candidature notée en dessous de 30 sur 100 est automatiquement rejetée, sans relecture par un recruteur." },
      options: YN(false, "Le rejet est exclusivement automatisé et affecte fortement la candidature : l'article 22 du RGPD doit être analysé, avec ses exceptions et garanties. En parallèle, le système à haut risque doit permettre une supervision humaine effective au sens de l'IA Act. Un simple objectif de gain de temps ne satisfait aucune de ces exigences."),
    },
    {
      id: "ex2-b",
      prompt: "Une alternative est proposée pour tenir compte de cette même contrainte de temps.",
      context: { label: "Paramétrage envisagé", text: "Le score sert uniquement à trier l'ordre d'affichage des candidatures pour le recruteur, qui reste tenu d'ouvrir et d'examiner chaque CV avant toute décision." },
      options: YN(false, "Ouvrir chaque CV ne démontre pas une supervision effective. L'ordre imposé par le score peut créer un biais d'automatisation. Il faut définir une revue indépendante, former la personne, lui donner le temps et l'autorité d'ignorer le score, puis tracer les désaccords et les décisions."),
    },
    {
      id: "ex2-c",
      prompt: "La durée de conservation des dossiers de candidats notés par l'outil n'a pas été modifiée depuis l'installation.",
      context: { label: "Paramétrage envisagé", text: "Le réglage par défaut de l'éditeur est conservé tel quel : conservation illimitée des candidatures notées, y compris pour les candidats non retenus." },
      options: YN(false, "Le principe de limitation de la conservation du RGPD exige une durée définie et justifiée, jamais une conservation par défaut illimitée, quel que soit l'éditeur du logiciel."),
    },
    {
      id: "ex2-d",
      prompt: "Le service juridique de Tarnaud Logistique doit informer les candidats de l'existence de ce traitement automatisé.",
      context: { label: "Paramétrage envisagé", text: "La politique de confidentialité de la page carrières est mise à jour pour mentionner l'outil de notation, sa finalité, et la possibilité de demander une intervention humaine." },
      options: YN(false, "Ces trois informations sont nécessaires mais ne suffisent pas à valider la notice. Selon le traitement, il faut aussi préciser notamment la base légale, les données, les destinataires, la durée de conservation, les droits et le contact, ainsi que des informations utiles sur la logique et les conséquences de la décision automatisée."),
    },
    {
      id: "ex2-e",
      prompt: "L'outil de notation a besoin de données pour fonctionner.",
      context: { label: "Paramétrage envisagé", text: "Une analyse documentée relie chaque donnée transmise à un critère nécessaire du poste. Seules l'expérience et les compétences déclarées sont retenues. L'âge, la situation familiale, la photo et les variables indirectement discriminantes identifiées sont exclus, puis la liste des données et les résultats de biais sont revus régulièrement." },
      options: YN(true, "Pour le point contrôlé, la nécessité de chaque donnée est documentée, les données sans lien et les variables indirectement discriminantes sont écartées, et la revue est continue. Cela traite la minimisation et une partie du risque de biais, sans suffire à rendre tout le système conforme."),
    },
  ],
  retain:
    "« Conforme » sur un point ne veut jamais dire « système conforme ». IA Act et RGPD donnent lieu à deux analyses séparées, puis articulées : supervision humaine effective, décision automatisée, durée de conservation, information des candidats et minimisation se contrôlent une à une.",
};

const CHECKLIST_PROMPT =
  "Construis une checklist courte pour le paramétrage d'un logiciel de recrutement : finalité réelle, qualification IA Act et rôles fournisseur/déployeur, supervision humaine effective, qualité et minimisation des données, tests de biais, journaux et possibilité d'ignorer la sortie, base légale, article 22, analyse d'impact si nécessaire, conservation, information et droits des candidats. Pour chaque règle, demande une source officielle, sa version, son statut et sa date de consultation.";

const EX3: Exercise = {
  title: "Repérer un prompt utile pour votre mission",
  short: "Le bon prompt",
  instructions: "Pour chaque besoin rencontré dans votre mission de paramétrage chez Tarnaud Logistique, un seul prompt pose vraiment la bonne demande.",
  questions: [
    {
      id: "ex3-a",
      prompt: "Expliquer au service RH de Tarnaud Logistique, qui n'est pas juriste, pourquoi le rejet automatique sous la note de 30 doit être désactivé.",
      options: [
        { label: "« Rédige une note juridique complète sur l'article 6 de l'IA Act. »", ok: false, why: "Une note juridique brute risque d'être trop technique pour un public RH non juriste et ne propose aucune alternative concrète." },
        { label: "« Explique en langage clair, pour une équipe RH non juriste, pourquoi ce rejet automatique exige une analyse séparée de l'article 22 du RGPD et de la supervision humaine prévue par l'IA Act. Présente les exceptions et garanties sans conclure automatiquement à une interdiction. Propose un paramétrage avec contrôle humain effectif. Cite les sources officielles, leur version et la date de consultation. Signale les points à valider par le DPO ou le juriste. »", ok: true, why: "Le prompt sépare les deux cadres, demande une solution opérationnelle et impose des sources primaires datées. La réponse de l'IA restera un brouillon à vérifier par une personne compétente." },
        { label: "« Dis-leur juste que c'est interdit. »", ok: false, why: "Cette formulation ne demande aucune explication ni alternative : elle ne permet pas au service RH de comprendre l'enjeu ni d'agir." },
        { label: "« Écris un message pour le service RH sur l'intelligence artificielle. »", ok: false, why: "Ce prompt ne mentionne ni la règle en cause, ni le paramétrage concerné : il est trop vague pour produire un message utile." },
      ],
    },
    {
      id: "ex3-b",
      prompt: "Rédiger le paragraphe de la politique de confidentialité de Tarnaud Logistique qui informe les candidats de l'outil de notation.",
      options: [
        { label: "« Ajoute une phrase disant qu'on utilise de l'IA. »", ok: false, why: "Une phrase générique ne précise ni la finalité du traitement ni le droit à une intervention humaine, deux informations attendues par le RGPD." },
        { label: "« Prépare un brouillon clair pour informer les candidats : finalité, base légale à confirmer, données utilisées, destinataires, durée de conservation, rôle de l'outil, informations utiles sur la logique et les conséquences, droits, intervention humaine, contestation et contact. N'invente aucune information absente. Signale chaque élément à compléter. Le DPO ou le service juridique validera le texte avant publication. »", ok: true, why: "Le prompt liste les informations à couvrir et prévoit la relecture juridique. Il évite de demander à l'IA de déclarer elle-même la notice conforme." },
        { label: "« Rédige ce paragraphe de façon à ce que les candidats ne remarquent pas cette mention. »", ok: false, why: "Cacher l'existence du traitement va à l'encontre de l'obligation de transparence du RGPD et de l'IA Act : ce n'est pas une option recevable." },
        { label: "« Copie la politique de confidentialité d'un logiciel concurrent. »", ok: false, why: "Copier le texte d'un autre éditeur risque de ne pas correspondre au paramétrage réel choisi par Tarnaud Logistique, ni d'être vérifié pour ce contexte précis." },
      ],
    },
    {
      id: "ex3-c",
      prompt: "Se doter d'une checklist personnelle à réutiliser sur vos prochaines missions de paramétrage de logiciels de recrutement.",
      options: [
        { label: "« Fais-moi une checklist RGPD. »", ok: false, why: "« Fais-moi une checklist RGPD » ne mentionne ni l'IA Act, ni le contexte spécifique du recrutement, ni les points concrets de paramétrage." },
        { label: `« ${CHECKLIST_PROMPT} »`, ok: true, why: "Le prompt couvre la qualification, les rôles, les exigences opérationnelles, le RGPD, les biais et la preuve de veille. La checklist obtenue devra encore être vérifiée et adaptée au système réel." },
        { label: "« Liste-moi les fonctionnalités les plus vendeuses des logiciels de recrutement. »", ok: false, why: "Une liste de fonctionnalités marketing ne couvre aucun des points de conformité identifiés dans cette leçon." },
        { label: "« Fais-moi une checklist générale sur l'intelligence artificielle en entreprise. »", ok: false, why: "Une checklist trop générale sur l'intelligence artificielle, sans lien avec le recrutement ni avec les points précis de paramétrage, sera difficile à réutiliser concrètement." },
      ],
    },
  ],
  retain:
    "Un prompt utile sépare les deux cadres, demande une solution opérationnelle et exige des sources officielles datées. La sortie reste un brouillon : la conclusion juridique revient à une personne compétente (DPO, juriste), jamais à l'IA.",
};

const EX4 = {
  title: "À vous de corriger un paramétrage (à remettre)",
  short: "Corriger un paramétrage",
  storageKey: "nathalie_playground_3_2_ex4", // même clé que le HTML d'origine : les brouillons déjà saisis sont retrouvés
  sourceLabel: "Configuration initiale proposée par l'éditeur du logiciel, chez Tarnaud Logistique",
  source:
    "« L'option de notation automatique est activée pour tous les CV. Toute note inférieure à 45 entraîne un rejet sans relecture. Pour une candidate revenant d'un congé parental de 18 mois, l'outil génère le commentaire “disponibilité familiale incertaine et parcours peu stable”, lui attribue 38 sur 100 et déclenche le refus. Le système reçoit l'intégralité du CV, y compris la date de naissance et la photo. La conservation est illimitée. Aucun test de biais, journal de désaccord humain, analyse d'impact ni information spécifique des candidats n'est prévu. »",
  task:
    "Analysez séparément la qualification IA Act, la supervision humaine, l'article 22 et les principes du RGPD, puis identifiez le biais discriminant contenu dans la sortie. Proposez des mesures préventives et correctives, une décision finale sur le déploiement et un prompt permettant de préparer votre note sans lui déléguer la conclusion juridique. Citez au moins deux sources primaires avec leur lien, leur version ou statut et leur date de consultation.",
  placeholder: "Qualification IA Act et rôles :\nAnalyse RGPD, article 22 et biais :\nMesures et décision de déploiement :\nSources, dates et statut des textes :\nPrompt utilisé pour préparer la note :",
  corrige: [
    ["Points de non-conformité", "Le système de recrutement doit être qualifié au regard de l'article 6 et de l'annexe III de l'IA Act. La supervision décrite n'est pas effective. Le rejet exclusivement automatisé et significatif impose une analyse de l'article 22 du RGPD, de ses exceptions et de ses garanties. Le commentaire sur le congé parental transforme une situation familiale en jugement de disponibilité et de stabilité : il crée un risque discriminatoire et met en cause la loyauté, la minimisation et l'exactitude. S'ajoutent la collecte excessive, la conservation illimitée, l'absence d'information, de test de biais, de traçabilité et d'analyse d'impact lorsque celle-ci est requise."],
    ["Configuration corrigée recommandée", "Suspendre l'activation tant que l'analyse n'est pas achevée. Définir la base légale et les rôles, réaliser l'analyse d'impact si les conditions sont réunies, exclure les données et variables sans nécessité démontrée, tester les biais sur des groupes pertinents et corriger le modèle ou renoncer si le risque n'est pas maîtrisé. Désactiver le rejet automatique. Confier la revue à des personnes formées, disposant du temps, des informations et de l'autorité nécessaires pour ignorer ou inverser la sortie, puis tracer leurs désaccords. Fixer la conservation, sécuriser les flux, informer les candidats et organiser leurs droits. Vérifier la recommandation dans le texte consolidé de l'IA Act et les ressources CNIL, en notant la date et le statut de chaque source."],
  ] as [string, string][],
  retain:
    "Qualifier, articuler, vérifier : la qualification IA Act et l'analyse RGPD restent deux analyses distinctes, la sortie de l'outil se relit aussi pour ses biais, et la décision de déploiement s'appuie sur des sources officielles datées, à la version la plus récente.",
};

const TINTS = ["#b58de0", "#78d5e2", "#6adeb1", "#fbc2ad"];
const PASS = 0.8;
const CASE_NAME = "Tarnaud Logistique";

/* ---------- Composant ---------- */

export default function Pg32(_props: PlaygroundProps) {
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
            <p className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: th.fg3 }}>Playground · Leçon 3.2</p>
            <h2 className="text-2xl md:text-3xl font-semibold leading-tight mb-2" style={{ color: th.fg }}>
              IA Act et RGPD, cas pratiques de <span className="hl">paramétrage</span>
            </h2>
            <p className="text-sm max-w-[70ch]" style={{ color: th.fg2 }}>
              Mettez en pratique la méthode de cette leçon sur des cas fictifs, tous liés au même contexte : vous accompagnez
              Tarnaud Logistique, une entreprise de transport, sur le paramétrage de son nouveau logiciel de recrutement, qui
              propose plusieurs options intégrant de l'IA générative. Chaque exercice a son propre bouton de correction et son
              propre score.
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
          onPass={() => markDone(step)} onNext={() => setStep(step + 1)}
          extra={step === 2 ? <ImpactLead /> : undefined} />
      )}
      {step === 3 && <WrittenExercise tint={TINTS[3]} onDone={() => markDone(3)} />}

      <ContinueOnPlatform />

      <p className="text-xs" style={{ color: th.fg3 }}>Toutes les entreprises, personnes et données chiffrées de cet exercice sont fictives.</p>
    </div>
  );
}

/* ---------- Exercices à choix (1 à 3) ---------- */

function QuizExercise({ n, ex, tint, onPass, onNext, extra }: { n: number; ex: Exercise; tint: string; onPass: () => void; onNext: () => void; extra?: ReactNode }) {
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
          {extra}
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


/* ---------- 4. À vous de corriger un paramétrage ---------- */

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
        Votre brouillon est sauvegardé automatiquement dans ce navigateur. Remettez au formateur votre analyse, votre paramétrage
        corrigé et votre prompt.
      </p>
      <div className="rounded-[10px] px-4 py-3 mb-4" style={{ background: alpha(tint, th.isDark ? 0.1 : 0.14), border: `1px solid ${alpha(tint, 0.6)}` }}>
        <span className="block text-[10.5px] font-bold uppercase tracking-widest mb-1" style={{ color: th.fg3 }}>{EX4.sourceLabel}</span>
        <p className="text-sm" style={{ color: th.fg }}>{EX4.source}</p>
      </div>
      <p className="text-sm mb-4" style={{ color: th.fg2 }}>{EX4.task}</p>
      <ImpactLead />
      <label htmlFor="pg32-ex4" className="block text-xs font-semibold mt-4 mb-1.5" style={{ color: th.fg3 }}>
        Votre qualification, l'analyse du biais, les mesures, les sources et votre prompt
      </label>
      <textarea id="pg32-ex4" value={text} onChange={(e) => change(e.target.value)} placeholder={EX4.placeholder} rows={10}
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
              {EX4.corrige.map(([label, body]) => (
                <div key={label} className="rounded-[10px] px-4 py-3" style={{ border: `1px solid ${th.sep}` }}>
                  <span className="block text-[10.5px] font-bold uppercase tracking-widest mb-2" style={{ color: th.fg3 }}>{label}</span>
                  <p className="text-sm" style={{ color: th.fg }}>{body}</p>
                </div>
              ))}
              <Retain tint={tint}>{EX4.retain}</Retain>
            </div>
          )}
        </div>
      </div>
    </GCard>
  );
}

/* ---------- Piste d'approfondissement : l'analyse d'impact ---------- */

// Notion présente dans le HTML d'origine (checklist de l'exercice 3, cas et corrigé de l'exercice 4)
// mais non traitée dans le cours : signalée comme piste, sans date, article ni montant.
function ImpactLead() {
  const th = useTh();
  const navigate = useNavigate();
  const tint = "#dbacf0";
  return (
    <div className="pg-pop mt-4 rounded-[10px] px-4 py-3 text-sm" style={{ background: alpha(tint, th.isDark ? 0.1 : 0.16), border: `1px dashed ${alpha(tint, 0.9)}`, color: th.fg2 }}>
      <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest mb-1" style={{ color: th.fg }}>
        <Compass className="w-3.5 h-3.5" aria-hidden />Piste d'approfondissement · L'analyse d'impact
      </span>
      <p>
        Ce Playground mentionne l'analyse d'impact, dans la checklist de l'exercice 3 et dans le cas à corriger. Le cours ne la
        détaille pas : retenez qu'avant de déployer un outil de notation des candidatures, il faut vérifier si une analyse d'impact
        est requise. Le corrigé de l'exercice 4 la place parmi les étapes à mener avant toute activation, « si les conditions sont
        réunies ». Pour approfondir, consultez les ressources de la CNIL et notez la date de consultation et le statut de chaque source.
      </p>
      <div className="mt-3"><VBtn sm onClick={() => navigate("/hub/recherche")}>Hub IA · Rechercher & veiller</VBtn></div>
    </div>
  );
}

/* ---------- Commun ---------- */

function ExerciseHeader({ n, title, tint }: { n: number; title: string; tint: string }) {
  const th = useTh();
  return (
    <div className="flex flex-wrap items-center gap-3 mb-3">
      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold shrink-0" style={{ background: tint, color: "#111" }}>{n}</span>
      <h3 className="text-lg font-semibold flex-1 min-w-[12rem]" style={{ color: th.fg }}>{title}</h3>
      <Chip tint={tint}>Exemple fictif · {CASE_NAME}</Chip>
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
    try { await navigator.clipboard.writeText(CHECKLIST_PROMPT); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* presse-papiers refusé */ }
  };
  return (
    <GCard className="p-6">
      <p className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: th.fg3 }}>Pour aller plus loin sur la plateforme</p>
      <p className="text-sm mb-3" style={{ color: th.fg2 }}>
        <strong style={{ color: th.fg }}>Votre veille sourcée.</strong> Dans le Hub IA, la catégorie « Rechercher & veiller » présente
        les outils de recherche web sourcée. Servez-vous-en pour retrouver les sources officielles citées dans le cours, et notez
        pour chacune sa version, son statut et la date de consultation.
      </p>
      <div className="flex flex-wrap gap-2 mb-5">
        <VBtn sm onClick={() => navigate("/hub/recherche")}>Hub IA · Rechercher & veiller</VBtn>
      </div>
      <p className="text-sm mb-3" style={{ color: th.fg2 }}>
        <strong style={{ color: th.fg }}>Votre checklist avec Mon Agent IA.</strong> Reprenez le prompt complet de l'exercice 3 pour
        construire votre checklist de paramétrage. La sortie reste un brouillon : vérifiez chaque règle dans sa source officielle et
        gardez pour vous la conclusion juridique.
      </p>
      <div className="flex items-start gap-2 rounded-[4px] px-4 py-3 mb-3" style={{ border: `1px solid ${th.sep}` }}>
        <p className="text-sm flex-1" style={{ color: th.fg }}>{CHECKLIST_PROMPT}</p>
        <button type="button" onClick={() => void copy()} className="inline-flex items-center gap-1 text-xs font-semibold shrink-0" style={{ color: th.fg2 }} aria-live="polite">
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}{copied ? "Copié" : "Copier"}
        </button>
      </div>
      <VBtn sm onClick={() => navigate("/agent")}>Mon Agent IA</VBtn>
    </GCard>
  );
}
