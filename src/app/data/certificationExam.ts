// Sujet de l'épreuve écrite de la certification RS6776 (InKréa Certifications),
// repris mot pour mot de "Evaluation_Finale_EDOF.pdf". Seules les consignes
// propres au document Word ("Dans le Menu Word > Insertion > Image…") sont
// remplacées par leur équivalent sur la plateforme.
//
// Mise en forme légère dans les textes : **gras**, //italique//, ++souligné++
// (imbricables), cf. RichText dans CertificationExamView.

export type ExamField =
  | { id: string; kind: "line" | "text"; label: string; answerLabel: string }
  | { id: string; kind: "table"; label: string; bullets: string[]; columns: string[] }
  | { id: string; kind: "image"; label: string; answerLabel: string };

export type ExamBlock =
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] };

export interface ExamPart { heading?: string; fields: ExamField[] }

export interface ExamExercise {
  number: number;
  subtitle: string;
  context: ExamBlock[];
  parts: ExamPart[];
}

export const EXAM_CERTIFICATION_TITLE = "« Création de contenus rédactionnels et visuels par l’usage responsable de l’intelligence artificielle générative »";

export const EXAM_INTRO: ExamBlock[] = [
  { type: "p", text: "Vous avez suivi une formation visant au passage de la certification //« Création de contenus rédactionnels et visuels par l’usage responsable de l’intelligence artificielle générative »//." },
  { type: "p", text: "Afin de valider vos acquis et d’attester de vos compétences, vous devez remplir cette évaluation composée de **6 exercices**. //Veillez à insérer les réponses directement dans ce questionnaire, aux endroits prévus.//" },
];

export const EXAM_IDENTITY_FIELDS: ExamField[] = [
  { id: "identity.fullName", kind: "line", label: "Prénom et nom :", answerLabel: "Prénom et nom :" },
  { id: "identity.organisme", kind: "line", label: "Organisme de formation :", answerLabel: "Organisme de formation :" },
];

export const EXAM_TABLE_COLUMNS = ["Tâche à optimiser", "Fréquence", "Outil d’IA", "Utilisation/justification", "Budget"];

