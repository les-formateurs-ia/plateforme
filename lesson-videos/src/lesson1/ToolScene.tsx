import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Glass, Reveal, baseText, useEnter, useExit } from "../components/ui";
import { C, EASE, clamp } from "../theme";
import { TOOLS, type Tool } from "./tools";

export type ToolSceneProps = {
  toolId: string;
  // instants (s, temps local) où chaque ligne de la fiche apparaît — calés
  // sur la voix off.
  rowsAt: number[];
  out: number; // instant de sortie (s)
};

const Rail: React.FC<{ active: number }> = ({ active }) => {
  const p = useEnter(0.1, 0.7);
  return (
    <div
      style={{
        position: "absolute",
        top: 132,
        left: 600,
        right: 96,
        display: "flex",
        justifyContent: "center",
        gap: 14,
        opacity: p,
      }}
    >
      {TOOLS.map((t, i) => {
        const on = i === active;
        const done = i < active;
        return (
          <div
            key={t.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "10px 20px 10px 10px",
              borderRadius: 999,
              border: `1px solid ${on ? `${t.accent}88` : C.hairline}`,
              background: on ? `${t.accent}1f` : "rgba(255,255,255,0.03)",
              color: on ? C.fg : done ? C.fg2 : C.fg3,
              fontSize: 22,
              fontWeight: 600,
            }}
          >
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                background: t.logoBg,
                display: "grid",
                placeItems: "center",
                opacity: on ? 1 : 0.55,
              }}
            >
              <Img src={staticFile(t.logo)} style={{ width: 22, height: 22, objectFit: "contain" }} />
            </div>
            {t.name}
          </div>
        );
      })}
    </div>
  );
};

export const ToolScene: React.FC<ToolSceneProps> = ({ toolId, rowsAt, out }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const idx = TOOLS.findIndex((t) => t.id === toolId);
  const tool: Tool = TOOLS[idx];

  // Entrée 3D : la fiche pivote depuis la droite, sortie vers la gauche —
  // l'enchaînement des 5 outils se lit comme un carrousel.
  const enter = interpolate(frame, [0.15 * fps, 1.25 * fps], [0, 1], { ...clamp, easing: EASE });
  const exit = useExit(out, 0.6);
  const rotY = (1 - enter) * -28 + exit * 24;
  const tx = (1 - enter) * 260 - exit * 220;

  const logoIn = useEnter(0.55, 0.9);
  const t = frame / fps;
  // NB : pas d'oscillation continue ici — ce passage est accéléré par le
  // remappage du temps (cf. timeline.ts), elle deviendrait un tremblement.

  return (
    <AbsoluteFill style={{ ...baseText }}>
      <Rail active={idx} />
      <AbsoluteFill style={{ perspective: 1800, perspectiveOrigin: "63% 45%" }}>
        <div
          style={{
            position: "absolute",
            left: 600,
            top: 250,
            width: 1224,
            height: 700,
            transformStyle: "preserve-3d",
            rotate: `y ${rotY}deg`,
            translate: `${tx}px 0px`,
            opacity: enter * (1 - exit),
            filter: `blur(${(1 - enter) * 8 + exit * 8}px)`,
          }}
        >
          <Glass glow={tool.accent} style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
            {/* lueur de l'accent de l'outil */}
            <div
              style={{
                position: "absolute",
                width: 900,
                height: 900,
                left: -320,
                top: -420,
                borderRadius: "50%",
                background: `radial-gradient(circle, ${tool.accent}33, transparent 62%)`,
              }}
            />
            {/* colonne gauche : identité */}
            <div style={{ position: "absolute", left: 56, top: 72, width: 300 }}>
              <div
                style={{
                  width: 124,
                  height: 124,
                  borderRadius: 34,
                  background: tool.logoBg,
                  display: "grid",
                  placeItems: "center",
                  boxShadow: `0 24px 60px -18px ${tool.accent}aa, inset 0 -2px 0 rgba(0,0,0,0.06)`,
                  scale: String(0.86 + 0.14 * logoIn),
                  rotate: `${(1 - logoIn) * -8}deg`,
                  opacity: logoIn,
                }}
              >
                <Img src={staticFile(tool.logo)} style={{ width: 72, height: 72, objectFit: "contain" }} />
              </div>
              <Reveal at={0.7} style={{ marginTop: 44 }}>
                <div style={{ fontSize: 64, fontWeight: 800, letterSpacing: "-0.035em", lineHeight: 0.95 }}>
                  {tool.name}
                </div>
              </Reveal>
              <Reveal at={0.9}>
                <div style={{ marginTop: 22, fontSize: 26, color: C.fg3, fontWeight: 500 }}>
                  Outil {idx + 1} sur {TOOLS.length}
                </div>
              </Reveal>
            </div>

            {/* colonne droite : la fiche */}
            <div style={{ position: "absolute", left: 360, top: 64, right: 44, bottom: 64 }}>
              {tool.rows.map((r, i) => {
                const p = interpolate(frame, [rowsAt[i] * fps, (rowsAt[i] + 0.8) * fps], [0, 1], {
                  ...clamp,
                  easing: EASE,
                });
                // la ligne "active" est celle dont parle la voix off, jusqu'à
                // l'apparition suivante (l'ordre de la voix off peut différer
                // de l'ordre des lignes, cf. Gemini)
                const next = Math.min(out, ...rowsAt.filter((x) => x > rowsAt[i]));
                const active = t >= rowsAt[i] && t < next;
                const hl = interpolate(
                  frame,
                  [rowsAt[i] * fps, (rowsAt[i] + 0.5) * fps, next * fps, (next + 0.5) * fps],
                  [0, 1, 1, 0],
                  clamp,
                );
                return (
                  <div
                    key={r.label}
                    style={{
                      position: "relative",
                      display: "grid",
                      gridTemplateColumns: "170px 1fr",
                      alignItems: "center",
                      gap: 28,
                      height: 143,
                      padding: "0 32px",
                      borderTop: i === 0 ? "none" : `1px solid ${C.hairline}`,
                      opacity: p,
                      translate: `${(1 - p) * 40}px 0px`,
                      filter: `blur(${(1 - p) * 6}px)`,
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        inset: "10px 0",
                        borderRadius: 20,
                        background: `linear-gradient(90deg, ${tool.accent}22, ${tool.accent}05)`,
                        opacity: hl,
                      }}
                    />
                    <div
                      style={{
                        position: "relative",
                        fontSize: 20,
                        fontWeight: 600,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        color: active ? tool.accent : C.fg3,
                      }}
                    >
                      {r.label}
                    </div>
                    <div
                      style={{
                        position: "relative",
                        fontSize: 30,
                        lineHeight: 1.28,
                        fontWeight: 500,
                        color: active ? C.fg : C.fg2,
                        textWrap: "balance",
                      }}
                    >
                      {r.value}
                    </div>
                  </div>
                );
              })}
            </div>
          </Glass>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
