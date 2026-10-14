# Vidéos de leçons (Remotion)

Vidéos pédagogiques aux couleurs de Les Formateurs IA : fond encre, constellation
de particules 3D (reprise du canvas "AiStory" du site), typographie Funnel Display,
dégradé iris, animations ease-out-strong. Pas de voix off — seulement quelques
effets sonores discrets : l'avatar et la voix d'origine sont reposés ensuite au
montage. La vidéo a donc **exactement** la durée et le minutage de la source
(370,33 s) et laisse libre la zone avatar en bas à gauche (`AVATAR_ZONE`,
`src/theme.ts` : x 0–600, y 620–1080).

## Commandes

```bash
npm i
npm run dev                                   # Remotion Studio (aperçu)
npx remotion render Lecon1-IA-generative out/lecon1-ia-generative.mp4 --crf=18
# contrôle (zone avatar en pointillés + voix d'origine) — ne pas livrer
npx remotion render Lecon1-IA-generative-controle out/lecon1-controle-synchro.mp4 --crf=26
node scripts/stills.mjs Lecon1-IA-generative out/stills 12 60 120   # images de contrôle (secondes)
```

## Structure

- `src/theme.ts` — jetons de marque (couleurs, dégradés, police, courbes).
- `src/components/` — `ParticleField` (constellation 3D déterministe), `Backdrop`,
  primitives d'animation (`Reveal`, `RiseLines`, `Glass`…), pictos.
- `src/lesson1/` — leçon 1 « L'IA générative » :
  - `timeline.ts` — découpage des scènes calé mot à mot sur la voix d'origine
    (`transcript.txt`), caméra des particules, effets sonores.
  - `scenes/` — une scène par fichier ; `ToolScene.tsx` + `tools.ts` pour les fiches outils.
- `public/` — logo, logos d'outils, effets sonores (remotion.media),
  `lesson1/reference-voix.m4a` (voix d'origine, utilisée seulement par la composition de contrôle).

Source d'origine : `../source_video/Leçon_1_Finale.mp4`.
