# Brief : convertir un Playground HTML en Playground natif (React)

Objectif : plus aucun Playground en HTML collé. Chaque Playground personnalisé (version SIRH de
Nathalie) devient un composant React de la plateforme, intégré à sa charte, qui reprend **tout**
le contenu et toutes les activités du HTML d'origine, et ajoute ce qui manque pour bien l'intégrer.

## À lire d'abord
- Le HTML d'origine : `docs/formation-rs6776/lecon-X.Y/playground-nathalie.html` (lire en entier : textes,
  données, logique JavaScript, corrections, appels IA éventuels via `window.__PLATFORM_AUTH__` / `ai-proxy`).
- Le cours de la leçon (`cours.html`) et la fiche de révision (`src/app/playgrounds/rs6776/revision/lXY.ts`).
- Le Playground natif de référence : `src/app/playgrounds/rs6776/Lecon11Playground.tsx` (structure, style,
  appel IA via `askPlatformAi` de `src/app/playgrounds/ai.ts`, liens vers la plateforme).
- Les briques visuelles : `src/app/playgrounds/ui.tsx` (Hero à particules, ProgressRing, Tile, IrisNumber, Chip,
  alpha, TOOL_TINT, celebrate) et `playgrounds.css` ; les boutons `ShimBtn`, `VBtn`, `Segmented`
  (`src/app/components/common/Buttons.tsx`), `GCard`, le thème `useTh()` (clair et sombre).
- `docs/formation-rs6776/bible.md` (chapitres 2 bis et 6 : outils, fonctionnalités de la plateforme à citer)
  et `docs/fonctionnalites-elearning-cpf.txt` (routes : /studio/chatgpt, /studio/claude, /studio/gemini,
  /studio/images, /practice/prompts, /practice/media, /practice/battle-ground, /practice/reverse-prompting,
  /hub, /hub/<texte|donnees|image|video|code|audio|musique|recherche>, /agent).

## À produire : `src/app/playgrounds/rs6776/pg/PgXY.tsx` (le fichier existe déjà en version d'attente : le remplacer)
- `export default function PgXY({ params }: PlaygroundProps)`. Le composant est déjà enregistré.
- **Fidélité** : chaque activité, chaque cas, chaque donnée fictive, chaque correction et chaque explication
  du HTML est repris. Les appels IA du HTML passent par `askPlatformAi` (même consigne, même usage).
  Corriger seulement les incohérences évidentes du HTML (et les signaler dans le compte rendu).
- **Intégration** (à ajouter) : bandeau `Hero` avec le titre de la leçon et un `ProgressRing` « réalisé » ;
  activités en tuiles colorées (une teinte de la charte par activité) ; gerbe `celebrate` à chaque activité
  terminée ; encadrés « Ce qu'il faut retenir » ; un bloc final « Pour aller plus loin sur la plateforme » avec
  des boutons `useNavigate` vers les fonctionnalités prévues pour la leçon dans la bible (pas de lien inventé) ;
  mention claire « exemple fictif » sur les cas inventés.
- **Qualité** : vouvoiement, français soigné, accessible au clavier (vrais boutons, `aria-pressed`,
  `aria-live` pour les résultats), lisible en thème clair et sombre (couleurs via `useTh()` et `alpha()`),
  responsive. Pas de `dangerouslySetInnerHTML` ni de HTML injecté. Pas de nouvelle dépendance.
- Contenu personnalisé autorisé sur Nathalie : uniquement ce que le HTML d'origine contient déjà.

## Vérifications
- `npx tsc --noEmit -p tsconfig.json` à la racine du dépôt : aucune erreur.
- Relire le composant en comparant au HTML, activité par activité.

## Interdits
Ne modifier aucun autre fichier que vos `PgXY.tsx` (pas le registre, pas ui.tsx, pas les fiches, pas les
montages). Aucune écriture en base, aucun appel HeyGen, aucun commit Git.

## Compte rendu final (court)
Par leçon : activités reprises (liste), éléments ajoutés, incohérences corrigées, résultat de `tsc`.
