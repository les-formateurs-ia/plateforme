import { useTh } from "@/app/theme/theme";
import type { PlaygroundProps } from "@/app/playgrounds/registry";
import { Box, DraftExercise, Further, PG_TINTS, PgShell, Quiz, type Activity, type Question, type ScoreText } from "./Pg21";

// Playground natif de la leçon 2.3 (version SIRH), converti depuis
// docs/formation-rs6776/lecon-2.3/playground-nathalie.html.
// Briques communes : voir Pg21.tsx.
// Le profil de Nathalie (« consultante indépendante intervenant chez plusieurs
// clients en parallèle ») est repris tel quel du HTML d'origine.

const EX1: Question[] = [
  {
    id: "q1", heading: "1. Compte-rendu confidentiel",
    boxes: [{ text: "Vous envisagez d'enregistrer une session sur un module de gestion des temps pour en tirer un compte-rendu. Les échanges pourraient contenir des remarques nominatives sur des cas de paie réels." }],
    legend: "Quelle option est la plus adaptée ?",
    options: [
      { label: "Envoyer l'enregistrement directement à un service de transcription en ligne pour aller vite.", why: "L'audio brut contient des éléments identifiants : l'envoyer tel quel à un service en ligne les expose d'emblée." },
      { label: "Vérifier d'abord le cadre de l'enregistrement ; s'il est permis, utiliser une chaîne d'outils approuvés, contrôler et minimiser la transcription, puis vérifier le compte-rendu.", ok: true, why: "La chaîne commence avant l'enregistrement : cadre applicable, information, autorisation, accès, stockage et suppression. Elle continue avec un outil de transcription et un service de rédaction approuvés, la minimisation puis la validation." },
      { label: "Résumer la session de mémoire, sans réécouter l'enregistrement.", why: "Résumer de mémoire fait perdre en fidélité et en détails exploitables pour le client." },
      { label: "Transcrire en ligne, puis envoyer le texte tel quel au client sans le relire.", why: "Transcrire en ligne sans rien modifier expose ensuite les mêmes éléments identifiants à l'IA qui rédige le compte-rendu." },
    ],
  },
  {
    id: "q2", heading: "2. Guide partagé avec le client",
    boxes: [{ text: "Pour un autre client, vous rédigez un passage de guide qui doit être coédité dans Google Docs. Le client confirme que Gemini est activé dans son offre Workspace et autorisé pour ce document." }],
    legend: "Quelle option est la plus adaptée ?",
    options: [
      { label: "Utiliser l'intégration Gemini prévue dans l'environnement Workspace du client.", ok: true, why: "Dans ce contexte précis, l'intégration déjà activée et autorisée répond au besoin de collaboration directe." },
      { label: "Utiliser ChatGPT, pour la même raison.", why: "ChatGPT ne s'ouvre pas nativement dans un document Docs partagé de la même façon que Gemini." },
      { label: "Peu importe l'outil, l'intégration bureautique est identique.", why: "Les deux outils n'ont pas la même intégration bureautique : c'est justement ce qui les distingue sur ce point précis." },
      { label: "Utiliser un outil de transcription hors ligne.", why: "Un outil de transcription ne répond pas au besoin de coédition d'un guide dans Google Docs." },
    ],
  },
  {
    id: "q3", heading: "3. Évaluer un assistant préconfiguré",
    boxes: [{ text: "Vous trouvez dans un catalogue public un assistant qui promet de reformuler des guides clients dans un style pédagogique." }],
    legend: "Quelle option est la plus adaptée ?",
    options: [
      { label: "Lui transmettre immédiatement un guide client complet.", why: "La présence dans un catalogue public ne garantit ni l'autorisation interne ni la qualité." },
      { label: "Vérifier l'éditeur, les connexions et les données traitées, confirmer l'autorisation, puis le tester sur un extrait fictif avec des critères de réussite.", ok: true, why: "Le bon contrôle porte sur l'éditeur, les connexions, les données, les droits et la qualité mesurée sur un cas fictif." },
      { label: "Se fier uniquement à sa note et aux avis du catalogue.", why: "Un avis positif ne remplace ni l'analyse des autorisations ni un test représentatif." },
      { label: "Renommer le fichier client « test » avant de le transmettre.", why: "Masquer le nom du fichier ne protège pas le contenu qu'il renferme." },
    ],
  },
  {
    id: "q4", heading: "4. Une correction ponctuelle et simple",
    boxes: [{ text: "Vous devez reformuler une seule phrase d'un guide pour la rendre plus claire : une tâche ponctuelle et simple." }],
    legend: "Quelle option est la plus adaptée ?",
    options: [
      { label: "Basculer sur le mode de raisonnement le plus approfondi de l'outil.", why: "Le mode approfondi est utile pour une demande complexe à plusieurs contraintes, pas pour reformuler une phrase isolée." },
      { label: "Utiliser le mode rapide standard de l'outil.", ok: true, why: "Pour une tâche courante et simple, le mode rapide standard suffit largement." },
      { label: "Créer un Project dédié avec des instructions permanentes avant de commencer.", why: "Créer un Project est adapté à un usage récurrent, pas à une reformulation ponctuelle isolée." },
      { label: "Changer complètement d'outil.", why: "Changer d'outil n'a aucun rapport avec la difficulté réelle de la tâche." },
    ],
  },
  {
    id: "q5", heading: "5. Garder deux clients strictement séparés",
    boxes: [{ text: "Deux clients vous ont chacun transmis des contenus internes. Leur traitement dans ChatGPT est autorisé sous conditions et vous devez maintenir une séparation contrôlable." }],
    legend: "Quelle option est la plus adaptée ?",
    options: [
      { label: "Tout mélanger dans une seule conversation pour gagner du temps.", why: "Mélanger les contenus de deux clients dans une seule conversation va justement à l'encontre du cloisonnement recherché." },
      { label: "Utiliser un espace distinct par client et contrôler ses accès, partages, fichiers, paramètres de données et règles de suppression.", ok: true, why: "Des espaces distincts facilitent l'organisation, à condition de vérifier également les membres, le partage, les fichiers, les paramètres de données et la suppression." },
      { label: "Ne prendre aucune précaution particulière, l'outil s'en charge automatiquement.", why: "Ne prendre aucune précaution revient à accepter le risque de mélanger les contenus de plusieurs clients." },
      { label: "Supprimer les documents de chaque client après usage, sans les organiser.", why: "Supprimer sans organiser ne règle pas le besoin de séparer les contenus pendant qu'ils sont utilisés." },
    ],
  },
];

