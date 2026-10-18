# Vidéos de leçons (Remotion)

Vidéos pédagogiques aux couleurs de Les Formateurs IA : fond encre, constellation
de particules 3D (reprise du canvas "AiStory" du site), typographie Funnel Display,
dégradé iris, animations ease-out-strong. Pas de voix off — seulement quelques
effets sonores discrets : l'avatar et la voix d'origine sont reposés ensuite au
montage. Chaque vidéo a donc **exactement** la durée et le minutage de sa source
et laisse libre la zone avatar en bas à gauche (`AVATAR_ZONE`,
`src/theme.ts` : x 0–600, y 620–1080).

## Commandes

```bash
npm i
npm run dev                                   # Remotion Studio (aperçu)
npx remotion render Lecon1-IA-generative out/lecon1-ia-generative.mp4 --crf=18
npx remotion render Lecon2-Analyser-son-poste out/lecon2-analyser-son-poste.mp4 --crf=18
npx remotion render Lecon3-Securiser-son-usage out/lecon3-securiser-son-usage.mp4 --crf=18
npx remotion render Lecon4-Installer-configurer out/lecon4-installer-configurer.mp4 --crf=18
npx remotion render Lecon5-Bases-prompt-engineering out/lecon5-bases-prompt-engineering.mp4 --crf=18
npx remotion render Lecon6-Securite-gestion-donnees out/lecon6-securite-gestion-donnees.mp4 --crf=18
node scripts/stills.mjs Lecon1-IA-generative out/stills 12 60 120   # images de contrôle (secondes)
```

## Structure

- `src/theme.ts` — jetons de marque (couleurs, dégradés, police, courbes).
- `src/components/` — `ParticleField` (constellation 3D déterministe), `Backdrop`,
  `Chrome` (logo, chapitre, progression), primitives
  d'animation (`Reveal`, `RiseLines`, `Glass`…), pictos.
- `src/lesson1/` — leçon 1 « L'IA générative » :
  - `timeline.ts` — découpage des scènes calé mot à mot sur la voix d'origine
    (`transcript.txt`), caméra des particules, effets sonores.
  - `scenes/` — une scène par fichier ; `ToolScene.tsx` + `tools.ts` pour les fiches outils.
- `src/lesson2/` — leçon 2 « Analyser son poste et identifier les tâches génératives
  automatisables » (156,04 s) : matrice valeur × facilité en 3D, trois critères en
  accordéon. Même principe (`timeline.ts`, `transcript.txt`, `scenes/`).
- `src/lesson3/` — leçon 3 « Comment sécuriser son usage de l'IA » (195,10 s) : strict
  nécessaire, anonymisation en direct, moindre privilège, revue manuelle, exemple
  personnalisé (la voix off s'adresse à Nathalie).
- `src/lesson4/` — leçon 4 « Installer et configurer les outils IA » (269,55 s) :
  démonstration de Gemini recréée en interface stylisée (`Window.tsx` + curseur
  `components/Cursor.tsx`), puis l'onglet Hub IA de la plateforme.
- `src/lesson5/` — leçon 5 « Les bases du Prompt Engineering » (237,08 s) : demande vague
  → 3 résultats, les 5 piliers (rôle, cible, objectif, contexte, format) en colonnes 3D,
  reconstruction du prompt, vérification, conseils pour Nathalie.
- `src/lesson6/` — leçon 6 « Sécurité et gestion des données » (238,47 s) : données
  confidentielles, personnelles (RGPD) et sensibles, risques avec l'IA, documents RH.
- `public/` — logo, logos d'outils, effets sonores (remotion.media).

Sources d'origine : `../source_video/` et `Bureau/VIDEOS NATHALIE/`.

## Ajouter une leçon

1. Extraire l'audio (16 kHz mono) et le transcrire mot à mot (whisper.cpp, modèle
   `medium`, `-l fr -ml 1 -ojf`) pour obtenir les instants de chaque mot.
2. Créer `src/lessonN/` : `timeline.ts` (durée exacte de la source, scènes, caméra,
   effets sonores) + une scène par fichier, en restant hors de `AVATAR_ZONE`.
3. Enregistrer la composition dans `src/Root.tsx` (une seule vidéo par leçon).
