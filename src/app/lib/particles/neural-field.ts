/*
 * Le réseau neuronal de la marque (repris du héros du site public, site/src/lib/ai-field.ts,
 * sans sa chorégraphie de défilement) : un flux de nœuds traverse la zone de gauche à droite,
 * chacun relié à ses voisins les plus proches ; les liens se refont au fil du mouvement et des
 * signaux circulent sur certains d'entre eux, comme un réseau qui réfléchit.
 *
 * - excite(n) : le réseau s'active un moment (plus de signaux, plus rapides) — l'IA travaille.
 * - Le pointeur écarte doucement les nœuds (souris uniquement).
 * - Au montage, le réseau se condense à partir d'un bruit dispersé.
 *
 * Le canvas n'anime que lorsqu'il est visible ; en mouvement réduit, une image fixe.
 */
import { clamp01, easeOut, glowSprite, hex, mixRGB, seeded, type RGB } from './canvas-utils';

// Le flux traverse les trois dégradés de la charte : violet, bleu, beige.
const IRIS = ['#b58de0', '#c69ce8', '#dbacf0', '#78d5e2', '#71dac9', '#6adeb1', '#fbc2ad', '#fbc2ad'];
const MAX_LINKS = 3;
const FIRING = 0.1; // part des nœuds qui envoient des signaux au repos
const EXCITED_FIRING = 0.45; // … et au plus fort de l'activité
const CALM = 0.985; // activité conservée d'une image à l'autre
const PUSH_RADIUS = 80;
const PUSH = 26;

export interface NeuralFieldOptions {
  /** Fond sombre : liens plus fins, signaux lumineux (composition « lighter »). */
  dark?: boolean;
  /** Nœuds pour 10 000 px² (défaut 5 — la densité du héros du site). */
  density?: number;
  /** Hauteur de la bande parcourue, en part de la hauteur (1 = toute la zone). */
  band?: number;
  /** Vitesse du flux (défaut 1). */
  speed?: number;
  /** Graine : la même composition à chaque visite. */
  seed?: number;
}

export interface NeuralField {
  excite(amount: number): void;
  setDark(dark: boolean): void;
  destroy(): void;
}

interface Node {
  u: number; v: number; speed: number; phase: number; scale: number; rgb: RGB;
  delay: number; scatterX: number; scatterY: number;
  fireRank: number; fireSpeed: number; firePhase: number;
  x: number; y: number; ox: number; oy: number; alpha: number;
}

