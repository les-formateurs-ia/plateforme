import { interpolate } from "remotion";
import type { FieldCamera } from "../components/ParticleField";
import { EASE_IN_OUT } from "../theme";

// Leçon 6 — « Sécurité et gestion des données ». Valeurs en secondes sur la
// piste audio d'origine (VIDEOS NATHALIE/Sécurité et gestion des données.mp4,
// 238,47 s) : même durée, même minutage, pour y reposer avatar et voix.
// Instants issus de la transcription mot à mot — cf. transcript.txt.
export const DURATION_S = 238.47;

export const CHAPTERS = [
  { id: "intro", label: "Introduction", from: 0, to: 36.0 },
  { id: "conf", label: "1 · Données confidentielles", from: 36.0, to: 76.2 },
  { id: "perso", label: "2 · Données personnelles", from: 76.2, to: 114.4 },
  { id: "sens", label: "Les données sensibles", from: 114.4, to: 142.7 },
  { id: "risques", label: "Les risques avec l'IA", from: 142.7, to: 181.9 },
  { id: "rh", label: "Pour vous, Nathalie", from: 181.9, to: 208.9 },
  { id: "fin", label: "Conclusion", from: 208.9, to: DURATION_S },
] as const;

export const SCENES = {
  intro: [0, 36.2],
  confidential: [36.0, 76.4],
  personal: [76.2, 114.6],
  sensitive: [114.4, 142.9],
  risks: [142.7, 182.1],
  hr: [181.9, 209.1],
  outro: [208.9, DURATION_S],
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
const STARS: FieldCamera = { ...base, radius: 520, opacity: 0.4, energy: 0.04, scatter: 1, spin: 0.05 };
const OUTRO_R: FieldCamera = { ...base, cx: 1660, cy: 500, radius: 210, opacity: 1 };

const KEYS: [number, FieldCamera][] = [
  [0, { ...HERO_R, scatter: 1, opacity: 0 }],
  [0.6, { ...HERO_R, scatter: 1, opacity: 0.6 }],
  [3.0, HERO_R],
  // "la moindre imprudence peut entraîner une fuite majeure"
  [27.4, HERO_R],
  [28.6, { ...HERO_R, warmth: 1, energy: 0.9, spin: 0.3 }],
  [30.8, { ...HERO_R, warmth: 1, energy: 0.9, spin: 0.3 }],
  [32.0, HERO_R],
  [35.4, HERO_R],
  [36.8, STARS],
  // les risques : teinte chaude
  [142.0, STARS],
  [143.4, { ...STARS, warmth: 1 }],
  [181.2, { ...STARS, warmth: 1 }],
  [182.6, STARS],
  [208.2, STARS],
  [209.6, OUTRO_R],
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

export const warmthAt = (t: number) =>
  interpolate(t, [27.4, 28.6, 30.8, 32.0, 142.0, 143.4, 181.2, 182.6], [0, 1, 1, 0, 0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

// --- Effets sonores — discrets, volume bas ---------------------------------
export const SFX: { at: number; src: string; volume: number }[] = [
  ...[36.0, 76.2, 114.4, 142.7, 181.9, 208.9].map((at) => ({ at, src: "sfx/whoosh.wav", volume: 0.12 })),
  { at: 28.2, src: "sfx/mouse-click.wav", volume: 0.07 }, // imprudence
  ...[52.4, 63.4].map((at) => ({ at, src: "sfx/switch.wav", volume: 0.07 })), // internes / externes
  { at: 122.0, src: "sfx/switch.wav", volume: 0.08 }, // strictement interdit
  ...[151.3, 170.8].map((at) => ({ at, src: "sfx/mouse-click.wav", volume: 0.07 })), // les deux risques
  { at: 199.4, src: "sfx/mouse-click.wav", volume: 0.08 }, // violation grave
  ...[221.0, 223.0, 225.9].map((at) => ({ at, src: "sfx/mouse-click.wav", volume: 0.07 })), // 3 questions
];
