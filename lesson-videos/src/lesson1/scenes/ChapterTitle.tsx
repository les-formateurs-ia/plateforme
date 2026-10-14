import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Eyebrow, GradText, Reveal, RiseLines, baseText, useEnter } from "../../components/ui";
import { C, clamp } from "../../theme";
import { TOOLS } from "../tools";

export type ChapterTitleProps = {
  num: number;
  before: string; // première ligne du titre
  accent: string; // seconde ligne (en dégradé)
  subtitle?: string;
  subtitleAt?: number;
  out: number;
  ring?: boolean; // anneau 3D des logos d'outils (chapitre 4)
};

const LogoRing: React.FC<{ out: number }> = ({ out }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const p = useEnter(0.9, 1.2);
  const q = interpolate(t, [out, out + 0.5], [0, 1], clamp);
  const R = 360;
  return (
    <div
      style={{
        position: "absolute",
        left: 1100,
        top: 770,
        perspective: 1400,
        opacity: p * (1 - q),
      }}
    >
      <div style={{ transformStyle: "preserve-3d", rotate: `x -12deg` }}>
        {TOOLS.map((tool, i) => {
          const a = (i / TOOLS.length) * Math.PI * 2 + t * 0.55 + (1 - p) * 1.4;
          const x = Math.sin(a) * R * (0.6 + 0.4 * p);
          const z = Math.cos(a) * R * (0.6 + 0.4 * p);
          return (
            <div
              key={tool.id}
              style={{
                position: "absolute",
                left: -54,
                top: -54,
                width: 108,
                height: 108,
                borderRadius: 30,
                background: tool.logoBg,
                display: "grid",
                placeItems: "center",
                transform: `translate3d(${x}px, 0px, ${z}px)`,
                boxShadow: `0 20px 50px -16px ${tool.accent}`,
                opacity: interpolate(z, [-R, R], [0.35, 1]),
              }}
            >
              <Img src={staticFile(tool.logo)} style={{ width: 66, height: 66, objectFit: "contain" }} />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const ChapterTitle: React.FC<ChapterTitleProps> = ({
  num,
  before,
  accent,
  subtitle,
  subtitleAt = 1.3,
  out,
  ring,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const q = interpolate(frame, [out * fps, (out + 0.5) * fps], [0, 1], clamp);
  return (
    // centré à x = 1100 (et non 960) pour laisser libre la zone avatar en bas à gauche
    <AbsoluteFill style={{ ...baseText, alignItems: "center", justifyContent: "center", textAlign: "center", paddingLeft: 280 }}>
      <div
        style={{
          position: "absolute",
          width: 1500,
          height: 760,
          borderRadius: "50%",
          background: "radial-gradient(closest-side, rgba(7,6,11,0.72), rgba(7,6,11,0))",
          top: ring ? 40 : 160,
          opacity: interpolate(frame, [0, 0.6 * fps], [0, 1], clamp) * (1 - q),
        }}
      />
      <div style={{ position: "relative", marginTop: ring ? -260 : 0 }}>
        <Reveal at={0.15} out={out}>
          <Eyebrow>Chapitre {num}</Eyebrow>
        </Reveal>
        <RiseLines
          at={0.35}
          out={out}
          style={{ marginTop: 36, fontSize: 136, fontWeight: 800, letterSpacing: "-0.045em", lineHeight: 0.98 }}
          lines={[before, <GradText key="a">{accent}</GradText>]}
        />
        {subtitle ? (
          <Reveal at={subtitleAt} out={out} style={{ marginTop: 38 }}>
            <div style={{ fontSize: 36, color: C.fg2, fontWeight: 500 }}>{subtitle}</div>
          </Reveal>
        ) : null}
      </div>
      {ring ? <LogoRing out={out} /> : null}
    </AbsoluteFill>
  );
};
