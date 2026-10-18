import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Cursor } from "../../components/Cursor";
import { IconBrain, IconCalendar, IconCode, IconSparkle, IconTable, IconTrendUp, IconUser } from "../../components/icons";
import { GradText, Logo, Reveal, baseText, useEnter, useExit } from "../../components/ui";
import { C, EASE, GRAD, clamp } from "../../theme";
import { TOOLS } from "../../lesson1/tools";

// 238,8 → 248 s. Temps locaux = temps audio − 238,8.
// L'onglet Hub IA de notre plateforme (même menu que l'app).
const OUT = 8.65;
const PANEL = { x: 620, y: 200, w: 1200, h: 680 };
const SIDE = 300;

const NAV = [
  { label: "Tableau de bord", icon: <IconTrendUp size={22} /> },
  { label: "Mes leçons", icon: <IconTable size={22} /> },
  { label: "Exercez-vous !", icon: <IconCode size={22} /> },
  { label: "Le Studio", icon: <IconSparkle size={22} /> },
  { label: "Hub IA", icon: <IconTable size={22} />, hub: true },
  { label: "Mon Agent IA", icon: <IconBrain size={22} /> },
  { label: "Rendez-vous", icon: <IconCalendar size={22} /> },
  { label: "Mon profil", icon: <IconUser size={22} /> },
];
const NAV_Y0 = 110;
const NAV_H = 56;
const CLICK = 2.3;

export const Hub: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = interpolate(frame, [0, 0.7 * fps], [0, 1], { ...clamp, easing: EASE });
  const q = useExit(OUT, 0.5);
  const active = useEnter(CLICK, 0.4);
  const page = useEnter(CLICK + 0.3, 0.7);
  const hub = { x: PANEL.x + 150, y: PANEL.y + NAV_Y0 + 4 * NAV_H + 24 };

  return (
    <AbsoluteFill style={{ ...baseText }}>
      <div
        style={{
          position: "absolute",
          left: PANEL.x,
          top: PANEL.y,
          width: PANEL.w,
          height: PANEL.h,
          borderRadius: 24,
          overflow: "hidden",
          background: "#0A0A10",
          border: `1px solid ${C.hairline2}`,
          boxShadow: "0 50px 120px -40px rgba(0,0,0,0.9)",
          opacity: p * (1 - q),
          transform: `perspective(1800px) rotateX(${(1 - p) * 8}deg)`,
        }}
      >
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: SIDE, background: "#0C0C13", borderRight: "1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ position: "absolute", left: 28, top: 32 }}>
            <Logo h={30} />
          </div>
          {NAV.map((n, i) => {
            const on = n.hub ? active : 0;
            return (
              <div
                key={n.label}
                style={{
                  position: "absolute",
                  left: 16,
                  right: 16,
                  top: NAV_Y0 + i * NAV_H,
                  height: 46,
                  borderRadius: 999,
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "0 18px",
                  fontSize: 20,
                  fontWeight: 600,
                  color: on > 0.5 ? "#140d1f" : "rgba(255,255,255,0.55)",
                  background: on > 0 ? `rgba(219,172,240,${on})` : "transparent",
                }}
              >
                <span style={{ display: "flex" }}>{n.icon}</span>
                {n.label}
              </div>
            );
          })}
        </div>
        <div style={{ position: "absolute", left: SIDE + 40, right: 40, top: 40, opacity: page, translate: `0px ${(1 - page) * 14}px` }}>
          <div style={{ fontSize: 40, fontWeight: 800, letterSpacing: "-0.03em" }}>
            Hub <GradText>IA</GradText>
          </div>
          <div style={{ marginTop: 8, fontSize: 21, color: C.fg2, fontWeight: 500 }}>Comparez et testez l'ensemble des modèles existants.</div>
          <div style={{ marginTop: 26, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
            {TOOLS.slice(0, 3).map((t, i) => {
              const cp = interpolate(frame, [(CLICK + 0.5 + i * 0.12) * fps, (CLICK + 1.1 + i * 0.12) * fps], [0, 1], { ...clamp, easing: EASE });
              return (
                <div
                  key={t.id}
                  style={{
                    padding: 20,
                    borderRadius: 20,
                    background: "rgba(255,255,255,0.04)",
                    border: `1px solid ${C.hairline2}`,
                    opacity: cp,
                    translate: `0px ${(1 - cp) * 16}px`,
                  }}
                >
                  <div style={{ width: 54, height: 54, borderRadius: 16, background: t.logoBg, display: "grid", placeItems: "center" }}>
                    <Img src={staticFile(t.logo)} style={{ width: 36, height: 36, objectFit: "contain" }} />
                  </div>
                  <div style={{ marginTop: 14, fontSize: 24, fontWeight: 700 }}>{t.name}</div>
                  <div style={{ marginTop: 14, display: "flex", gap: 8 }}>
                    <Reveal at={5.8} y={6}>
                      <span style={{ padding: "6px 14px", borderRadius: 999, background: "rgba(255,255,255,0.08)", fontSize: 16, fontWeight: 700 }}>Comparer</span>
                    </Reveal>
                    <Reveal at={6.5} y={6}>
                      <span style={{ padding: "6px 14px", borderRadius: 999, backgroundImage: GRAD.violet, color: "#140d1f", fontSize: 16, fontWeight: 700 }}>Tester</span>
                    </Reveal>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div style={{ position: "absolute", left: 160, top: 100 }}>
        <Reveal at={0.2} out={OUT}>
          <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: C.fg3 }}>Sur la plateforme</div>
        </Reveal>
        <Reveal at={0.4} out={OUT} style={{ marginTop: 8 }}>
          <div style={{ fontSize: 52, fontWeight: 800, letterSpacing: "-0.04em" }}>
            L'onglet <GradText>Hub IA</GradText>
          </div>
        </Reveal>
      </div>

      <Cursor
        from={0.8}
        to={OUT}
        keys={[
          { t: 0.8, x: PANEL.x + 600, y: PANEL.y + 300 },
          { t: 2.0, ...hub },
          { t: CLICK, ...hub, click: true },
          { t: 4.6, ...hub },
          { t: 5.6, x: PANEL.x + SIDE + 120, y: PANEL.y + 400 },
          { t: OUT, x: PANEL.x + SIDE + 120, y: PANEL.y + 400 },
        ]}
      />
    </AbsoluteFill>
  );
};
