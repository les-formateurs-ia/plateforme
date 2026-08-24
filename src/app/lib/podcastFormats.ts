// Catalogue des formats de podcast affichés côté élève (analogue front du
// catalogue serveur supabase/functions/_shared/podcast-formats.ts, dupliqué
// volontairement — voir le commentaire en tête de ce fichier). Les ids
// doivent rester identiques entre les deux catalogues.
import { BookOpenCheck, Zap, Scale, Swords, Smile, type LucideIcon } from "lucide-react";

export type PodcastVariantId = "approfondie" | "briefing" | "critique" | "debat" | "simple";

export interface PodcastFormatUi {
  id: PodcastVariantId;
  label: string;
  hint: string;
  description: string;
  Icon: LucideIcon;
}

export const DEFAULT_PODCAST_VARIANT: PodcastVariantId = "approfondie";

export const PODCAST_FORMATS: PodcastFormatUi[] = [
  {
    id: "approfondie",
    label: "Analyse approfondie",
    hint: "Exploration complète et détaillée du cours, avec exemples et liens entre les idées.",
    description: "Les deux animateurs prennent le temps de creuser chaque idée importante, tissent des liens entre les concepts et multiplient les exemples concrets. Idéal pour une compréhension fine et complète du cours.",
    Icon: BookOpenCheck,
  },
  {
    id: "briefing",
    label: "Briefing express",
    hint: "Le condensé ultra-efficace des points essentiels, pour une révision rapide.",
    description: "Droit à l'essentiel : uniquement les points, méthodes et définitions vraiment indispensables, sans exemple superflu ni digression. Parfait juste avant de passer à la pratique.",
    Icon: Zap,
  },
  {
    id: "critique",
    label: "Regard critique",
    hint: "Les animateurs challengent le cours : limites, nuances, pièges à éviter.",
    description: "Un animateur présente une notion, l'autre la challenge : preuves, limites, erreurs fréquentes. Pousse une vraie réflexion critique plutôt qu'une acceptation passive.",
    Icon: Scale,
  },
  {
    id: "debat",
    label: "Débat contradictoire",
    hint: "Deux points de vue s'affrontent sur la meilleure façon d'appliquer le cours.",
    description: "Les deux animateurs défendent chacun une approche différente, avec de vrais désaccords assumés, avant de se rejoindre sur une synthèse commune. Pour ancrer la compréhension par la confrontation d'idées.",
    Icon: Swords,
  },
  {
    id: "simple",
    label: "Mots tout simples",
    hint: "Le cours expliqué avec des mots du quotidien, sans jargon, pour tout comprendre.",
    description: "Aucun jargon non expliqué, des analogies de la vie de tous les jours, une idée à la fois. Pensé pour qu'un total débutant comprenne tout sans effort.",
    Icon: Smile,
  },
];
