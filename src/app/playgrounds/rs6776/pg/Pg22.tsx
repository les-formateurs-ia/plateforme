import { useTh } from "@/app/theme/theme";
import type { PlaygroundProps } from "@/app/playgrounds/registry";
import { DraftExercise, Further, PG_TINTS, PgShell, Quiz, type Activity, type Question, type ScoreText } from "./Pg21";

// Playground natif de la leçon 2.2 (version SIRH), converti depuis
// docs/formation-rs6776/lecon-2.2/playground-nathalie.html.
// Briques communes : voir Pg21.tsx.

const OK = "Correct.";
const KO = "À revoir : relisez le contexte et le résultat obtenu.";
const KO2 = "À revoir : relisez la situation et l'étape en cours.";

const opts = (labels: string[], right: number) => labels.map((label, i) => ({ label, ok: i === right }));

const EX1: Question[] = [
  {
    id: "e1q1",
    boxes: [
      { label: "Situation", text: "Vous rédigez un e-mail annonçant le passage à TalentPass aux recruteurs, une équipe plutôt réticente aux nouveaux outils." },
      { label: "Prompt", quote: true, text: "Rédige un e-mail annonçant le passage à TalentPass aux recruteurs." },
      { label: "Résultat", text: "Un message correct mais au ton institutionnel et distant, alors qu'un ton de collègue à collègue, plus rassurant, aurait mieux fonctionné auprès de cette équipe." },
    ],
    legend: "Quel élément manque ?",
    options: opts(["Rôle", "Cible", "Format", "Contexte"], 0), okText: OK, koText: KO,
  },
  {
    id: "e1q2",
    boxes: [
      { label: "Situation", text: "Le support doit s'adresser à la fois aux recruteurs internes et aux managers qui valident les embauches, avec des besoins différents." },
      { label: "Prompt", quote: true, text: "Rédige un support de présentation de TalentPass." },
      { label: "Résultat", text: "Un support unique, au même niveau de détail partout, qui ne distingue pas ce que les recruteurs doivent savoir de ce qui concerne seulement les managers." },
    ],
    legend: "Quel élément manque ?",
    options: opts(["Rôle", "Cible", "Format", "Objectif"], 1), okText: OK, koText: KO,
  },
  {
    id: "e1q3",
    boxes: [
      { label: "Situation", text: "Vous devez livrer une fiche mémo courte, à imprimer et à afficher près des postes des recruteurs." },
      { label: "Prompt", quote: true, text: "Rédige une fiche mémo sur la publication d'une offre dans TalentPass." },
      { label: "Résultat", text: "Un contenu juste sur le fond, mais présenté en plusieurs longs paragraphes, impossible à faire tenir sur une fiche d'une page." },
    ],
    legend: "Quel élément manque ?",
    options: opts(["Contexte", "Objectif", "Format", "Cible"], 2), okText: OK, koText: KO,
  },
  {
    id: "e1q4",
    boxes: [
      { label: "Situation", text: "Distribution Arkady remplace un processus de recrutement encore géré par e-mail et tableurs partagés." },
      { label: "Prompt", quote: true, text: "Rédige un message pour annoncer TalentPass aux recruteurs." },
      { label: "Résultat", text: "Un message correct sur la forme, qui ne rassure sur rien de précis puisqu'il ignore ce que ce changement remplace concrètement au quotidien." },
    ],
    legend: "Quel élément manque ?",
    options: opts(["Format", "Objectif", "Contexte", "Cible"], 2), okText: OK, koText: KO,
  },
];

