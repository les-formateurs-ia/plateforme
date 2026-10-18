import { interpolate } from "remotion";
import type { FieldCamera } from "../components/ParticleField";
import { C, EASE_IN_OUT } from "../theme";

// Leçon 5 — « Les bases du Prompt Engineering ». Valeurs en secondes sur la
// piste audio d'origine (VIDEOS NATHALIE/Les bases du Prompt Engineering.mp4,
// 237,08 s) : même durée, même minutage, pour y reposer avatar et voix.
// Instants issus de la transcription mot à mot — cf. transcript.txt.
export const DURATION_S = 237.08;

export const CHAPTERS = [
  { id: "intro", label: "Introduction", from: 0, to: 54.4 },
  { id: "vague", label: "Une demande trop vague", from: 54.4, to: 85.3 },
  { id: "piliers", label: "Les 5 piliers", from: 85.3, to: 154.0 },
  { id: "verif", label: "Vérifier la réponse", from: 154.0, to: 170.6 },
  { id: "pratique", label: "Pour vous, Nathalie", from: 170.6, to: 208.2 },
  { id: "fin", label: "Conclusion", from: 208.2, to: DURATION_S },
] as const;

export const SCENES = {
  intro: [0, 20.7],
  myth: [20.5, 54.5],
  vague: [54.3, 85.4],
  pillars: [85.2, 119.0],
  rebuild: [118.8, 154.2],
  verify: [154.0, 170.8],
  nathalie: [170.6, 208.4],
  outro: [208.2, DURATION_S],
} as const;

// Les cinq piliers, partagés par plusieurs scènes.
export const PILLARS = [
  { id: "role", label: "Le rôle", q: "Quelle posture ou expertise l'IA doit-elle adopter ?", ex: "Manager d'équipe projet", color: C.violetLight },
  { id: "cible", label: "La cible", q: "À qui s'adresse exactement ce texte ?", ex: "Membres de mon équipe technique", color: C.bleu },
  { id: "objectif", label: "L'objectif", q: "Qu'est-ce que le résultat doit accomplir concrètement ?", ex: "Report de la mise en production", color: C.bleuVert },
  { id: "contexte", label: "Le contexte", q: "Quelles sont les informations de fond indispensables ?", ex: "Attente validation client", color: C.beige },
  { id: "format", label: "Le format", q: "Quelle est la structure, la longueur et le ton attendus ?", ex: "Message Teams, avec 3 puces d'action", color: C.violet },
] as const;

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
  [20.0, HERO_R],
  [21.4, STARS],
  // l'IA "invente" : désordre et teinte chaude
  [30.6, STARS],
  [31.8, { ...STARS, warmth: 1, energy: 0.2 }],
  [40.0, { ...STARS, warmth: 1, energy: 0.2 }],
  [41.4, STARS],
  [207.6, STARS],
  [209.0, OUTRO_R],
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
  interpolate(t, [30.6, 31.8, 40.0, 41.4, 60.8, 62.0, 84.0, 85.2], [0, 1, 1, 0, 0, 0.7, 0.7, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

// --- Effets sonores — discrets, volume bas ---------------------------------
export const SFX: { at: number; src: string; volume: number }[] = [
  ...[20.6, 54.4, 85.3, 118.9, 154.0, 170.6, 208.2].map((at) => ({ at, src: "sfx/whoosh.wav", volume: 0.12 })),
  // les trois résultats divergents
  ...[70.5, 73.7, 75.6].map((at) => ({ at, src: "sfx/mouse-click.wav", volume: 0.07 })),
  // les cinq piliers
  ...[91.9, 95.7, 99.3, 103.6, 107.9].map((at) => ({ at, src: "sfx/switch.wav", volume: 0.07 })),
  // le prompt se reconstruit
  ...[123.5, 127.2, 133.1, 137.6, 141.6].map((at) => ({ at, src: "sfx/mouse-click.wav", volume: 0.07 })),
  { at: 148.6, src: "sfx/ding.wav", volume: 0.08 },
];
