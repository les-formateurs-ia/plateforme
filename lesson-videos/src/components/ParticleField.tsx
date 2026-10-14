import React, { useLayoutEffect, useMemo, useRef } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";

// Constellation 3D inspirée du canvas "AiStory" du site (points colorés,
// liaisons aux plus proches voisins, étincelles qui courent sur les liaisons,
// halos flous) — mais en vraie 3D (sphère qui tourne + projection en
// perspective) et 100 % déterministe : tout est dérivé de `frame`, aucun état
// entre deux images, pour que le rendu image par image de Remotion soit stable.

export type FieldCamera = {
  cx: number; // centre écran (px)
  cy: number;
  radius: number; // rayon de la sphère (px)
  yaw: number; // rotation de base autour de Y (rad), s'ajoute à la rotation lente
  pitch: number; // inclinaison (rad)
  opacity: number;
  warmth: number; // 0 = froid (bleu/bleu-vert/violet), 1 = chaud (beige/violet)
  energy: number; // 0..1 : proportion de liaisons parcourues par une étincelle
  scatter: number; // 0 = sphère, 1 = champ d'étoiles plein écran
  spin: number; // vitesse de rotation (rad/s)
};

const COOL = ["#78d5e2", "#6adeb1", "#71dac9", "#b58de0", "#dbacf0", "#78d5e2"];
const WARM = ["#fbc2ad", "#fceccd", "#f5b8a4", "#dbacf0", "#c69ce8", "#fbc2ad"];

