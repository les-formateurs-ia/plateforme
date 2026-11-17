// Astuces IA — cas pratiques Web. Même grammaire que les cas Image (template
// à emplacements, briques à options), mais le résultat est une page web
// générée par Claude : l'élève copie le prompt dans Claude, il n'y a pas de
// génération dans la plateforme. Les exemples sont produits par
// scripts/generate-astuces-media.mjs (Claude du Studio → page HTML → capture
// d'écran, et vidéo animée pour le résultat et l'« avant »).
// Première version rédigée pour relecture par les formateurs ; modifier un
// passage qui entre dans un prompt implique de régénérer les exemples du cas
// (npm run astuces:media -- --only=cas/<id> --force --as=<email>).
import type { AstuceCas } from "./types";

const CLAUDE = {
  id: "anthropic:claude@opus-5",
  label: "Claude Opus 5",
  why: "Claude est aujourd'hui le modèle le plus solide pour créer des pages web : il écrit les textes, le design et le code dans une seule réponse, et sur claude.ai il affiche la page en direct à côté de la conversation. Il sait aussi travailler avec Figma pour en tirer une maquette modifiable.",
};

// Contraintes communes : une page autonome, lisible tout de suite, sans
// dépendance qui casserait l'aperçu.
const TECH = "Contraintes techniques : un seul fichier HTML avec le CSS et le JavaScript intégrés, aucune bibliothèque externe à part Google Fonts, aucune image externe (illustrations en SVG intégré ou formes en CSS), responsive, textes réels en français sans lorem ipsum, moins de 500 lignes. Réponds uniquement avec le code complet.";

