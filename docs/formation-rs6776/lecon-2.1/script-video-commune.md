# Leçon 2.1 — Les bases du prompt engineering
## Vidéo commune (onglet « Vidéo »)

- **Statut : à valider**
- Module 2 · Leçon 2.1 · Compétence C2 · prépare l'exercice 2 de l'écrit (critère Cr2.1 : structure Rôle, Cible, Objectif, Contexte, Format)
- Présentateur : Raul, Formateur IA · vouvoiement · 16:9
- Durée estimée : 5 min 19 s (environ 798 mots à 150 mots par minute) ; voix off HeyGen générée : 4 min 27 s, dont 57.9 s d'avatar visible
- Sources : `Cours_Lecon_2.1_RS6776.html` (Drive, dossier Lecon_2.1, copié dans `cours.html`),
  `Prompt_Video_Generique_Lecon2.1.md` (matière première), référentiel RS6776,
  `docs/fonctionnalites-elearning-cpf.txt`
- Ne répète pas la vidéo personnalisée et n'est pas répétée par elle (voir bible, chapitre 1).

Le texte entre guillemets est la voix off, à dire mot pour mot. Les indications
d'habillage sont pour Remotion.

---

### Scène 1 — Du plan à la consigne (bloc A) · avatar plein cadre

Bandeau « Raul, Formateur IA » pendant les 5 premières secondes.

« Bonjour, et bienvenue dans le module deux. Dans le premier module, vous avez
construit votre plan d'actions : les tâches à confier à l'IA, les outils retenus et
les règles de confidentialité, puis vous les avez assemblés dans la mission. Il reste
une question décisive : comment formuler la demande, pour obtenir ce que vous
attendez vraiment ? »

### Scène 2 — L'objectif de la leçon (bloc B) · avatar absent

Une carte « Prompt engineering » se pose, puis quatre mots apparaissent dessous au mot
qui les nomme : « Besoin », « Données utiles », « Contraintes », « Critères de contrôle ».
En bas, au dégradé iris : « Écrit · exercice 2 · structure en cinq éléments ».

« Formuler une demande s'apprend. C'est le prompt engineering : expliciter le besoin,
les données utiles, les contraintes et les critères de contrôle. Ce n'est pas réservé
aux profils techniques, c'est une méthode reproductible. Une bonne structure réduit les ambiguïtés et les reprises inutiles. Dans cette leçon, vous allez
apprendre une structure en cinq éléments. C'est celle que vous appliquerez au deuxième
exercice de l'écrit, où vos prompts seront évalués. »

### Scène 3 — Un prompt vague, trois résultats (bloc C) · avatar absent

En haut, le prompt « Écris un message pour informer l'équipe du changement. » Trois
encadrés apparaissent l'un après l'autre, chacun avec son étiquette : « Changement
d'horaires · formel · long », « Nouvel outil · informel · court », « Réorganisation ·
très officiel ». Mention discrète : « Exemples du cours ».

« Prenons un prompt volontairement incomplet : écris un message pour informer l'équipe
du changement. Aucun destinataire, aucune circonstance, aucun format. Le même prompt
peut alors donner un mail long et formel sur un changement d'horaires, un message court
et détendu sur un nouvel outil, ou une note très officielle sur une réorganisation. Aucune de ces versions n'est
objectivement meilleure : rien, dans la demande, ne permettait de trancher. Le
modèle ne devine pas votre intention : il comble les vides avec les choix les plus
probables, pas avec votre contexte réel. »

### Scène 4 — Cinq questions distinctes (bloc C) · avatar absent

Cinq encadrés identiques apparaissent un par un, au mot qui les nomme, chacun avec sa
question dessous : « Rôle · quelle posture ? », « Cible · pour qui ? », « Objectif · pour
accomplir quoi ? », « Contexte · avec quelles informations ? », « Format · sous quelle
forme ? ».

« La structure répond à cinq questions. Le rôle : quelle posture l'IA doit-elle adopter ?
Il oriente le vocabulaire et les angles, mais ne lui donne aucune qualification réelle :
agis comme un juriste ne produit jamais un avis juridique validé. La cible : à qui
s'adresse le résultat ? C'est l'élément le plus souvent oublié, parce qu'il vous semble
évident. Le préciser ajuste le vocabulaire, la longueur et le niveau de détail. L'objectif :
que doit accomplir le résultat, de façon vérifiable ? Le contexte : quelles informations
changent la réponse ? Pas tout ce que vous savez, seulement ce qui compte. Et le format :
structure, longueur, registre, éléments à inclure ou à exclure. C'est souvent le plus
rentable à préciser, car un format oublié oblige presque toujours à reprendre la mise en
forme. »

### Scène 5 — Le même besoin, reconstruit (bloc C) · avatar absent

En haut, barré légèrement : « Rédige quelque chose sur les réflexes de cybersécurité pour
les nouveaux employés. » Puis le prompt se reconstruit ligne par ligne, chaque ligne
précédée de son étiquette, au mot qui la nomme : « Rôle · formateur en sécurité
informatique », « Cible · nouveaux employés jamais formés », « Objectif · cinq réflexes
dès le premier jour », « Contexte · tentative de phishing récente », « Format · liste à
puces, ton rassurant ».

