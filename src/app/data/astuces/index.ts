// Point d'entrée des Astuces IA. Aucun import d'alias "@/" ici : ce module
// est aussi chargé hors Vite par scripts/generate-astuces-media.mjs.
import { IMAGE_DOMAIN } from "./image";
import { IMAGE_CAS } from "./cas-image";
import type { AstuceCas, AstuceDomain, AstuceDomainId } from "./types";

export * from "./types";
export * from "./media";
export * from "./builder";
export * from "./cas";

// V1 : section Image uniquement. Le domaine Vidéo (./video.ts) est rédigé
// mais pas encore publié — l'ajouter ici le rend visible partout.
export const ASTUCE_DOMAINS: AstuceDomain[] = [IMAGE_DOMAIN];

export const ASTUCE_CAS: AstuceCas[] = [...IMAGE_CAS];

export function getDomain(id: string | undefined): AstuceDomain | undefined {
  return ASTUCE_DOMAINS.find((d) => d.id === (id as AstuceDomainId));
}

export function getBrique(domain: AstuceDomain, id: string | undefined) {
  return domain.briques.find((b) => b.id === id);
}

export function getCas(id: string | undefined): AstuceCas | undefined {
  return ASTUCE_CAS.find((c) => c.id === id);
}
