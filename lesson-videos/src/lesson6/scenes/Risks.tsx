import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { IconAlert, IconBrain, IconFileText, IconLock, IconSparkle, IconUser } from "../../components/icons";
import { Eyebrow, Glass, GradText, Reveal, RiseLines, baseText, useExit } from "../../components/ui";
import { C, EASE, GRAD, SAFE_L, clamp } from "../../theme";

// 142,7 → 182,1 s. Temps locaux = temps audio − 142,7.
const OUT = 38.85;
const B1 = { x: 1180, y: 300, at: 8.6 };
const B2 = { x: 1180, y: 620, at: 24.3 };
const HUB = { x: 1040, y: 560 }; // pastille "Votre prompt"

const Arrow: React.FC<{ to: { x: number; y: number; at: number } }> = ({ to }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = interpolate(frame, [to.at * fps, (to.at + 0.8) * fps], [0, 1], { ...clamp, easing: EASE });
  const q = useExit(OUT, 0.5);
  const x1 = HUB.x + 70;
  const y1 = HUB.y;
  const x2 = to.x - 12;
  const y2 = to.y + 70;
  const d = `M ${x1} ${y1} C ${x1 + 60} ${y1}, ${x2 - 60} ${y2}, ${x2} ${y2}`;
  const len = 260;
  return (
    <path d={d} fill="none" stroke={C.beige} strokeWidth={3} strokeLinecap="round" strokeDasharray={len} strokeDashoffset={len * (1 - p)} opacity={0.8 * (1 - q)} />
  );
};

const Step: React.FC<{ at: number; children: React.ReactNode }> = ({ at, children }) => (
  <Reveal at={at} y={8}>
    <div style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 22, fontWeight: 600, color: C.fg, lineHeight: 1.35 }}>
      <span style={{ color: C.beige }}>→</span>
      <span>{children}</span>
    </div>
  </Reveal>
);

export const Risks: React.FC = () => (
  <AbsoluteFill style={{ ...baseText }}>
    <div style={{ position: "absolute", left: 160, top: 110 }}>
      <Reveal at={0.1} out={OUT}>
        <Eyebrow color={C.beige}>Mais dans tout ça…</Eyebrow>
      </Reveal>
      <RiseLines
        at={0.3}
        out={OUT}
        style={{ marginTop: 16, fontSize: 58, fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1.04 }}
        lines={[
          <span key="t">
            Quel est le <GradText grad={GRAD.beige}>risque avec l'IA</GradText> ?
          </span>,
        ]}
      />
    </div>

    {/* le fichier sensible glissé dans un prompt */}
    <Reveal at={3.8} out={OUT} y={20} style={{ position: "absolute", left: SAFE_L, top: 420, width: 270 }}>
      <Glass glow={C.beige} style={{ padding: "26px 24px", borderRadius: 24, textAlign: "center" }}>
        <div style={{ display: "grid", placeItems: "center", color: C.beige }}>
          <IconFileText size={70} />
        </div>
        <div style={{ marginTop: 16, fontSize: 26, fontWeight: 800 }}>Fichier sensible</div>
        <div style={{ marginTop: 6, fontSize: 19, color: C.fg3, fontWeight: 600 }}>confidentiel ou personnel</div>
      </Glass>
    </Reveal>
    <Reveal at={4.6} out={OUT} y={0} style={{ position: "absolute", left: 905, top: HUB.y - 18 }}>
      <span style={{ fontSize: 30, color: C.fg3 }}>→</span>
    </Reveal>
    <Reveal at={4.8} out={OUT} y={10} style={{ position: "absolute", left: HUB.x - 70, top: HUB.y - 70 }}>
      <div style={{ width: 140, height: 140, borderRadius: 99, display: "grid", placeItems: "center", backgroundImage: GRAD.violet, textAlign: "center" }}>
        <div style={{ color: "#140d1f" }}>
          <IconSparkle size={36} color="#140d1f" />
          <div style={{ fontSize: 17, fontWeight: 800, marginTop: 4 }}>Votre prompt</div>
        </div>
      </div>
    </Reveal>

    <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
      <Arrow to={B1} />
      <Arrow to={B2} />
    </svg>

    {/* risque 1 : réentraînement */}
    <Reveal at={B1.at} out={OUT} y={16} style={{ position: "absolute", left: B1.x, top: B1.y, width: 640 }}>
      <Glass glow={C.beige} style={{ padding: "22px 26px", borderRadius: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ width: 46, height: 46, borderRadius: 14, display: "grid", placeItems: "center", background: "rgba(251,194,173,0.18)", color: C.beige }}>
            <IconBrain size={26} />
          </span>
          <span style={{ fontSize: 27, fontWeight: 800 }}>L'IA s'entraîne avec vos données</span>
        </div>
        <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
          <Step at={13.2}>Elles rejoignent sa base de données</Step>
          <Step at={19.6}>…puis peuvent être réutilisées, voire partagées</Step>
        </div>
        <Reveal at={23.2} y={8} style={{ marginTop: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ width: 34, height: 34, borderRadius: 99, display: "grid", placeItems: "center", background: "rgba(255,255,255,0.1)" }}>
              <IconUser size={20} color={C.fg2} />
            </span>
            <span style={{ padding: "8px 14px", borderRadius: "14px 14px 14px 4px", background: "rgba(255,255,255,0.07)", fontSize: 18, color: C.fg2 }}>
              Un autre utilisateur reçoit… <span style={{ color: C.beige, fontWeight: 700 }}>vos informations</span>
            </span>
          </div>
        </Reveal>
      </Glass>
    </Reveal>

    {/* risque 2 : serveur piraté */}
    <Reveal at={B2.at} out={OUT} y={16} style={{ position: "absolute", left: B2.x, top: B2.y, width: 640 }}>
      <Glass glow={C.beige} style={{ padding: "22px 26px", borderRadius: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ width: 46, height: 46, borderRadius: 14, display: "grid", placeItems: "center", background: "rgba(251,194,173,0.18)", color: C.beige }}>
            <IconLock size={26} />
          </span>
          <span style={{ fontSize: 27, fontWeight: 800 }}>Vos données sont stockées sur un serveur</span>
        </div>
        <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
          <Step at={29.0}>Un piratage informatique, et tout se retrouve entre d'autres mains</Step>
        </div>
        <div style={{ marginTop: 14, display: "flex", gap: 10, alignItems: "center" }}>
          <Reveal at={35.4} y={6}>
            <IconAlert size={24} color={C.beige} />
          </Reveal>
          {[
            { at: 35.5, l: "Usurpation" },
            { at: 36.3, l: "Chantage" },
            { at: 37.1, l: "Revente de données" },
          ].map((c) => (
            <Reveal key={c.l} at={c.at} y={6}>
              <span style={{ padding: "6px 14px", borderRadius: 999, border: "1px solid rgba(251,194,173,0.55)", background: "rgba(251,194,173,0.12)", color: C.beige, fontSize: 19, fontWeight: 800 }}>
                {c.l}
              </span>
            </Reveal>
          ))}
        </div>
      </Glass>
    </Reveal>
  </AbsoluteFill>
);
