import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { IconUser } from "../../components/icons";
import { Eyebrow, Glass, GradText, Reveal, RiseLines, baseText, useEnter, useExit } from "../../components/ui";
import { C, EASE, GRAD, SAFE_L, clamp } from "../../theme";

// 76,2 → 114,6 s. Temps locaux = temps audio − 76,2.
const OUT = 37.85;
const PERSON = { x: 1180, y: 770 };

const Stars: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  return (
    <div style={{ position: "relative", flex: "none", width: 150, height: 150 }}>
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i / 12) * Math.PI * 2 + t * 0.15;
        const p = interpolate(frame, [(3.4 + i * 0.05) * fps, (3.9 + i * 0.05) * fps], [0, 1], clamp);
        return (
          <span
            key={i}
            style={{
              position: "absolute",
              left: 75 + Math.cos(a) * 54 - 9,
              top: 75 + Math.sin(a) * 54 - 11,
              fontSize: 20,
              color: "#FBC2AD",
              opacity: p,
            }}
          >
            ★
          </span>
        );
      })}
      <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", fontSize: 26, fontWeight: 800, letterSpacing: "0.02em" }}>RGPD</div>
    </div>
  );
};

type Id = { at: number; label: string; x: number; y: number; direct?: boolean };
const IDS: Id[] = [
  { at: 20.4, label: "Nom", x: 760, y: 700, direct: true },
  { at: 22.6, label: "Photo", x: 760, y: 800, direct: true },
  { at: 26.6, label: "Adresse IP", x: 1500, y: 640 },
  { at: 27.1, label: "Plaque d'immatriculation", x: 1500, y: 720 },
  { at: 30.3, label: "N° de sécurité sociale", x: 1500, y: 800 },
  { at: 31.8, label: "Adresse mail", x: 1500, y: 880 },
];
const LINK_AT = 34.1;

const Identifiers: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const q = useExit(OUT, 0.5);
  const person = useEnter(19.6, 0.8);
  const link = interpolate(frame, [LINK_AT * fps, (LINK_AT + 1.2) * fps], [0, 1], { ...clamp, easing: EASE });
  return (
    <>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: 1 - q }}>
        {IDS.map((id) => {
          const p = id.direct
            ? interpolate(frame, [(id.at + 0.3) * fps, (id.at + 1.0) * fps], [0, 1], clamp)
            : link;
          const x1 = id.direct ? id.x + 150 : id.x - 10;
          const len = Math.hypot(PERSON.x - x1, PERSON.y - id.y);
          return (
            <line
              key={id.label}
              x1={x1}
              y1={id.y}
              x2={PERSON.x}
              y2={PERSON.y}
              stroke={id.direct ? C.violetLight : C.beige}
              strokeWidth={2}
              strokeDasharray={len}
              strokeDashoffset={len * (1 - p)}
              opacity={0.7}
            />
          );
        })}
      </svg>
      <div
        style={{
          position: "absolute",
          left: PERSON.x - 70,
          top: PERSON.y - 70,
          width: 140,
          height: 140,
          borderRadius: 99,
          display: "grid",
          placeItems: "center",
          backgroundImage: GRAD.violet,
          opacity: person * (1 - q),
          scale: String(0.7 + 0.3 * person + link * 0.06),
          boxShadow: `0 0 ${link * 60}px ${C.beige}`,
        }}
      >
        <IconUser size={70} color="#140d1f" />
      </div>
      <Reveal at={19.8} out={OUT} style={{ position: "absolute", left: 660, top: 620 }}>
        <div style={{ fontSize: 19, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: C.violetLight }}>Identifiants directs</div>
      </Reveal>
      <Reveal at={25.2} out={OUT} style={{ position: "absolute", left: 1400, top: 570 }}>
        <div style={{ fontSize: 19, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: C.beige }}>Attention : identifiants indirects</div>
      </Reveal>
      {IDS.map((id) => (
        <Reveal key={id.label} at={id.at} out={OUT} y={10} style={{ position: "absolute", left: id.direct ? id.x - 100 : id.x, top: id.y - 22 }}>
          <span
            style={{
              display: "inline-flex",
              padding: "9px 18px",
              borderRadius: 999,
              border: `1px solid ${id.direct ? "rgba(219,172,240,0.5)" : "rgba(251,194,173,0.5)"}`,
              background: id.direct ? "rgba(181,141,224,0.14)" : "rgba(251,194,173,0.1)",
              fontSize: 22,
              fontWeight: 700,
              whiteSpace: "nowrap",
              minWidth: id.direct ? 250 : undefined,
              justifyContent: "center",
            }}
          >
            {id.label}
          </span>
        </Reveal>
      ))}
      <Reveal at={LINK_AT + 0.4} out={OUT} style={{ position: "absolute", left: 960, top: 905, width: 440, textAlign: "center" }}>
        <div style={{ fontSize: 21, fontWeight: 700, color: C.beige, lineHeight: 1.3 }}>Croisées avec d'autres bases, elles remontent jusqu'à l'individu.</div>
      </Reveal>
    </>
  );
};

export const Personal: React.FC = () => (
  <AbsoluteFill style={{ ...baseText }}>
    <div style={{ position: "absolute", left: 160, top: 110 }}>
      <Reveal at={0.2} out={OUT}>
        <Eyebrow color={C.bleu}>Catégorie 2</Eyebrow>
      </Reveal>
      <RiseLines
        at={0.4}
        out={OUT}
        style={{ marginTop: 16, fontSize: 58, fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1.04 }}
        lines={[
          <span key="t">
            Les données <GradText grad={GRAD.bleu}>personnelles</GradText>
          </span>,
        ]}
      />
    </div>

    <Reveal at={3.1} out={OUT} y={18} style={{ position: "absolute", left: SAFE_L, top: 300, width: 580 }}>
      <Glass glow={C.beige} style={{ padding: "20px 24px", borderRadius: 24, display: "flex", alignItems: "center", gap: 30 }}>
        <Stars />
        <div>
          <Reveal at={4.6} y={8}>
            <div style={{ fontSize: 23, fontWeight: 700, lineHeight: 1.3 }}>Règlement Général sur la Protection des Données</div>
          </Reveal>
          <Reveal at={8.7} y={8} style={{ marginTop: 10 }}>
            <div style={{ fontSize: 20, color: C.fg2, fontWeight: 500, lineHeight: 1.35 }}>La loi européenne qui protège la vie privée des citoyens.</div>
          </Reveal>
        </div>
      </Glass>
    </Reveal>
    <Reveal at={12.6} out={OUT} y={18} style={{ position: "absolute", left: 1230, top: 300, width: 590 }}>
      <Glass glow={C.bleu} style={{ padding: "24px 28px", borderRadius: 24, minHeight: 190 }}>
        <div style={{ fontSize: 19, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: C.fg3 }}>Selon le RGPD</div>
        <div style={{ marginTop: 10, fontSize: 27, lineHeight: 1.4, fontWeight: 500 }}>
          Une donnée personnelle = <span style={{ color: C.bleu, fontWeight: 800 }}>toute information</span> qui permet d'identifier une personne physique.
        </div>
      </Glass>
    </Reveal>
    <Identifiers />
  </AbsoluteFill>
);
