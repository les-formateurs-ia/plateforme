import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { IconEye, IconFilm, IconImage, IconRepeat, IconText } from "../../components/icons";
import { Eyebrow, GradText, Reveal, RiseLines, baseText, useExit } from "../../components/ui";
import { C, EASE, GRAD, SAFE_L, clamp } from "../../theme";

// 101,6 → 127,6 s. Temps locaux = temps audio − 101,6.
// La sphère de particules (à droite) joue le rôle du modèle : les données
// s'y engouffrent pendant l'entraînement.
const OUT = 25.4;
const SINK = { x: 1570, y: 520 }; // = centre de la sphère (timeline.ts, LLM_R)

const TOKENS = [
  "Bonjour", "chat", "1789", "Paris", "recette", "♪", "{ }", "Molière", "photo", "météo",
  "contrat", "∑", "merci", "Lyon", "poème", "★", "vidéo", "code", "histoire", "<div>",
  "souris", "%", "roman", "équipe", "©", "mars", "pixel", "loi", "ciel", "€",
];
const COLORS = [C.violetLight, C.bleu, C.bleuVert, C.beige, C.violet, C.beigeLight];

const rand = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

const DataStream: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const on = interpolate(t, [10.0, 11.5, OUT - 0.3, OUT + 0.4], [0, 1, 1, 0], clamp);
  if (on <= 0) return null;
  const N = 64;
  return (
    <>
      {Array.from({ length: N }).map((_, k) => {
        const speed = 0.16 + rand(k) * 0.12;
        const u = (t * speed + rand(k + 99)) % 1;
        // Bézier cubique : du haut / du bas (côté droit) vers le centre de la
        // sphère — le flux ne traverse ni la colonne de texte ni la zone avatar
        const top = k % 2 === 0;
        const x0 = 1240 + rand(k + 7) * 640;
        const p0 = { x: x0, y: top ? -80 : 1160 };
        const p1 = { x: x0 + (rand(k + 11) - 0.5) * 220, y: top ? 180 : 900 };
        const p2 = { x: SINK.x + (rand(k + 13) - 0.5) * 320, y: SINK.y + (top ? -220 : 220) };
        const p3 = { x: SINK.x + (rand(k + 3) - 0.5) * 60, y: SINK.y + (rand(k + 5) - 0.5) * 60 };
        const a = 1 - u;
        const x = a * a * a * p0.x + 3 * a * a * u * p1.x + 3 * a * u * u * p2.x + u * u * u * p3.x;
        const y = a * a * a * p0.y + 3 * a * a * u * p1.y + 3 * a * u * u * p2.y + u * u * u * p3.y;
        const fadeIn = interpolate(u, [0.2, 0.32], [0, 1], clamp); // invisible au passage du titre de chapitre / de la barre
        const fadeOut = interpolate(u, [0.82, 0.98], [1, 0], clamp);
        const kind = k % 4;
        const col = COLORS[k % COLORS.length];
        const s = 1 - u * 0.6;
        return (
          <div
            key={k}
            style={{
              position: "absolute",
              left: x,
              top: y,
              translate: "-50% -50%",
              scale: String(s),
              opacity: on * fadeIn * fadeOut,
            }}
          >
            {kind === 3 ? (
              <div style={{ width: 16, height: 16, borderRadius: 4, background: col, boxShadow: `0 0 16px ${col}` }} />
            ) : (
              <div
                style={{
                  padding: "6px 14px",
                  borderRadius: 999,
                  border: `1px solid ${col}66`,
                  background: "rgba(14,12,21,0.7)",
                  color: col,
                  fontSize: 22,
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                }}
              >
                {TOKENS[k % TOKENS.length]}
              </div>
            )}
          </div>
        );
      })}
    </>
  );
};

// Petit graphe de mots qui se relient : "les mots s'assemblent".
const NODES = [
  { id: "chat", x: 70, y: 80 },
  { id: "mange", x: 270, y: 34 },
  { id: "souris", x: 470, y: 100 },
  { id: "chien", x: 120, y: 230 },
  { id: "os", x: 320, y: 240 },
  { id: "fromage", x: 540, y: 250 },
];
const LINKS: [string, string, number][] = [
  ["chat", "mange", 21.0],
  ["mange", "souris", 21.6],
  ["chat", "souris", 22.3],
  ["chien", "os", 23.0],
  ["chien", "mange", 23.6],
  ["souris", "fromage", 24.2],
];

const WordGraph: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pos = Object.fromEntries(NODES.map((n) => [n.id, n]));
  return (
    <Reveal at={20.3} out={OUT} style={{ position: "absolute", left: SAFE_L, top: 610, width: 640, height: 310 }}>
      <svg width={640} height={310} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <defs>
          <linearGradient id="lg" x1="0" x2="1">
            <stop offset="0" stopColor={C.violetLight} />
            <stop offset="1" stopColor={C.bleu} />
          </linearGradient>
        </defs>
        {LINKS.map(([a, b, at]) => {
          const p = interpolate(frame, [at * fps, (at + 0.7) * fps], [0, 1], { ...clamp, easing: EASE });
          const A = pos[a];
          const B = pos[b];
          const len = Math.hypot(B.x - A.x, B.y - A.y);
          return (
            <line
              key={a + b}
              x1={A.x}
              y1={A.y}
              x2={B.x}
              y2={B.y}
              stroke="url(#lg)"
              strokeWidth={2.5}
              strokeDasharray={len}
              strokeDashoffset={len * (1 - p)}
              opacity={0.8}
            />
          );
        })}
      </svg>
      {NODES.map((n, i) => (
        <Reveal key={n.id} at={20.4 + i * 0.12} y={8} style={{ position: "absolute", left: n.x, top: n.y, translate: "-50% -50%" }}>
          <div
            style={{
              padding: "8px 20px",
              borderRadius: 999,
              background: "rgba(14,12,21,0.9)",
              border: `1px solid ${C.hairline2}`,
              fontSize: 28,
              fontWeight: 600,
              whiteSpace: "nowrap",
            }}
          >
            {n.id}
          </div>
        </Reveal>
      ))}
    </Reveal>
  );
};

