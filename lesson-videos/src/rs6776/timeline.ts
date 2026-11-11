// Moteur de timeline des vidéos RS6776 : tout est calé sur le manifeste produit
// par scripts/heygen-voice.mjs (voix off Tanguy scène par scène, horodatage de
// chaque mot) et complété par scripts/heygen-avatar.mjs (clips de Raul).
// Une scène commence quand la précédente a fini de parler, plus un court silence.

export type Word = { w: string; start: number; end: number };
export type ManifestScene = {
  id: string;
  title: string;
  avatar: "full" | "none" | "pip";
  text: string;
  audio: string;
  duration: number;
  words: Word[];
  avatarVideo?: string;
};
export type Manifest = { name: string; total: number; scenes: ManifestScene[] };

export type TimedScene = ManifestScene & { from: number; to: number };

export const LEAD_IN = 0.6; // s avant la première parole
export const GAP = 0.45; // silence entre deux scènes
export const TAIL = 1.8; // s après la dernière parole

export function buildTimeline(m: Manifest) {
  let t = LEAD_IN;
  const scenes: TimedScene[] = m.scenes.map((s) => {
    const from = t;
    const to = from + s.duration;
    t = to + GAP;
    return { ...s, from, to };
  });
  const duration = scenes[scenes.length - 1].to + TAIL;
  const byId = Object.fromEntries(scenes.map((s) => [s.id, s])) as Record<string, TimedScene>;
  return { scenes, duration, byId };
}

// Minuscules, sans accents ni ponctuation, sans élision en tête (« l'hallucination » → « hallucination »).
const norm = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\u2019/g, "'")
    .replace(/^(?:[ldjmnstc]|qu|jusqu|lorsqu|puisqu)'/, "").replace(/[^a-z0-9]/g, "");

// Instant (s, relatif au début de la scène) où la voix prononce `word`
// (n-ième occurrence, 1 par défaut). `fallback` si le mot est introuvable.
export function cue(scene: ManifestScene, word: string, nth = 1, fallback = 0): number {
  const target = word.split(/\s+/).map(norm);
  let seen = 0;
  for (let i = 0; i < scene.words.length; i++) {
    if (target.every((t, k) => norm(scene.words[i + k]?.w ?? "") === t)) {
      seen++;
      if (seen === nth) return scene.words[i].start;
    }
  }
  return fallback;
}
