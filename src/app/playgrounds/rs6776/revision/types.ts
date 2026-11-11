// Contenu d'une fiche de révision RS6776, rendu par RevisionSheet.tsx (tableau de
// bord coloré : tuiles à ouvrir dans n'importe quel ordre, blocs interactifs).
// Règle : la fiche synthétise le cours de la leçon, elle n'ajoute aucun fait.

export type IconName =
  | "sparkles" | "layers" | "scan" | "alert" | "target" | "graduation" | "check" | "briefcase"
  | "shield" | "lock" | "eye" | "file" | "list" | "calendar" | "users" | "wand" | "image" | "scale"
  | "search" | "message" | "gauge" | "accessibility" | "book" | "pen";

export type Tint = "violet" | "bleu" | "vert" | "corail" | "mauve";

export type Block =
  /** Paragraphe court (gras avec **…**). */
  | { type: "text"; text: string }
  /** Règle clé mise en avant. */
  | { type: "rule"; text: string }
  /** Cartes simples, côte à côte. */
  | { type: "cards"; items: { title: string; text: string; tint?: Tint; icon?: IconName }[] }
  /** Cartes à retourner : recto (définition), verso (ce que ça change). */
  | { type: "flip"; items: { title: string; front: string; back: string; icon?: IconName }[] }
  /** Deux colonnes. tone=true : gauche en vert (bon), droite en corail (risque). */
  | { type: "compare"; left: { title: string; text: string }; right: { title: string; text: string }; tone?: boolean }
  /** Étapes numérotées. */
  | { type: "steps"; items: { title: string; text?: string }[] }
  /** Liste de réflexes à cocher (particules quand tout est coché). */
  | { type: "checklist"; title?: string; items: string[] }
  /** Exemple avant/après (prompt, texte…) avec étiquettes. */
  | { type: "beforeAfter"; label?: string; before: string; after: string; beforeTag?: string; afterTag?: string }
  /** Exemple avec un tampon (ex. « Inventé », « Donnée sensible »). */
  | { type: "example"; label?: string; lines: string[]; stamp?: string; note?: string; danger?: boolean }
  /** Tableau. */
  | { type: "table"; caption?: string; headers: string[]; rows: string[][] }
  /** Exercice de tri : l'élève classe chaque élément dans une catégorie (correction immédiate). */
  | { type: "sort"; prompt: string; categories: string[]; items: { text: string; answer: string; why?: string }[] }
  /** Question à choix unique avec explication (non notée). */
  | { type: "choice"; question: string; options: { label: string; correct?: boolean; why?: string }[] }
  /** Les cinq outils de référence (constellation + comparaison), voir tools.ts. */
  | { type: "tools" };

export type RevisionModule = {
  id: string;
  title: string;
  teaser: string;
  tint: Tint;
  icon: IconName;
  wide?: boolean;
  blocks: Block[];
};

export type RevisionData = {
  lesson: string; // « 1.2 »
  title: string; // titre de la leçon
  /** Le mot du titre mis en avant (surligneur iris). Doit apparaître tel quel dans `title`. */
  highlight?: string;
  keyPoints: [string, string][]; // 3 points : [titre, phrase]
  modules: RevisionModule[];
  /** Module ajouté pour la variante d'un profil (paramètre `profil` du marqueur). */
  profiles?: Record<string, RevisionModule>;
  /** Ce que l'élève en fera à l'écrit. */
  exam: { exercise: number; label: string; steps: string[]; table?: { headers: string[]; row: string[] } };
  /** Cartes « Testez-vous » : [question, réponse]. Différentes du quiz. */
  flashcards: [string, string][];
};
