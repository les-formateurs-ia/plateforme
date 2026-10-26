// Mission de fin de module (Module 1) — « Mission IA : stratégie et confidentialité ».
// Contenu repris à l'identique de la mission HTML d'origine du formateur ;
// les identifiants de champs sont ceux de l'ancienne page (brouillons et
// missions déjà enregistrés relus sans migration, cf. lib/missionAnswers.ts).
import type { MissionDefinition } from "./types";

export const strategieConfidentialite: MissionDefinition = {
  key: "strategie-confidentialite",
  title: "Mission IA : stratégie et confidentialité",
  summary: "Exercice 1 : Mise en place d'une stratégie d'implémentation d'Intelligence Artificielle (IA) Générative · Exercice 2 : Le respect de la confidentialité dans l'usage de l'intelligence artificielle générative",
  intro: (
    <>
      <p>Cette mission de fin de module évalue deux compétences&nbsp;: construire un plan d'introduction de l'IA générative à un poste de travail, avec des objectifs mesurables et des contrôles, puis protéger les informations confidentielles quand on utilise un outil d'IA. Les deux cas ci-dessous sont fictifs&nbsp;; n'ajoutez aucune donnée réelle.</p>
    </>
  ),
  introBlocks: [
    { variant: "note", label: "Lien avec la certification", body: (
      <>
        <p>Cette mission vous entraîne à deux des six compétences évaluées à l'épreuve de certification&nbsp;:</p>
        <ul>
          <li><strong>Exercice 1</strong>&nbsp;: définir la stratégie d'implémentation de l'IA générative sur un poste de travail (choisir les tâches pertinentes, les outils et leurs paramétrages, justifier ses choix et estimer le budget).</li>
          <li><strong>Exercice 2</strong>&nbsp;: garantir la confidentialité des données professionnelles (corriger un prompt pour supprimer les risques et justifier chaque correction).</li>
        </ul>
        <p>À l'épreuve, vous rédigez seul(e), en 10 jours, un dossier de six exercices, puis vous passez un oral d'environ 20 minutes. Chaque compétence est validée séparément (chaque critère est noté de 0 à 5, la compétence est validée à partir de 3,5/5), sans compensation d'une compétence à l'autre, et l'oral doit atteindre 10/20. La grille de notation de cette mission reprend ces mêmes règles (voir «&nbsp;Grille de notation&nbsp;» en bas de page)&nbsp;: le passage au module suivant en dépend.</p>
      </>
    ) },
    { variant: "note", label: "Vocabulaire utile pour cette mission", body: (
      <>
        <ul>
          <li><strong>Prompt</strong>&nbsp;: le message que vous écrivez à un outil d'IA pour lui demander un travail.</li>
          <li><strong>Pilote</strong>&nbsp;: essai limité dans le temps, mené avec un petit groupe de personnes (le groupe de test), avant de décider d'un déploiement plus large. Il doit pouvoir être arrêté sans dommage&nbsp;: il est réversible.</li>
          <li><strong>Mesure de départ</strong>&nbsp;: la situation avant l'IA (par exemple le temps passé sur la tâche), qui sert de point de comparaison.</li>
          <li><strong>Indicateur de réussite</strong>&nbsp;: le résultat chiffré qui permet de conclure que la tâche peut être confiée à l'IA.</li>
          <li><strong>Critère d'arrêt</strong>&nbsp;: la situation qui vous ferait arrêter l'essai ou revenir en arrière.</li>
          <li><strong>Finalité</strong>&nbsp;: l'objectif pour lequel une information est utilisée (ici, rédiger la proposition d'embauche).</li>
          <li><strong>Pseudonymisation</strong>&nbsp;: remplacer une information qui identifie quelqu'un par un code. Le tableau qui permet de retrouver l'information d'origine s'appelle la clé de correspondance.</li>
        </ul>
      </>
    ) },
  ],
  exercises: [
    {
      eyebrow: "Exercice 1",
      title: "Mise en place d'une stratégie d'implémentation d'Intelligence Artificielle (IA) Générative",
      context: [
        { variant: "case", body: (
          <>
            <p>Léa travaille comme assistante RH et administrative dans un cabinet de recrutement indépendant, qui accompagne des PME dans leurs recrutements sur des métiers techniques et commerciaux. L'activité repose sur une équipe réduite de consultants, chacun suivant plusieurs mandats de recrutement en parallèle.</p>
            <p>Léa s'occupe de nombreuses tâches variées : répondre aux e-mails des candidats sur l'avancement de leur candidature, rédiger les fiches de poste à partir des besoins exprimés par les clients recruteurs, résumer les CV reçus en fiches synthétiques normalisées pour les consultants, préparer les comptes-rendus de debriefing après chaque entretien de sourcing, et rédiger une synthèse mensuelle d'activité destinée aux clients recruteurs.</p>
            <p>Avec la multiplication des mandats à suivre et des candidatures à traiter, Léa peine à maintenir la qualité et la régularité de ses livrables.</p>
            <p>La direction envisage d'intégrer certains outils d'IA Générative pour l'aider à optimiser son organisation et améliorer la productivité de l'équipe.</p>
          </>
        ) },
        { variant: "instr", label: "Ce qui est attendu", body: (
          <>
            <p>Vous jouez le rôle de la personne chargée de proposer l'introduction de l'IA générative au poste de Léa. Analysez ses tâches pour décider lesquelles peuvent être confiées à l'IA, à quelles conditions et avec quelles limites. Justifiez chacun de vos choix (tâche retenue, outil, budget). Vous pouvez conclure qu'une tâche ne doit pas être confiée à l'IA&nbsp;: dans ce cas, écrivez-le dans le tableau et expliquez pourquoi.</p>
            <p>Proposez un pilote limité et réversible (voir le vocabulaire ci-dessus).</p>
            <p>Distinguez toujours une hypothèse (ce que vous supposez) d'une mesure (ce qui a été constaté). Le cas ne donne pas de chiffres&nbsp;: vous pouvez poser une hypothèse chiffrée en la présentant clairement comme telle, ou écrire «&nbsp;à mesurer&nbsp;».</p>
            <p>Pour les prix et les conditions d'un outil, appuyez-vous sur le site officiel de l'éditeur. Ne considérez aucune offre gratuite, aucune intégration et aucune règle sur les données comme acquise sans source.</p>
          </>
        ) },
      ],
      questions: [
        {
          num: "1",
          field: { type: "textarea", id: "ex1q1", placeholder: "Votre réponse..." },
          prompt: (
            <>
              <p>Décrivez brièvement la situation&nbsp;: l'entreprise, les personnes concernées (qui utiliserait l'IA, qui serait touché), les objectifs, les contraintes, et la liste des informations qui vous manquent et que vous devriez confirmer auprès de la direction avant de décider.</p>
            </>
          ),
        },
        {
          num: "2",
          field: { type: "table", id: "ex1Body", defaultRows: 4, columns: ["Tâche, fréquence et mesure de départ", "Risques, données et prérequis", "Outil, offre, source et usage", "Pilote, indicateur, contrôle et arrêt", "Budget : période, utilisateurs, hypothèses"] },
          prompt: (
            <>
              <p>À partir du tableau ci-dessous, proposez un plan d'actions pour introduire l'IA générative au poste de Léa. Faites une ligne par tâche analysée (le cas en décrit plusieurs&nbsp;; ajoutez ou supprimez des lignes si besoin). Chaque colonne correspond à ce qui suit&nbsp;:</p>
              <ul>
                <li><strong>Tâche, fréquence et mesure de départ</strong>&nbsp;: la tâche, la fréquence à laquelle elle revient, et sa situation actuelle (temps passé, volume, erreurs ou reprises), ou «&nbsp;à mesurer&nbsp;»</li>
                <li><strong>Risques, données et prérequis</strong>&nbsp;: ce qui peut mal se passer, les données personnelles ou confidentielles concernées, les autorisations à obtenir et ce qui doit être en place avant de commencer</li>
                <li><strong>Outil, offre, source et usage</strong>&nbsp;: l'outil et l'offre envisagés, pourquoi vous les choisissez pour cette tâche (votre justification), les paramétrages à vérifier ou à activer dans l'outil (par exemple les réglages de confidentialité), la source officielle qui vous a permis de tout vérifier, et ce que vous demanderiez exactement à l'IA de faire</li>
                <li><strong>Pilote, indicateur, contrôle et arrêt</strong>&nbsp;: qui participe au pilote et pendant combien de temps, l'indicateur de réussite, la personne qui relit ou valide le travail de l'IA, et le critère d'arrêt</li>
                <li><strong>Budget</strong>&nbsp;: le coût estimé sur une période donnée, le nombre d'utilisateurs, vos hypothèses de calcul et la date à laquelle vous avez vérifié le prix</li>
              </ul>
            </>
          ),
        },
      ],
    },
    {
      eyebrow: "Exercice 2",
      title: "Le respect de la confidentialité dans l'usage de l'intelligence artificielle générative",
      context: [
        { variant: "case", body: (
          <>
            <p>Vous êtes assistant(e) RH dans un cabinet de conseil en ressources humaines, qui accompagne plusieurs entreprises clientes sur leurs recrutements et leurs formalités d'embauche.</p>
            <p>Vous utilisez un outil d'IA générative pour rédiger une base de proposition d'embauche pour un client.</p>
            <p>Le client a communiqué par téléphone et par e-mail les informations relatives au poste, et l'IA est utilisée pour créer le document de base à lui soumettre pour validation.</p>
            <p>Le prompt initial inclut des informations personnelles et des informations professionnelles à protéger. Toutes ne relèvent pas de la catégorie juridique des données sensibles, mais leur nécessité, leur confidentialité et l'autorisation de traitement doivent être analysées.</p>
          </>
        ) },
        { variant: "prompt", label: "Le prompt à corriger", body: (
          <>
            <p>« Rédige une proposition d'embauche pour Monsieur Karim Ndiaye, futur assistant comptable, chez la société Vertoline Agencement (SIRET 987 654 321 00019), située au 8 rue des Tisserands, 44000 Nantes, pour un salaire annuel brut de 34 000 euros à compter du 1er novembre. »</p>
          </>
        ) },
        { variant: "instr", label: "Ce qui est attendu", body: (
          <>
            <p>Le prompt ci-dessus envoie à l'outil plus d'informations qu'il n'en faut. Vous devez repérer lesquelles sont réellement nécessaires pour rédiger la proposition d'embauche et lesquelles ne le sont pas. Corrigez aussi la manière dont l'information circule, et pas seulement les noms visibles dans la phrase&nbsp;: l'environnement dans lequel vous utilisez l'outil (l'outil et le compte que votre employeur autorise pour ce type d'informations), les accès, la durée de conservation des échanges et la relecture par une personne avant l'envoi au client.</p>
            <p>Pour chaque information, choisissez un traitement&nbsp;: la supprimer, la remplacer par une donnée fictive, la généraliser (la remplacer par une information moins précise) ou la pseudonymiser. Si vous utilisez des codes, la clé de correspondance reste en dehors de l'outil. Aucune mesure ne garantit une confidentialité absolue&nbsp;: ne la promettez pas.</p>
          </>
        ) },
      ],
      questions: [
        {
          num: "1",
          field: { type: "table", id: "ex2Body", defaultRows: 3, columns: ["Risques", "Solutions"] },
          prompt: (
            <>
              <p>Complétez le tableau (ajoutez des lignes si besoin). Dans la colonne «&nbsp;Risques&nbsp;», pour chaque information ou point de la chaîne concerné, indiquez de quel type d'information il s'agit, si elle est nécessaire à la finalité, le risque qu'elle crée et sa cause. Dans la colonne «&nbsp;Solutions&nbsp;», indiquez le traitement choisi et les mesures qui réduisent le risque&nbsp;; une mesure doit être vérifiable et adaptée à la finalité.</p>
            </>
          ),
        },
        {
          num: "2",
          field: { type: "textarea", id: "ex2q2", placeholder: "Votre prompt corrigé..." },
          prompt: (
            <>
              <p>Rédigez la version corrigée du prompt, sous forme de modèle réutilisable. La structure complète d'un prompt est enseignée dans le module suivant&nbsp;: ici, écrivez-le avec vos propres mots, comme une demande claire adressée à un collègue. La version corrigée ne contient que des données fictives ou des champs génériques à remplir&nbsp;; elle doit interdire à l'IA d'inventer des faits ou des clauses, laisser visibles les champs que vous complétez vous-même en dehors de l'outil, et préciser les contrôles à faire avant d'envoyer le document au client&nbsp;:</p>
            </>
          ),
        },
      ],
    },
  ],
  grading: {
    eyebrow: "Grille de notation",
    title: "Les mêmes règles que l'épreuve de certification",
    body: (
      <>
        <p>Le quiz du module sert à vous entraîner&nbsp;; le passage au module suivant repose sur la remise des deux exercices et sur l'entretien avec le formateur. Votre mission est notée avec les règles de l'épreuve de certification&nbsp;:</p>
        <ul>
          <li>Chaque critère est noté de 0 à 5, de façon indépendante (5&nbsp;: acquis, 0&nbsp;: non acquis, avec quatre niveaux intermédiaires).</li>
          <li>Chaque exercice correspond à une compétence. Elle reçoit une note sur 5 qui résume celle de ses critères et elle est validée à partir de 3,5/5 (soit 70&nbsp;%). Une compétence validée ne compense pas l'autre.</li>
          <li>L'entretien oral est noté sur 20&nbsp;: il faut au moins 10/20. Il peut aussi conforter ou corriger la note de l'écrit&nbsp;: une réponse écrite fragile peut être rattrapée si vous l'expliquez correctement à l'oral.</li>
          <li>La mission est validée si les deux compétences sont validées et si l'entretien atteint 10/20. Sinon, le formateur indique ce qu'il faut reprendre avant le module suivant.</li>
        </ul>
        <h3>Exercice 1 : stratégie d'implémentation de l'IA générative</h3>
        <table>
          <thead>
            <tr>
              <th>Critère</th>
              <th>Ce que le formateur vérifie</th>
              <th className="note">Note</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Tâches à optimiser</td>
              <td>Les tâches retenues sont pertinentes&nbsp;: elles sont décrites avec leur fréquence et une mesure de départ, et vous distinguez celles qui peuvent être confiées à l'IA de celles qui ne le doivent pas (question&nbsp;1 et deux premières colonnes du tableau).</td>
              <td className="note">/ 5</td>
            </tr>
            <tr>
              <td>Outils et paramétrages</td>
              <td>Le choix de l'outil est pertinent et cohérent avec la tâche et le type de contenu à créer ou à optimiser. Vous précisez l'offre, les paramétrages à vérifier ou à activer (par exemple les réglages de confidentialité), la source officielle consultée et ce que vous demandez exactement à l'IA (colonne «&nbsp;Outil, offre, source et usage&nbsp;»).</td>
              <td className="note">/ 5</td>
            </tr>
            <tr>
              <td>Justification et budget</td>
              <td>Chaque choix est justifié (pourquoi cet outil, pourquoi cette tâche, quelle alternative écartée). Le budget est indiqué pour chaque outil avec sa période, le nombre d'utilisateurs, vos hypothèses et la date de vérification du prix. Le pilote, l'indicateur de réussite, la validation humaine et le critère d'arrêt montrent que la décision peut être vérifiée.</td>
              <td className="note">/ 5</td>
            </tr>
            <tr className="total">
              <td colSpan={2}><strong>Note de la compétence «&nbsp;stratégie d'implémentation&nbsp;»</strong>&nbsp;: validée à partir de 3,5 sur 5</td>
              <td className="note"><strong>/ 5</strong></td>
            </tr>
          </tbody>
        </table>
        <p>Les éléments de pilote, de preuve et de contrôle demandés dans le tableau ne forment pas un critère à part&nbsp;: ils servent à justifier vos choix.</p>
        <h3>Exercice 2 : confidentialité des données</h3>
        <table>
          <thead>
            <tr>
              <th>Critère</th>
              <th>Ce que le formateur vérifie</th>
              <th className="note">Note</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Prompt corrigé sans risque</td>
              <td>La version corrigée du prompt (question&nbsp;2) ne contient plus aucune donnée sensible ou identifiante (données fictives ou champs génériques), applique l'anonymisation ou la pseudonymisation et respecte les politiques de sécurité internes. Elle interdit à l'IA d'inventer, laisse visibles les champs que vous complétez hors de l'outil et prévoit les contrôles avant l'envoi au client.</td>
              <td className="note">/ 5</td>
            </tr>
            <tr>
              <td>Justifications argumentées</td>
              <td>Dans le tableau de la question&nbsp;1, chaque risque est identifié précisément (type d'information concernée, point de la chaîne) et chaque solution est justifiée&nbsp;: vous expliquez pourquoi elle supprime ou réduit le risque.</td>
              <td className="note">/ 5</td>
            </tr>
            <tr className="total">
              <td colSpan={2}><strong>Note de la compétence «&nbsp;confidentialité des données&nbsp;»</strong>&nbsp;: validée à partir de 3,5 sur 5</td>
              <td className="note"><strong>/ 5</strong></td>
            </tr>
          </tbody>
        </table>
        <p>Le prompt corrigé et les justifications sont évalués séparément&nbsp;: l'un ne remplace pas l'autre.</p>
        <h3>Entretien d'évaluation d'une heure</h3>
        <table>
          <thead>
            <tr>
              <th>Évaluation</th>
              <th>Ce que le formateur observe</th>
              <th className="note">Note</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Entretien oral</td>
              <td>Vous justifiez vos choix et vous argumentez à partir du cas, sans réciter votre copie&nbsp;; vous défendez les alternatives écartées et les compromis&nbsp;; vous réagissez à une nouvelle contrainte ou à une erreur que le formateur vous montre.</td>
              <td className="note">/ 20<br />seuil&nbsp;: 10</td>
            </tr>
          </tbody>
        </table>
        <p>Déroulé indicatif des 60 minutes&nbsp;: 15 minutes de présentation, 25 minutes de correction commentée, 15 minutes de mise en situation orale et 5 minutes de synthèse. Le formateur confirme la validation ou indique les éléments à reprendre.</p>
      </>
    ),
  },
  footnote: "Toutes les entreprises, personnes et données chiffrées de cet exercice sont fictives.",
};
