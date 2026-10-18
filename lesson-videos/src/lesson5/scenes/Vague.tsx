import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { IconFileText, IconMail, IconWave, IconX } from "../../components/icons";
import { Eyebrow, GradText, Reveal, baseText, useExit } from "../../components/ui";
import { C, EASE, SAFE_L, clamp } from "../../theme";

// 54,3 → 85,4 s. Temps locaux = temps audio − 54,3.
// Une consigne vague → trois résultats totalement différents.
const OUT = 30.55;
const PROMPT = "Écris un message pour informer l'équipe du changement.";

const Missing: React.FC<{ at: number; children: React.ReactNode }> = ({ at, children }) => (
  <Reveal at={at} out={OUT} y={10}>
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 16px 8px 10px",
        borderRadius: 999,
        border: "1px solid rgba(251,194,173,0.55)",
        background: "rgba(251,194,173,0.1)",
        fontSize: 22,
        fontWeight: 700,
        color: C.beige,
        whiteSpace: "nowrap",
      }}
    >
      <IconX size={18} color={C.beige} />
      {children}
    </div>
  </Reveal>
);

type Res = { at: number; title: string; icon: React.ReactNode; color: string; art: React.ReactNode };
const Lines: React.FC<{ n: number; w?: number[] }> = ({ n, w = [94, 88, 92, 70, 84, 60, 90, 76] }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
    {Array.from({ length: n }).map((_, i) => (
      <div key={i} style={{ height: 9, borderRadius: 5, width: `${w[i % w.length]}%`, background: "rgba(255,255,255,0.18)" }} />
    ))}
  </div>
);
const RESULTS: Res[] = [
  {
    at: 16.2,
    title: "Un e-mail très long et formel",
    icon: <IconMail size={24} />,
    color: C.violetLight,
    art: <Lines n={8} />,
  },
  {
    at: 19.4,
    title: "Un simple message instantané",
    icon: <IconWave size={24} />,
    color: C.bleu,
    art: (
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ alignSelf: "flex-start", padding: "10px 14px", borderRadius: "16px 16px 16px 4px", background: "rgba(120,213,226,0.18)", fontSize: 17, color: C.fg }}>
          Hello l'équipe, petit changement…
        </div>
        <div style={{ alignSelf: "flex-start", width: "55%", height: 30, borderRadius: "16px 16px 16px 4px", background: "rgba(255,255,255,0.08)" }} />
      </div>
    ),
  },
  {
    at: 21.3,
    title: "Une note de réorganisation",
    icon: <IconFileText size={24} />,
    color: C.beige,
    art: (
      <div>
        <div style={{ fontSize: 16, fontWeight: 800, color: C.fg2, letterSpacing: "0.06em", textTransform: "uppercase" }}>Note interne</div>
        <div style={{ marginTop: 10 }}>
          <Lines n={5} w={[60, 92, 88, 94, 50]} />
        </div>
      </div>
    ),
  },
];

const ResultCard: React.FC<{ r: Res; i: number }> = ({ r, i }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = interpolate(frame, [r.at * fps, (r.at + 0.9) * fps], [0, 1], { ...clamp, easing: EASE });
  const q = useExit(OUT, 0.5);
  const spread = (i - 1) * 18;
  return (
    <div style={{ perspective: 1200 }}>
      <div
        style={{
          width: 370,
          height: 300,
          borderRadius: 24,
          padding: 24,
          border: `1px solid ${r.color}66`,
          background: `linear-gradient(180deg, ${r.color}16, rgba(255,255,255,0.02)), rgba(12,10,18,0.85)`,
          opacity: p * (1 - q),
          transform: `rotateY(${(1 - p) * spread * -2}deg) translateY(${(1 - p) * -80}px) scale(${0.85 + 0.15 * p})`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, color: r.color }}>
          {r.icon}
          <span style={{ fontSize: 15, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase" }}>Résultat {i + 1}</span>
        </div>
        <div style={{ marginTop: 10, fontSize: 25, fontWeight: 800, lineHeight: 1.2 }}>{r.title}</div>
        <div style={{ marginTop: 18 }}>{r.art}</div>
      </div>
    </div>
  );
};

export const Vague: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const n = Math.floor(interpolate(frame, [3.4 * fps, 5.6 * fps], [0, PROMPT.length], clamp));
  return (
    <AbsoluteFill style={{ ...baseText }}>
      <div style={{ position: "absolute", left: 160, top: 120 }}>
        <Reveal at={0.2} out={OUT}>
          <Eyebrow color={C.beige}>Exemple volontairement incomplet</Eyebrow>
        </Reveal>
      </div>

      {/* la consigne vague */}
      <Reveal at={3.2} out={OUT} y={16} style={{ position: "absolute", left: SAFE_L, top: 210 }}>
        <div
          style={{
            maxWidth: 760,
            padding: "20px 28px",
            borderRadius: "28px 28px 28px 8px",
            background: "#F7F4FB",
            color: "#16121f",
            fontSize: 30,
            fontWeight: 600,
            lineHeight: 1.3,
          }}
        >
          {PROMPT.slice(0, n)}
        </div>
      </Reveal>
      <div style={{ position: "absolute", left: SAFE_L, top: 340, display: "flex", gap: 12 }}>
        <Missing at={6.8}>Aucun destinataire</Missing>
        <Missing at={8.5}>Aucune circonstance</Missing>
        <Missing at={10.0}>Aucun format</Missing>
      </div>

      {/* trois résultats */}
      <div style={{ position: "absolute", left: SAFE_L, top: 430, display: "flex", gap: 22 }}>
        {RESULTS.map((r, i) => (
          <ResultCard key={r.title} r={r} i={i} />
        ))}
      </div>

      <div style={{ position: "absolute", left: SAFE_L, top: 770, width: 1200 }}>
        <Reveal at={23.0} out={26.6}>
          <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: "-0.02em" }}>
            <GradText>3 résultats totalement différents</GradText> pour une même demande.
          </div>
        </Reveal>
      </div>
      <div style={{ position: "absolute", left: SAFE_L, top: 770, width: 1200 }}>
        <Reveal at={26.9} out={OUT}>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <span style={{ fontSize: 28, color: C.fg2, fontWeight: 600 }}>Rien ne permettait à l'IA de trancher :</span>
            {["Pour qui ?", "Pourquoi ?", "Comment ?"].map((q, i) => (
              <Reveal key={q} at={27.6 + i * 0.3} y={8}>
                <span style={{ padding: "8px 18px", borderRadius: 999, background: "rgba(255,255,255,0.08)", border: `1px solid ${C.hairline2}`, fontSize: 26, fontWeight: 800 }}>
                  {q}
                </span>
              </Reveal>
            ))}
          </div>
        </Reveal>
      </div>
    </AbsoluteFill>
  );
};
