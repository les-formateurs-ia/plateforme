import React from "react";
import { AbsoluteFill } from "remotion";
import { IconCheck, IconCode, IconHeadphones, IconTarget, IconWave } from "../../components/icons";
import { Eyebrow, GradText, Logo, Reveal, RiseLines, baseText, useEnter } from "../../components/ui";
import { C, GRAD, SAFE_L } from "../../theme";

// 127,4 → fin (156,04 s). Temps locaux = temps audio − 127,4.
const OUT_A = 9.6;
const END = 28.64;

// Mêmes onglets que la page leçon de la plateforme (LessonPage.tsx, TABS).
const TABS = [
  { label: "Podcast", icon: <IconHeadphones size={26} /> },
  { label: "Playground", icon: <IconCode size={26} /> },
  { label: "Agent", icon: <IconWave size={26} /> },
];
const CRITERIA = ["Répétitive", "Logique", "Documentée"];

export const Outro: React.FC = () => {
  const glow = useEnter(23.0, 0.8);
  return (
    <AbsoluteFill style={{ ...baseText }}>
      {/* A — retenez une chose */}
      <div style={{ position: "absolute", left: SAFE_L, top: 230, width: 820 }}>
        <Reveal at={0.2} out={OUT_A}>
          <Eyebrow color={C.bleuVert}>Retenez une chose</Eyebrow>
        </Reveal>
        <RiseLines
          at={1.6}
          out={OUT_A}
          style={{ marginTop: 30, fontSize: 60, fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1.06 }}
          lines={["Bien choisir ses tâches,", <GradText key="g">c'est gagner en productivité</GradText>]}
        />
        <Reveal at={7.3} out={OUT_A} style={{ marginTop: 40 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 32, fontWeight: 600 }}>
            <span style={{ color: C.bleuVert, display: "flex" }}>
              <IconTarget size={34} />
            </span>
            …et concentrer vos efforts au bon endroit.
          </div>
        </Reveal>
      </div>

      {/* B — à vous de jouer */}
      <div style={{ position: "absolute", left: SAFE_L, top: 200, width: 820 }}>
        <RiseLines
          at={10.2}
          out={END - 0.6}
          style={{ fontSize: 92, fontWeight: 800, letterSpacing: "-0.045em", lineHeight: 1 }}
          lines={[<GradText key="j">À vous de jouer</GradText>]}
        />
        <Reveal at={10.9} out={END - 0.6} style={{ marginTop: 22 }}>
          <div style={{ fontSize: 29, color: C.fg2, fontWeight: 500, lineHeight: 1.35, maxWidth: 740 }}>
            Passez en revue les tâches de votre quotidien et identifiez celles que vous pourriez optimiser.
          </div>
        </Reveal>
        <div style={{ marginTop: 24, display: "flex", gap: 12 }}>
          {CRITERIA.map((c, i) => (
            <Reveal key={c} at={14.2 + i * 0.25} out={END - 0.6} y={10}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "8px 18px 8px 10px",
                  borderRadius: 999,
                  border: `1px solid ${C.hairline2}`,
                  background: "rgba(255,255,255,0.04)",
                  fontSize: 24,
                  fontWeight: 600,
                }}
              >
                <span style={{ width: 30, height: 30, borderRadius: 99, display: "grid", placeItems: "center", backgroundImage: GRAD.bleu }}>
                  <IconCheck size={18} color="#0b1a16" />
                </span>
                {c}
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal at={17.8} out={END - 0.6} style={{ marginTop: 30 }}>
          <div style={{ fontSize: 26, color: C.fg3, fontWeight: 600 }}>
            Comment les optimiser ? <span style={{ color: C.fg }}>Ce sera l'objet des prochaines leçons.</span>
          </div>
        </Reveal>
        <Reveal at={22.9} out={END - 0.6} style={{ marginTop: 40 }}>
          <div
            style={{
              display: "inline-flex",
              gap: 8,
              padding: 8,
              borderRadius: 20,
              border: `1px solid ${C.hairline2}`,
              background: "rgba(255,255,255,0.04)",
            }}
          >
            {TABS.map((tab) => (
              <div
                key={tab.label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "12px 20px",
                  borderRadius: 14,
                  fontSize: 26,
                  fontWeight: 600,
                  background: `rgba(181,141,224,${0.06 + glow * 0.12})`,
                  boxShadow: `inset 0 0 0 1px rgba(219,172,240,${glow * 0.45})`,
                }}
              >
                <span style={{ color: C.violetLight, display: "flex" }}>{tab.icon}</span>
                {tab.label}
              </div>
            ))}
          </div>
        </Reveal>
        <Reveal at={24.3} out={END - 0.6} style={{ marginTop: 18 }}>
          <div style={{ fontSize: 26, color: C.fg2, fontWeight: 500 }}>
            → Pratiquez sur les tâches préparées par <span style={{ color: C.fg }}>votre formateur</span>.
          </div>
        </Reveal>
      </div>

      <Reveal at={26.6} style={{ position: "absolute", right: 96, top: 900 }}>
        <Logo h={38} />
      </Reveal>
    </AbsoluteFill>
  );
};
