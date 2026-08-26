<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Pilotage appel d'offre

Mini-site embarqué (iframe) dans la première leçon de la plateforme. Les
appels IA (extraction de dates, synthèses, chatbot) passent par la fonction
Supabase Edge `tender-assistant`, qui détient la clé Gemini côté serveur —
aucune clé n'est jamais exposée dans le navigateur. L'authentification est
celle de la session Supabase de l'élève, partagée automatiquement car ce
mini-site est chargé en iframe sur le même domaine que la plateforme.

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Run the app:
   `npm run dev`

## Build & déploiement

`npm run build` génère `dist/`, dont le contenu doit être copié dans
`public/embeds/pilotage-appel-doffre/` à la racine de la plateforme.