« Voyez la différence. Rédige quelque chose sur les réflexes de cybersécurité : le résultat
sera correct, mais trop générique. Reconstruit, ce besoin devient : tu es un formateur en
sécurité informatique. Ce message s'adresse à de nouveaux employés jamais formés. Rédige
cinq réflexes à adopter dès leur premier jour. L'entreprise vient de subir une tentative
de phishing. Présente une liste à puces, une phrase par réflexe, sur un ton rassurant et non technique. Cinq décisions explicites, et un brouillon bien plus facile à évaluer. »

### Scène 6 — Cible et objectif, deux décisions (bloc C) · avatar absent

Deux colonnes. À gauche, en alerte : « Tâche formulée en creux · aide-moi à rédiger
quelque chose ». À droite, en succès, deux cartes séparées : « Cible · pour qui » et
« Objectif · pour accomplir quoi ». En bas : « Une tâche qui revient · un prompt type,
seul le contexte change ».

« Un piège fréquent, que l'on retrouve dans certaines méthodes plus courtes : fusionner la cible et l'objectif dans une seule tâche, du type aide-moi
à rédiger quelque chose. Le modèle doit alors deviner deux choses au lieu d'une. Gardez-les
séparées, même en une phrase courte chacune. Et quand une tâche revient souvent, fixez un
prompt type : seul le contexte changera d'une fois à l'autre. Un test simple avant d'envoyer : un collègue sans aucun contexte pourrait-il suivre votre prompt à la lettre ? S'il serait perdu, le modèle le sera aussi. »

### Scène 7 — Adapté, conforme, puis vérifié (bloc C) · avatar absent

Deux encadrés côte à côte, au mot qui les nomme : « Adapté · le fond répond-il à la cible
et au contexte ? », « Conforme · la forme est-elle celle demandée ? ». Puis une bande en
alerte : « Second contrôle · faits, chiffres, dates, omissions, biais, confidentialité,
droits ».

« Une bonne structure augmente les chances d'un bon brouillon, sans garantir le premier
essai. Après génération, faites deux vérifications. Adapté : le fond correspond-il à la
cible et au contexte ? Conforme : la forme est-elle bien celle demandée ? L'un ne garantit pas l'autre. Puis un second
contrôle, indépendant : faits, chiffres, dates, omissions, biais et confidentialité. Un
texte peut respecter le format, et rester faux. Lorsque l'enjeu est important, notez la
correction que vous avez apportée. »

### Scène 8 — Les repères des Exercices prompts (bloc D) · avatar absent

Une interface stylisée « Exercices prompts » avec une note « /20 ». Six pastilles s'allument
une à une : « Rôle », « Contexte », « Tâche », « Format », « Ton & public », « Contraintes ».
Des liens se tracent vers les cinq éléments : « Tâche → Objectif », « Ton & public → Cible »,
« Contraintes → Format ».

« Sur la plateforme, l'atelier Exercices prompts note votre prompt sur vingt et vous montre
quoi corriger. Pendant que vous écrivez, six repères s'allument : rôle, contexte, tâche,
format, ton et public, contraintes. Ce sont les mêmes décisions, découpées autrement. La
tâche correspond à votre objectif. Ton et public reprend la cible. Les contraintes
complètent le format. Un repère allumé signale un mot-clé, pas une décision prise : à
l'écrit, c'est la structure en cinq éléments qui compte. »

### Scène 9 — À vous (bloc D) · avatar en médaillon

Liste de deux étapes, cochées au fur et à mesure : « 1 · Playground : repérer,
reconstruire, vérifier », « 2 · Exercices prompts : faire noter, améliorer ». Petite
mention : « Correction des Exercices · hors budget IA ».

« À vous. Ouvrez l'onglet Playground : vous y repérerez les éléments d'un prompt, vous en
reconstruirez un, et vous vérifierez un résultat. Ensuite, dans Exercices prompts, créez un
nouveau test, écrivez un prompt avec les cinq éléments et faites-le noter. Améliorez-le
jusqu'à une note qui vous satisfait. Cette correction ne consomme pas votre budget IA. »

### Scène 10 — Clôture (bloc E) · avatar plein cadre

Récapitulatif affiché à droite, trois lignes l'une après l'autre : « Un prompt vague, un
résultat imprévisible », « Rôle, Cible, Objectif, Contexte, Format », « Adapté, conforme,
puis vérifié ».

« Retenez trois choses. Un prompt vague laisse le modèle deviner. Cinq éléments fixent vos
choix avant la génération : rôle, cible, objectif, contexte, format. Et un résultat se
vérifie toujours, même bien cadré. Validez maintenant le quiz. Dans la prochaine leçon,
on passe aux tâches complexes : découper, corriger et calibrer quand un seul prompt ne
suffit plus. »

---

## Points de contrôle

- Pont entrant : le plan d'actions de la leçon 1.6 (tâches, outils, règles) et la mission du module 1 · pont sortant : leçon 2.2, tâches complexes. ✔
- Exercice 2 de l'écrit cité (scène 2) ; structure Rôle, Cible, Objectif, Contexte, Format (Cr2.1). ✔
- Lien sans contradiction avec les six repères des Exercices prompts (scène 8) : Tâche = Objectif,
  Ton & public = Cible, Contraintes = part du Format ; les repères détectent des mots-clés (documentation plateforme). ✔
- Exemples tirés du cours : message « changement » et ses trois interprétations, prompt cybersécurité. ✔
- Plateforme : Playground, Exercices prompts (note sur 20, « Nouveau test », correction hors budget), quiz. ✔
- Aucun outil comparé dans cette leçon : pas de fiches outils. Aucun chiffre hors cours. ✔
