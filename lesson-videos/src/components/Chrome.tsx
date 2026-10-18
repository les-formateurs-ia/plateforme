import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { Logo, baseText } from "../components/ui";
import { AVATAR_ZONE, C, GRAD, clamp } from "../theme";
import { CHAPTERS, DURATION_S } from "./timeline";

// Habillage permanent : logo, chapitre en cours, barre de progression par
// chapitre (même logique que le suivi de progression de la plateforme).
export const Chrome: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const appear = interpolate(t, [0.4, 1.6], [0, 1], clamp);
  const leave = interpolate(t, [DURATION_S - 2.2, DURATION_S - 0.6], [0, 1], clamp);
  const o = appear * (1 - leave);

  const left = 96;
  const right = 96;
  const barLeft = AVATAR_ZONE.w + 20; // la barre s'arrête avant la zone avatar
  const gap = 10;
  const total = 1920 - barLeft - right - gap * (CHAPTERS.length - 1);

  return (
    <AbsoluteFill style={{ ...baseText, opacity: o, pointerEvents: "none" }}>
      <div style={{ position: "absolute", left, top: 64, opacity: 0.92 }}>
        <Logo h={34} />
      </div>

      {CHAPTERS.map((ch) => {
        const c = ch;
        const p = interpolate(t, [c.from, c.from + 0.6, c.to - 0.4, c.to], [0, 1, 1, 0], clamp);
        if (p <= 0) return null;
        return (
          <div
            key={c.id}
            style={{
              position: "absolute",
              right,
              top: 66,
              fontSize: 24,
              fontWeight: 500,
              color: C.fg2,
              opacity: p,
              translate: `0px ${(1 - p) * 8}px`,
              filter: `blur(${(1 - p) * 4}px)`,
            }}
          >
            {c.label}
          </div>
        );
      })}

      <div style={{ position: "absolute", left: barLeft, right, bottom: 54, display: "flex", gap }}>
        {CHAPTERS.map((ch) => {
          const c = ch;
          const w = ((c.to - c.from) / DURATION_S) * total;
          const fill = interpolate(t, [c.from, c.to], [0, 1], clamp);
          const current = t >= c.from && t < c.to;
          return (
            <div
              key={c.id}
              style={{
                width: w,
                height: 4,
                borderRadius: 4,
                background: "rgba(255,255,255,0.10)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${fill * 100}%`,
                  height: "100%",
                  borderRadius: 4,
                  backgroundImage: GRAD.iris,
                  backgroundSize: `${total}px 100%`,
                  opacity: current ? 1 : 0.55,
                }}
              />
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
