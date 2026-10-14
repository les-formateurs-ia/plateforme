import { loadFont } from "@remotion/google-fonts/FunnelDisplay";
import { Easing } from "remotion";

// Mêmes jetons que le site (les-formateurs-ia.fr, BaseLayout.css) et que la
// plateforme (src/app/theme/theme.tsx) : violet = élève, bleu/bleu-vert =
// formateur, beige = admin. Les vidéos reprennent la section sombre "AiStory"
// du site (fond encre + constellation de particules).
export const { fontFamily } = loadFont("normal", {
  weights: ["400", "500", "600", "700", "800"],
  subsets: ["latin", "latin-ext"],
});

export const C = {
  ink: "#07060B",
  ink2: "#0E0C15",
  violet: "#b58de0",
  violetMid: "#c69ce8",
  violetLight: "#dbacf0",
  bleu: "#78d5e2",
  teal: "#71dac9",
  bleuVert: "#6adeb1",
  beige: "#fbc2ad",
  beigeLight: "#fceccd",
  fg: "rgba(255,255,255,0.96)",
  fg2: "rgba(255,255,255,0.66)",
  fg3: "rgba(255,255,255,0.42)",
  hairline: "rgba(255,255,255,0.09)",
  hairline2: "rgba(255,255,255,0.14)",
} as const;

export const GRAD = {
  iris: `linear-gradient(100deg, ${C.violet}, ${C.violetLight} 30%, ${C.bleu} 60%, ${C.bleuVert} 75%, ${C.beige})`,
  violet: `linear-gradient(135deg, ${C.violetLight}, ${C.violet})`,
  bleu: `linear-gradient(135deg, ${C.bleu}, ${C.bleuVert})`,
  beige: `linear-gradient(135deg, ${C.beige}, ${C.beigeLight})`,
} as const;

// --ease-out-strong du site : sortie nette, longue décélération.
export const EASE = Easing.bezier(0.23, 1, 0.32, 1);
export const EASE_IN_OUT = Easing.bezier(0.65, 0, 0.35, 1);
export const EASE_IN = Easing.bezier(0.4, 0, 1, 1);

export const FPS = 30;
export const W = 1920;
export const H = 1080;

// Zone réservée à l'avatar (incrusté ensuite, en bas à gauche comme dans la
// version d'origine) : aucun contenu ne doit y entrer.
export const AVATAR_ZONE = { x: 0, y: 620, w: 600, h: 460 } as const;
// bord gauche des colonnes de texte qui descendent sous AVATAR_ZONE.y
export const SAFE_L = 620;

export const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;
