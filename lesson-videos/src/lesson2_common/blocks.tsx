import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { Glass, Reveal, baseText, useExit } from "../components/ui";
import { C, EASE, GRAD, clamp } from "../theme";
import { ToolLogo } from "../rs6776/kit";
import { TOOLS } from "../rs6776/tools";

// Briques d'habillage propres aux vidéos du module 2 (leçons 2.1 à 2.5), en
// complément de ../rs6776/kit : pastilles, prompt qui se construit ligne par
// ligne, colonnes comparées, tableau révélé, bandeau iris. Tout apparaît au mot
// qui le nomme (instants passés en secondes, temps local de la scène).

const mono = "ui-monospace, Menlo, monospace";

export const tool = (id: string) => TOOLS.find((t) => t.id === id)!;

// Rangée de pastilles qui s'allument une à une.
export const Chips: React.FC<{ items: { at: number; label: string; tint?: string }[]; out: number; top?: number; left?: number; right?: number; size?: number; wrap?: boolean }> = ({ items, out, top = 420, left = 120, right = 120, size = 40, wrap = true }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const q = useExit(out, 0.5);
  return (
    <div style={{ ...baseText, position: "absolute", top, left, right, display: "flex", flexWrap: wrap ? "wrap" : "nowrap", justifyContent: "center", gap: 22, opacity: 1 - q }}>
      {items.map((it, i) => {
        const p = interpolate(frame, [it.at * fps, (it.at + 0.6) * fps], [0, 1], { ...clamp, easing: EASE });
        const tint = it.tint ?? [C.violet, C.bleu, C.bleuVert, C.beige, C.violetLight][i % 5];
        return (
          <div key={it.label} style={{ padding: `${size * 0.5}px ${size * 0.95}px`, borderRadius: 999, fontSize: size, fontWeight: 700, letterSpacing: "-0.02em", opacity: 0.12 + 0.88 * p, translate: `0px ${(1 - p) * 24}px`, background: `${tint}${p > 0.5 ? "26" : "0d"}`, border: `1px solid ${tint}${p > 0.5 ? "99" : "33"}`, color: C.fg }}>
            {it.label}
          </div>
        );
      })}
    </div>
  );
};

// Bandeau au dégradé iris (exercice de l'écrit, message clé).
export const IrisBanner: React.FC<{ at: number; out: number; text: string; top?: number; size?: number }> = ({ at, out, text, top = 820, size = 32 }) => (
  <Reveal at={at} out={out} style={{ position: "absolute", left: 0, right: 0, top, display: "flex", justifyContent: "center" }}>
    <div style={{ ...baseText, padding: "22px 44px", borderRadius: 999, backgroundImage: GRAD.iris, color: C.ink, fontSize: size, fontWeight: 700 }}>{text}</div>
  </Reveal>
);

// Bandeau d'alerte (corail) ou de succès (vert), plus discret.
export const Note: React.FC<{ at: number; out: number; text: string; tone?: "alert" | "ok" | "info"; top?: number; left?: number; right?: number; size?: number }> = ({ at, out, text, tone = "alert", top = 860, left = 120, right = 120, size = 30 }) => {
  const c = tone === "alert" ? C.beige : tone === "ok" ? C.bleuVert : C.bleu;
  return (
    <Reveal at={at} out={out} style={{ position: "absolute", left, right, top, display: "flex", justifyContent: "center" }}>
      <div style={{ ...baseText, padding: "18px 34px", borderRadius: 22, border: `1px solid ${c}88`, background: `${c}1a`, fontSize: size, fontWeight: 600, color: C.fg }}>
        <span style={{ color: c, marginRight: 14 }}>●</span>{text}
      </div>
    </Reveal>
  );
};

