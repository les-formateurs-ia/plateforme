import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { C } from "../theme";

// Fond encre avec deux nappes de lumière qui dérivent lentement + vignette.
// `hue` : 0 = violet/bleu (froid), 1 = violet/beige (chaud).
export const Backdrop: React.FC<{ hue: number }> = ({ hue }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const ax = 28 + Math.sin(t * 0.05) * 8;
  const ay = 22 + Math.cos(t * 0.04) * 6;
  const bx = 76 + Math.cos(t * 0.045) * 7;
  const by = 78 + Math.sin(t * 0.055) * 6;
  const second = hue > 0.5 ? C.beige : C.bleu;
  return (
    <AbsoluteFill style={{ background: C.ink }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(60% 55% at ${ax}% ${ay}%, ${C.violet}2e, transparent 70%)`,
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(55% 50% at ${bx}% ${by}%, ${second}1f, transparent 70%)`,
          opacity: 1,
        }}
      />
      <AbsoluteFill
        style={{
          background: "radial-gradient(120% 90% at 50% 50%, transparent 55%, rgba(0,0,0,0.65) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};
