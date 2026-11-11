# Leçon 1.5 — Sécuriser son usage de l'IA
## Vidéo commune (onglet « Vidéo »)

- **Statut : à valider**
- Module 1 · Leçon 1.5 · Compétence C3 · prépare l'exercice 3 de l'écrit
- Présentateur : Raul, Formateur IA · vouvoiement · 16:9
- Durée estimée : 4 min 49 s (722 mots à 150 mots par minute) ; voix off générée : 4 min 15 s, dont 54 s d'avatar visible
- Sources : `Cours_Lecon_1.6_RS6776.html` (Drive, dossier Livrables_Lecon_1.6_Nathalie, ancienne
  numérotation, copié dans `cours.html`), `Prompt_Video_Generique_Lecon1.6.md` (matière première),
  référentiel RS6776, `docs/fonctionnalites-elearning-cpf.txt`
- Le raccourci « Ctrl + H » cité par la bible (chapitre 6) n'apparaît ni dans le cours ni dans le
  Playground de Nathalie : non cité, à confirmer avec le Playground commun.
- Ne répète pas la vidéo personnalisée et n'est pas répétée par elle (voir bible, chapitre 1).

Le texte entre guillemets est la voix off, à dire mot pour mot. Les indications
d'habillage sont pour Remotion.

---

### Scène 1 — Pont entrant (bloc A) · avatar plein cadre

Bandeau « Raul, Formateur IA » pendant les 5 premières secondes.

« Bonjour. Dans la leçon précédente, vous avez appris à reconnaître les catégories de
données à protéger. Savoir les repérer, c'est le préalable. Mais une fois repérées,
qu'en faites-vous, concrètement, avant d'écrire votre prompt ? Ces données ne se
protègent pas seules : il vous faut une méthode. »

### Scène 2 — L'objectif de cette leçon (bloc B) · avatar absent

Quatre réflexes en cartes, au mot qui les nomme : « Supprimer l'inutile »,
« Anonymiser ou pseudonymiser », « Un cadre autorisé, des accès limités », « Vérifier
la sortie ». Pastille iris : « Exercice 3 de l'écrit · corriger et justifier ».

« Cette leçon vous donne quatre réflexes complémentaires. Supprimer ce qui est inutile.
Distinguer anonymisation et pseudonymisation. Utiliser uniquement un cadre autorisé,
avec des accès limités. Et vérifier la sortie avant tout usage. C'est exactement ce que
demande le troisième exercice de l'écrit : corriger un contenu, et justifier chacun de
vos choix. »

### Scène 3 — D'abord, est-ce nécessaire ? (bloc C) · avatar absent

Trois branches à partir d'une information : « Inutile → retirer », « Utile → réduire
la précision ou remplacer », « Vraies informations → réintégrées hors de l'outil ».

« Face à une information réelle à protéger, la première question est simple : est-elle
nécessaire à la tâche ? L'outil a-t-il vraiment besoin de cette précision ? Si elle
n'est pas nécessaire, retirez-la. Si elle reste utile, réduisez
sa précision, ou remplacez les identifiants. Et si les vraies informations doivent
revenir dans le document final, réintégrez-les ensuite hors de l'outil, dans
l'environnement autorisé, avec une nouvelle validation. »

### Scène 4 — Anonymiser ou pseudonymiser (bloc C) · avatar absent

Deux colonnes. « Anonymisation · lien supprimé de façon irréversible » : la ligne qui
relie un nom à une personne se rompt. « Pseudonymisation · une correspondance reste
conservée » : un tableau de correspondance reste visible. Mention en corail : « Personne
A ≠ anonyme ».

« Attention à un piège fréquent. Remplacer un nom par Personne A ou Client X ne suffit
pas toujours. L'anonymisation supprime le lien avec la personne de façon irréversible :
plus aucun moyen, même indirect, de retrouver son identité. La pseudonymisation
remplace le nom, mais une correspondance reste conservée quelque part, dans un tableau
ou dans le document d'origine. La donnée reste alors personnelle, au sens du RGPD. À
l'inverse, même pour une donnée réellement anonyme, les obligations de confidentialité
ou de secret peuvent subsister. Et
cette mesure n'autorise pas, à elle seule, l'envoi à un service d'IA. La finalité,
l'offre, les réglages et la politique interne restent à vérifier. »

### Scène 5 — Un prompt corrigé, pas à pas (bloc C) · avatar absent

Le prompt initial du cours s'affiche, mention « exemple fictif du cours ». Ses passages
se traitent au fil de la voix : « Nom, adresse mail, entreprise · retirés », « IBAN ·
retiré entièrement », « Montant exact → niveau intermédiaire », « Menace de résiliation ·
généralisée, conservée ».

