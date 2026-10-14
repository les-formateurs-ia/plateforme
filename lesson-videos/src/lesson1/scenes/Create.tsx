import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { IconCheck, IconCode, IconImage, IconSparkle, IconText, IconWave, IconX } from "../../components/icons";
import { GradText, Reveal, RiseLines, baseText, useExit } from "../../components/ui";
import { C, EASE, GRAD, clamp } from "../../theme";

// 72,4 → 98,9 s. Temps locaux = temps audio − 72,4.
const OUT = 25.9;
const PROMPT = "Lance la campagne de notre nouvelle appli";
const TYPE_FROM = 7.0;
const TYPE_TO = 10.2;

const TextArt: React.FC<{ p: number }> = ({ p }) => {
  const widths = [92, 78, 86, 64, 88, 52];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, padding: "8px 4px" }}>
      {widths.map((w, i) => {
        const k = interpolate(p, [i / widths.length, (i + 1) / widths.length], [0, 1], clamp);
        return (
          <div
            key={i}
            style={{
              height: 12,
              borderRadius: 6,
              width: `${w * k}%`,
              backgroundImage: i === 0 ? GRAD.violet : "linear-gradient(90deg, rgba(255,255,255,0.5), rgba(255,255,255,0.22))",
            }}
          />
        );
      })}
    </div>
  );
};

const ImageArt: React.FC<{ t: number }> = ({ t }) => (
  <div style={{ position: "relative", height: 150, borderRadius: 16, overflow: "hidden" }}>
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: `linear-gradient(180deg, ${C.violet}, ${C.violetLight} 45%, ${C.beige})`,
        scale: String(1.05 + Math.sin(t * 0.6) * 0.04),
      }}
    />
    <div
      style={{
        position: "absolute",
        width: 54,
        height: 54,
        borderRadius: 99,
        left: 150,
        top: 26 + Math.sin(t * 0.8) * 4,
        background: C.beigeLight,
        boxShadow: `0 0 40px ${C.beigeLight}`,
      }}
    />
    <div style={{ position: "absolute", inset: 0, background: C.teal, clipPath: "polygon(0 100%, 30% 52%, 52% 78%, 74% 40%, 100% 100%)" }} />
    <div style={{ position: "absolute", inset: 0, background: C.bleu, opacity: 0.85, clipPath: "polygon(0 100%, 18% 76%, 44% 92%, 70% 66%, 100% 100%)" }} />
    <div
      style={{
        position: "absolute",
        right: 12,
        bottom: 12,
        width: 38,
        height: 38,
        borderRadius: 99,
        background: "rgba(7,6,11,0.55)",
        display: "grid",
        placeItems: "center",
      }}
    >
      <div style={{ width: 0, height: 0, borderLeft: "13px solid white", borderTop: "8px solid transparent", borderBottom: "8px solid transparent", marginLeft: 4 }} />
    </div>
  </div>
);

