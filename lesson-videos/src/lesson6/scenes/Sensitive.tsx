import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { IconBan } from "../../components/icons";
import { Eyebrow, GradText, Reveal, RiseLines, baseText, useExit } from "../../components/ui";
import { C, EASE, GRAD, SAFE_L, clamp } from "../../theme";

// 114,4 → 142,9 s. Temps locaux = temps audio − 114,4.
const OUT = 27.95;

const ITEMS = [
  { at: 12.6, label: "Origine raciale ou ethnique" },
  { at: 14.0, label: "Opinions politiques" },
  { at: 15.6, label: "Convictions religieuses ou philosophiques" },
  { at: 16.9, label: "Données génétiques" },
  { at: 17.8, label: "Données biométriques" },
  { at: 18.9, label: "Données de santé" },
  { at: 19.4, label: "Vie ou orientation sexuelle" },
];

const Shield: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const p = interpolate(frame, [4.6 * fps, 5.8 * fps], [0, 1], { ...clamp, easing: EASE });
  const q = useExit(OUT, 0.5);
  const lock = interpolate(frame, [10.2 * fps, 10.7 * fps], [0, 1], { ...clamp, easing: EASE });
  return (
    <div style={{ position: "absolute", left: SAFE_L + 40, top: 380, width: 300, height: 360, perspective: 1000 }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: p * (1 - q),
          transform: `rotateY(${(1 - p) * 90 + Math.sin(t * 0.6) * 14}deg) scale(${0.8 + 0.2 * p})`,
        }}
      >
        <svg viewBox="0 0 100 120" width={300} height={360}>
          <defs>
            <linearGradient id="sh" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor={C.beigeLight} />
              <stop offset="0.5" stopColor={C.beige} />
              <stop offset="1" stopColor={C.violet} />
            </linearGradient>
          </defs>
          <path d="M50 4 L92 18 V58 C92 86 72 104 50 116 C28 104 8 86 8 58 V18 Z" fill="url(#sh)" opacity={0.95} />
          <path d="M50 12 L84 23 V58 C84 81 68 96 50 106 C32 96 16 81 16 58 V23 Z" fill="#140d1f" opacity={0.85} />
          {/* cadenas : l'anse se referme quand la voix dit "interdite" */}
          <path
            d={`M38 ${56 - (1 - lock) * 8} V46 a12 12 0 0 1 24 0 V56`}
            fill="none"
            stroke={C.beige}
            strokeWidth={5}
            strokeLinecap="round"
          />
          <rect x="32" y="56" width="36" height="30" rx="6" fill={C.beige} />
          <circle cx="50" cy="69" r="4" fill="#140d1f" />
          <rect x="48.5" y="70" width="3" height="8" rx="1.5" fill="#140d1f" />
        </svg>
      </div>
    </div>
  );
};

export const Sensitive: React.FC = () => (
  <AbsoluteFill style={{ ...baseText }}>
    <div style={{ position: "absolute", left: 160, top: 110 }}>
      <Reveal at={0.2} out={OUT}>
        <Eyebrow color={C.beige}>Au cœur des données personnelles</Eyebrow>
      </Reveal>
      <RiseLines
        at={0.4}
        out={OUT}
        style={{ marginTop: 16, fontSize: 58, fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1.04 }}
        lines={[
          <span key="t">
            Les données <GradText grad={GRAD.beige}>sensibles</GradText>
          </span>,
        ]}
      />
      <Reveal at={4.7} out={OUT} style={{ marginTop: 10 }}>
        <div style={{ fontSize: 26, color: C.fg2, fontWeight: 500 }}>Une catégorie ultra protégée par le RGPD.</div>
      </Reveal>
    </div>

    <Shield />

    <Reveal at={7.6} out={OUT} y={14} style={{ position: "absolute", left: 1030, top: 330, width: 790 }}>
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 12,
          padding: "12px 22px 12px 14px",
          borderRadius: 999,
          border: "1px solid rgba(251,194,173,0.55)",
          background: "rgba(251,194,173,0.12)",
          fontSize: 25,
          fontWeight: 800,
          color: C.beige,
        }}
      >
        <IconBan size={26} color={C.beige} /> Collecte et traitement strictement interdits par défaut
      </div>
    </Reveal>
    <div style={{ position: "absolute", left: 1030, top: 420, width: 790, display: "flex", flexDirection: "column", gap: 12 }}>
      {ITEMS.map((it) => (
        <Reveal key={it.label} at={it.at} out={OUT} y={10}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 27, fontWeight: 600 }}>
            <span style={{ width: 10, height: 10, borderRadius: 99, background: C.beige, boxShadow: `0 0 12px ${C.beige}` }} />
            {it.label}
          </div>
        </Reveal>
      ))}
    </div>
    <Reveal at={20.4} out={OUT} style={{ position: "absolute", left: SAFE_L, top: 860, width: 1200 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
        <span style={{ fontSize: 24, color: C.fg2, fontWeight: 600 }}>Sauf exception très encadrée :</span>
        {[
          { at: 25.1, l: "consentement explicite" },
          { at: 26.6, l: "obligation légale" },
        ].map((e) => (
          <Reveal key={e.l} at={e.at} y={8}>
            <span style={{ padding: "8px 18px", borderRadius: 999, background: "rgba(255,255,255,0.08)", border: `1px solid ${C.hairline2}`, fontSize: 22, fontWeight: 700 }}>
              {e.l}
            </span>
          </Reveal>
        ))}
      </div>
    </Reveal>
  </AbsoluteFill>
);
