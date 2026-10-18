import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { IconCheck, IconSparkle } from "../../components/icons";
import { Eyebrow, Glass, GradText, Reveal, RiseLines, baseText, useEnter } from "../../components/ui";
import { C, EASE, GRAD, SAFE_L, clamp } from "../../theme";
import { PILLARS } from "../timeline";
import { PILLAR_ICONS } from "./Pillars";

// 118,8 → 154,2 s. Temps locaux = temps audio − 118,8.
// La même demande, reconstruite pilier par pilier.
const OUT = 34.85;
const CHUNKS = [
  { at: 4.6, text: "Tu es un manager d'équipe projet." },
  { at: 8.3, text: "Ce message s'adresse aux 6 membres de ton équipe technique." },
  { at: 14.2, text: "Annonce le report de 2 semaines de la mise en production." },
  { at: 18.7, text: "Ce décalage est dû à l'attente d'une validation client." },
  { at: 22.8, text: "Rédige un message pour Teams, rassurant et clair, avec 3 puces d'action." },
];

const Chunk: React.FC<{ i: number }> = ({ i }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const c = CHUNKS[i];
  const p = PILLARS[i];
  const n = Math.floor(interpolate(frame, [(c.at + 0.2) * fps, (c.at + 1.6) * fps], [0, c.text.length], clamp));
  const tag = interpolate(frame, [c.at * fps, (c.at + 0.5) * fps], [0, 1], { ...clamp, easing: EASE });
  if (tag <= 0) return null;
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 14, opacity: tag }}>
      <span
        style={{
          flex: "none",
          marginTop: 3,
          padding: "3px 12px",
          borderRadius: 999,
          border: `1px solid ${p.color}88`,
          background: `${p.color}1f`,
          color: p.color,
          fontSize: 16,
          fontWeight: 800,
          width: 118,
          textAlign: "center",
          translate: `${(1 - tag) * -14}px 0px`,
        }}
      >
        {p.label}
      </span>
      <span style={{ fontSize: 25, lineHeight: 1.4, fontWeight: 500, color: C.fg }}>{c.text.slice(0, n)}</span>
    </div>
  );
};

const Check: React.FC<{ i: number }> = ({ i }) => {
  const p = PILLARS[i];
  const on = useEnter(CHUNKS[i].at, 0.5);
  return (
    <Reveal at={1.2 + i * 0.12} out={OUT} y={10}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "14px 16px",
          borderRadius: 18,
          border: `1px solid ${on > 0.5 ? `${p.color}88` : C.hairline}`,
          background: on > 0.5 ? `${p.color}14` : "rgba(255,255,255,0.03)",
        }}
      >
        <span style={{ color: on > 0.5 ? p.color : C.fg3, display: "flex" }}>{PILLAR_ICONS[i]}</span>
        <span style={{ flex: 1, fontSize: 24, fontWeight: 700, color: on > 0.5 ? C.fg : C.fg3 }}>{p.label}</span>
        <span
          style={{
            width: 30,
            height: 30,
            borderRadius: 99,
            display: "grid",
            placeItems: "center",
            background: C.bleuVert,
            opacity: on,
            scale: String(0.6 + 0.4 * on),
          }}
        >
          <IconCheck size={18} color="#0b1a16" />
        </span>
      </div>
    </Reveal>
  );
};

export const Rebuild: React.FC = () => (
  <AbsoluteFill style={{ ...baseText }}>
    <div style={{ position: "absolute", left: 160, top: 120 }}>
      <Reveal at={0.2} out={OUT}>
        <Eyebrow>Reconstruisons la même demande</Eyebrow>
      </Reveal>
      <RiseLines
        at={0.4}
        out={OUT}
        style={{ marginTop: 16, fontSize: 60, fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1.04 }}
        lines={[
          <span key="t">
            Le même prompt, <GradText>en 5 piliers</GradText>
          </span>,
        ]}
      />
    </div>

    <div style={{ position: "absolute", left: SAFE_L, top: 320, width: 300, display: "flex", flexDirection: "column", gap: 12 }}>
      {PILLARS.map((_, i) => (
        <Check key={i} i={i} />
      ))}
    </div>

    <Reveal at={1.6} out={OUT} y={20} style={{ position: "absolute", left: 960, top: 310, width: 860 }}>
      <Glass glow={C.violet} style={{ padding: "26px 30px 30px", borderRadius: 26, minHeight: 420 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 21, fontWeight: 700 }}>
          <span style={{ width: 36, height: 36, borderRadius: 11, display: "grid", placeItems: "center", backgroundImage: GRAD.violet }}>
            <IconSparkle size={20} color="#140d1f" />
          </span>
          Votre prompt
        </div>
        <div style={{ marginTop: 22, display: "flex", flexDirection: "column", gap: 16 }}>
          {CHUNKS.map((_, i) => (
            <Chunk key={i} i={i} />
          ))}
        </div>
      </Glass>
    </Reveal>

    <Reveal at={29.7} out={OUT} y={12} style={{ position: "absolute", left: 960, top: 790, width: 860 }}>
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 12,
          padding: "12px 22px 12px 14px",
          borderRadius: 999,
          border: "1px solid rgba(106,222,177,0.5)",
          background: "rgba(106,222,177,0.1)",
          fontSize: 24,
          fontWeight: 700,
        }}
      >
        <span style={{ width: 32, height: 32, borderRadius: 99, display: "grid", placeItems: "center", background: C.bleuVert }}>
          <IconCheck size={20} color="#0b1a16" />
        </span>
        L'IA a tous les éléments → un brouillon pertinent
      </div>
    </Reveal>
  </AbsoluteFill>
);
