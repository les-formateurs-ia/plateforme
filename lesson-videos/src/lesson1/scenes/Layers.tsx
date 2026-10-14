import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { IconFilm, IconImage, IconMail, IconSparkle } from "../../components/icons";
import { Eyebrow, GradText, Reveal, RiseLines, baseText } from "../../components/ui";
import { C, EASE, GRAD, clamp } from "../../theme";

// 40,6 → 72,6 s. Temps locaux = temps audio − 40,6.
// Les quatre familles d'IA en disques de verre empilés en 3D (perspective
// plongeante), l'IA générative au cœur, qui s'élève quand on en parle.
const TILT = 58;

type Disc = {
  label: string;
  size: number;
  z: number;
  at: number;
  border: string;
  fill: string;
};

const DISCS: Disc[] = [
  { label: "Intelligence artificielle", size: 590, z: 0, at: 0.3, border: C.violetLight, fill: "rgba(219,172,240,0.07)" },
  { label: "Machine Learning", size: 450, z: 75, at: 5.0, border: C.violet, fill: "rgba(181,141,224,0.10)" },
  { label: "Deep Learning", size: 315, z: 150, at: 6.0, border: C.bleu, fill: "rgba(120,213,226,0.10)" },
];
const CORE = { label: "IA générative", size: 190, z: 250, at: 20.9 };

// NB : jamais d'opacity/filter sur un élément en preserve-3d — Chrome
// l'aplatit alors et les étiquettes "billboard" se retrouvent couchées. La
// transparence est donc portée par les calques plats (face, étiquette).
const Label: React.FC<{ text: string; strong?: boolean; color: string; opacity: number }> = ({
  text,
  strong,
  color,
  opacity,
}) => (
  <div
    style={{
      position: "absolute",
      left: "50%",
      top: "100%",
      transform: `translate(-50%, -50%) rotateX(-${TILT}deg) translateZ(2px)`,
      whiteSpace: "nowrap",
      padding: strong ? "12px 26px" : "9px 20px",
      borderRadius: 999,
      background: strong ? "rgba(14,12,21,0.88)" : "rgba(14,12,21,0.78)",
      border: `1px solid ${color}`,
      fontSize: strong ? 30 : 24,
      fontWeight: strong ? 700 : 600,
      color: C.fg,
      opacity,
    }}
  >
    {text}
  </div>
);

const Stack: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const coreP = interpolate(frame, [CORE.at * fps, (CORE.at + 1.4) * fps], [0, 1], { ...clamp, easing: EASE });
  const dimOthers = coreP * 0.5;
  const spin = t * 7;

  return (
    <div style={{ position: "absolute", left: 790, top: 520, perspective: 1700 }}>
      <div
        style={{
          transformStyle: "preserve-3d",
          transform: `rotateX(${TILT + Math.sin(t * 0.3) * 2}deg)`,
        }}
      >
        {DISCS.map((d, i) => {
          const p = interpolate(frame, [d.at * fps, (d.at + 1.2) * fps], [0, 1], { ...clamp, easing: EASE });
          return (
            <div
              key={d.label}
              style={{
                position: "absolute",
                left: -d.size / 2,
                top: -d.size / 2,
                width: d.size,
                height: d.size,
                transformStyle: "preserve-3d",
                transform: `translateZ(${d.z * p}px) scale(${0.82 + 0.18 * p})`,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: "50%",
                  opacity: p * (1 - dimOthers),
                  background: `radial-gradient(circle at 50% 40%, ${d.fill.replace(/[\d.]+\)$/, "0.16)")}, ${d.fill} 70%)`,
                  border: `1.5px solid ${d.border}`,
                  boxShadow: `inset 0 0 40px ${d.border}22`,
                }}
              >
                {/* graduations qui tournent lentement */}
                <div
                  style={{
                    position: "absolute",
                    inset: 14,
                    borderRadius: "50%",
                    background: `repeating-conic-gradient(from ${spin * (i % 2 ? -1 : 1)}deg, ${d.border}55 0deg 0.6deg, transparent 0.6deg ${i === 0 ? 6 : 9}deg)`,
                    WebkitMask: "radial-gradient(circle, transparent 93%, #000 94%)",
                    mask: "radial-gradient(circle, transparent 93%, #000 94%)",
                  }}
                />
              </div>
              <Label text={d.label} color={`${d.border}88`} opacity={p * (1 - dimOthers * 0.7)} />
            </div>
          );
        })}
        {/* cœur : IA générative */}
        <div
          style={{
            position: "absolute",
            left: -CORE.size / 2,
            top: -CORE.size / 2,
            width: CORE.size,
            height: CORE.size,
            transformStyle: "preserve-3d",
            transform: `translateZ(${CORE.z * coreP}px) scale(${0.6 + 0.4 * coreP})`,
          }}
        >
          {/* halo : dégradé radial plutôt qu'un box-shadow (rogné par Chrome en 3D) */}
          <div
            style={{
              position: "absolute",
              inset: -CORE.size * 0.9,
              borderRadius: "50%",
              opacity: coreP * (0.8 + Math.sin(t * 2) * 0.2),
              background: `radial-gradient(closest-side, ${C.violetLight}88, ${C.violet}33 45%, transparent 100%)`,
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              opacity: coreP,
              background: `radial-gradient(circle at 40% 35%, ${C.beigeLight}, ${C.violetLight} 34%, ${C.violet} 62%, ${C.bleu})`,
            }}
          />
          <Label text={CORE.label} strong color={C.violetLight} opacity={coreP} />
        </div>
      </div>
    </div>
  );
};

