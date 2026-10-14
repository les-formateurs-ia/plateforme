import React from "react";
import { Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { C, EASE, EASE_IN, GRAD, clamp, fontFamily } from "../theme";

// Progression 0→1 d'une entrée qui démarre à `at` secondes (temps local de la
// séquence), avec la courbe ease-out-strong du site.
export const useEnter = (at: number, dur = 0.8) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return interpolate(frame, [at * fps, (at + dur) * fps], [0, 1], { ...clamp, easing: EASE });
};

export const useExit = (at: number | undefined, dur = 0.45) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (at === undefined) return 0;
  return interpolate(frame, [at * fps, (at + dur) * fps], [0, 1], { ...clamp, easing: EASE_IN });
};

// Entrée "à la Emil Kowalski" : légère montée, flou qui se dissipe, échelle
// 0.97→1 — jamais d'apparition depuis zéro, jamais de rebond.
export const Reveal: React.FC<{
  at: number;
  out?: number;
  dur?: number;
  y?: number;
  blur?: number;
  scaleFrom?: number;
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({ at, out, dur = 0.8, y = 22, blur = 10, scaleFrom = 0.98, style, children }) => {
  const p = useEnter(at, dur);
  const q = useExit(out);
  return (
    <div
      style={{
        opacity: p * (1 - q),
        translate: `0px ${(1 - p) * y - q * 10}px`,
        scale: String(scaleFrom + (1 - scaleFrom) * p - q * 0.02),
        filter: `blur(${(1 - p) * blur + q * 6}px)`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

// Titre découpé en lignes qui montent derrière un masque (anim "rise" du site).
export const RiseLines: React.FC<{
  lines: React.ReactNode[];
  at: number;
  stagger?: number;
  out?: number;
  style?: React.CSSProperties;
}> = ({ lines, at, stagger = 0.08, out, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const q = useExit(out);
  return (
    <div style={{ opacity: 1 - q, filter: `blur(${q * 6}px)`, ...style }}>
      {lines.map((l, i) => {
        const p = interpolate(frame, [(at + i * stagger) * fps, (at + i * stagger + 0.76) * fps], [0, 1], {
          ...clamp,
          easing: EASE,
        });
        return (
          <span key={i} style={{ display: "block", overflow: "hidden", paddingBottom: "0.08em" }}>
            <span style={{ display: "block", translate: `0px ${(1 - p) * 105}%` }}>{l}</span>
          </span>
        );
      })}
    </div>
  );
};

export const GradText: React.FC<{ children: React.ReactNode; grad?: string }> = ({
  children,
  grad = GRAD.iris,
}) => (
  <span
    style={{
      backgroundImage: grad,
      WebkitBackgroundClip: "text",
      backgroundClip: "text",
      color: "transparent",
    }}
  >
    {children}
  </span>
);

export const Eyebrow: React.FC<{ children: React.ReactNode; color?: string }> = ({
  children,
  color = C.violetLight,
}) => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 14,
      padding: "10px 20px 10px 16px",
      borderRadius: 999,
      border: `1px solid ${C.hairline2}`,
      background: "rgba(255,255,255,0.04)",
      color: C.fg2,
      fontSize: 24,
      fontWeight: 500,
      letterSpacing: "0.02em",
    }}
  >
    <span
      style={{
        width: 10,
        height: 10,
        borderRadius: 99,
        background: color,
        boxShadow: `0 0 18px ${color}`,
      }}
    />
    {children}
  </div>
);

// Carte "verre" : fond légèrement éclairci, liseré fin, reflet interne en haut.
export const Glass: React.FC<{
  style?: React.CSSProperties;
  glow?: string;
  children?: React.ReactNode;
}> = ({ style, glow = C.violet, children }) => (
  <div
    style={{
      position: "relative",
      borderRadius: 32,
      background: "linear-gradient(180deg, rgba(255,255,255,0.075), rgba(255,255,255,0.025)), rgba(12,10,18,0.72)",
      border: `1px solid ${C.hairline2}`,
      boxShadow: `inset 0 1px 0 rgba(255,255,255,0.12), 0 40px 120px -40px ${glow}55, 0 24px 60px -30px rgba(0,0,0,0.8)`,
      backdropFilter: "blur(18px)",
      ...style,
    }}
  >
    {children}
  </div>
);

export const Logo: React.FC<{ h?: number; style?: React.CSSProperties }> = ({ h = 36, style }) => (
  <Img src={staticFile("brand/logotype-blanc.png")} style={{ height: h, ...style }} />
);

export const baseText: React.CSSProperties = {
  fontFamily,
  color: C.fg,
  fontFeatureSettings: '"ss01", "kern"',
};
