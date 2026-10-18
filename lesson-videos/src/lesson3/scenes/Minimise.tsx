import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { IconAlert, IconCheck, IconFileText, IconSparkle } from "../../components/icons";
import { Eyebrow, GradText, Reveal, RiseLines, baseText, useEnter, useExit } from "../../components/ui";
import { C, EASE, GRAD, clamp } from "../../theme";

// 23,4 → 47,4 s. Temps locaux = temps audio − 23,4.
// Un dossier entier → on ne garde que les lignes utiles à la requête.
const OUT = 23.45;
const DOC = { x: 640, y: 380, w: 460 };
const PROMPT = { x: 1250, y: 380, w: 570 };
const ROW0 = 92;
const STEP = 46;

type Line = { text: string; useful: boolean; sensitive?: boolean };
const LINES: Line[] = [
  { text: "Entretien annuel — Mme Élodie MARTIN", useful: true, sensitive: true },
  { text: "Née le 14/05/1988 à Lyon", useful: false },
  { text: "Poste : cheffe de projet marketing", useful: true },
  { text: "IBAN FR76 3000 4018 2500…", useful: false },
  { text: "Objectifs atteints : 4 sur 5", useful: true },
  { text: "Adresse : 45, rue des Lilas", useful: false },
  { text: "Situation familiale", useful: false },
  { text: "Axe de progrès : prise de parole", useful: true },
  { text: "N° de Sécurité sociale 2 88 05…", useful: false },
];

const DROP_AT = 11.8;
const FLY_AT = 13.0;
const FLAG_AT = 18.6;

const Row: React.FC<{ line: Line; i: number }> = ({ line, i }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const appear = interpolate(frame, [(2.6 + i * 0.08) * fps, (3.1 + i * 0.08) * fps], [0, 1], clamp);
  const q = useExit(OUT, 0.5);
  const fromX = DOC.x + 26;
  const fromY = DOC.y + ROW0 + i * STEP;

  if (!line.useful) {
    const k = LINES.filter((l, j) => !l.useful && j < i).length;
    const strike = interpolate(t, [DROP_AT + k * 0.12, DROP_AT + k * 0.12 + 0.4], [0, 1], { ...clamp, easing: EASE });
    const fall = interpolate(t, [DROP_AT + 0.7 + k * 0.1, DROP_AT + 1.5 + k * 0.1], [0, 1], { ...clamp, easing: EASE });
    return (
      <div
        style={{
          position: "absolute",
          left: fromX,
          top: fromY,
          width: DOC.w - 52,
          opacity: appear * (1 - fall) * (1 - q),
          translate: `${fall * -20}px ${fall * 60}px`,
          rotate: `${fall * -4}deg`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: 19,
          fontWeight: 500,
          color: strike > 0.5 ? C.fg3 : C.fg2,
        }}
      >
        <span style={{ position: "relative", whiteSpace: "nowrap" }}>
          {line.text}
          <span style={{ position: "absolute", left: 0, top: "52%", height: 2, width: `${strike * 100}%`, background: C.beige }} />
        </span>
        <span
          style={{
            opacity: strike,
            fontSize: 15,
            fontWeight: 700,
            color: C.beige,
            padding: "3px 10px",
            borderRadius: 999,
            border: "1px solid rgba(251,194,173,0.5)",
          }}
        >
          Inutile
        </span>
      </div>
    );
  }

  const j = LINES.filter((l, m) => l.useful && m < i).length;
  const fly = interpolate(t, [FLY_AT + j * 0.25, FLY_AT + j * 0.25 + 0.9], [0, 1], { ...clamp, easing: EASE });
  const toX = PROMPT.x + 30;
  const toY = PROMPT.y + 112 + j * 56;
  const x = fromX + (toX - fromX) * fly;
  const y = fromY + (toY - fromY) * fly - Math.sin(Math.PI * fly) * 60;
  const flag = line.sensitive ? interpolate(t, [FLAG_AT, FLAG_AT + 0.6], [0, 1], { ...clamp, easing: EASE }) : 0;
  const pulse = flag > 0 ? 0.6 + Math.sin(t * 5) * 0.4 : 0;
  const kept = interpolate(t, [DROP_AT, DROP_AT + 0.5], [0, 1], clamp);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: DOC.w - 52 + (PROMPT.w - 56 - (DOC.w - 52)) * fly,
        opacity: appear * (1 - q),
        padding: "6px 12px",
        margin: "-6px -12px",
        borderRadius: 10,
        background: flag > 0 ? `rgba(251,194,173,${0.12 + pulse * 0.12})` : `rgba(219,172,240,${kept * 0.12})`,
        border: `1px solid ${flag > 0 ? `rgba(251,194,173,${0.4 + pulse * 0.4})` : `rgba(219,172,240,${kept * 0.35})`}`,
        fontSize: 19 + fly * 1.5,
        gap: 10,
        fontWeight: 600,
        color: C.fg,
        whiteSpace: "nowrap",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <span>{line.text}</span>
      {flag > 0 ? (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: C.beige, fontSize: 17, fontWeight: 700, opacity: flag }}>
          <IconAlert size={18} color={C.beige} /> Sensible
        </span>
      ) : null}
    </div>
  );
};

