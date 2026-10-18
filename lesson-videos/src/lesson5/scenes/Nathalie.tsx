import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { IconShield, IconSparkle, IconTarget } from "../../components/icons";
import { Eyebrow, GradText, Reveal, RiseLines, baseText, useExit } from "../../components/ui";
import { C, EASE, SAFE_L, clamp } from "../../theme";

// 170,6 → 208,4 s. Temps locaux = temps audio − 170,6.
// La voix off s'adresse à Nathalie (RH / SIRH) : ses réflexes de rédaction.
const OUT = 37.25;
const CW = 386;

type Card = { at: number; n: string; title: string; icon: React.ReactNode; color: string; body: React.ReactNode };

const Chip: React.FC<{ at: number; children: React.ReactNode }> = ({ at, children }) => (
  <Reveal at={at} y={8}>
    <span style={{ display: "inline-flex", padding: "6px 14px", borderRadius: 999, background: "rgba(255,255,255,0.08)", border: `1px solid ${C.hairline2}`, fontSize: 19, fontWeight: 700, whiteSpace: "nowrap" }}>
      {children}
    </span>
  </Reveal>
);

const CARDS: Card[] = [
  {
    at: 11.7,
    n: "1",
    title: "Injectez vos contraintes métier",
    icon: <IconShield size={30} />,
    color: C.violetLight,
    body: (
      <>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <Chip at={16.6}>Nom de l'outil RH</Chip>
          <Chip at={18.7}>Règles de gestion</Chip>
          <Chip at={20.5}>Exigences RGPD</Chip>
        </div>
        <Reveal at={21.3} y={8} style={{ marginTop: 16 }}>
          <div style={{ fontSize: 20, color: C.fg2, fontWeight: 500, lineHeight: 1.4 }}>
            Un cadre clair = l'IA n'invente pas de fonctionnalité.
          </div>
        </Reveal>
      </>
    ),
  },
  {
    at: 26.9,
    n: "2",
    title: "Précisez correctement vos cibles",
    icon: <IconTarget size={30} />,
    color: C.bleu,
    body: (
      <Reveal at={29.1} y={8}>
        <div style={{ fontSize: 21, color: C.fg2, fontWeight: 500, lineHeight: 1.4 }}>
          Pour un document, indiquez <span style={{ color: C.fg, fontWeight: 700 }}>l'écart de maturité</span> entre les publics.
        </div>
      </Reveal>
    ),
  },
  {
    at: 32.9,
    n: "3",
    title: "Appliquez ces clés à vos prochains prompts",
    icon: <IconSparkle size={30} />,
    color: C.bleuVert,
    body: (
      <Reveal at={35.6} y={8}>
        <div style={{ fontSize: 21, color: C.fg2, fontWeight: 500 }}>…et voyez la différence.</div>
      </Reveal>
    ),
  },
];

const CardView: React.FC<{ c: Card; i: number }> = ({ c, i }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = interpolate(frame, [c.at * fps, (c.at + 0.9) * fps], [0, 1], { ...clamp, easing: EASE });
  const q = useExit(OUT, 0.5);
  return (
    <div style={{ position: "absolute", left: SAFE_L + i * (CW + 22), top: 420, width: CW, perspective: 1200 }}>
      <div
        style={{
          minHeight: 360,
          borderRadius: 26,
          padding: "26px 24px",
          opacity: p * (1 - q),
          transform: `rotateX(${(1 - p) * 40}deg) translateY(${(1 - p) * 40}px)`,
          transformOrigin: "50% 0%",
          border: `1.5px solid ${c.color}88`,
          background: `linear-gradient(180deg, ${c.color}1c, rgba(255,255,255,0.02)), rgba(12,10,18,0.85)`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 40, fontWeight: 800, color: c.color }}>{c.n}</span>
          <span style={{ color: c.color, display: "flex" }}>{c.icon}</span>
        </div>
        <div style={{ marginTop: 16, fontSize: 29, fontWeight: 800, lineHeight: 1.15, letterSpacing: "-0.02em" }}>{c.title}</div>
        <div style={{ marginTop: 18 }}>{c.body}</div>
      </div>
    </div>
  );
};

export const Nathalie: React.FC = () => (
  <AbsoluteFill style={{ ...baseText }}>
    <div style={{ position: "absolute", left: 160, top: 120, width: 1500 }}>
      <Reveal at={0.2} out={OUT}>
        <Eyebrow>Pour vous, Nathalie</Eyebrow>
      </Reveal>
      <RiseLines
        at={0.4}
        out={OUT}
        style={{ marginTop: 16, fontSize: 56, fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1.04 }}
        lines={[
          <span key="t">
            Entre <GradText>la technique</GradText> et <GradText>les utilisateurs</GradText>
          </span>,
        ]}
      />
      <Reveal at={6.0} out={OUT} style={{ marginTop: 22 }}>
        <div style={{ fontSize: 28, color: C.fg2, fontWeight: 500 }}>Vos réflexes de rédaction pour réussir vos prompts à tous les coups :</div>
      </Reveal>
    </div>
    {CARDS.map((c, i) => (
      <CardView key={c.n} c={c} i={i} />
    ))}
  </AbsoluteFill>
);
