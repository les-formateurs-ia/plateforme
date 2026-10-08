// Repris tel quel du site public (site/src/lib/button-pulse.ts) : chargé une
// fois au démarrage (main.tsx), il équipe tous les boutons .sweep de l'app.
/*
 * Button pulse particles, for every button with the shared hover (.sweep in global.css).
 * As the button gives its light pulse, a few particles leave its edges and drift outwards,
 * in the gradient's colour at that point; the closest ones wire up for a moment (the hero
 * network in miniature), then they fade. On a touch screen, where there is no hover, a press
 * sends them instead.
 *
 * One canvas over the viewport for the whole site, created on first use; it only animates
 * while there are particles. Nothing with reduced motion.
 */
import { glowSprite, hex, mixRGB, type RGB } from './canvas-utils';

const COUNT = 12;
const LINK_DIST = 26;
// --grad-iris, as stops along the button.
const IRIS: [number, RGB][] = [
  [0, hex('#b58de0')],
  [0.3, hex('#dbacf0')],
  [0.6, hex('#78d5e2')],
  [0.75, hex('#6adeb1')],
  [1, hex('#fbc2ad')],
];
const WHITE: RGB = [255, 255, 255];
// On a light page the pastels are deepened a little, or they would vanish into the white.
const DEEPEN: RGB = [74, 44, 120];

interface Particle { x: number; y: number; vx: number; vy: number; age: number; life: number; size: number; color: RGB; light: boolean }

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

/** Whether the button stands on a light background (the first opaque one behind it). */
function onLight(el: Element): boolean {
  for (let node = el.parentElement; node; node = node.parentElement) {
    const m = getComputedStyle(node).backgroundColor.match(/[\d.]+/g);
    if (!m || (m.length > 3 && Number(m[3]) < 0.5)) continue;
    const [r, g, b] = m.map(Number);
    return 0.2126 * r + 0.7152 * g + 0.0722 * b > 140;
  }
  return true;
}

const reduced = matchMedia('(prefers-reduced-motion: reduce)');
let canvas: HTMLCanvasElement | null = null;
let ctx: CanvasRenderingContext2D;
let W = 0, H = 0, raf = 0, last = 0;
let particles: Particle[] = [];

function ensureCanvas(host: Element) {
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:2147483000';
    ctx = canvas.getContext('2d')!;
  }
  // A button in an open dialog: the canvas must be in the dialog's top layer to be seen.
  const parent = host.closest('dialog[open]') ?? document.body;
  if (canvas.parentElement !== parent) parent.append(canvas);
  if (W !== innerWidth || H !== innerHeight) {
    W = innerWidth;
    H = innerHeight;
    const dpr = Math.min(2, devicePixelRatio || 1);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
}

/** A few particles leave the button's edges, outwards, spread around its perimeter. */
function emit(el: HTMLElement) {
  const r = el.getBoundingClientRect();
  const white = getComputedStyle(el).getPropertyValue('--btn-sweep').trim() === '#fff';
  const light = !white && onLight(el);
  const perimeter = 2 * (r.width + r.height);
  for (let i = 0; i < COUNT; i++) {
    // Evenly spaced along the edge, with some jitter, so they surround the button.
    let d = ((i + Math.random() * 0.8) / COUNT) * perimeter;
    let x: number, y: number, nx: number, ny: number;
    if (d < r.width) { x = r.left + d; y = r.top; nx = 0; ny = -1; }
    else if ((d -= r.width) < r.height) { x = r.right; y = r.top + d; nx = 1; ny = 0; }
    else if ((d -= r.height) < r.width) { x = r.right - d; y = r.bottom; nx = 0; ny = 1; }
    else { d -= r.width; x = r.left; y = r.bottom - d; nx = -1; ny = 0; }
    const v = 45 + Math.random() * 55;
    const color = white ? WHITE : mixRGB(irisAt((x - r.left) / r.width), WHITE, Math.random() * 0.25);
    particles.push({
      x, y,
      vx: nx * v + (Math.random() - 0.5) * 30,
      vy: ny * v + (Math.random() - 0.5) * 30,
      age: 0, life: 0.5 + Math.random() * 0.35, size: 0.9 + Math.random() * 1,
      color: light ? mixRGB(color, DEEPEN, 0.28) : color, light,
    });
  }
  if (particles.length > 120) particles.splice(0, particles.length - 120);
  ensureCanvas(el);
  if (!raf) {
    last = performance.now();
    raf = requestAnimationFrame(loop);
  }
}

function frame(now: number) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  const drag = Math.exp(-4 * dt);
  particles = particles.filter((p) => (p.age += dt) < p.life);
  for (const p of particles) {
    p.vx *= drag;
    p.vy *= drag;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
  }

  ctx.clearRect(0, 0, W, H);
  ctx.lineWidth = 1;
  for (let i = 0; i < particles.length; i++) {
    const a = particles[i];
    for (let j = i + 1; j < particles.length; j++) {
      const b = particles[j];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (d > LINK_DIST) continue;
      ctx.globalAlpha = (1 - d / LINK_DIST) * 0.5 * (1 - a.age / a.life) * (1 - b.age / b.life);
      ctx.strokeStyle = `rgb(${a.color})`;
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    }
  }
  for (const p of particles) {
    const k = 1 - p.age / p.life;
    // A glow only reads on a dark background; on a light one it would muddy the white.
    ctx.globalCompositeOperation = p.light ? 'source-over' : 'lighter';
    ctx.globalAlpha = k;
    ctx.fillStyle = `rgb(${p.color})`;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, 6.283); ctx.fill();
    if (!p.light) {
      ctx.globalAlpha = k * 0.45;
      ctx.drawImage(glowSprite(p.color), p.x - 6, p.y - 6, 12, 12);
    }
  }
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
}

function loop(now: number) {
  raf = 0;
  frame(now);
  if (particles.length) raf = requestAnimationFrame(loop);
  else ctx.clearRect(0, 0, W, H);
}

const buttonOf = (target: EventTarget | null) =>
  target instanceof Element ? target.closest<HTMLElement>('.sweep:not(:disabled)') : null;

// Mouse: once per entry onto a button, with its pulse.
document.addEventListener('pointerover', (e) => {
  if (reduced.matches || e.pointerType !== 'mouse') return;
  const el = buttonOf(e.target);
  if (el && !el.contains(e.relatedTarget as Node | null)) emit(el);
});

// Touch and pen: no hover, so a press sends them.
document.addEventListener('pointerdown', (e) => {
  if (reduced.matches || e.pointerType === 'mouse') return;
  const el = buttonOf(e.target);
  if (el) emit(el);
});
