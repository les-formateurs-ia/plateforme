# Brief de production d'une leçon RS6776 (agents)

Lire d'abord, en entier : `docs/formation-rs6776/bible.md` (règles), `docs/fonctionnalites-elearning-cpf.txt`
(plateforme, citer uniquement ce qui y figure), et l'exemple complet de la leçon 1.1 :
`docs/formation-rs6776/lecon-1.1/script-video-commune.md`, `script-video-nathalie.md`,
`lesson-videos/src/lesson1_1/Commune.tsx`, `Nathalie.tsx`, `src/app/playgrounds/rs6776/revision/_exemple.ts`
(format des fiches), `src/app/playgrounds/rs6776/revision/types.ts`.

## Profil de Nathalie (rien d'autre ne doit être affirmé sur elle)
Consultante SIRH. Accompagne ses clients dans la mise en place de leurs logiciels de recrutement, du
paramétrage à la formation des équipes. Rédige les offres d'emploi de ses clients. Utilise ChatGPT tous les
jours pour reformuler ses mails. À l'aise avec le RGPD et la CNIL. Souhaite mieux comprendre les différences
entre les outils. Les prompts « Nathalie » du Drive peuvent contenir d'autres éléments de profil : ne reprendre
que ceux qui y sont écrits explicitement.

## Pour CHAQUE leçon confiée (dossier `docs/formation-rs6776/lecon-X.Y/`, numérotation de la bible)
1. Télécharger depuis le dossier Drive indiqué (outil Google Drive `download_file_content`, puis copier le fichier
   téléchargé) : le cours → `cours.html` ; le Playground de Nathalie → `playground-nathalie.html` ; le quiz de
   Nathalie → `quiz-nathalie.csv`. Lire aussi les deux prompts vidéo du Drive (générique et Nathalie) : ce sont des
   matières premières, pas des modèles à recopier.
2. Écrire `script-video-commune.md` et `script-video-nathalie.md` au format EXACT de la leçon 1.1 (le découpage
   automatique en dépend) : titres `### Scène N — Titre (bloc X) · avatar plein cadre|absent|en médaillon`
   (N = 1, 2, 3… ou 9a, 9b…), voix off = paragraphes commençant par « et finissant par », libellés d'habillage
   contenant « · » (ils ne sont pas lus). En-tête avec statut, compétence, exercice, durée estimée, sources ;
   section « Points de contrôle » à la fin.
   - Commune : 700 à 900 mots (4 min 30 à 6 min). Ponts entrant/sortant du tableau de la bible. Exercice de
     l'écrit cité. Fonctionnalités de la plateforme du tableau de la bible. Les cinq outils dans l'ordre
     ChatGPT, Claude, Gemini, Copilot, Firefly quand on compare des outils. Pas de prix, pas de version de modèle,
     aucun chiffre absent du cours.
   - Nathalie : 300 à 380 mots (2 min à 2 min 30). Aucune définition répétée de la vidéo commune. Cas SIRH.
     Renvoie à son Playground (qui est `playground-nathalie.html`, lire ce qu'il contient pour en parler juste).
   - Coût HeyGen : seules les scènes avec avatar sont payantes. Commune : au plus 4 scènes avec avatar
     (ouverture plein cadre, objectif plein cadre facultatif, « À vous » en médaillon, clôture plein cadre),
     70 secondes maximum au total (~180 mots). Nathalie : 2 scènes avec avatar (ouverture plein cadre,
     « À vous » en médaillon), 45 secondes maximum (~115 mots).
3. Écrire la fiche `src/app/playgrounds/rs6776/revision/lXY.ts` (ex. `l12.ts`) : `export const data: RevisionData`
   (types.ts), 4 à 6 modules variés et interactifs (sort, flip, beforeAfter, example, checklist, choice, steps…),
   `profiles.sirh` = un module « Votre métier » (consultante SIRH), `exam` (exercice de l'écrit, étapes), 5
   `flashcards` différentes du quiz. Bloc `{ type: "tools" }` seulement si la leçon compare les outils. Ne rien
   ajouter qui ne soit pas dans le cours.
4. Voix off (gratuite) : depuis `lesson-videos/`,
   `export HEYGEN_API_KEY=$(cat <chemin de la clé>)` puis
   `node scripts/heygen-voice.mjs ../docs/formation-rs6776/lecon-X.Y/script-video-commune.md lessonX_Y-commune`
   et idem pour `-nathalie`. Vérifier dans `src/generated/<nom>.json` que toutes les scènes sont présentes et que
   les secondes d'avatar (`avatarSeconds`) respectent les plafonds ; sinon raccourcir le script et relancer.
   NE JAMAIS lancer `scripts/heygen-avatar.mjs` (payant).
5. Montage : `lesson-videos/src/lessonX_Y/Commune.tsx` et `Nathalie.tsx`, sur le modèle de la leçon 1.1 (mêmes
   briques `../rs6776/kit`, `LessonVideo`, `cue(scène, "mot")` avec un mot réellement prononcé dans la scène,
   `ToolCard` pour les fiches outils). Exporter `manifest` et `LessonXYCommune` / `LessonXYNathalie`. Toutes les
   scènes « avatar absent » doivent avoir un habillage. Aucune donnée inventée à l'écran (un exemple visuel doit
   être marqué « exemple fictif »). Vérifier : `cd lesson-videos && npx tsc` sans erreur.

## Interdits
- Ne pas modifier : bible.md, registry.ts, Root.tsx, kit.tsx, LessonVideo.tsx, timeline.ts, ui.tsx, tools.ts,
  RevisionSheet.tsx, types.ts, les fichiers de la leçon 1.1, ni ceux d'une autre leçon que les vôtres.
- Aucune écriture en base de données, aucun appel HeyGen payant, aucun commit Git.

## Compte rendu final (court)
Par leçon : fichiers créés, mots et durée de chaque vidéo, secondes d'avatar, résultat de `npx tsc`, et les
points douteux (contenu du cours ambigu, fait non vérifiable, Playground HTML qui ne correspond pas au cours).
