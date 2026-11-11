import { useTh } from "@/app/theme/theme";
import type { PlaygroundProps } from "@/app/playgrounds/registry";
import { Box, DraftExercise, Further, PG_TINTS, PgShell, Quiz, type Activity, type QOpt, type Question, type ScoreText } from "./Pg21";

// Playground natif de la leçon 2.5 (version SIRH), converti depuis
// docs/formation-rs6776/lecon-2.5/playground-nathalie.html.
// Briques communes : voir Pg21.tsx.

const LEVERS = ["Contrainte", "Contexte", "Style", "Format", "Accessibilité"] as const;
const lever = (right: (typeof LEVERS)[number], whys: string[]): QOpt[] => LEVERS.map((label, i) => ({ label, ok: label === right, why: whys[i] }));

const EX1: Question[] = [
  {
    id: "ex1-a", heading: "Josette Bellanger, opératrice de production",
    legend: "Josette Bellanger, opératrice de production, peu à l'aise avec l'informatique, doit suivre une notice pour poser une demande d'absence. Le contenu généré est correct mais utilise des termes comme « workflow de validation » et « référentiel congés ».",
    options: lever("Style", [
      "Rien n'indique ici une limite de longueur ou un élément imposé : le problème n'est pas une contrainte, c'est le vocabulaire employé.",
      "Aucune information de fond ne manque : le contenu est complet, seul son habillage pose problème.",
      "Le style regroupe le registre et le vocabulaire employés. Remplacer « workflow de validation » et « référentiel congés » par des mots courants relève directement de ce levier.",
      "La structuration du contenu n'est pas en cause ici, c'est le choix des mots qui pose problème.",
      "L'accessibilité peut aussi bénéficier d'un vocabulaire clair. Ici, le défaut explicitement observé est le registre lexical : « style » est donc le premier angle, à compléter par un test utilisateur.",
    ]),
  },
  {
    id: "ex1-b", heading: "Karim Lasfar, manager d'atelier",
    legend: "Karim Lasfar, manager d'atelier, valide des demandes d'absence entre deux réunions. Le guide rédigé pour les référents RH fait 3 pages avec le détail de chaque écran ; Karim n'a besoin que des 3 actions à effectuer pour valider une demande.",
    options: lever("Contrainte", [
      "La demande fixe un nombre précis d'éléments à conserver, 3 actions, et exclut le reste : c'est une limite formelle, donc le levier contrainte.",
      "Il ne s'agit pas d'ajouter une information de fond, mais au contraire d'en retirer, dans une limite précise.",
      "Rien n'indique un problème de registre ou de ton : le guide est trop long, pas mal écrit.",
      "La mise en forme pourra aider une fois la contrainte de nombre fixée, mais ce qui définit le besoin ici est bien la limite à 3 actions, pas la présentation.",
      "Aucun besoin de lecture ou d'écoute particulier n'est mentionné pour Karim.",
    ]),
  },
  {
    id: "ex1-c", heading: "Odile Rambert, référente RH",
    legend: "Odile Rambert, référente RH, constate que le guide omet une règle de la politique fictive validée, version 3 : toute demande déposée moins de 48 heures avant la date de début nécessite l'accord exprès du manager. Cette règle et sa source doivent apparaître.",
    options: lever("Contexte", [
      "Il ne s'agit pas de fixer une limite au contenu lui-même, mais d'ajouter une information de fond qui manque.",
      "Une règle de fond manque. Il faut l'ajouter depuis la source validée, citer sa version et ne rien inventer : c'est l'angle contexte et sources.",
      "Le ton ou le registre du guide n'est pas en cause : c'est une information qui manque, pas une façon de l'exprimer.",
      "La structuration du guide n'est pas le problème : une information est absente, quelle que soit la mise en forme.",
      "Aucun besoin de lecture ou d'écoute particulier n'est en jeu ici.",
    ]),
  },
  {
    id: "ex1-d", heading: "Publication sur l'intranet",
    legend: "Le guide doit être publié sur l'intranet d'Aravix Industries : le service communication demande des étapes numérotées et les actions clés en gras, plutôt que des paragraphes continus. Aucune information ne doit être ajoutée ni retirée.",
    options: lever("Format", [
      "Aucune limite de longueur ou de nombre n'est imposée : c'est l'organisation visuelle qui doit changer.",
      "La consigne précise justement qu'aucune information ne doit être ajoutée ni retirée : ce n'est pas le contexte qui est concerné.",
      "Rien n'indique un changement de registre ou de ton, seulement une réorganisation visuelle.",
      "Étapes numérotées, mise en gras des actions clés : c'est la structuration et la mise en forme du contenu qui changent, exactement le levier format.",
      "Une structure explicite peut aussi améliorer l'accessibilité. Ici, la transformation demandée porte directement sur l'organisation visuelle : format est le premier angle.",
    ]),
  },
  {
    id: "ex1-e", heading: "Lecture par synthèse vocale",
    legend: "Le guide doit pouvoir être lu à voix haute par un logiciel de synthèse vocale, pour un collaborateur qui l'écoute plutôt qu'il ne le lit à l'écran.",
    options: lever("Accessibilité", [
      "Aucune limite de longueur ou de nombre d'éléments n'est demandée.",
      "Aucune information de fond ne manque, c'est la manière dont le contenu sera reçu qui change.",
      "Le registre n'est pas la première chose en cause ici : c'est un besoin de lecture particulier qui prime.",
      "La structure et les intitulés comptent aussi pour la navigation avec une technologie d'assistance. Le besoin explicitement donné est toutefois l'accès en lecture audio : accessibilité est le premier angle.",
      "Adapter un contenu pour qu'il reste compréhensible dans un mode de lecture particulier, ici l'écoute, relève du levier accessibilité.",
    ]),
  },
];

