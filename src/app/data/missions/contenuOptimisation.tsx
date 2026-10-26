// Mission de fin de module (Module 2) — « Mission IA : contenu et optimisation ».
// Contenu repris à l'identique de la mission HTML d'origine du formateur ;
// les identifiants de champs sont ceux de l'ancienne page (brouillons et
// missions déjà enregistrés relus sans migration, cf. lib/missionAnswers.ts).
import type { MissionDefinition } from "./types";

export const contenuOptimisation: MissionDefinition = {
  key: "contenu-optimisation",
  title: "Mission IA : contenu et optimisation",
  summary: "Exercice 1 : Les techniques de Prompt Engineering pour la génération de contenus · Exercice 2 : Les techniques d'optimisation des contenus générés par l'intelligence artificielle générative",
  intro: (
    <>
      <p>Cette mission de fin de module évalue votre capacité à produire un contenu rédactionnel et visuel à partir d'un brief (la demande de départ), puis à corriger un contenu sans perdre son sens. Les deux cas ci-dessous sont fictifs : les résultats doivent être vérifiables, documentés et prêts à être défendus à l'oral.</p>
    </>
  ),
  introBlocks: [
    { variant: "note", label: "Lien avec la certification", body: (
      <>
        <p>Cette mission vous entraîne à deux des six compétences évaluées à l'épreuve de certification&nbsp;:</p>
        <ul>
          <li><strong>Exercice 1</strong>&nbsp;: rédiger un prompt optimal (un prompt structuré en cinq éléments, adapté au contenu demandé, qui donne un résultat conforme), pour une structure d'article puis pour un visuel.</li>
          <li><strong>Exercice 2</strong>&nbsp;: optimiser un contenu généré (un prompt d'optimisation complet, puis un contenu optimisé conforme aux contraintes).</li>
        </ul>
        <p>À l'épreuve, vous rédigez seul(e), en 10 jours, un dossier de six exercices, puis vous passez un oral d'environ 20 minutes. Chaque compétence est validée séparément (chaque critère est noté de 0 à 5, la compétence est validée à partir de 3,5/5), sans compensation d'une compétence à l'autre, et l'oral doit atteindre 10/20. La grille de notation de cette mission reprend ces mêmes règles (voir «&nbsp;Grille de notation&nbsp;» en bas de page)&nbsp;: le passage au module suivant en dépend.</p>
      </>
    ) },
    { variant: "note", label: "Les cinq éléments d'un prompt", body: (
      <>
        <ul>
          <li><strong>Rôle</strong>&nbsp;: la fonction que vous donnez à l'outil (par exemple celle d'un spécialiste du sujet traité).</li>
          <li><strong>Cible</strong>&nbsp;: le public à qui le résultat s'adresse.</li>
          <li><strong>Objectif</strong>&nbsp;: ce que le résultat doit permettre d'obtenir.</li>
          <li><strong>Contexte</strong>&nbsp;: la situation, les informations de départ et ce que l'outil a le droit d'utiliser.</li>
          <li><strong>Format</strong>&nbsp;: la forme attendue de la réponse (structure, longueur, présentation).</li>
        </ul>
      </>
    ) },
  ],
  exercises: [
    {
      eyebrow: "Exercice 1",
      title: "Les techniques de Prompt Engineering pour la génération de contenus",
      context: [
        { variant: "case", body: (
          <>
            <p>Vous êtes assistant(e) communication pour Les Ateliers Ferréol, un organisme de formation professionnelle indépendant, dont vous gérez la communication digitale, notamment via un blog sur le site internet de l'organisme.</p>
            <p>Vous devez rédiger un article de blog présentant des conseils pour repérer qu'une équipe a besoin d'être formée aux outils numériques du quotidien, afin d'attirer davantage de visiteurs sur le site et de développer les demandes de devis. Pour accompagner cet article, vous devez également créer un visuel attractif.</p>
            <p>Pour rédiger cet article et créer le visuel, vous vous aidez d'outils d'IA Générative.</p>
          </>
        ) },
        { variant: "instr", label: "Instructions pour l'article", body: (
          <>
            Vous ne demandez pas à l'outil de rédiger l'article&nbsp;: vous lui demandez seulement de vous proposer sa structure complète (le plan de l'article), sans le texte rédigé.
          </>
        ) },
        { variant: "instr", label: "Instructions pour le visuel", body: (
          <>
            Cette fois, vous demandez à l'outil de créer lui-même le visuel, en suivant vos directives.
          </>
        ) },
      ],
      questions: [
        {
          num: "1", part: "I - Rédaction de la structure d'article de blog",
          field: { type: "text", id: "ex1_1_outil", placeholder: "Outil d'IA Générative choisi..." },
          prompt: (
            <>
              <p>Indiquez l'outil d'IA Générative choisi pour la rédaction de la structure d'article de blog :</p>
            </>
          ),
        },
        {
          num: "2", part: "I - Rédaction de la structure d'article de blog",
          field: { type: "textarea", id: "ex1_2_prompt", placeholder: "Votre prompt...", tall: true },
          prompt: (
            <>
              <p>Rédigez le prompt que vous envoyez à l'outil pour obtenir uniquement une structure d'article, pas le texte rédigé. Il comporte les cinq éléments d'un prompt (rôle, cible, objectif, contexte, format) et précise en plus&nbsp;: l'angle, les parties attendues, le ton, l'appel à l'action (ce que le lecteur doit faire à la fin) et les critères de réussite (à quoi on voit que la structure est bonne). Dans le contexte, indiquez les informations que l'outil a le droit d'utiliser. Interdisez les chiffres, études ou témoignages inventés et exigez la mention «&nbsp;source à fournir&nbsp;» pour toute affirmation qui en nécessiterait une.</p>
            </>
          ),
        },
        {
          num: "3", part: "I - Rédaction de la structure d'article de blog",
          field: { type: "textarea", id: "ex1_3_structure", placeholder: "Structure de l'article de blog...", tall: true },
          prompt: (
            <>
              <p>Copiez-collez ci-dessous la structure d'article produite par l'outil&nbsp;:</p>
            </>
          ),
        },
        {
          num: "4", part: "I - Rédaction de la structure d'article de blog",
          field: { type: "textarea", id: "ex1_3b_verification", placeholder: "Critères, écarts, corrections et décision...", tall: true },
          prompt: (
            <>
              <p>Évaluez la structure obtenue en la comparant aux critères de réussite que vous avez fixés dans votre prompt (question&nbsp;2). Notez ce qui manque, les affirmations qui demandent une source, les corrections que vous avez apportées et votre décision finale (structure acceptée, corrigée ou à regénérer)&nbsp;:</p>
            </>
          ),
        },
        {
          num: "1", part: "II - Création du visuel pour illustrer l'article",
          field: { type: "textarea", id: "ex1_4_outilvisuel", placeholder: "Outil, offre, source consultée, droits d'usage et justification..." },
          prompt: (
            <>
              <p>Indiquez l'outil et l'offre (gratuite ou payante) choisis pour créer le visuel, la source où vous avez vérifié ces informations (site officiel de l'éditeur, avec la date de consultation), ce que l'offre autorise à faire des images créées (par exemple, les utiliser commercialement sur un blog) et pourquoi cet outil convient à ce travail&nbsp;:</p>
            </>
          ),
        },
        {
          num: "2", part: "II - Création du visuel pour illustrer l'article",
          field: { type: "textarea", id: "ex1_5_promptvisuel", placeholder: "Votre prompt..." },
          prompt: (
            <>
              <p>Rédigez le prompt que vous envoyez à l'outil pour créer le visuel. Il comporte les cinq éléments d'un prompt (rôle, cible, objectif, contexte, format) et précise en plus&nbsp;: le sujet, la composition, le style, la palette de couleurs, la zone à laisser libre pour le titre et ce que le visuel ne doit pas contenir. Dans un prompt visuel, l'objectif est la finalité du visuel (à quoi il sert) et le format recouvre les dimensions. N'utilisez aucun logo, visage identifiable, donnée réelle ni imitation d'un artiste nommé.</p>
            </>
          ),
        },
        {
          num: "3", part: "II - Création du visuel pour illustrer l'article",
          field: { type: "image", id: "ex1_6_preview", hint: "Le visuel importé s'affiche ci-dessous et apparaîtra dans le PDF que vous exporterez à la fin de la mission." },
          prompt: (
            <>
              <p>Générez au moins trois variantes du visuel et comparez-les. Retenez-en une, retouchez-la si nécessaire, puis importez ci-dessous la version finale (un seul fichier image).</p>
            </>
          ),
        },
        {
          num: "4", part: "II - Création du visuel pour illustrer l'article",
          field: { type: "textarea", id: "ex1_7_dossier", placeholder: "Critères, corrections, texte alternatif et dossier de preuve...", tall: true },
          prompt: (
            <>
              <p>Documentez le choix et la validation du visuel en abordant chacun de ces points&nbsp;:</p>
              <ul>
                <li>les critères avec lesquels vous avez comparé les variantes&nbsp;;</li>
                <li>les défauts repérés dans l'image et les corrections apportées&nbsp;;</li>
                <li>le texte alternatif (une courte description de l'image pour les personnes qui ne peuvent pas la voir)&nbsp;;</li>
                <li>les droits d'utilisation des images de référence que vous avez éventuellement fournies à l'outil (si vous n'en avez fourni aucune, écrivez-le)&nbsp;;</li>
                <li>les informations de provenance de l'image (par exemple, une mention indiquant qu'elle a été générée par IA), contrôlées sur le fichier exporté&nbsp;;</li>
                <li>les fichiers et preuves que vous conservez (prompts, variantes, version finale)&nbsp;;</li>
                <li>la personne qui valide le visuel avant publication.</li>
              </ul>
            </>
          ),
        },
      ],
    },
    {
      eyebrow: "Exercice 2",
      title: "Les techniques d'optimisation des contenus générés par l'intelligence artificielle générative",
      context: [
        { variant: "case", body: (
          <>
            <p>Vous travaillerez à partir de ce texte. Il s'agit d'un extrait de fiche technique sur le thème de la recharge des véhicules électriques en entreprise :</p>
          </>
        ) },
        { variant: "prompt", label: "Le texte technique à optimiser", body: (
          <>
            <p>« La borne peut fournir jusqu'à 22&nbsp;kW en courant alternatif triphasé via un connecteur de Type&nbsp;2. La puissance réellement reçue peut être inférieure : elle dépend notamment de la capacité du chargeur embarqué du véhicule et de la configuration de l'installation. La borne communique avec le système de supervision au moyen du protocole OCPP&nbsp;1.6J. Pour démarrer une session, l'utilisateur s'identifie avec un badge RFID ou l'application mobile. La consommation est facturée au kilowattheure selon le tarif affiché au moment de la recharge. »</p>
          </>
        ) },
        { variant: "case", body: (
          <>
            <p>Ce texte constitue la source technique validée&nbsp;: tout ce qu'il dit est exact et vous ne devez rien y ajouter. Réécrivez-le pour des salariés novices en respectant ces critères&nbsp;:</p>
            <ul>
              <li>110 mots maximum&nbsp;;</li>
              <li>un titre, puis quatre étapes numérotées qui répondent à «&nbsp;brancher&nbsp;», «&nbsp;s'identifier&nbsp;», «&nbsp;comprendre la puissance&nbsp;» et «&nbsp;vérifier le prix&nbsp;»&nbsp;;</li>
              <li>le terme «&nbsp;22&nbsp;kW&nbsp;» défini en langage courant&nbsp;;</li>
              <li>les limites importantes du texte conservées&nbsp;;</li>
              <li>aucune durée de recharge ajoutée&nbsp;;</li>
              <li>la mention «&nbsp;à confirmer&nbsp;» à la place de toute information nécessaire qui manque.</li>
            </ul>
          </>
        ) },
      ],
      questions: [
        {
          num: "1", part: "Votre travail avec l'outil d'IA générative",
          field: { type: "text", id: "ex2_1_outil", placeholder: "Outil d'IA Générative choisi..." },
          prompt: (
            <>
              <p>Indiquez l'outil d'IA générative choisi pour l'exercice :</p>
            </>
          ),
        },
        {
          num: "2", part: "Votre travail avec l'outil d'IA générative",
          field: { type: "textarea", id: "ex2_2_prompt", placeholder: "Votre prompt d'optimisation...", tall: true },
          prompt: (
            <>
              <p>Rédigez le prompt que vous envoyez à l'outil pour optimiser le texte. Il comporte les cinq éléments d'un prompt (rôle, cible, objectif, contexte, format) et précise en plus&nbsp;: la source de référence (le texte technique ci-dessus, présenté comme exact), ce qui doit être conservé, ce qui doit changer, les critères d'acceptation (la liste ci-dessus) et la demande d'un relevé de toutes les modifications effectuées.</p>
            </>
          ),
        },
        {
          num: "3", part: "Votre travail avec l'outil d'IA générative",
          field: { type: "textarea", id: "ex2_3_resultat", placeholder: "Contenu optimisé...", tall: true },
          prompt: (
            <>
              <p>Proposez le contenu optimisé obtenu (copiez-collez ci-dessous) :</p>
            </>
          ),
        },
        {
          num: "4", part: "Votre travail avec l'outil d'IA générative",
          field: { type: "textarea", id: "ex2_4_verification", placeholder: "Vérification critère par critère et corrections...", tall: true },
          prompt: (
            <>
              <p>Comparez le texte obtenu à la source et aux critères, puis notez&nbsp;: le nombre de mots, la présence des quatre étapes, les faits conservés, ceux qui ont été omis ou ajoutés, les termes clarifiés, l'accessibilité pour un public novice (phrases courtes, vocabulaire courant, structure claire) et les corrections finales que vous avez faites.</p>
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
        <h3>Exercice 1 : rédiger un prompt optimal (article puis visuel)</h3>
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
              <td>Structure du prompt</td>
              <td>Chaque prompt (partie&nbsp;I question&nbsp;2 et partie&nbsp;II question&nbsp;2) applique les techniques de prompt engineering et contient les cinq éléments&nbsp;: rôle, cible, objectif, contexte et format.</td>
              <td className="note">/ 5</td>
            </tr>
            <tr>
              <td>Contenu du prompt adapté</td>
              <td>Le contenu du prompt est pertinent et adapté à ce que l'énoncé demande à l'outil&nbsp;: une structure d'article sans texte rédigé pour la partie&nbsp;I, un visuel créé par l'outil pour la partie&nbsp;II. Le public, la finalité, l'angle, le ton, les informations autorisées, les critères de réussite et l'interdiction d'inventer sont précisés.</td>
              <td className="note">/ 5</td>
            </tr>
            <tr>
              <td>Résultat conforme</td>
              <td>Les contenus obtenus (structure d'article, visuel) répondent au contexte et à l'objectif de la demande de départ&nbsp;: vous les avez comparés à vos critères de réussite, corrigés si besoin, et vous avez documenté votre décision (variantes comparées, défauts corrigés, texte alternatif, droits d'usage, provenance, personne qui valide).</td>
              <td className="note">/ 5</td>
            </tr>
            <tr className="total">
              <td colSpan={2}><strong>Note de la compétence «&nbsp;prompt optimal&nbsp;»</strong>&nbsp;: validée à partir de 3,5 sur 5</td>
              <td className="note"><strong>/ 5</strong></td>
            </tr>
          </tbody>
        </table>
        <p>Le choix de l'outil et de l'offre (question&nbsp;1 de chaque partie) doit être justifié&nbsp;: il appuie ces critères sans former un critère à part.</p>
        <h3>Exercice 2 : optimiser un contenu généré</h3>
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
              <td>Prompt d'optimisation</td>
              <td>Le prompt d'optimisation (question&nbsp;2) est pertinent et tient compte de tous les critères imposés par l'énoncé&nbsp;: 110 mots maximum, titre et quatre étapes numérotées, terme «&nbsp;22&nbsp;kW&nbsp;» défini, limites conservées, aucune durée ajoutée, mention «&nbsp;à confirmer&nbsp;» pour toute information manquante. Il précise aussi le public, la source de référence, ce qui est conservé ou modifié, le format et la demande d'un relevé des modifications.</td>
              <td className="note">/ 5</td>
            </tr>
            <tr>
              <td>Contenu optimisé conforme</td>
              <td>Le texte final (question&nbsp;3) est satisfaisant au regard de la demande et respecte tous les critères d'amélioration de l'énoncé (longueur, structure, vocabulaire courant adapté à des salariés novices, aucun fait ajouté). Votre comparaison à la source (question&nbsp;4) montre ce qui a été conservé, omis, ajouté ou corrigé.</td>
              <td className="note">/ 5</td>
            </tr>
            <tr className="total">
              <td colSpan={2}><strong>Note de la compétence «&nbsp;optimisation des contenus&nbsp;»</strong>&nbsp;: validée à partir de 3,5 sur 5</td>
              <td className="note"><strong>/ 5</strong></td>
            </tr>
          </tbody>
        </table>
        <p>Le choix de l'outil (question&nbsp;1) doit être justifié&nbsp;: il appuie ces critères sans former un critère à part.</p>
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
