import React from "react";
import { AbsoluteFill } from "remotion";
import { IconCompass, IconX, IconZap } from "../../components/icons";
import { Eyebrow, Glass, GradText, Reveal, RiseLines, baseText, useEnter } from "../../components/ui";
import { C, GRAD, SAFE_L } from "../../theme";

// 0 → 25,7 s. Par où commencer ? Deux pièges, puis la notion de quick win.
const Trap: React.FC<{ at: number; n: string; title: string; text: React.ReactNode; icon: React.ReactNode }> = ({
  at,
  n,
  title,
  text,
  icon,
}) => (
  <Reveal at={at} out={15.6} y={18}>
    <Glass glow={C.beige} style={{ padding: "26px 30px", borderRadius: 26, display: "flex", gap: 24, alignItems: "center" }}>
      <div
        style={{
          flex: "none",
          width: 64,
          height: 64,
          borderRadius: 18,
          display: "grid",
          placeItems: "center",
          border: "1px solid rgba(251,194,173,0.45)",
          background: "rgba(251,194,173,0.1)",
          color: C.beige,
        }}
      >
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: C.beige }}>
          Piège {n}
        </div>
        <div style={{ marginTop: 6, fontSize: 36, fontWeight: 700, letterSpacing: "-0.01em" }}>{title}</div>
        <div style={{ marginTop: 6, fontSize: 27, color: C.fg2, fontWeight: 500 }}>{text}</div>
      </div>
    </Glass>
  </Reveal>
);

export const Intro: React.FC = () => {
  const strike = useEnter(12.0, 0.6);
  return (
    <AbsoluteFill style={{ ...baseText }}>
      {/* A — par où commencer ? */}
      <div style={{ position: "absolute", left: SAFE_L, top: 240, width: 720 }}>
        <Reveal at={0.3} out={6.9}>
          <Eyebrow>Analyser son poste</Eyebrow>
        </Reveal>
        <Reveal at={0.8} out={6.9} style={{ marginTop: 34 }}>
          <div style={{ fontSize: 31, color: C.fg2, fontWeight: 500, lineHeight: 1.3 }}>
            Vous savez ce que l'IA générative sait faire.
          </div>
        </Reveal>
        <RiseLines
          at={4.5}
          out={6.9}
          style={{ marginTop: 26, fontSize: 80, fontWeight: 800, letterSpacing: "-0.045em", lineHeight: 1.02 }}
          lines={["Par où commencer", <GradText key="p">sur votre poste ?</GradText>]}
        />
      </div>

      {/* B — deux pièges */}
      <div style={{ position: "absolute", left: SAFE_L, top: 200, width: 700 }}>
        <Reveal at={7.3} out={15.6}>
          <Eyebrow color={C.beige}>Sans méthode, deux pièges</Eyebrow>
        </Reveal>
        <div style={{ marginTop: 34, display: "flex", flexDirection: "column", gap: 18 }}>
          <Trap
            at={9.7}
            n="1"
            title="Essayer un peu partout"
            icon={<IconCompass size={32} />}
            text={
              <span>
                …sans jamais{" "}
                <span style={{ position: "relative", color: C.fg }}>
                  mesurer les résultats
                  <span
                    style={{
                      position: "absolute",
                      left: 0,
                      bottom: -4,
                      height: 3,
                      width: `${strike * 100}%`,
                      borderRadius: 2,
                      background: C.beige,
                    }}
                  />
                </span>
              </span>
            }
          />
          <Trap at={13.6} n="2" title="Ignorer de bonnes pistes" icon={<IconX size={32} />} text="…et passer à côté de vrais gains" />
        </div>
      </div>

      {/* C — comment trancher : le quick win */}
      <div style={{ position: "absolute", left: SAFE_L, top: 230, width: 700 }}>
        <RiseLines
          at={16.1}
          out={25.1}
          style={{ fontSize: 54, fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1.06 }}
          lines={[
            "Comment l'IA peut-elle",
            <span key="m">
              vous servir <GradText>concrètement</GradText> ?
            </span>,
          ]}
        />
        <Reveal at={21.0} out={25.1} style={{ marginTop: 50 }}>
          <div style={{ fontSize: 32, color: C.fg2, fontWeight: 500 }}>Pour trancher, une notion simple :</div>
        </Reveal>
        <Reveal at={22.6} out={25.1} y={30} blur={14} scaleFrom={0.92} style={{ marginTop: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 26 }}>
            <div
              style={{
                width: 96,
                height: 96,
                borderRadius: 28,
                display: "grid",
                placeItems: "center",
                backgroundImage: GRAD.violet,
              }}
            >
              <IconZap size={54} color="#140d1f" />
            </div>
            <div style={{ fontSize: 108, fontWeight: 800, letterSpacing: "-0.05em", lineHeight: 1 }}>
              <GradText>Quick win</GradText>
            </div>
          </div>
        </Reveal>
      </div>
    </AbsoluteFill>
  );
};