const EX2: Question[] = [
  {
    id: "e2q1",
    boxes: [{ label: "Où en êtes-vous ?", text: "Rien n'a encore été rédigé." }],
    legend: "Quelle est la meilleure première étape ?",
    options: opts([
      "Rédiger d'un coup le guide, la FAQ et la fiche de dépannage dans un seul prompt très détaillé",
      "Demander uniquement le plan : les trois documents, leur contenu prévu et l'ordre logique",
      "Commencer directement par la fiche de dépannage, plus courte à rédiger",
      "Laisser l'outil choisir seul, sans aucune indication sur les documents attendus",
    ], 1), okText: OK, koText: KO2,
  },
  {
    id: "e2q2",
    boxes: [{ label: "Où en êtes-vous ?", text: "Le plan est validé : guide de prise en main, puis FAQ, puis fiche de dépannage." }],
    legend: "Une fois le plan validé, quelle est la meilleure étape suivante ?",
    options: opts([
      "Rédiger un prompt pour le guide de prise en main seul, en rappelant le plan validé comme contexte",
      "Redemander le plan une seconde fois pour vérifier qu'il est toujours bon",
      "Rédiger la FAQ et la fiche de dépannage ensemble, en pensant que le guide suivra logiquement",
      "Ouvrir une conversation entièrement nouvelle, sans reprendre le plan validé",
    ], 0), okText: OK, koText: KO2,
  },
  {
    id: "e2q3",
    boxes: [{ label: "Où en êtes-vous ?", text: "Le guide de prise en main est rédigé, mais son ton vous semble trop technique pour des employés d'hôtel peu familiers du jargon RH." }],
    legend: "Quel est le bon réflexe pour corriger ce défaut ?",
    options: opts([
      "Relancer, dans le même échange, un prompt qui précise seulement le ton attendu (formulations simples, sans jargon)",
      "Réécrire entièrement le prompt initial, dans une nouvelle conversation",
      "Laisser tel quel : un ton un peu technique ne posera pas de problème",
      "Demander un guide sur un tout autre sujet pour comparer les styles obtenus",
    ], 0), okText: OK, koText: KO2,
  },
  {
    id: "e2q4",
    boxes: [{ label: "Où en êtes-vous ?", text: "Les trois documents sont rédigés séparément." }],
    legend: "Quelle est la dernière étape avant de livrer le support complet ?",
    options: opts([
      "Livrer directement les trois documents tels quels, chacun ayant déjà été validé séparément",
      "Lancer une relecture globale assistée, puis vérifier humainement cohérence, sources, omissions et exactitude avant livraison",
      "Faire traduire l'ensemble dans une autre langue avant toute relecture",
      "Refaire entièrement le plan de zéro par précaution",
    ], 1), okText: OK, koText: KO2,
  },
];

const score22: ScoreText = ({ correct, total, pct }) =>
  `Score : ${correct}/${total} (${pct} %) ${pct >= 80 ? "(seuil de 80 % atteint)." : "(en dessous du seuil de 80 %, revoyez les réponses marquées à revoir)."}`;

