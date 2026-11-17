// Guide IA — cas pratiques Vidéo. Même grammaire que les cas Image : un
// template à emplacements, des briques à options, des exemples générés dans
// Le Studio (scripts/generate-astuces-media.mjs --as=<email>). Les vidéos
// sans graine bougent un peu d'un essai à l'autre : pour isoler une brique, les
// cas animent une image de départ commune (image-to-video), et deux d'entre
// eux reprennent directement un résultat des cas Image (portrait, logo).
// Première version rédigée pour relecture par les formateurs ; modifier un
// passage qui entre dans un prompt implique de régénérer les exemples du cas
// (npm run astuces:media -- --only=cas/<id> --force --as=<email>).
import type { AstuceCas } from "./types";

// Seedance 2.0 Fast : modèle image-to-video du Studio qui accepte l'image de
// départ telle que Le Studio l'envoie. Testés le 2026-11-17 : Kling VIDEO 3.0
// Pro refuse frameImages, « Kling » (klingai:5@3) n'existe plus chez Runware —
// le catalogue du Studio est à corriger avant de les conseiller ici.
const ANIMATE = {
  id: "seedance-2-0-fast",
  label: "Seedance 2.0 Fast",
  why: "Seedance anime une image avec une grande fidélité : le produit, le visage ou le logo de départ restent reconnaissables, les mouvements de caméra sont fluides, et il est rapide.",
};

