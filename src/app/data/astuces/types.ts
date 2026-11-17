// ═══════════════════════════════════════════════════════════════════════════
// Astuces IA — la grammaire du prompt visuel.
//
// Un prompt image/vidéo se décompose en « briques » indépendantes (sujet,
// lumière, cadrage, mouvement de caméra…). Chaque brique explique ce qu'elle
// contrôle, donne le vocabulaire précis pour la décrire et la montre en
// « variations contrôlées » : même prompt, même graine, seul un passage change.
//
// Ces fichiers sont PURS (aucun import d'alias "@/", d'icône ou de React) :
// scripts/generate-astuces-media.mjs les charge via esbuild pour savoir quels
// exemples générer. Les clés de média sont dérivées des ids (cf. media.ts),
// jamais saisies à la main — renommer un id = régénérer le média.
// ═══════════════════════════════════════════════════════════════════════════

export type AstuceDomainId = "image" | "video" | "web";

// Formats d'exemple — traduits en pixels par le script de génération. Les
// cas pratiques Image n'utilisent que des formats du Studio Images (pas de
// 4:5) ; 16:10 = capture d'une page web sur écran d'ordinateur.
export type MediaRatio = "1:1" | "3:4" | "2:3" | "4:5" | "16:9" | "9:16" | "16:10";

export interface VocabTerm {
  // Le mot ou l'expression à retenir (affiché en gras).
  term: string;
  // Ce que ça produit à l'image, en langage simple.
  meaning: string;
  // Le fragment prêt à coller dans un prompt (aussi proposé dans le constructeur).
  snippet: string;
}

export interface VariationItem {
  id: string;
  label: string;
  // Remplace le marqueur {x} du prompt de base.
  snippet: string;
  // Ce qu'il faut observer sur le résultat.
  note: string;
}

// Série d'exemples où UNE seule brique change. Images : graine fixe pour que
// le reste de la scène bouge le moins possible. Vidéos : même image de départ
// (générée à partir de `startImage`) pour toutes les variations.
export interface VariationSet {
  intro: string;
  // Prompt complet contenant exactement un marqueur {x}.
  base: string;
  ratio: MediaRatio;
  seed?: number;
  // Vidéo uniquement : prompt de l'image de départ commune (image-to-video).
  startImage?: string;
  // Vidéo uniquement : générer la bande son (Seedance la génère par défaut).
  audio?: boolean;
  items: VariationItem[];
}

export interface BeforeAfter {
  weak: string;
  strong: string;
  explanation: string;
  ratio: MediaRatio;
  // Générer une illustration pour chacun des deux prompts.
  illustrated: boolean;
}

// Étape du constructeur de prompt alimentée par cette brique. Les choix
// proposés sont les `snippet` du vocabulaire ; l'élève peut aussi écrire.
export interface BuilderStep {
  label: string;
  placeholder: string;
  // Ordre d'assemblage dans le prompt final (≠ ordre pédagogique des briques).
  order: number;
  // Les étapes d'un même groupe sont jointes par des virgules, les groupes
  // entre eux forment des phrases distinctes.
  group: number;
}

export interface Brique {
  id: string;
  title: string;
  // La question que l'élève doit se poser.
  question: string;
  // Une ligne pour la carte de la grille.
  summary: string;
  why: string;
  variations?: VariationSet;
  vocabulary: VocabTerm[];
  // Structure à suivre, avec des [emplacements].
  formula: string;
  beforeAfter?: BeforeAfter;
  pitfalls: string[];
  tips: string[];
  builder?: BuilderStep;
}

export interface AnatomySegment {
  text: string;
  // Brique illustrée par ce passage (absent = liant neutre).
  brique?: string;
}

export interface Principle {
  title: string;
  text: string;
}

