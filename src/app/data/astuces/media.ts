// Dérivation des médias d'exemple à partir du contenu. Partagé par l'UI
// (pour retrouver l'URL d'un exemple) et par
// scripts/generate-astuces-media.mjs (pour savoir quoi générer) : une seule
// source de vérité, aucune clé saisie à la main.
import type { AstuceCas, AstuceDomain, Brique, CasBrique, CasOption, MediaRatio, VariationSet } from "./types";
import { casExamplePrompt } from "./cas";

export type MediaKind = "image" | "video";

export interface MediaSpec {
  // Chemin dans le bucket, sans extension : "image/lumiere/contre-jour".
  key: string;
  kind: MediaKind;
  // Prompt EXACT envoyé au modèle — l'UI affiche le même texte à l'élève.
  prompt: string;
  ratio: MediaRatio;
  seed?: number;
  // Image : modèle du Studio (id de STUDIO_MODELS) — le script construit la
  // tâche Runware exactement comme Le Studio. Défaut : FLUX.2 [pro].
  model?: string;
  // Image : clé de l'image de référence (Image-to-Image, générée avant).
  sourceKey?: string;
  // Vidéo image-to-video : clé de l'image de départ (générée avant).
  startKey?: string;
  audio?: boolean;
}

const SLOT = "{x}";

export function fillVariation(set: VariationSet, snippet: string): string {
  return set.base.replace(SLOT, snippet);
}

export function anatomyPrompt(domain: AstuceDomain): string {
  return domain.anatomy.segments.map((s) => s.text).join("");
}

export const mediaKeys = {
  anatomy: (domain: AstuceDomain) => `${domain.id}/anatomie`,
  start: (domain: AstuceDomain, brique: Brique) => `${domain.id}/${brique.id}/_depart`,
  variation: (domain: AstuceDomain, brique: Brique, itemId: string) => `${domain.id}/${brique.id}/${itemId}`,
  beforeAfter: (domain: AstuceDomain, brique: Brique, side: "avant" | "apres") => `${domain.id}/${brique.id}/${side}`,
};

// Cas pratiques. L'option par défaut d'une brique EST le résultat : pas de
// média à part, sa clé renvoie sur celle du résultat.
export const casMediaKeys = {
  source: (cas: AstuceCas) => `cas/${cas.id}/_source`,
  result: (cas: AstuceCas) => `cas/${cas.id}/resultat`,
  weak: (cas: AstuceCas) => `cas/${cas.id}/avant`,
  option: (cas: AstuceCas, brique: CasBrique, option: CasOption) =>
    brique.options[0]?.id === option.id ? `cas/${cas.id}/resultat` : `cas/${cas.id}/${brique.id}/${option.id}`,
};

// Les photos de départ fictives sont générées avec FLUX.2 [pro] (texte seul).
const SOURCE_MODEL = "flux2-pro";

export function domainMediaKind(domain: AstuceDomain): MediaKind {
  return domain.id === "video" ? "video" : "image";
}

export function collectCasMedia(cas: AstuceCas): MediaSpec[] {
  const sourceKey = cas.source ? casMediaKeys.source(cas) : undefined;
  const base = { kind: "image" as const, ratio: cas.ratio, seed: cas.seed, model: cas.model.id, sourceKey };
  const specs: MediaSpec[] = [];
  if (cas.source && sourceKey) specs.push({ key: sourceKey, kind: "image", prompt: cas.source.example, ratio: cas.ratio, seed: cas.seed, model: SOURCE_MODEL });
  specs.push({ ...base, key: casMediaKeys.result(cas), prompt: casExamplePrompt(cas) });
  for (const brique of cas.briques) {
    for (const option of brique.options.slice(1)) {
      specs.push({ ...base, key: casMediaKeys.option(cas, brique, option), prompt: casExamplePrompt(cas, { brique, option }) });
    }
  }
  specs.push({ ...base, key: casMediaKeys.weak(cas), prompt: cas.weak.prompt });
  return specs;
}

// Les dépendances (image de référence, image de départ) sont résolues par le
// script, qui traite d'abord les médias sans dépendance.
export function collectMedia(domains: AstuceDomain[], cases: AstuceCas[] = []): MediaSpec[] {
  const specs: MediaSpec[] = cases.flatMap(collectCasMedia);
  for (const domain of domains) {
    const kind = domainMediaKind(domain);
    const model = kind === "image" ? domain.studio.modelId : undefined;
    specs.push({ key: mediaKeys.anatomy(domain), kind, prompt: anatomyPrompt(domain), ratio: domain.anatomy.ratio, seed: domain.anatomy.seed, model, audio: domain.anatomy.audio });

    for (const brique of domain.briques) {
      const v = brique.variations;
      if (v) {
        const startKey = v.startImage ? mediaKeys.start(domain, brique) : undefined;
        if (v.startImage && startKey) {
          specs.push({ key: startKey, kind: "image", prompt: v.startImage, ratio: v.ratio, seed: v.seed ?? 1, model: SOURCE_MODEL });
        }
        for (const item of v.items) {
          specs.push({ key: mediaKeys.variation(domain, brique, item.id), kind, prompt: fillVariation(v, item.snippet), ratio: v.ratio, seed: v.seed, model, startKey, audio: v.audio });
        }
      }
      const ba = brique.beforeAfter;
      if (ba?.illustrated) {
        const seed = v?.seed ?? 3;
        specs.push({ key: mediaKeys.beforeAfter(domain, brique, "avant"), kind, prompt: ba.weak, ratio: ba.ratio, seed, model });
        specs.push({ key: mediaKeys.beforeAfter(domain, brique, "apres"), kind, prompt: ba.strong, ratio: ba.ratio, seed, model });
      }
    }
  }
  return specs;
}
