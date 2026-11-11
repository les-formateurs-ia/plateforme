# Bible de la formation RS6776 — vidéos de leçon

> Référence unique pour écrire, produire et contrôler les 26 vidéos de la formation
> « Création de contenus rédactionnels et visuels par l'usage responsable de
> l'intelligence artificielle générative » (certification RS6776, InKréa).
> Tout script doit respecter ce document. En cas de doute : le référentiel RS6776
> fait foi, puis le contenu du cours de la leçon, puis cette bible.

---

## 1. Principes

1. **Deux vidéos par leçon, qui ne se répètent jamais.**
   - Onglet « Vidéo » (commune à tous) : porte les **notions**. Exemples tirés de
     plusieurs métiers (assistanat, marketing/communication, RH, juridique).
   - Onglet « Votre vidéo personnalisée » (une par élève, dans sa copie de
     formation) : **applique** les notions au métier de l'élève et le guide dans
     la pratique. Elle suppose que la vidéo commune a été vue : elle ne
     réexplique aucune définition, elle s'y réfère (« vous l'avez vu dans la
     vidéo de la leçon »).
2. **Rien d'inventé.** Pas de chiffre, de version de modèle, de date, de prix ou
   de fonctionnalité qui ne figure pas dans le cours de la leçon ou dans la
   documentation de la plateforme (`docs/fonctionnalites-elearning-cpf.txt`).
   Pour la vidéo personnalisée, rien sur l'élève au-delà de son profil écrit.
3. **Toujours relier à la certification.** Chaque vidéo dit à quel exercice de
   l'écrit la leçon prépare.
4. **Toujours finir par l'action.** Chaque vidéo renvoie vers une activité précise
   de la plateforme, avec le chemin exact.
5. **Le texte validé est dit mot pour mot.** HeyGen ne produit que l'avatar et la
   voix à partir du texte figé ; l'habillage est fait dans Remotion. Aucune
   reformulation par un outil après validation.

## 2. Ton et langue

- **Vouvoiement** dans toutes les vidéos (le cours écrit vouvoie aussi). L'interface
  de la plateforme tutoie : on ne cite donc jamais une phrase de l'interface, seulement
  le nom des éléments (« l'onglet Playground », « le bouton Terminer la leçon »).
- Présentateur : **Raul, Formateur IA**. Voix posée, débit naturel, phrases courtes
  (une idée par phrase, 20 mots max la plupart du temps).
- Voix HeyGen retenue : **Tanguy** (voix française native, « Balanced & Reliable »),
  `voice_id` `341b4807e5e6455fa88f34bda5d6eeea`, langue `fr`. La même pour toutes
  les vidéos, communes et personnalisées.
- Vidéo commune : pédagogique, claire, sans jargon non expliqué. Tout terme
  technique est défini à sa première apparition dans la formation.
- Vidéo personnalisée : pair à pair, directe, jamais descendante.
- Anglicismes : seulement ceux du cours (prompt, token, playground…), toujours
  expliqués la première fois.
- Écrire pour l'oral : pas de parenthèses, pas d'abréviations, nombres en lettres
  quand ils sont courts, sigles épelés une fois (« R-G-P-D » se lit « RGPD »).

## 2 bis. Les cinq outils de référence

Dans toute la formation, on présente et on compare **cinq outils**, toujours dans
cet ordre et sous ces noms : **ChatGPT** (OpenAI), **Claude** (Anthropic),
**Gemini** (Google), **Copilot** (Microsoft), **Firefly** (Adobe).

- Le référentiel RS6776 cite ChatGPT, Gemini, Copilot et Firefly comme exemples
  d'« outils existants » ; Claude s'y ajoute parce qu'il est pratiqué dans la
  plateforme (Studio, Battle Ground) avec ChatGPT et Gemini.
- Chaque outil a une **fiche** identique partout (vidéo, cours, Playground) en quatre
  lignes : Points forts · Usages · Intégration · Accès. Contenu de référence :
  `src/app/playgrounds/rs6776/tools.ts`, d'où l'habillage Remotion reprend aussi ses fiches.
- **Pas de prix dans les vidéos** : on cite les niveaux d'accès (gratuit, abonnement,
  offre entreprise). Les tarifs changent souvent ; le Playground donne, pour
  chaque outil, ses niveaux d'accès et le lien vers la page tarifs officielle
  (modifiable sans refaire de vidéo), avec la consigne de toujours les vérifier. C'est aussi un réflexe attendu à l'exercice 1
  (critère Cr1.3 : budget de chaque outil).
