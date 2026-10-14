// Petits outils partagés par les effets de particules (repris du site public,
// site/src/lib/canvas-utils.ts).

export type RGB = [number, number, number];

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smoothstep = (x: number) => x * x * (3 - 2 * x);
export const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
export const easeOut = (x: number) => 1 - Math.pow(1 - x, 3);

export function hex(c: string): RGB {
  const n = parseInt(c.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export const mixRGB = (a: RGB, b: RGB, t: number): RGB => [
  Math.round(a[0] + (b[0] - a[0]) * t),
  Math.round(a[1] + (b[1] - a[1]) * t),
  Math.round(a[2] + (b[2] - a[2]) * t),
];

/** Deterministic pseudo-random generator, so every visit draws the same composition. */
export function seeded(seed: number) {
  let s = seed;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

const sprites = new Map<string, HTMLCanvasElement>();
/** A soft radial glow, cached per colour; drawn with `lighter` compositing. */
export function glowSprite(rgb: RGB): HTMLCanvasElement {
  const key = rgb.join(',');
  let sprite = sprites.get(key);
  if (!sprite) {
    sprite = document.createElement('canvas');
    sprite.width = sprite.height = 64;
    const g = sprite.getContext('2d')!;
    const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, `rgba(${key},1)`);
    grad.addColorStop(0.35, `rgba(${key},.35)`);
    grad.addColorStop(1, `rgba(${key},0)`);
    g.fillStyle = grad;
    g.fillRect(0, 0, 64, 64);
    sprites.set(key, sprite);
  }
  return sprite;
}
