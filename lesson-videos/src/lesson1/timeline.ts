import { interpolate } from "remotion";
import type { FieldCamera } from "../components/ParticleField";
import { EASE_IN_OUT } from "../theme";

// Toutes les valeurs sont en secondes sur la piste audio d'origine
// (source_video/Leçon_1_Finale.mp4, 370,33 s) : la vidéo a exactement la même
// durée et le même minutage, pour y reposer ensuite l'avatar et la voix.
// Les instants viennent de la transcription mot à mot — cf. transcript.txt.
export const DURATION_S = 370.33;

export const CHAPTERS = [
  { id: "intro", label: "Introduction", from: 0, to: 36.1 },
  { id: "c1", label: "Chapitre 1 · Situer l'IA générative", from: 36.1, to: 98.7 },
  { id: "c2", label: "Chapitre 2 · Comment ça fonctionne", from: 98.7, to: 173.1 },
  { id: "c3", label: "Chapitre 3 · Les limites", from: 173.1, to: 203.5 },
  { id: "c4", label: "Chapitre 4 · Panorama des outils", from: 203.5, to: 349.9 },
  { id: "outro", label: "Conclusion", from: 349.9, to: DURATION_S },
] as const;

// Début/fin de chaque scène (léger chevauchement de 0,2 s pour les fondus).
export const SCENES = {
  intro: [0, 36.3],
  ch1: [36.1, 40.8],
  layers: [40.6, 72.6],
  create: [72.4, 98.9],
  ch2: [98.7, 101.8],
  llm: [101.6, 127.6],
  transformer: [127.4, 140.0],
  nextToken: [139.8, 173.3],
  ch3: [173.1, 181.7],
  halluc: [181.5, 203.7],
  ch4: [203.5, 207.5],
  chatgpt: [207.3, 241.9],
  claude: [241.7, 269.1],
  gemini: [268.9, 290.9],
  copilot: [290.7, 321.5],
  firefly: [321.3, 350.1],
  outro: [349.9, DURATION_S],
} as const;

// --- "Caméra" de la constellation de particules --------------------------

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
const HERO_R: FieldCamera = { ...base, cx: 1590, cy: 500, radius: 240, opacity: 1, energy: 0.3 };
const CENTER: FieldCamera = { ...base, radius: 400, opacity: 0.6, energy: 0.4 };
const BACK: FieldCamera = { ...base, cy: 520, radius: 640, opacity: 0.3, energy: 0.08, scatter: 0.12 };
const STARS: FieldCamera = { ...base, radius: 520, opacity: 0.42, energy: 0.04, scatter: 1, spin: 0.05 };
const OUTRO_R: FieldCamera = { ...base, cx: 1660, cy: 500, radius: 210, opacity: 1, energy: 0.3 };
const LLM_R: FieldCamera = { ...base, cx: 1570, cy: 520, radius: 250, opacity: 1, energy: 0.2 };
const warm = (c: FieldCamera): FieldCamera => ({ ...c, warmth: 1 });

const KEYS: [number, FieldCamera][] = [
  [0, { ...CENTER, scatter: 1, opacity: 0 }],
  [0.6, { ...CENTER, scatter: 1, opacity: 0.6 }],
  [3.2, HERO_R],
  [35.6, HERO_R],
  [36.8, CENTER],
  [40.2, CENTER],
  [41.4, BACK],
  [72.0, BACK],
  [73.2, STARS],
  [98.2, STARS],
  [99.4, CENTER],
  [101.2, CENTER],
  [102.6, LLM_R],
  [110.8, LLM_R],
  [112.4, { ...LLM_R, energy: 0.9, spin: 0.22 }],
  [126.6, { ...LLM_R, energy: 0.9, spin: 0.22 }],
  [128.0, BACK],
  [139.4, BACK],
  [140.6, STARS],
  [172.6, STARS],
  [173.8, warm(CENTER)],
  [181.0, warm(CENTER)],
  [182.2, warm(BACK)],
  [196.6, warm(BACK)],
  [197.8, warm({ ...CENTER, opacity: 0.45, radius: 460 })],
  [203.0, warm({ ...CENTER, opacity: 0.45, radius: 460 })],
  [204.0, CENTER],
  [206.8, CENTER],
  [208.0, STARS],
  [349.4, STARS],
  [350.8, OUTRO_R],
  [367.4, OUTRO_R],
  [368.8, { ...CENTER, energy: 0.7 }],
  [DURATION_S, { ...CENTER, energy: 0.7 }],
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

// Teinte du fond : chaude (beige) pendant le chapitre sur les limites.
export const warmthAt = (t: number) =>
  interpolate(t, [172.6, 173.8, 203.0, 204.0], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

export const TOOL_ROWS = {
  chatgpt: [8.6, 14.2, 21.3, 24.3],
  claude: [3.9, 9.4, 16.1, 21.4],
  gemini: [3.1, 10.8, 4.5, 16.9],
  copilot: [3.3, 9.7, 18.7, 22.9],
  firefly: [5.1, 10.1, 16.1, 20.4],
};

// --- Effets sonores — discrets, volume bas ---------------
export const SFX: { at: number; src: string; volume: number }[] = [
  // ouvertures de chapitre
  ...[36.2, 98.8, 173.2, 203.6].map((at) => ({ at, src: "sfx/whoosh.wav", volume: 0.16 })),
  // passage d'un outil à l'autre
  ...[207.5, 241.9, 269.1, 290.9, 321.5].map((at) => ({ at, src: "sfx/whoosh.wav", volume: 0.1 })),
  { at: 350.0, src: "sfx/whoosh.wav", volume: 0.12 },
  // l'IA générative apparaît au cœur des disques
  { at: 61.5, src: "sfx/ding.wav", volume: 0.08 },
  // envoi du prompt, puis les quatre cartes
  { at: 84.6, src: "sfx/switch.wav", volume: 0.14 },
  ...[84.9, 85.7, 87.6, 89.7].map((at) => ({ at, src: "sfx/mouse-click.wav", volume: 0.07 })),
  // "souris" est choisi
  { at: 170.1, src: "sfx/ding.wav", volume: 0.1 },
  // passages inventés surlignés
  ...[189.9, 190.5, 191.3, 191.86].map((at) => ({ at, src: "sfx/mouse-click.wav", volume: 0.06 })),
  // merci
  { at: 367.9, src: "sfx/ding.wav", volume: 0.09 },
];