export function mountNeuralField(canvas: HTMLCanvasElement, options: NeuralFieldOptions = {}): NeuralField {
  const ctx = canvas.getContext('2d')!;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const density = options.density ?? 5;
  const bandShare = options.band ?? 0.8;
  const flow = 3 * (options.speed ?? 1);
  let dark = !!options.dark;

  let W = 0, H = 0, linkDist = 56;
  let nodes: Node[] = [];
  let raf = 0, visible = true, energy = 0, signalTime = 0, lastNow = 0;
  let pointer: { x: number; y: number } | null = null;
  const t0 = performance.now();

  function makeNodes(n: number) {
    const rnd = seeded(options.seed ?? 7);
    const bell = () => (rnd() + rnd() + rnd()) / 1.5 - 1;
    nodes = Array.from({ length: n }, () => {
      const u = rnd();
      const bi = Math.max(0, Math.min(IRIS.length - 1, Math.floor((u + (rnd() - 0.5) * 0.18) * IRIS.length)));
      return {
        u, v: bell(), speed: 0.006 + rnd() * 0.012, phase: rnd() * 6.283, scale: 0.7 + rnd() * 0.7,
        rgb: hex(IRIS[bi]), delay: rnd(), scatterX: rnd(), scatterY: rnd(),
        fireRank: rnd(), fireSpeed: 0.5 + rnd() * 0.9, firePhase: rnd(),
        x: 0, y: 0, ox: 0, oy: 0, alpha: 1,
      };
    });
  }

  function layout() {
    W = canvas.offsetWidth; H = canvas.offsetHeight;
    if (!W || !H) return;
    const small = W < 700;
    const dpr = Math.min(small ? 1.5 : 2, devicePixelRatio || 1);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    linkDist = small ? 46 : 58;
    const count = Math.round(Math.max(80, Math.min(small ? 340 : 700, ((W * H * bandShare) / 10000) * density)));
    if (nodes.length !== count) makeNodes(count);
  }

  const grid = new Map<number, number[]>();
  const cellKey = (cx: number, cy: number) => cx * 4096 + cy;

  function frame(now: number) {
    if (!W || !H) return;
    const t = reduced ? 4 : (now - t0) / 1000;
    const dt = lastNow ? Math.min(0.05, (now - lastNow) / 1000) : 0;
    lastNow = now;
    signalTime += dt * (1 + energy * 1.8);
    energy = energy < 0.01 ? 0 : energy * CALM;
    const firing = FIRING + energy * (EXCITED_FIRING - FIRING);
    const introT = reduced ? 1 : clamp01((now - t0) / 1600);
    const bandY = H / 2, bandH = H * bandShare, slope = W < 700 ? -0.04 : -0.1;

    for (const n of nodes) {
      const uu = (((n.u + t * n.speed * flow * (1 + energy * 0.6)) % 1) + 1) % 1;
      let x = (uu * 1.24 - 0.12) * W;
      const cy = bandY + (x - W / 2) * slope + Math.sin((x / W) * 5.2 + t * 0.5) * bandH * 0.12;
      let y = cy + n.v * bandH * 0.5 + Math.sin(t * 1.1 + n.phase) * bandH * 0.05;
      // Le pointeur écarte les nœuds ; ils reviennent quand il s'éloigne.
      let tx = 0, ty = 0;
      if (pointer) {
        const dx = x - pointer.x, dy = y - pointer.y, d = Math.hypot(dx, dy);
        if (d < PUSH_RADIUS && d > 0.1) {
          const k = (1 - d / PUSH_RADIUS) ** 2 * PUSH;
          tx = (dx / d) * k; ty = (dy / d) * k;
        }
      }
      n.ox += (tx - n.ox) * 0.15; n.oy += (ty - n.oy) * 0.15;
      x += n.ox; y += n.oy;
      if (introT < 1) { // le réseau se condense à partir d'un bruit dispersé
        const ie = easeOut(clamp01((introT - n.delay * 0.35) / 0.65));
        x = n.scatterX * W + (x - n.scatterX * W) * ie;
        y = n.scatterY * H + (y - n.scatterY * H) * ie;
        n.alpha = ie;
      } else n.alpha = 1;
      n.x = x; n.y = y;
    }

    ctx.clearRect(0, 0, W, H);

    // ---------- Liens ----------
    grid.clear();
    const D = linkDist;
    nodes.forEach((n, i) => {
      const key = cellKey(Math.floor(n.x / D) + 64, Math.floor(n.y / D) + 64);
      const cell = grid.get(key);
      if (cell) cell.push(i); else grid.set(key, [i]);
    });
    ctx.lineCap = 'round';
    // Les pastels ont besoin de corps sur blanc ; sur noir ils brillent d'eux-mêmes.
    ctx.lineWidth = dark ? 1 : 1.6;
    const lineBase = dark ? 0.38 : 0.7;
    const fired: Array<[Node, Node]> = [];
    nodes.forEach((a, i) => {
      if (a.alpha < 0.3) return;
      const gx = Math.floor(a.x / D) + 64, gy = Math.floor(a.y / D) + 64;
      let links = 0;
      for (let ox = -1; ox <= 1 && links < MAX_LINKS; ox++) {
        for (let oy = -1; oy <= 1 && links < MAX_LINKS; oy++) {
          const cell = grid.get(cellKey(gx + ox, gy + oy));
          if (!cell) continue;
          for (const j of cell) {
            if (j <= i) continue;
            const b = nodes[j];
            const d = Math.hypot(a.x - b.x, a.y - b.y);
            if (d > D || d < 0.5) continue;
            const w = 1 - d / D;
            ctx.globalAlpha = w * w * lineBase * Math.min(a.alpha, b.alpha);
            ctx.strokeStyle = `rgb(${a.rgb})`;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
            if (a.fireRank < firing && links === 0) fired.push([a, b]);
            if (++links >= MAX_LINKS) break;
          }
        }
      }
    });

    // ---------- Nœuds ----------
    for (const n of nodes) {
      if (n.alpha <= 0.02) continue;
      ctx.globalAlpha = n.alpha * (dark ? 0.8 : 1);
      ctx.fillStyle = `rgb(${n.rgb})`;
      ctx.beginPath(); ctx.arc(n.x, n.y, (dark ? 1.3 : 2.4) * n.scale, 0, 6.283); ctx.fill();
    }

    // ---------- Signaux le long des liens ----------
    if (!reduced) {
      ctx.globalCompositeOperation = dark ? 'lighter' : 'source-over';
      for (const [a, b] of fired) {
        const f = (signalTime * a.fireSpeed + a.firePhase) % 1;
        const x = a.x + (b.x - a.x) * f, y = a.y + (b.y - a.y) * f;
        const s = dark ? 18 : 22;
        // Les signaux ajoutés par l'activité apparaissent en fondu plutôt que d'un coup.
        const share = a.fireRank < FIRING ? 1 : clamp01((firing - a.fireRank) / 0.06);
        ctx.globalAlpha = Math.sin(Math.PI * f) * 0.95 * a.alpha * share;
        ctx.drawImage(glowSprite(mixRGB(a.rgb, b.rgb, f)), x - s / 2, y - s / 2, s, s);
      }
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  const loop = (now: number) => {
    raf = 0;
    frame(now);
    if (visible && !reduced) raf = requestAnimationFrame(loop);
    else lastNow = 0;
  };
  const kick = () => { if (!raf) raf = requestAnimationFrame(loop); };

  const io = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting && !document.hidden;
    if (visible) kick();
  });
  const onVisibility = () => { visible = !document.hidden; if (visible) kick(); };
  const ro = new ResizeObserver(() => { layout(); kick(); });
  const onMove = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse' || reduced) return;
    const r = canvas.getBoundingClientRect();
    pointer = { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const onLeave = () => { pointer = null; };
  // Le canvas ne capte pas le pointeur (il est sous le contenu) : on écoute son parent.
  const host = canvas.parentElement ?? canvas;

  layout();
  kick();
  io.observe(canvas);
  ro.observe(canvas);
  document.addEventListener('visibilitychange', onVisibility);
  host.addEventListener('pointermove', onMove);
  host.addEventListener('pointerleave', onLeave);

  return {
    excite(amount) {
      if (reduced) return;
      energy = Math.min(1, energy + amount);
      kick();
    },
    setDark(next) { dark = next; kick(); },
    destroy() {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      host.removeEventListener('pointermove', onMove);
      host.removeEventListener('pointerleave', onLeave);
    },
  };
}