- Une leçon qui compare des outils les compare tous les cinq, ou dit pourquoi elle
  en écarte (par exemple : Firefly hors sujet pour la rédaction).

## 3. Ordre définitif des leçons

Ordre de création dans la plateforme (les leçons ne se réordonnent pas : créer
dans cet ordre). Les dossiers Drive gardent leur ancienne numérotation, d'où la
colonne de correspondance.

| N° | Leçon | Dossier Drive | Compétence | Exercice de l'écrit |
|---|---|---|---|---|
| **Module 1** | **Comprendre, installer et planifier l'IA dans son travail** | | | |
| 1.1 | Comprendre l'IA générative et ses usages | Lecon_1.1 | C1 | E1 |
| 1.2 | Analyser son poste et identifier les tâches automatisables | Lecon_1.2 | C1 | E1 |
| 1.3 | Installer et configurer les outils IA | Lecon_1.4 | C1 | E1 |
| 1.4 | Reconnaître les informations à protéger | Lecon_1.5 | C3 | E3 |
| 1.5 | Sécuriser son usage de l'IA | Lecon_1.6 | C3 | E3 |
| 1.6 | Élaborer son plan d'actions IA | Lecon_1.3 | C1 | E1 |
| M1 | Mission IA : stratégie et confidentialité | Mission_Module1 | C1, C3 | E1, E3 |
| **Module 2** | **Maîtriser le prompt engineering et créer des contenus** | | | |
| 2.1 | Les bases du prompt engineering | Lecon_2.1 | C2 | E2 |
| 2.2 | Prompts avancés : méthode pour les tâches complexes | Lecon_2.2 | C2 | E2 |
| 2.3 | Rédaction assistée par IA | Lecon_2.3 | C2 | E2 |
| 2.4 | Créer des contenus visuels | Lecon_2.4 | C2 | E2 |
| 2.5 | Optimiser les contenus générés | Lecon_2.5 | C5 | E5 |
| M2 | Mission IA : contenu et optimisation | Mission_Module2 | C2, C5 | E2, E5 |
| **Module 3** | **Produire des contenus accessibles et conformes** | | | |
| 3.1 | Produire des contenus inclusifs | Lecon_3.1 | C4 | E4 |
| 3.2 | Cadre légal : IA Act, RGPD et veille | Lecon_3.2 | C6 | E6 |
| M3 | Mission IA : conformité et accessibilité | Mission_Module3 | C4, C6 | E4, E6 |

Pourquoi « Plan d'actions » en 1.6 : le plan exige les outils retenus et leur budget
(1.3) et les règles de confidentialité (1.4, 1.5). C'est aussi l'ordre du programme
V2, et la mission 1 porte sur la stratégie **et** la confidentialité.

Les missions n'ont pas de vidéo dans ce lot (pas d'onglet vidéo sur une leçon
Mission).

## 4. Fil rouge et transitions

Fil rouge de la formation : **« passer du réflexe à la méthode »**. L'élève utilise
peut-être déjà l'IA ; la formation lui donne une méthode qu'il pourra défendre
devant un jury.

Chaque vidéo commune ouvre par le pont entrant et ferme par le pont sortant
ci-dessous (formulation libre, idée imposée).

| Leçon | Pont entrant (reprend…) | Pont sortant (annonce…) |
|---|---|---|
| 1.1 | Accueil dans la formation | Savoir ce que fait l'outil → regarder son propre poste (1.2) |
| 1.2 | Ce que l'outil sait faire | Tâches retenues → avoir les bons outils prêts (1.3) |
| 1.3 | Tâches à optimiser | Outils installés → savoir ce qu'on ne doit jamais y mettre (1.4) |
| 1.4 | Outils prêts à l'emploi | Données repérées → méthodes pour les protéger (1.5) |
| 1.5 | Les catégories de données | Règles posées → tout assembler dans un plan (1.6) |
| 1.6 | Tâches, outils, règles | Plan prêt → mission de fin de module |
| 2.1 | Le plan : les tâches à outiller | Structure de base → tâches complexes (2.2) |
| 2.2 | Les 5 piliers | Méthodes avancées → vrais écrits professionnels (2.3) |
| 2.3 | Les techniques de prompt | Écrire → créer des visuels (2.4) |
| 2.4 | Les contenus écrits | Premier résultat → l'améliorer méthodiquement (2.5) |
| 2.5 | Texte et visuel produits | Méthode d'optimisation → mission de fin de module |
| 3.1 | L'optimisation selon des critères, dont le handicap | Contenus accessibles → contenus conformes (3.2) |
| 3.2 | Les contenus inclusifs | Cadre légal → mission finale puis certification |

