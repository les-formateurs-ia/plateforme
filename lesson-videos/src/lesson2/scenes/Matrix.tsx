import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { IconCalendar, IconCheck, IconTarget, IconTrendUp, IconX, IconZap } from "../../components/icons";
import { Eyebrow, GradText, Reveal, baseText, useEnter, useExit } from "../../components/ui";
import { C, EASE, GRAD, clamp } from "../../theme";

// 25,5 → 76 s. Temps locaux = temps audio − 25,5.
// Matrice valeur ajoutée × facilité de mise en œuvre, posée en 3D ; chaque
// quadrant s'allume quand la voix off en parle, le panneau de droite détaille.
const OUT = 49.95;

type Quad = {
  id: string;
  label: string;
  col: 0 | 1; // 0 = difficile, 1 = facile
  row: 0 | 1; // 0 = forte valeur (haut), 1 = faible valeur (bas)
  from: number;
  to: number;
  color: string;
};
const QUADS: Quad[] = [
  { id: "fbi", label: "Fausses bonnes idées", col: 0, row: 1, from: 8.4, to: 17.8, color: C.beige },
  { id: "am", label: "Actions majeures", col: 0, row: 0, from: 17.8, to: 25.7, color: C.violetLight },
  { id: "amin", label: "Actions mineures", col: 1, row: 1, from: 25.7, to: 33.5, color: C.bleu },
  { id: "qw", label: "Quick win", col: 1, row: 0, from: 33.5, to: 999, color: C.bleuVert },
];

const CW = 280;
const CH = 210;
const GAP = 12;

const Plane: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const p = interpolate(frame, [0.2 * fps, 1.8 * fps], [0, 1], { ...clamp, easing: EASE });
  const q = useExit(OUT, 0.5);
  const yLabel = useEnter(3.4, 0.7);
  const xLabel = useEnter(5.2, 0.7);
  const pre = interpolate(t, [8.0, 8.6], [1, 0], clamp);
  const rx = 52 * (1 - p) + 10 + Math.sin(t * 0.35) * 1.5;
  const ry = -26 * (1 - p) - 12 + Math.sin(t * 0.28) * 2;

  return (
    <div style={{ position: "absolute", left: 700, top: 250, perspective: 1700 }}>
      <div
        style={{
          position: "relative",
          width: 2 * CW + GAP + 40,
          height: 2 * CH + GAP + 40,
          transformStyle: "preserve-3d",
          transform: `rotateX(${rx}deg) rotateY(${ry}deg) translateZ(${-120 * (1 - p)}px)`,
        }}
      >
        {/* axes */}
        <div style={{ position: "absolute", left: 0, top: -30, width: 3, height: 2 * CH + GAP + 50, borderRadius: 2, background: C.fg2, opacity: p * (1 - q) }} />
        <div style={{ position: "absolute", left: -7, top: -36, width: 0, height: 0, borderLeft: "8px solid transparent", borderRight: "8px solid transparent", borderBottom: `14px solid ${C.fg2}`, opacity: p * (1 - q) }} />
        <div style={{ position: "absolute", left: 0, top: 2 * CH + GAP + 18, height: 3, width: 2 * CW + GAP + 70, borderRadius: 2, background: C.fg2, opacity: p * (1 - q) }} />
        <div style={{ position: "absolute", left: 2 * CW + GAP + 70, top: 2 * CH + GAP + 12, width: 0, height: 0, borderTop: "8px solid transparent", borderBottom: "8px solid transparent", borderLeft: `14px solid ${C.fg2}`, opacity: p * (1 - q) }} />
        <div
          style={{
            position: "absolute",
            left: 18,
            top: -64,
            fontSize: 26,
            fontWeight: 700,
            whiteSpace: "nowrap",
            opacity: yLabel * (1 - q),
            translate: `0px ${(1 - yLabel) * 10}px`,
          }}
        >
          <span style={{ color: C.violetLight }}>↑</span> Valeur ajoutée
        </div>
        <div
          style={{
            position: "absolute",
            right: -70,
            top: 2 * CH + GAP + 34,
            fontSize: 26,
            fontWeight: 700,
            whiteSpace: "nowrap",
            textAlign: "right",
            opacity: xLabel * (1 - q),
            translate: `${(1 - xLabel) * -10}px 0px`,
          }}
        >
          Facilité de mise en œuvre <span style={{ color: C.bleu }}>→</span>
        </div>

        {QUADS.map((qd, i) => {
          const isQW = qd.id === "qw";
          const lit = isQW
            ? interpolate(t, [qd.from, qd.from + 0.7], [0, 1], { ...clamp, easing: EASE })
            : interpolate(t, [qd.from, qd.from + 0.6, qd.to, qd.to + 0.6], [0, 1, 1, 0], { ...clamp, easing: EASE });
          const enter = interpolate(frame, [(0.5 + i * 0.12) * fps, (1.3 + i * 0.12) * fps], [0, 1], { ...clamp, easing: EASE });
          const o = enter * (1 - q) * (0.42 + 0.58 * Math.max(lit, pre * 0.7));
          const glow = isQW ? 0.7 + Math.sin(t * 2.2) * 0.3 : 1;
          return (
            <div
              key={qd.id}
              style={{
                position: "absolute",
                left: 14 + qd.col * (CW + GAP),
                top: qd.row * (CH + GAP),
                width: CW,
                height: CH,
                borderRadius: 24,
                transform: `translateZ(${lit * 60}px)`,
                opacity: o,
                background: isQW
                  ? `linear-gradient(135deg, rgba(219,172,240,${0.18 + lit * 0.3}), rgba(106,222,177,${0.14 + lit * 0.3}))`
                  : `linear-gradient(180deg, rgba(255,255,255,${0.06 + lit * 0.06}), rgba(255,255,255,0.02)), rgba(12,10,18,0.8)`,
                border: `1.5px solid ${lit > 0.1 ? qd.color : C.hairline2}`,
                display: "grid",
                placeItems: "center",
                textAlign: "center",
                padding: 18,
              }}
            >
              {isQW ? (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: 24,
                    background: `radial-gradient(circle at 50% 40%, rgba(255,255,255,${0.25 * lit * glow}), transparent 70%)`,
                  }}
                />
              ) : null}
              <div style={{ position: "relative" }}>
                {isQW ? (
                  <div style={{ display: "flex", justifyContent: "center", marginBottom: 10, color: lit > 0.5 ? "#fff" : C.fg2 }}>
                    <IconZap size={38} />
                  </div>
                ) : null}
                <div
                  style={{
                    fontSize: isQW ? 38 : 30,
                    fontWeight: 800,
                    letterSpacing: "-0.02em",
                    lineHeight: 1.1,
                    color: lit > 0.3 ? C.fg : C.fg2,
                    textTransform: isQW ? "uppercase" : "none",
                  }}
                >
                  {qd.label}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const Meter: React.FC<{ label: string; value: number; at: number; color: string }> = ({ label, value, at, color }) => {
  const p = useEnter(at, 1.0);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
      <div style={{ width: 170, fontSize: 22, fontWeight: 600, color: C.fg3, letterSpacing: "0.04em", textTransform: "uppercase" }}>{label}</div>
      <div style={{ flex: 1, height: 12, borderRadius: 8, background: "rgba(255,255,255,0.08)" }}>
        <div style={{ width: `${value * p}%`, minWidth: p > 0 ? 12 : 0, height: "100%", borderRadius: 8, background: color }} />
      </div>
    </div>
  );
};

const Verdict: React.FC<{ at: number; out: number; color: string; icon: React.ReactNode; children: React.ReactNode }> = ({
  at,
  out,
  color,
  icon,
  children,
}) => (
  <Reveal at={at} out={out} y={12} style={{ marginTop: 30 }}>
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 22px 12px 14px",
        borderRadius: 999,
        border: `1px solid ${color}88`,
        background: `${color}1a`,
        fontSize: 26,
        fontWeight: 700,
        color,
        whiteSpace: "nowrap",
      }}
    >
      {icon}
      {children}
    </div>
  </Reveal>
);

