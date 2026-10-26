// Mission de fin de module (Module 3) — « Mission IA : conformité et accessibilité ».
// Contenu repris à l'identique de la mission HTML d'origine du formateur ;
// les identifiants de champs sont ceux de l'ancienne page (brouillons et
// missions déjà enregistrés relus sans migration, cf. lib/missionAnswers.ts).
import type { MissionDefinition } from "./types";

export const conformiteAccessibilite: MissionDefinition = {
  key: "conformite-accessibilite",
  title: "Mission IA : conformité et accessibilité",
  summary: "Exercice 1 : Produire un contenu inclusif et accessible · Exercice 2 : Corriger un contenu généré par IA : éthique et cadre réglementaire",
  intro: (
    <>
      <p>Cette mission de fin de module évalue deux compétences&nbsp;: produire un contenu rédactionnel adapté à un besoin cognitif, puis analyser un contenu généré par IA présentant des problèmes éthiques et réglementaires. Les deux cas ci-dessous sont fictifs.</p>
    </>
  ),
  introBlocks: [
    { variant: "note", label: "Lien avec la certification", body: (
      <>
        <p>Cette mission vous entraîne à deux des six compétences évaluées à l'épreuve de certification&nbsp;:</p>
        <ul>
          <li><strong>Exercice 1</strong>&nbsp;: produire des contenus inclusifs (un prompt qui tient compte du handicap, puis un contenu accessible).</li>
          <li><strong>Exercice 2</strong>&nbsp;: appliquer l'IA Act et le RGPD (identifier les risques, expliquer leurs implications en s'appuyant sur les textes, proposer des solutions conformes).</li>
        </ul>
        <p>À l'épreuve, vous rédigez seul(e), en 10 jours, un dossier de six exercices, puis vous passez un oral d'environ 20 minutes. Chaque compétence est validée séparément (chaque critère est noté de 0 à 5, la compétence est validée à partir de 3,5/5), sans compensation d'une compétence à l'autre, et l'oral doit atteindre 10/20. La grille de notation de cette mission reprend ces mêmes règles (voir «&nbsp;Grille de notation&nbsp;» en bas de page)&nbsp;: le passage au module suivant en dépend.</p>
      </>
    ) },
  ],
  exercises: [
    {
      eyebrow: "Exercice 1",
      title: "Produire un contenu inclusif et accessible",
      context: [
        { variant: "case", body: (
          <>
            <p>Vous êtes Camille, chargé(e) de communication interne chez Kernoa Matériel BTP, un fabricant de matériel de chantier.</p>
            <p>Vous devez adapter la procédure ci-dessous pour un salarié présentant un handicap cognitif, qui rencontre des difficultés avec les phrases longues et les consignes implicites.</p>
          </>
        ) },
        { variant: "prompt", label: "La procédure à adapter", body: (
          <>
            <p>« Toute demande d'accès ponctuel à la zone de maintenance doit être transmise au responsable sécurité au moins 48&nbsp;heures ouvrées avant l'intervention, sauf urgence dûment justifiée, accompagnée du numéro d'habilitation en cours de validité et de la plage horaire souhaitée, étant précisé qu'en l'absence de validation écrite dans l'outil SécuriSite, l'accès est considéré comme refusé. »</p>
          </>
        ) },
        { variant: "case", body: (
          <>
            <p>La version adaptée doit conserver exactement ces sept éléments&nbsp;:</p>
            <ul>
              <li>le destinataire de la demande&nbsp;;</li>
              <li>le délai de 48&nbsp;heures ouvrées&nbsp;;</li>
              <li>l'exception d'urgence justifiée&nbsp;;</li>
              <li>le numéro d'habilitation&nbsp;;</li>
              <li>la plage horaire&nbsp;;</li>
              <li>le mode de validation&nbsp;;</li>
              <li>la conséquence d'une absence de validation.</li>
            </ul>
          </>
        ) },
        { variant: "instr", label: "Votre tâche", body: (
          <>
            <p>À l'aide d'un outil d'IA générative, produisez la version adaptée de cette procédure pour le salarié décrit. Chacune des sept règles doit rester clairement identifiable dans votre version finale. Vous pouvez parler de langage clair ou d'accessibilité cognitive&nbsp;; n'employez le terme FALC (facile à lire et à comprendre) que si des personnes en situation de handicap intellectuel participent réellement à la rédaction et à la relecture. Vous devrez aussi décrire comment vous feriez vérifier et tester votre version avant de la diffuser (question&nbsp;4).</p>
            <p>Préparez-vous aussi à l'oral&nbsp;: à l'épreuve de certification, il faut savoir expliquer comment adapter un contenu aux trois grandes situations de handicap (visuel, auditif et cognitif). Ici, vous traitez le handicap cognitif par écrit&nbsp;; pour les deux autres, réfléchissez à ce que vous changeriez dans ce même contenu et dans votre prompt.</p>
          </>
        ) },
      ],
      questions: [
        {
          num: "1",
          field: { type: "text", id: "ex1_1_outil", placeholder: "Outil choisi..." },
          prompt: (
            <>
              <p>Indiquez l'outil d'IA générative choisi.</p>
            </>
          ),
        },
        {
          num: "2",
          field: { type: "textarea", id: "ex1_2_prompt", placeholder: "Votre prompt complet...", tall: true },
          prompt: (
            <>
              <p>Rédigez le prompt complet&nbsp;: besoin du public visé, règles d'écriture, informations à conserver sans altération, format attendu et consigne de signaler tout point impossible à simplifier sans perte de sens.</p>
            </>
          ),
        },
        {
          num: "3",
          field: { type: "textarea", id: "ex1_3_note", placeholder: "Votre version finale...", tall: true },
          prompt: (
            <>
              <p>Collez ci-dessous la note finale, adaptée et accessible, telle que vous la transmettriez au salarié concerné (après vos corrections éventuelles).</p>
            </>
          ),
        },
        {
          num: "4",
          field: { type: "textarea", id: "ex1_4_verification", placeholder: "Méthode de vérification et de test...", tall: true },
          prompt: (
            <>
              <p>Décrivez comment vous feriez vérifier et tester cette note avant de la diffuser&nbsp;: qui la relit, avec quelles questions ou quel test, et comment vous contrôlez que les sept règles obligatoires sont toujours présentes. Précisez aussi si votre démarche relève du langage clair ou du FALC, et pourquoi.</p>
            </>
          ),
        },
      ],
    },
    {
      eyebrow: "Exercice 2",
      title: "Corriger un contenu généré par IA : éthique et cadre réglementaire",
      context: [
        { variant: "case", body: (
          <>
            <p>Vous êtes chargé(e) de contenu digital chez Elyandre Sport, une marque de vêtements de sport vendue en ligne. Pour lancer une nouvelle gamme de leggings sculptants, un collègue a utilisé un outil d'IA générative pour produire directement le descriptif produit, publié sans relecture&nbsp;:</p>
          </>
        ) },
        { variant: "prompt", label: "Le descriptif publié", body: (
          <>
            <p>« Enfin un legging qui vous permettra de ne plus jamais avoir honte de votre silhouette. Retrouvez la ligne fine et disciplinée que vous méritez, sans jamais renoncer à vos objectifs. Comme le confirme Sophie Ardant, cliente fidèle de la marque&nbsp;: “Avec ce legging, j'ai enfin arrêté de me cacher.” »</p>
          </>
        ) },
        { variant: "case", body: (
          <>
            <p>Sophie Ardant est une cliente réelle de la marque. Ni la citation ni la mise en avant de son nom n'ont été validées par elle&nbsp;: l'outil les a générées à partir de son avis public sur un précédent produit, sans l'en informer ni obtenir son accord. Le descriptif ne comporte par ailleurs aucune mention indiquant qu'il a été généré par une IA.</p>
            <p>La fiche produit validée contient uniquement les informations suivantes&nbsp;: taille haute, ceinture plate, maille opaque, poche latérale, maintien léger, tailles du XS au XXL, coloris noir ou bleu nuit, lavage à 30&nbsp;°C. Aucune promesse d'amincissement, donnée de performance ou allégation médicale n'a été validée.</p>
          </>
        ) },
        { variant: "instr", label: "Votre tâche", body: (
          <>
            Analysez ce descriptif en traitant à la fois l'éthique et la réglementation. Une simple objection éthique ne suffit pas&nbsp;: examinez le RGPD pour la réutilisation des données d'une personne réelle, la loyauté du message commercial et le champ précis des obligations de transparence de l'article&nbsp;50 de l'IA Act. Ne supposez pas qu'une mention «&nbsp;généré par IA&nbsp;» est juridiquement obligatoire pour tout texte commercial&nbsp;: concluez à partir des conditions du texte. Dans votre réponse à la question&nbsp;1, citez au moins une source officielle, avec son lien, sa date de consultation et la règle qu'elle vous permet de vérifier.
          </>
        ) },
      ],
      questions: [
        {
          num: "1",
          field: { type: "textarea", id: "ex2_1_problemes", placeholder: "Problèmes identifiés et justification...", tall: true },
          prompt: (
            <>
              <p>Identifiez les problèmes posés par ce descriptif, sur le plan éthique et sur le plan réglementaire, et justifiez chacun. Citez dans cette réponse au moins une source officielle (lien, date de consultation et règle vérifiée).</p>
            </>
          ),
        },
        {
          num: "2",
          field: { type: "textarea", id: "ex2_2_corrections", placeholder: "Corrections proposées...", tall: true },
          prompt: (
            <>
              <p>Proposez les corrections à apporter. Pour chacune, expliquez quel problème précis elle corrige.</p>
            </>
          ),
        },
        {
          num: "3",
          field: { type: "textarea", id: "ex2_3_prompt", placeholder: "Votre prompt correctif...", tall: true },
          prompt: (
            <>
              <p>Rédigez le prompt correctif que vous enverriez à l'outil pour regénérer le descriptif sans ces problèmes. Il doit préciser&nbsp;: les informations que l'outil a le droit d'utiliser, ce qui est exclu, le ton, le format, l'interdiction d'inventer et les contrôles à faire avant publication.</p>
            </>
          ),
        },
        {
          num: "4",
          field: { type: "textarea", id: "ex2_4_descriptif", placeholder: "Votre descriptif corrigé...", tall: true },
          prompt: (
            <>
              <p>Rédigez le descriptif corrigé, complet et prêt à être republié, en vous limitant aux caractéristiques validées de la fiche produit.</p>
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
        <h3>Exercice 1 : produire un contenu inclusif et accessible</h3>
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
              <td>Prompt qui tient compte du handicap</td>
              <td>Le prompt (question&nbsp;2) respecte le contexte de l'exercice et prend en compte les besoins de la personne visée&nbsp;: besoin du public décrit, règles d'écriture explicites, informations à conserver sans altération, format attendu et consigne de signaler tout point impossible à simplifier sans perte de sens.</td>
              <td className="note">/ 5</td>
            </tr>
            <tr>
              <td>Contenu accessible et inclusif</td>
              <td>La note finale (question&nbsp;3) respecte les bonnes pratiques d'accessibilité et les besoins de la personne&nbsp;: consignes courtes et explicites, ordre logique, vocabulaire courant, une action principale par étape, aucune information inventée. Les sept éléments obligatoires sont conservés sans ambiguïté (destinataire, délai, urgence justifiée, habilitation, plage horaire, validation écrite dans SécuriSite, refus en son absence). La méthode de vérification et de test (question&nbsp;4), avec la distinction entre langage clair et FALC, appuie ce critère.</td>
              <td className="note">/ 5</td>
            </tr>
            <tr>
              <td>Moyens d'accessibilité (à l'oral)</td>
              <td>À l'entretien, vous argumentez et développez les moyens d'accessibilité pour les trois types de handicap&nbsp;: visuel, auditif et cognitif.</td>
              <td className="note">/ 5</td>
            </tr>
            <tr className="total">
              <td colSpan={2}><strong>Note de la compétence «&nbsp;contenus inclusifs&nbsp;»</strong>&nbsp;: validée à partir de 3,5 sur 5</td>
              <td className="note"><strong>/ 5</strong></td>
            </tr>
          </tbody>
        </table>
        <p>Ce critère oral est noté de 0 à 5 comme les deux autres&nbsp;: préparez-le avec la consigne de l'encadré «&nbsp;Votre tâche&nbsp;» de l'exercice&nbsp;1.</p>
        <h3>Exercice 2 : éthique et cadre réglementaire</h3>
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
              <td>Risques et problèmes identifiés</td>
              <td>Les problèmes éthiques et réglementaires du descriptif sont identifiés précisément (question&nbsp;1)&nbsp;: culpabilisation liée au corps, stéréotypes, pression commerciale, fausse citation, atteinte à la confiance&nbsp;; données personnelles, exactitude, licéité, pratique commerciale trompeuse.</td>
              <td className="note">/ 5</td>
            </tr>
            <tr>
              <td>Implications appuyées sur le RGPD et l'IA Act</td>
              <td>Vous expliquez comment chaque problème peut affecter l'entreprise ou les personnes concernées, en vous appuyant sur les textes&nbsp;: transparence au sens du RGPD, portée réelle de l'article&nbsp;50 de l'IA Act, avec au moins une source officielle citée (lien, date de consultation, règle vérifiée) et la différence entre une bonne pratique et une obligation légale.</td>
              <td className="note">/ 5</td>
            </tr>
            <tr>
              <td>Solutions conformes</td>
              <td>Les corrections (question&nbsp;2), le prompt correctif (question&nbsp;3) et le descriptif corrigé (question&nbsp;4) sont pertinents et respectent le cadre légal&nbsp;: chaque correction est reliée au problème qu'elle traite, le prompt précise la source de vérité, les exclusions, le ton, le format, l'interdiction d'inventer et les contrôles avant publication, et le descriptif est loyal, inclusif, factuel et limité aux caractéristiques validées.</td>
              <td className="note">/ 5</td>
            </tr>
            <tr className="total">
              <td colSpan={2}><strong>Note de la compétence «&nbsp;IA Act et RGPD&nbsp;»</strong>&nbsp;: validée à partir de 3,5 sur 5</td>
              <td className="note"><strong>/ 5</strong></td>
            </tr>
          </tbody>
        </table>
        <p>Une objection éthique seule ne répond pas au deuxième critère&nbsp;: vos explications doivent s'appuyer sur le RGPD et l'IA Act.</p>
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
              <td>Vous justifiez vos choix et vous argumentez à partir du cas, sans réciter votre copie&nbsp;; vous défendez les alternatives écartées et les compromis&nbsp;; vous réagissez à une nouvelle contrainte ou à une erreur que le formateur vous montre. Pour l'exercice&nbsp;1, vous développez aussi les moyens d'accessibilité pour les trois types de handicap (noté dans le critère oral ci-dessus).</td>
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
