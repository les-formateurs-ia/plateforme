import { interpolate } from "remotion";
import type { FieldCamera } from "../components/ParticleField";
import { EASE_IN_OUT } from "../theme";

// Leçon 4 — « Installer et configurer les outils IA ». Valeurs en secondes
// sur la piste audio d'origine (VIDEOS NATHALIE/Installer et configurer…mp4,
// 269,55 s) : même durée, même minutage, pour y reposer avatar et voix.
// Instants issus de la transcription mot à mot — cf. transcript.txt.
export const DURATION_S = 269.55;

export const CHAPTERS = [
  { id: "intro", label: "Introduction", from: 0, to: 44.0 },
  { id: "compte", label: "Étape 1 · Créer son compte", from: 44.0, to: 70.9 },
  { id: "interface", label: "Étape 2 · L'interface", from: 70.9, to: 154.9 },
  { id: "saisie", label: "Étape 3 · Saisie & modèles", from: 154.9, to: 238.9 },
  { id: "hub", label: "Hub IA", from: 238.9, to: 247.9 },
  { id: "fin", label: "Conclusion", from: 247.9, to: DURATION_S },
] as const;

export const SCENES = {
  intro: [0, 44.1],
  account: [43.9, 71.0],
  ui: [70.8, 155.0],
  prompt: [154.8, 239.0],
  hub: [238.8, 248.0],
  outro: [247.8, DURATION_S],
} as const;

const base: FieldCamera = {
  cx: 1100,
  cy: 540,
  radius: 360,
  yaw: 0,
  pitch: 0.28,
  opacity: 0.9,
  warmth: 0,
  energy: 0.3,
  scatter: 0,
  spin: 0.11,
};
const HERO_R: FieldCamera = { ...base, cx: 1590, cy: 500, radius: 240, opacity: 1 };
const STARS: FieldCamera = { ...base, radius: 520, opacity: 0.38, energy: 0.04, scatter: 1, spin: 0.05 };
const OUTRO_R: FieldCamera = { ...base, cx: 1660, cy: 500, radius: 210, opacity: 1 };

const KEYS: [number, FieldCamera][] = [
  [0, { ...HERO_R, scatter: 1, opacity: 0 }],
  [0.6, { ...HERO_R, scatter: 1, opacity: 0.6 }],
  [3.0, HERO_R],
  [43.2, HERO_R],
  [44.6, STARS],
  [247.2, STARS],
  [248.6, { ...OUTRO_R, energy: 0.5 }],
  [DURATION_S, { ...OUTRO_R, energy: 0.5 }],
];

const FIELDS = Object.keys(base) as (keyof FieldCamera)[];
const TIMES = KEYS.map((k) => k[0]);

export const cameraAt = (t: number): FieldCamera => {
  const out = { ...base };
  for (const f of FIELDS) {
    out[f] = interpolate(
      t,
      TIMES,
      KEYS.map((k) => k[1][f]),
      { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE_IN_OUT },
    );
  }
  return out;
};

export const warmthAt = () => 0;

// --- Effets sonores — discrets, volume bas (surtout les clics du curseur) ---
export const SFX: { at: number; src: string; volume: number }[] = [
  ...[43.9, 70.9, 154.9, 238.9, 247.9].map((at) => ({ at, src: "sfx/whoosh.wav", volume: 0.12 })),
  // clics du curseur de démonstration
  ...[53.0, 60.3, 91.2, 141.9, 175.8, 204.0, 241.1].map((at) => ({ at, src: "sfx/mouse-click.wav", volume: 0.09 })),
  { at: 227.2, src: "sfx/ding.wav", volume: 0.07 }, // "par défaut"
];
