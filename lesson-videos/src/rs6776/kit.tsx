import React from "react";
import { AbsoluteFill, Img, OffthreadVideo, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Glass, GradText, Reveal, baseText, useEnter, useExit } from "../components/ui";
import { AVATAR_ZONE, C, EASE, GRAD, clamp } from "../theme";

// Briques partagées des vidéos RS6776 (formation complète) : avatar plein cadre
// ou en médaillon, bandeau de présentation, cartes qui apparaissent au mot qui
// les nomme, titres de scène.

/* ---------------- Avatar ---------------- */

const AvatarClip: React.FC<{ src: string; style?: React.CSSProperties }> = ({ src, style }) => (
  <OffthreadVideo src={staticFile(src)} muted style={{ width: "100%", height: "100%", objectFit: "cover", ...style }} />
);

// Raul plein cadre, avec une entrée en fondu et une légère vignette.
// `shrinkAt` (s) : il glisse vers la gauche dans une carte pour laisser place
// à un contenu à droite (récapitulatif de clôture).
export const AvatarFull: React.FC<{ src?: string; dur: number; shrinkAt?: number }> = ({ src, dur, shrinkAt }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fadeIn = interpolate(frame, [0, 0.5 * fps], [0, 1], clamp);
  const fadeOut = interpolate(frame, [(dur - 0.1) * fps, (dur + 0.35) * fps], [0, 1], clamp);
  const s = shrinkAt === undefined ? 0 : interpolate(frame, [shrinkAt * fps, (shrinkAt + 1) * fps], [0, 1], { ...clamp, easing: EASE });
  const card = { left: 80 * s, top: 150 * s, w: 1920 - (1920 - 980) * s, h: 1080 - (1080 - 600) * s, r: 36 * s };
  return (
    <AbsoluteFill style={{ opacity: fadeIn * (1 - fadeOut) }}>
      <div style={{ position: "absolute", left: card.left, top: card.top, width: card.w, height: card.h, borderRadius: card.r, overflow: "hidden", boxShadow: s > 0 ? `0 40px 120px -40px ${C.violet}88` : "none", border: s > 0 ? `1px solid ${C.hairline2}` : "none" }}>
        {src ? <AvatarClip src={src} /> : <Placeholder />}
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(120% 90% at 50% 45%, transparent 60%, rgba(7,6,11,0.55) 100%)" }} />
      </div>
    </AbsoluteFill>
  );
};

// Raul en médaillon dans la zone réservée (bas gauche), liseré iris.
export const AvatarPip: React.FC<{ src?: string; dur: number }> = ({ src, dur }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = interpolate(frame, [0, 0.7 * fps], [0, 1], { ...clamp, easing: EASE });
  const q = interpolate(frame, [(dur - 0.1) * fps, (dur + 0.35) * fps], [0, 1], clamp);
  const w = 520;
  const h = Math.round((w * 9) / 16);
  return (
    <div style={{ position: "absolute", left: 56, top: AVATAR_ZONE.y + AVATAR_ZONE.h - h - 70, width: w, height: h, padding: 3, borderRadius: 30, background: GRAD.iris, opacity: p * (1 - q), scale: String(0.92 + 0.08 * p), boxShadow: `0 30px 80px -30px ${C.violet}` }}>
      <div style={{ width: "100%", height: "100%", borderRadius: 27, overflow: "hidden", background: C.ink2 }}>
        {src ? <AvatarClip src={src} /> : <Placeholder />}
      </div>
    </div>
  );
};

const Placeholder: React.FC = () => (
  <AbsoluteFill style={{ ...baseText, background: C.ink2, display: "grid", placeItems: "center", color: C.fg3, fontSize: 28 }}>Avatar en cours de rendu</AbsoluteFill>
);

// Bandeau « Raul, Formateur IA » à droite, quelques secondes à l'ouverture.
export const NameBanner: React.FC<{ from?: number; to?: number }> = ({ from = 0.6, to = 5 }) => {
  const p = useEnter(from, 0.8);
  const q = useExit(to, 0.6);
  return (
    <div style={{ ...baseText, position: "absolute", right: 96, bottom: 150, opacity: p * (1 - q), translate: `${(1 - p) * 60 - q * 30}px 0px` }}>
      <Glass style={{ padding: "26px 40px 26px 34px", borderRadius: 26 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
          <div style={{ width: 8, height: 64, borderRadius: 8, backgroundImage: GRAD.iris }} />
          <div>
            <div style={{ fontSize: 40, fontWeight: 700, letterSpacing: "-0.02em" }}>Raul</div>
            <div style={{ fontSize: 26, color: C.fg2, fontWeight: 500 }}>Formateur IA</div>
          </div>
        </div>
      </Glass>
    </div>
  );
};

/* ---------------- Scènes ---------------- */

// Titre de scène : petite étiquette + titre avec un mot en dégradé.
export const SceneTitle: React.FC<{ eyebrow: string; before?: string; accent: string; after?: string; out: number; top?: number }> = ({ eyebrow, before, accent, after, out, top = 150 }) => (
  <div style={{ ...baseText, position: "absolute", left: 120, right: 120, top }}>
    <Reveal at={0.1} out={out}>
      <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: "0.16em", textTransform: "uppercase", color: C.fg3 }}>{eyebrow}</div>
    </Reveal>
    <Reveal at={0.25} out={out} y={30}>
      <div style={{ marginTop: 14, fontSize: 68, fontWeight: 700, letterSpacing: "-0.035em", lineHeight: 1.04 }}>
        {before ? `${before} ` : ""}<GradText>{accent}</GradText>{after ? ` ${after}` : ""}
      </div>
    </Reveal>
  </div>
);

