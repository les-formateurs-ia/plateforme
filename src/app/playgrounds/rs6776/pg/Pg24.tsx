import { useTh } from "@/app/theme/theme";
import type { PlaygroundProps } from "@/app/playgrounds/registry";
import { Box, DraftExercise, Further, PG_TINTS, PgShell, Quiz, type Activity, type Question, type ScoreText } from "./Pg21";

// Playground natif de la leçon 2.4 (version SIRH), converti depuis
// docs/formation-rs6776/lecon-2.4/playground-nathalie.html.
// Briques communes : voir Pg21.tsx.

const tool = (id: string, legend: string, right: "copilot" | "firefly", whyCopilot: string, whyFirefly: string): Question => ({
  id, legend,
  options: [
    { label: "Microsoft Copilot", ok: right === "copilot", why: whyCopilot },
    { label: "Adobe Firefly", ok: right === "firefly", why: whyFirefly },
  ],
});

const EX1: Question[] = [
  tool("e1q1", "« Ferronix RH » demande des illustrations retouchables dans son flux Adobe et la conservation des informations de provenance. Firefly est approuvé, l'offre a été vérifiée et aucune référence tierce n'est utilisée.", "firefly",
    "Copilot pourrait générer une image, mais ne répond pas ici au flux Adobe et à la méthode de provenance explicitement demandés.",
    "Firefly correspond au flux demandé et autorisé. Il faudra encore vérifier les Content Credentials après export et contrôler le visuel."),
  tool("e1q2", "Pour une slide interne provisoire, le « Cabinet Solerys » autorise son environnement Microsoft 365. L'icône est abstraite, sans donnée ni référence importée, et elle sera supprimée après la réunion.", "copilot",
    "Copilot est proportionné dans l'environnement déjà autorisé. Le caractère interne ne dispense pas d'un contrôle visuel.",
    "Firefly pourrait convenir, mais n'apporte pas ici d'avantage lié au flux de travail demandé."),
  tool("e1q3", "« Atelier Kerdanet Formation » diffuse une bannière publique. Son environnement Microsoft est approuvé pour cet usage, les conditions de l'offre ont été vérifiées, le brief ne contient aucune référence tierce et le client n'impose pas de flux Adobe.", "copilot",
    "Copilot peut être retenu puisque l'usage, l'offre, les entrées et le flux sont explicitement validés. Une diffusion externe n'impose pas à elle seule Firefly.",
    "Firefly serait possible s'il était lui aussi autorisé, mais le simple caractère public ne rend pas ce choix automatiquement supérieur."),
  tool("e1q4", "Pour préparer un rendez-vous fictif, la consultante veut trois pistes de composition à usage interne. Les deux outils sont autorisés, mais toute l'équipe travaille dans Microsoft 365 et aucun travail de retouche avancé n'est demandé.", "copilot",
    "Copilot réduit ici les changements d'environnement et répond au besoin d'exploration. Les variantes devront quand même être comparées à une grille.",
    "Firefly pourrait produire les variantes, mais son flux de retouche dédié n'est pas requis dans ce scénario."),
  tool("e1q5", "Un guide client doit suivre un flux Adobe validé et conserver des métadonnées C2PA vérifiables. L'offre Firefly concernée, les conditions et les références sont approuvées par le client.", "firefly",
    "Copilot ne correspond pas au flux et au format de preuve expressément retenus dans ce brief.",
    "Firefly correspond aux exigences données. Les métadonnées doivent être contrôlées après export et accompagnées du brief, des droits, du prompt et de la validation."),
];

