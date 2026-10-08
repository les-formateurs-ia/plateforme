/*
 * Nuage de particules qui se rassemble en symbole (repris des cartes de formation du site
 * public, site/src/lib/symbol-field.ts) : au repos un nuage lâche qui dérive ; au survol ou
 * au focus de la carte, les points volent en arc et dessinent l'icône de la carte, reliés à
 * leurs voisins ; ils se dispersent quand le pointeur s'en va. Sur écran tactile, le symbole
 * se forme quand la carte passe au milieu de l'écran.
 *
 * Ici le symbole est n'importe quelle icône de l'app (SVG lucide sérialisé) : elle est
 * dessinée sur un petit canvas hors écran, dont on échantillonne les pixels pleins.
 */
import { clamp01, easeInOut, glowSprite, hex, mixRGB, seeded, type RGB } from './canvas-utils';

export const SYMBOL_THEMES: Record<'violet' | 'bleu' | 'beige' | 'iris', [string, string]> = {
  violet: ['#dbacf0', '#b58de0'],
  bleu: ['#78d5e2', '#6adeb1'],
  beige: ['#fbc2ad', '#f4a98c'],
  iris: ['#b58de0', '#78d5e2'],
};

const TRAIL_FADE = 0.3;
// Sur fond clair, les pastels sont un peu approfondis, sinon ils disparaissent dans le blanc.
const DEEPEN: RGB = [74, 44, 120];
const APPROACH = 0.075;
const PUSH_RADIUS = 56;
const PUSH = 18;

interface Dot {
  cx: number; cy: number; sx: number; sy: number;
  phase: number; speed: number; delay: number; size: number; color: RGB;
  px: number; py: number; ox: number; oy: number; near: number[];
}

