# Site web e-learning IA

Prototype React/Vite d'une plateforme e-learning IA personnalisée, basé sur une maquette Figma.

## Prérequis

- Node.js 18.18 ou plus récent
- npm, pnpm ou yarn

## Démarrage

```bash
npm i
cp .env.example .env   # renseigner VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY
npm run dev
```

Puis ouvre l'URL affichée par Vite dans le terminal.

## Scripts

- `npm run dev` lance le serveur de développement.
- `npm run build` génère la version de production dans `dist/`.
- `npm run preview` sert localement le build de production.

## Structure

- `src/app/App.tsx` — racine : providers (thème, profil) + routes (`react-router`).
- `src/app/pages/` — une page par route (onboarding, dashboard, leçons, pratique, planning, avantages, profil, leçon).
- `src/app/components/layout/` — `MainLayout` (sidebar + topbar, `<Outlet/>`).
- `src/app/components/common/` — composants UI partagés (GCard, boutons, fond animé…).
- `src/app/components/ui/` — composants UI de base (shadcn/radix).
- `src/app/theme/` — tokens de thème clair/sombre + styles globaux.
- `src/app/state/` — contexte React du profil élève (`ProfileProvider`).
- `src/app/data/mock.ts` — données de démonstration, à remplacer progressivement par des requêtes Supabase.
- `src/app/lib/supabase/` — client Supabase typé + types générés depuis le schéma.
- `src/imports/` contient les assets de marque exportés.
- `src/styles/` contient Tailwind, le thème et les styles globaux.
- `supabase/migrations/` — schéma de base de données (formations, leçons, progression, IA générée, RDV…).

## Source design

La maquette d'origine est disponible ici :
https://www.figma.com/design/cc7nJRSiPehHhLXu0HUtro/Site-web-e-learning-IA