// Petite mention en bas à droite (« Exemple fictif », « Exemple du cours »…).
export const Mention: React.FC<{ text: string; out: number; at?: number }> = ({ text, out, at = 0.6 }) => (
  <Reveal at={at} out={out} style={{ position: "absolute", right: 120, top: 975 }}>
    <div style={{ ...baseText, fontSize: 22, letterSpacing: "0.12em", textTransform: "uppercase", color: C.fg3, fontWeight: 600 }}>{text}</div>
  </Reveal>
);

// Un prompt affiché comme saisi (police à chasse fixe), éventuellement barré.
export const PromptBox: React.FC<{ at: number; out: number; text: string; label?: string; struck?: number; top?: number; left?: number; width?: number; size?: number }> = ({ at, out, text, label = "Le prompt", struck, top = 340, left = 120, width = 1680, size = 36 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = struck === undefined ? 0 : interpolate(frame, [struck * fps, (struck + 0.5) * fps], [0, 1], { ...clamp, easing: EASE });
  return (
    <Reveal at={at} out={out} style={{ position: "absolute", left, top, width }}>
      <Glass glow={C.violet} style={{ ...baseText, padding: "28px 38px", borderRadius: 26, opacity: 1 - 0.45 * s }}>
        <div style={{ fontSize: 20, letterSpacing: "0.14em", textTransform: "uppercase", color: C.fg3, fontWeight: 600 }}>{label}</div>
        <div style={{ marginTop: 12, fontSize: size, fontWeight: 600, lineHeight: 1.25, fontFamily: mono, position: "relative" }}>
          › {text}
          <span style={{ position: "absolute", left: 0, top: "52%", height: 4, width: `${s * 100}%`, background: C.beige, borderRadius: 4 }} />
        </div>
      </Glass>
    </Reveal>
  );
};

// Prompt qui se construit ligne par ligne : étiquette + texte, ligne active en avant.
export const PromptBuild: React.FC<{ rows: { at: number; tag: string; text: string; why?: string }[]; out: number; top?: number; left?: number; width?: number; size?: number; gap?: number }> = ({ rows, out, top = 360, left = 120, width = 1680, size = 32, gap = 16 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const q = useExit(out, 0.5);
  const tints = [C.violet, C.bleu, C.bleuVert, C.beige, C.violetLight, C.teal, C.violetMid];
  return (
    <div style={{ ...baseText, position: "absolute", left, top, width, display: "flex", flexDirection: "column", gap, opacity: 1 - q }}>
      {rows.map((r, i) => {
        const p = interpolate(frame, [r.at * fps, (r.at + 0.6) * fps], [0, 1], { ...clamp, easing: EASE });
        const next = rows[i + 1]?.at ?? out;
        const active = t >= r.at && t < next;
        const tint = tints[i % tints.length];
        return (
          <div key={r.tag + i} style={{ display: "grid", gridTemplateColumns: `${size * 7}px 1fr${r.why ? " auto" : ""}`, alignItems: "center", gap: 24, opacity: p, translate: `${(1 - p) * 30}px 0px`, filter: `blur(${(1 - p) * 6}px)` }}>
            <div style={{ padding: "10px 18px", borderRadius: 14, textAlign: "center", fontSize: size * 0.8, fontWeight: 700, background: `${tint}${active ? "40" : "1f"}`, border: `1px solid ${tint}88`, color: C.fg }}>{r.tag}</div>
            <div style={{ fontSize: size, fontWeight: 600, lineHeight: 1.2, color: active ? C.fg : C.fg2 }}>{r.text}</div>
            {r.why && <div style={{ fontSize: size * 0.72, color: tint, fontWeight: 600, maxWidth: 420, textAlign: "right" }}>{r.why}</div>}
          </div>
        );
      })}
    </div>
  );
};

// Deux colonnes comparées ; tone : gauche en alerte, droite en succès (ou l'inverse).
export const TwoCols: React.FC<{ left: { at: number; title: string; text?: string; tint?: string; logo?: string }; right: { at: number; title: string; text?: string; tint?: string; logo?: string }; out: number; top?: number; height?: number }> = ({ left, right, out, top = 380, height = 360 }) => (
  <div style={{ ...baseText, position: "absolute", left: 120, right: 120, top, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
    {[left, right].map((c) => {
      const tint = c.tint ?? C.violet;
      return (
        <Reveal key={c.title} at={c.at} out={out}>
          <Glass glow={tint} style={{ height, padding: "36px 42px", borderRadius: 30, borderColor: `${tint}88`, overflow: "hidden" }}>
            {c.logo && <div style={{ marginBottom: 22 }}><ToolLogo src={tool(c.logo).logo} size={96} glow={tool(c.logo).accent} /></div>}
            <div style={{ fontSize: 44, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.08, color: C.fg }}>{c.title}</div>
            {c.text && <div style={{ marginTop: 16, fontSize: 30, lineHeight: 1.3, color: C.fg2, fontWeight: 500 }}>{c.text}</div>}
          </Glass>
        </Reveal>
      );
    })}
  </div>
);

// Tableau dont les lignes apparaissent au mot qui les nomme.
export const RevealTable: React.FC<{ headers: string[]; rows: { at: number; cells: string[] }[]; out: number; top?: number; left?: number; right?: number; size?: number; headAt?: number; cols?: string }> = ({ headers, rows, out, top = 360, left = 120, right = 120, size = 28, headAt = 0.5, cols }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const q = useExit(out, 0.5);
  const grid = cols ?? `repeat(${headers.length}, 1fr)`;
  const hp = interpolate(frame, [headAt * fps, (headAt + 0.6) * fps], [0, 1], { ...clamp, easing: EASE });
  return (
    <div style={{ ...baseText, position: "absolute", left, right, top, opacity: 1 - q }}>
      <Glass glow={C.bleu} style={{ padding: "10px 0", borderRadius: 28, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: grid, gap: 24, padding: "18px 36px", opacity: hp, fontSize: size * 0.75, letterSpacing: "0.12em", textTransform: "uppercase", color: C.fg3, fontWeight: 700 }}>
          {headers.map((h) => <div key={h}>{h}</div>)}
        </div>
        {rows.map((r, i) => {
          const p = interpolate(frame, [r.at * fps, (r.at + 0.6) * fps], [0, 1], { ...clamp, easing: EASE });
          return (
            <div key={i} style={{ display: "grid", gridTemplateColumns: grid, gap: 24, padding: "18px 36px", borderTop: `1px solid ${C.hairline}`, opacity: p, translate: `0px ${(1 - p) * 16}px`, fontSize: size, lineHeight: 1.25, fontWeight: 500 }}>
              {r.cells.map((c, k) => <div key={k} style={{ color: k === 0 ? C.fg : C.fg2, fontWeight: k === 0 ? 700 : 500 }}>{c}</div>)}
            </div>
          );
        })}
      </Glass>
    </div>
  );
};

// Logos d'outils côte à côte, chacun avec une légende.
export const LogoRow: React.FC<{ items: { at: number; id: string; caption?: string }[]; out: number; top?: number; size?: number }> = ({ items, out, top = 420, size = 130 }) => (
  <div style={{ ...baseText, position: "absolute", left: 0, right: 0, top, display: "flex", justifyContent: "center", gap: 70 }}>
    {items.map((it) => {
      const t = tool(it.id);
      return (
        <Reveal key={it.id} at={it.at} out={out}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18, maxWidth: 420 }}>
            <ToolLogo src={t.logo} size={size} glow={t.accent} />
            <div style={{ fontSize: 36, fontWeight: 700 }}>{t.name}</div>
            {it.caption && <div style={{ fontSize: 26, color: C.fg2, fontWeight: 500, textAlign: "center", lineHeight: 1.25 }}>{it.caption}</div>}
          </div>
        </Reveal>
      );
    })}
  </div>
);

