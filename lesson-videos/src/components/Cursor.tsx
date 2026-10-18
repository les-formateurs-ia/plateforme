import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { C, EASE_IN_OUT, clamp } from "../theme";

// Curseur de démonstration : se déplace d'un point à l'autre (temps locaux en
// secondes) et "clique" (anneau qui s'étend) quand `click` est vrai.
export type CursorKey = { t: number; x: number; y: number; click?: boolean };

export const Cursor: React.FC<{ keys: CursorKey[]; from?: number; to?: number }> = ({ keys, from = 0, to = 9999 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  if (keys.length === 0) return null;
  const times = keys.map((k) => k.t);
  const x = keys.length > 1 ? interpolate(t, times, keys.map((k) => k.x), { ...clamp, easing: EASE_IN_OUT }) : keys[0].x;
  const y = keys.length > 1 ? interpolate(t, times, keys.map((k) => k.y), { ...clamp, easing: EASE_IN_OUT }) : keys[0].y;
  const o = interpolate(t, [from, from + 0.3, to - 0.3, to], [0, 1, 1, 0], clamp);
  // dernier clic passé
  const last = [...keys].reverse().find((k) => k.click && t >= k.t);
  const c = last ? interpolate(t, [last.t, last.t + 0.5], [0, 1], clamp) : 1;
  const press = last ? interpolate(t, [last.t, last.t + 0.08, last.t + 0.22], [1, 0.82, 1], clamp) : 1;
  return (
    <div style={{ position: "absolute", left: x, top: y, opacity: o, pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          left: -24,
          top: -24,
          width: 48,
          height: 48,
          borderRadius: 99,
          border: `2px solid ${C.violetLight}`,
          opacity: (1 - c) * 0.9,
          scale: String(0.4 + c * 1.1),
        }}
      />
      <svg width={34} height={34} viewBox="0 0 24 24" style={{ position: "absolute", left: -4, top: -3, scale: String(press), transformOrigin: "4px 3px" }}>
        <path
          d="M4 3l15 7.5-6.5 1.8L10 19z"
          fill={C.violetLight}
          stroke="#140d1f"
          strokeWidth={1.4}
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};
