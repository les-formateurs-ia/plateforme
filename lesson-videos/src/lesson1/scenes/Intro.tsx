import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { Eyebrow, GradText, Reveal, RiseLines, baseText, useEnter } from "../../components/ui";
import { C, GRAD, SAFE_L, clamp } from "../../theme";

// 0 → 36 s : accueil, promesse, programme de la formation.
const AGENDA = [
  { at: 21.87, n: "01", label: "Définir l'IA générative" },
  { at: 23.44, n: "02", label: "Comprendre son fonctionnement" },
  { at: 25.81, n: "03", label: "Identifier ses limites" },
  { at: 27.73, n: "04", label: "Passer en revue les outils majeurs" },
  { at: 29.64, n: "05", label: "Découvrir des cas d'usage concrets" },
];

const Chip: React.FC<{ at: number; label: string; grad: string; out: number }> = ({ at, label, grad, out }) => (
  <Reveal at={at} out={out} y={16}>
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 16,
        padding: "14px 26px 14px 20px",
        borderRadius: 999,
        border: `1px solid ${C.hairline2}`,
        background: "rgba(255,255,255,0.05)",
        fontSize: 32,
        fontWeight: 600,
      }}
    >
      <span style={{ width: 14, height: 14, borderRadius: 99, backgroundImage: grad }} />
      {label}
    </div>
  </Reveal>
);

export const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const focus = useEnter(33.9, 0.9); // "le premier chapitre"

  return (
    <AbsoluteFill style={{ ...baseText }}>
      {/* Phase A — accueil (0 → 15,3 s) */}
      <div style={{ position: "absolute", left: SAFE_L, top: 220, width: 720 }}>
        <Reveal at={0.4} out={15.0}>
          <Eyebrow>Leçon 1 · Formation à l'IA générative</Eyebrow>
        </Reveal>
        <RiseLines
          at={0.7}
          out={15.0}
          style={{ marginTop: 36, fontSize: 88, fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 0.98 }}
          lines={["Bienvenue dans", <GradText key="g">l'IA générative</GradText>]}
        />
        <Reveal at={7.4} out={15.0} style={{ marginTop: 44 }}>
          <div style={{ fontSize: 34, color: C.fg2, fontWeight: 500, lineHeight: 1.3, maxWidth: 700 }}>
            Elle s'est installée sur nos postes de travail et transforme notre façon de…
          </div>
        </Reveal>
        <div style={{ display: "flex", gap: 14, marginTop: 30 }}>
          <Chip at={12.5} out={15.0} label="Rédiger" grad={GRAD.violet} />
          <Chip at={13.1} out={15.0} label="Analyser" grad={GRAD.bleu} />
          <Chip at={14.4} out={15.0} label="Concevoir" grad={GRAD.beige} />
        </div>
      </div>

      {/* Phase B — "partir de zéro" (15,4 → 21 s) */}
      <div style={{ position: "absolute", left: SAFE_L, top: 300, width: 720 }}>
        <Reveal at={15.5} out={20.9}>
          <div style={{ fontSize: 38, color: C.fg2, fontWeight: 500 }}>Débutant ou simplement curieux ?</div>
        </Reveal>
        <RiseLines
          at={17.6}
          out={20.9}
          style={{ marginTop: 26, fontSize: 128, fontWeight: 800, letterSpacing: "-0.045em", lineHeight: 0.96 }}
          lines={["On part", <GradText key="z">de zéro.</GradText>]}
        />
      </div>

      {/* Phase C — programme (21,2 → 36 s) */}
      <div style={{ position: "absolute", left: SAFE_L, top: 190, width: 700 }}>
        <Reveal at={21.2} out={35.6}>
          <Eyebrow color={C.bleu}>Au programme</Eyebrow>
        </Reveal>
        <div style={{ marginTop: 32, display: "flex", flexDirection: "column", gap: 12 }}>
          {AGENDA.map((a, i) => {
            const p = interpolate(frame, [a.at * fps, (a.at + 0.7) * fps], [0, 1], clamp);
            const isFirst = i === 0;
            const dim = isFirst ? 0 : focus * 0.6;
            return (
              <Reveal key={a.n} at={a.at - 0.1} out={35.6} y={18}>
                <div
                  style={{
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    gap: 30,
                    padding: "18px 26px",
                    borderRadius: 24,
                    border: `1px solid ${isFirst && focus > 0 ? `rgba(219,172,240,${0.14 + focus * 0.5})` : C.hairline}`,
                    background: isFirst
                      ? `rgba(181,141,224,${0.04 + focus * 0.12})`
                      : "rgba(255,255,255,0.03)",
                    opacity: 1 - dim,
                    scale: String(isFirst ? 1 + focus * 0.02 : 1),
                  }}
                >
                  <span
                    style={{
                      fontSize: 26,
                      fontWeight: 700,
                      color: C.fg3,
                      fontVariantNumeric: "tabular-nums",
                      width: 44,
                    }}
                  >
                    {a.n}
                  </span>
                  <span style={{ fontSize: 34, fontWeight: 600, letterSpacing: "-0.01em" }}>{a.label}</span>
                  <span
                    style={{
                      position: "absolute",
                      left: 0,
                      bottom: 0,
                      height: 2,
                      width: `${p * 100}%`,
                      backgroundImage: GRAD.iris,
                      opacity: 0.5 * (1 - interpolate(t, [a.at + 0.7, a.at + 1.6], [0, 1], clamp)),
                    }}
                  />
                </div>
              </Reveal>
            );
          })}
        </div>
        <Reveal at={33.9} out={35.6} y={12}>
          <div style={{ marginTop: 26, fontSize: 30, fontWeight: 500, color: C.violetLight }}>
            → On commence tout de suite par le chapitre 1
          </div>
        </Reveal>
      </div>
    </AbsoluteFill>
  );
};
