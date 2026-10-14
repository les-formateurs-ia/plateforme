import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { Eyebrow, GradText, Reveal, baseText, useExit } from "../../components/ui";
import { C, EASE, clamp } from "../../theme";

// 127,4 → 140 s. Temps locaux = temps audio − 127,4.
// Le Transformer "lit tout le texte d'un coup" : on matérialise l'attention
// par des arcs qui relient chaque mot à tous les autres.
const OUT = 12.0;
const WORDS = ["Le", "chat", "mange", "une", "souris", "dans", "le", "jardin"];
const FOCUS = 4; // "souris"
const CHAR = 22;
const PAD = 48;
const GAP = 14;
const CX = 1200; // centre de la scène, décalé à droite de la zone avatar
const ROW_Y = 740;

const layout = () => {
  const widths = WORDS.map((w) => w.length * CHAR + PAD);
  const total = widths.reduce((a, b) => a + b, 0) + GAP * (WORDS.length - 1);
  let x = CX - total / 2;
  return widths.map((w) => {
    const c = x + w / 2;
    x += w + GAP;
    return { c, w };
  });
};

export const Transformer: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const pos = layout();
  const focusP = interpolate(frame, [8.9 * fps, 9.8 * fps], [0, 1], { ...clamp, easing: EASE });
  const allP = interpolate(frame, [9.9 * fps, 11.2 * fps], [0, 1], { ...clamp, easing: EASE });
  const q = useExit(OUT, 0.5);

  const arcs: { a: number; b: number; strong: boolean; p: number }[] = [];
  for (let a = 0; a < WORDS.length; a++) {
    for (let b = a + 1; b < WORDS.length; b++) {
      const strong = a === FOCUS || b === FOCUS;
      arcs.push({ a, b, strong, p: strong ? focusP : allP });
    }
  }

  return (
    <AbsoluteFill style={{ ...baseText }}>
      <div style={{ position: "absolute", left: CX - 700, width: 1400, top: 190, textAlign: "center" }}>
        <Reveal at={0.3} out={OUT}>
          <Eyebrow>L'architecture des IA modernes</Eyebrow>
        </Reveal>
        <div style={{ position: "relative", height: 170, marginTop: 30 }}>
          <Reveal at={0.6} out={5.4} style={{ position: "absolute", left: 0, right: 0, top: 50 }}>
            <div style={{ fontSize: 56, fontWeight: 700, color: C.fg2, letterSpacing: "-0.02em" }}>
              Pour traiter toutes ces données…
            </div>
          </Reveal>
          <Reveal at={5.8} out={OUT} y={30} blur={14} style={{ position: "absolute", left: 0, right: 0, top: 0 }}>
            <div style={{ fontSize: 150, fontWeight: 800, letterSpacing: "-0.05em", lineHeight: 1 }}>
              <GradText>Transformer</GradText>
            </div>
          </Reveal>
        </div>
      </div>

      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: 1 - q }}>
        <defs>
          <linearGradient id="arc" x1="0" x2="1">
            <stop offset="0" stopColor={C.violetLight} />
            <stop offset="0.6" stopColor={C.bleu} />
            <stop offset="1" stopColor={C.bleuVert} />
          </linearGradient>
        </defs>
        {arcs.map(({ a, b, strong, p }) => {
          if (p <= 0) return null;
          const x1 = pos[a].c;
          const x2 = pos[b].c;
          const h = Math.min(230, 40 + Math.abs(x2 - x1) * 0.4);
          const y = ROW_Y - 44;
          const d = `M ${x1} ${y} C ${x1} ${y - h}, ${x2} ${y - h}, ${x2} ${y}`;
          const len = Math.abs(x2 - x1) * 1.5 + h;
          const pulse = 0.7 + Math.sin(t * 3 + a + b) * 0.3;
          return (
            <path
              key={`${a}-${b}`}
              d={d}
              fill="none"
              stroke="url(#arc)"
              strokeWidth={strong ? 3 : 1.4}
              strokeLinecap="round"
              strokeDasharray={len}
              strokeDashoffset={len * (1 - p)}
              opacity={(strong ? 0.95 : 0.4) * pulse}
            />
          );
        })}
      </svg>

      {WORDS.map((w, i) => {
        const isFocus = i === FOCUS;
        return (
          <Reveal
            key={i}
            at={1.0 + i * 0.12}
            out={OUT}
            y={16}
            style={{ position: "absolute", left: pos[i].c - pos[i].w / 2, top: ROW_Y - 44, width: pos[i].w }}
          >
            <div
              style={{
                height: 80,
                borderRadius: 20,
                display: "grid",
                placeItems: "center",
                fontSize: 40,
                fontWeight: 700,
                border: `1px solid ${isFocus && focusP > 0 ? C.violetLight : C.hairline2}`,
                background: isFocus ? `rgba(181,141,224,${0.05 + focusP * 0.2})` : "rgba(255,255,255,0.04)",
                boxShadow: isFocus ? `0 0 ${focusP * 50}px ${C.violet}88` : "none",
              }}
            >
              {w}
            </div>
          </Reveal>
        );
      })}

      <Reveal at={9.3} out={OUT} style={{ position: "absolute", left: CX - 600, width: 1200, top: 850, textAlign: "center" }}>
        <div style={{ fontSize: 34, fontWeight: 500, color: C.fg2, lineHeight: 1.35, textWrap: "balance" }}>
          Une analyse <span style={{ color: C.fg, fontWeight: 700 }}>panoramique</span> : chaque mot est relié à
          tous les autres pour saisir la <span style={{ color: C.fg, fontWeight: 700 }}>cohérence</span>.
        </div>
      </Reveal>
    </AbsoluteFill>
  );
};