const vf = (id: string, n: number, statement: string, truth: boolean, why: string): Question => ({
  id, heading: `Affirmation ${n}`,
  legend: statement,
  options: [{ label: "Vrai", ok: truth, why }, { label: "Faux", ok: !truth, why }],
});

const EX2: Question[] = [
  vf("v1", 1, "La présence d'un assistant dans un catalogue public garantit qu'il est autorisé par votre organisation.", false, "Faux : il faut vérifier l'éditeur, les outils ou connexions, les données, les autorisations et la qualité."),
  vf("v2", 2, "Une application annoncée comme locale n'a besoin d'aucune vérification supplémentaire.", false, "Faux : vérifiez le traitement réel, les envois secondaires, le stockage, les sauvegardes, les accès et la suppression."),
  vf("v3", 3, "Une intégration de Gemini à Google Workspace peut dépendre de l'offre et des réglages administrateur.", true, "Vrai : il faut vérifier l'offre, les fonctions activées et les droits du compte concerné."),
  vf("v4", 4, "Créer un Project distinct suffit, à lui seul, à garantir la confidentialité et le cloisonnement d'un client.", false, "Faux : un Project organise le travail, mais les accès, partages, fichiers et paramètres doivent encore être contrôlés."),
  vf("v5", 5, "Même avec un outil de transcription approuvé, les noms propres, les nombres, les locuteurs et les passages inaudibles doivent être contrôlés.", true, "Vrai : la transcription automatique peut contenir des erreurs et ne remplace pas l'écoute des passages importants."),
];

const score23: ScoreText = ({ correct, total, pct, allAnswered }) =>
  `${correct} / ${total} (${pct} %)${allAnswered ? "" : " : répondez à toutes les questions"}`;