export const WEB_CAS: AstuceCas[] = [
  {
    id: "landing-page",
    domain: "web",
    title: "Ta landing page de vente",
    tagline: "Une page qui présente ton offre et donne envie d'acheter, écrite et codée par Claude.",
    intro: "Une landing page n'a qu'un objectif : transformer un visiteur en client. Claude peut en écrire les textes, en dessiner le design et en coder les animations en une seule réponse. Le résultat dépend de ce que tu lui dis : à qui tu parles, dans quel ordre tu déroules tes arguments, sur quel ton, avec quel style, et ce que le visiteur doit faire à la fin.",
    duration: "≈ 15 min",
    model: CLAUDE,
    ratio: "16:10",
    template: `Crée la landing page de vente de {offre}, pour {cible}. {structure}. {ton}. {style}. {animations}. {cta}. ${TECH}`,
    fields: [
      { id: "offre", label: "Ton offre", placeholder: "ex. mon accompagnement de 3 mois pour lancer son activité de traiteur, à 900 €", example: "« Terre & Mains », une formation en ligne de 6 semaines pour apprendre la céramique chez soi, à 290 €" },
      { id: "cible", label: "Ta cible", placeholder: "ex. des cuisiniers amateurs qui veulent en faire leur métier", example: "des adultes débutants qui cherchent une activité créative et apaisante" },
    ],
    briques: [
      {
        id: "structure",
        title: "La structure",
        why: "Une page de vente se lit comme un argumentaire : l'ordre des sections compte autant que leur contenu. Les copywriters suivent des trames éprouvées ; nomme-en une et Claude organise toute la page autour.",
        options: [
          { id: "aida", label: "AIDA", snippet: "Structure AIDA : une accroche qui capte l'attention, l'intérêt avec les bénéfices concrets, le désir avec le programme et des témoignages, puis l'action avec le prix et le bouton", note: "La trame classique : chaque section prépare la suivante jusqu'au bouton." },
          { id: "pas", label: "Problème → solution", snippet: "Structure problème, agitation, solution : on décrit d'abord la frustration du visiteur, on montre ce qu'elle lui coûte, puis on présente l'offre comme la solution", note: "Plus émotionnelle : le visiteur se reconnaît avant de découvrir l'offre." },
          { id: "recit", label: "Récit", snippet: "Structure en récit : l'histoire de la créatrice de la formation, de ses débuts maladroits à son atelier, puis sa méthode et l'offre", note: "Crée de la proximité : idéal quand la personne derrière l'offre est un argument." },
        ],
      },
      {
        id: "ton",
        title: "Le ton",
        why: "Le ton fait le tri entre les visiteurs : il attire ta cible et éloigne les autres. Sans consigne, Claude écrit dans un style « marketing » neutre que personne ne retient.",
        options: [
          { id: "chaleureux", label: "Chaleureux", snippet: "Ton chaleureux et rassurant, tutoiement, phrases courtes", note: "Proche et bienveillant : parfait pour des débutants qui hésitent." },
          { id: "expert", label: "Expert", snippet: "Ton expert et factuel, vouvoiement, chiffres et résultats concrets", note: "Inspire confiance aux profils qui veulent des preuves." },
          { id: "energique", label: "Énergique", snippet: "Ton énergique et enthousiaste, phrases percutantes, verbes d'action", note: "Donne de l'élan, au risque de paraître trop « vendeur »." },
        ],
      },
      {
        id: "style",
        title: "Le style visuel",
        why: "Le design dit en une seconde si l'offre est haut de gamme, accessible, créative… Décris-le comme à un graphiste : fond, typographie, couleurs, densité.",
        options: [
          { id: "editorial", label: "Éditorial", snippet: "Style visuel éditorial : fond crème, typographie à empattements élégante pour les titres, beaucoup d'espace, accents terracotta", note: "Raffiné et apaisant, comme un magazine de décoration." },
          { id: "audacieux", label: "Audacieux", snippet: "Style visuel moderne et audacieux : fond sombre, très gros titres sans empattements, dégradés vifs violet et orange", note: "Impactant et jeune, il se démarque immédiatement." },
          { id: "suisse", label: "Minimaliste", snippet: "Style visuel minimaliste suisse : noir et blanc, grille stricte, une seule couleur d'accent bleu vif", note: "Sobre et structuré : tout repose sur la typographie." },
        ],
      },
      {
        id: "animations",
        title: "Les animations",
        why: "Les animations guident le regard et donnent une impression de soin. Trop, elles fatiguent ; pas du tout, la page paraît figée. Dis à Claude jusqu'où aller.",
        options: [
          { id: "subtiles", label: "Subtiles", snippet: "Animations subtiles : les sections apparaissent en fondu au défilement, les boutons réagissent au survol", note: "Le bon dosage : vivant sans distraire." },
          { id: "marquees", label: "Marquées", snippet: "Animations marquées : le titre s'écrit lettre par lettre, les cartes glissent au défilement, les chiffres clés défilent comme un compteur", note: "Spectaculaire : réserve-le aux pages où l'effet « waouh » compte." },
          { id: "aucune", label: "Aucune", snippet: "Aucune animation, page entièrement statique", note: "Plus rapide et sobre, mais la page paraît moins travaillée." },
        ],
      },
      {
        id: "cta",
        title: "L'appel à l'action",
        why: "C'est la seule chose que le visiteur doit faire. S'il n'est pas clair, visible et rassurant, tout le reste de la page ne sert à rien.",
        options: [
          { id: "bouton", label: "Bouton + garantie", snippet: "Un seul bouton principal « Je réserve ma place », répété en haut, au milieu et en bas, avec le prix et une garantie satisfait ou remboursé de 14 jours", note: "Simple et rassurant : la garantie lève la dernière hésitation." },
          { id: "formulaire", label: "Formulaire", snippet: "Un formulaire d'inscription court en fin de page : prénom et e-mail, pour recevoir le premier cours offert", note: "On récupère un contact avant de vendre : idéal pour une offre chère." },
          { id: "urgence", label: "Urgence", snippet: "Un bouton « J'en profite » accompagné d'un compte à rebours jusqu'à la fin du tarif de lancement", note: "L'urgence pousse à décider, à utiliser honnêtement (vraie date limite)." },
        ],
      },
    ],
    retouche: {
      id: "style-animation",
      title: "Le style d'animation, en retouche",
      why: "Une fois la page réussie, ne la régénère pas pour changer les animations : demande à Claude, dans la même conversation, de garder le design et d'ajouter seulement le code des animations (un bloc de style et un bloc de script). La réponse est bien plus rapide, et le design ne peut pas bouger. Ici, les trois pages partent exactement du même code : seul le style d'animation change.",
      options: [
        { id: "mouvement", label: "Mouvement", prompt: "Garde exactement le même design, les mêmes textes et les mêmes couleurs. Change uniquement les animations : style « mouvement », avec des sections qui glissent depuis les côtés au défilement, un léger effet de parallaxe sur l'illustration du haut, des éléments qui flottent doucement en continu. Ne modifie pas le HTML existant : réponds uniquement avec un bloc <style> et un bloc <script> à coller juste avant </body>.", note: "La page prend du relief : tout bouge avec le défilement." },
        { id: "couleurs", label: "Couleurs", prompt: "Garde exactement le même design, les mêmes textes et la même mise en page. Change uniquement les animations : style « couleurs », avec des effets centrés sur la couleur et bien visibles. Les illustrations et les cartes sont en noir et blanc et se colorent quand elles entrent à l'écran. Les grands titres se remplissent de terracotta au fil du défilement, comme de la peinture. La couleur de fond change d'une section à l'autre. La section des témoignages s'inverse en négatif (fond sombre, texte clair) quand on l'atteint. Les boutons se remplissent de couleur depuis la gauche au survol. Ne modifie pas le HTML existant : réponds uniquement avec un bloc <style> et un bloc <script> à coller juste avant </body>.", note: "Tout se joue sur la couleur : le noir et blanc qui se colore, les titres qui se remplissent, une section qui passe en négatif." },
        { id: "design", label: "Design interactif", prompt: "Garde exactement le même design, les mêmes textes et les mêmes couleurs. Change uniquement les animations : style « design interactif », avec un curseur personnalisé qui suit la souris, des boutons magnétiques qui s'approchent du curseur, des cartes qui s'inclinent en 3D au survol et des soulignements dessinés à la main qui se tracent sous les titres. Ne modifie pas le HTML existant : réponds uniquement avec un bloc <style> et un bloc <script> à coller juste avant </body>.", note: "Des micro-interactions de site primé : la page réagit à chaque geste du visiteur." },
      ],
    },
    weak: {
      prompt: "Fais-moi une landing page pour ma formation de céramique en ligne, en un seul fichier HTML.",
      explanation: "Sans cible, Claude écrit pour « tout le monde » ; sans structure ni ton, il aligne des sections génériques ; sans style, il choisit un design passe-partout. Le prompt précis lui donne les décisions d'un copywriter et d'un designer : il n'a plus qu'à les exécuter.",
    },
    pitfalls: [
      "Laisser Claude inventer les chiffres, les témoignages ou les garanties : relis tout, et remplace par tes vrais éléments avant de publier.",
      "Demander « une belle page moderne » : ce n'est pas un style, c'est un souhait. Décris fond, typographie et couleurs.",
      "Tout corriger dans un seul message : demande une modification à la fois (« rends le titre plus court », « passe le bouton en vert ») pour garder le contrôle.",
    ],
    tips: [
      "Sur claude.ai, la page s'affiche à côté de la conversation : tu vois le résultat et tu demandes des retouches en direct.",
      "Donne à Claude tes vrais textes (programme, avis, prix) en pièce jointe ou dans le message : la page sera publiable presque telle quelle.",
      "Demande ensuite « adapte cette page pour mobile et vérifie la lisibilité » : Claude relit et corrige son propre code.",
    ],
    variants: [
      { title: "Maquette dans Figma", text: "Avec le connecteur Figma, demande à Claude de reproduire la page dans un fichier Figma : ton graphiste ou toi pourrez la retoucher avant de la publier." },
      { title: "Page de liste d'attente", text: "Remplace l'appel à l'action par « un formulaire pour rejoindre la liste d'attente de la prochaine session » : parfait pour tester une offre avant de la lancer." },
      { title: "Version anglaise", text: "Ajoute « rédige la page en anglais, pour un public international » : Claude adapte aussi les tournures, pas seulement les mots." },
    ],
  },

  {
    id: "site-vitrine",
    domain: "web",
    title: "Ton site vitrine",
    tagline: "Un site d'une page pour ton commerce ou ton activité : infos pratiques, ambiance et réservation.",
    intro: "Pour un restaurant, un artisan ou un cabinet, un site vitrine d'une page suffit souvent : on doit comprendre en quelques secondes ce que tu fais, à quoi ressemble ton lieu et comment te contacter. Claude peut le créer entièrement si tu lui donnes tes infos et tes choix : les sections, le style, l'action principale et le niveau d'animation.",
    duration: "≈ 15 min",
    model: CLAUDE,
    ratio: "16:10",
    template: `Crée le site vitrine en une page de « {nom} », {activite}. Informations pratiques : {infos}. {sections}. {style}. {action}. {animations}. ${TECH}`,
    fields: [
      { id: "nom", label: "Nom de ton commerce", placeholder: "ex. Atelier Sève", example: "Le Petit Zinc" },
      { id: "activite", label: "Ton activité", placeholder: "ex. une fleuriste à Nantes, bouquets de saison et ateliers", example: "un bistrot de quartier à Lyon, cuisine de saison faite maison" },
      { id: "infos", label: "Tes infos pratiques", placeholder: "ex. ouvert du lundi au samedi, 4 place du Commerce, 02 40 00 00 00", example: "ouvert du mardi au samedi midi et soir, 12 rue des Capucins à Lyon, 04 78 00 00 00" },
    ],
    briques: [
      {
        id: "sections",
        title: "Les sections",
        why: "Chaque section répond à une question du visiteur : qu'est-ce que c'est, est-ce que ça me plaît, comment y aller. Liste celles que tu veux, sinon Claude en invente de superflues.",
        options: [
          { id: "essentiel", label: "L'essentiel", snippet: "Sections : un grand bandeau d'accueil, la carte du moment, l'histoire du lieu, trois avis clients, puis les horaires et l'adresse", note: "Le site vitrine type : tout ce qu'il faut, rien de trop." },
          { id: "minimal", label: "Une seule vue", snippet: "Sections : uniquement un bandeau d'accueil et les infos pratiques (horaires, adresse, téléphone), le tout visible sur un seul écran", note: "Ultra rapide à consulter, parfait sur mobile, mais peu d'ambiance." },
          { id: "complet", label: "Complet", snippet: "Sections : bandeau d'accueil, la carte, l'équipe en cuisine, une galerie d'ambiance, une FAQ (groupes, allergies, terrasse) et le contact", note: "Répond à toutes les questions, au prix d'une page plus longue." },
        ],
      },
      {
        id: "style",
        title: "Le style",
        why: "Ton site doit ressembler à ton lieu : un client qui pousse la porte après l'avoir vu ne doit pas être surpris. Décris l'ambiance avec des matières, des couleurs et une typographie.",
        options: [
          { id: "bistrot", label: "Bistrot rétro", snippet: "Style bistrot rétro : fond crème, typographie à empattements, filets fins façon ardoise, accents rouge bordeaux", note: "Authentique et chaleureux, il évoque immédiatement le lieu." },
          { id: "moderne", label: "Moderne épuré", snippet: "Style moderne et épuré : beaucoup de blanc, typographie sans empattements, grands aplats vert sauge", note: "Frais et contemporain, adapté à une cuisine plus « bistronomique »." },
          { id: "illustre", label: "Illustré", snippet: "Style chaleureux et illustré : couleurs moutarde et terracotta, petites illustrations SVG dessinées à la main, coins arrondis", note: "Convivial et unique, très bien pour un lieu familial." },
        ],
      },
      {
        id: "action",
        title: "L'action principale",
        why: "Que doit faire le visiteur en priorité ? Réserver, appeler, commander : choisis-en une seule et Claude la mettra en avant partout.",
        options: [
          { id: "reserver", label: "Réserver", snippet: "Action principale : un bouton « Réserver une table » toujours visible en haut de l'écran, qui ouvre un formulaire (date, heure, nombre de couverts)", note: "Le visiteur passe à l'acte sans quitter la page." },
          { id: "appeler", label: "Appeler", snippet: "Action principale : un bouton « Appeler » avec le numéro, très mis en avant sur mobile", note: "Le plus simple pour une clientèle qui préfère le téléphone." },
          { id: "commander", label: "Commander", snippet: "Action principale : un bouton « Commander à emporter » qui mène à la carte avec les prix", note: "Transforme le site en canal de vente." },
        ],
      },
      {
        id: "animations",
        title: "Les animations",
        why: "Sur un site vitrine, les animations servent l'ambiance. Bien dosées, elles donnent envie de venir ; trop présentes, elles ralentissent la lecture des infos.",
        options: [
          { id: "subtiles", label: "Subtiles", snippet: "Animations subtiles : apparition en fondu des sections au défilement, liens soulignés au survol", note: "Discret et soigné." },
          { id: "riches", label: "Riches", snippet: "Animations riches : effet de parallaxe sur le bandeau d'accueil, plats de la carte qui apparaissent un par un, menu qui se réduit au défilement", note: "Immersif, donne une impression de site sur mesure." },
          { id: "aucune", label: "Aucune", snippet: "Aucune animation, page entièrement statique", note: "Sobre et rapide, mais plus « plaquette » que « lieu vivant »." },
        ],
      },
    ],
    weak: {
      prompt: "Fais un site pour mon restaurant Le Petit Zinc à Lyon, en un seul fichier HTML.",
      explanation: "Sans infos pratiques, Claude invente horaires et adresse ; sans sections ni style, il produit un site de restaurant générique qui pourrait être n'importe lequel. Avec tes infos réelles et quatre décisions, le site te ressemble et sert vraiment à tes clients.",
    },
    pitfalls: [
      "Oublier les infos pratiques : Claude les invente, et une fausse adresse sur un site, c'est des clients perdus.",
      "Vouloir tout mettre : un site vitrine se consulte surtout sur mobile, en quelques secondes. Garde l'essentiel en haut.",
      "Publier sans vérifier sur téléphone : demande à Claude de tester le rendu mobile, puis vérifie toi-même.",
    ],
    tips: [
      "Envoie à Claude une photo de ton lieu ou de ta carte : il s'en inspire pour les couleurs et l'ambiance.",
      "Demande « ajoute les données structurées pour Google (horaires, adresse) » : ton site apparaîtra mieux dans les recherches locales.",
      "Une fois la page validée, Claude peut t'expliquer pas à pas comment la mettre en ligne gratuitement.",
    ],
    variants: [
      { title: "Artisan ou indépendant", text: "Remplace les sections par « mes services, mes réalisations, mes tarifs, une demande de devis » : la même structure marche pour un plombier ou une photographe." },
      { title: "Menu du jour à jour", text: "Demande « une section menu du jour facile à modifier, avec les plats dans une liste en haut du code » : tu changes le texte chaque matin sans toucher au reste." },
      { title: "Maquette dans Figma", text: "Avec le connecteur Figma, Claude transforme la page en maquette modifiable : pratique pour la faire valider avant de la publier." },
    ],
  },
];
