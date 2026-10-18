import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { IconCheck, IconFileText, IconSparkle } from "../../components/icons";
import { Eyebrow, Glass, GradText, Reveal, RiseLines, baseText } from "../../components/ui";
import { C, EASE, GRAD, SAFE_L, clamp } from "../../theme";

// 0 → 44,1 s. Rappel, objectif de la leçon, Gemini comme exemple.
const A_OUT = 11.6;
const B_OUT = 23.6;
const C_OUT = 43.5;

const Done: React.FC<{ at: number; children: React.ReactNode }> = ({ at, children }) => (
  <Reveal at={at} out={A_OUT} y={12}>
    <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 32, fontWeight: 600 }}>
      <span style={{ flex: "none", width: 38, height: 38, borderRadius: 99, display: "grid", placeItems: "center", backgroundImage: GRAD.bleu }}>
        <IconCheck size={22} color="#0b1a16" />
      </span>
      {children}
    </div>
  </Reveal>
);

const OTHERS = [
  { logo: "tools/chatgpt.png", at: 29.4 },
  { logo: "tools/claude.png", at: 29.7 },
  { logo: "tools/copilot.svg", at: 30.0 },
];

const Logos: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 18, marginTop: 34 }}>
      <Reveal at={24.6} out={C_OUT} y={20} scaleFrom={0.9}>
        <div
          style={{
            width: 130,
            height: 130,
            borderRadius: 36,
            background: "#FDFBF9",
            display: "grid",
            placeItems: "center",
            boxShadow: `0 30px 70px -24px ${C.bleu}`,
          }}
        >
          <Img src={staticFile("tools/gemini.png")} style={{ width: 84, height: 84, objectFit: "contain" }} />
        </div>
      </Reveal>
      {OTHERS.map((o, i) => {
        const p = interpolate(frame, [o.at * fps, (o.at + 0.7) * fps], [0, 1], { ...clamp, easing: EASE });
        const q = interpolate(frame, [C_OUT * fps, (C_OUT + 0.5) * fps], [0, 1], clamp);
        return (
          <div
            key={o.logo}
            style={{
              width: 84,
              height: 84,
              borderRadius: 24,
              background: "#FDFBF9",
              display: "grid",
              placeItems: "center",
              opacity: p * (1 - q) * 0.85,
              translate: `${(1 - p) * -60 * (i + 1)}px 0px`,
              scale: String(0.8 + 0.2 * p),
            }}
          >
            <Img src={staticFile(o.logo)} style={{ width: 52, height: 52, objectFit: "contain" }} />
          </div>
        );
      })}
    </div>
  );
};

export const Intro: React.FC = () => (
  <AbsoluteFill style={{ ...baseText }}>
    {/* A — rappel */}
    <div style={{ position: "absolute", left: SAFE_L, top: 230, width: 740 }}>
      <Reveal at={0.3} out={A_OUT}>
        <Eyebrow>Vous savez déjà…</Eyebrow>
      </Reveal>
      <div style={{ marginTop: 34, display: "flex", flexDirection: "column", gap: 18 }}>
        <Done at={1.6}>Ce qu'est l'IA générative</Done>
        <Done at={4.0}>Repérer les tâches où elle vous fait gagner du temps</Done>
      </div>
      <Reveal at={7.0} out={A_OUT} style={{ marginTop: 48 }}>
        <div style={{ fontSize: 56, fontWeight: 800, letterSpacing: "-0.04em" }}>
          Place à la <GradText>pratique</GradText> →
        </div>
      </Reveal>
    </div>

    {/* B — objectif */}
    <div style={{ position: "absolute", left: SAFE_L, top: 220, width: 740 }}>
      <Reveal at={11.9} out={B_OUT}>
        <Eyebrow>Première étape concrète</Eyebrow>
      </Reveal>
      <RiseLines
        at={12.0}
        out={B_OUT}
        style={{ marginTop: 28, fontSize: 70, fontWeight: 800, letterSpacing: "-0.045em", lineHeight: 1.02 }}
        lines={["Créer un compte", <GradText key="g">et prendre en main</GradText>, "l'interface"]}
      />
      <Reveal at={15.0} out={B_OUT} style={{ marginTop: 40 }}>
        <Glass glow={C.beige} style={{ padding: "20px 24px", borderRadius: 22, display: "flex", gap: 18, alignItems: "center" }}>
          <div style={{ flex: "none", width: 50, height: 50, borderRadius: 16, display: "grid", placeItems: "center", backgroundImage: GRAD.beige }}>
            <IconSparkle size={26} color="#140d1f" />
          </div>
          <div style={{ fontSize: 25, fontWeight: 600, lineHeight: 1.35 }}>
            Déjà utilisateur ? Restez : des <span style={{ color: C.beige }}>astuces utiles au quotidien</span> vous attendent.
          </div>
        </Glass>
      </Reveal>
    </div>

    {/* C — Gemini comme exemple */}
    <div style={{ position: "absolute", left: SAFE_L, top: 220, width: 740 }}>
      <Reveal at={24.1} out={C_OUT}>
        <Eyebrow color={C.bleu}>Notre démonstration</Eyebrow>
      </Reveal>
      <Reveal at={24.3} out={C_OUT} style={{ marginTop: 26 }}>
        <div style={{ fontSize: 66, fontWeight: 800, letterSpacing: "-0.045em", lineHeight: 1 }}>
          avec <GradText grad={GRAD.bleu}>Gemini</GradText>
        </div>
      </Reveal>
      <Logos />
      <Reveal at={29.1} out={C_OUT} style={{ marginTop: 30 }}>
        <div style={{ fontSize: 30, fontWeight: 600, lineHeight: 1.3 }}>
          Tous ces outils fonctionnent <span style={{ color: C.bleuVert }}>de la même manière</span>.
        </div>
      </Reveal>
      <Reveal at={33.1} out={C_OUT} style={{ marginTop: 8 }}>
        <div style={{ fontSize: 25, color: C.fg2, fontWeight: 500 }}>Vous ne serez pas perdu avec un autre modèle.</div>
      </Reveal>
      <Reveal at={36.0} out={C_OUT} y={12} style={{ marginTop: 28 }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 12,
            padding: "12px 22px 12px 14px",
            borderRadius: 999,
            border: `1px solid ${C.hairline2}`,
            background: "rgba(255,255,255,0.05)",
            fontSize: 23,
            fontWeight: 600,
          }}
        >
          <span style={{ color: C.violetLight, display: "flex" }}>
            <IconFileText size={24} />
          </span>
          Ressources & liens : dans le contenu écrit de la leçon
        </div>
      </Reveal>
    </div>
  </AbsoluteFill>
);
