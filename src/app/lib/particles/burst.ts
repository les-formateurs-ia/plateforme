/*
 * Gerbes de particules pour les moments de réussite (leçon terminée, exercice validé,
 * badge obtenu…) — même langage que les étincelles des boutons (button-pulse) et que
 * le réseau de la marque : particules aux couleurs du dégradé iris, reliées un instant
 * à leurs voisines, qui ralentissent puis s'éteignent.
 *
 * - burst(el)        : une gerbe circulaire depuis le centre d'un élément.
 * - sparkLine(el, f) : une traînée d'étincelles le long d'une barre, jusqu'à la fraction f
 *                      (une progression qui se remplit).
 *
 * Un seul canvas fixe sur la fenêtre pour toute l'app, créé au premier usage ; il n'anime
 * que tant qu'il reste des particules. Rien en mouvement réduit.
 */
import { glowSprite, hex, mixRGB, type RGB } from './canvas-utils';

const IRIS: [number, RGB][] = [
  [0, hex('#b58de0')], [0.3, hex('#dbacf0')], [0.6, hex('#78d5e2')], [0.75, hex('#6adeb1')], [1, hex('#fbc2ad')],
];
const WHITE: RGB = [255, 255, 255];
// Sur fond clair, les pastels sont un peu approfondis, sinon ils disparaissent dans le blanc.
const DEEPEN: RGB = [74, 44, 120];
const LINK_DIST = 34;
const MAX = 260;

interface P { x: number; y: number; vx: number; vy: number; g: number; age: number; life: number; size: number; color: RGB; light: boolean }

const reduced = matchMedia('(prefers-reduced-motion: reduce)');
let canvas: HTMLCanvasElement | null = null;
let ctx: CanvasRenderingContext2D;
let W = 0, H = 0, raf = 0, last = 0;
let parts: P[] = [];

function irisAt(f: number): RGB {
  const x = Math.max(0, Math.min(1, f));
  for (let i = 1; i < IRIS.length; i++) {
    const [p1, c1] = IRIS[i];
    if (x <= p1) {
      const [p0, c0] = IRIS[i - 1];
      return mixRGB(c0, c1, (x - p0) / (p1 - p0));
    }
  }
  return IRIS[IRIS.length - 1][1];
}

const isLight = () => document.documentElement.dataset.theme !== 'dark';

function ensureCanvas(host: Element) {
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:2147483000';
    ctx = canvas.getContext('2d')!;
  }
  // Dans une modale ouverte, le canvas doit être dans sa couche pour être vu.
  const parent = host.closest('dialog[open],[role="dialog"]') ?? document.body;
  if (canvas.parentElement !== parent) parent.append(canvas);
  if (W !== innerWidth || H !== innerHeight) {
    W = innerWidth; H = innerHeight;
    const dpr = Math.min(2, devicePixelRatio || 1);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
}

function push(p: P) {
  parts.push(p);
  if (parts.length > MAX) parts.splice(0, parts.length - MAX);
}

function start(host: Element) {
  ensureCanvas(host);
  if (!raf) { last = performance.now(); raf = requestAnimationFrame(loop); }
}

/** Une gerbe circulaire depuis le centre de l'élément (ou d'un point de la fenêtre). */
export function burst(target: Element | { x: number; y: number }, { count = 70, power = 1 }: { count?: number; power?: number } = {}) {
  if (reduced.matches) return;
  const host = target instanceof Element ? target : document.body;
  let cx: number, cy: number, rx = 0, ry = 0;
  if (target instanceof Element) {
    const r = target.getBoundingClientRect();
    cx = r.left + r.width / 2; cy = r.top + r.height / 2; rx = r.width / 2; ry = r.height / 2;
  } else { cx = target.x; cy = target.y; }
  const light = isLight();
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2 + Math.random() * 0.4;
    const v = (140 + Math.random() * 260) * power;
    const color = mixRGB(irisAt(i / count), WHITE, Math.random() * 0.2);
    push({
      x: cx + Math.cos(a) * rx * 0.6, y: cy + Math.sin(a) * ry * 0.6,
      vx: Math.cos(a) * v, vy: Math.sin(a) * v - 60 * power, g: 90,
      age: 0, life: 0.9 + Math.random() * 0.8, size: 1.2 + Math.random() * 1.6,
      color: light ? mixRGB(color, DEEPEN, 0.22) : color, light,
    });
  }
  start(host);
}

/** Étincelles le long d'une barre horizontale, de son début jusqu'à la fraction `to`. */
export function sparkLine(el: Element, to = 1, { count = 26 }: { count?: number } = {}) {
  if (reduced.matches) return;
  const r = el.getBoundingClientRect();
  const light = isLight();
  const end = r.left + r.width * Math.max(0, Math.min(1, to));
  for (let i = 0; i < count; i++) {
    const f = Math.random();
    const x = r.left + (end - r.left) * (0.55 + f * 0.45); // surtout près de la pointe
    const color = irisAt((x - r.left) / Math.max(1, r.width));
    push({
      x, y: r.top + r.height / 2,
      vx: -(20 + Math.random() * 70), vy: -(30 + Math.random() * 90), g: 70,
      age: 0, life: 0.5 + Math.random() * 0.6, size: 0.9 + Math.random() * 1.1,
      color: light ? mixRGB(color, DEEPEN, 0.28) : color, light,
    });
  }
  start(el);
}

function frame(now: number) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  const drag = Math.exp(-2.6 * dt);
  parts = parts.filter((p) => (p.age += dt) < p.life);
  for (const p of parts) {
    p.vx *= drag;
    p.vy = p.vy * drag + p.g * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
  }
  ctx.clearRect(0, 0, W, H);
  ctx.lineWidth = 1;
  for (let i = 0; i < parts.length; i++) {
    const a = parts[i];
    for (let j = i + 1; j < parts.length; j++) {
      const b = parts[j];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (d > LINK_DIST) continue;
      ctx.globalAlpha = (1 - d / LINK_DIST) * 0.45 * (1 - a.age / a.life) * (1 - b.age / b.life);
      ctx.strokeStyle = `rgb(${a.color})`;
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    }
  }
  for (const p of parts) {
    const k = 1 - p.age / p.life;
    // Un halo ne se lit que sur fond sombre ; sur fond clair il salirait le blanc.
    ctx.globalCompositeOperation = p.light ? 'source-over' : 'lighter';
    ctx.globalAlpha = k;
    ctx.fillStyle = `rgb(${p.color})`;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, 6.283); ctx.fill();
    if (!p.light) {
      ctx.globalAlpha = k * 0.45;
      ctx.drawImage(glowSprite(p.color), p.x - 7, p.y - 7, 14, 14);
    }
  }
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
}

function loop(now: number) {
  raf = 0;
  frame(now);
  if (parts.length) raf = requestAnimationFrame(loop);
  else ctx.clearRect(0, 0, W, H);
}
