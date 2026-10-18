import { interpolate } from "remotion";
import type { FieldCamera } from "../components/ParticleField";
import { EASE_IN_OUT } from "../theme";

// Leçon 2 — « Analyser son poste et identifier les tâches génératives
// automatisables ». Toutes les valeurs sont en secondes sur la piste audio
// d'origine (source_video/Analyser son poste….mp4, 156,04 s) : même durée,
// même minutage, pour y reposer ensuite l'avatar et la voix.
// Instants issus de la transcription mot à mot — cf. transcript.txt.
export const DURATION_S = 156.04;

export const CHAPTERS = [
  { id: "intro", label: "Introduction", from: 0, to: 25.6 },
  { id: "matrice", label: "La matrice du quick win", from: 25.6, to: 75.9 },
  { id: "reperer", label: "Repérer les bonnes tâches", from: 75.9, to: 127.5 },
  { id: "jouer", label: "À vous de jouer", from: 127.5, to: DURATION_S },
] as const;

export const SCENES = {
  intro: [0, 25.7],
  matrix: [25.5, 76.0],
  howTitle: [75.8, 79.6],
  criteria: [79.4, 127.6],
  outro: [127.4, DURATION_S],
} as const;

// --- Caméra de la constellation (toujours à droite de la zone avatar) ------
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
const CENTER: FieldCamera = { ...base, radius: 400, opacity: 0.6, energy: 0.4 };
const STARS: FieldCamera = { ...base, radius: 520, opacity: 0.42, energy: 0.04, scatter: 1, spin: 0.05 };
const OUTRO_R: FieldCamera = { ...base, cx: 1660, cy: 500, radius: 210, opacity: 1 };

const KEYS: [number, FieldCamera][] = [
  [0, { ...CENTER, scatter: 1, opacity: 0 }],
  [0.6, { ...CENTER, scatter: 1, opacity: 0.6 }],
  [3.0, HERO_R],
  // les pièges : la sphère se "réchauffe"
  [7.0, HERO_R],
  [8.2, { ...HERO_R, warmth: 1, energy: 0.15 }],
  [15.4, { ...HERO_R, warmth: 1, energy: 0.15 }],
  [16.6, HERO_R],
  // "le quick win" : la sphère s'emballe
  [23.6, HERO_R],
  [24.8, { ...HERO_R, energy: 0.95, spin: 0.35, radius: 260 }],
  [25.4, { ...HERO_R, energy: 0.95, spin: 0.35, radius: 260 }],
  [26.6, STARS],
  [75.2, STARS],
  [76.4, CENTER],
  [79.0, CENTER],
  [80.2, STARS],
  [126.8, STARS],
  [128.2, OUTRO_R],
  [152.0, OUTRO_R],
  [153.4, { ...OUTRO_R, energy: 0.7 }],
  [DURATION_S, { ...OUTRO_R, energy: 0.7 }],
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
  interpolate(t, [7.0, 8.2, 15.4, 16.6], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

// --- Effets sonores — discrets, volume bas ---------------------------------
export const SFX: { at: number; src: string; volume: number }[] = [
  { at: 24.6, src: "sfx/ding.wav", volume: 0.07 }, // "le quick win"
  ...[25.6, 75.9, 127.5].map((at) => ({ at, src: "sfx/whoosh.wav", volume: 0.14 })),
  // les quadrants s'allument
  ...[33.9, 43.3, 51.2].map((at) => ({ at, src: "sfx/mouse-click.wav", volume: 0.07 })),
  { at: 59.0, src: "sfx/ding.wav", volume: 0.09 }, // quick win
  // les trois caractéristiques
  ...[83.5, 98.6, 112.3].map((at) => ({ at, src: "sfx/switch.wav", volume: 0.09 })),
  { at: 123.8, src: "sfx/ding.wav", volume: 0.09 }, // "coche ces trois cases"
];