const EX2: Question[] = [
  {
    id: "e2q1", legend: "Adobe présente une offre comme adaptée à la production commerciale. Quelle conclusion est rigoureuse ?",
    options: [
      { label: "Tout résultat est automatiquement libre de droits dans tous les pays", why: "Un positionnement commercial n'est pas une autorisation juridique universelle." },
      { label: "Il faut encore vérifier le produit, l'offre, les conditions, les entrées et le résultat", ok: true, why: "Les protections éventuelles sont conditionnelles et ne couvrent pas automatiquement les contenus importés ou tous les usages." },
      { label: "Aucun contrôle humain n'est nécessaire", why: "Les anomalies, biais, marques, informations trompeuses et contraintes du brief doivent être contrôlés." },
      { label: "Les logos trouvés en ligne peuvent être importés sans autorisation", why: "L'utilisateur reste responsable des droits attachés aux références qu'il fournit." },
    ],
  },
  {
    id: "e2q2", legend: "Que permettent des Content Credentials valides ?",
    options: [
      { label: "Prouver que la scène représentée s'est réellement produite", why: "La provenance déclarée ne prouve pas la véracité de la scène." },
      { label: "Consulter des déclarations signées sur la provenance et certaines transformations", ok: true, why: "Elles documentent une partie de la chaîne, dans les outils et formats compatibles." },
      { label: "Garantir que toutes les autorisations juridiques existent", why: "Elles ne remplacent pas la vérification des droits et des conditions." },
      { label: "Empêcher toute copie ou modification du fichier", why: "Il ne s'agit pas d'un verrou anticopie." },
    ],
  },
  {
    id: "e2q3", legend: "Vous voulez importer un portrait et un logo client dans le générateur. Quel est le premier contrôle ?",
    options: [
      { label: "Choisir le modèle qui produit les couleurs les plus vives", why: "La qualité esthétique vient après les autorisations." },
      { label: "Vérifier les autorisations sur les références, les données et l'usage prévu", ok: true, why: "Le choix de l'éditeur ne régularise pas les contenus fournis par l'utilisateur." },
      { label: "Renommer les fichiers avant import", why: "Changer un nom de fichier ne modifie ni le contenu ni les droits." },
      { label: "Générer d'abord et demander l'autorisation après diffusion", why: "Les autorisations nécessaires doivent être clarifiées avant l'import et la diffusion." },
    ],
  },
  {
    id: "e2q4", legend: "Vous devez représenter exactement une procédure réglementaire. Quelle méthode est la plus fiable ?",
    options: [
      { label: "Demander au générateur d'inventer les étapes manquantes", why: "Une procédure réglementaire doit venir d'une source validée." },
      { label: "Valider la source et construire le schéma dans un outil de diagramme, puis contrôler chaque libellé", ok: true, why: "La structure factuelle et le texte restent ainsi maîtrisables et modifiables." },
      { label: "Choisir l'image la plus esthétique sans relire les libellés", why: "L'esthétique ne compense pas une erreur réglementaire." },
      { label: "Ajouter « exact » dans le prompt et ne plus vérifier", why: "Une consigne d'exactitude ne constitue pas une garantie." },
    ],
  },
  {
    id: "e2q5", legend: "Quel dossier permet le mieux d'expliquer la production au formateur ou au client ?",
    options: [
      { label: "Uniquement l'image finale", why: "Elle ne montre ni la demande, ni les droits, ni les contrôles." },
      { label: "Brief, références et droits, prompt, variantes, original exporté, contrôles et validation", ok: true, why: "Cet ensemble relie le besoin, le processus, les corrections et la décision finale." },
      { label: "Une capture du logo de l'outil", why: "Le logo ne documente pas les entrées, le processus ni la validation." },
      { label: "La promesse marketing de l'éditeur seule", why: "Elle ne prouve pas que l'usage concret respecte le brief et les conditions." },
    ],
  },
];

const score24: ScoreText = ({ correct, total, pct }) => `Score : ${correct} / ${total} (${pct} %)`;