export interface AstuceDomain {
  id: AstuceDomainId;
  label: string;
  tagline: string;
  intro: string;
  studio: { path: "images" | "videos"; modelId: string; modelLabel: string };
  principles: Principle[];
  // Un bon prompt découpé en passages, chacun relié à sa brique.
  anatomy: { segments: AnatomySegment[]; ratio: MediaRatio; seed?: number; audio?: boolean };
  // Première étape du constructeur, toujours en saisie libre.
  builderSubject: { label: string; placeholder: string; order: number; group: number };
  briques: Brique[];
}

// ═══════════════════════════════════════════════════════════════════════════
// Cas pratiques — l'entrée principale des Astuces : un besoin concret
// (« ma photo de profil », « mon logo »…) et son prompt complet, décortiqué
// brique par brique. Le prompt est un `template` à emplacements {id} :
//   - un emplacement de `fields` = une info propre à l'élève (nom de marque…),
//     saisie libre ; `example` sert pour l'exemple généré ;
//   - un emplacement de `briques` = un choix, illustré par des variations
//     contrôlées : options[0] est le choix par défaut (celui du résultat
//     affiché), chaque autre option est générée en ne changeant QUE ce passage.
// ═══════════════════════════════════════════════════════════════════════════

export interface CasField {
  id: string;
  label: string;
  placeholder: string;
  example: string;
}

export interface CasOption {
  id: string;
  label: string;
  // Le passage inséré dans le template.
  snippet: string;
  // Ce qu'il faut observer sur le résultat.
  note: string;
}

export interface CasBrique {
  // Emplacement {id} dans le template.
  id: string;
  title: string;
  // Pourquoi cette brique compte POUR CE CAS.
  why: string;
  // Brique de la bibliothèque du domaine, pour aller plus loin.
  ref?: string;
  // Vidéo : la brique porte sur la bande son — exemples lus avec le son.
  sound?: boolean;
  options: CasOption[];
}

// Cas Web : une brique « retouche ». On ne réécrit pas le prompt : on garde
// la page obtenue et on demande à Claude, dans un second message, de n'en
// changer qu'un aspect (ici les animations). Les exemples partent tous du
// même code — le design est identique, seul l'aspect retouché change.
export interface CasRetoucheOption {
  id: string;
  label: string;
  // Le message de retouche, tel que l'élève l'envoie à Claude.
  prompt: string;
  note: string;
}

export interface CasRetouche {
  id: string;
  title: string;
  why: string;
  options: CasRetoucheOption[];
}

export interface AstuceCas {
  id: string;
  domain: AstuceDomainId;
  title: string;
  // Une ligne pour la carte de l'accueil.
  tagline: string;
  intro: string;
  duration: string;
  // Image : modèle du Studio (id de STUDIO_MODELS) présélectionné via
  // « Essayer ». Web : modèle de chat du Studio (id de STUDIO_CHAT_MODELS) qui
  // génère la page d'exemple — l'élève copie le prompt dans Claude.
  model: { id: string; label: string; why: string };
  // Doit faire partie des formats proposés par ce modèle dans le Studio.
  ratio: MediaRatio;
  // Graine des exemples (ignorée par les modèles qui n'en acceptent pas).
  seed?: number;
  // Vidéo : durée en secondes (option du modèle dans Le Studio) et présence
  // d'une bande son générée (Veo).
  video?: { duration: string; sound?: boolean };
  // Image à importer dans le Studio (photo de l'élève, de son produit…).
  // `example` décrit la photo de départ fictive générée pour les exemples ;
  // `fromKey` réutilise à la place un exemple déjà généré (ex. le portrait
  // du cas « photo de profil » animé par le cas vidéo).
  source?: { label: string; tips: string[]; example?: string; fromKey?: string };
  template: string;
  fields: CasField[];
  briques: CasBrique[];
  // Cas Web : retouche de la page obtenue (affichée après les briques).
  retouche?: CasRetouche;
  // Le prompt « naïf » qu'on écrit spontanément, pour l'avant/après.
  weak: { prompt: string; explanation: string };
  pitfalls: string[];
  tips: string[];
  // Déclinaisons du même cas.
  variants: { title: string; text: string }[];
}
