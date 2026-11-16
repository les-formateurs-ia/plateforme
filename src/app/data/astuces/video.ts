// Astuces IA — domaine Vidéo. Première version rédigée pour relecture par
// les formateurs. Les variations utilisent une image de départ commune
// (startImage, générée par FLUX.2) animée en image-to-video : c'est le seul
// moyen d'isoler vraiment une brique, Seedance n'acceptant pas de graine.
import type { AstuceDomain } from "./types";

export const VIDEO_DOMAIN: AstuceDomain = {
  id: "video",
  label: "Vidéos",
  tagline: "Décrire le mouvement, la caméra et le temps.",
  intro:
    "Une vidéo, c'est une image qui bouge, donc toutes les briques de l'image s'appliquent. Mais la vidéo ajoute des briques à elle : ce que fait le sujet, ce que fait la caméra, la vitesse du temps, les éléments qui s'animent, le son. Un clip IA dure 5 à 10 secondes : chaque mot compte, et la clé est de décrire des mouvements simples, précis et séparés.",
  studio: { path: "videos", modelId: "seedance-2-0-fast", modelLabel: "Seedance 2.0 Fast" },
  principles: [
    { title: "Une scène, une action", text: "Un clip dure quelques secondes : décris UNE action principale, pas un scénario entier." },
    { title: "Deux mouvements séparés", text: "Ce que fait le sujet ET ce que fait la caméra sont deux briques différentes. Écris-les dans deux phrases distinctes." },
    { title: "Partir d'une image", text: "Générer d'abord l'image parfaite, puis l'animer (image-to-video), donne beaucoup plus de contrôle que tout faire d'un coup." },
    { title: "Verbes et adverbes précis", text: "« Marche » ne suffit pas : « marche lentement vers la caméra » donne la vitesse, la direction et l'intention." },
    { title: "Moins, mais mieux", text: "Trop de mouvements simultanés provoquent des déformations. Un mouvement simple et réussi vaut mieux que trois ratés." },
  ],
  anatomy: {
    ratio: "16:9",
    audio: true,
    segments: [
      { text: "Plan cinématographique, étalonnage chaud", brique: "style" },
      { text: ". " },
      { text: "Une boulangère d'une trentaine d'années en tablier de lin, dans sa boutique au petit matin" },
      { text: ", " },
      { text: "sort une plaque de croissants dorés du four puis la pose sur le comptoir en souriant", brique: "sujet-action" },
      { text: ". " },
      { text: "Plan rapproché, légère contre-plongée", brique: "plan" },
      { text: ", " },
      { text: "lent travelling avant", brique: "camera" },
      { text: ". " },
      { text: "De la vapeur s'élève des croissants", brique: "physique" },
      { text: ", " },
      { text: "lumière dorée du lever du soleil à travers la vitrine, rayons visibles dans la farine en suspension", brique: "lumiere" },
      { text: ". " },
      { text: "Son : crépitement du four, aucune musique", brique: "son" },
      { text: "." },
    ],
  },
  builderSubject: { label: "Sujet & décor", placeholder: "ex. une jeune femme en manteau beige dans une rue pavée de Paris en automne", order: 2, group: 1 },
  briques: [
    // ── 1. Sujet & mouvement ──────────────────────────────────────────────
    {
      id: "sujet-action",
      title: "Sujet & mouvement",
      question: "Qui bouge, comment, à quelle vitesse, dans quelle direction ?",
      summary: "Le verbe, la vitesse, la direction et l'intention du mouvement.",
      why: "En vidéo, décrire le sujet ne suffit plus : il faut décrire son mouvement. Un bon mouvement se formule avec un verbe précis, une vitesse, une direction et, idéalement, une intention ou une émotion. Sans ça, l'IA produit des mouvements mous ou aléatoires, comme un personnage qui « flotte » sur place.",
      variations: {
        intro: "La même image de départ, animée quatre fois : seule la description du mouvement change.",
        startImage: "Photographie cinématographique d'une jeune femme en manteau beige debout au milieu d'une rue pavée parisienne en automne, plan en pied de face, feuilles mortes au sol, lumière douce de fin d'après-midi.",
        base: "La jeune femme {x}. Caméra fixe.",
        ratio: "16:9",
        audio: false,
        items: [
          { id: "vague", label: "Consigne vague", snippet: "bouge", note: "Mouvement mou et aléatoire : l'IA ne sait pas quoi faire." },
          { id: "marche", label: "Verbe + vitesse + direction", snippet: "marche lentement vers la caméra en souriant, les mains dans les poches", note: "Un mouvement lisible et naturel." },
          { id: "retourne", label: "Geste net + émotion", snippet: "se retourne brusquement pour regarder par-dessus son épaule, l'air surpris", note: "Un geste clair et une émotion : il se passe quelque chose." },
          { id: "tourne", label: "Mouvement expressif", snippet: "ferme les yeux et tourne lentement sur elle-même, bras légèrement écartés, en riant", note: "Un mouvement fluide qui exprime la joie." },
        ],
      },
      vocabulary: [
        { term: "Verbe précis", meaning: "« Marche », « court », « se penche », « saisit »… jamais « bouge ».", snippet: "se penche pour ramasser une feuille" },
        { term: "Vitesse", meaning: "Lentement, calmement, brusquement, en courant.", snippet: "lentement, d'un pas tranquille" },
        { term: "Direction", meaning: "Vers la caméra, de gauche à droite, s'éloigne, vers le haut.", snippet: "marche vers la caméra" },
        { term: "Intention", meaning: "Pourquoi le sujet bouge : cela change la façon de bouger.", snippet: "court joyeusement pour rejoindre quelqu'un" },
        { term: "Micro-mouvements", meaning: "Respirer, cligner des yeux, cheveux qui bougent : la vie dans un plan calme.", snippet: "respire calmement, cligne des yeux, léger sourire" },
        { term: "Enchaînement", meaning: "Deux actions maximum, dans l'ordre, reliées par « puis ».", snippet: "prend la tasse, puis la porte à ses lèvres" },
        { term: "Geste avec le produit", meaning: "Le geste qui montre le produit en usage.", snippet: "ouvre la boîte et en sort le produit" },
      ],
      formula: "[sujet] + [verbe précis] + [vitesse] + [direction] + [émotion ou intention]",
      beforeAfter: {
        weak: "Un homme qui fait du sport.",
        strong: "Un homme de 30 ans en tenue de running noire court à vitesse soutenue sur un sentier côtier, de gauche à droite, foulée régulière et déterminée, souffle visible dans l'air froid du matin.",
        explanation: "Le verbe (court), la vitesse (soutenue), la direction (de gauche à droite) et l'intention (déterminée) donnent un mouvement crédible et cohérent.",
        ratio: "16:9",
        illustrated: false,
      },
      pitfalls: [
        "« Il bouge », « elle fait quelque chose » : aucune information sur le mouvement.",
        "Plus de deux actions à la suite dans un clip de 5 secondes : l'IA en saute ou les mélange.",
        "Des gestes fins et complexes (écrire, jouer du piano) : les mains se déforment encore souvent.",
      ],
      tips: [
        "Compte une action par tranche de 3 à 5 secondes de vidéo.",
        "Ajoute des micro-mouvements (respiration, cheveux, clignement des yeux) pour qu'un plan calme ne paraisse pas figé.",
      ],
      builder: { label: "Mouvement du sujet", placeholder: "ex. marche lentement vers la caméra en souriant", order: 3, group: 1 },
    },

    // ── 2. Mouvement de caméra ────────────────────────────────────────────
    {
      id: "camera",
      title: "Mouvement de caméra",
      question: "Que fait la caméra pendant le plan ?",
      summary: "Fixe, travelling, panoramique, orbite, drone : le langage du cinéma.",
      why: "Le mouvement de caméra est ce qui donne immédiatement un rendu « vidéo pro ». Il se décrit séparément du mouvement du sujet. Le vocabulaire du cinéma (travelling, panoramique, plan grue) est bien connu des modèles vidéo : utilise-le en précisant la vitesse et la direction. Et si tu ne veux aucun mouvement, dis-le : « caméra fixe ».",
      variations: {
        intro: "Le même flacon, la même image de départ : seul le mouvement de caméra change.",
        startImage: "Photographie publicitaire d'un flacon de parfum en verre ambré posé sur un rocher au bord de la mer au coucher du soleil, vagues douces en arrière-plan, lumière dorée.",
        base: "Le flacon de parfum reste immobile sur le rocher, les vagues bougent doucement. {x}.",
        ratio: "16:9",
        audio: false,
        items: [
          { id: "fixe", label: "Caméra fixe", snippet: "Caméra fixe sur trépied", note: "Seule la scène bouge : calme, contemplatif." },
          { id: "travelling-avant", label: "Travelling avant", snippet: "Lent travelling avant vers le flacon", note: "On s'approche : intensité, focalisation sur le produit." },
          { id: "travelling-lateral", label: "Travelling latéral", snippet: "Travelling latéral lent de gauche à droite", note: "Le décor défile : effet de profondeur." },
          { id: "orbite", label: "Orbite", snippet: "La caméra tourne lentement autour du flacon en arc de cercle", note: "Le produit se révèle sous plusieurs angles : effet premium." },
          { id: "elevation", label: "Plan grue", snippet: "La caméra s'élève lentement à la verticale, révélant la mer et l'horizon", note: "Effet « révélation » : on découvre le lieu." },
          { id: "epaule", label: "Caméra à l'épaule", snippet: "Caméra à l'épaule, légers tremblements naturels", note: "Effet documentaire, spontané, vécu." },
        ],
      },
      vocabulary: [
        { term: "Caméra fixe", meaning: "Aucun mouvement de caméra.", snippet: "caméra fixe sur trépied" },
        { term: "Travelling avant / arrière", meaning: "La caméra avance vers le sujet ou recule.", snippet: "lent travelling avant vers le sujet" },
        { term: "Travelling latéral", meaning: "La caméra glisse sur le côté.", snippet: "travelling latéral de gauche à droite" },
        { term: "Panoramique", meaning: "La caméra pivote sur place, horizontalement.", snippet: "panoramique lent de gauche à droite" },
        { term: "Bascule verticale (tilt)", meaning: "La caméra pivote de bas en haut ou de haut en bas.", snippet: "la caméra bascule lentement du sol vers le ciel" },
        { term: "Orbite", meaning: "La caméra tourne autour du sujet.", snippet: "la caméra tourne lentement autour du sujet" },
        { term: "Plan grue", meaning: "La caméra monte ou descend verticalement.", snippet: "la caméra s'élève lentement" },
        { term: "Plan drone", meaning: "Survol aérien.", snippet: "plan drone survolant le paysage" },
        { term: "Caméra à l'épaule", meaning: "Léger tremblement, effet reportage.", snippet: "caméra à l'épaule, mouvement naturel" },
        { term: "Zoom", meaning: "Grossissement sans déplacement : effet plus « télé » qu'un travelling.", snippet: "zoom lent vers le visage" },
        { term: "Suivi (tracking)", meaning: "La caméra suit un sujet en mouvement.", snippet: "la caméra suit le sujet de dos" },
        { term: "Plan FPV", meaning: "Vol rapide et fluide façon drone de course.", snippet: "plan FPV rapide qui plonge à travers la scène" },
      ],
      formula: "[type de mouvement] + [vitesse] + [direction] + [vers quoi / autour de quoi]",
      beforeAfter: {
        weak: "Une vidéo dynamique d'une voiture.",
        strong: "Une voiture de sport rouge roule sur une route côtière sinueuse. Plan drone : la caméra suit la voiture par l'arrière, puis s'élève lentement pour révéler la mer et les falaises.",
        explanation: "« Dynamique » ne dit pas comment filmer. Le type de plan (drone), le mouvement (suit, puis s'élève) et ce qu'il révèle sont explicites.",
        ratio: "16:9",
        illustrated: false,
      },
      pitfalls: [
        "Mélanger mouvement du sujet et mouvement de caméra dans la même phrase : on ne sait plus qui bouge.",
        "Enchaîner trois mouvements de caméra dans un clip court : le résultat devient chaotique.",
        "Oublier la vitesse : un « travelling » seul peut être très rapide.",
      ],
      tips: [
        "Pour un produit : orbite lente ou travelling avant lent. C'est le duo gagnant des publicités premium.",
        "Si la caméra bouge dans tous les sens alors que tu ne veux rien, écris explicitement « caméra fixe ».",
      ],
      builder: { label: "Mouvement de caméra", placeholder: "ex. lent travelling avant vers le sujet", order: 6, group: 2 },
    },

    // ── 3. Cadrage & point de vue ─────────────────────────────────────────
    {
      id: "plan",
      title: "Cadrage & point de vue",
      question: "Comment est composé le plan, et du point de vue de qui ?",
      summary: "Les plans de la photo, plus les points de vue propres à la vidéo.",
      why: "Tout ce qui est vrai en image (taille de plan, angle, focale) reste vrai en vidéo : retrouve-le dans les briques Cadrage, Angle et Objectif du domaine Images. La vidéo ajoute des points de vue narratifs : la caméra subjective (on voit par les yeux du personnage), le plan d'insert sur un détail, le plan-séquence. Précise aussi le cadrage de départ : c'est de là que part le mouvement de caméra.",
      vocabulary: [
        { term: "Caméra subjective (POV)", meaning: "On voit à travers les yeux du personnage.", snippet: "en caméra subjective, du point de vue du personnage" },
        { term: "Plan d'insert", meaning: "Gros plan sur un détail : une main, un objet.", snippet: "plan d'insert en gros plan sur les mains" },
        { term: "Plan d'ensemble", meaning: "Situe la scène et le lieu.", snippet: "plan d'ensemble du lieu" },
        { term: "Plan rapproché", meaning: "Le visage et l'émotion.", snippet: "plan rapproché sur le visage" },
        { term: "Plan-séquence", meaning: "Un seul plan continu, sans coupe.", snippet: "en un seul plan-séquence continu" },
        { term: "Amorce", meaning: "Un élément flou au premier plan, le sujet derrière.", snippet: "en amorce, une épaule floue au premier plan" },
        { term: "Plan zénithal", meaning: "Vue verticale, du dessus.", snippet: "plan zénithal, vue du dessus" },
      ],
      formula: "[taille de plan] + [angle] + [point de vue : subjectif, amorce…] — le point de départ du mouvement",
      beforeAfter: {
        weak: "Quelqu'un qui cuisine.",
        strong: "Plan d'insert en gros plan, vue légèrement plongeante : des mains émincent finement une botte de basilic sur une planche en bois, gestes rapides et précis, lumière naturelle de cuisine.",
        explanation: "L'insert sur les mains montre le savoir-faire bien mieux qu'un plan large et flou de « quelqu'un qui cuisine ».",
        ratio: "16:9",
        illustrated: false,
      },
      pitfalls: [
        "Ne pas préciser le cadrage de départ : le mouvement de caméra n'a pas de point d'origine.",
        "Demander une caméra subjective ET voir le visage du personnage.",
      ],
      tips: [
        "Pour une vidéo de marque, alterne plans d'ensemble, plans rapprochés et inserts : c'est la grammaire de base du montage.",
      ],
      builder: { label: "Cadrage", placeholder: "ex. plan rapproché, légère contre-plongée", order: 5, group: 2 },
    },

    // ── 4. Vitesse & temps ────────────────────────────────────────────────
    {
      id: "vitesse",
      title: "Vitesse & temps",
      question: "Le temps s'écoule-t-il normalement, au ralenti ou en accéléré ?",
      summary: "Ralenti, temps réel, timelapse, hyperlapse : jouer avec le temps.",
      why: "La vitesse du temps est un outil narratif : le ralenti magnifie un geste (une éclaboussure, des cheveux au vent), le timelapse raconte une durée (une journée en 5 secondes). C'est une brique à part entière, distincte de la vitesse du sujet : un sujet peut courir vite… au ralenti.",
      variations: {
        intro: "La même place, la même image de départ : seule la vitesse du temps change.",
        startImage: "Photographie d'une place de ville européenne avec une fontaine au centre, des passants et des terrasses de café, quelques nuages dans le ciel, vue en légère plongée depuis un balcon, après-midi ensoleillé.",
        base: "{x}.",
        ratio: "16:9",
        audio: false,
        items: [
          { id: "temps-reel", label: "Temps réel", snippet: "Les passants traversent la place et l'eau de la fontaine coule, en temps réel, caméra fixe", note: "Le rythme naturel de la vie." },
          { id: "ralenti", label: "Ralenti extrême", snippet: "Au ralenti extrême, les gouttes d'eau de la fontaine restent presque suspendues dans l'air, les passants avancent très lentement, caméra fixe", note: "Chaque détail est magnifié." },
          { id: "timelapse", label: "Timelapse", snippet: "Timelapse : les nuages défilent rapidement, les ombres tournent sur la place, les passants deviennent des traînées floues, caméra fixe", note: "Des heures condensées en quelques secondes." },
          { id: "hyperlapse", label: "Hyperlapse", snippet: "Hyperlapse : la caméra avance rapidement à travers la place vers la fontaine, le temps est accéléré", note: "Un timelapse en mouvement : énergie et modernité." },
        ],
      },
      vocabulary: [
        { term: "Temps réel", meaning: "Le rythme de la vie.", snippet: "en temps réel, vitesse naturelle" },
        { term: "Ralenti", meaning: "Magnifie un geste rapide.", snippet: "au ralenti" },
        { term: "Ralenti extrême", meaning: "Gouttes suspendues, effet caméra haute vitesse.", snippet: "au ralenti extrême, comme filmé à haute vitesse" },
        { term: "Accéléré", meaning: "Plus rapide que la réalité.", snippet: "en accéléré" },
        { term: "Timelapse", meaning: "Caméra fixe, temps très accéléré : nuages, foule, coucher de soleil.", snippet: "en timelapse, les nuages défilent" },
        { term: "Hyperlapse", meaning: "Un timelapse avec une caméra qui se déplace.", snippet: "en hyperlapse à travers la ville" },
        { term: "Temps figé", meaning: "Tout est figé, seule la caméra bouge.", snippet: "le temps est figé, la caméra tourne autour de la scène" },
      ],
      formula: "[vitesse du temps] + [ce qui rend cette vitesse visible : gouttes, nuages, foule]",
      beforeAfter: {
        weak: "Du lait versé dans un café.",
        strong: "Au ralenti extrême, un filet de lait est versé dans une tasse de café noir et forme des volutes blanches qui tourbillonnent, gros plan, caméra fixe, lumière latérale douce.",
        explanation: "Le ralenti transforme un geste banal en moment hypnotique, parfait pour une publicité ou un Reel.",
        ratio: "16:9",
        illustrated: false,
      },
      pitfalls: [
        "Confondre vitesse du temps et vitesse du sujet : « court au ralenti » est clair, « court vite au ralenti » beaucoup moins.",
        "Un timelapse avec une caméra qui se déplace : le mot juste est alors « hyperlapse ».",
      ],
      tips: [
        "Le ralenti fonctionne particulièrement bien avec les liquides, les cheveux, les tissus et les particules : c'est le rendu des publicités de luxe.",
      ],
      builder: { label: "Vitesse du temps", placeholder: "ex. au ralenti", order: 7, group: 3 },
    },

    // ── 5. Physique & éléments ────────────────────────────────────────────
    {
      id: "physique",
      title: "Physique & éléments",
      question: "Qu'est-ce qui bouge autour du sujet ?",
      summary: "Vent, eau, tissus, fumée, particules : les mouvements secondaires qui donnent vie.",
      why: "Ce sont les mouvements secondaires qui rendent une vidéo crédible : des cheveux soulevés par le vent, une robe qui flotte, la vapeur d'une tasse, la poussière dans un rayon de soleil. Décris-les avec leur cause (le vent) et leur effet (les cheveux s'envolent). Sans eux, la scène paraît figée, comme une photo qui glisse.",
      variations: {
        intro: "La même femme, la même image de départ : seuls les éléments en mouvement changent.",
        startImage: "Photographie cinématographique d'une femme vue de trois-quarts debout au bord d'une falaise face à la mer, longue robe blanche légère et longs cheveux détachés, ciel nuageux, herbes hautes autour d'elle.",
        base: "La femme regarde la mer, immobile. {x}. Caméra fixe.",
        ratio: "16:9",
        audio: false,
        items: [
          { id: "sans-consigne", label: "Sans consigne", snippet: "La scène s'anime", note: "Des mouvements faibles et incertains." },
          { id: "brise", label: "Brise légère", snippet: "Une brise légère fait onduler doucement sa robe, ses cheveux et les herbes hautes", note: "Vivant, mais paisible." },
          { id: "rafales", label: "Rafales", snippet: "De fortes rafales de vent font claquer sa robe et projettent ses cheveux sur le côté, les herbes se couchent", note: "Drame et intensité." },
          { id: "pluie", label: "Pluie qui commence", snippet: "Une pluie fine commence à tomber, les gouttes scintillent dans la lumière, sa robe s'assombrit en se mouillant", note: "Un changement d'état progressif et cinématographique." },
        ],
      },
      vocabulary: [
        { term: "Vent (intensité)", meaning: "Brise légère, vent soutenu, rafales.", snippet: "une brise légère fait onduler les cheveux" },
        { term: "Tissus", meaning: "Flotter, onduler, claquer au vent.", snippet: "la robe flotte doucement au vent" },
        { term: "Eau", meaning: "Vagues, éclaboussures, ruissellement, reflets.", snippet: "des vagues douces viennent mourir sur le sable" },
        { term: "Fumée et vapeur", meaning: "Volutes, brume, vapeur qui s'élève.", snippet: "de la vapeur s'élève lentement de la tasse" },
        { term: "Particules", meaning: "Poussière dans la lumière, pollen, neige, étincelles.", snippet: "des particules de poussière flottent dans le rayon de lumière" },
        { term: "Météo qui change", meaning: "Pluie qui commence, nuages qui passent, éclair.", snippet: "une pluie fine commence à tomber" },
        { term: "Flammes", meaning: "Bougie, feu de camp, lumière vacillante.", snippet: "la flamme de la bougie vacille doucement" },
      ],
      formula: "[élément] + [cause] + [effet visible sur le sujet ou le décor] + [intensité]",
      beforeAfter: {
        weak: "Une tasse de thé chaud.",
        strong: "Une tasse de thé fumant sur le rebord d'une fenêtre, une fine vapeur s'élève en volutes lentes, la pluie ruisselle sur la vitre derrière, gros plan, caméra fixe.",
        explanation: "La vapeur et la pluie sont les vrais sujets du mouvement : sans elles, la vidéo ne serait qu'une photo immobile.",
        ratio: "16:9",
        illustrated: false,
      },
      pitfalls: [
        "Trop d'éléments en mouvement à la fois (vent, pluie, fumée, foule) : les déformations apparaissent.",
        "Des intensités contradictoires (« tempête » et « cheveux immobiles »).",
      ],
      tips: [
        "Dans un plan produit, un seul élément secondaire (vapeur, gouttes, particules) suffit à rendre l'image vivante et premium.",
      ],
      builder: { label: "Éléments en mouvement", placeholder: "ex. une brise légère fait onduler les cheveux", order: 8, group: 3 },
    },

    // ── 6. Lumière & atmosphère ───────────────────────────────────────────
    {
      id: "lumiere",
      title: "Lumière & atmosphère",
      question: "La lumière est-elle stable, ou évolue-t-elle pendant le plan ?",
      summary: "Tout le vocabulaire de la lumière photo, plus la lumière qui change.",
      why: "Toute la brique Lumière du domaine Images s'applique : source, direction, qualité, couleur. La vidéo ajoute une dimension : la lumière peut changer pendant le plan. Un nuage qui passe, un néon qui clignote, des phares qui balaient la pièce, le soleil qui perce : c'est un moyen très efficace de créer une ambiance en mouvement.",
      vocabulary: [
        { term: "Lumière qui évolue", meaning: "Le soleil perce, un nuage passe.", snippet: "le soleil perce peu à peu à travers les nuages" },
        { term: "Lumière clignotante", meaning: "Néon défectueux, enseigne, orage.", snippet: "un néon rose clignote par intermittence" },
        { term: "Lumière qui balaie", meaning: "Phares, faisceau, gyrophare.", snippet: "les phares d'une voiture balaient la pièce" },
        { term: "Reflets mouvants", meaning: "Reflets de l'eau sur un mur, une piscine.", snippet: "reflets de l'eau qui ondulent sur le mur" },
        { term: "Flare", meaning: "Reflet de lumière dans l'objectif, très cinéma.", snippet: "léger flare lorsque le soleil entre dans le champ" },
        { term: "Rayons visibles", meaning: "Des faisceaux de lumière dans la brume ou la poussière.", snippet: "rayons de lumière visibles dans la brume" },
        { term: "Heure dorée / heure bleue", meaning: "Les deux moments les plus cinématographiques de la journée.", snippet: "à l'heure bleue, les lumières de la ville s'allument" },
      ],
      formula: "[lumière de base : source, direction, couleur] + [changement pendant le plan]",
      beforeAfter: {
        weak: "Une rue la nuit, ambiance cinéma.",
        strong: "Une ruelle de Tokyo la nuit après la pluie, pavés mouillés qui reflètent les enseignes néon rose et bleu, une enseigne clignote par intermittence, légère brume dans l'air, caméra fixe.",
        explanation: "« Ambiance cinéma » est remplacé par des sources concrètes (néons), des reflets et une lumière qui change (l'enseigne qui clignote).",
        ratio: "16:9",
        illustrated: false,
      },
      pitfalls: [
        "Faire changer en même temps la lumière, la caméra et le sujet.",
        "Une lumière qui évolue trop vite : on a l'impression d'un bug.",
      ],
      tips: [
        "Un nuage qui passe ou un soleil qui perce suffit à rendre vivant un plan sans aucun mouvement de caméra.",
      ],
      builder: { label: "Lumière", placeholder: "ex. lumière dorée de fin de journée, léger flare", order: 9, group: 4 },
    },

    // ── 7. Début, milieu, fin ─────────────────────────────────────────────
    {
      id: "evolution",
      title: "Début, milieu, fin",
      question: "Qu'est-ce qui a changé entre la première et la dernière image ?",
      summary: "Une vidéo est une petite histoire : un état de départ, une transformation.",
      why: "Une bonne vidéo courte raconte un changement : une porte s'ouvre, une fleur éclot, un produit apparaît. Pense ton prompt en trois temps : le départ (ce qu'on voit au début), l'action (ce qui se passe) et l'arrivée (ce qu'on voit à la fin). En image-to-video, l'image de départ est déjà fournie : décris UNIQUEMENT ce qui change, sans redécrire l'image.",
      vocabulary: [
        { term: "Trois temps", meaning: "Au début… puis… à la fin…", snippet: "au début, la boîte est fermée ; puis elle s'ouvre lentement ; à la fin, le produit apparaît dans la lumière" },
        { term: "Révélation", meaning: "Quelque chose apparaît, se découvre.", snippet: "le brouillard se dissipe et révèle le château" },
        { term: "Transformation", meaning: "Un état se change en un autre.", snippet: "le bouton de rose éclot lentement" },
        { term: "Entrée dans le champ", meaning: "Un élément entre ou sort du cadre.", snippet: "un chat entre dans le champ par la droite" },
        { term: "Seulement le mouvement", meaning: "En image-to-video : l'image est déjà là, ne décris que ce qui bouge.", snippet: "le personnage tourne la tête vers la caméra et sourit" },
        { term: "Image de fin", meaning: "Certains modèles acceptent aussi une image de fin et créent la transition.", snippet: "transition fluide jusqu'à l'image finale" },
      ],
      formula: "Au début [état initial] → puis [action ou transformation] → à la fin [état final]",
      beforeAfter: {
        weak: "Une boîte cadeau.",
        strong: "Au début, une boîte cadeau rouge fermée est posée sur une table. Puis le couvercle se soulève lentement tout seul et une lumière dorée s'échappe de la boîte. À la fin, des paillettes dorées flottent au-dessus de la boîte ouverte. Caméra fixe, plan rapproché.",
        explanation: "Trois temps clairs : l'IA sait d'où partir, quoi faire et où arriver en 5 secondes.",
        ratio: "16:9",
        illustrated: false,
      },
      pitfalls: [
        "En image-to-video, redécrire toute l'image : l'IA risque de la modifier au lieu de l'animer.",
        "Une transformation trop ambitieuse pour 5 secondes (« la graine devient une forêt »).",
      ],
      tips: [
        "La méthode la plus fiable : crée l'image de départ parfaite dans Le Studio Images, puis anime-la dans Le Studio Vidéos avec un prompt qui ne décrit que le mouvement.",
      ],
      builder: { label: "Évolution pendant le plan", placeholder: "ex. puis le couvercle s'ouvre et une lumière dorée s'échappe", order: 10, group: 5 },
    },

    // ── 8. Découpage en plans ─────────────────────────────────────────────
    {
      id: "decoupage",
      title: "Découpage en plans",
      question: "Un seul plan continu, ou plusieurs plans enchaînés ?",
      summary: "Durée, enchaînement, transitions : structurer une vraie vidéo.",
      why: "Un clip généré dure en général 5 à 10 secondes et contient un seul plan. Certains modèles récents savent enchaîner plusieurs plans dans une même génération, si tu les numérotes clairement. Pour une vraie vidéo (publicité, Reel), la méthode fiable reste de générer plan par plan, avec le même style et le même personnage, puis de monter les clips ensemble.",
      vocabulary: [
        { term: "Plan unique", meaning: "Une seule prise continue.", snippet: "un seul plan continu, sans coupe" },
        { term: "Plans numérotés", meaning: "Pour les modèles multi-plans : décris chaque plan à la suite.", snippet: "Plan 1 : plan large de la boutique. Plan 2 : gros plan sur les mains de l'artisan." },
        { term: "Coupe franche", meaning: "Passage direct d'un plan à l'autre.", snippet: "coupe franche vers un gros plan" },
        { term: "Fondu enchaîné", meaning: "Transition douce entre deux plans.", snippet: "fondu enchaîné vers la scène suivante" },
        { term: "Raccord", meaning: "Le même élément d'un plan à l'autre (geste, couleur).", snippet: "raccord sur le geste de la main" },
        { term: "Durée", meaning: "Se règle dans l'outil : 5 s pour une action, 10 s pour deux temps.", snippet: "une seule action, adaptée à 5 secondes" },
      ],
      formula: "Plan 1 : [cadrage + action] → Plan 2 : [cadrage + action] (+ transition) — ou un plan par génération",
      beforeAfter: {
        weak: "Une pub pour ma boulangerie avec le pain, le boulanger et les clients.",
        strong: "Plan 1 : gros plan sur des mains qui façonnent une boule de pâte farinée. Plan 2 : plan rapproché d'un four ouvert d'où sortent des baguettes dorées. Plan 3 : plan large d'une cliente souriante qui reçoit son pain au comptoir. Même lumière chaude du matin sur les trois plans.",
        explanation: "Un plan, une idée. Numérotés et reliés par la même lumière, ils forment une vraie petite publicité, à générer d'un coup si le modèle le permet, ou plan par plan.",
        ratio: "16:9",
        illustrated: false,
      },
      pitfalls: [
        "Tout vouloir dans un seul plan de 5 secondes : l'IA ne peut pas tout montrer.",
        "Changer de style d'un plan à l'autre dans la même vidéo.",
      ],
      tips: [
        "Écris ton découpage plan par plan AVANT de générer : c'est le storyboard de ta vidéo.",
        "Colle la même « phrase d'univers » (style, lumière, palette) dans le prompt de chaque plan.",
      ],
    },

    // ── 9. Son & dialogues ────────────────────────────────────────────────
    {
      id: "son",
      title: "Son & dialogues",
      question: "Qu'entend-on ?",
      summary: "Ambiance, bruitages, musique, paroles : le son se décrit aussi.",
      why: "Plusieurs modèles vidéo récents (Veo, Seedance, Kling…) génèrent le son en même temps que l'image. Si tu ne le décris pas, il est choisi au hasard, souvent une musique générique. Décris l'ambiance sonore, les bruitages importants et, pour une réplique, le texte exact entre guillemets et le ton sur lequel il est dit.",
      variations: {
        intro: "Deux générations à partir du même début de prompt : seule la consigne sonore change. Active le son pour comparer.",
        base: "Plan rapproché d'un barista dans un petit café de quartier le matin, il prépare un expresso au comptoir, lumière chaude. {x}",
        ratio: "16:9",
        audio: true,
        items: [
          { id: "ambiance", label: "Ambiance sonore", snippet: "Son : sifflement de la machine à café, tintement des tasses, léger brouhaha de clients en fond, aucune musique.", note: "Une ambiance réaliste qui fait « vrai »." },
          { id: "replique", label: "Réplique", snippet: "Il lève les yeux vers la caméra et dit d'une voix chaleureuse : « Votre café est prêt ! ». Son : ambiance de café calme, aucune musique.", note: "Une réplique exacte, avec le ton." },
        ],
      },
      vocabulary: [
        { term: "Ambiance sonore", meaning: "Le fond sonore du lieu.", snippet: "ambiance sonore : rumeur de la ville, oiseaux au loin" },
        { term: "Bruitages précis", meaning: "Les sons produits par les actions.", snippet: "bruit des pas sur le gravier, porte qui grince" },
        { term: "Réplique entre guillemets", meaning: "Le texte exact prononcé.", snippet: "elle dit : « Bienvenue chez nous ! »" },
        { term: "Ton de voix", meaning: "Chaleureux, chuchoté, enthousiaste…", snippet: "d'une voix calme et chaleureuse" },
        { term: "Musique", meaning: "Genre, tempo, instruments.", snippet: "musique douce au piano en fond" },
        { term: "Pas de musique", meaning: "Pour éviter une musique non voulue.", snippet: "aucune musique, seulement les sons de la scène" },
      ],
      formula: "Son : [ambiance] + [bruitages] + [réplique « exacte » + ton] + [musique, ou aucune musique]",
      beforeAfter: {
        weak: "Une femme qui parle de son produit.",
        strong: "Une femme de 35 ans regarde la caméra dans sa cuisine et dit avec enthousiasme : « Je l'utilise tous les matins ! ». Son : voix claire au premier plan, léger bruit de cuisine en fond, aucune musique.",
        explanation: "Le texte exact entre guillemets, le ton et l'environnement sonore rendent le résultat utilisable sans retouche audio.",
        ratio: "16:9",
        illustrated: false,
      },
      pitfalls: [
        "Des répliques longues : au-delà d'une phrase courte, la synchronisation des lèvres se dégrade.",
        "Laisser l'IA choisir la musique : elle ne collera pas forcément à ta marque.",
      ],
      tips: [
        "Pour une publicité, génère sans musique (« aucune musique ») et ajoute ta piste au montage : tu gardes le contrôle et les droits.",
        "Pour une voix off longue, utilise plutôt le module « Du texte à la voix » du Studio.",
      ],
      builder: { label: "Son", placeholder: "ex. ambiance de café, aucune musique", order: 11, group: 6 },
    },

    // ── 10. Style & rendu vidéo ───────────────────────────────────────────
    {
      id: "style",
      title: "Style & rendu vidéo",
      question: "Film, publicité, smartphone, animation : à quoi doit ressembler la vidéo ?",
      summary: "Le genre visuel : cinéma, publicité, UGC, documentaire, animation.",
      why: "Comme en image, le style se décide en premier. En vidéo, il inclut aussi la « façon de filmer » : un film de cinéma n'a pas le même rendu qu'une vidéo tournée au smartphone par un client. Sur les réseaux sociaux, le style UGC (contenu créé par un utilisateur) est souvent plus efficace qu'un rendu trop parfait.",
      variations: {
        intro: "Le même chien, la même plage : seul le style demandé change.",
        base: "{x} d'un golden retriever qui court sur une plage au coucher du soleil.",
        ratio: "16:9",
        audio: false,
        items: [
          { id: "cinema", label: "Cinéma", snippet: "Plan cinématographique en 35 mm, étalonnage chaud, faible profondeur de champ", note: "Le rendu « film » : émotion et qualité." },
          { id: "ugc", label: "Smartphone (UGC)", snippet: "Vidéo filmée au smartphone par son propriétaire, cadrage un peu tremblant, rendu spontané", note: "Authentique : on y croit comme à la vidéo d'un ami." },
          { id: "animation", label: "Animation 3D", snippet: "Animation 3D stylisée façon film d'animation, couleurs vives", note: "Ludique, adapté aux marques grand public." },
        ],
      },
      vocabulary: [
        { term: "Cinématographique", meaning: "Rendu film : étalonnage, profondeur de champ, format large.", snippet: "plan cinématographique, étalonnage chaud" },
        { term: "Publicité premium", meaning: "Lumière parfaite, ralentis, produit héros.", snippet: "esthétique de publicité haut de gamme" },
        { term: "UGC / smartphone", meaning: "Filmé par un utilisateur, spontané.", snippet: "filmé au smartphone, style UGC spontané" },
        { term: "Documentaire", meaning: "Caméra à l'épaule, lumière naturelle, réel.", snippet: "style documentaire, lumière naturelle" },
        { term: "Animation 3D", meaning: "Rendu de film d'animation.", snippet: "animation 3D stylisée" },
        { term: "Stop-motion", meaning: "Image par image, objets ou pâte à modeler.", snippet: "animation en stop-motion" },
        { term: "Vintage", meaning: "Grain, couleurs passées, esprit années 80-90.", snippet: "rendu caméscope des années 90, grain et couleurs passées" },
      ],
      formula: "[genre visuel] + [façon de filmer] + [rendu : étalonnage, grain]",
      beforeAfter: {
        weak: "Une vidéo stylée de mon resto.",
        strong: "Plan cinématographique au ralenti d'un chef qui flambe une poêle dans une cuisine de restaurant sombre, flammes orangées, étalonnage chaud et contrasté, faible profondeur de champ, esthétique de publicité haut de gamme.",
        explanation: "« Stylée » est remplacé par un genre (publicité haut de gamme) et ses marqueurs concrets (ralenti, étalonnage, profondeur de champ).",
        ratio: "16:9",
        illustrated: false,
      },
      pitfalls: [
        "Un style « cinéma » associé à un rendu « smartphone » : contradiction.",
        "Croire que plus c'est parfait, mieux ça marche : sur TikTok et Instagram, le trop léché fait « pub » et se fait scroller.",
      ],
      tips: [
        "Pour les Reels et TikTok, teste le style UGC : il ressemble au contenu que les gens regardent déjà.",
      ],
      builder: { label: "Style", placeholder: "ex. plan cinématographique, étalonnage chaud", order: 1, group: 1 },
    },

    // ── 11. Image de départ & cohérence ───────────────────────────────────
    {
      id: "coherence",
      title: "Image de départ & cohérence",
      question: "Comment garder le même personnage ou le même produit dans toute la vidéo ?",
      summary: "L'image-to-video : la meilleure façon de contrôler le résultat.",
      why: "Générer une vidéo uniquement à partir d'un texte laisse beaucoup de place au hasard. La méthode pro consiste à créer d'abord l'image parfaite (avec toutes les briques du domaine Images), puis à l'animer. Le personnage, le produit, le décor et la lumière sont alors verrouillés : le prompt vidéo n'a plus qu'à décrire le mouvement. Pour une série de plans, réutilise la même image de référence ou la même fiche d'identité.",
      vocabulary: [
        { term: "Image-to-video", meaning: "Animer une image existante, jointe à la génération.", snippet: "la caméra avance lentement, la femme sourit" },
        { term: "Ne décrire que le mouvement", meaning: "L'image fournit déjà tout le reste.", snippet: "seuls ses cheveux bougent au vent, caméra fixe" },
        { term: "Fiche d'identité", meaning: "La même description du personnage dans chaque plan.", snippet: "Tom, 40 ans, barbe rousse, veste en jean, bonnet gris" },
        { term: "Produit fidèle", meaning: "Partir d'une vraie photo du produit.", snippet: "le produit reste exactement identique à l'image de départ" },
      ],
      formula: "[image de départ jointe] + [mouvement du sujet] + [mouvement de caméra] — sans redécrire l'image",
      beforeAfter: {
        weak: "(image jointe) Un flacon de parfum en verre ambré sur un rocher au bord de la mer au coucher du soleil, très beau, qui bouge.",
        strong: "(même image jointe) Les vagues viennent doucement lécher le pied du rocher, la caméra tourne lentement autour du flacon en arc de cercle, les reflets du soleil glissent sur le verre.",
        explanation: "L'image est déjà là : le prompt efficace ne décrit que les mouvements (vagues, caméra, reflets).",
        ratio: "16:9",
        illustrated: false,
      },
      pitfalls: [
        "Redécrire toute l'image dans le prompt vidéo : l'IA risque de la modifier.",
        "Une image de départ dont le cadrage ne permet pas le mouvement voulu (sujet coupé, aucun espace pour avancer).",
      ],
      tips: [
        "Crée l'image dans Le Studio Images, télécharge-la, puis joins-la dans Le Studio Vidéos : c'est le workflow le plus fiable.",
        "Pour plusieurs plans d'une même publicité, génère d'abord toutes les images de départ avec la même phrase d'univers, puis anime-les une par une.",
      ],
    },
  ],
};
