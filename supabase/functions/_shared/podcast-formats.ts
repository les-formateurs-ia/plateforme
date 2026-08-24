// Catalogue des formats de podcast (analogue serveur de src/app/lib/podcastFormats.ts,
// dupliqué volontairement — les Edge Functions Deno et le front Vite/React sont deux
// runtimes séparés qui ne partagent pas de module, même pattern que la duplication
// existante de SPEAKER_A/SPEAKER_B entre generate-podcast-script et process-podcast-chunk).
// Les ids doivent rester identiques entre les deux catalogues.
export type PodcastVariantId = "approfondie" | "briefing" | "critique" | "debat" | "simple";

export interface PodcastFormatSpec {
  id: PodcastVariantId;
  label: string;
  wordRange: { min: number; max: number };
  directive: string;
  // true uniquement pour 'briefing' : ce format sélectionne volontairement
  // l'essentiel plutôt que de tout couvrir, donc la RÈGLE ABSOLUE de
  // couverture intégrale du cours doit être assouplie pour ce format.
  relaxCoverageRule?: boolean;
}

export const DEFAULT_PODCAST_VARIANT: PodcastVariantId = "approfondie";

export const PODCAST_FORMATS: Record<PodcastVariantId, PodcastFormatSpec> = {
  approfondie: {
    id: "approfondie",
    label: "Analyse approfondie",
    wordRange: { min: 300, max: 400 },
    directive: `Explore le cours en profondeur : les deux animateurs relient les concepts entre eux, multiplient les exemples concrets, creusent le "pourquoi" derrière chaque notion, avec un ton curieux et passionné. Ne survole rien.`,
  },
  briefing: {
    id: "briefing",
    label: "Briefing express",
    wordRange: { min: 150, max: 220 },
    directive: `Ne garde que les points, définitions et méthodes strictement indispensables. Aucune digression, aucun exemple superflu. Phrases courtes et percutantes, rythme rapide façon flash info. Termine impérativement par un récapitulatif en 2 à 3 points clés à retenir.`,
    relaxCoverageRule: true,
  },
  critique: {
    id: "critique",
    label: "Regard critique",
    wordRange: { min: 300, max: 380 },
    directive: `Un animateur présente une notion du cours, l'autre la challenge activement : il demande des preuves, souligne les limites, pointe les pièges et erreurs fréquentes, questionne les cas où ça ne marche pas. Reste rigoureusement fidèle au contenu du cours — n'invente jamais un contre-exemple ou une limite qui n'en découle pas réellement. Termine par une liste de points de vigilance à garder en tête.`,
  },
  debat: {
    id: "debat",
    label: "Débat contradictoire",
    wordRange: { min: 320, max: 420 },
    directive: `Chaque animateur défend une interprétation ou une priorité différente — mais toutes deux valables et fidèles au cours — sur la meilleure façon de comprendre ou d'appliquer le contenu. Le désaccord doit être réel et assumé ("je ne suis pas d'accord", "attends, nuance"), mais respectueux, sans jamais déformer ni inventer les faits du cours lui-même. Termine IMPÉRATIVEMENT par une synthèse commune qui réconcilie les deux points de vue, pour que l'élève reparte avec un message clair plutôt qu'une confusion.`,
  },
  simple: {
    id: "simple",
    label: "Mots tout simples",
    wordRange: { min: 280, max: 380 },
    directive: `Bannis tout jargon technique sans l'expliquer aussitôt avec des mots du quotidien. Utilise des analogies concrètes et familières, avance lentement, une idée à la fois, et fais reformuler ou résumer régulièrement par l'un des animateurs pour vérifier que ça reste limpide ("tu vois ce que je veux dire ?"). Ton chaleureux et patient, jamais condescendant.`,
  },
};

// Résolution défensive : toute Edge Function qui reçoit un `variant` d'un
// appelant (client ou autre fonction) doit passer par ici avant de l'utiliser
// dans un chemin de storage ou un filtre SQL, plutôt que de faire confiance à
// une chaîne arbitraire.
export function resolvePodcastFormat(variant: unknown): PodcastFormatSpec {
  if (typeof variant === "string" && variant in PODCAST_FORMATS) {
    return PODCAST_FORMATS[variant as PodcastVariantId];
  }
  return PODCAST_FORMATS[DEFAULT_PODCAST_VARIANT];
}
