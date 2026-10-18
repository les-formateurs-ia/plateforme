import React from "react";
import { AbsoluteFill } from "remotion";
import { IconCheck, IconCode, IconHeadphones, IconWave } from "../../components/icons";
import { Eyebrow, GradText, Reveal, RiseLines, baseText, useEnter } from "../../components/ui";
import { C, SAFE_L } from "../../theme";
import { PILLARS } from "../timeline";

// 208,2 → fin (237,08 s). Temps locaux = temps audio − 208,2.
const END = 28.88;
const A_OUT = 9.9;

const TABS = [
  { label: "Podcast", icon: <IconHeadphones size={24} /> },
  { label: "Playground", icon: <IconCode size={24} /> },
  { label: "Agent", icon: <IconWave size={24} /> },
];

export const Outro: React.FC = () => {
  const strike = useEnter(7.8, 0.5);
  return (
    <AbsoluteFill style={{ ...baseText }}>
      {/* A — pas de formule magique */}
      <div style={{ position: "absolute", left: SAFE_L, top: 230, width: 760 }}>
        <Reveal at={0.2} out={A_OUT}>
          <Eyebrow color={C.bleuVert}>Vous l'avez compris</Eyebrow>
        </Reveal>
        <Reveal at={0.5} out={A_OUT} style={{ marginTop: 26 }}>
          <div style={{ fontSize: 34, color: C.fg2, fontWeight: 600 }}>La clé d'un bon échange avec l'IA ?</div>
        </Reveal>
        <Reveal at={7.6} out={A_OUT} style={{ marginTop: 20 }}>
          <div style={{ position: "relative", display: "inline-block", fontSize: 48, fontWeight: 800, color: strike > 0.5 ? C.fg3 : C.fg }}>
            Des formules magiques
            <span style={{ position: "absolute", left: -4, top: "54%", height: 5, borderRadius: 3, width: `calc(${strike * 100}% + 8px)`, background: C.beige }} />
          </div>
        </Reveal>
        <RiseLines
          at={9.0}
          out={A_OUT}
          style={{ marginTop: 10, fontSize: 64, fontWeight: 800, letterSpacing: "-0.045em", lineHeight: 1.04 }}
          lines={[<GradText key="p">Une bonne préparation</GradText>]}
        />
      </div>

      {/* B — vos cinq repères */}
      <div style={{ position: "absolute", left: SAFE_L, top: 200, width: 800 }}>
        <RiseLines
          at={10.1}
          out={END - 0.6}
          style={{ fontSize: 52, fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1.06 }}
          lines={["Avant d'envoyer,", <GradText key="r">vérifiez vos 5 repères</GradText>]}
        />
        <div style={{ marginTop: 28, display: "flex", flexWrap: "wrap", gap: 10 }}>
          {PILLARS.map((p, i) => (
            <Reveal key={p.id} at={14.6 + i * 0.25} out={END - 0.6} y={10}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "8px 18px 8px 10px",
                  borderRadius: 999,
                  border: `1px solid ${p.color}77`,
                  background: `${p.color}14`,
                  fontSize: 23,
                  fontWeight: 700,
                }}
              >
                <span style={{ width: 28, height: 28, borderRadius: 99, display: "grid", placeItems: "center", background: p.color }}>
                  <IconCheck size={17} color="#140d1f" />
                </span>
                {p.label}
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal at={16.4} out={END - 0.6} style={{ marginTop: 28 }}>
          <div style={{ fontSize: 28, fontWeight: 600 }}>
            → des documents <span style={{ color: C.bleuVert }}>directement exploitables</span> au quotidien.
          </div>
        </Reveal>
        <Reveal at={23.3} out={END - 0.6} style={{ marginTop: 40 }}>
          <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: C.fg3 }}>
            Pour aller plus loin : le contenu et les autres onglets
          </div>
          <div style={{ marginTop: 14, display: "inline-flex", gap: 8, padding: 8, borderRadius: 20, border: `1px solid ${C.hairline2}`, background: "rgba(255,255,255,0.04)" }}>
            {TABS.map((t) => (
              <div
                key={t.label}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 18px", borderRadius: 14, fontSize: 24, fontWeight: 600, background: "rgba(181,141,224,0.14)" }}
              >
                <span style={{ color: C.violetLight, display: "flex" }}>{t.icon}</span>
                {t.label}
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </AbsoluteFill>
  );
};

