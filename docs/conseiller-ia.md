# Conseiller Projet IA — widget HTML public

Le fichier **`public/conseiller-ia.html`** contient tout le frontend : HTML,
CSS et JavaScript. Il ne charge ni React ni la session de la plateforme.
Vite le copie tel quel dans `dist/conseiller-ia.html`. Aucune route ni entrée
de menu n'est ajoutée à l'espace apprenant.

URL après publication du frontend :
`https://plateforme.les-formateurs-ia.fr/conseiller-ia.html`.

## Intégration sur le site officiel

Copier le contenu de **`docs/conseiller-ia-embed.html`** dans un bloc HTML du
site `https://les-formateurs-ia.fr/`. Le petit script ajuste la hauteur de
l'iframe après chaque changement de contenu. Il vérifie l'origine ET la
fenêtre émettrice. Le widget n'envoie au site parent que sa hauteur.

Le CMS doit conserver le script de redimensionnement. S'il filtre les
balises `script`, ajouter ce script dans son gestionnaire de scripts. Sans
lui, l'iframe garde une hauteur fixe et permet le défilement interne.

Le serveur qui sert **ce fichier uniquement** doit permettre son intégration
sur le domaine officiel. Configuration HTTP conseillée :

```http
Content-Security-Policy: frame-ancestors 'self' https://les-formateurs-ia.fr https://www.les-formateurs-ia.fr
```

Ne pas envoyer `X-Frame-Options: DENY` ou `SAMEORIGIN` pour ce fichier.
Conserver la protection des autres pages de la plateforme. Si le site
officiel utilise une CSP, son `frame-src` doit autoriser
`https://plateforme.les-formateurs-ia.fr`. Ces règles se configurent sur
l'hébergement ; une balise meta dans le HTML ne remplace pas `frame-ancestors`.

## Fonctionnement

1. `submit` valide le contact, le profil, le secteur, le besoin et l'accord
   de contact, puis enregistre la ligne dans `project_advisor_leads`.
2. L'HTML attend la confirmation de l'enregistrement avant d'appeler `analyze`.
3. `analyze` utilise Gemini pour produire 2–3 pistes et trois sections adaptées
   au profil. Seuls le profil, le secteur et le besoin sont envoyés au modèle.
   Le résultat est stocké et réutilisé lors des nouvelles tentatives.
4. `callback` demande un téléphone, puis met à jour la même ligne avec
   `status = 'callback_requested'` et `callback_requested_at`.

La confirmation du rappel n'apparaît qu'après l'écriture en base. Une panne
de l'IA ne supprime pas le contact et n'empêche pas la demande de rappel.
Le bouton d'appel utilise **`tel:+33980874046`** (09 80 87 40 46).

Les administrateurs consultent les demandes dans **Demandes IA**, entre
Rendez-vous et Galerie Détection IA (`/admin/project-advisor-leads`). La table
affiche les coordonnées, le profil, le secteur, le besoin et les demandes de
rappel, avec un tiret pour les valeurs absentes. Le téléphone est renseigné
lors de la demande de rappel. Les résultats sont paginés et actualisés toutes
les 30 secondes ; un filtre permet de choisir Entreprise ou Particulier.
Il n'y a **aucune intégration CRM ou notification automatique**. Le délai annoncé de
24 heures suppose donc une prise en charge opérationnelle de ces demandes.

## Données et accès

- `project_advisor_leads` : coordonnées, projet, analyse et demande de rappel.
- `project_advisor_quotas` : compteurs techniques temporaires, sans IP/email
  en clair. Les compteurs de plus de deux jours sont nettoyés à l'utilisation.
- RLS activée : aucun accès pour les visiteurs, élèves ou formateurs.
  La migration `20260921141737_project_advisor_admin_read.sql` autorise les
  administrateurs à lire uniquement les colonnes de contact et de projet.
  Les jetons d'accès ne sont pas exposés et aucune écriture cliente n'est permise.
- La fonction utilise le rôle serveur. Chaque visiteur détient seulement un
  jeton aléatoire pour SA soumission, conservé en mémoire, dont seule
  l'empreinte SHA-256 est enregistrée. Il expire après 24 heures.
- Pas de cookie, stockage local, clé IA ou clé privilégiée dans le HTML.
- Déduplication par identifiant de soumission ; génération verrouillée en
  base et limitée à trois essais par projet.
- Limites fixes : 10 nouveaux projets/IP/heure, 3/email/heure, 500 nouveaux
  projets/jour et 150 générations/jour au total. Les compteurs sont atomiques.
  CORS et le champ piège complètent ces limites ; CORS n'est pas présenté
  comme une authentification ni une protection anti-bot suffisante.
- Les textes du modèle sont affichés via `textContent`, jamais comme HTML.

Consultation réservée à l'équipe autorisée (SQL Editor Supabase) :

```sql
select first_name, last_name, email, phone, profile, sector, need,
       status, created_at, callback_requested_at
from public.project_advisor_leads
where status = 'callback_requested'
order by callback_requested_at asc;
```

Le texte de consentement concerne ce projet, pas l'inscription à une
newsletter. Le module ne reçoit pas de pièces jointes. La durée de conservation
des leads suit la politique de l'organisme ; aucune purge automatique des
contacts n'est ajoutée ici.

## Déploiement et configuration

La migration est
`supabase/migrations/20260921132321_project_advisor_leads.sql`.
La fonction est `supabase/functions/project-advisor/` et son accès public est
déclaré **uniquement pour cette fonction** dans `supabase/config.toml`.

Secrets serveur :

- `SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY` : fournis par Supabase.
- `GEMINI_API_KEY` : clé déjà utilisée par les fonctions IA du projet.
- `PROJECT_ADVISOR_MODEL` : optionnel, défaut `gemini-3.6-flash`.
- `PROJECT_ADVISOR_ORIGINS` : optionnel, liste d'origines séparées par des
  virgules. Par défaut : plateforme, site officiel et son domaine `www`.
  Ajouter les origines localhost uniquement dans un environnement local.

La seule adresse publique à adapter en cas de changement de projet Supabase
est la meta `advisor-api` dans l'HTML. Aucun secret ne doit y être ajouté.

```sh
supabase functions deploy project-advisor --project-ref urwroliwrzibvfxkttkv --use-api --no-verify-jwt
npm run build
```

Publier ensuite `dist/` avec le mécanisme habituel de la plateforme. La
publication du HTML n'ajoute pas le module au menu. Ne pas intégrer une URL
`/lesson/...` : seule l'URL du fichier `.html` est nécessaire.

## Vérification

Les scripts de test utilisent Node 22.6+ (exécutés ici avec Node 24).

```sh
npm run test:advisor
node scripts/project-advisor-db.test.mjs
node scripts/project-advisor-smoke.mjs
```

- Tests applicatifs : validation, ordre sauvegarde/IA, indisponibilité,
  autorisations, quotas, déduplication, concurrence et rappel.
- Test SQL : nécessite `.env`, vérifie la migration et les privilèges en
  transaction puis annule toutes les modifications de test.
- Test complet : nécessite les clés serveur dans `.env` et le backend déployé ;
  fait **deux vrais appels IA** et supprime ses propres contacts synthétiques
  dans un bloc `finally`. Ne transmet aucun email ni appel téléphonique.
- Vérification du widget en Chromium desktop et WebKit mobile : formulaire,
  deux profils, réponse, rappel, numéro `tel:`, absence de débordement
  horizontal, redimensionnement de l'iframe et réinitialisation.