const Pill: React.FC<{ at: number; out: number; icon: React.ReactNode; children: React.ReactNode; color: string }> = ({
  at,
  out,
  icon,
  children,
  color,
}) => (
  <Reveal at={at} out={out} y={14}>
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 14,
        padding: "14px 28px 14px 18px",
        borderRadius: 999,
        border: `1px solid ${color}55`,
        background: `${color}14`,
        fontSize: 30,
        whiteSpace: "nowrap",
        fontWeight: 600,
      }}
    >
      <span style={{ color, display: "flex" }}>{icon}</span>
      {children}
    </div>
  </Reveal>
);

const LETTERS: [string, boolean][] = [
  ["L", true], ["arge ", false], ["L", true], ["anguage ", false], ["M", true], ["odel", false],
];

export const Llm: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const shrink = interpolate(frame, [9.6 * fps, 10.4 * fps], [0, 1], { ...clamp, easing: EASE });
  const qA = useExit(9.4, 0.5);
  return (
    <AbsoluteFill style={{ ...baseText }}>
      <DataStream />

      {/* A — LLM */}
      <div style={{ position: "absolute", left: SAFE_L, top: 190, width: 700, opacity: 1 - qA, filter: `blur(${qA * 6}px)`, scale: String(1 - shrink * 0.04) }}>
        <Reveal at={0.3}>
          <Eyebrow>Le moteur des IA</Eyebrow>
        </Reveal>
        <Reveal at={3.0} y={30} blur={14} style={{ marginTop: 20 }}>
          <div style={{ fontSize: 240, fontWeight: 800, letterSpacing: "-0.05em", lineHeight: 1 }}>
            <GradText>LLM</GradText>
          </div>
        </Reveal>
        <Reveal at={3.7} style={{ marginTop: 6 }}>
          <div style={{ fontSize: 56, fontWeight: 700, letterSpacing: "-0.02em" }}>
            {LETTERS.map(([s, hl], i) => (
              <span key={i} style={{ color: hl ? C.violetLight : C.fg }}>
                {s}
              </span>
            ))}
          </div>
        </Reveal>
        <Reveal at={4.4} style={{ marginTop: 12 }}>
          <div style={{ fontSize: 36, color: C.fg3, fontWeight: 500 }}>« grand modèle de langage »</div>
        </Reveal>
        <Reveal at={5.8} style={{ marginTop: 56 }}>
          <div style={{ fontSize: 36, color: C.fg2, fontWeight: 500 }}>Comme nous, elle apprend par…</div>
        </Reveal>
        <div style={{ display: "flex", gap: 16, marginTop: 22 }}>
          <Pill at={7.6} out={99} icon={<IconEye size={30} />} color={C.bleu}>
            l'observation
          </Pill>
          <Pill at={8.7} out={99} icon={<IconRepeat size={30} />} color={C.bleuVert}>
            la répétition
          </Pill>
        </div>
      </div>

      {/* B — l'immersion dans les données */}
      <div style={{ position: "absolute", left: SAFE_L, top: 230, width: 700 }}>
        <Reveal at={9.9} out={16.9}>
          <Eyebrow color={C.bleu}>L'entraînement</Eyebrow>
        </Reveal>
        <RiseLines
          at={10.1}
          out={16.9}
          style={{ marginTop: 30, fontSize: 74, fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1.02 }}
          lines={["On l'immerge dans", "la culture humaine"]}
        />
        <Reveal at={14.0} out={16.9} style={{ marginTop: 44 }}>
          <div style={{ fontSize: 120, fontWeight: 800, letterSpacing: "-0.045em", lineHeight: 1 }}>
            <GradText grad={GRAD.bleu}>des milliards</GradText>
          </div>
        </Reveal>
        <div style={{ display: "flex", gap: 16, marginTop: 30 }}>
          <Pill at={14.6} out={16.9} icon={<IconText size={30} />} color={C.violetLight}>
            de textes
          </Pill>
          <Pill at={15.4} out={16.9} icon={<IconImage size={30} />} color={C.beige}>
            d'images
          </Pill>
          <Pill at={16.1} out={16.9} icon={<IconFilm size={30} />} color={C.bleu}>
            de vidéos
          </Pill>
        </div>
      </div>

      {/* C — schémas récurrents */}
      <div style={{ position: "absolute", left: SAFE_L, top: 230, width: 700 }}>
        <Reveal at={17.1} out={OUT}>
          <Eyebrow color={C.bleuVert}>Ce qu'elle en retient</Eyebrow>
        </Reveal>
        <RiseLines
          at={17.3}
          out={OUT}
          style={{ marginTop: 30, fontSize: 84, fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1.02 }}
          lines={["Des schémas", <GradText key="r">récurrents</GradText>]}
        />
        <Reveal at={22.6} out={OUT} style={{ marginTop: 26 }}>
          <div style={{ fontSize: 32, color: C.fg2, fontWeight: 500 }}>…et la façon dont les mots s'assemblent.</div>
        </Reveal>
      </div>
      <WordGraph />
    </AbsoluteFill>
  );
};