const fit = (id: string, heading: string, need: string, proposal: string, adapted: boolean, why: string): Question => ({
  id, heading,
  boxes: [{ label: "Besoin", text: need }, { label: "Version optimisée proposée", text: proposal }],
  legend: "Cette version répond-elle au besoin ?",
  options: [{ label: "Adaptée", ok: adapted, why }, { label: "Pas adaptée", ok: !adapted, why }],
});

const EX2: Question[] = [
  fit("ex2-a", "Odile Rambert, guide complet", "Odile Rambert doit recevoir un guide complet couvrant tous les cas particuliers (absence proratisée, congé sans solde...), sans limite de longueur imposée.",
    "Le guide a été réduit à une seule page ne couvrant que les cas standards, les cas particuliers ont été retirés.", false,
    "Aucune contrainte de longueur n'avait été demandée : couper les cas particuliers retire une information nécessaire au public référent RH sans justification. Ce n'est pas adapté."),
  fit("ex2-b", "Affiche A5 pour l'espace de pause", "Une affiche doit être imprimée au format A5 pour l'espace de pause, contrainte imposée : 120 mots maximum, aucune liste à puces, la mise en page graphique étant déjà fixée par le service communication.",
    "110 mots au total, mais le texte est présenté sous forme de liste à puces pour plus de lisibilité.", false,
    "La contrainte de format imposée, aucune liste à puces, n'est pas respectée, même si la longueur est correcte : une contrainte explicite se respecte intégralement."),
  fit("ex2-c", "Josette Bellanger, demande en autonomie", "Le guide destiné à Josette Bellanger doit lui permettre de déposer seule une demande d'absence, sans aide.",
    "4 étapes numérotées, une action par ligne, vocabulaire courant, aucun terme d'écran technique du type « workflow ».", true,
    "Étapes numérotées, vocabulaire courant, une action par ligne : exactement ce dont Josette a besoin pour agir seule, sans détail technique superflu."),
  fit("ex2-d", "Karim Lasfar, validation express", "Karim Lasfar doit pouvoir valider une demande en moins d'une minute entre deux réunions.",
    "Reformulée avec un ton dynamique et quelques émojis, mais toujours organisée en un unique paragraphe de 15 lignes.", false,
    "Le style a changé mais ni le format ni la longueur, qui restent le véritable obstacle pour Karim : un ton plus dynamique ne fait pas gagner de temps de lecture à lui seul."),
  fit("ex2-e", "Odile Rambert, retrouver chaque cas", "Odile Rambert doit conserver l'intégralité des cas particuliers du guide référent RH, mais souhaite retrouver chaque cas plus rapidement.",
    "Même contenu, réorganisé en tableau avec une ligne par cas particulier et une colonne « action à effectuer », rien n'a été supprimé.", true,
    "Le format a été amélioré (tableau, une ligne par cas) sans toucher au fond, exactement ce qu'Odile demandait : retrouver l'information plus vite sans en perdre."),
];