« Voyons un exemple. Une réclamation client à traiter, avec le nom de la cliente, son
adresse mail, son entreprise, le montant de la commande, et même son IBAN. Le nom, le
mail et l'entreprise sont retirés : la réponse peut rester générique jusqu'à l'envoi.
L'IBAN est retiré entièrement, pas seulement masqué : une donnée bancaire n'a rien à
faire dans un outil grand public, anonymisée ou non. Le montant exact devient une
catégorie, une commande de niveau intermédiaire. Et la menace de résiliation est
conservée, mais généralisée, car elle donne le bon ton à la réponse. Corriger, ce n'est
pas tout supprimer : c'est retirer l'inutile, généraliser l'utile, et pouvoir le
justifier. »

### Scène 6 — Le moindre privilège (bloc C) · avatar absent

Un titre en dégradé : « Moindre privilège ». Quatre mesures en cartes, une par une :
« Compte professionnel distinct », « Autorisations par outil ou par mission »,
« Révocation en fin de mission », « Catégories interdites de saisie ».

« L'anonymisation protège la donnée au moment de la saisie. Une politique d'accès
protège en amont. Son principe a un nom : le moindre privilège. Chaque personne, chaque
compte, chaque outil ne reçoit que les droits strictement nécessaires. Concrètement :
un compte professionnel distinct du compte personnel. Des autorisations limitées par
outil ou par mission. Des accès révoqués en fin de mission, pour qu'un accès oublié ne
serve pas longtemps après le besoin. Et des catégories de données interdites de saisie,
quel que soit l'outil. »

### Scène 7 — La liste d'exclusion (bloc C) · avatar absent

Une liste barrée en corail, au mot qui la nomme : « Mots de passe et clés », « Coordonnées
bancaires réelles », « Dossiers de santé », « Secret professionnel ». Mention :
« Services grand public non approuvés ».

« Une politique prudente exclut des services grand public non approuvés les secrets
d'authentification, les clés et les mots de passe, les coordonnées bancaires réelles,
les dossiers de santé et les informations couvertes par un secret professionnel. Une
solution locale ou contractuellement autorisée peut relever d'un autre cadre. Mais un
secret d'accès réel ne doit jamais être fourni au modèle. Et toute exception concernant
des données personnelles exige une analyse et des garanties formelles. »

### Scène 8 — La revue manuelle (bloc C) · avatar absent

Une loupe sur une réponse générée. Trois passages se signalent : « Une donnée qui
réapparaît », « Un détail inventé », « Un ton inadapté ».

« Dernier réflexe : relire. Même avec un prompt bien corrigé et un accès bien cadré, la
réponse peut poser problème, pour trois raisons. Une donnée peut réapparaître. L'outil
peut ajouter un détail inventé, absent de votre demande. Et le ton peut rester inadapté
à un usage professionnel. La correction du prompt réduit le risque en amont. La revue
manuelle vérifie ce qui en sort réellement, et corrige ce qui doit l'être avant tout
usage. »

### Scène 9 — À vous de jouer (bloc D) · avatar en médaillon

Liste de trois étapes, cochées au fur et à mesure : « 1 · Playground : anonymiser,
corriger, justifier », « 2 · Studio : Gemini, avec un texte anonymisé », « 3 · Relire la
réponse ».

« À vous, maintenant. Ouvrez l'onglet Playground pour vous entraîner à corriger des
prompts et à justifier chaque choix. Ensuite, dans le Studio, ouvrez le chat Gemini,
qui ne consomme pas votre budget IA. Soumettez-lui uniquement un texte que vous avez
anonymisé ou rendu fictif. Puis relisez sa réponse, comme si vous deviez l'envoyer. »

### Scène 10 — Clôture (bloc E) · avatar plein cadre

Récapitulatif affiché à droite, trois lignes l'une après l'autre : « Retirer l'inutile,
généraliser l'utile », « Pseudonyme n'est pas anonyme », « Moindre privilège et
relecture ».

« Retenez trois choses. Retirez l'inutile, généralisez l'utile. Un pseudonyme n'est pas
une anonymisation. Et le moindre privilège, comme la relecture, s'appliquent à chaque
usage. Validez le quiz pour débloquer la suite. Vos règles sont posées : dans la
prochaine leçon, vous assemblerez tâches, outils et règles dans un seul plan
d'actions. »

---

## Points de contrôle

- Pont entrant : les catégories de données (leçon 1.4) · pont sortant : règles posées → tout assembler
  dans un plan (leçon 1.6). ✔
- Exercice 3 de l'écrit cité (scène 2). ✔
- Notions du cours : quatre réflexes, nécessité, anonymisation et pseudonymisation, exemple travaillé,
  moindre privilège et quatre mesures, liste d'exclusion, revue manuelle et ses trois raisons. ✔
- Aucun chiffre ni date hors cours (montant, IBAN et cas judiciaire du cours non repris à l'oral). ✔
- Plateforme : Playground, Studio chat Gemini (hors budget IA, documentation de la plateforme), quiz. ✔
- Pas de comparaison d'outils : seul Gemini est cité, pour une activité du Studio. ✔