export default function Pg23(_props: PlaygroundProps) {
  const th = useTh();
  const activities: Activity[] = [
    {
      nav: "Quel outil, quelle méthode ?",
      title: "Exercice 1 : quel outil ou quelle méthode choisir ?",
      tag: "Noté · seuil 80 %",
      fictive: true,
      intro: <p>Cinq situations tirées de votre activité de consultante indépendante intervenant chez plusieurs clients en parallèle. Pour chacune, choisissez l'option la plus adaptée.</p>,
      render: (done) => <Quiz questions={EX1} onComplete={done} scoreText={score23} tint={PG_TINTS[0]} hint="Seuil de réussite : 80 % (4 bonnes réponses sur 5)." />,
      retain: <>On choisit un environnement, pas une réputation : d'après le besoin, les autorisations et les contrôles, après un essai sur un cas représentatif. Une intégration déjà activée et autorisée l'emporte quand elle répond au besoin ; le mode rapide suffit aux tâches simples ; un espace distinct par client ne dispense pas de contrôler accès, partages, fichiers, paramètres et suppression.</>,
    },
    {
      nav: "Vrai ou faux ?",
      title: "Exercice 2 : vrai ou faux ?",
      tag: "Noté · seuil 80 %",
      intro: <p>Cinq affirmations sur le choix d'environnement et la transcription. Indiquez si chacune est vraie ou fausse.</p>,
      render: (done) => <Quiz questions={EX2} onComplete={done} scoreText={score23} tint={PG_TINTS[1]} hint="Seuil de réussite : 80 % (4 bonnes réponses sur 5)." />,
      retain: <>« Local », « catalogue public », « Project dédié » : aucune de ces mentions ne vaut vérification. Contrôlez le traitement réel, les envois secondaires, le stockage, les accès et la suppression. Et même avec un outil approuvé, une transcription se relit : noms propres, nombres, locuteurs, passages inaudibles.</>,
    },
    {
      nav: "Transcription minimisée",
      title: "Exercice 3 : préparer une transcription fictive pour un compte-rendu traçable",
      tag: "Non noté · corrigé indicatif",
      fictive: true,
      intro: (
        <>
          <p>Le formateur vous fournit l'extrait fictif ci-dessous. La finalité est un compte-rendu de pilotage ; le service de rédaction est autorisé pour les informations opérationnelles et budgétaires, mais les identités, coordonnées, motifs médicaux et données de facturation ne sont pas nécessaires. Réécrivez une version minimisée, justifiez chaque retrait ou généralisation, puis préparez le prompt de compte-rendu avec des repères source et des mentions « à confirmer ».</p>
          <Box label="Extrait de transcription (fictif)">
            Bon, on fait le point sur le déploiement du module congés. Farida Ben Slimane a signalé un souci de calcul sur les soldes de deux collaborateurs. L'un des deux, Thibault Roche, est en arrêt longue durée depuis mars, ce qui complique le suivi. Pour la suite, vous pouvez joindre Farida au 07 45 12 98 33 ou par mail à farida.benslimane@exemple-fictif.com. Le budget de la phase 2 du déploiement est fixé à 18 500 euros. Le prestataire technique, Klaro Systèmes, a transmis son numéro de SIRET, 501 234 987 00012, pour la facturation. Pour le reste, on garde le même rythme : un point de suivi toutes les deux semaines et un tableau de bord partagé mis à jour chaque vendredi. Prochaine étape : corriger le paramétrage des soldes avant la fin du mois.
          </Box>
        </>
      ),
      render: (done) => (
        <DraftExercise storageKey="nathalie_playground_2_3_ex3" onComplete={done}
          label="Votre version minimisée, vos justifications et votre prompt"
          placeholder="Votre version nettoyée, avec la justification de chaque retrait..."
          statusInit="Votre brouillon est enregistré automatiquement dans ce navigateur."
          statusRestored="Votre brouillon est enregistré automatiquement dans ce navigateur."
          statusSaved="Brouillon enregistré automatiquement dans ce navigateur."
          corrige={
            <>
              <p><strong style={{ color: th.fg }}>Corrigé indicatif</strong> (une version possible parmi d'autres) :</p>
              <p>« Point sur le déploiement du module congés. La référente RH a signalé un problème de calcul sur les soldes de deux collaborateurs. Une indisponibilité prolongée affecte le suivi <em>(identités et motif médical retirés ; seul l'impact opérationnel nécessaire est conservé)</em>. Pour toute question, contacter la référente RH par le canal interne <em>(coordonnées directes retirées)</em>. Le budget de la phase 2 est fixé à 18 500 euros <em>(conservé parce qu'il est nécessaire à la finalité et autorisé dans ce scénario ; à réexaminer dans un autre contexte)</em>. Le prestataire a transmis ses informations de facturation <em>(nom et SIRET retirés car inutiles au compte-rendu ; ce retrait relève ici de la minimisation et de la confidentialité)</em>. Rythme de suivi inchangé : un point toutes les deux semaines et un tableau partagé mis à jour chaque vendredi. Prochaine étape : corriger le paramétrage des soldes avant la fin du mois ; responsable : à confirmer. »</p>
              <p><strong style={{ color: th.fg }}>Prompt à joindre :</strong> demandez un brouillon fondé uniquement sur cet extrait, sans invention, avec les colonnes décision, action, responsable, échéance, statut confirmé ou à confirmer, et repère source. Comparez ensuite chaque ligne au texte avant remise au formateur.</p>
            </>
          } />
      ),
      retain: <>Minimiser, c'est ne garder que ce que la finalité exige : identités, coordonnées, motif médical et données de facturation sortent ; l'impact opérationnel et le budget autorisé restent. Le compte-rendu se construit ensuite uniquement à partir de l'extrait, avec des repères source et des mentions « à confirmer » plutôt que des suppositions. Une pseudonymisation n'est pas une anonymisation.</>,
    },
  ];

  return (
    <PgShell lesson="2.3"
      title={<>Rédaction IA et compte-rendu vérifiable : <span className="hl">à votre tour, Nathalie</span></>}
      intro="Trois mises en situation pour appliquer la leçon : choisir un environnement selon le besoin et les autorisations, vérifier les contrôles indispensables, puis préparer une transcription fictive avant de produire un compte-rendu traçable."
      activities={activities}
      further={
        <Further
          text={<p>Donnez la même consigne de rédaction à ChatGPT puis à Gemini dans le Studio, et comparez les deux brouillons : fidélité à la source, ton, mentions « à confirmer ». Prolongez dans le Battle Ground, gamme Polyvalent, défi « Rédaction ». N'y collez que des contenus fictifs ou minimisés.</p>}
          links={[
            { label: "Studio · ChatGPT", to: "/studio/chatgpt" },
            { label: "Studio · Gemini", to: "/studio/gemini" },
            { label: "Battle Ground · gamme Polyvalent, défi « Rédaction »", to: "/practice/battle-ground" },
          ]} />
      } />
  );
}