const CODE: [string, string][][] = [
  [["const ", C.violetLight], ["post", C.fg], [" = ", C.fg3], ["await ", C.violetLight], ["ia", C.bleu], [".creer({", C.fg]],
  [["  canal: ", C.fg2], ['"email"', C.beige], [",", C.fg3]],
  [["  ton: ", C.fg2], ['"chaleureux"', C.beige], [",", C.fg3]],
  [["});", C.fg]],
];
const CodeArt: React.FC<{ p: number }> = ({ p }) => {
  const total = CODE.flat().reduce((n, s) => n + s[0].length, 0);
  let budget = Math.floor(total * p);
  return (
    <div style={{ fontFamily: "ui-monospace, Consolas, monospace", fontSize: 17, lineHeight: 1.75, whiteSpace: "pre" }}>
      {CODE.map((line, i) => (
        <div key={i}>
          {line.map(([txt, col], j) => {
            const shown = txt.slice(0, Math.max(0, budget));
            budget -= txt.length;
            return (
              <span key={j} style={{ color: col }}>
                {shown}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
};

const AudioArt: React.FC<{ t: number }> = ({ t }) => (
  <div style={{ height: 150, display: "flex", alignItems: "center", gap: 5, justifyContent: "center" }}>
    {Array.from({ length: 26 }).map((_, i) => {
      const h = 18 + Math.abs(Math.sin(t * 3.1 + i * 0.55) * Math.sin(t * 1.3 + i * 0.21)) * 110;
      return (
        <div
          key={i}
          style={{
            width: 6,
            height: h,
            borderRadius: 4,
            backgroundImage: `linear-gradient(180deg, ${C.beige}, ${C.violet})`,
          }}
        />
      );
    })}
  </div>
);

type CardDef = { at: number; label: string; icon: React.ReactNode; accent: string };
const CARDS: CardDef[] = [
  { at: 12.5, label: "Textes", icon: <IconText size={26} />, accent: C.violetLight },
  { at: 13.3, label: "Images & vidéo", icon: <IconImage size={26} />, accent: C.beige },
  { at: 15.2, label: "Code", icon: <IconCode size={26} />, accent: C.bleu },
  { at: 17.3, label: "Audio", icon: <IconWave size={26} />, accent: C.bleuVert },
];

const Card: React.FC<{ i: number; def: CardDef }> = ({ i, def }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const p = interpolate(frame, [def.at * fps, (def.at + 1.1) * fps], [0, 1], { ...clamp, easing: EASE });
  const q = useExit(OUT, 0.5);
  const art = interpolate(frame, [(def.at + 0.5) * fps, (def.at + 3.2) * fps], [0, 1], clamp);
  const slot = i - 1.5;
  const x = 1130 + slot * 330;
  const y = 436 + Math.abs(slot) * 14;
  const startX = 1140;
  const startY = 805;
  const cx = startX + (x - startX) * p;
  const cy = startY + (y - startY) * p + Math.sin(t * 0.9 + i) * 6 * p;
  return (
    <div
      style={{
        position: "absolute",
        left: cx - 150,
        top: cy - 170,
        width: 300,
        height: 340,
        transform: `perspective(1400px) rotateY(${-slot * 12}deg) rotateX(${(1 - p) * 30}deg) translateZ(${-Math.abs(slot) * 30}px)`,
        scale: String(0.5 + 0.5 * p),
        opacity: p * (1 - q),
        filter: `blur(${(1 - p) * 6 + q * 6}px)`,
        borderRadius: 28,
        padding: 22,
        background: "linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.025)), rgba(12,10,18,0.78)",
        border: `1px solid ${C.hairline2}`,
        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.12), 0 30px 80px -30px ${def.accent}99`,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <div style={{ height: 180 }}>
        {i === 0 && <TextArt p={art} />}
        {i === 1 && <ImageArt t={t} />}
        {i === 2 && <CodeArt p={art} />}
        {i === 3 && <AudioArt t={t} />}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 28, fontWeight: 700, color: C.fg, whiteSpace: "nowrap" }}>
        <span style={{ color: def.accent, display: "flex" }}>{def.icon}</span>
        {def.label}
      </div>
    </div>
  );
};

const PromptBar: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const n = Math.floor(interpolate(t, [TYPE_FROM, TYPE_TO], [0, PROMPT.length], clamp));
  const caret = Math.floor(t * 2) % 2 === 0 || (t > TYPE_FROM && t < TYPE_TO);
  const sent = interpolate(t, [12.2, 12.6], [0, 1], clamp);
  return (
    <Reveal at={6.6} out={OUT} style={{ position: "absolute", left: 640, top: 760, width: 1080 }}>
      <div
        style={{
          position: "relative",
          height: 92,
          borderRadius: 999,
          border: `1px solid rgba(219,172,240,${0.25 + sent * 0.4})`,
          background: "rgba(14,12,21,0.75)",
          boxShadow: `0 0 0 6px rgba(181,141,224,${0.06 + sent * 0.08}), 0 30px 80px -30px ${C.violet}`,
          display: "flex",
          alignItems: "center",
          padding: "0 16px 0 36px",
          gap: 20,
        }}
      >
        <span style={{ color: C.violetLight, display: "flex" }}>
          <IconSparkle size={30} />
        </span>
        <div style={{ flex: 1, fontSize: 34, fontWeight: 500, color: C.fg }}>
          {PROMPT.slice(0, n)}
          <span style={{ opacity: caret ? 1 : 0, color: C.violetLight }}>|</span>
        </div>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 99,
            backgroundImage: GRAD.violet,
            display: "grid",
            placeItems: "center",
            scale: String(1 - Math.sin(Math.PI * sent) * 0.1),
          }}
        >
          <div style={{ width: 0, height: 0, borderLeft: "16px solid #140d1f", borderTop: "10px solid transparent", borderBottom: "10px solid transparent", marginLeft: 5 }} />
        </div>
        <Reveal at={10.6} y={10} style={{ position: "absolute", left: 30, top: -64 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 26, fontWeight: 600 }}>
            <span style={{ padding: "6px 16px", borderRadius: 999, backgroundImage: GRAD.violet, color: "#140d1f" }}>Prompt</span>
            <span style={{ color: C.fg2, fontWeight: 500 }}>= une consigne en langage naturel</span>
          </div>
        </Reveal>
      </div>
    </Reveal>
  );
};

const Verdict: React.FC<{ at: number; ok: boolean; children: React.ReactNode }> = ({ at, ok, children }) => (
  <Reveal at={at} out={OUT} y={12}>
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 14,
        padding: "12px 24px 12px 14px",
        borderRadius: 999,
        border: `1px solid ${ok ? "rgba(106,222,177,0.45)" : "rgba(251,194,173,0.45)"}`,
        background: ok ? "rgba(106,222,177,0.08)" : "rgba(251,194,173,0.07)",
        fontSize: 25,
        whiteSpace: "nowrap",
        fontWeight: 600,
      }}
    >
      <span
        style={{
          width: 36,
          height: 36,
          borderRadius: 99,
          display: "grid",
          placeItems: "center",
          background: ok ? C.bleuVert : C.beige,
          color: "#140d1f",
        }}
      >
        {ok ? <IconCheck size={22} color="#140d1f" /> : <IconX size={22} color="#140d1f" />}
      </span>
      {children}
    </div>
  </Reveal>
);

export const Create: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const strike = interpolate(frame, [19.0 * fps, 19.6 * fps], [0, 1], { ...clamp, easing: EASE });
  return (
    <AbsoluteFill style={{ ...baseText }}>
      <RiseLines
        at={0.3}
        out={OUT}
        style={{ position: "absolute", left: 160, top: 150, fontSize: 84, fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1 }}
        lines={[
          <span key="l">
            Créer du <GradText>contenu original</GradText>
          </span>,
        ]}
      />
      {CARDS.map((d, i) => (
        <Card key={d.label} i={i} def={d} />
      ))}
      <PromptBar />
      <div style={{ position: "absolute", left: 620, right: 96, top: 892, display: "flex", justifyContent: "center", gap: 14 }}>
        <Verdict at={18.0} ok={false}>
          <span style={{ position: "relative" }}>
            Un simple copier-coller
            <span style={{ position: "absolute", left: 0, top: "52%", height: 3, width: `${strike * 100}%`, background: C.beige }} />
          </span>
        </Verdict>
        <Verdict at={21.4} ok>
          Une synthèse de ses apprentissages
        </Verdict>
        <Reveal at={24.0} out={OUT} y={10} style={{ alignSelf: "center" }}>
          <span style={{ fontSize: 27, fontWeight: 700 }}>
            → <GradText>une réponse inédite</GradText>
          </span>
        </Reveal>
      </div>
    </AbsoluteFill>
  );
};