## 5. Structure type d'une vidéo

### Vidéo commune (5 à 6 minutes, environ 750 à 900 mots)

| Bloc | Contenu | Avatar |
|---|---|---|
| A. Pont entrant | Rappel de la leçon précédente en une phrase, question d'accroche | Plein cadre |
| B. Objectif | Ce que l'élève saura faire, et l'exercice de l'écrit visé | Plein cadre |
| C. Notions | 3 à 5 scènes, une notion par scène | Absent (écran dédié) |
| D. À vous | Activité du Playground, puis une ou deux fonctionnalités de la plateforme | Médaillon |
| E. Clôture | Récapitulatif en 3 points, quiz à 75 %, pont sortant | Plein cadre |

### Vidéo personnalisée (2 à 3 minutes, environ 300 à 450 mots)

| Bloc | Contenu |
|---|---|
| A. Accroche | Prénom, situation professionnelle réelle, et ce qu'on va faire de la leçon pour elle ou lui |
| B. Application | 2 ou 3 cas tirés de son métier : ce que l'outil fait bien, ce qu'il faut vérifier, ce qui reste hors de son rôle |
| C. Pratique guidée | Ce qu'elle ou il doit faire précisément dans le Playground et sur la plateforme |
| D. Préparation | Ce qu'elle ou il garde pour la mission et l'écrit |

## 6. Fonctionnalités de la plateforme à citer

