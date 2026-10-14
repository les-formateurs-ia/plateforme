import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { IconCheck, IconCode, IconHeadphones, IconWave } from "../../components/icons";
import { Eyebrow, GradText, Logo, Reveal, RiseLines, baseText } from "../../components/ui";
import { C, EASE, GRAD, SAFE_L, clamp } from "../../theme";

// 349,9 → fin (370,33 s). Temps locaux = temps audio − 349,9.
const RECAP = [
  "Situer l'IA générative",
  "Comprendre son fonctionnement",
  "Connaître ses limites",
  "Choisir le bon outil",
];

// Mêmes onglets que la page leçon de la plateforme (LessonPage.tsx, TABS).
const TABS = [
  { label: "Vidéo", icon: null },
  { label: "Podcast", icon: <IconHeadphones size={28} /> },
  { label: "Playground", icon: <IconCode size={28} /> },
  { label: "Agent", icon: <IconWave size={28} /> },
];

export const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const glow = interpolate(frame, [7.0 * fps, 7.8 * fps], [0, 1], { ...clamp, easing: EASE });

  return (
    <AbsoluteFill style={{ ...baseText }}>
      {/* A — fin de leçon + récap */}
      <div style={{ position: "absolute", left: SAFE_L, top: 210, width: 720 }}>
        <Reveal at={0.1} out={5.8}>
          <Eyebrow color={C.bleuVert}>Leçon 1 terminée</Eyebrow>
        </Reveal>
        <RiseLines
          at={0.3}
          out={5.8}
          style={{ marginTop: 30, fontSize: 92, fontWeight: 800, letterSpacing: "-0.045em", lineHeight: 1 }}
          lines={["C'est tout pour", <GradText key="l">cette leçon</GradText>]}
        />
        <div style={{ marginTop: 50, display: "flex", flexDirection: "column", gap: 18 }}>
          {RECAP.map((r, i) => (
            <Reveal key={r} at={1.1 + i * 0.16} out={5.8} y={12}>
              <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 31, fontWeight: 600 }}>
                <span
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 99,
                    display: "grid",
                    placeItems: "center",
                    backgroundImage: GRAD.bleu,
                  }}
                >
                  <IconCheck size={24} color="#0b1a16" />
                </span>
                {r}
              </div>
            </Reveal>
          ))}
        </div>
      </div>

      {/* B — les autres onglets */}
      <div style={{ position: "absolute", left: SAFE_L, top: 210, width: 820 }}>
        <Reveal at={6.0} out={17.6}>
          <Eyebrow>Et maintenant ?</Eyebrow>
        </Reveal>
        <RiseLines
          at={6.2}
          out={17.6}
          style={{ marginTop: 30, fontSize: 66, fontWeight: 800, letterSpacing: "-0.045em", lineHeight: 1.02 }}
          lines={["Passez à la pratique", <GradText key="o">dans les autres onglets</GradText>]}
        />
        <Reveal at={6.8} out={17.6} style={{ marginTop: 48 }}>
          <div
            style={{
              display: "inline-flex",
              gap: 8,
              padding: 8,
              borderRadius: 22,
              border: `1px solid ${C.hairline2}`,
              background: "rgba(255,255,255,0.04)",
            }}
          >
            {TABS.map((tab, i) => {
              const current = i === 0;
              return (
                <div
                  key={tab.label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 20px",
                    borderRadius: 14,
                    fontSize: 26,
                    fontWeight: 600,
                    color: current ? C.fg3 : C.fg,
                    background: current ? "transparent" : `rgba(181,141,224,${0.06 + glow * 0.12})`,
                    boxShadow: current ? "none" : `inset 0 0 0 1px rgba(219,172,240,${glow * 0.45})`,
                  }}
                >
                  {tab.icon ? <span style={{ color: C.violetLight, display: "flex" }}>{tab.icon}</span> : null}
                  {tab.label}
                  {current ? <IconCheck size={24} color={C.bleuVert} /> : null}
                </div>
              );
            })}
          </div>
        </Reveal>
        <div style={{ marginTop: 44, display: "flex", flexDirection: "column", gap: 16 }}>
          <Reveal at={8.6} out={17.6} y={12}>
            <div style={{ fontSize: 27, fontWeight: 500, color: C.fg2 }}>
              → Des cas d'usage propres à <span style={{ color: C.fg }}>votre secteur et votre métier</span>
            </div>
          </Reveal>
          <Reveal at={14.4} out={17.6} y={12}>
            <div style={{ fontSize: 27, fontWeight: 500, color: C.fg2 }}>
              → Des <span style={{ color: C.fg }}>exemples concrets</span> à reproduire
            </div>
          </Reveal>
        </div>
      </div>

      {/* C — merci */}
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", textAlign: "center", paddingLeft: 280 }}>
        <RiseLines
          at={18.0}
          style={{ fontSize: 120, fontWeight: 800, letterSpacing: "-0.045em", lineHeight: 1 }}
          lines={[<GradText key="m">Merci !</GradText>]}
        />
        <Reveal at={18.5} style={{ marginTop: 22 }}>
          <div style={{ fontSize: 40, fontWeight: 500, color: C.fg2 }}>À très bientôt.</div>
        </Reveal>
        <Reveal at={19.0} style={{ marginTop: 56 }}>
          <Logo h={44} />
        </Reveal>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