type PanelProps = {
  from: number;
  out: number;
  where: string;
  title: string;
  color: string;
  desc: string;
  descAt: number;
  valeur: number;
  effort: number;
  verdict: React.ReactNode;
};
const QuadPanel: React.FC<PanelProps> = ({ from, out, where, title, color, desc, descAt, valeur, effort, verdict }) => (
  <div style={{ position: "absolute", left: 1370, top: 260, width: 460 }}>
    <Reveal at={from} out={out}>
      <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: C.fg3 }}>{where}</div>
    </Reveal>
    <Reveal at={from + 0.1} out={out} style={{ marginTop: 10 }}>
      <div style={{ fontSize: 52, fontWeight: 800, letterSpacing: "-0.035em", lineHeight: 1.02, color }}>{title}</div>
    </Reveal>
    <Reveal at={descAt} out={out} style={{ marginTop: 20 }}>
      <div style={{ fontSize: 28, fontWeight: 500, color: C.fg, lineHeight: 1.32 }}>{desc}</div>
    </Reveal>
    <Reveal at={descAt + 0.4} out={out} style={{ marginTop: 28, display: "flex", flexDirection: "column", gap: 14 }}>
      <Meter label="Valeur" value={valeur} at={descAt + 0.5} color={GRAD.violet} />
      <Meter label="Effort" value={effort} at={descAt + 0.8} color={GRAD.beige} />
    </Reveal>
    {verdict}
  </div>
);

