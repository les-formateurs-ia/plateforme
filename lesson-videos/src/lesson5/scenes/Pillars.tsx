import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { IconFileText, IconListChecks, IconTarget, IconUser, IconZap } from "../../components/icons";
import { Eyebrow, GradText, Reveal, RiseLines, baseText, useExit } from "../../components/ui";
import { C, EASE, SAFE_L, clamp } from "../../theme";
import { PILLARS } from "../timeline";

// 85,2 → 119 s. Temps locaux = temps audio − 85,2.
// Les cinq piliers s'élèvent comme des colonnes, au rythme de la voix off.
const OUT = 33.25;
const AT = [6.7, 10.5, 14.1, 18.4, 22.7];
const W = 226;
const GAP = 18;

export const PILLAR_ICONS = [
  <IconUser key="r" size={30} />,
  <IconTarget key="c" size={30} />,
  <IconZap key="o" size={30} />,
  <IconFileText key="x" size={30} />,
  <IconListChecks key="f" size={30} />,
];

const Column: React.FC<{ i: number }> = ({ i }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const p = PILLARS[i];
  const rise = interpolate(frame, [AT[i] * fps, (AT[i] + 1.0) * fps], [0, 1], { ...clamp, easing: EASE });
  const q = useExit(OUT, 0.5);
  const next = AT[i + 1] ?? 27.6;
  const active = interpolate(t, [AT[i], AT[i] + 0.4, next, next + 0.4], [0, 1, 1, 0], clamp);
  return (
    <div style={{ position: "absolute", left: SAFE_L + i * (W + GAP), top: 330, width: W, height: 430, perspective: 1100, perspectiveOrigin: "50% 100%" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 26,
          padding: "26px 20px",
          transformOrigin: "50% 100%",
          transform: `rotateX(${(1 - rise) * 75}deg) translateZ(${active * 20}px)`,
          opacity: rise * (1 - q),
          background: `linear-gradient(180deg, ${p.color}${active > 0.3 ? "2a" : "14"}, rgba(255,255,255,0.02) 70%), rgba(12,10,18,0.85)`,
          border: `1.5px solid ${active > 0.3 ? `${p.color}bb` : C.hairline2}`,
          boxShadow: `0 40px 80px -50px ${p.color}`,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 40, fontWeight: 800, color: p.color, letterSpacing: "-0.03em" }}>{i + 1}</span>
          <span
            style={{
              width: 54,
              height: 54,
              borderRadius: 16,
              display: "grid",
              placeItems: "center",
              border: `1px solid ${p.color}66`,
              background: `${p.color}1a`,
              color: p.color,
            }}
          >
            {PILLAR_ICONS[i]}
          </span>
        </div>
        <div style={{ marginTop: 24, fontSize: 32, fontWeight: 800, letterSpacing: "-0.02em" }}>{p.label}</div>
        <div style={{ marginTop: 14, fontSize: 21, color: C.fg2, fontWeight: 500, lineHeight: 1.4 }}>{p.q}</div>
        {/* chapiteau : un filet lumineux en bas de colonne */}
        <div style={{ marginTop: "auto", height: 4, borderRadius: 4, background: p.color, opacity: 0.5 + active * 0.5 }} />
      </div>
    </div>
  );
};

export const Pillars: React.FC = () => (
  <AbsoluteFill style={{ ...baseText }}>
    <div style={{ position: "absolute", left: 160, top: 120 }}>
      <Reveal at={0.2} out={OUT}>
        <Eyebrow>La solution</Eyebrow>
      </Reveal>
      <RiseLines
        at={0.4}
        out={OUT}
        style={{ marginTop: 16, fontSize: 60, fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1.04 }}
        lines={[
          <span key="t">
            Structurez votre demande en <GradText>5 piliers</GradText>
          </span>,
        ]}
      />
    </div>
    {PILLARS.map((_, i) => (
      <Column key={i} i={i} />
    ))}
    <Reveal at={27.8} out={OUT} style={{ position: "absolute", left: SAFE_L, top: 800, width: 1200 }}>
      <div style={{ fontSize: 27, fontWeight: 600, color: C.fg2 }}>
        → Traiter ces 5 questions <span style={{ color: C.fg, fontWeight: 800 }}>séparément</span> évite d'oublier des consignes clés.
      </div>
    </Reveal>
  </AbsoluteFill>
);