const EX3: Question[] = [
  {
    id: "ex3-a", heading: "Adapter le guide pour Karim Lasfar",
    legend: "Le guide référent RH doit être adapté pour Karim Lasfar (manager d'atelier, besoin de valider vite). Quel prompt est complet ?",
    options: [
      { label: "« Rends ce guide plus simple pour Karim. »", why: "Trop vague : « plus simple » ne dit pas ce qui doit changer, ni ce qui doit rester, ni le format attendu." },
      { label: "« Utilise un ton plus sympa. »", why: "Ne porte que sur le style, sans préciser de contrainte de longueur ni de format de sortie, alors que le vrai problème de Karim est la longueur du guide." },
      { label: "« À partir de la version validée jointe, conserve les 3 actions et leur ordre. Présente une check-list d'une action par ligne, 12 mots maximum par ligne, remplace “workflow” par “circuit de validation”, ton direct et professionnel. N'ajoute aucun fait. Puis liste les changements et les points à confirmer. »", ok: true, why: "Le prompt identifie la source, protège les trois actions validées, fixe une ligne par action et demande un relevé des écarts." },
      { label: "« Réécris entièrement un nouveau guide pour Karim, sans repartir du guide existant. »", why: "Contredit le principe même de l'optimisation : on ne repart pas de zéro, on ajuste le contenu déjà généré." },
    ],
  },
  {
    id: "ex3-b", heading: "Adapter le guide pour Josette Bellanger",
    legend: "Le guide référent RH doit être adapté pour Josette Bellanger (peu à l'aise avec l'informatique). Quel prompt est complet ?",
    options: [
      { label: "« Repars de zéro et écris un guide pour un débutant total en informatique. »", why: "Repartir de zéro pour un « débutant total » ignore le contenu déjà validé : ce n'est pas une optimisation, c'est une nouvelle génération non maîtrisée." },
      { label: "« À partir de la version validée jointe, conserve les 4 actions et leur ordre. Remplace “workflow” par “circuit de validation” et explique tout autre terme nécessaire entre parenthèses. Numérote une action par ligne, 12 mots maximum par action. N'invente rien ; signale tout terme impossible à simplifier. »", ok: true, why: "Le prompt protège les actions validées, cible les termes définis, fixe des critères mesurables et prévoit les points qui ne peuvent pas être simplifiés sans risque." },
      { label: "« Simplifie ce guide. »", why: "« Simplifie » ne précise ni ce qui doit rester, ni le format attendu : l'IA doit deviner." },
      { label: "« Ajoute plus d'explications. »", why: "Josette a besoin d'un contenu plus court et plus clair, pas de plus d'explications : ce prompt va dans la mauvaise direction et reste vague." },
    ],
  },
  {
    id: "ex3-c", heading: "Intégrer la règle des 48 heures pour Odile Rambert",
    legend: "Le guide référent RH doit intégrer la règle issue de la politique fictive validée, version 3, pour Odile Rambert : accord exprès du manager lorsque la demande est déposée moins de 48 heures avant la date de début. Quel prompt est complet ?",
    options: [
      { label: "« Ajoute des informations. »", why: "« Ajoute des informations » ne dit pas laquelle, ni où, ni ce qui doit rester inchangé." },
      { label: "« Récris le guide sans mentionner la validation en deux temps déjà expliquée. »", why: "Retirer une explication déjà présente et correcte n'est pas ce qui est demandé : le contenu existant sur la validation en deux temps doit être conservé, pas supprimé." },
      { label: "« Rends le guide plus complet. »", why: "« Plus complet » ne précise ni l'information à ajouter, ni où l'insérer, ni ce qui doit rester identique." },
      { label: "« À partir du guide validé et de la politique version 3 jointe, conserve les informations existantes. Ajoute exactement la règle suivante dans la section Délais : “Toute demande déposée moins de 48 heures avant la date de début nécessite l'accord exprès du manager.” Cite la version 3. Garde le ton et le format ; si la limite de longueur ne peut plus être respectée, signale le conflit sans supprimer d'information. Puis liste les modifications. »", ok: true, why: "Le prompt cite la source, reproduit la règle sans l'altérer, protège le contenu validé et demande de signaler un conflit de longueur au lieu de le masquer." },
    ],
  },
];