export const EXAM_EXERCISES: ExamExercise[] = [
  {
    number: 1,
    subtitle: "Mise en place d’une stratégie d’implémentation d’Intelligence Artificielle (IA) Générative",
    context: [
      { type: "p", text: "Samuel travaille comme assistant administratif et commercial dans une PME spécialisée dans l’organisation de séminaires et d’événements professionnels. L’activité repose sur une équipe réduite qui gère à la fois la relation client, la communication et la logistique." },
      { type: "p", text: "Samuel s’occupe de nombreuses tâches variées : répondre aux e-mails des clients (principalement des demandes de devis ou d’informations sur les formules proposées), mettre en forme les supports de présentation (plaquettes, slides PowerPoint), rédiger les comptes-rendus des réunions de coordination internes, gérer les publications sur LinkedIn pour valoriser les événements organisés, et préparer chaque mois une newsletter destinée aux clients et prospects de l’entreprise." },
      { type: "p", text: "Avec la multiplication des événements à gérer et des sollicitations clients, Samuel peine à maintenir la qualité et la régularité de ses livrables." },
      { type: "p", text: "La direction envisage d’intégrer certains outils d’IA Générative pour l’aider à optimiser son organisation et améliorer la productivité de l’équipe." },
      { type: "p", text: "Pour cet exercice, vous mettrez en place un plan stratégique visant à l’implémentation d’outils d’IA Générative au poste de Samuel afin de l’aider à accomplir ses missions plus efficacement." },
    ],
    parts: [{
      fields: [
        { id: "ex1.q1", kind: "text", label: "1/ Décrivez brièvement l'entreprise.", answerLabel: "Votre réponse :" },
        {
          id: "ex1.q2", kind: "table",
          label: "2/ À partir du tableau suivant //(ajoutez ou supprimez des lignes si besoin)//, proposez un plan d’actions pour l’implémentation d’outils d’IA Générative au poste de Samuel, incluant :",
          bullets: [
            "Les tâches identifiées comme pouvant être optimisées",
            "La fréquence de réalisation de ces tâches",
            "L’outil d’IA Générative associé à chaque tâche identifiée",
            "La justification de l’utilisation de cet outil, pour chaque tâche",
            "Le budget à prévoir (0€ si version gratuite, abonnement une seule fois si version payante)",
          ],
          columns: EXAM_TABLE_COLUMNS,
        },
      ],
    }],
  },
  {
    number: 2,
    subtitle: "Les techniques de Prompt Engineering pour la génération de contenus",
    context: [
      { type: "p", text: "Vous êtes assistant(e) communication dans une librairie indépendante à Lyon, dont vous gérez la communication digitale, via notamment un blog sur le site internet de la librairie. Vous devez rédiger un article de blog présentant **les conseils pour choisir des livres adaptés aux adolescents**, afin d’attirer davantage de visiteurs sur le site et de promouvoir les ventes en ligne. Pour accompagner cet article, vous devez également créer un visuel attractif. Pour rédiger cet article et créer le visuel, vous vous aidez d’outils d’IA Générative." },
      { type: "p", text: "++**//Instructions pour l’article ://**++" },
      { type: "p", text: "//Vous ne demanderez pas à l'outil d'IA générative choisi de le rédiger, mais seulement de vous proposer une **structure complète** d’article.//" },
      { type: "p", text: "++**//Instructions pour le visuel ://**++" },
      { type: "p", text: "//Vous lui demanderez de le créer selon vos directives.//" },
    ],
    parts: [
      {
        heading: "I - Rédaction de la structure d'article de blog",
        fields: [
          { id: "ex2.i1", kind: "line", label: "1/ Indiquez l’outil d’IA Générative choisi pour la rédaction de la structure d’article de blog :", answerLabel: "Outil d’IA Générative choisi :" },
          { id: "ex2.i2", kind: "text", label: "2/ Rédigez un prompt en respectant les techniques de Prompt Engineering afin que l’outil d’IA Générative que vous avez choisi vous fournisse un contenu rédactionnel (structure d'article de blog) satisfaisant. //Si souhaité, vous pouvez inclure les différentes étapes de prompt (réponses aux questions que l’outil vous aura posées, par exemple).//", answerLabel: "Votre prompt :" },
          { id: "ex2.i3", kind: "text", label: "3/ Proposez un contenu rédactionnel (structure de l’article de blog) rédigé par l’outil d’IA Générative choisi //(copiez-collez ci-dessous) ://", answerLabel: "Structure de l’article de blog :" },
        ],
      },
      {
        heading: "II - Création du visuel pour illustrer l'article",
        fields: [
          { id: "ex2.ii1", kind: "line", label: "1/ Indiquez l’outil d’IA Générative choisi pour la création du visuel :", answerLabel: "Outil d’IA Générative choisi :" },
          { id: "ex2.ii2", kind: "text", label: "2/ Rédigez un prompt afin que l’outil d’IA Générative que vous avez choisi vous fournisse un visuel satisfaisant pour illustrer votre article de blog.", answerLabel: "Votre prompt :" },
          { id: "ex2.ii3", kind: "image", label: "3/ Proposez un visuel créé par l’outil d’IA Générative choisi. > Importez ici votre visuel", answerLabel: "Votre visuel :" },
        ],
      },
    ],
  },
  {
    number: 3,
    subtitle: "Le respect de la confidentialité dans l'usage de l'intelligence artificielle générative",
    context: [
      { type: "p", text: "Vous êtes secrétaire dans un cabinet d’avocats spécialisé en droit des sociétés. Vous utilisez un outil d’IA générative pour rédiger une base de rédaction d’un **contrat de prestation de services** pour un client start-up." },
      { type: "p", text: "Le client a communiqué oralement et par e-mail les informations relatives au contrat, et l’IA est utilisée pour créer le document de base à lui soumettre pour validation. Le prompt initial inclut des informations sensibles (nom du client, adresse de la société, données financières), ce qui peut compromettre la confidentialité." },
      { type: "p", text: "++**Ce prompt doit être corrigé en appliquant les bonnes pratiques de sécurisation de la confidentialité des données :**++" },
      { type: "ul", items: [
        "Analysez les risques compromettant la confidentialité des données",
        "Proposez des solutions pour pallier ces risques",
        "Proposez un prompt corrigé et garantissant la confidentialité des données dites sensibles",
      ] },
      { type: "p", text: "++**Le prompt à corriger :**++" },
      { type: "p", text: "//“Rédige un contrat de prestation de services pour la société Innovatech SARL, dirigée par Madame Clara Duval (SIRET : 123 456 789 00012), située au 12 avenue des Start-ups, 69003 Lyon, pour la réalisation d’un projet de développement logiciel. Inclure le montant de 25 000 euros convenu avec la cliente.”//" },
    ],
    parts: [{
      fields: [
        { id: "ex3.q1", kind: "text", label: "1/ Indiquez sous forme de liste les risques identifiés ainsi que les solutions à apporter pour garantir la confidentialité des données :", answerLabel: "Risques | Solutions :" },
        { id: "ex3.q2", kind: "text", label: "2/ Proposez un prompt corrigé, qui respecte la confidentialité des données et évite tout risque de violation de ces données :", answerLabel: "Prompt corrigé :" },
      ],
    }],
  },
  {
    number: 4,
    subtitle: "La production de contenus inclusifs avec l'intelligence artificielle générative",
    context: [
      { type: "p", text: "Vous êtes assistante de communication dans une entreprise de restauration collective et devez rédiger une **note interne à destination des employés concernant les nouvelles consignes d’hygiène et de sécurité alimentaire**." },
      { type: "p", text: "++Cette note concerne :++" },
      { type: "ul", items: [
        "L’introduction d’un nouveau protocole de lavage des mains obligatoire avant chaque préparation de repas.",
        "La nouvelle directive de l’entreprise concernant la gestion des allergies alimentaires et l’étiquetage des plats.",
        "Une réunion aura lieu jeudi prochain à 10h en salle de pause, où ces nouvelles directives seront présentées et expliquées à tous les salariés.",
      ] },
      { type: "p", text: "Un des employés est en situation de handicap cognitif. Il est donc essentiel que le contenu de la note soit inclusif et **facile à comprendre**, adapté à cette personne, tout en restant clair pour l’ensemble du personnel." },
      { type: "p", text: "//Il vous est demandé de fournir un prompt destiné à un outil d’IA générative pour rédiger une note interne accessible à tous les salariés, en tenant compte de la personne en situation de handicap évoquée dans l'énoncé.//" },
    ],
    parts: [{
      fields: [
        { id: "ex4.q1", kind: "line", label: "1/ Indiquez l’outil d’IA Générative choisi pour l'exercice :", answerLabel: "Outil d’IA générative choisi :" },
        { id: "ex4.q2", kind: "text", label: "2/ Rédigez un prompt afin que l’outil d’IA Générative que vous avez choisi vous fournisse un contenu qui réponde à l’ensemble des contraintes indiquées dans l’énoncé, et qui soit accessible.", answerLabel: "Votre prompt :" },
        { id: "ex4.q3", kind: "text", label: "3/ Proposez un texte pour la note interne qui respecte l'accessibilité au salarié en situation de handicap, tout en incluant l'ensemble des éléments //(vous avez la possibilité d’intégrer ici les différentes étapes d’optimisation)//", answerLabel: "Votre note interne accessible :" },
      ],
    }],
  },
  {
    number: 5,
    subtitle: "Les techniques d’optimisation des contenus générés par l’intelligence artificielle générative",
    context: [
      { type: "p", text: "Vous travaillerez à partir de ce texte. Il s’agit d’un extrait d’article sur le thème de **l’énergie solaire et des panneaux photovoltaïques** :" },
      { type: "p", text: "//“Les panneaux photovoltaïques sont des dispositifs capables de convertir l’énergie lumineuse du soleil en énergie électrique grâce à l’effet photovoltaïque. Le rendement énergétique des panneaux dépend de plusieurs facteurs, notamment le type de cellule (monocristalline, polycristalline ou à couche mince), l’orientation et l’inclinaison du panneau, ainsi que l’intensité et la durée de l’ensoleillement. Les systèmes photovoltaïques peuvent être connectés au réseau électrique (systèmes dits ‘on-grid’) ou fonctionner de manière autonome avec stockage sur batteries (systèmes ‘off-grid’). L’entretien régulier et le nettoyage des panneaux sont essentiels pour maintenir leur performance optimale sur le long terme. Les applications des panneaux photovoltaïques incluent la production domestique d’électricité, l’alimentation de bâtiments industriels ou commerciaux, ainsi que des installations dans des zones isolées sans accès au réseau électrique classique.”//" },
      { type: "p", text: "++**Ce contenu doit être amélioré afin de répondre aux critères d’optimisation suivants :**++" },
      { type: "p", text: "Ce texte doit être **simplifié et vulgarisé** pour un public d’adultes novices, qui n’ont pas de connaissances techniques en énergie solaire. Il doit rester informatif mais plus accessible, avec des phrases claires et un vocabulaire simple." },
      { type: "p", text: "Pour optimiser ce contenu :" },
    ],
    parts: [{
      fields: [
        { id: "ex5.q1", kind: "line", label: "1/ Indiquez l’outil d’IA Générative choisi pour l'exercice :", answerLabel: "Outil d’IA générative choisi :" },
        { id: "ex5.q2", kind: "text", label: "2/ Rédigez un prompt afin que l’outil d’IA Générative que vous avez choisi vous fournisse un contenu optimisé qui réponde à l’ensemble des contraintes indiquées dans l’énoncé.", answerLabel: "Votre prompt :" },
        { id: "ex5.q3", kind: "text", label: "3/ Proposez un contenu optimisé :", answerLabel: "Extrait d’article optimisé :" },
      ],
    }],
  },
  {
    number: 6,
    subtitle: "Prise en compte des directives règlementaires et de l'éthique dans l'usage de l'intelligence artificielle générative",
    context: [
      { type: "p", text: "Une entreprise de marketing digital, **GreenCom**, utilise un outil d'IA générative pour créer du contenu rédactionnel et visuel destiné à ses clients. Cet outil produit des textes et des images pour des campagnes publicitaires en ligne. Lors d'une campagne récente pour un client dans le secteur de l’alimentation, l’outil a généré des descriptions de produits qui ont soulevé des préoccupations éthiques." },
      { type: "p", text: "++**Voici une de ces descriptions produits :**++" },
      { type: "p", text: "**//Barre énergétique \"Boost ultime\"//**" },
      { type: "p", text: "//Cette barre énergétique est idéale pour les sportifs qui veulent performer et rester minces. Elle aidera à avoir une silhouette musclée et attractive tout en fournissant de l’énergie rapidement. Parfaite pour ceux qui veulent afficher un corps idéal.//" },
      { type: "p", text: "Il vous est demandé d'identifier d'éventuelles problématiques éthiques dans ce contenu, et d'y apporter des solutions en travaillant directement avec l'intelligence artificielle générative." },
    ],
    parts: [{
      fields: [
        { id: "ex6.q1", kind: "text", label: "1/ Quelles sont les problématiques éthiques soulevées dans ce descriptif ? Justifiez votre réponse.", answerLabel: "Votre réponse :" },
        { id: "ex6.q2", kind: "text", label: "2/ Quelles solutions et corrections pourraient-elles être apportées afin de supprimer la problématique éthique dans ce contenu ?", answerLabel: "Votre réponse :" },
        { id: "ex6.q3", kind: "text", label: "3/ Proposez un prompt d'optimisation visant à corriger ce descriptif d'article. //Indiquez à votre outil d'intelligence artificielle où se situent les problématiques, donnez-lui vos directives, et demandez-lui de réécrire ce descriptif de façon à ce qu'il ne présente plus aucune problématique d'ordre éthique.//", answerLabel: "Votre prompt correctif :" },
        { id: "ex6.q4", kind: "text", label: "4/ Proposez le descriptif corrigé, généré par votre outil d'IA générative.", answerLabel: "Descriptif corrigé :" },
      ],
    }],
  },
];

export const EXAM_ALL_FIELDS: ExamField[] = [
  ...EXAM_IDENTITY_FIELDS,
  ...EXAM_EXERCISES.flatMap((ex) => ex.parts.flatMap((p) => p.fields)),
];