const Benefit: React.FC<{ at: number; children: React.ReactNode }> = ({ at, children }) => (
  <Reveal at={at} out={OUT} y={10}>
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        padding: "8px 18px 8px 10px",
        borderRadius: 999,
        border: "1px solid rgba(106,222,177,0.5)",
        background: "rgba(106,222,177,0.1)",
        fontSize: 22,
        fontWeight: 700,
        whiteSpace: "nowrap",
      }}
    >
      <span style={{ width: 28, height: 28, borderRadius: 99, display: "grid", placeItems: "center", background: C.bleuVert }}>
        <IconCheck size={18} color="#0b1a16" />
      </span>
      {children}
    </div>
  </Reveal>
);

export const Minimise: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const docIn = interpolate(frame, [2.0 * fps, 3.0 * fps], [0, 1], { ...clamp, easing: EASE });
  const promptIn = interpolate(frame, [12.4 * fps, 13.2 * fps], [0, 1], { ...clamp, easing: EASE });
  const docDim = interpolate(frame, [14.6 * fps, 15.4 * fps], [1, 0.45], clamp);
  const q = useExit(OUT, 0.5);
  const whole = useEnter(9.1, 0.5);
  const warn = useEnter(19.4, 0.6);

  return (
    <AbsoluteFill style={{ ...baseText }}>
      <div style={{ position: "absolute", left: 160, top: 140 }}>
        <Reveal at={0.2} out={OUT}>
          <Eyebrow>Le premier réflexe</Eyebrow>
        </Reveal>
        <RiseLines
          at={0.4}
          out={OUT}
          style={{ marginTop: 18, fontSize: 60, fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1.04 }}
          lines={[
            <span key="l">
              Ne partagez que <GradText>ce qui est nécessaire</GradText>
            </span>,
          ]}
        />
      </div>

      {/* le dossier complet */}
      <div
        style={{
          position: "absolute",
          left: DOC.x,
          top: DOC.y,
          width: DOC.w,
          height: ROW0 + LINES.length * STEP + 20,
          borderRadius: 26,
          background: "linear-gradient(180deg, rgba(255,255,255,0.07), rgba(255,255,255,0.02)), rgba(12,10,18,0.82)",
          border: `1px solid ${C.hairline2}`,
          opacity: docIn * docDim * (1 - q),
          transform: `perspective(1400px) rotateY(${(1 - docIn) * 30}deg) translateY(${(1 - docIn) * 30}px)`,
        }}
      >
        <div style={{ position: "absolute", left: 26, top: 24, display: "flex", alignItems: "center", gap: 12, fontSize: 21, fontWeight: 700 }}>
          <span style={{ color: C.fg2, display: "flex" }}>
            <IconFileText size={26} />
          </span>
          Dossier_RH_complet.pdf
        </div>
        <div
          style={{
            position: "absolute",
            right: 22,
            top: 22,
            padding: "5px 12px",
            borderRadius: 999,
            fontSize: 16,
            fontWeight: 700,
            color: C.beige,
            border: "1px solid rgba(251,194,173,0.5)",
            opacity: whole * (1 - interpolate(frame, [12.0 * fps, 12.6 * fps], [0, 1], clamp)),
          }}
        >
          Document entier
        </div>
      </div>

      {/* la requête */}
      <div
        style={{
          position: "absolute",
          left: PROMPT.x,
          top: PROMPT.y,
          width: PROMPT.w,
          height: 112 + 4 * 56 + 24,
          borderRadius: 26,
          background: "linear-gradient(180deg, rgba(181,141,224,0.12), rgba(255,255,255,0.02)), rgba(12,10,18,0.85)",
          border: "1px solid rgba(219,172,240,0.35)",
          opacity: promptIn * (1 - q),
          transform: `perspective(1400px) rotateY(${(1 - promptIn) * -30}deg)`,
        }}
      >
        <div style={{ position: "absolute", left: 28, top: 24, display: "flex", alignItems: "center", gap: 12, fontSize: 21, fontWeight: 700 }}>
          <span
            style={{ width: 36, height: 36, borderRadius: 11, display: "grid", placeItems: "center", backgroundImage: GRAD.violet }}
          >
            <IconSparkle size={20} color="#140d1f" />
          </span>
          Votre requête à l'IA
        </div>
        <div style={{ position: "absolute", left: 30, top: 72, fontSize: 18, color: C.fg3, fontWeight: 500 }}>
          « Rédige une synthèse de cet entretien : »
        </div>
      </div>

      {LINES.map((l, i) => (
        <Row key={i} line={l} i={i} />
      ))}

      <div style={{ position: "absolute", left: PROMPT.x, top: PROMPT.y + 112 + 4 * 56 + 50, display: "flex", gap: 12 }}>
        <Benefit at={15.8}>Réponse plus cohérente</Benefit>
        <Benefit at={16.5}>Plus efficace</Benefit>
      </div>

      <div
        style={{
          position: "absolute",
          left: PROMPT.x,
          top: PROMPT.y + 112 + 4 * 56 + 120,
          width: PROMPT.w,
          fontSize: 25,
          fontWeight: 600,
          color: C.beige,
          opacity: warn * (1 - q),
          translate: `0px ${(1 - warn) * 10}px`,
        }}
      >
        Reste une donnée sensible → place à l'anonymisation.
      </div>
    </AbsoluteFill>
  );
};
