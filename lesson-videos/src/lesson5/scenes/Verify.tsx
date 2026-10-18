import React from "react";
import { AbsoluteFill } from "remotion";
import { IconCheck, IconEye, IconListChecks, IconUser } from "../../components/icons";
import { Eyebrow, Glass, GradText, Reveal, RiseLines, baseText } from "../../components/ui";
import { C, GRAD, SAFE_L } from "../../theme";

// 154 → 170,8 s. Temps locaux = temps audio − 154.
const OUT = 16.25;

const Q: React.FC<{ at: number; title: string; icon: React.ReactNode; color: string; children: React.ReactNode }> = ({ at, title, icon, color, children }) => (
  <Reveal at={at} out={OUT} y={20}>
    <Glass glow={color} style={{ width: 580, padding: "28px 30px", borderRadius: 26 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <span style={{ width: 56, height: 56, borderRadius: 18, display: "grid", placeItems: "center", border: `1px solid ${color}66`, background: `${color}1a`, color }}>
          {icon}
        </span>
        <span style={{ fontSize: 40, fontWeight: 800, letterSpacing: "-0.03em" }}>{title}</span>
      </div>
      <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 12 }}>{children}</div>
    </Glass>
  </Reveal>
);

const Point: React.FC<{ at: number; children: React.ReactNode }> = ({ at, children }) => (
  <Reveal at={at} y={8}>
    <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 25, fontWeight: 600 }}>
      <span style={{ flex: "none", width: 30, height: 30, borderRadius: 99, display: "grid", placeItems: "center", backgroundImage: GRAD.bleu }}>
        <IconCheck size={18} color="#0b1a16" />
      </span>
      {children}
    </div>
  </Reveal>
);

export const Verify: React.FC = () => (
  <AbsoluteFill style={{ ...baseText }}>
    <div style={{ position: "absolute", left: 160, top: 120 }}>
      <Reveal at={0.2} out={OUT}>
        <Eyebrow color={C.bleuVert}>Une fois la réponse obtenue</Eyebrow>
      </Reveal>
      <RiseLines
        at={0.4}
        out={OUT}
        style={{ marginTop: 16, fontSize: 60, fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1.04 }}
        lines={[
          <span key="t">
            Vérifiez <GradText grad={GRAD.bleu}>deux choses</GradText>
          </span>,
        ]}
      />
    </div>
    <div style={{ position: "absolute", left: SAFE_L, top: 330, display: "flex", gap: 30 }}>
      <Q at={4.9} title="Adaptée ?" icon={<IconUser size={30} />} color={C.violetLight}>
        <Point at={7.1}>Juste sur le fond</Point>
        <Point at={8.3}>Adaptée à vos collègues</Point>
      </Q>
      <Q at={9.7} title="Conforme ?" icon={<IconListChecks size={30} />} color={C.bleu}>
        <Point at={11.5}>Fidèle au format demandé</Point>
      </Q>
    </div>
    <Reveal at={12.6} out={OUT} style={{ position: "absolute", left: SAFE_L, top: 740, width: 1190 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 30, fontWeight: 700 }}>
        <span style={{ color: C.bleuVert, display: "flex" }}>
          <IconEye size={34} />
        </span>
        Même avec un bon prompt, <span style={{ color: C.bleuVert }}>votre relecture reste indispensable.</span>
      </div>
    </Reveal>
  </AbsoluteFill>
);
