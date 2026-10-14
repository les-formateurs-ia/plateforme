import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { IconBrain } from "../../components/icons";
import { Eyebrow, GradText, Glass, Reveal, RiseLines, baseText } from "../../components/ui";
import { C, EASE, GRAD, SAFE_L, clamp } from "../../theme";

// 139,8 → 173,3 s. Temps locaux = temps audio − 139,8.
const OUT = 32.9;
const SLOT_X = 1150;
const SENT_Y = 470; // centre vertical de la phrase
const ROW0 = 610;
const ROW_H = 92;

const CANDS = [
  { w: "souris", pct: 85, at: 18.5, color: C.violetLight },
  { w: "croquette", pct: 8, at: 21.7, color: C.bleu },
  { w: "gamelle", pct: 5, at: 23.5, color: C.bleuVert },
  { w: "pomme", pct: 2, at: 24.8, color: C.beige },
];
const PICK = 30.2;
const WORDS = [
  { w: "Le", at: 11.1 },
  { w: "chat", at: 11.35 },
  { w: "mange", at: 11.7 },
  { w: "une", at: 11.95 },
];

export const NextToken: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const best = interpolate(frame, [25.8 * fps, 26.6 * fps], [0, 1], { ...clamp, easing: EASE });
  const pick = interpolate(frame, [PICK * fps, (PICK + 1.0) * fps], [0, 1], { ...clamp, easing: EASE });
  const done = interpolate(frame, [(PICK + 0.8) * fps, (PICK + 1.4) * fps], [0, 1], clamp);
  const out = interpolate(frame, [OUT * fps, (OUT + 0.5) * fps], [0, 1], clamp);

  return (
    <AbsoluteFill style={{ ...baseText, opacity: 1 - out, filter: `blur(${out * 6}px)` }}>
      <div style={{ position: "absolute", left: 160, top: 170 }}>
        <Reveal at={0.3}>
          <Eyebrow>Générer du texte</Eyebrow>
        </Reveal>
        <RiseLines
          at={0.5}
          style={{ marginTop: 26, fontSize: 84, fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1 }}
          lines={[
            <span key="t">
              Prédire le <GradText>mot suivant</GradText>
            </span>,
          ]}
        />
      </div>

      {/* phrase à compléter, alignée à droite contre l'emplacement vide */}
      <div
        style={{
          position: "absolute",
          right: 1920 - SLOT_X + 26,
          top: SENT_Y - 56,
          display: "flex",
          gap: 26,
          fontSize: 96,
          fontWeight: 800,
          letterSpacing: "-0.035em",
          lineHeight: "112px",
        }}
      >
        {WORDS.map((w) => (
          <Reveal key={w.w} at={w.at} y={20}>
            {w.w}
          </Reveal>
        ))}
      </div>

      {/* emplacement du mot à prédire */}
      <Reveal at={12.3} y={0} style={{ position: "absolute", left: SLOT_X, top: SENT_Y - 62 }}>
        <div
          style={{
            position: "relative",
            width: 560,
            height: 124,
            borderRadius: 26,
            border: `2px ${pick > 0.5 ? "solid" : "dashed"} ${pick > 0.5 ? C.violetLight : "rgba(255,255,255,0.28)"}`,
            background: `rgba(181,141,224,${0.04 + done * 0.1})`,
            boxShadow: `0 0 ${done * 70}px ${C.violet}77`,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 28,
              top: 0,
              lineHeight: "120px",
              fontSize: 96,
              fontWeight: 800,
              color: C.fg3,
              opacity: (1 - pick) * (0.5 + Math.sin(t * 4) * 0.3),
            }}
          >
            ?
          </div>
        </div>
      </Reveal>

      {/* candidats */}
      <Reveal at={15.6} y={16} style={{ position: "absolute", left: SLOT_X - 30, top: ROW0 - 70 }}>
        <div style={{ fontSize: 24, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: C.fg3, paddingLeft: 58, opacity: 1 - pick }}>
          Probabilité du mot suivant
        </div>
      </Reveal>
      {CANDS.map((c, i) => {
        const p = interpolate(frame, [c.at * fps, (c.at + 1.2) * fps], [0, 1], { ...clamp, easing: EASE });
        const rowY = ROW0 + i * ROW_H;
        const isBest = i === 0;
        const dim = isBest ? 0 : best * 0.6;
        const lift = isBest ? pick * (rowY - SENT_Y - 6) : 0;
        const fadeOthers = isBest ? 0 : pick;
        return (
          <Reveal key={c.w} at={c.at - 0.2} y={16} style={{ position: "absolute", left: SLOT_X, top: rowY - 40, width: 600 }}>
            <div style={{ opacity: (1 - dim) * (1 - fadeOthers) }}>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", paddingLeft: 28 }}>
                <div
                  style={{
                    translate: `0px ${-lift}px`,
                    scale: String(1 + pick * (96 / 52 - 1)),
                    transformOrigin: "left center",
                    fontSize: 52,
                    fontWeight: 800,
                    letterSpacing: "-0.03em",
                    color: isBest && best > 0 ? C.fg : C.fg2,
                  }}
                >
                  {isBest && done > 0 ? <GradText>{c.w}.</GradText> : c.w}
                </div>
                <div
                  style={{
                    fontSize: 40,
                    fontWeight: 700,
                    fontVariantNumeric: "tabular-nums",
                    color: isBest ? C.violetLight : C.fg2,
                    opacity: 1 - pick,
                  }}
                >
                  {Math.round(c.pct * p)} %
                </div>
              </div>
              <div style={{ marginTop: 10, marginLeft: 28, height: 10, borderRadius: 6, background: "rgba(255,255,255,0.08)", opacity: 1 - pick }}>
                <div
                  style={{
                    width: `${c.pct * p}%`,
                    minWidth: p > 0 ? 10 : 0,
                    height: "100%",
                    borderRadius: 6,
                    background: c.color,
                    boxShadow: isBest ? `0 0 ${18 + best * 20}px ${C.violet}` : "none",
                  }}
                />
              </div>
            </div>
          </Reveal>
        );
      })}

      {/* aparté : l'IA ne comprend pas, elle calcule */}
      <Reveal at={12.6} style={{ position: "absolute", left: SAFE_L, top: 600, width: 500 }}>
        <Glass style={{ padding: "28px 30px", borderRadius: 26 }}>
          <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
            <div
              style={{
                flex: "none",
                width: 64,
                height: 64,
                borderRadius: 18,
                display: "grid",
                placeItems: "center",
                backgroundImage: GRAD.violet,
              }}
            >
              <IconBrain size={34} color="#140d1f" />
            </div>
            <div>
              <div style={{ fontSize: 32, fontWeight: 700, lineHeight: 1.2 }}>L'IA ne sait pas ce qu'est un chat.</div>
              <Reveal at={15.6} y={10} style={{ marginTop: 14 }}>
                <div style={{ fontSize: 26, color: C.fg2, fontWeight: 500, lineHeight: 1.35 }}>
                  Elle calcule, d'après ses données, quel mot a le plus de chances d'apparaître.
                </div>
              </Reveal>
            </div>
          </div>
        </Glass>
      </Reveal>
      <Reveal at={26.0} style={{ position: "absolute", left: SAFE_L, top: 905, width: 520 }}>
        <div style={{ fontSize: 28, fontWeight: 600, color: C.fg, lineHeight: 1.3 }}>
          → Elle choisit le chemin <GradText>le plus probable</GradText>.
        </div>
      </Reveal>
    </AbsoluteFill>
  );
};