export default function Pg24(_props: PlaygroundProps) {
  const th = useTh();
  const activities: Activity[] = [
    {
      nav: "Choisir l'outil",
      title: "Exercice 1 · Choisir l'outil selon le contexte",
      tag: "Noté · seuil 80 %",
      fictive: true,
      // Correction d'incohérence : le HTML d'origine parlait de « deux options déjà
      // autorisées », alors que plusieurs situations n'autorisent qu'un seul des deux
      // outils (et que l'explication de la situation 3 dit « s'il était lui aussi autorisé »).
      intro: <p>Pour chaque situation, choisissez l'environnement le plus adapté entre les deux options proposées, en tenant compte de ce qui est autorisé dans chaque cas, puis cliquez sur « Corriger mes réponses ». Seuil de réussite : 80 %.</p>,
      render: (done) => <Quiz questions={EX1} onComplete={done} scoreText={score24} tint={PG_TINTS[0]} revealCorrect />,
      retain: <>Le choix part des faits vérifiables du brief : l'environnement autorisé, le flux de travail imposé, l'offre vérifiée, les références utilisées. Firefly s'impose quand le flux Adobe ou la provenance C2PA sont exigés ; sinon, l'environnement déjà autorisé est souvent le plus proportionné. Une diffusion publique n'impose pas, à elle seule, un outil. Dans tous les cas : contrôle visuel.</>,
    },
    {
      nav: "Auditer une production",
      title: "Exercice 2 · Auditer une production visuelle",
      tag: "Noté · seuil 80 %",
      intro: <p>Une seule bonne réponse par question. Seuil de réussite : 80 %.</p>,
      render: (done) => <Quiz questions={EX2} onComplete={done} scoreText={score24} tint={PG_TINTS[1]} revealCorrect />,
      retain: <>Un positionnement « commercial » n'est pas une autorisation juridique universelle, et des Content Credentials documentent une provenance sans prouver la véracité de la scène ni les droits. Vous restez responsable des références que vous importez. Une procédure exacte se construit dans un outil de diagramme depuis une source validée, et tout se consigne dans un dossier de preuve.</>,
    },
    {
      nav: "Produire et documenter",
      title: "Exercice 3 · Produire et documenter un visuel (à remettre)",
      tag: "Non noté · à remettre au formateur",
      fictive: true,
      intro: (
        <>
          <p>À partir du brief fictif suivant, rédigez un prompt complet puis générez trois variantes dans un outil autorisé.</p>
          <Box label="Brief (fictif)">Page de garde d'un guide destiné à des managers, illustration sobre d'un atelier collaboratif, palette bleu nuit et vert d'eau, format 16:9, zone vide en haut pour le titre, aucun logo, aucun texte intégré, aucun visage identifiable et aucune imitation d'un artiste nommé.</Box>
          <p>Dans la zone ci-dessous, consignez l'outil et l'offre, le prompt, vos critères, la variante retenue, les anomalies corrigées, le texte alternatif et la liste des preuves conservées. Joignez au formateur les trois variantes et la version finalisée.</p>
        </>
      ),
      render: (done) => (
        <DraftExercise storageKey="nathalie_playground_2_4_ex3" onComplete={done}
          label="Votre dossier de production"
          placeholder={"Outil et offre vérifiés :\nPrompt :\nCritères de comparaison :\nVariante retenue et justification :\nCorrections :\nTexte alternatif :\nPreuves conservées :"}
          statusInit="Brouillon non enregistré pour le moment."
          statusSaved="Brouillon enregistré automatiquement" stamp
          corrige={
            <p><strong style={{ color: th.fg }}>Critères attendus :</strong> le prompt reprend la finalité, le public, le sujet, la composition, le style, la palette, le format et les exclusions. La sélection s'appuie sur des critères observables : respect du brief, composition, cohérence des détails, absence de stéréotype ou de marque, lisibilité au format final et accessibilité. Le dossier conserve le brief, les références et droits éventuels, le prompt, les trois sorties, l'original exporté, les contrôles, la date, la version de l'outil et le valideur. Les Content Credentials, si elles existent, complètent ce dossier sans remplacer la vérification.</p>
          } />
      ),
      retain: <>Un visuel abouti est un visuel documenté : prompt complet (finalité, public, sujet, composition, style, palette, format, exclusions), variantes comparées à une grille observable, titre et texte alternatif ajoutés dans un outil adapté, dossier de preuve conservé. Une image séduisante mais trompeuse, illisible ou inaccessible n'est pas un livrable abouti.</>,
    },
  ];

  return (
    <PgShell lesson="2.4"
      title={<>Du brief au <span className="hl">visuel validé</span> : à vous de produire</>}
      intro="Trois exercices pour choisir un environnement à partir de faits vérifiables, contrôler les risques puis créer un visuel accompagné de son dossier de preuve. Toutes les situations et organisations citées sont fictives."
      activities={activities}
      further={
        <Further
          text={<p>Générez les trois variantes de l'exercice 3 dans le Studio, « Créer vos images ». Entraînez-vous ensuite dans les Exercices « Images & vidéos », puis en Rétro-ingénierie : retrouver le prompt d'une image vous apprend à mieux décrire composition, style et exclusions.</p>}
          links={[
            { label: "Studio · Créer vos images", to: "/studio/images" },
            { label: "Exercices · Images & vidéos", to: "/practice/media" },
            { label: "Exercices · Rétro-ingénierie", to: "/practice/reverse-prompting" },
          ]}
          note="Microsoft Copilot et Adobe Firefly ne sont pas intégrés à la plateforme : utilisez-les sur leur propre site, dans le cadre autorisé par votre client." />
      } />
  );
}