Règles :
- **Le Playground de la leçon en premier.** C'est le seul temps de pratique compté
  dans le relevé de connexions et l'attestation d'assiduité (le temps passé dans
  les Exercices, le Studio, le Hub et Mon Agent IA n'est pas compté).
- **Le Studio régulièrement** (chats ChatGPT, Claude, Gemini et création d'images) :
  c'est le seul outil ouvert pendant l'épreuve écrite.
- **Doser** vidéo, avatar et doublage du Studio : ils consomment le budget IA
  personnel (50 dollars par défaut). Le chat Gemini, Mon Agent IA, le Copilote et
  la correction des Exercices ne consomment pas de budget.
- **Microsoft Copilot et Adobe Firefly ne sont pas dans la plateforme** : les citer
  comme outils à découvrir sur leur propre site (leçon 1.3).
- Les noms d'éléments sont cités tels qu'ils apparaissent dans l'interface.

| Leçon | À citer en priorité |
|---|---|
| 1.1 | Playground (fiches des cinq outils) ; Studio, onglet Discuter (même question à ChatGPT, Claude, Gemini) ; Battle Ground, gamme Rapide, défi « Piège » ; Hub IA, « Générer du texte » |
| 1.2 | Playground (cartographie des tâches) ; Mon Agent IA, « Comment utiliser l'IA dans mon métier ? » |
| 1.3 | Playground ; Hub IA (fiches, « Essayer dans le studio ») ; Studio (chats) |
| 1.4 | Playground (repérer les données) ; Copilote, « Crash test 2 min » |
| 1.5 | Playground (anonymisation, Ctrl + H) ; Studio Gemini avec un texte anonymisé |
| 1.6 | Playground ; Hub IA (budget et accès des outils) ; Rendez-vous formateur après la mission |
| 2.1 | Exercices prompts (note sur 20) ; repères Rôle, Contexte, Tâche, Format, Ton & public, Contraintes |
| 2.2 | Exercices prompts, « Améliorer ce prompt » ; Battle Ground, gamme Expert |
| 2.3 | Studio ChatGPT puis Gemini sur la même consigne ; Battle Ground, gamme Polyvalent, défi « Rédaction » |
| 2.4 | Studio, « Créer vos images » ; Exercices, « Images & vidéos » ; Rétro-ingénierie |
| 2.5 | Exercices prompts, comparaison des tentatives ; Studio, conversation d'optimisation |
| 3.1 | Studio, « Du texte à l'audio » (version audio d'un texte) ; Studio chats pour un texte alternatif |
| 3.2 | Hub IA, « Rechercher & veiller » ; Mon Agent IA |

## 7. Charte visuelle (Remotion)

La charte unique est celle de la plateforme, déjà codée dans `lesson-videos/src/theme.ts` :
fond encre, constellation de particules, police Funnel Display, dégradé iris
(`#b58de0 → #dbacf0 → #78d5e2 → #6adeb1 → #fbc2ad`) réservé aux moments forts,
couleurs à sens fixe (succès vert, alerte corail, information bleu).

- Format 16:9, 1920 × 1080, 30 images par seconde, MP4 H.264.
- Avatar : **plein cadre** pour les blocs A, B et E ; **absent** pendant les scènes
  de notions ; **médaillon en bas à gauche** (zone `AVATAR_ZONE`) pendant le bloc D.
- Les éléments graphiques apparaissent au mot qui les nomme, jamais d'un bloc.
- Chaque vidéo affiche le chapitre (« Module 1 · Leçon 1.1 ») et une barre de progression.
- Sous-titres français incrustés et activables (accessibilité, compétence C4 :
  la formation doit montrer l'exemple).

## 8. Chaîne de production

1. Script écrit selon cette bible → relu → **validé** (statut en tête du fichier).
2. Voix off : synthèse vocale HeyGen, voix Tanguy, scène par scène, avec
   l'horodatage de chaque mot (sert à caler l'habillage, pas besoin de transcription).
3. Avatar : Raul (look « assis au bureau », moteur Avatar 6) animé **uniquement**
   sur les scènes où il est visible, lèvres synchronisées sur la voix de l'étape 2.
   Coût mesuré : environ 0,10 $ par seconde d'avatar (leçon 1.1 : 12,20 $).
4. Composition Remotion `lesson-videos/src/lessonX_Y/` (commune) et
   `lessonX_Y_<prenom>/` (personnalisée).
5. Contrôle : écoute complète, images de contrôle, comparaison au script.
6. Envoi : vidéo commune dans le champ « Vidéo » du modèle de formation ;
   vidéo personnalisée dans « Vidéo personnalisée » de la copie de l'élève.
   Les copies déjà attribuées ne suivent pas le modèle : les mettre à jour aussi.

## 9. Fiche de révision

Chaque leçon classique a un onglet **« Fiche de révision »** : l'essentiel du cours,
court et interactif, à la place de la lecture du cours complet.

- Contenu type : « L'essentiel en 30 secondes » (3 points), une section par notion,
  les fiches outils quand la leçon en parle (même format qu'au chapitre 2 bis), un
  bloc « Ce que vous en ferez à l'écrit », et « Testez-vous » (questions à révéler,
  non notées, différentes du quiz).
- Variante par profil (même paramètre `profil` que le Playground) : un bloc « Pour
  votre métier » reprenant la vidéo personnalisée.
- **Le cours complet n'est pas supprimé** : il reste sous les onglets, replié par
  défaut quand une fiche existe. Il reste la source des IA de la plateforme
  (podcast, agent vocal, Copilote, Mon Agent IA) et le référentiel de correction des
  Exercices ; il garde aussi une version texte intégrale, utile pour l'accessibilité.
- La fiche ne dit rien que le cours ne dise : elle synthétise, elle n'ajoute pas.
- Accessibilité : chaque élément interactif est un vrai bouton, son contenu est
  lisible au clavier et par un lecteur d'écran.

## 10. Playgrounds natifs

Les Playgrounds de la formation sont des composants React du dépôt
(`src/app/playgrounds/`), pas du HTML collé. Une leçon les désigne par un
marqueur dans le champ « Playground » (choix proposé dans l'éditeur de leçon) :

- version commune, dans le modèle de formation : `<!-- playground:rs6776-1-1 -->`
- variante d'un élève, dans sa copie : `<!-- playground:rs6776-1-1 profil=sirh -->`

Le même marqueur active aussi la Fiche de révision de la leçon. Il est recopié
comme le reste du contenu lors de l'attribution, et le composant étant partagé,
toute amélioration atteint aussi les élèves déjà inscrits.
Aperçu en local : `npm run dev` puis `/__playground/rs6776-1-1?profil=sirh`
(ajouter `&vue=fiche` pour la fiche de révision).

## 11. Contrôle d'un script avant validation

- [ ] Pont entrant et pont sortant conformes au tableau du chapitre 4
- [ ] Exercice de l'écrit cité
- [ ] Aucun fait absent du cours ou de la documentation de la plateforme
- [ ] Chemins de la plateforme exacts (noms d'onglets et de boutons)
- [ ] Vidéo personnalisée sans aucune répétition des définitions de la vidéo commune
- [ ] Phrases dites à voix haute sans accroc, durée estimée dans la fourchette
- [ ] Indications de scène (avatar, visuels) pour chaque bloc
