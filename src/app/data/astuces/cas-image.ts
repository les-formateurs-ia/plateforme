// Astuces IA — cas pratiques Image. Première version rédigée pour relecture
// par les formateurs : les textes (intro, why, note, tips…) se modifient
// librement ; modifier un passage qui entre dans un prompt (template,
// snippet, example, source.example) implique de régénérer les exemples du
// cas (npm run astuces:media -- --only=cas/<id> --force).
import type { AstuceCas } from "./types";

// Rappel commun aux cas qui partent d'une photo de l'élève.
const KEEP_FACE_TIP = "Importe une photo nette, de face, bien éclairée, sans lunettes de soleil ni filtre : le modèle ne peut garder que ce qu'il voit clairement.";

export const IMAGE_CAS: AstuceCas[] = [
  {
    id: "photo-profil",
    domain: "image",
    title: "Ta photo de profil pro",
    tagline: "Un portrait digne d'un studio pour LinkedIn, à partir d'un simple selfie.",
    intro: "Pas besoin de photographe : tu importes une photo de toi, même prise au téléphone, et l'IA la transforme en portrait professionnel. Tout l'enjeu est de lui dire précisément quoi changer (cadrage, tenue, fond, lumière) et surtout ce qu'elle ne doit pas toucher : ton visage.",
    duration: "≈ 5 min",
    model: {
      id: "nano-banana",
      label: "Nano Banana Pro",
      why: "C'est le modèle du Studio qui conserve le mieux un visage d'une photo à l'autre tout en changeant le reste de l'image.",
    },
    ratio: "1:1",
    seed: 301,
    source: {
      label: "Une photo de toi",
      tips: [
        KEEP_FACE_TIP,
        "Un selfie au téléphone suffit, tant que ton visage occupe une bonne partie de l'image.",
        "Évite les photos de groupe : le modèle ne saura pas qui garder.",
      ],
      example: "Selfie pris au téléphone par une femme d'une quarantaine d'années aux cheveux châtains mi-longs, dans sa cuisine, lumière de plafonnier un peu jaune, cadrage légèrement de travers, t-shirt gris, photo amateur réaliste",
    },
    template: "Transforme la photo de référence en portrait professionnel pour un profil LinkedIn. Garde exactement le même visage, les mêmes traits et la même coiffure. {cadrage}. {tenue}. {fond}. {lumiere}. {expression}. Rendu photo réaliste, peau naturelle avec sa texture, sans retouche excessive.",
    fields: [],
    briques: [
      {
        id: "cadrage",
        ref: "cadrage",
        title: "Le cadrage",
        why: "Une photo de profil s'affiche souvent en tout petit, dans un rond. Le cadrage décide si on reconnaît ton visage à cette taille.",
        options: [
          { id: "buste", label: "Buste, regard caméra", snippet: "Cadrage en buste, épaules visibles, visage centré, regard caméra", note: "Le standard LinkedIn : visage bien lisible, un peu de tenue visible." },
          { id: "visage", label: "Gros plan visage", snippet: "Gros plan sur le visage et le haut des épaules, regard caméra", note: "Parfait pour un avatar rond minuscule, mais on ne voit plus la tenue." },
          { id: "taille", label: "Plan taille, de trois quarts", snippet: "Plan taille, corps tourné de trois quarts, visage vers la caméra", note: "Plus dynamique et éditorial, mais le visage devient petit en vignette." },
        ],
      },
      {
        id: "tenue",
        title: "La tenue",
        why: "Ta tenue dit ton métier avant même qu'on lise ton titre. Si tu ne la précises pas, le modèle garde celle de ta photo, t-shirt froissé compris.",
        options: [
          { id: "smart", label: "Smart casual", snippet: "Tenue : veste de costume bleu marine sur un t-shirt blanc", note: "Professionnel sans être guindé : le bon compromis pour la plupart des métiers." },
          { id: "chemise", label: "Chemise ouverte", snippet: "Tenue : chemise blanche unie, col ouvert", note: "Net et lumineux, très « consultant »." },
          { id: "maille", label: "Pull en maille", snippet: "Tenue : pull fin en maille gris chiné", note: "Plus doux et accessible, idéal pour les métiers créatifs ou de l'accompagnement." },
        ],
      },
      {
        id: "fond",
        ref: "decor",
        title: "Le fond",
        why: "Le fond de ta cuisine disparaît ici. Un fond simple fait ressortir ton visage ; un fond coloré peut rappeler ta marque.",
        options: [
          { id: "studio", label: "Studio gris", snippet: "Fond uni gris clair, légèrement dégradé, comme en studio photo", note: "Neutre et intemporel : il va avec toutes les tenues." },
          { id: "bureau", label: "Bureau flouté", snippet: "Fond de bureau moderne flou avec des plantes et une baie vitrée, faible profondeur de champ", note: "Donne un contexte « au travail » sans voler l'attention." },
          { id: "couleur", label: "Couleur de marque", snippet: "Fond uni de couleur terracotta", note: "Remplace par la couleur de ta marque : tu deviens reconnaissable dans un fil." },
        ],
      },
      {
        id: "lumiere",
        ref: "lumiere",
        title: "La lumière",
        why: "C'est la lumière qui fait passer un selfie pour une photo de studio. Le plafonnier jaune de la photo d'origine doit disparaître.",
        options: [
          { id: "douce", label: "Studio doux", snippet: "Lumière douce de studio, grande source diffuse de face légèrement à gauche, ombres légères", note: "Flatteuse, sans ombres dures : la valeur sûre." },
          { id: "fenetre", label: "Fenêtre latérale", snippet: "Lumière naturelle d'une grande fenêtre sur le côté, ambiance de fin de matinée", note: "Plus vivante et chaleureuse, avec un côté du visage un peu plus sombre." },
          { id: "rembrandt", label: "Contrastée (Rembrandt)", snippet: "Éclairage contrasté façon Rembrandt, un côté du visage dans l'ombre", note: "Du caractère et de l'élégance, mais moins « corporate »." },
        ],
      },
      {
        id: "expression",
        ref: "ambiance",
        title: "L'expression",
        why: "Le modèle peut ajuster ton expression. Choisis celle qui correspond à la relation que tu veux créer avec tes clients.",
        options: [
          { id: "confiant", label: "Confiant, léger sourire", snippet: "Expression sereine et confiante, léger sourire bouche fermée", note: "Rassurant et professionnel." },
          { id: "souriant", label: "Grand sourire", snippet: "Grand sourire naturel et chaleureux", note: "Accessible et sympathique, très bien pour les métiers de service." },
          { id: "serieux", label: "Sérieux", snippet: "Expression sérieuse et concentrée, sans sourire", note: "Plus d'autorité, mais peut paraître distant." },
        ],
      },
    ],
    weak: {
      prompt: "Fais-moi une photo de profil professionnelle.",
      explanation: "Sans consigne, le modèle choisit tout à ta place : un fond au hasard, un costume générique, et il « embellit » souvent le visage au point que tu ne te reconnais plus. La phrase « garde exactement le même visage » et une décision par brique font toute la différence.",
    },
    pitfalls: [
      "Oublier de demander de garder le visage : le modèle lisse la peau, affine les traits… et ce n'est plus toi.",
      "Écrire « beau », « parfait », « magnifique » : ces mots poussent vers une peau plastique et des traits génériques.",
      "Changer trois briques en même temps entre deux essais : impossible de savoir laquelle a amélioré (ou abîmé) le résultat.",
    ],
    tips: [
      "Génère 3 ou 4 fois le même prompt et garde la version la plus ressemblante : le modèle ne tombe pas juste à chaque fois.",
      "Garde ton prompt : en ne changeant que le fond, tu obtiens une version pour LinkedIn, une pour ton site et une pour ta messagerie, avec la même tête.",
      "Montre le résultat à quelqu'un qui te connaît : s'il hésite à te reconnaître, ajoute « ne modifie pas la forme du visage, du nez ni des yeux ».",
    ],
    variants: [
      { title: "Photos d'équipe homogènes", text: "Applique exactement le même prompt (même fond, même lumière, même cadrage) à la photo de chaque collègue : toute l'équipe aura le même style sur le site." },
      { title: "Avatar illustré", text: "Remplace la dernière phrase par « style illustration vectorielle flat, couleurs pastel, traits simples » : idéal pour une communauté ou un podcast." },
      { title: "Photo pour un CV", text: "Garde le cadrage en buste et le fond gris, choisis le sourire léger : sobre et lisible, même imprimé en petit." },
    ],
  },

  {
    id: "shooting-perso",
    domain: "image",
    title: "Un shooting photo avec toi",
    tagline: "Des photos de séance pro dans le décor de ton choix, à partir d'une photo de toi.",
    intro: "Pour ton site, tes réseaux ou un article, tu as besoin de photos de toi « en situation », comme après une vraie séance photo. L'IA peut te placer dans n'importe quel décor, mais il faut lui décrire la scène comme le ferait un photographe : le lieu, la pose, la tenue, la lumière et le style des photos.",
    duration: "≈ 10 min",
    model: {
      id: "nano-banana",
      label: "Nano Banana Pro",
      why: "Il garde ton visage et ta silhouette reconnaissables tout en changeant complètement le décor, la pose et la tenue.",
    },
    ratio: "9:16",
    seed: 311,
    source: {
      label: "Une photo de toi, à mi-corps ou en pied",
      tips: [
        KEEP_FACE_TIP,
        "Une photo où l'on voit aussi ta silhouette aide le modèle à garder ta morphologie.",
        "Pas besoin de belle lumière ni de beau décor : c'est justement ce que le prompt va changer.",
      ],
      example: "Photo amateur prise au téléphone d'un homme d'une trentaine d'années, barbe courte, cheveux bruns courts, en jean et t-shirt bleu, debout dans un salon, lumière intérieure terne, photo réaliste",
    },
    template: "Photo de séance professionnelle avec la personne de la photo de référence : garde exactement son visage, sa morphologie et sa coiffure. {lieu}. {pose}. {tenue}. {lumiere}. {style}. Photo réaliste, mains et proportions naturelles.",
    fields: [],
    briques: [
      {
        id: "lieu",
        ref: "decor",
        title: "Le lieu",
        why: "Le lieu raconte ton univers : urbain et dynamique, naturel et apaisant, chic… Décris un endroit précis plutôt qu'« un beau décor ».",
        options: [
          { id: "rue", label: "Rue parisienne", snippet: "Dans une rue pavée d'un vieux quartier parisien, façades claires et balcons en fer forgé", note: "Élégant et vivant, très utilisé en lifestyle." },
          { id: "rooftop", label: "Rooftop urbain", snippet: "Sur le toit-terrasse d'un immeuble, vue dégagée sur la ville en arrière-plan", note: "Moderne et ambitieux, parfait pour un profil business." },
          { id: "plage", label: "Bord de mer", snippet: "Sur une plage au bord de l'eau, dunes et herbes hautes en arrière-plan", note: "Détendu et lumineux, pour un univers bien-être ou voyage." },
        ],
      },
      {
        id: "pose",
        ref: "action",
        title: "La pose",
        why: "Une pose figée face caméra fait « photo d'identité ». Donne une action ou une posture : c'est ce qui rend la photo naturelle.",
        options: [
          { id: "marche", label: "En marche", snippet: "La personne marche vers l'objectif d'un pas naturel, regard légèrement hors champ", note: "Le classique du shooting : mouvement, spontanéité." },
          { id: "assis", label: "Assis, regard caméra", snippet: "La personne est assise sur un muret, accoudée sur un genou, regard caméra", note: "Plus posé et engageant, on se sent regardé." },
          { id: "adosse", label: "Adossé, bras croisés", snippet: "La personne est adossée contre un mur, bras croisés, sourire franc", note: "Assurance et proximité : idéal pour une page « À propos »." },
        ],
      },
      {
        id: "tenue",
        title: "La tenue",
        why: "Sans précision, tu restes en jean et t-shirt. La tenue doit aller avec le lieu et l'image que tu veux renvoyer.",
        options: [
          { id: "lin", label: "Casual chic en lin", snippet: "Tenue casual chic : chemise en lin écru et pantalon beige", note: "Lumineux et estival, se marie avec tous les décors extérieurs." },
          { id: "noir", label: "Total look noir", snippet: "Total look noir : pull col roulé et manteau long", note: "Plus graphique et premium." },
          { id: "sport", label: "Sportswear coloré", snippet: "Tenue sportswear colorée : sweat à capuche orange et sneakers blanches", note: "Jeune et énergique, pour un univers sport ou créatif." },
        ],
      },
      {
        id: "lumiere",
        ref: "lumiere",
        title: "La lumière",
        why: "Une séance pro se fait rarement à midi : les photographes choisissent leur heure. Choisis-la aussi.",
        options: [
          { id: "golden", label: "Golden hour", snippet: "Lumière dorée de fin d'après-midi, soleil bas derrière la personne, léger halo dans les cheveux", note: "Chaleureuse et flatteuse, la lumière préférée des photographes." },
          { id: "couvert", label: "Ciel couvert", snippet: "Lumière douce de ciel couvert, sans ombres dures", note: "Très naturelle, couleurs fidèles, aucune ombre sur le visage." },
          { id: "flash", label: "Flash direct mode", snippet: "Flash direct façon photo de mode, ombre nette derrière la personne", note: "Look magazine de mode, très tendance sur les réseaux." },
        ],
      },
      {
        id: "style",
        ref: "style",
        title: "Le style des photos",
        why: "Le style donne l'unité de ta série : toutes tes photos doivent avoir l'air de sortir de la même séance.",
        options: [
          { id: "editorial", label: "Éditorial lifestyle", snippet: "Style éditorial de magazine lifestyle, couleurs chaudes et naturelles", note: "Soigné mais naturel : le plus polyvalent." },
          { id: "argentique", label: "Noir et blanc argentique", snippet: "Photo noir et blanc contrastée, grain argentique", note: "Intemporel et artistique." },
          { id: "spontane", label: "Spontané réseaux", snippet: "Style photo spontanée prise au téléphone, couleurs vives, cadrage légèrement imparfait", note: "Plus authentique, se fond dans un fil Instagram ou TikTok." },
        ],
      },
    ],
    weak: {
      prompt: "Mets-moi dans une belle photo dehors.",
      explanation: "« Une belle photo dehors » laisse le modèle tout inventer : un parc générique, une pose raide, ta tenue d'origine et une lumière plate. Décrire le lieu, la pose, la tenue et l'heure, c'est faire le travail du photographe — et obtenir une vraie photo de séance.",
    },
    pitfalls: [
      "Demander un lieu et une lumière incompatibles (« studio blanc » + « coucher de soleil ») : le modèle fait un compromis bancal.",
      "Oublier « mains et proportions naturelles » : les mains restent le point faible des modèles, surtout dans les poses complexes.",
      "Changer de style à chaque photo : ta série ressemble à des photos de banque d'images sans lien entre elles.",
    ],
    tips: [
      "Pour une série cohérente, garde le même lieu, la même lumière et le même style, et ne change que la pose.",
      "Génère en vertical (9:16) pour les stories et les reels, en carré pour le fil.",
      "Si le visage dérive, régénère : c'est souvent plus rapide que de corriger le prompt.",
    ],
    variants: [
      { title: "Photo pour une page « À propos »", text: "Choisis le rooftop ou un café, la pose adossée et le style éditorial : chaleureux et professionnel." },
      { title: "Visuel d'annonce d'événement", text: "Toi sur une scène ou devant un pupitre, flash direct mode : idéal pour annoncer une conférence ou un atelier." },
      { title: "Série de 5 posts", text: "Même lieu, même tenue, même lumière ; change uniquement la pose (marche, assis, adossé, de dos, en gros plan)." },
    ],
  },

  {
    id: "shooting-produit",
    domain: "image",
    title: "Le shooting photo de ton produit",
    tagline: "Des photos de produit dignes d'une campagne, à partir d'une photo prise sur ta table.",
    intro: "Tu as un produit, une photo au téléphone, et pas de budget pour un photographe. L'IA peut replacer ton produit dans une mise en scène de catalogue, à condition de lui demander de garder exactement ton produit (forme, couleurs, étiquette) et de décrire la scène autour avec précision.",
    duration: "≈ 10 min",
    model: {
      id: "flux2-pro",
      label: "FLUX.2 [pro]",
      why: "Très fidèle à l'image de référence et très bon en photoréalisme : ton produit et son étiquette restent reconnaissables.",
    },
    ratio: "3:4",
    seed: 321,
    source: {
      label: "Une photo de ton produit",
      tips: [
        "Photographie le produit seul, bien net, de face, étiquette lisible.",
        "Évite les reflets de flash sur le verre ou le plastique brillant : le modèle les recopie.",
        "Le décor n'a aucune importance : il sera entièrement remplacé.",
      ],
      example: "Photo amateur au téléphone d'un flacon de sérum en verre ambré avec pipette et étiquette blanche minimaliste portant le mot « LUMEN », posé sur une table de cuisine encombrée, lumière de plafonnier, image un peu terne",
    },
    template: "Photo publicitaire professionnelle de {produit} de la photo de référence : garde exactement sa forme, ses couleurs et son étiquette. {mise-en-scene}. {lumiere}. {angle}. {couleurs}. Rendu photo publicitaire haut de gamme, très net.",
    fields: [
      { id: "produit", label: "Ton produit", placeholder: "ex. la bougie parfumée en pot de céramique noire", example: "le flacon de sérum en verre ambré avec pipette" },
    ],
    briques: [
      {
        id: "mise-en-scene",
        ref: "decor",
        title: "La mise en scène",
        why: "C'est elle qui fait passer ton produit de « photo de table » à « photo de marque ». Choisis-la selon l'endroit où l'image sera vue.",
        options: [
          { id: "pierre", label: "Pierre et végétal", snippet: "Posé sur un bloc de pierre travertin beige, quelques branches d'eucalyptus autour", note: "Naturel et premium : le code des marques de cosmétiques." },
          { id: "packshot", label: "Packshot fond blanc", snippet: "Sur un fond blanc pur, sans aucun accessoire, ombre douce sous le produit", note: "Le format attendu sur les fiches produit et les marketplaces." },
          { id: "situation", label: "En situation", snippet: "Posé sur le rebord d'un lavabo en marbre, serviette en lin floue en arrière-plan", note: "Le client s'imagine déjà l'utiliser chez lui." },
        ],
      },
      {
        id: "lumiere",
        ref: "lumiere",
        title: "La lumière",
        why: "Sur un produit, la lumière révèle la matière : la transparence du verre, le grain du carton, la brillance du métal.",
        options: [
          { id: "douce", label: "Douce latérale", snippet: "Lumière douce et diffuse venant de la gauche, reflets subtils sur le verre", note: "Propre et lisible, elle met en valeur l'étiquette." },
          { id: "soleil", label: "Soleil et ombres de feuilles", snippet: "Rayon de soleil franc avec des ombres de feuillage projetées sur la scène", note: "Très tendance, évoque le naturel et l'été." },
          { id: "contre-jour", label: "Contre-jour", snippet: "Contre-jour qui fait briller le verre ambré, arrière-plan plus sombre", note: "Spectaculaire sur les matières transparentes." },
        ],
      },
      {
        id: "angle",
        ref: "angle",
        title: "L'angle de vue",
        why: "L'angle change la perception du produit : de face, il est présenté ; de dessus, il est mis en scène dans une composition.",
        options: [
          { id: "face", label: "De face, à hauteur", snippet: "Vue de face, appareil à hauteur du produit", note: "Le plus lisible : on voit la forme et l'étiquette." },
          { id: "plongee", label: "Plongée à 45°", snippet: "Vue en plongée à 45 degrés", note: "Montre le produit et la surface autour, plus de profondeur." },
          { id: "dessus", label: "Vue de dessus", snippet: "Vue de dessus à la verticale, composition à plat (flat lay)", note: "Idéal pour composer avec des accessoires, très Instagram." },
        ],
      },
      {
        id: "couleurs",
        ref: "couleurs",
        title: "La palette",
        why: "Les couleurs de la scène doivent dialoguer avec celles du produit et de ta marque, pas les écraser.",
        options: [
          { id: "neutre", label: "Neutre et sauge", snippet: "Palette neutre : beige, crème et touches de vert sauge", note: "Doux et rassurant, le produit reste la seule couleur forte." },
          { id: "ambre", label: "Monochrome ambre", snippet: "Palette monochrome dans les tons ambre et orange chaud", note: "Le décor reprend la couleur du produit : très graphique." },
          { id: "pop", label: "Pop contrastée", snippet: "Couleurs vives et contrastées, fond bleu électrique", note: "Arrête le défilement sur les réseaux, plus jeune." },
        ],
      },
    ],
    weak: {
      prompt: "Fais une belle photo de mon produit.",
      explanation: "Le modèle ne sait ni quoi garder ni où placer le produit : il le redessine à sa façon (étiquette inventée, forme modifiée) dans un décor quelconque. En nommant le produit, en exigeant de garder sa forme et son étiquette, puis en décrivant décor, lumière, angle et palette, tu obtiens une vraie photo de campagne.",
    },
    pitfalls: [
      "Ne pas écrire « garde exactement… son étiquette » : le modèle réécrit le texte de l'étiquette, souvent avec des fautes.",
      "Mettre trop d'accessoires : ton produit se perd au milieu de la scène.",
      "Utiliser l'image générée telle quelle sur une fiche produit sans vérifier : un détail du produit peut avoir changé (bouchon, couleur exacte).",
    ],
    tips: [
      "Compare toujours le résultat à ton vrai produit avant de publier : forme, couleur, texte de l'étiquette.",
      "Crée une série : même lumière et même palette, en changeant seulement la mise en scène, pour un fil Instagram cohérent.",
      "Pour une marketplace, garde le packshot fond blanc et la vue de face : ce sont souvent des exigences.",
    ],
    variants: [
      { title: "Visuel de lancement", text: "Mise en scène avec un podium ou une pierre, contre-jour et fond sombre : l'image « événement » d'un nouveau produit." },
      { title: "Coffret cadeau", text: "Ajoute « à côté d'un coffret cadeau entrouvert et d'un ruban en satin » pour tes campagnes de fêtes." },
      { title: "Bannière de site", text: "Passe en format paysage (16:9) et ajoute « produit placé à droite, grand espace vide à gauche pour un texte »." },
    ],
  },

  {
    id: "logo",
    domain: "image",
    title: "Ton logo",
    tagline: "Des pistes de logo pour ta marque, avec le bon vocabulaire de graphiste.",
    intro: "Un logo réussi est simple, lisible en petit et cohérent avec ton activité. L'IA peut te proposer des pistes en quelques minutes, à condition de lui parler comme à un graphiste : quel type de logo, quel symbole, quel style, quelles couleurs, quelle typographie.",
    duration: "≈ 10 min",
    model: {
      id: "recraft-v4-pro",
      label: "Recraft V4 Pro",
      why: "Recraft est spécialisé dans le graphisme : formes nettes, aplats propres et texte bien écrit, là où les modèles photo font des logos flous.",
    },
    ratio: "1:1",
    seed: 331,
    template: "Logo pour « {nom} », une marque de {activite}. {type}. {symbole}. {style}. {couleurs}. {typo}. Sur fond blanc uni, logo centré, sans mockup ni ombre, lisible même en petit.",
    fields: [
      { id: "nom", label: "Nom de ta marque", placeholder: "ex. Atelier Sève", example: "Maison Lumen" },
      { id: "activite", label: "Ton activité", placeholder: "ex. céramique artisanale", example: "bougies artisanales parfumées" },
    ],
    briques: [
      {
        id: "type",
        title: "Le type de logo",
        why: "C'est la première décision d'un graphiste : un symbole avec le nom, le nom seul ou des initiales. Elle change tout le reste.",
        options: [
          { id: "combine", label: "Symbole + nom", snippet: "Logo combiné : un symbole simple au-dessus du nom", note: "Le plus complet : le symbole peut ensuite vivre seul (favicon, tampon)." },
          { id: "logotype", label: "Nom seul (logotype)", snippet: "Logotype : uniquement le nom, travaillé en typographie, sans symbole", note: "Élégant et mémorisable si le nom est court." },
          { id: "monogramme", label: "Monogramme", snippet: "Monogramme : les initiales de la marque entrelacées dans un cercle", note: "Très chic, idéal pour un tampon ou une étiquette." },
        ],
      },
      {
        id: "symbole",
        ref: "sujet",
        title: "Le symbole",
        why: "Un bon symbole se résume à une idée. Dis au modèle quelle idée représenter, sinon il empile les clichés de ton secteur.",
        options: [
          { id: "objet", label: "L'objet du métier", snippet: "Symbole : une flamme de bougie stylisée, en quelques traits", note: "Direct et compréhensible. Remplace la flamme par l'objet de ton métier." },
          { id: "abstrait", label: "Forme abstraite", snippet: "Symbole : un cercle ouvert géométrique qui évoque la lumière", note: "Plus original et intemporel, mais moins explicite." },
          { id: "lettre", label: "Lettre-symbole", snippet: "Symbole : la lettre L dont le trait se termine en flamme", note: "Relie le nom et le métier en un seul signe." },
        ],
      },
      {
        id: "style",
        ref: "style",
        title: "Le style graphique",
        why: "Le style positionne ta marque : haut de gamme, artisanale, tech, ludique… C'est lui que tes clients ressentent en premier.",
        options: [
          { id: "minimal", label: "Minimaliste", snippet: "Style minimaliste et épuré, lignes fines, beaucoup d'espace", note: "Premium et moderne, vieillit bien." },
          { id: "vintage", label: "Vintage artisan", snippet: "Style vintage d'artisan, esprit tampon ou étiquette ancienne", note: "Évoque le fait main et la tradition." },
          { id: "geometrique", label: "Géométrique moderne", snippet: "Style moderne et géométrique, formes pleines et arrondies", note: "Solide et accessible, très lisible en petit." },
        ],
      },
      {
        id: "couleurs",
        ref: "couleurs",
        title: "Les couleurs",
        why: "Un logo fonctionne avec une ou deux couleurs maximum. Nomme-les précisément : « vert » ne suffit pas.",
        options: [
          { id: "noir-dore", label: "Noir et doré", snippet: "Deux couleurs : noir charbon et doré mat", note: "Luxe et raffinement." },
          { id: "vert", label: "Monochrome vert", snippet: "Une seule couleur : vert sapin profond", note: "Naturel et sobre, facile à imprimer." },
          { id: "terracotta", label: "Terracotta et crème", snippet: "Deux couleurs : terracotta et crème", note: "Chaleureux et artisanal." },
        ],
      },
      {
        id: "typo",
        ref: "texte",
        title: "La typographie",
        why: "La police porte autant de sens que le symbole. Décris sa famille (avec ou sans empattements, manuscrite) et sa casse.",
        options: [
          { id: "serif", label: "Serif élégante", snippet: "Typographie serif élégante, lettres capitales espacées", note: "Classique et haut de gamme." },
          { id: "sans", label: "Sans serif minuscules", snippet: "Typographie sans serif géométrique, en minuscules", note: "Moderne, amical, très lisible sur écran." },
          { id: "manuscrite", label: "Manuscrite", snippet: "Typographie manuscrite fluide, façon signature", note: "Personnel et créatif, à réserver aux noms courts." },
        ],
      },
    ],
    weak: {
      prompt: "Crée un logo pour ma marque de bougies.",
      explanation: "Sans nom écrit entre guillemets, le modèle invente un texte. Sans type, style ni couleurs, il produit un logo « moyen » de bougie, chargé et peu lisible. Avec les cinq décisions d'un graphiste, tu obtiens une piste exploitable.",
    },
    pitfalls: [
      "Demander un logo « avec beaucoup de détails » : illisible en petit, impossible à broder ou à imprimer sur un tampon.",
      "Ne pas mettre le nom entre guillemets : le modèle risque de l'écrire autrement ou d'ajouter du texte.",
      "Déposer ou imprimer le logo généré sans vérification : vérifie l'orthographe et qu'il ne ressemble pas à un logo existant.",
    ],
    tips: [
      "Génère plusieurs pistes en ne changeant que le style, puis affine celle qui te parle.",
      "Teste ta piste en tout petit (comme une icône d'onglet) : si on ne la reconnaît plus, simplifie le symbole.",
      "Pour un fichier vectoriel (SVG) utilisable partout, relance le même prompt avec le modèle Recraft V4 Pro Vector.",
    ],
    variants: [
      { title: "Version icône d'application", text: "Garde uniquement le symbole : « symbole seul, sans texte, centré dans un carré aux coins arrondis »." },
      { title: "Logo sur fond sombre", text: "Remplace « sur fond blanc uni » par « sur fond noir uni, logo en couleurs claires » pour vérifier qu'il fonctionne en négatif." },
      { title: "Tampon ou étiquette", text: "Choisis le monogramme et le style vintage, puis ajoute « inscrit dans un badge rond avec le nom en arc de cercle »." },
    ],
  },

  {
    id: "mockup",
    domain: "image",
    title: "Ton design en situation (mockup)",
    tagline: "Ton logo ou ton visuel sur un tote bag, un packaging, une tasse… en photo réaliste.",
    intro: "Avant d'imprimer, ou pour présenter ta marque, tu veux voir ton logo « en vrai » sur un objet. Tu importes ton logo, et l'IA l'applique sur le support de ton choix, avec la bonne matière, le bon décor et la bonne lumière. La phrase clé : ne pas modifier ton logo.",
    duration: "≈ 5 min",
    model: {
      id: "nano-banana",
      label: "Nano Banana Pro",
      why: "Excellent pour intégrer une image existante dans une scène réaliste sans la redessiner, en respectant la forme et la matière du support.",
    },
    ratio: "1:1",
    seed: 341,
    source: {
      label: "Ton logo ou ton visuel",
      tips: [
        "Utilise ton logo sur fond blanc ou transparent, en bonne résolution.",
        "Un logo simple s'applique mieux : les détails très fins peuvent se perdre sur le tissu ou le carton.",
        "Si ton logo comporte du texte, vérifie chaque lettre sur le résultat.",
      ],
      example: "Logo plat sur fond blanc : une flamme de bougie stylisée en traits fins dorés au-dessus du nom « MAISON LUMEN » en capitales serif noires espacées, design vectoriel minimaliste",
    },
    template: "Mockup photoréaliste : applique le logo de l'image de référence, sans le modifier ni le déformer, {support}. {marquage}. {decor}. {lumiere}. Photo produit réaliste, le logo épouse la forme et la matière du support.",
    fields: [],
    briques: [
      {
        id: "support",
        ref: "sujet",
        title: "Le support",
        why: "Le support est le sujet de l'image. Précise l'objet et sa matière : « un sac » ne suffit pas, « un cabas en toile de coton naturel » si.",
        options: [
          { id: "tote", label: "Tote bag", snippet: "sur un sac cabas en toile de coton naturel", note: "Le support le plus courant pour une marque éco ou créative." },
          { id: "packaging", label: "Packaging kraft", snippet: "sur le couvercle d'une boîte en carton kraft", note: "Pour visualiser ton emballage ou ton coffret." },
          { id: "mug", label: "Mug", snippet: "sur une tasse en céramique blanche", note: "Le logo doit suivre la courbure : bon test de réalisme." },
        ],
      },
      {
        id: "marquage",
        ref: "matieres",
        title: "Le marquage",
        why: "Un logo n'est jamais « collé » sur un objet : il est imprimé, brodé, gravé, doré. Le nommer rend la photo crédible.",
        options: [
          { id: "serigraphie", label: "Sérigraphie", snippet: "Le logo est imprimé en sérigraphie, aspect légèrement mat", note: "Le rendu standard, simple et propre." },
          { id: "dorure", label: "Dorure à chaud", snippet: "Le logo est en dorure à chaud, brillant et légèrement en relief", note: "Effet luxe, superbe sur le carton et le papier." },
          { id: "brode", label: "Brodé", snippet: "Le logo est brodé, on distingue les fils", note: "Très qualitatif sur le textile, mais simplifie les détails fins." },
        ],
      },
      {
        id: "decor",
        ref: "decor",
        title: "Le décor",
        why: "Le décor transforme un simple mockup en photo de marque : posé à l'atelier, porté dans la rue, ou isolé en studio.",
        options: [
          { id: "atelier", label: "Atelier bois clair", snippet: "Posé sur une table en bois clair dans un atelier lumineux", note: "Chaleureux et artisanal." },
          { id: "porte", label: "Porté en situation", snippet: "Tenu à la main par une personne dans une rue ensoleillée, cadrage centré sur l'objet", note: "Plus vivant : on voit l'objet utilisé." },
          { id: "studio", label: "Studio couleur", snippet: "Sur fond uni vert sauge, composition épurée de studio", note: "Met tout le focus sur le logo, idéal pour une présentation." },
        ],
      },
      {
        id: "lumiere",
        ref: "lumiere",
        title: "La lumière",
        why: "La lumière révèle la texture du marquage : le relief d'une dorure ou les fils d'une broderie n'apparaissent qu'avec une lumière rasante.",
        options: [
          { id: "naturelle", label: "Naturelle douce", snippet: "Lumière naturelle douce du matin", note: "Réaliste et flatteuse." },
          { id: "studio", label: "Studio nette", snippet: "Lumière de studio nette avec une ombre portée marquée", note: "Très graphique, look catalogue." },
          { id: "chaude", label: "Chaude et cosy", snippet: "Lumière chaude de fin de journée, ambiance cosy", note: "Ambiance, idéale pour les réseaux sociaux." },
        ],
      },
    ],
    weak: {
      prompt: "Mets mon logo sur un sac.",
      explanation: "Sans « sans le modifier », le modèle redessine ton logo à sa manière. Sans matière ni marquage, il le pose à plat comme un autocollant. Le support, le marquage, le décor et la lumière font passer un montage approximatif à une vraie photo produit.",
    },
    pitfalls: [
      "Oublier « sans le modifier ni le déformer » : c'est la cause n°1 des logos réinventés ou mal orthographiés.",
      "Choisir un marquage impossible (broderie sur une tasse) : le résultat sonne faux.",
      "Présenter le mockup à un fournisseur comme rendu final : c'est une simulation, les couleurs imprimées peuvent varier.",
    ],
    tips: [
      "Pour toute ta gamme, garde le décor et la lumière, et change seulement le support : tu obtiens une planche cohérente.",
      "Présente 2 ou 3 mockups à tes clients ou à ton imprimeur : bien plus parlant qu'un fichier de logo seul.",
      "Si le logo est un peu déformé, régénère : le modèle ne tombe pas juste à chaque fois.",
    ],
    variants: [
      { title: "Enseigne de boutique", text: "Support : « sur une enseigne en bois peinte au-dessus de la vitrine d'une boutique », marquage peint à la main." },
      { title: "Écran de site", text: "Support : « sur l'écran d'un ordinateur portable posé sur un bureau », pour présenter ton site ou ta charte." },
      { title: "Carte de visite", text: "Support : « sur une pile de cartes de visite en papier épais texturé », marquage en dorure à chaud." },
    ],
  },

  {
    id: "visuel-pub",
    domain: "image",
    title: "Un visuel pub pour les réseaux",
    tagline: "Une image qui arrête le défilement sur Instagram ou Facebook.",
    intro: "Sur les réseaux, ton visuel a moins d'une seconde pour arrêter le pouce. Il faut une idée de mise en scène forte, une composition claire et une palette qui tranche. Ici, on construit le visuel sans texte : tu ajouteras ton accroche ensuite (dans Canva par exemple), dans l'espace prévu pour.",
    duration: "≈ 10 min",
    model: {
      id: "flux2-pro",
      label: "FLUX.2 [pro]",
      why: "Photoréaliste, très précis sur la composition et les matières, et il accepte une graine : tu peux faire varier une seule brique à la fois.",
    },
    ratio: "3:4",
    seed: 351,
    template: "Visuel publicitaire pour Instagram mettant en scène {produit}. {concept}. {composition}. {lumiere}. {couleurs}. {style}. Espace vide en haut de l'image pour ajouter un texte.",
    fields: [
      { id: "produit", label: "Ton produit ou service", placeholder: "ex. une gourde isotherme en inox mat", example: "une paire de baskets blanches en toile" },
    ],
    briques: [
      {
        id: "concept",
        ref: "action",
        title: "L'idée de mise en scène",
        why: "C'est l'idée qui fait la pub, pas le produit. Une situation surprenante ou désirable vaut mieux qu'un produit posé.",
        options: [
          { id: "levitation", label: "Lévitation spectaculaire", snippet: "Le produit flotte en lévitation au-dessus d'une flaque d'eau, gouttes figées en l'air", note: "Effet « waouh » qui arrête le défilement." },
          { id: "action", label: "En action", snippet: "Le produit est porté par une personne qui saute dans la rue, cadrage sur les pieds", note: "Montre l'usage et l'énergie de la marque." },
          { id: "nature-morte", label: "Nature morte", snippet: "Le produit est posé sur un socle au milieu de fleurs séchées", note: "Plus calme et esthétique, côté marque premium." },
        ],
      },
      {
        id: "composition",
        ref: "cadrage",
        title: "La composition",
        why: "Ton visuel sera vu en petit sur un téléphone et recevra un texte. La composition doit laisser respirer le produit.",
        options: [
          { id: "centre", label: "Centré et aéré", snippet: "Produit centré, plan rapproché, beaucoup d'air autour", note: "Simple et efficace, le produit est le héros." },
          { id: "tiers", label: "Tiers inférieur", snippet: "Produit placé dans le tiers inférieur, grand espace au-dessus", note: "Laisse beaucoup de place au texte de l'annonce." },
          { id: "macro", label: "Macro matière", snippet: "Très gros plan sur la matière et les coutures du produit", note: "Met en avant la qualité, intrigue." },
        ],
      },
      {
        id: "lumiere",
        ref: "lumiere",
        title: "La lumière",
        why: "La lumière donne le ton de la pub : studio pour le premium, soleil pour le lifestyle, néons pour la nuit.",
        options: [
          { id: "studio", label: "Studio contrastée", snippet: "Lumière de studio contrastée, reflets nets", note: "Look campagne, matières très lisibles." },
          { id: "soleil", label: "Plein soleil", snippet: "Lumière naturelle de plein soleil, ombres courtes et franches", note: "Été, énergie, liberté." },
          { id: "neons", label: "Néons de nuit", snippet: "Éclairage de néons colorés rose et bleu, ambiance de nuit", note: "Urbain et tendance, très visible dans un fil." },
        ],
      },
      {
        id: "couleurs",
        ref: "couleurs",
        title: "La palette",
        why: "Une palette qui tranche avec les publications voisines arrête l'œil. Deux ou trois couleurs, pas plus.",
        options: [
          { id: "pastel", label: "Pastel frais", snippet: "Décor dans des tons pastel bleu ciel et blanc", note: "Doux et lumineux." },
          { id: "jaune", label: "Jaune pop", snippet: "Fond jaune vif uni, couleurs saturées", note: "Impossible à rater dans un fil." },
          { id: "sombre", label: "Sombre premium", snippet: "Tons sombres et dramatiques, noir et anthracite", note: "Élégant, fait ressortir un produit clair." },
        ],
      },
      {
        id: "style",
        ref: "rendu",
        title: "Le style de rendu",
        why: "Photo publicitaire, rendu 3D ou esthétique argentique : le style dit à quelle famille de marques tu appartiens.",
        options: [
          { id: "pub", label: "Pub haut de gamme", snippet: "Style photo publicitaire haut de gamme, image très nette", note: "Le standard des grandes marques." },
          { id: "3d", label: "3D surréaliste", snippet: "Style rendu 3D surréaliste, matières lisses et brillantes", note: "Très tendance, effet « impossible »." },
          { id: "argentique", label: "Argentique années 90", snippet: "Style photo argentique des années 90, léger grain, couleurs un peu passées", note: "Authentique et nostalgique." },
        ],
      },
    ],
    weak: {
      prompt: "Fais une pub Instagram pour mes baskets.",
      explanation: "Le modèle produit une photo de baskets correcte mais banale, sans idée, et souvent avec un faux texte illisible. En décidant de l'idée, de la composition, de la lumière, de la palette et du style — et en réservant l'espace du texte — tu obtiens un visuel de campagne.",
    },
    pitfalls: [
      "Demander au modèle d'écrire ton accroche dans l'image : le texte est souvent déformé. Ajoute-le après dans un outil de mise en page.",
      "Changer d'univers à chaque publication : ton fil n'a plus d'identité.",
      "Oublier l'espace pour le texte : ton accroche finit par cacher le produit.",
    ],
    tips: [
      "Une fois le visuel trouvé, garde la graine et le prompt : change seulement le produit pour toute ta gamme.",
      "Crée 3 visuels qui ne diffèrent que par l'idée de mise en scène, et teste-les en publicité : garde celui qui performe.",
      "Pour une story, passe en 9:16 et garde l'espace texte en haut et en bas.",
    ],
    variants: [
      { title: "Promotion ou soldes", text: "Palette jaune pop, composition tiers inférieur : l'espace du haut accueillera « -30 % »." },
      { title: "Carrousel", text: "Même lumière, même palette, même style ; change l'idée de mise en scène à chaque image." },
      { title: "Bannière Facebook ou LinkedIn", text: "Passe en 16:9 et remplace la dernière phrase par « espace vide à gauche pour un texte »." },
    ],
  },

  {
    id: "affiche",
    domain: "image",
    title: "Une affiche ou un flyer",
    tagline: "Une affiche d'événement lisible, avec ton titre et tes infos correctement écrits.",
    intro: "Une affiche, c'est un visuel ET du texte. Les modèles récents savent écrire, à condition de leur donner le texte exact entre guillemets, peu de mots, et une hiérarchie claire. Le reste se décrit comme pour toute image : visuel central, style, couleurs, typographie.",
    duration: "≈ 10 min",
    model: {
      id: "gpt-image-2",
      label: "GPT Image 2",
      why: "C'est l'un des modèles du Studio qui écrit le mieux le texte, même sur plusieurs lignes, et il suit fidèlement une mise en page décrite.",
    },
    ratio: "2:3",
    template: "Affiche verticale pour un événement. Titre en grand, écrit exactement : « {titre} ». En bas, en plus petit, écrit exactement : « {infos} ». {visuel}. {style}. {couleurs}. {typo}. {hierarchie}. Texte parfaitement lisible, sans faute, aucun autre texte.",
    fields: [
      { id: "titre", label: "Titre de l'événement", placeholder: "ex. ATELIER CÉRAMIQUE", example: "SOIRÉE JAZZ AU JARDIN" },
      { id: "infos", label: "Date, heure et lieu", placeholder: "ex. Dimanche 6 avril · 14h · Atelier Sève", example: "Samedi 14 juin · 19h · Entrée libre" },
    ],
    briques: [
      {
        id: "visuel",
        ref: "sujet",
        title: "Le visuel central",
        why: "Le visuel dit en un coup d'œil de quel événement il s'agit. Un seul élément fort vaut mieux qu'une scène chargée.",
        options: [
          { id: "objet", label: "Objet emblématique", snippet: "Visuel central : un saxophone entouré de guirlandes lumineuses dans un jardin la nuit", note: "Clair et immédiat." },
          { id: "scene", label: "Scène avec personnages", snippet: "Visuel central : silhouettes de musiciens en contre-jour sous les arbres", note: "Plus d'émotion, montre l'ambiance." },
          { id: "abstrait", label: "Motifs abstraits", snippet: "Visuel : motifs abstraits de notes de musique et de formes ondulées", note: "Graphique et moderne, laisse toute la place au titre." },
        ],
      },
      {
        id: "style",
        ref: "style",
        title: "Le style",
        why: "Le style dit le ton de l'événement : festif, chic, militant, familial…",
        options: [
          { id: "flat", label: "Illustration flat", snippet: "Style illustration flat moderne, aplats de couleurs", note: "Contemporain, très lisible." },
          { id: "serigraphie", label: "Sérigraphie vintage", snippet: "Style affiche de concert sérigraphiée vintage, texture de papier", note: "Authentique, esprit festival." },
          { id: "duotone", label: "Photo duotone", snippet: "Style photo réaliste avec effet duotone", note: "Impactant et moderne." },
        ],
      },
      {
        id: "couleurs",
        ref: "couleurs",
        title: "Les couleurs",
        why: "Une affiche se voit de loin : il faut un fort contraste entre le texte et le fond.",
        options: [
          { id: "nuit", label: "Bleu nuit et moutarde", snippet: "Palette bleu nuit, jaune moutarde et crème", note: "Chic et lisible, le jaune fait ressortir le titre." },
          { id: "jungle", label: "Vert jungle et corail", snippet: "Palette vert jungle et rose corail", note: "Festif et estival." },
          { id: "accent", label: "Noir et blanc + rouge", snippet: "Noir et blanc avec une seule couleur d'accent rouge vif", note: "Très graphique, maximum de contraste." },
        ],
      },
      {
        id: "typo",
        ref: "texte",
        title: "La typographie",
        why: "Sur une affiche, la typographie du titre EST une partie du visuel. Décris-la autant que l'image.",
        options: [
          { id: "massive", label: "Sans serif massive", snippet: "Titre en typographie sans serif extra-grasse, très grande", note: "Se lit de loin, impact maximal." },
          { id: "artdeco", label: "Art déco", snippet: "Titre en typographie Art déco élégante", note: "Chic, parfait pour le jazz ou une soirée." },
          { id: "pinceau", label: "Pinceau", snippet: "Titre en lettres manuscrites tracées au pinceau", note: "Convivial et fait main." },
        ],
      },
      {
        id: "hierarchie",
        ref: "format",
        title: "La mise en page",
        why: "Le modèle doit savoir où placer quoi. Sans consigne, il disperse le texte n'importe où.",
        options: [
          { id: "classique", label: "Classique en 3 niveaux", snippet: "Le titre occupe le tiers supérieur, le visuel le centre, les infos un bandeau en bas", note: "La plus lisible, celle qu'on lit sans effort." },
          { id: "diagonale", label: "Titre en diagonale", snippet: "Le titre traverse l'affiche en diagonale, intégré au visuel", note: "Dynamique et original." },
          { id: "minimal", label: "Minimaliste", snippet: "Composition minimaliste : beaucoup d'espace vide, petit visuel centré", note: "Élégant, très design." },
        ],
      },
    ],
    weak: {
      prompt: "Fais une affiche pour ma soirée jazz samedi.",
      explanation: "Sans texte exact, le modèle invente un titre, une date fantaisiste et des phrases illisibles. En lui donnant le texte entre guillemets, peu de mots, une hiérarchie et un style, tu obtiens une affiche exploitable.",
    },
    pitfalls: [
      "Mettre trop de texte (programme, tarifs, réseaux sociaux) : plus il y a de mots, plus il y a de fautes.",
      "Ne pas écrire « aucun autre texte » : le modèle ajoute des slogans inventés.",
      "Imprimer sans relire chaque lettre, chaque chiffre de la date et de l'heure.",
    ],
    tips: [
      "Titre court (2 à 5 mots) et une seule ligne d'infos : c'est ce que les modèles écrivent le mieux.",
      "Si une lettre est fausse, régénère plutôt que de reformuler : le texte change à chaque tirage.",
      "Pour un flyer imprimé avec plus d'infos, génère l'affiche sans le bandeau du bas et ajoute les détails dans Canva.",
    ],
    variants: [
      { title: "Story d'annonce", text: "Même prompt en format 9:16 : ton affiche devient une story Instagram." },
      { title: "Atelier ou formation", text: "Visuel : les mains d'une personne en train de faire l'activité ; style illustration flat ; palette douce." },
      { title: "Série pour une saison", text: "Garde style, typographie et mise en page ; ne change que le visuel et les couleurs à chaque événement." },
    ],
  },

  {
    id: "miniature-youtube",
    domain: "image",
    title: "Une miniature YouTube",
    tagline: "Une miniature avec ton visage et un titre qui donne envie de cliquer.",
    intro: "La miniature décide si on clique sur ta vidéo. Les codes qui marchent sont connus : un visage expressif, peu de mots écrits très gros, un fond contrasté. Tu importes une photo de toi, et tu décris chacun de ces éléments.",
    duration: "≈ 10 min",
    model: {
      id: "nano-banana",
      label: "Nano Banana Pro",
      why: "Il garde ton visage d'après ta photo et sait écrire un titre court lisible dans l'image.",
    },
    ratio: "16:9",
    seed: 371,
    source: {
      label: "Une photo de toi",
      tips: [
        KEEP_FACE_TIP,
        "Une photo face caméra fonctionne le mieux, l'expression sera ajustée par le prompt.",
        "Évite un arrière-plan trop chargé : il sera remplacé, mais un fond simple aide le modèle à te détourer.",
      ],
      example: "Photo prise au téléphone d'une jeune femme d'environ 28 ans aux cheveux bouclés, face caméra, expression neutre, dans un salon, lumière moyenne, photo amateur réaliste",
    },
    template: "Miniature YouTube pour une vidéo sur {sujet}. Intègre la personne de la photo de référence en gardant exactement son visage. {expression}. {composition}. Texte en grand, écrit exactement : « {titre} ». {texte}. {fond}. Couleurs très contrastées, lisible même en tout petit.",
    fields: [
      { id: "sujet", label: "Sujet de ta vidéo", placeholder: "ex. mes astuces pour mieux dormir", example: "les outils d'intelligence artificielle" },
      { id: "titre", label: "Texte de la miniature (2 à 4 mots)", placeholder: "ex. DORMIR EN 5 MIN", example: "J'AI TESTÉ 5 IA" },
    ],
    briques: [
      {
        id: "expression",
        ref: "ambiance",
        title: "L'expression",
        why: "Le visage est ce que l'œil voit en premier. Une émotion franche et lisible donne envie de savoir ce qui se passe.",
        options: [
          { id: "surprise", label: "Surprise", snippet: "La personne a une expression de surprise, bouche ouverte, sourcils levés", note: "Le grand classique : curiosité garantie." },
          { id: "complice", label: "Complice", snippet: "La personne sourit avec un air complice, un sourcil levé", note: "Promet un secret ou une astuce." },
          { id: "sceptique", label: "Sceptique", snippet: "La personne a l'air sceptique, bras croisés", note: "Parfait pour un test ou un avis critique." },
        ],
      },
      {
        id: "composition",
        ref: "cadrage",
        title: "La composition",
        why: "Une miniature se lit en une fraction de seconde : visage d'un côté, texte de l'autre, rien qui se chevauche.",
        options: [
          { id: "droite", label: "Visage à droite, texte à gauche", snippet: "La personne est à droite, cadrée en buste, le texte à gauche", note: "La disposition la plus lisible." },
          { id: "centre", label: "Centré, texte au-dessus", snippet: "La personne est au centre en gros plan, le texte au-dessus de sa tête", note: "Très fort impact, mais attention à l'horodatage en bas à droite." },
          { id: "pointe", label: "Geste qui pointe", snippet: "La personne, à gauche, pointe du doigt le texte placé à droite", note: "Guide l'œil vers le message." },
        ],
      },
      {
        id: "texte",
        ref: "texte",
        title: "Le style du texte",
        why: "Le texte doit rester lisible sur un écran de téléphone : gros, gras, contrasté.",
        options: [
          { id: "contour", label: "Blanc à contour noir", snippet: "Texte en lettres blanches très grasses avec un contour noir épais", note: "Lisible sur n'importe quel fond." },
          { id: "bandeau", label: "Jaune sur bandeau noir", snippet: "Texte jaune vif sur un bandeau noir légèrement incliné", note: "Très visible, effet « info choc »." },
          { id: "neon", label: "Néon violet", snippet: "Texte en dégradé néon violet avec une lueur", note: "Univers tech ou gaming." },
        ],
      },
      {
        id: "fond",
        ref: "decor",
        title: "Le fond",
        why: "Le fond doit évoquer le sujet sans gêner la lecture du visage et du texte.",
        options: [
          { id: "bureau", label: "Bureau tech flou", snippet: "Fond flou d'un bureau avec des écrans d'ordinateur, teinte bleue", note: "Contexte clair, ne vole pas l'attention." },
          { id: "uni", label: "Fond uni vif", snippet: "Fond uni rouge vif", note: "Contraste maximal, ultra lisible." },
          { id: "icones", label: "Icônes flottantes", snippet: "Fond avec des icônes d'applications génériques qui flottent autour", note: "Illustre directement le sujet. Évite les vrais logos de marques." },
        ],
      },
    ],
    weak: {
      prompt: "Fais une miniature YouTube avec moi pour ma vidéo sur l'IA.",
      explanation: "Le modèle compose une image chargée, avec un titre inventé et souvent mal écrit, et un visage peu expressif. Les codes d'une miniature qui marche (une émotion, un texte court exact, une composition en deux zones, un fond contrasté) doivent être demandés un par un.",
    },
    pitfalls: [
      "Écrire une phrase entière : au-delà de 4 ou 5 mots, c'est illisible en petit et souvent mal orthographié.",
      "Placer du texte en bas à droite : la durée de la vidéo s'affiche par-dessus.",
      "Utiliser de vrais logos de marques dans le fond : risque de droits et de fautes de dessin.",
    ],
    tips: [
      "Regarde ta miniature en tout petit (comme sur un téléphone) avant de la publier : si le texte ne se lit plus, raccourcis-le.",
      "Garde la même composition et le même style de texte pour toute ta chaîne : on reconnaît tes vidéos d'un coup d'œil.",
      "Génère deux versions avec deux expressions différentes et teste-les avec la fonction de test de miniatures de YouTube.",
    ],
    variants: [
      { title: "Vidéo tutoriel", text: "Expression complice, composition « geste qui pointe », fond représentant l'outil montré." },
      { title: "Avant / après", text: "Ajoute « image coupée en deux : à gauche avant, à droite après » et un texte de deux mots." },
      { title: "Couverture de podcast", text: "Passe en 1:1, expression souriante, fond uni de la couleur de ta marque." },
    ],
  },
];