export const VIDEO_CAS: AstuceCas[] = [
  {
    id: "video-produit",
    domain: "video",
    title: "Ton produit en mouvement",
    tagline: "Une photo de produit qui devient une vidéo publicitaire pour tes stories et tes reels.",
    intro: "Une vidéo arrête le défilement bien mieux qu'une photo. Pas besoin de tournage : tu pars de la photo de ton produit et l'IA l'anime. Tout l'enjeu est de décrire trois choses séparément : ce que fait la caméra, ce qui bouge dans la scène, et comment la lumière évolue, tout en exigeant que le produit reste identique.",
    duration: "≈ 10 min",
    model: ANIMATE,
    ratio: "9:16",
    video: { duration: "5" },
    source: {
      label: "Une photo de ton produit, au format vertical",
      tips: [
        "Pars d'une photo déjà belle : l'IA anime, elle ne corrige pas un mauvais cadrage. Le cas « Le shooting photo de ton produit » t'aide à la créer.",
        "Choisis le même format que la vidéo (vertical 9:16 pour les stories) : sinon l'image est recadrée.",
        "Laisse de l'air autour du produit : la caméra a besoin de place pour bouger.",
      ],
      example: "Photo publicitaire verticale d'un flacon de sérum en verre ambré avec pipette et étiquette blanche minimaliste portant le mot « LUMEN », posé sur un bloc de pierre travertin beige avec quelques branches d'eucalyptus, fond beige uni, lumière douce latérale, rendu photo haut de gamme très net",
    },
    template: "Anime la photo de référence comme une publicité cosmétique haut de gamme. {camera}. {action}. {lumiere}. Le flacon, sa forme et son étiquette restent parfaitement identiques et nets du début à la fin, sans aucune déformation.",
    fields: [],
    briques: [
      {
        id: "camera",
        title: "Le mouvement de caméra",
        why: "C'est lui qui donne l'impression d'un vrai tournage. Un seul mouvement, lent et nommé avec le vocabulaire du cinéma : l'IA sait exactement quoi faire.",
        options: [
          { id: "travelling", label: "Travelling avant", snippet: "La caméra avance très lentement vers le flacon, en travelling avant", note: "On entre dans l'image : le regard est guidé vers le produit." },
          { id: "orbite", label: "Orbite", snippet: "La caméra tourne lentement autour du flacon, en orbite d'un quart de tour", note: "On découvre le volume du produit : très « publicité de luxe »." },
          { id: "fixe", label: "Caméra fixe", snippet: "Caméra parfaitement fixe, plan stable", note: "Seule la scène bouge : idéal pour un effet « photo vivante »." },
        ],
      },
      {
        id: "action",
        title: "Ce qui bouge dans la scène",
        why: "Sans élément animé, ta vidéo n'est qu'une photo qui glisse. Choisis un détail qui bouge et qui raconte quelque chose du produit : la fraîcheur, la nature, la texture.",
        options: [
          { id: "eucalyptus", label: "Feuillage", snippet: "Les branches d'eucalyptus frémissent doucement sous une brise légère", note: "Naturel et apaisant : on sent l'air autour du produit." },
          { id: "goutte", label: "Goutte au ralenti", snippet: "Une goutte de sérum tombe de la pipette au ralenti et éclabousse doucement la pierre", note: "Montre la texture du produit : très efficace en accroche." },
          { id: "brume", label: "Brume", snippet: "Une brume légère et fraîche passe devant le flacon puis se dissipe", note: "Mystère et fraîcheur : un effet de révélation." },
        ],
      },
      {
        id: "lumiere",
        title: "La lumière qui évolue",
        why: "En vidéo, la lumière peut changer pendant le plan. Un reflet qui glisse sur le verre suffit à rendre l'image vivante et premium.",
        options: [
          { id: "reflet", label: "Reflet qui glisse", snippet: "Un reflet lumineux glisse lentement sur le verre ambré de gauche à droite", note: "Discret et élégant : le verre semble vivant." },
          { id: "soleil", label: "Ombres de feuillage", snippet: "Des ombres de feuillage bougent doucement sur la scène, comme sous un arbre en plein soleil", note: "Évoque l'été et la nature, très tendance sur les réseaux." },
          { id: "contre-jour", label: "Contre-jour qui monte", snippet: "La lumière passe progressivement en contre-jour et fait briller le sérum dans le flacon", note: "Spectaculaire : le produit s'illumine de l'intérieur." },
        ],
      },
    ],
    weak: {
      prompt: "Fais bouger mon produit.",
      explanation: "Sans consigne, l'IA invente un mouvement au hasard : le flacon tourne sur lui-même, l'étiquette se déforme, la caméra hésite. En séparant caméra, élément animé et lumière, et en exigeant que le produit reste identique, tu obtiens un vrai plan de publicité.",
    },
    pitfalls: [
      "Demander plusieurs mouvements de caméra à la fois (« zoom, puis orbite, puis plongée ») : le clip dure 5 secondes, l'image se déforme.",
      "Oublier de dire que le produit reste identique : l'étiquette se met à onduler ou le texte change.",
      "Animer le produit lui-même (« le flacon s'ouvre ») : c'est là que l'IA se trompe le plus. Fais bouger ce qui est autour.",
    ],
    tips: [
      "Génère 2 ou 3 versions du même prompt : chaque essai est différent, garde la plus propre.",
      "Monte plusieurs clips de 5 secondes avec des mouvements différents : tu obtiens une vraie publicité de 15 secondes.",
      "Pour une boucle parfaite, choisis la caméra fixe et un mouvement continu (feuillage, ombres).",
    ],
    variants: [
      { title: "Format carré pour le fil", text: "Pars d'une photo carrée et génère en 1:1 : même prompt, parfait pour un post Instagram ou LinkedIn." },
      { title: "Lancement produit", text: "Remplace la brume par « le flacon apparaît dans un rayon de lumière, sur fond sombre » pour une vidéo d'annonce." },
      { title: "Fiche produit vivante", text: "Caméra fixe et reflet qui glisse : une vidéo discrète qui remplace la photo principale de ta boutique en ligne." },
    ],
  },

  {
    id: "portrait-anime",
    domain: "video",
    title: "Ta photo qui prend vie",
    tagline: "Ta photo de profil devient une courte vidéo de présentation, naturelle et chaleureuse.",
    intro: "Une photo qui bouge attire l'œil sur une page « À propos », un profil ou une signature d'e-mail. L'IA peut animer ton portrait, à condition de rester subtile : une expression, un geste, un mouvement de caméra. Plus tu en demandes, plus le visage risque de changer.",
    duration: "≈ 5 min",
    model: ANIMATE,
    ratio: "1:1",
    video: { duration: "5" },
    source: {
      label: "Ton portrait",
      tips: [
        "Pars d'un portrait net, visage bien éclairé, de face ou de trois quarts : le cas « Ta photo de profil pro » te montre comment le créer.",
        "Garde un fond simple : un décor chargé se met à bouger de façon étrange.",
        "Un cadrage en buste laisse la place aux gestes des mains et des épaules.",
      ],
      fromKey: "cas/photo-profil/resultat",
    },
    template: "Anime le portrait de référence en gardant exactement le même visage, les mêmes traits et la même coiffure. {expression}. {camera}. {ambiance}. Mouvements naturels et subtils, sans aucune déformation du visage, cheveux et vêtements réalistes.",
    fields: [],
    briques: [
      {
        id: "expression",
        title: "L'expression et le geste",
        why: "C'est ce qui donne vie au portrait. Décris une seule action, simple et naturelle : un sourire, un rire, un salut. Les gestes complexes déforment le visage et les mains.",
        options: [
          { id: "sourire", label: "Sourire et hochement", snippet: "La personne sourit doucement puis hoche légèrement la tête, l'air confiant", note: "Chaleureux et professionnel : parfait pour un profil." },
          { id: "rire", label: "Rire franc", snippet: "La personne éclate d'un rire naturel, les épaules se relâchent", note: "Très humain et sympathique, idéal pour une page « À propos »." },
          { id: "salut", label: "Petit salut", snippet: "La personne lève la main et fait un petit salut amical à la caméra", note: "Accueillant, mais les mains restent le point fragile des IA." },
        ],
      },
      {
        id: "camera",
        title: "Le mouvement de caméra",
        why: "Un léger mouvement de caméra rend la vidéo cinématographique. Sur un portrait, il doit rester très lent pour ne pas voler la vedette au visage.",
        options: [
          { id: "avance", label: "Avancée lente", snippet: "La caméra avance très lentement vers le visage", note: "Crée de la proximité, comme si on s'approchait pour écouter." },
          { id: "fixe", label: "Caméra fixe", snippet: "Caméra parfaitement fixe", note: "Le plus sûr pour garder le visage intact." },
          { id: "arc", label: "Arc de cercle", snippet: "La caméra glisse lentement en arc de cercle, de trois quarts vers la face", note: "Très cinéma, mais le visage est vu sous un nouvel angle : risque de changement." },
        ],
      },
      {
        id: "ambiance",
        title: "L'ambiance qui bouge",
        why: "L'arrière-plan et la lumière peuvent aussi vivre. Un détail suffit à transformer un portrait figé en vraie vidéo.",
        options: [
          { id: "studio", label: "Studio stable", snippet: "Lumière de studio douce et stable, fond uni", note: "Sobre : toute l'attention reste sur la personne." },
          { id: "rayon", label: "Rayon de soleil", snippet: "Un rayon de soleil chaud passe lentement sur le visage et le fond", note: "Chaleur et émotion, comme une fin d'après-midi." },
          { id: "bokeh", label: "Fond vivant", snippet: "Le fond devient un bureau flou où des reflets lumineux bougent doucement", note: "On place la personne dans un contexte, sans détourner le regard." },
        ],
      },
    ],
    weak: {
      prompt: "Fais bouger ma photo.",
      explanation: "Sans consigne, l'IA fait parler la personne, bouger la tête dans tous les sens ou change carrément son visage. En imposant de garder le visage, une seule action, une caméra lente et une ambiance, le portrait reste le tien et devient vivant.",
    },
    pitfalls: [
      "Demander de parler ou de chanter : les lèvres bougent sans son et sans synchronisation. Pour une vraie vidéo parlée, utilise le module avatar (talking head) du Studio.",
      "Enchaîner plusieurs gestes : en 5 secondes, l'IA déforme le visage pour tout faire.",
      "Partir d'une photo floue ou de groupe : le modèle ne sait pas quel visage garder.",
    ],
    tips: [
      "Compare toujours la première et la dernière image de la vidéo : si le visage a changé, régénère avec la caméra fixe.",
      "Une version en boucle (caméra fixe, sourire léger) fait une très bonne photo de profil animée là où c'est accepté.",
      "Fais valider la vidéo par la personne représentée avant de la publier.",
    ],
    variants: [
      { title: "Présentation d'équipe", text: "Applique le même prompt à chaque portrait de l'équipe : tout le monde sourit et hoche la tête de la même façon sur la page « Qui sommes-nous »." },
      { title: "Signature d'e-mail", text: "Caméra fixe, sourire léger, durée 5 secondes : exporte la vidéo en GIF pour l'intégrer à ta signature." },
      { title: "Remerciement client", text: "Choisis le petit salut et ajoute « l'air reconnaissant » : une vidéo courte pour remercier après un achat." },
    ],
  },

  {
    id: "plan-intro",
    domain: "video",
    title: "Le plan d'ouverture de ta vidéo",
    tagline: "Un plan cinématographique avec le son, pour ouvrir une vidéo YouTube, une présentation ou ton site.",
    intro: "Les premières secondes décident si on regarde la suite. Un beau plan d'ouverture, c'était un tournage ; aujourd'hui, un prompt suffit. Ici, pas d'image de départ : tu décris toute la scène. Pense comme un réalisateur : quel plan, quel mouvement de caméra, quelle lumière, et quel son.",
    duration: "≈ 10 min",
    model: {
      id: "veo-3-1-fast",
      label: "Veo 3.1 Fast",
      why: "Veo génère l'image et le son en même temps : bruits, ambiance, musique. C'est aujourd'hui l'un des modèles les plus réalistes pour une scène décrite uniquement par le texte.",
    },
    ratio: "16:9",
    video: { duration: "6", sound: true },
    template: "Plan d'ouverture cinématographique : {sujet}. {plan}. {camera}. {lumiere}. {son}.",
    fields: [
      { id: "sujet", label: "Ton sujet", placeholder: "ex. un fleuriste compose un bouquet dans sa boutique, à l'ouverture", example: "une céramiste façonne un bol sur son tour, dans un atelier rempli de poteries" },
    ],
    briques: [
      {
        id: "plan",
        title: "Le plan",
        why: "La distance entre la caméra et le sujet raconte une histoire différente : le lieu, la personne ou le geste. C'est le premier choix d'un réalisateur.",
        options: [
          { id: "large", label: "Plan large", snippet: "Plan large qui montre tout l'atelier", note: "On découvre le lieu : idéal pour ouvrir une vidéo." },
          { id: "mains", label: "Gros plan sur les mains", snippet: "Gros plan sur les mains dans l'argile humide", note: "Le geste et la matière : immersif et sensoriel." },
          { id: "drone", label: "Vue aérienne", snippet: "Vue aérienne par drone qui plonge vers l'atelier à travers une verrière", note: "Spectaculaire, mais le sujet devient petit." },
        ],
      },
      {
        id: "camera",
        title: "Le mouvement de caméra",
        why: "La caméra qui bouge donne le ton : calme, documentaire ou énergique. Un seul mouvement, décrit avec sa vitesse.",
        options: [
          { id: "travelling", label: "Travelling lent", snippet: "Lent travelling latéral de gauche à droite", note: "Élégant et posé : le classique des films de marque." },
          { id: "epaule", label: "Caméra à l'épaule", snippet: "Caméra à l'épaule, légers mouvements naturels", note: "Effet documentaire : vrai, proche, sans mise en scène." },
          { id: "fixe", label: "Plan fixe", snippet: "Caméra fixe sur pied", note: "Calme et contemplatif : seul le sujet bouge." },
        ],
      },
      {
        id: "lumiere",
        title: "La lumière",
        why: "La lumière fixe l'heure et l'émotion de la scène. Décris sa source, sa couleur et ce qu'elle éclaire.",
        options: [
          { id: "matin", label: "Matin doré", snippet: "Lumière dorée du matin à travers les fenêtres, poussière d'argile en suspension dans les rayons", note: "Chaleureux et poétique : l'image la plus « cinéma »." },
          { id: "soir", label: "Fin de journée bleutée", snippet: "Lumière bleutée de fin de journée, une seule lampe chaude allumée au-dessus du tour", note: "Intime et apaisant, contraste chaud-froid." },
          { id: "contraste", label: "Clair-obscur", snippet: "Éclairage très contrasté façon film noir, un seul faisceau de lumière latéral, fond plongé dans l'ombre", note: "Dramatique et artistique, au risque d'être sombre." },
        ],
      },
      {
        id: "son",
        title: "Le son",
        why: "Veo crée aussi la bande son. Sans consigne, il ajoute souvent une musique au hasard. Dis-lui exactement ce qu'on doit entendre, et ce qu'on ne doit pas entendre.",
        sound: true,
        options: [
          { id: "ambiance", label: "Sons de l'atelier", snippet: "Son : le ronronnement du tour et le bruit de l'argile mouillée, aucune musique", note: "Immersif et authentique : on se croit dans l'atelier." },
          { id: "piano", label: "Musique douce", snippet: "Son : une musique douce au piano, sans aucune voix", note: "Émotion et élégance, comme un film de marque." },
          { id: "silence", label: "Silence", snippet: "Son : silence complet, aucun bruit ni musique", note: "Utile si tu ajoutes ta propre voix off ensuite." },
        ],
      },
    ],
    weak: {
      prompt: "Une vidéo d'une céramiste dans son atelier.",
      explanation: "Le modèle choisit seul le cadrage, la caméra, la lumière et le son : le résultat ressemble à une banque d'images, avec une musique plaquée au hasard. Avec les quatre décisions d'un réalisateur, le plan a une intention et une ambiance.",
    },
    pitfalls: [
      "Décrire un scénario entier (« elle entre, s'assoit, façonne puis sourit ») : 6 secondes ne suffisent pas, l'IA bâcle tout.",
      "Oublier le son : Veo ajoute une musique que tu n'as pas choisie.",
      "Demander du texte à l'écran : il sort souvent mal écrit. Ajoute tes titres au montage.",
    ],
    tips: [
      "Génère plusieurs plans avec la même lumière et le même style : ils se monteront ensemble comme un vrai film.",
      "Termine ton prompt par « aucune musique » et ajoute ta propre musique au montage pour garder le contrôle.",
      "Pour un fond de site, choisis le plan fixe et le silence : la vidéo tourne en boucle sans distraire.",
    ],
    variants: [
      { title: "Bannière vidéo de site", text: "Plan large, travelling lent, silence : une vidéo d'ambiance à placer derrière le titre de ta page d'accueil." },
      { title: "Intro de podcast vidéo", text: "Remplace le sujet par ton studio d'enregistrement, gros plan sur un micro, musique douce : 6 secondes d'intro reconnaissables." },
      { title: "Format vertical", text: "Passe en 9:16 et choisis le gros plan : le même plan devient une accroche pour TikTok ou les reels." },
    ],
  },

  {
    id: "logo-anime",
    domain: "video",
    title: "Ton logo animé",
    tagline: "Ton logo prend vie pour l'intro ou la fin de tes vidéos.",
    intro: "Un logo animé signe tes vidéos et les rend reconnaissables dès la première seconde. Tu pars de l'image de ton logo et l'IA l'anime. Le secret : faire bouger des éléments autour ou à l'intérieur du logo, sans jamais toucher à sa forme.",
    duration: "≈ 5 min",
    model: ANIMATE,
    ratio: "1:1",
    video: { duration: "5" },
    source: {
      label: "L'image de ton logo",
      tips: [
        "Utilise ton logo sur fond uni (blanc ou noir), bien centré, avec de la marge autour : le cas « Ton logo » te montre comment l'obtenir.",
        "Un logo simple s'anime beaucoup mieux qu'un logo très détaillé.",
        "Évite les logos avec beaucoup de texte : les lettres sont ce que l'IA déforme le plus.",
      ],
      fromKey: "cas/logo/resultat",
    },
    template: "Anime ce logo pour l'introduction d'une vidéo. {effet}. {camera}. {fond}. La forme du logo, ses couleurs et ses proportions restent exactement identiques à l'image de référence, net et centré.",
    fields: [],
    briques: [
      {
        id: "effet",
        title: "L'effet d'animation",
        why: "C'est la personnalité de ton animation. Choisis un effet qui a un sens pour ta marque : une flamme pour une bougie, de l'encre pour un studio créatif, des particules pour une marque premium.",
        options: [
          { id: "flamme", label: "Flamme vivante", snippet: "La petite flamme du logo s'anime et vacille doucement, comme une vraie flamme de bougie", note: "L'élément du logo prend vie : simple et parlant." },
          { id: "particules", label: "Particules dorées", snippet: "Des particules dorées tourbillonnent autour du logo puis se dissipent lentement", note: "Élégant et festif, très « marque premium »." },
          { id: "encre", label: "Encre", snippet: "Une encre noire se diffuse autour du logo comme dans l'eau puis se retire", note: "Artistique et organique, pour un univers créatif." },
        ],
      },
      {
        id: "camera",
        title: "Le mouvement de caméra",
        why: "Même sur un logo, un léger mouvement de caméra donne de la profondeur. Il doit rester simple pour que le logo reste lisible.",
        options: [
          { id: "zoom", label: "Zoom lent", snippet: "La caméra se rapproche très lentement du logo", note: "Le logo s'impose doucement : idéal en ouverture." },
          { id: "rotation", label: "Légère rotation 3D", snippet: "Le logo pivote très légèrement en 3D puis revient de face", note: "Donne du volume, mais attention aux déformations." },
          { id: "fixe", label: "Caméra fixe", snippet: "Caméra parfaitement fixe", note: "Le plus sûr : seul l'effet bouge." },
        ],
      },
      {
        id: "fond",
        title: "Le fond",
        why: "Le fond donne l'ambiance et assure la transition avec la suite de la vidéo. Il peut rester sobre ou évoluer pendant l'animation.",
        options: [
          { id: "blanc", label: "Blanc pur", snippet: "Le fond reste blanc pur du début à la fin", note: "Propre et lumineux, comme l'image de départ." },
          { id: "noir", label: "Passage au noir", snippet: "Le fond s'assombrit progressivement jusqu'au noir profond, le logo reste éclairé", note: "Dramatique : parfait pour enchaîner sur une vidéo sombre." },
          { id: "lumiere", label: "Balayage lumineux", snippet: "Un balayage de lumière dorée traverse le fond derrière le logo", note: "Un reflet qui attire l'œil : le classique des intros." },
        ],
      },
    ],
    weak: {
      prompt: "Anime mon logo.",
      explanation: "Sans consigne, l'IA fait tourner le logo, déforme les lettres ou ajoute des effets sans rapport avec ta marque. En choisissant un effet qui a du sens, une caméra simple, un fond, et en exigeant que la forme reste identique, tu obtiens une vraie signature vidéo.",
    },
    pitfalls: [
      "Demander au logo de se construire ou d'apparaître : l'IA part de ton image complète, elle ne sait pas la « dessiner ». Fais bouger ce qui est autour.",
      "Ajouter trop d'effets : particules, rotation et changement de fond en 5 secondes, c'est illisible.",
      "Oublier « la forme du logo reste identique » : les lettres se mettent à onduler.",
    ],
    tips: [
      "Génère la même animation sur fond blanc et sur fond noir : tu auras une version pour chaque type de vidéo.",
      "Garde les 2 dernières secondes pour ta fin de vidéo, le logo bien fixe, avec ton site en texte ajouté au montage.",
      "Un logo animé de 5 secondes suffit : au-delà, le spectateur décroche.",
    ],
    variants: [
      { title: "Fin de vidéo", text: "Choisis le passage au noir : la vidéo se termine sur ton logo éclairé, prêt à recevoir ton site ou tes réseaux au montage." },
      { title: "Logo pour les fêtes", text: "Remplace l'effet par « de la neige tombe doucement autour du logo » pour une version saisonnière." },
      { title: "Animation pour les réseaux", text: "Passe en 9:16 avec un fond uni : ton logo animé devient une story d'annonce." },
    ],
  },
];
