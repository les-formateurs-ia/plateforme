import React from "react";
import { AbsoluteFill } from "remotion";
import { IconLock, IconSearch, IconShield, IconUser } from "../../components/icons";
import { Eyebrow, GradText, Reveal, RiseLines, baseText } from "../../components/ui";
import { C, SAFE_L } from "../../theme";

// 0 → 23,6 s. Pourquoi sécuriser, et les trois façons de le faire.
const PILLARS = [
  { at: 14.0, n: "01", label: "Anonymiser les données", icon: <IconUser size={28} />, color: C.violetLight },
  { at: 16.4, n: "02", label: "Restreindre les accès", icon: <IconLock size={28} />, color: C.bleu },
  { at: 18.1, n: "03", label: "Relire manuellement", icon: <IconSearch size={28} />, color: C.bleuVert },
];

export const Intro: React.FC = () => (
  <AbsoluteFill style={{ ...baseText }}>
    <div style={{ position: "absolute", left: SAFE_L, top: 190, width: 740 }}>
      <Reveal at={0.3} out={23.0}>
        <Eyebrow color={C.bleuVert}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
            <IconShield size={24} color={C.bleuVert} /> Sécuriser son usage de l'IA
          </span>
        </Eyebrow>
      </Reveal>
      <RiseLines
        at={1.0}
        out={23.0}
        style={{ marginTop: 30, fontSize: 58, fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1.06 }}
        lines={["Des réflexes de sécurité", <GradText key="r">pour une IA responsable</GradText>]}
      />
      <Reveal at={8.8} out={23.0} style={{ marginTop: 40 }}>
        <div style={{ fontSize: 30, color: C.fg2, fontWeight: 500 }}>
          Aujourd'hui, <span style={{ color: C.fg, fontWeight: 700 }}>3 façons</span> de sécuriser votre usage :
        </div>
      </Reveal>
      <div style={{ marginTop: 22, display: "flex", flexDirection: "column", gap: 12 }}>
        {PILLARS.map((p) => (
          <Reveal key={p.n} at={p.at} out={23.0} y={16}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 20,
                padding: "16px 24px",
                borderRadius: 22,
                border: `1px solid ${p.color}55`,
                background: `linear-gradient(90deg, ${p.color}18, rgba(255,255,255,0.02)), rgba(12,10,18,0.7)`,
              }}
            >
              <span style={{ fontSize: 22, fontWeight: 700, color: C.fg3, width: 34 }}>{p.n}</span>
              <span style={{ color: p.color, display: "flex" }}>{p.icon}</span>
              <span style={{ fontSize: 32, fontWeight: 700, letterSpacing: "-0.01em" }}>{p.label}</span>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  </AbsoluteFill>
);
