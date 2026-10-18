import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { IconLock } from "../components/icons";
import { C, EASE, clamp } from "../theme";

// Fenêtre de navigateur stylisée (verre sombre, aux couleurs de la marque)
// qui sert de support aux démonstrations d'interface. Position fixe d'une
// scène à l'autre : les scènes se succèdent "dans" la même fenêtre.
export const WIN = { x: 620, y: 240, w: 1200, h: 640 };
export const CHROME_H = 46;
export const CONTENT_Y = WIN.y + CHROME_H;

export const Window: React.FC<{ url: string; out: number; children: React.ReactNode; enterAt?: number }> = ({
  url,
  out,
  children,
  enterAt = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = interpolate(frame, [enterAt * fps, (enterAt + 0.8) * fps], [0, 1], { ...clamp, easing: EASE });
  const q = interpolate(frame, [out * fps, (out + 0.5) * fps], [0, 1], clamp);
  return (
    <div
      style={{
        position: "absolute",
        left: WIN.x,
        top: WIN.y,
        width: WIN.w,
        height: WIN.h,
        borderRadius: 22,
        overflow: "hidden",
        background: "radial-gradient(120% 90% at 60% 30%, rgba(40,46,110,0.55), transparent 60%), #0B0A12",
        border: `1px solid ${C.hairline2}`,
        boxShadow: "0 50px 120px -40px rgba(0,0,0,0.9), 0 30px 90px -50px rgba(181,141,224,0.6)",
        opacity: p * (1 - q),
        transform: `perspective(1800px) rotateX(${(1 - p) * 10}deg) translateY(${(1 - p) * 30}px)`,
      }}
    >
      <div
        style={{
          height: CHROME_H,
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "0 18px",
          borderBottom: `1px solid ${C.hairline}`,
          background: "rgba(255,255,255,0.03)",
        }}
      >
        {["#fbc2ad", "#fceccd", "#6adeb1"].map((c) => (
          <span key={c} style={{ width: 12, height: 12, borderRadius: 99, background: c, opacity: 0.7 }} />
        ))}
        <div
          style={{
            marginLeft: 18,
            flex: 1,
            maxWidth: 520,
            height: 28,
            borderRadius: 999,
            background: "rgba(255,255,255,0.06)",
            display: "flex",
            alignItems: "center",
            padding: "0 16px",
            gap: 10,
            fontSize: 16,
            color: C.fg2,
            fontWeight: 500,
          }}
        >
          <IconLock size={14} color={C.fg3} />
          {url}
        </div>
      </div>
      <div style={{ position: "absolute", left: 0, top: CHROME_H, right: 0, bottom: 0 }}>{children}</div>
    </div>
  );
};

// Intensité de mise en avant d'un élément entre deux instants (temps locaux).
export const useSpot = (from: number, to: number) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (to <= from) return 0; // pas de mise en avant pour cet élément
  return interpolate(frame / fps, [from, from + 0.4, to, to + 0.4], [0, 1, 1, 0], clamp);
};
