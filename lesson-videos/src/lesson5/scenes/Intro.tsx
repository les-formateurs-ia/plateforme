import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { IconSparkle } from "../../components/icons";
import { Eyebrow, GradText, Reveal, RiseLines, baseText } from "../../components/ui";
import { C, GRAD, SAFE_L, clamp } from "../../theme";

// 0 → 20,7 s. Qu'est-ce qu'un prompt ?
const OUT = 20.1;
const TYPED = "Résume ce rapport en 5 points clés";

export const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const n = Math.floor(interpolate(frame, [14.2 * fps, 16.8 * fps], [0, TYPED.length], clamp));
  const caret = t > 13.6 && Math.floor(t * 2) % 2 === 0;
  return (
    <AbsoluteFill style={{ ...baseText }}>
      <div style={{ position: "absolute", left: SAFE_L, top: 200, width: 740 }}>
        <Reveal at={0.3} out={OUT}>
          <Eyebrow>Leçon · Rédiger ses prompts</Eyebrow>
        </Reveal>
        <RiseLines
          at={0.5}
          out={OUT}
          style={{ marginTop: 28, fontSize: 76, fontWeight: 800, letterSpacing: "-0.045em", lineHeight: 1.02 }}
          lines={["Les bases du", <GradText key="p">prompt engineering</GradText>]}
        />
        <Reveal at={8.3} out={OUT} style={{ marginTop: 34 }}>
          <div style={{ fontSize: 29, color: C.fg2, fontWeight: 500, lineHeight: 1.35 }}>
            La <span style={{ color: C.fg, fontWeight: 700 }}>qualité de la réponse</span> dépend de la manière dont vous vous adressez à l'IA.
          </div>
        </Reveal>
        <Reveal at={13.2} out={OUT} y={18} style={{ marginTop: 84 }}>
          <div style={{ position: "relative" }}>
            <div
              style={{
                height: 74,
                borderRadius: 999,
                border: "1.5px solid rgba(219,172,240,0.45)",
                background: "rgba(14,12,21,0.85)",
                boxShadow: "0 0 0 6px rgba(181,141,224,0.08)",
                display: "flex",
                alignItems: "center",
                gap: 16,
                padding: "0 14px 0 26px",
                fontSize: 26,
                fontWeight: 500,
              }}
            >
              <span style={{ color: C.violetLight, display: "flex" }}>
                <IconSparkle size={26} />
              </span>
              <span style={{ flex: 1 }}>
                {TYPED.slice(0, n)}
                <span style={{ opacity: caret ? 1 : 0, color: C.violetLight }}>|</span>
              </span>
              <span style={{ width: 50, height: 50, borderRadius: 99, backgroundImage: GRAD.violet }} />
            </div>
            <Reveal at={18.8} y={8} style={{ position: "absolute", left: 22, top: -50 }}>
              <span style={{ padding: "6px 16px", borderRadius: 999, backgroundImage: GRAD.violet, color: "#140d1f", fontSize: 22, fontWeight: 800 }}>
                = un prompt
              </span>
            </Reveal>
          </div>
        </Reveal>
      </div>
    </AbsoluteFill>
  );
};
