// Dérivation des médias d'exemple à partir du contenu. Partagé par l'UI
// (pour retrouver l'URL d'un exemple) et par
// scripts/generate-astuces-media.mjs (pour savoir quoi générer) : une seule
// source de vérité, aucune clé saisie à la main.
import type { AstuceCas, AstuceDomain, Brique, CasBrique, CasOption, CasRetouche, CasRetoucheOption, MediaRatio, VariationSet } from "./types";
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
  // Vidéo d'un cas pratique : durée (option du modèle dans Le Studio).
  duration?: string;
  // Page web : le prompt est envoyé à Claude (chat du Studio, `model` = id de
  // STUDIO_CHAT_MODELS), la page HTML obtenue est filmée (kind "video") ou
  // capturée (kind "image"). Le HTML est conservé à côté : <key>.html.
  page?: boolean;
  // Page web dérivée d'une autre : on part du code HTML de cette clé. Prompt
  // vide = simple capture de cette page ; sinon, message de retouche envoyé
  // à Claude avec le code.
  pageFrom?: string;
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
  source: (cas: AstuceCas) => cas.source?.fromKey ?? `cas/${cas.id}/_source`,
  result: (cas: AstuceCas) => `cas/${cas.id}/resultat`,
  weak: (cas: AstuceCas) => `cas/${cas.id}/avant`,
  // Cas Web : le résultat est une vidéo ; partout ailleurs que dans l'en-tête
  // et l'avant/après, on montre sa capture fixe (« apercu »).
  still: (cas: AstuceCas) => (cas.domain === "web" ? `cas/${cas.id}/apercu` : `cas/${cas.id}/resultat`),
  option: (cas: AstuceCas, brique: CasBrique, option: CasOption) =>
    brique.options[0]?.id === option.id ? casMediaKeys.still(cas) : `cas/${cas.id}/${brique.id}/${option.id}`,
  retouche: (cas: AstuceCas, retouche: CasRetouche, option: CasRetoucheOption) => `cas/${cas.id}/${retouche.id}/${option.id}`,
};

// Les photos de départ fictives sont générées avec FLUX.2 [pro] (texte seul).
const SOURCE_MODEL = "flux2-pro";

export function domainMediaKind(domain: AstuceDomain): MediaKind {
  return domain.id === "video" ? "video" : "image";
}

// Cas Web : le résultat et l'« avant » sont filmés (chargement + défilement,
// pour montrer les animations), les options sont des captures du haut de page.
function collectWebCasMedia(cas: AstuceCas): MediaSpec[] {
  const base = { ratio: cas.ratio, model: cas.model.id, page: true };
  const resultKey = casMediaKeys.result(cas);
  const specs: MediaSpec[] = [
    { ...base, kind: "video", key: resultKey, prompt: casExamplePrompt(cas) },
    { ...base, kind: "image", key: casMediaKeys.still(cas), prompt: "", pageFrom: resultKey },
  ];
  for (const brique of cas.briques) {
    for (const option of brique.options.slice(1)) {
      specs.push({ ...base, kind: "image", key: casMediaKeys.option(cas, brique, option), prompt: casExamplePrompt(cas, { brique, option }) });
    }
  }
  // Retouche : filmée (c'est l'animation qu'on montre), à partir du code du résultat.
  if (cas.retouche) {
    for (const option of cas.retouche.options) {
      specs.push({ ...base, kind: "video", key: casMediaKeys.retouche(cas, cas.retouche, option), prompt: option.prompt, pageFrom: resultKey });
    }
  }
  specs.push({ ...base, kind: "video", key: casMediaKeys.weak(cas), prompt: cas.weak.prompt });
  return specs;
}

export function collectCasMedia(cas: AstuceCas): MediaSpec[] {
  if (cas.domain === "web") return collectWebCasMedia(cas);
  const sourceKey = cas.source ? casMediaKeys.source(cas) : undefined;
  // Vidéo : générée dans Le Studio Vidéos (modèle, format, durée du cas),
  // en image-to-video quand le cas part d'une image.
  const base = cas.domain === "video"
    ? { kind: "video" as const, ratio: cas.ratio, model: cas.model.id, sourceKey, duration: cas.video?.duration }
    : { kind: "image" as const, ratio: cas.ratio, seed: cas.seed, model: cas.model.id, sourceKey };
  const specs: MediaSpec[] = [];
  // Photo de départ fictive, sauf si le cas réutilise un exemple existant.
  if (cas.source?.example && !cas.source.fromKey && sourceKey) {
    specs.push({ key: sourceKey, kind: "image", prompt: cas.source.example, ratio: cas.ratio, seed: cas.seed, model: SOURCE_MODEL });
  }
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