export default function Pg22(_props: PlaygroundProps) {
  const th = useTh();
  const activities: Activity[] = [
    {
      nav: "Diagnostiquer le prompt",
      title: "Exercice 1 : diagnostiquer le prompt",
      tag: "Noté · seuil 80 %",
      fictive: true,
      intro: <p>Vous préparez, pour <strong style={{ color: th.fg }}>Distribution Arkady</strong>, les supports de formation à <strong style={{ color: th.fg }}>TalentPass</strong>, leur nouvel outil de recrutement interne. Chaque situation ci-dessous montre un prompt et son résultat. Identifiez l'élément qui lui manque.</p>,
      render: (done) => <Quiz questions={EX1} onComplete={done} scoreText={score22} tint={PG_TINTS[0]} hint="Seuil de réussite : 80 %" />,
      retain: <>Le défaut du résultat signale l'élément absent : un ton mal ajusté renvoie au Rôle, un niveau de détail uniforme pour deux publics à la Cible, une présentation inadaptée au Format, un message qui ne rassure sur rien de précis au Contexte. Partez du résultat obtenu pour corriger le prompt, pas d'une intuition.</>,
    },
    {
      nav: "Enchaîner les étapes",
      title: "Exercice 2 : enchaîner les bonnes étapes",
      tag: "Noté · seuil 80 %",
      fictive: true,
      intro: <p>Pour le <strong style={{ color: th.fg }}>Groupe hôtelier Cantelou</strong>, vous devez produire un support à trois volets sur <strong style={{ color: th.fg }}>PlanRH</strong>, leur nouvel outil de gestion des plannings : un guide de prise en main, une FAQ, et une fiche de dépannage rapide. Choisissez, à chaque étape, la meilleure suite.</p>,
      render: (done) => <Quiz questions={EX2} onComplete={done} scoreText={score22} tint={PG_TINTS[1]} hint="Seuil de réussite : 80 %" />,
      retain: <>Découper pour contrôler : le plan d'abord, puis une section à la fois en rappelant le plan validé, une relance ciblée dans le même échange pour corriger un défaut, et enfin une relecture globale suivie d'une vérification humaine (cohérence, sources, omissions, exactitude). Chaque étape est un point de validation.</>,
    },
    {
      nav: "Vos instructions réutilisables",
      title: "Exercice 3 : rédiger vos instructions réutilisables",
      tag: "Non noté · à conserver pour le formateur",
      intro: <p>Rédigez une consigne réutilisable pour découper un support de formation en étapes. Elle doit prévoir les sources autorisées, un arrêt pour validation du plan, un critère de contrôle par section et une vérification finale. Votre brouillon est sauvegardé dans ce navigateur ; conservez-le pour l'échange avec le formateur.</p>,
      render: (done) => (
        <DraftExercise storageKey="nathalie_playground_2_2_ex3" onComplete={done}
          label="Vos instructions réutilisables"
          placeholder="Quand je te demande de préparer un support de formation à plusieurs sections..."
          statusInit="Brouillon non enregistré pour l'instant."
          statusSaved="Brouillon enregistré automatiquement."
          corrige={
            <>
              <p><strong style={{ color: th.fg }}>Corrigé indicatif</strong> : une version possible, la vôtre peut être différente et tout aussi valable.</p>
              <p className="italic">« Quand je te demande un support en plusieurs sections, commence par lister les informations manquantes et les sources autorisées. Propose uniquement le plan avec l'objectif de chaque section, puis attends ma validation. Rédige ensuite une section à la fois en rappelant le plan et les sources ; distingue ce qui vient d'une source de ce qui est une proposition et n'invente aucun parcours logiciel. Après chaque section, fournis une checklist de conformité. Termine par une recherche des contradictions, répétitions et omissions ; je valide le livrable final. »</p>
            </>
          } />
      ),
      retain: <>Des instructions réutilisables fixent la méthode une fois pour toutes : sources autorisées, arrêt pour valider le plan, une section à la fois, un contrôle par section, une vérification finale dont vous gardez la décision. Votre risque principal : valider trop tard une architecture, ou laisser passer une fonctionnalité du logiciel inventée par l'outil.</>,
    },
  ];

  return (
    <PgShell lesson="2.2"
      title={<>Prompts avancés : <span className="hl">méthode pour les tâches complexes</span></>}
      intro="Trois mises en situation pour pratiquer ce qui vient d'être vu : diagnostiquer un prompt insuffisant, enchaîner les bonnes étapes sur une tâche à plusieurs sections, et rédiger vos propres instructions réutilisables."
      activities={activities}
      further={
        <Further
          text={<p>Dans les Exercices prompts, utilisez « Améliorer ce prompt » pour retravailler une consigne insuffisante, comme dans l'exercice 1. Puis confrontez vos prompts avancés aux modèles dans le Battle Ground, gamme Expert.</p>}
          links={[
            { label: "Exercices · Prompts, « Améliorer ce prompt »", to: "/practice/prompts" },
            { label: "Battle Ground · gamme Expert", to: "/practice/battle-ground" },
          ]} />
      } />
  );
}