const hex = (h: string): [number, number, number] => {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

const mulberry32 = (seed: number) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

type P = {
  sx: number; sy: number; sz: number; // position sur la sphère unité
  fx: number; fy: number; fz: number; // position "champ d'étoiles" (-1..1)
  cool: [number, number, number];
  warm: [number, number, number];
  size: number;
  phase: number;
  drift: number;
  glow: boolean;
};

const build = (n: number, seed: number) => {
  const r = mulberry32(seed);
  const pts: P[] = [];
  for (let i = 0; i < n; i++) {
    // Fibonacci + bruit : répartition homogène mais organique.
    const k = i + 0.5;
    const phi = Math.acos(1 - (2 * k) / n);
    const theta = Math.PI * (1 + Math.sqrt(5)) * k + r() * 0.6;
    const shell = r() < 0.72;
    const rad = shell ? 0.84 + r() * 0.16 : Math.cbrt(r()) * 0.8;
    pts.push({
      sx: Math.cos(theta) * Math.sin(phi) * rad,
      sy: Math.cos(phi) * rad * 0.92,
      sz: Math.sin(theta) * Math.sin(phi) * rad,
      fx: r() * 2 - 1,
      fy: r() * 2 - 1,
      fz: r() * 2 - 1,
      cool: hex(COOL[Math.floor(r() * COOL.length)]),
      warm: hex(WARM[Math.floor(r() * WARM.length)]),
      size: 0.7 + r() * 0.8,
      phase: r() * Math.PI * 2,
      drift: 0.25 + r() * 0.6,
      glow: r() < 0.11,
    });
  }
  // Liaisons : 3 plus proches voisins sur la sphère (calculées une fois).
  const edges: { a: number; b: number; speed: number; phase: number; rank: number }[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < n; i++) {
    const d: [number, number][] = [];
    for (let j = 0; j < n; j++) {
      if (i === j) continue;
      const dx = pts[i].sx - pts[j].sx;
      const dy = pts[i].sy - pts[j].sy;
      const dz = pts[i].sz - pts[j].sz;
      d.push([dx * dx + dy * dy + dz * dz, j]);
    }
    d.sort((x, y) => x[0] - y[0]);
    for (let m = 0; m < 3; m++) {
      const [dist, j] = d[m];
      if (dist > 0.11) break;
      const key = i < j ? `${i}-${j}` : `${j}-${i}`;
      if (seen.has(key)) continue;
      seen.add(key);
      edges.push({ a: i, b: j, speed: 0.35 + r() * 0.6, phase: r(), rank: r() });
    }
  }
  return { pts, edges };
};

export const ParticleField: React.FC<{ cam: FieldCamera; count?: number; seed?: number }> = ({
  cam,
  count = 460,
  seed = 7,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const ref = useRef<HTMLCanvasElement>(null);
  const { pts, edges } = useMemo(() => build(count, seed), [count, seed]);

  useLayoutEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
    if (cam.opacity <= 0.001) return;

    const t = frame / fps;
    const yaw = cam.yaw + t * cam.spin;
    const pitch = cam.pitch + Math.sin(t * 0.21) * 0.08;
    const cyw = Math.cos(yaw), syw = Math.sin(yaw);
    const cp = Math.cos(pitch), sp = Math.sin(pitch);
    const focal = 1500;
    const sc = cam.scatter;

    const X = new Float32Array(pts.length);
    const Y = new Float32Array(pts.length);
    const S = new Float32Array(pts.length);
    const Z = new Float32Array(pts.length);
    const RGB: [number, number, number][] = new Array(pts.length);

    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      const w = Math.sin(t * p.drift + p.phase) * 0.035;
      let x = p.sx * (1 + w) * cam.radius;
      let y = p.sy * (1 + w) * cam.radius;
      let z = p.sz * (1 + w) * cam.radius;
      if (sc > 0) {
        x += (p.fx * width * 0.62 - x) * sc;
        y += (p.fy * height * 0.62 - y) * sc;
        z += (p.fz * 700 - z) * sc;
      }
      // rotation Y puis X
      const x1 = x * cyw + z * syw;
      const z1 = -x * syw + z * cyw;
      const y2 = y * cp - z1 * sp;
      const z2 = y * sp + z1 * cp;
      const s = focal / (focal + z2);
      X[i] = cam.cx + x1 * s;
      Y[i] = cam.cy + y2 * s;
      S[i] = s;
      Z[i] = z2;
      const k = cam.warmth;
      RGB[i] = [
        Math.round(p.cool[0] + (p.warm[0] - p.cool[0]) * k),
        Math.round(p.cool[1] + (p.warm[1] - p.cool[1]) * k),
        Math.round(p.cool[2] + (p.warm[2] - p.cool[2]) * k),
      ];
    }

    const depthAlpha = (s: number) => Math.min(1, Math.max(0.12, (s - 0.55) * 1.6));
    const maxLen = cam.radius * 0.5 + 40;

    // Liaisons
    ctx.lineCap = "round";
    for (const e of edges) {
      const dx = X[e.a] - X[e.b];
      const dy = Y[e.a] - Y[e.b];
      const len = Math.hypot(dx, dy);
      const fade = 1 - Math.min(1, len / maxLen);
      if (fade <= 0) continue;
      const a = fade * fade * 0.5 * depthAlpha((S[e.a] + S[e.b]) / 2) * cam.opacity * (1 - sc * 0.85);
      if (a < 0.01) continue;
      const c = RGB[e.a];
      ctx.globalAlpha = a;
      ctx.strokeStyle = `rgb(${c[0]},${c[1]},${c[2]})`;
      ctx.lineWidth = 0.6 + (S[e.a] - 0.6) * 1.1;
      ctx.beginPath();
      ctx.moveTo(X[e.a], Y[e.a]);
      ctx.lineTo(X[e.b], Y[e.b]);
      ctx.stroke();
    }

    // Points, de l'arrière vers l'avant
    const order = Array.from(pts.keys()).sort((a, b) => Z[b] - Z[a]);
    for (const i of order) {
      const p = pts[i];
      const s = S[i];
      const c = RGB[i];
      const da = depthAlpha(s) * cam.opacity;
      if (p.glow) {
        // halo flou façon bokeh
        const rr = (16 + p.size * 16) * s;
        const g = ctx.createRadialGradient(X[i], Y[i], 0, X[i], Y[i], rr);
        g.addColorStop(0, `rgba(${c[0]},${c[1]},${c[2]},0.42)`);
        g.addColorStop(0.45, `rgba(${c[0]},${c[1]},${c[2]},0.14)`);
        g.addColorStop(1, `rgba(${c[0]},${c[1]},${c[2]},0)`);
        ctx.globalAlpha = da * 0.9;
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(X[i], Y[i], rr, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = Math.min(1, da * 1.1);
      ctx.fillStyle = `rgb(${c[0]},${c[1]},${c[2]})`;
      ctx.beginPath();
      ctx.arc(X[i], Y[i], (1.1 + p.size * 1.3) * s, 0, Math.PI * 2);
      ctx.fill();
    }

    // Étincelles qui parcourent les liaisons
    if (cam.energy > 0.001) {
      ctx.globalCompositeOperation = "lighter";
      for (const e of edges) {
        if (e.rank > cam.energy) continue;
        const dx = X[e.a] - X[e.b];
        const dy = Y[e.a] - Y[e.b];
        const len = Math.hypot(dx, dy);
        if (len > maxLen) continue;
        const u = (t * e.speed + e.phase) % 1;
        const x = X[e.a] + (X[e.b] - X[e.a]) * u;
        const y = Y[e.a] + (Y[e.b] - Y[e.a]) * u;
        const c = RGB[e.a];
        const rr = 9 * S[e.a];
        const g = ctx.createRadialGradient(x, y, 0, x, y, rr);
        g.addColorStop(0, `rgba(255,255,255,0.95)`);
        g.addColorStop(0.25, `rgba(${c[0]},${c[1]},${c[2]},0.7)`);
        g.addColorStop(1, `rgba(${c[0]},${c[1]},${c[2]},0)`);
        ctx.globalAlpha = Math.sin(Math.PI * u) * cam.opacity * depthAlpha(S[e.a]);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, rr, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalCompositeOperation = "source-over";
    }
    ctx.globalAlpha = 1;
  }, [frame, fps, width, height, cam, pts, edges]);

  return (
    <canvas
      ref={ref}
      width={width}
      height={height}
      style={{ position: "absolute", inset: 0, width, height }}
    />
  );
};