const Quality: React.FC<{ at: number; subAt: number; title: string; sub: string; icon: React.ReactNode }> = ({ at, subAt, title, sub, icon }) => (
  <Reveal at={at} out={OUT} y={14}>
    <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
      <div
        style={{
          flex: "none",
          width: 52,
          height: 52,
          borderRadius: 16,
          display: "grid",
          placeItems: "center",
          backgroundImage: GRAD.bleu,
          color: "#0b1a16",
        }}
      >
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 30, fontWeight: 700, lineHeight: 1.2 }}>{title}</div>
        <Reveal at={subAt} y={6}>
          <div style={{ fontSize: 24, color: C.fg2, fontWeight: 500, marginTop: 4 }}>{sub}</div>
        </Reveal>
      </div>
    </div>
  </Reveal>
);

export const Matrix: React.FC = () => {
  return (
    <AbsoluteFill style={{ ...baseText }}>
      <div style={{ position: "absolute", left: 160, top: 130 }}>
        <Reveal at={0.2} out={7.9}>
          <Eyebrow>Arbitrer ses choix · deux axes</Eyebrow>
        </Reveal>
      </div>
      <Plane />

      {/* les deux axes, avant que les quadrants ne s'allument */}
      <div style={{ position: "absolute", left: 1370, top: 280, width: 460 }}>
        <Reveal at={0.6} out={7.9}>
          <div style={{ fontSize: 46, fontWeight: 800, letterSpacing: "-0.035em", lineHeight: 1.05 }}>
            Deux axes pour <GradText>trier vos tâches</GradText>
          </div>
        </Reveal>
        <Reveal at={3.4} out={7.9} y={12} style={{ marginTop: 30 }}>
          <div style={{ fontSize: 28, fontWeight: 600 }}>
            <span style={{ color: C.violetLight }}>↑</span> La valeur ajoutée de la tâche
          </div>
        </Reveal>
        <Reveal at={5.2} out={7.9} y={12} style={{ marginTop: 16 }}>
          <div style={{ fontSize: 28, fontWeight: 600 }}>
            <span style={{ color: C.bleu }}>→</span> Sa facilité de mise en œuvre
          </div>
        </Reveal>
      </div>

      <QuadPanel
        from={8.4}
        out={17.4}
        where="En bas à gauche"
        title="Fausses bonnes idées"
        color={C.beige}
        desc="Des projets complexes qui n'apportent presque aucun résultat."
        descAt={11.4}
        valeur={8}
        effort={90}
        verdict={
          <Verdict at={16.3} out={17.4} color={C.beige} icon={<IconX size={24} />}>
            À écarter d'emblée
          </Verdict>
        }
      />
      <QuadPanel
        from={17.8}
        out={25.3}
        where="En haut à gauche"
        title="Actions majeures"
        color={C.violetLight}
        desc="Forte valeur ajoutée, mais une complexité qui exige une vraie planification."
        descAt={20.5}
        valeur={85}
        effort={80}
        verdict={
          <Verdict at={24.0} out={25.3} color={C.violetLight} icon={<IconCalendar size={24} />}>
            À planifier
          </Verdict>
        }
      />
      <QuadPanel
        from={25.7}
        out={33.1}
        where="En bas à droite"
        title="Actions mineures"
        color={C.bleu}
        desc="Très faciles à lancer, mais un impact qui reste limité."
        descAt={29.3}
        valeur={25}
        effort={18}
        verdict={
          <Verdict at={31.6} out={33.1} color={C.bleu} icon={<IconTrendUp size={24} />}>
            Impact limité
          </Verdict>
        }
      />

      {/* quick win */}
      <div style={{ position: "absolute", left: 1370, top: 250, width: 470 }}>
        <Reveal at={33.5} out={OUT}>
          <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: C.fg3 }}>En haut à droite</div>
        </Reveal>
        <Reveal at={33.6} out={OUT} y={24} blur={12} style={{ marginTop: 8 }}>
          <div style={{ fontSize: 76, fontWeight: 800, letterSpacing: "-0.045em", lineHeight: 1 }}>
            <GradText>Quick win</GradText>
          </div>
        </Reveal>
        <Reveal at={38.4} out={OUT} style={{ marginTop: 22 }}>
          <div style={{ fontSize: 27, color: C.fg2, fontWeight: 500 }}>Deux qualités indispensables :</div>
        </Reveal>
        <div style={{ marginTop: 22, display: "flex", flexDirection: "column", gap: 22 }}>
          <Quality at={40.3} subAt={43.5} title="Un gain de temps significatif" sub="= une forte valeur ajoutée" icon={<IconCheck size={28} color="#0b1a16" />} />
          <Quality at={44.9} subAt={46.5} title="Une mise en place facile" sub="= une difficulté faible" icon={<IconCheck size={28} color="#0b1a16" />} />
        </div>
        <Reveal at={47.2} out={OUT} y={12} style={{ marginTop: 30 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 22px 12px 14px",
              borderRadius: 999,
              backgroundImage: GRAD.violet,
              color: "#140d1f",
              fontSize: 26,
              fontWeight: 700,
              whiteSpace: "nowrap",
            }}
          >
            <IconTarget size={26} color="#140d1f" />
            C'est ici qu'on se concentre
          </div>
        </Reveal>
      </div>
    </AbsoluteFill>
  );
};
