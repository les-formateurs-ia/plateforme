import React from "react";
import { AbsoluteFill } from "remotion";
import { IconCheck, IconFileText, IconSparkle } from "../../components/icons";
import { Eyebrow, GradText, Reveal, RiseLines, baseText } from "../../components/ui";
import { C, GRAD, SAFE_L } from "../../theme";

// 247,8 → fin (269,55 s). Temps locaux = temps audio − 247,8.
const END = 21.75;
const A_OUT = 10.6;

const RECAP = ["Créer son compte", "Le menu latéral", "La barre de saisie", "Le bouton +", "Le sélecteur de modèle"];

export const Outro: React.FC = () => (
  <AbsoluteFill style={{ ...baseText }}>
    {/* A — récapitulatif */}
    <div style={{ position: "absolute", left: SAFE_L, top: 200, width: 760 }}>
      <Reveal at={0.2} out={A_OUT}>
        <Eyebrow color={C.bleuVert}>Et voilà !</Eyebrow>
      </Reveal>
      <RiseLines
        at={2.4}
        out={A_OUT}
        style={{ marginTop: 26, fontSize: 64, fontWeight: 800, letterSpacing: "-0.045em", lineHeight: 1.02 }}
        lines={["Une vue complète", <GradText key="i">de l'interface</GradText>]}
      />
      <div style={{ marginTop: 30, display: "flex", flexWrap: "wrap", gap: 10, maxWidth: 740 }}>
        {RECAP.map((r, i) => (
          <Reveal key={r} at={3.0 + i * 0.22} out={A_OUT} y={10}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 18px 8px 10px",
                borderRadius: 999,
                border: `1px solid ${C.hairline2}`,
                background: "rgba(255,255,255,0.04)",
                fontSize: 23,
                fontWeight: 600,
              }}
            >
              <span style={{ width: 28, height: 28, borderRadius: 99, display: "grid", placeItems: "center", backgroundImage: GRAD.bleu }}>
                <IconCheck size={17} color="#0b1a16" />
              </span>
              {r}
            </div>
          </Reveal>
        ))}
      </div>
    </div>

    {/* B — tester, le Studio, à vous de jouer */}
    <div style={{ position: "absolute", left: SAFE_L, top: 200, width: 760 }}>
      <Reveal at={10.8} out={END - 0.5}>
        <div style={{ fontSize: 44, fontWeight: 800, letterSpacing: "-0.035em", lineHeight: 1.08 }}>
          Testez tous ces modèles et <GradText>comparez leurs résultats</GradText>
        </div>
      </Reveal>
      <Reveal at={11.8} out={END - 0.5} y={14} style={{ marginTop: 30 }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 14,
            padding: "14px 24px 14px 14px",
            borderRadius: 22,
            border: "1px solid rgba(219,172,240,0.45)",
            background: "rgba(181,141,224,0.12)",
          }}
        >
          <span style={{ width: 48, height: 48, borderRadius: 14, display: "grid", placeItems: "center", backgroundImage: GRAD.violet }}>
            <IconSparkle size={26} color="#140d1f" />
          </span>
          <span>
            <span style={{ display: "block", fontSize: 26, fontWeight: 800 }}>Le Studio</span>
            <span style={{ display: "block", fontSize: 20, color: C.fg2, fontWeight: 500 }}>directement accessible dans votre parcours</span>
          </span>
        </div>
      </Reveal>
      <Reveal at={15.2} out={END - 0.5} style={{ marginTop: 22 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 24, color: C.fg2, fontWeight: 500 }}>
          <IconFileText size={24} color={C.fg3} /> Plus d'informations dans le reste de la leçon.
        </div>
      </Reveal>
      <RiseLines
        at={19.6}
        style={{ marginTop: 34, fontSize: 84, fontWeight: 800, letterSpacing: "-0.05em", lineHeight: 1 }}
        lines={[<GradText key="j">À vous de jouer !</GradText>]}
      />
    </div>
  </AbsoluteFill>
);