/** Dessine le SVG sur un canvas 160 × 160 et tire `count` points parmi ses pixels pleins. */
export async function sampleSvg(svgMarkup: string, count: number, rnd: () => number): Promise<Array<[number, number]>> {
  // Trait épaissi pour que l'icône se lise en particules.
  const svg = svgMarkup
    .replace(/stroke-width="[^"]*"/g, 'stroke-width="2.3"')
    .replace(/currentColor/g, '#fff')
    .replace(/<svg([^>]*)>/, (_m, attrs: string) => `<svg${attrs.replace(/\s(width|height)="[^"]*"/g, '')} width="320" height="320">`);
  return sampleImage(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`, count, rnd, 'alpha');
}

/**
 * Tire `count` points dans la forme d'une image : pixels opaques ('alpha', icônes SVG) ou
 * pixels colorés sur fond gris ou blanc ('saturation', logos sur fond uni). La forme est
 * recentrée et agrandie pour remplir la boîte (0,06 → 0,94), en gardant ses proportions.
 */
export async function sampleImage(src: string, count: number, rnd: () => number, mode: 'alpha' | 'saturation'): Promise<Array<[number, number]>> {
  const S = 200;
  const img = new Image();
  img.src = src;
  await img.decode();
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const g = c.getContext('2d', { willReadFrequently: true })!;
  const k = Math.min(S / img.naturalWidth, S / img.naturalHeight);
  const w = img.naturalWidth * k, h = img.naturalHeight * k;
  g.drawImage(img, (S - w) / 2, (S - h) / 2, w, h);
  const data = g.getImageData(0, 0, S, S).data;
  const hit = (i: number) => {
    if (mode === 'alpha') return data[i + 3] > 120;
    const r = data[i], gg = data[i + 1], b = data[i + 2];
    const max = Math.max(r, gg, b), min = Math.min(r, gg, b);
    return data[i + 3] > 120 && max > 40 && (max - min) / max > 0.3;
  };
  const filled: Array<[number, number]> = [];
  let x0 = S, y0 = S, x1 = 0, y1 = 0;
  for (let y = 0; y < S; y += 2) {
    for (let x = 0; x < S; x += 2) {
      if (!hit((y * S + x) * 4)) continue;
      filled.push([x, y]);
      if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
    }
  }
  if (!filled.length) return Array.from({ length: count }, () => [0.5, 0.5]);
  const span = Math.max(x1 - x0, y1 - y0, 1);
  const scale = 0.88 / span;
  const ox = 0.5 - ((x0 + x1) / 2) * scale, oy = 0.5 - ((y0 + y1) / 2) * scale;
  return Array.from({ length: count }, () => {
    const [x, y] = filled[Math.floor(rnd() * filled.length)];
    return [ox + (x + rnd() * 2) * scale, oy + (y + rnd() * 2) * scale];
  });
}

export interface SymbolField {
  hold(on: boolean): void;
  destroy(): void;
}

export type ShapeSource = { svg: string } | { image: string };

export function mountSymbolField(card: HTMLElement, canvas: HTMLCanvasElement, shape: ShapeSource,
  { colors = SYMBOL_THEMES.violet, links = true, dark = false, rest = 'cloud' }: {
    colors?: [string, string]; links?: boolean; dark?: boolean;
    /** Au repos : nuage qui se forme au survol ('cloud', site public), ou illustration déjà formée qui s'anime au survol ('symbol'). */
    rest?: 'cloud' | 'symbol';
  } = {}): SymbolField {
  const key = 'svg' in shape ? shape.svg : shape.image;
  const ctx = canvas.getContext('2d')!;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const touch = matchMedia('(hover: none)').matches;
  const [c1, c2] = colors.map(hex) as [RGB, RGB];
  let W = 0, H = 0, raf = 0, p = 0, target = rest === 'symbol' ? 1 : 0, visible = true, hovering = false, held = false, destroyed = false;
  // Survol en mode 'symbol' : liens et points plus vifs tant que le pointeur reste.
  let hot = 0;
  let pulseTimer = 0;
  let dots: Dot[] = [];
  let pointer: { x: number; y: number } | null = null;
  const t0 = performance.now();

  async function build() {
    const r = canvas.getBoundingClientRect();
    W = r.width; H = r.height;
    if (!W || !H) return;
    const dpr = Math.min(2, devicePixelRatio || 1);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (dots.length) return;
    const rnd = seeded(key.length * 131 + 7);
    const box = Math.min(W, H) * (rest === 'symbol' ? 0.86 : 0.78);
    const count = Math.round(Math.max(90, Math.min(rest === 'symbol' ? 420 : 160, (box * box) / (rest === 'symbol' ? 40 : 110))));
    const fine = Math.max(0.6, Math.min(1, box / 180)) * (rest === 'symbol' ? 0.8 : 1);
    const points = 'svg' in shape ? await sampleSvg(shape.svg, count, rnd) : await sampleImage(shape.image, count, rnd, 'saturation');
    if (destroyed) return;
    dots = points.map(([sx, sy]) => {
      const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd());
      return {
        cx: Math.cos(a) * d, cy: Math.sin(a) * d, sx, sy,
        phase: rnd() * Math.PI * 2, speed: 0.4 + rnd() * 0.8, delay: rnd(),
        size: (1.1 + rnd() * 1.3) * fine * (dark ? 1 : 1.25), color: dark ? mixRGB(c1, c2, rnd()) : mixRGB(mixRGB(c1, c2, rnd()), DEEPEN, 0.22), px: NaN, py: NaN, ox: 0, oy: 0, near: [],
      };
    });
    if (links) {
      dots.forEach((a, i) => {
        a.near = dots
          .map((b, j) => ({ j, d: j === i ? Infinity : Math.hypot(a.sx - b.sx, a.sy - b.sy) }))
          .sort((m, n) => m.d - n.d).slice(0, 2).filter(({ d }) => d < 0.09).map(({ j }) => j);
      });
    }
    kick();
  }

  function frame(now: number) {
    const t = reduced ? 0 : (now - t0) / 1000;
    p += (target - p) * (reduced ? 1 : APPROACH);
    hot += ((hovering ? 1 : 0) - hot) * 0.1;
    const box = Math.min(W, H) * (rest === 'symbol' ? 0.86 : 0.78);
    const bx = (W - box) / 2, by = (H - box) / 2;
    const rx = W * 0.42, ry = H * 0.36;
    if (reduced) ctx.clearRect(0, 0, W, H);
    else {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = `rgba(0,0,0,${TRAIL_FADE})`;
      ctx.fillRect(0, 0, W, H);
    }
    ctx.globalCompositeOperation = 'source-over';
    ctx.lineCap = 'round';
    for (const d of dots) {
      const e = easeInOut(clamp01((p - d.delay * 0.3) / 0.7));
      const cloudX = W / 2 + d.cx * rx + Math.sin(t * d.speed + d.phase) * 10;
      const cloudY = H / 2 + d.cy * ry + Math.cos(t * d.speed * 0.8 + d.phase) * 8;
      const symX = bx + d.sx * box + Math.sin(t * 3 + d.phase) * 0.6;
      const symY = by + d.sy * box + Math.cos(t * 3 + d.phase) * 0.6;
      const bow = Math.sin(Math.PI * e) * 26 * (d.delay - 0.5);
      let x = cloudX + (symX - cloudX) * e + bow;
      let y = cloudY + (symY - cloudY) * e - bow * 0.6;
      let tx = 0, ty = 0;
      if (pointer) {
        const dx = x - pointer.x, dy = y - pointer.y, dist = Math.hypot(dx, dy);
        if (dist < PUSH_RADIUS && dist > 0.1) {
          const k = (1 - dist / PUSH_RADIUS) ** 2 * PUSH;
          tx = (dx / dist) * k; ty = (dy / dist) * k;
        }
      }
      d.ox += (tx - d.ox) * 0.18; d.oy += (ty - d.oy) * 0.18;
      x += d.ox; y += d.oy;
      ctx.globalAlpha = (dark ? 0.4 : 0.6) + (dark ? 0.6 : 0.4) * e;
      const size = d.size * (0.85 + 0.35 * e) * (1 + hot * 0.25);
      if (!reduced && !Number.isNaN(d.px) && Math.hypot(x - d.px, y - d.py) < 40) {
        ctx.strokeStyle = `rgb(${d.color})`;
        ctx.lineWidth = size * 1.4;
        ctx.beginPath(); ctx.moveTo(d.px, d.py); ctx.lineTo(x, y); ctx.stroke();
      } else {
        ctx.fillStyle = `rgb(${d.color})`;
        ctx.beginPath(); ctx.arc(x, y, size, 0, Math.PI * 2); ctx.fill();
      }
      d.px = x; d.py = y;
    }
    if (links && p > 0.05) {
      ctx.lineWidth = 0.8;
      for (const d of dots) {
        const e = easeInOut(clamp01((p - d.delay * 0.3) / 0.7));
        if (e < 0.3) continue;
        for (const j of d.near) {
          const n = dots[j];
          ctx.globalAlpha = (e - 0.3) * (0.5 + hot * 0.4);
          ctx.strokeStyle = `rgb(${d.color})`;
          ctx.beginPath(); ctx.moveTo(d.px, d.py); ctx.lineTo(n.px, n.py); ctx.stroke();
        }
      }
    }
    if (p > 0.02 && (dark || hot > 0.05)) {
      ctx.globalCompositeOperation = 'lighter';
      for (const d of dots) {
        const e = easeInOut(clamp01((p - d.delay * 0.3) / 0.7));
        if (e < 0.05) continue;
        ctx.globalAlpha = e * (dark ? 0.16 + hot * 0.14 : hot * 0.22);
        ctx.drawImage(glowSprite(d.color), d.px - 7, d.py - 7, 14, 14);
      }
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  const loop = (now: number) => {
    raf = 0;
    frame(now);
    if (visible && !reduced && !destroyed) raf = requestAnimationFrame(loop);
  };
  function kick() { if (!raf && !destroyed) raf = requestAnimationFrame(loop); }
  const update = () => {
    if (rest === 'symbol') {
      // L'illustration est formée au repos ; au survol elle se disperse un
      // instant puis se reforme (dispersion et regroupement, pas un fondu).
      if (hovering && !reduced) {
        target = 0.3;
        window.clearTimeout(pulseTimer);
        pulseTimer = window.setTimeout(() => { target = 1; kick(); }, 240);
      } else target = 1;
    } else target = hovering || held ? 1 : 0;
    kick();
  };
  const assemble = (on: boolean) => { hovering = on; update(); };
  const onEnter = () => assemble(true);
  const onLeave = () => { pointer = null; if (!card.contains(document.activeElement)) assemble(false); };
  const onMove = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse' || reduced) return;
    const r = canvas.getBoundingClientRect();
    pointer = { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const onFocusOut = (e: FocusEvent) => { if (!card.contains(e.relatedTarget as Node | null)) assemble(false); };
  const seen = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (visible) kick(); });
  const centred = new IntersectionObserver(([entry]) => assemble(entry.isIntersecting), { rootMargin: '-30% 0px -30% 0px' });
  const ro = new ResizeObserver(() => { void build(); });

  void build();
  seen.observe(card);
  ro.observe(canvas);
  if (touch && rest === 'cloud') centred.observe(card);
  card.addEventListener('pointerenter', onEnter);
  card.addEventListener('pointerleave', onLeave);
  card.addEventListener('focusin', onEnter);
  card.addEventListener('focusout', onFocusOut);
  card.addEventListener('pointermove', onMove);

  return {
    hold(on) { held = on; update(); },
    destroy() {
      destroyed = true;
      cancelAnimationFrame(raf);
      window.clearTimeout(pulseTimer);
      seen.disconnect(); centred.disconnect(); ro.disconnect();
      card.removeEventListener('pointerenter', onEnter);
      card.removeEventListener('pointerleave', onLeave);
      card.removeEventListener('focusin', onEnter);
      card.removeEventListener('focusout', onFocusOut);
      card.removeEventListener('pointermove', onMove);
    },
  };
}