const Example: React.FC<{ at: number; out: number; icon: React.ReactNode; text: string }> = ({ at, out, icon, text }) => (
  <Reveal at={at} out={out} y={14}>
    <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 30, fontWeight: 500, color: C.fg }}>
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: 18,
          display: "grid",
          placeItems: "center",
          border: `1px solid ${C.hairline2}`,
          background: "rgba(255,255,255,0.05)",
          color: C.bleu,
        }}
      >
        {icon}
      </div>
      {text}
    </div>
  </Reveal>
);

export const Layers: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const strike = interpolate(frame, [25.0 * fps, 25.7 * fps], [0, 1], { ...clamp, easing: EASE });
  const OUT = 31.4;
  const panel: React.CSSProperties = { position: "absolute", left: 1190, top: 230, width: 650 };

  return (
    <AbsoluteFill style={{ ...baseText }}>
      <Stack />

      {/* P1 — l'IA au sens large */}
      <div style={panel}>
        <Reveal at={0.3} out={4.5}>
          <Eyebrow>Le grand paysage</Eyebrow>
        </Reveal>
        <RiseLines
          at={0.5}
          out={4.5}
          style={{ marginTop: 32, fontSize: 92, fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1 }}
          lines={["L'IA, au", "sens large"]}
        />
        <Reveal at={3.6} out={4.5} style={{ marginTop: 32 }}>
          <div style={{ fontSize: 40, color: C.fg2, fontWeight: 500 }}>Elle existe depuis des décennies.</div>
        </Reveal>
      </div>

      {/* P2 — l'IA analytique */}
      <div style={panel}>
        <Reveal at={4.8} out={20.4}>
          <Eyebrow color={C.bleu}>Pendant longtemps</Eyebrow>
        </Reveal>
        <RiseLines
          at={7.1}
          out={20.4}
          style={{ marginTop: 32, fontSize: 96, fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1 }}
          lines={["L'IA", <GradText key="a" grad={GRAD.bleu}>analytique</GradText>]}
        />
        <Reveal at={8.9} out={20.4} style={{ marginTop: 28 }}>
          <div style={{ fontSize: 36, color: C.fg2, fontWeight: 500, lineHeight: 1.3 }}>
            Analyser des données existantes pour prendre des décisions :
          </div>
        </Reveal>
        <div style={{ marginTop: 34, display: "flex", flexDirection: "column", gap: 20 }}>
          <Example at={13.1} out={20.4} icon={<IconMail />} text="Trier des spams" />
          <Example at={14.2} out={20.4} icon={<IconFilm />} text="Recommander un film" />
          <Example at={15.5} out={20.4} icon={<IconImage />} text="Reconnaître une forme sur une photo" />
        </div>
        <Reveal at={18.1} out={20.4} style={{ marginTop: 40 }}>
          <div style={{ fontSize: 40, fontWeight: 700, color: C.fg }}>
            Elle observe… <span style={{ color: C.beige }}>mais ne crée rien.</span>
          </div>
        </Reveal>
      </div>

      {/* P3 — l'IA générative */}
      <div style={panel}>
        <Reveal at={20.9} out={OUT}>
          <Eyebrow>La branche la plus récente</Eyebrow>
        </Reveal>
        <RiseLines
          at={21.1}
          out={OUT}
          style={{ marginTop: 32, fontSize: 104, fontWeight: 800, letterSpacing: "-0.045em", lineHeight: 0.98 }}
          lines={["L'IA", <GradText key="g">générative</GradText>]}
        />
        <Reveal at={24.8} out={OUT} style={{ marginTop: 48 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 28, fontSize: 64, fontWeight: 800, letterSpacing: "-0.03em" }}>
            <span style={{ position: "relative", color: strike > 0.8 ? C.fg3 : C.fg }}>
              Analyser
              <span
                style={{
                  position: "absolute",
                  left: -6,
                  top: "54%",
                  height: 5,
                  borderRadius: 4,
                  width: `calc(${strike * 100}% + 12px)`,
                  background: C.beige,
                }}
              />
            </span>
            <span style={{ color: C.fg3, fontWeight: 500 }}>→</span>
            <Reveal at={27.8} y={10}>
              <GradText>Créer</GradText>
            </Reveal>
          </div>
        </Reveal>
        <Reveal at={28.6} out={OUT} style={{ marginTop: 42 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 14,
              padding: "14px 26px",
              borderRadius: 999,
              backgroundImage: GRAD.violet,
              color: "#140d1f",
              fontSize: 30,
              fontWeight: 700,
            }}
          >
            <IconSparkle size={28} color="#140d1f" />
            Le cœur de cette formation
          </div>
        </Reveal>
      </div>
    </AbsoluteFill>
  );
};
