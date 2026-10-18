import { interpolate } from "remotion";
import type { FieldCamera } from "../components/ParticleField";
import { EASE_IN_OUT } from "../theme";

// Leçon 3 — « Comment sécuriser son usage de l'IA ». Valeurs en secondes sur
// la piste audio d'origine (source_video/Comment sécuriser….mp4, 195,10 s) :
// même durée, même minutage, pour y reposer ensuite l'avatar et la voix.
// Instants issus de la transcription mot à mot — cf. transcript.txt.
export const DURATION_S = 195.1;

export const CHAPTERS = [
  { id: "intro", label: "Introduction", from: 0, to: 23.5 },
  { id: "min", label: "Le strict nécessaire", from: 23.5, to: 47.3 },
  { id: "anon", label: "Pilier 1 · Anonymiser", from: 47.3, to: 77.9 },
  { id: "acces", label: "Pilier 2 · Restreindre l'accès", from: 77.9, to: 113.5 },
  { id: "revue", label: "Pilier 3 · Revue manuelle", from: 113.5, to: 135.3 },
  { id: "pratique", label: "En pratique", from: 135.3, to: 158.7 },
  { id: "fin", label: "Conclusion", from: 158.7, to: DURATION_S },
] as const;

export const SCENES = {
  intro: [0, 23.6],
  minimise: [23.4, 47.4],
  anonymise: [47.2, 78.0],
  access: [77.8, 113.6],
  review: [113.4, 135.4],
  practice: [135.2, 158.8],
  outro: [158.6, DURATION_S],
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
const STARS: FieldCamera = { ...base, radius: 520, opacity: 0.42, energy: 0.04, scatter: 1, spin: 0.05 };
const OUTRO_R: FieldCamera = { ...base, cx: 1660, cy: 500, radius: 210, opacity: 1 };

const KEYS: [number, FieldCamera][] = [
  [0, { ...HERO_R, scatter: 1, opacity: 0 }],
  [0.6, { ...HERO_R, scatter: 1, opacity: 0.6 }],
  [3.0, HERO_R],
  [22.8, HERO_R],
  [24.2, STARS],
  // données sensibles repérées → teinte chaude jusqu'à l'anonymisation
  [41.6, STARS],
  [42.8, { ...STARS, warmth: 1 }],
  [70.0, { ...STARS, warmth: 1 }],
  [71.4, STARS],
  [134.6, STARS],
  [136.0, OUTRO_R],
  [144.6, OUTRO_R],
  [146.0, STARS],
  [158.0, STARS],
  [159.4, { ...OUTRO_R, energy: 0.6 }],
  [DURATION_S, { ...OUTRO_R, energy: 0.6 }],
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

export const warmthAt = (t: number) =>
  interpolate(t, [41.6, 42.8, 70.0, 71.4], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

// --- Effets sonores — discrets, volume bas ---------------------------------
export const SFX: { at: number; src: string; volume: number }[] = [
  ...[23.5, 47.3, 77.9, 113.5, 135.3, 158.7].map((at) => ({ at, src: "sfx/whoosh.wav", volume: 0.13 })),
  // le document est filtré
  { at: 32.6, src: "sfx/switch.wav", volume: 0.1 },
  // donnée sensible repérée
  { at: 46.6, src: "sfx/mouse-click.wav", volume: 0.08 },
  // le nom est masqué, puis le reste
  { at: 64.0, src: "sfx/mouse-click.wav", volume: 0.07 },
  ...[66.7, 67.5, 68.3, 69.1, 69.9].map((at) => ({ at, src: "sfx/mouse-click.wav", volume: 0.05 })),
  // les quatre règles d'accès
  ...[94.6, 98.4, 102.5, 107.9].map((at) => ({ at, src: "sfx/mouse-click.wav", volume: 0.07 })),
  // revue manuelle : tout est propre
  { at: 127.6, src: "sfx/ding.wav", volume: 0.08 },
  { at: 154.1, src: "sfx/switch.wav", volume: 0.09 }, // "salarié A"
  { at: 158.9, src: "sfx/ding.wav", volume: 0.09 }, // félicitations
];