export type CardSpec = { at: number; title: string; text?: string; tint?: string; icon?: React.ReactNode; kicker?: string };

// Rangée de cartes « verre » qui apparaissent une à une, au mot qui les nomme.
// La carte dont parle la voix est mise en avant jusqu'à l'apparition suivante.
export const CueCards: React.FC<{ cards: CardSpec[]; out: number; top?: number; left?: number; right?: number; height?: number; cols?: number }> = ({ cards, out, top = 360, left = 120, right = 120, height = 420, cols }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const q = useExit(out, 0.5);
  const n = cols ?? cards.length;
  return (
    <div style={{ ...baseText, position: "absolute", left, right, top, display: "grid", gridTemplateColumns: `repeat(${n}, 1fr)`, gap: 28, opacity: 1 - q, filter: `blur(${q * 6}px)` }}>
      {cards.map((c, i) => {
        const p = interpolate(frame, [c.at * fps, (c.at + 0.8) * fps], [0, 1], { ...clamp, easing: EASE });
        const next = Math.min(out, ...cards.filter((x) => x.at > c.at).map((x) => x.at));
        const active = t >= c.at && t < next;
        const tint = c.tint ?? [C.violet, C.bleu, C.bleuVert, C.beige, C.violetLight][i % 5];
        return (
          <div key={c.title} style={{ opacity: p, translate: `0px ${(1 - p) * 36}px`, scale: String(0.96 + 0.04 * p + (active ? 0.02 : 0)), filter: `blur(${(1 - p) * 8}px)` }}>
            <Glass glow={tint} style={{ height, padding: "40px 38px", overflow: "hidden", borderColor: active ? `${tint}99` : C.hairline2 }}>
              <div style={{ position: "absolute", width: 520, height: 520, right: -220, bottom: -260, borderRadius: "50%", background: `radial-gradient(circle, ${tint}${active ? "44" : "22"}, transparent 65%)` }} />
              {c.kicker && <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: tint, marginBottom: 14 }}>{c.kicker}</div>}
              {c.icon && <div style={{ width: 76, height: 76, borderRadius: 22, display: "grid", placeItems: "center", background: `${tint}26`, border: `1px solid ${tint}66`, color: C.fg, marginBottom: 26 }}>{c.icon}</div>}
              <div style={{ position: "relative", fontSize: 40, fontWeight: 700, letterSpacing: "-0.025em", lineHeight: 1.08, color: active ? C.fg : C.fg2 }}>{c.title}</div>
              {c.text && <div style={{ position: "relative", marginTop: 16, fontSize: 27, lineHeight: 1.32, color: active ? C.fg2 : C.fg3, fontWeight: 500 }}>{c.text}</div>}
            </Glass>
          </div>
        );
      })}
    </div>
  );
};

// Liste numérotée (pastilles iris) qui se coche au fil de la voix.
export const CueSteps: React.FC<{ steps: { at: number; text: string }[]; out: number; left?: number; top?: number; width?: number; size?: number }> = ({ steps, out, left = 700, top = 330, width = 1100, size = 38 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const q = useExit(out, 0.5);
  return (
    <div style={{ ...baseText, position: "absolute", left, top, width, display: "flex", flexDirection: "column", gap: 22, opacity: 1 - q }}>
      {steps.map((s, i) => {
        const p = interpolate(frame, [s.at * fps, (s.at + 0.7) * fps], [0, 1], { ...clamp, easing: EASE });
        const done = steps[i + 1] ? t >= steps[i + 1].at : t >= s.at + 2;
        return (
          <div key={s.text} style={{ display: "flex", alignItems: "center", gap: 26, opacity: p, translate: `${(1 - p) * 40}px 0px`, filter: `blur(${(1 - p) * 6}px)` }}>
            <div style={{ width: size * 1.6, height: size * 1.6, borderRadius: 99, flexShrink: 0, display: "grid", placeItems: "center", backgroundImage: GRAD.iris, color: C.ink, fontWeight: 800, fontSize: size * 0.7 }}>{done ? "✓" : i + 1}</div>
            <div style={{ fontSize: size, fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1.15, color: done ? C.fg2 : C.fg }}>{s.text}</div>
          </div>
        );
      })}
    </div>
  );
};

// Logo d'outil sur sa tuile.
export const ToolLogo: React.FC<{ src: string; size?: number; glow?: string }> = ({ src, size = 120, glow = C.violet }) => (
  <div style={{ width: size, height: size, borderRadius: size * 0.27, background: "#FDFBF9", display: "grid", placeItems: "center", boxShadow: `0 24px 60px -18px ${glow}aa` }}>
    <Img src={staticFile(src)} style={{ width: size * 0.58, height: size * 0.58, objectFit: "contain" }} />
  </div>
);