const score25: ScoreText = ({ correct, total, pct }) =>
  `Score : ${correct} / ${total}. ${pct >= 80 ? `Seuil atteint (${pct} %). Bon travail.` : `Sous le seuil de réussite (${pct} %). Relisez les explications ci-dessus et retentez.`}`;

export default function Pg25(_props: PlaygroundProps) {
  const th = useTh();
  const quiz = (qs: Question[], i: number) => (done: () => void) => <Quiz questions={qs} onComplete={done} scoreText={score25} tint={PG_TINTS[i]} prefix revealCorrect hint="Seuil de réussite : 80 %" />;
  const activities: Activity[] = [
    {
      nav: "Quel levier ?",
      title: "Exercice 1 · Quel levier pour quel besoin ?",
      tag: "Noté · seuil 80 %",
      fictive: true,
      intro: <p>Pour chaque situation, le contenu généré est correct sur le fond mais ne convient pas tel quel. Choisissez l'angle de correction le plus directement décrit. Plusieurs angles peuvent se recouvrir dans un projet réel : la réponse sert ici de point de départ, pas d'étiquette exclusive.</p>,
      render: quiz(EX1, 0),
      retain: <>Cinq leviers, un diagnostic d'abord. <strong>Style</strong> : registre et vocabulaire. <strong>Contrainte</strong> : une limite formelle (nombre, longueur, élément imposé). <strong>Contexte</strong> : une information de fond qui manque, ajoutée depuis une source validée. <strong>Format</strong> : la structuration et la mise en forme. <strong>Accessibilité</strong> : un mode de lecture particulier. Les angles se recouvrent : partez du défaut explicitement observé.</>,
    },
    {
      nav: "Répond-elle au besoin ?",
      title: "Exercice 2 · Cette version répond-elle au besoin ?",
      tag: "Noté · seuil 80 %",
      fictive: true,
      intro: <p>Le contexte et le public visé sont donnés avant la version optimisée proposée. Jugez si elle répond réellement au besoin.</p>,
      render: quiz(EX2, 1),
      retain: <>Une optimisation se juge au besoin réel du public, pas à l'effort fourni : on ne coupe pas une information nécessaire sans contrainte qui l'exige, une contrainte explicite se respecte intégralement, et changer le ton ne règle pas un problème de longueur ou de format. Améliorer la forme sans toucher au fond est souvent la bonne réponse.</>,
    },
    {
      nav: "Le prompt complet",
      title: "Exercice 3 · Repérer un prompt d'optimisation complet",
      tag: "Noté · seuil 80 %",
      fictive: true,
      intro: <p>Pour chaque situation, un seul prompt relie la version de départ, la source, ce qui change, ce qui reste, les critères d'acceptation et la sortie attendue.</p>,
      render: quiz(EX3, 2),
      retain: <>Un prompt d'optimisation complet part de la version validée et de sa source, dit ce qui change et ce qui reste, fixe des critères mesurables, interdit d'ajouter des faits et demande un relevé des changements et des points à confirmer. On ajuste l'existant ; on ne repart pas de zéro. Conservez la version de départ, la consigne et la version obtenue.</>,
    },
    {
      nav: "À vous d'optimiser",
      title: "Exercice 4 · À vous d'optimiser (à remettre)",
      tag: "Non noté · à remettre au formateur",
      fictive: true,
      intro: (
        <>
          <p>Votre brouillon est sauvegardé automatiquement dans ce navigateur. Remettez au formateur le texte de départ, votre prompt, la version optimisée, un relevé des changements et votre propre vérification critère par critère.</p>
          <Box label="Contenu généré, à optimiser" quote>« Une fois votre demande d'absence soumise via le portail SIRH, un accusé de réception automatique vous est transmis par messagerie électronique. Ce message confirme l'enregistrement de la requête dans le système et précise qu'elle sera soumise à validation hiérarchique dans un délai de traitement pouvant atteindre 48 heures ouvrées, conformément au paramétrage du workflow d'approbation en vigueur chez Aravix Industries. Aucune action complémentaire n'est requise de la part du demandeur à ce stade du processus. »</Box>
          <p><strong style={{ color: th.fg }}>Public visé</strong> : un nouvel arrivant chez Aravix Industries, en poste depuis une semaine, qui n'a jamais utilisé le SIRH et lit ce message sur son téléphone pendant sa pause. Rédigez d'abord vos critères, puis le prompt et la version optimisée. Comparez enfin chaque information au texte source et expliquez les changements.</p>
        </>
      ),
      render: (done) => (
        <DraftExercise storageKey="nathalie_playground_2_5_ex4" onComplete={done}
          label="Vos critères, votre prompt, la version optimisée et votre vérification"
          placeholder={"Critères d'acceptation :\nPrompt de correction :\nVersion optimisée :\nRelevé des changements :\nVérification par rapport à la source :"}
          statusInit="Votre brouillon est enregistré automatiquement pendant que vous écrivez."
          corrige={
            <>
              <Box label="Une version possible" quote>« Votre demande d'absence est enregistrée. Vous recevrez un e-mail de confirmation. Elle sera envoyée à votre manager, qui peut avoir jusqu'à 48 heures ouvrées pour répondre. Pour le moment, vous n'avez rien d'autre à faire. »</Box>
              {/* Correction d'incohérence : le HTML d'origine annonçait « cinq phrases courtes »
                  alors que la version proposée en compte quatre. */}
              <Box label="Justification indicative">
                <strong>Style :</strong> vocabulaire courant, sans « workflow d'approbation ». <strong>Contrainte :</strong> quatre phrases courtes. <strong>Format et accessibilité :</strong> une idée principale par phrase. <strong>Vérification :</strong> enregistrement, e-mail, validation par le manager, délai exact de 48 heures ouvrées et absence d'action immédiate sont conservés ; aucune promesse de réponse sous deux jours calendaires n'a été ajoutée.
              </Box>
            </>
          } />
      ),
      retain: <>Le fond avant la forme : chaque information du texte source (enregistrement, e-mail, validation par le manager, délai exact, absence d'action) doit se retrouver dans la version optimisée, sans promesse ajoutée. Arrêtez d'optimiser dès qu'une nouvelle itération ne change plus la compréhension ou l'usage réel du contenu, seulement son esthétique.</>,
    },
  ];

  return (
    <PgShell lesson="2.5"
      title={<>Optimiser des contenus, <span className="hl">cas pratiques</span></>}
      intro="Mettez en pratique les cinq leviers d'optimisation sur des cas fictifs, tous liés au même contexte : Aravix Industries déploie un nouveau module de gestion des demandes d'absence dans son logiciel SIRH, et un même guide de prise en main doit être décliné pour des publics différents. Chaque exercice noté a son propre bouton de correction et son propre score."
      activities={activities}
      further={
        <Further
          text={<p>Dans les Exercices prompts, comparez vos tentatives successives sur une même consigne : c'est la démarche d'optimisation, mesurée. Puis menez une conversation d'optimisation dans le Studio : collez la version de départ (fictive), demandez une correction levier par levier, et vérifiez chaque version contre la source.</p>}
          links={[
            { label: "Exercices · Prompts, comparer les tentatives", to: "/practice/prompts" },
            { label: "Studio · ChatGPT", to: "/studio/chatgpt" },
            { label: "Studio · Claude", to: "/studio/claude" },
            { label: "Studio · Gemini", to: "/studio/gemini" },
          ]} />
      } />
  );
}
