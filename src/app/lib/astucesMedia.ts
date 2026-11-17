// Résout la clé d'un exemple des Astuces IA vers son URL publique. Le
// manifeste est écrit par scripts/generate-astuces-media.mjs : une clé
// absente = exemple pas encore généré (l'UI affiche un emplacement « à venir »).
import manifest from "@/app/data/astuces/media-manifest.json";
import type { AstuceCas, MediaRatio } from "@/app/data/astuces";

interface ManifestEntry { kind: "image" | "video"; ext: string; v: number }

const ENTRIES = manifest as Record<string, ManifestEntry>;
const BASE = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/astuces-media`;
// Images servies via la transformation Supabase : les originaux du Studio
// (JPEG/PNG de 1 à 2 Mo) sortent redimensionnés et en WEBP (~10× plus
// légers). 800 px couvre les plus grands cadres de la page en écran Retina.
// `resize=contain` est indispensable : avec la largeur seule, Supabase garde
// la hauteur d'origine et recadre (« cover ») — l'image apparaît zoomée.
const RENDER = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/render/image/public/astuces-media`;
const RENDER_PARAMS = "width=800&resize=contain&quality=75";

export interface AstuceMedia { url: string; kind: "image" | "video" }

export function astuceMedia(key: string | undefined): AstuceMedia | null {
  if (!key) return null;
  const entry = ENTRIES[key];
  if (!entry) return null;
  const url = entry.kind === "image"
    ? `${RENDER}/${key}.${entry.ext}?${RENDER_PARAMS}&v=${entry.v}`
    : `${BASE}/${key}.${entry.ext}?v=${entry.v}`;
  return { url, kind: entry.kind };
}

export const RATIO_CSS: Record<MediaRatio, string> = {
  "1:1": "1 / 1", "3:4": "3 / 4", "2:3": "2 / 3", "4:5": "4 / 5", "16:9": "16 / 9", "9:16": "9 / 16", "16:10": "16 / 10",
};

// Le Studio Images n'a pas de 4:5 : on retombe sur le 3:4 le plus proche.
const studioRatio = (path: string, ratio: MediaRatio) => (path === "images" && ratio === "4:5" ? "3:4" : ratio);

// Lien « Essayer dans le Studio » : modèle, prompt et format pré-remplis.
// `photo` : le prompt suppose une image importée (le Studio le rappelle).
export function studioLink(target: { path: string; modelId: string }, prompt: string, ratio?: MediaRatio, photo?: boolean): string {
  const params = new URLSearchParams({ model: target.modelId, prompt });
  if (ratio) params.set("ratio", studioRatio(target.path, ratio));
  if (photo) params.set("photo", "1");
  return `/studio/${target.path}?${params.toString()}`;
}

export function casStudioLink(cas: AstuceCas, prompt: string): string {
  return studioLink({ path: cas.domain === "video" ? "videos" : "images", modelId: cas.model.id }, prompt, cas.ratio, !!cas.source);
}
