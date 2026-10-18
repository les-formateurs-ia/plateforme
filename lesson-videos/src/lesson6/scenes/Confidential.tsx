import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { IconBriefcase, IconUser } from "../../components/icons";
import { Eyebrow, Glass, GradText, Reveal, RiseLines, baseText, useExit } from "../../components/ui";
import { C, EASE, SAFE_L, clamp } from "../../theme";

// 36 → 76,4 s. Temps locaux = temps audio − 36.
const OUT = 39.85;

const HL: React.FC<{ at: number; color?: string; children: React.ReactNode }> = ({ at, color = "rgba(219,172,240,0.32)", children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = interpolate(frame, [at * fps, (at + 0.5) * fps], [0, 1], { ...clamp, easing: EASE });
  return (
    <span
      style={{
        backgroundImage: `linear-gradient(90deg, ${color}, ${color})`,
        backgroundRepeat: "no-repeat",
        backgroundSize: `${p * 100}% 100%`,
        borderRadius: 6,
        padding: "0 4px",
        color: p > 0.5 ? C.fg : undefined,
        fontWeight: p > 0.5 ? 700 : undefined,
      }}
    >
      {children}
    </span>
  );
};

type Group = { at: number; title: string; sub: string; icon: React.ReactNode; color: string; items: { at: number; label: string }[] };
const GROUPS: Group[] = [
  {
    at: 16.2,
    title: "Données internes",
    sub: "produites par l'entreprise",
    icon: <IconBriefcase size={30} />,
    color: C.violetLight,
    items: [
      { at: 21.4, label: "Résultats financiers" },
      { at: 22.2, label: "Grilles tarifaires" },
      { at: 24.4, label: "Politique de sécurité" },
      { at: 26.9, label: "Fichiers RH" },
      { at: 27.6, label: "Mails internes" },
    ],
  },
  {
    at: 27.3,
    title: "Données externes",
    sub: "clients, fournisseurs, prospects",
    icon: <IconUser size={30} />,
    color: C.bleu,
    items: [
      { at: 35.6, label: "Accords de confidentialité" },
      { at: 37.4, label: "Documents commerciaux" },
      { at: 38.3, label: "Données clients et prospects" },
      { at: 38.8, label: "Propriété des partenaires" },
      { at: 39.2, label: "Contrats" },
    ],
  },
];

const GroupCard: React.FC<{ g: Group; i: number }> = ({ g, i }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = interpolate(frame, [g.at * fps, (g.at + 0.9) * fps], [0, 1], { ...clamp, easing: EASE });
  const q = useExit(OUT, 0.5);
  return (
    <div style={{ position: "absolute", left: SAFE_L + i * 610, top: 560, width: 590, perspective: 1300 }}>
      <div
        style={{
          borderRadius: 26,
          padding: "24px 28px",
          opacity: p * (1 - q),
          transform: `rotateY(${(1 - p) * (i === 0 ? 30 : -30)}deg) translateY(${(1 - p) * 30}px)`,
          border: `1.5px solid ${g.color}77`,
          background: `linear-gradient(180deg, ${g.color}18, rgba(255,255,255,0.02)), rgba(12,10,18,0.86)`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ width: 52, height: 52, borderRadius: 16, display: "grid", placeItems: "center", background: `${g.color}22`, color: g.color }}>{g.icon}</span>
          <div>
            <div style={{ fontSize: 30, fontWeight: 800 }}>{g.title}</div>
            <div style={{ fontSize: 19, color: C.fg3, fontWeight: 600 }}>{g.sub}</div>
          </div>
        </div>
        <div style={{ marginTop: 18, display: "flex", flexWrap: "wrap", gap: 10 }}>
          {g.items.map((it) => (
            <Reveal key={it.label} at={it.at} y={8}>
              <span style={{ display: "inline-flex", padding: "8px 16px", borderRadius: 999, background: "rgba(255,255,255,0.07)", border: `1px solid ${C.hairline2}`, fontSize: 21, fontWeight: 600, whiteSpace: "nowrap" }}>
                {it.label}
              </span>
            </Reveal>
          ))}
        </div>
      </div>
    </div>
  );
};

export const Confidential: React.FC = () => (
  <AbsoluteFill style={{ ...baseText }}>
    <div style={{ position: "absolute", left: 160, top: 110, width: 1500 }}>
      <Reveal at={0.2} out={OUT}>
        <Eyebrow>Catégorie 1</Eyebrow>
      </Reveal>
      <RiseLines
        at={0.4}
        out={OUT}
        style={{ marginTop: 16, fontSize: 58, fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1.04 }}
        lines={[
          <span key="t">
            Les données <GradText>confidentielles</GradText> d'entreprise
          </span>,
        ]}
      />
    </div>
    <Reveal at={4.6} out={OUT} y={18} style={{ position: "absolute", left: SAFE_L, top: 300, width: 1200 }}>
      <Glass glow={C.violet} style={{ padding: "24px 30px", borderRadius: 24 }}>
        <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: C.fg3 }}>Définition</div>
        <div style={{ marginTop: 10, fontSize: 28, lineHeight: 1.45, color: C.fg2, fontWeight: 500 }}>
          Des informations <HL at={8.2}>non publiques</HL> dont la <HL at={9.1}>divulgation</HL> ou le <HL at={10.5}>vol</HL> peut causer un préjudice{" "}
          <HL at={12.1} color="rgba(251,194,173,0.32)">financier</HL>, <HL at={13.0} color="rgba(251,194,173,0.32)">juridique</HL> ou{" "}
          <HL at={13.8} color="rgba(251,194,173,0.32)">stratégique</HL> à l'organisation.
        </div>
      </Glass>
    </Reveal>
    {GROUPS.map((g, i) => (
      <GroupCard key={g.title} g={g} i={i} />
    ))}
  </AbsoluteFill>
);
