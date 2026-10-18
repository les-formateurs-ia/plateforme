import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { IconAlert, IconBriefcase } from "../../components/icons";
import { Eyebrow, GradText, Reveal, RiseLines, baseText, useEnter, useExit } from "../../components/ui";
import { C, EASE, SAFE_L, clamp } from "../../theme";

// 181,9 → 209,1 s. Temps locaux = temps audio − 181,9.
// Les trois familles de documents RH à protéger en priorité (Nathalie, RH).
const OUT = 26.65;
const CW = 386;

const Heart: React.FC = () => (
  <svg width={40} height={40} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7Z" />
    <path d="M12 9v6M9 12h6" />
  </svg>
);

const COLS = [
  {
    at: 7.4,
    title: "Contrats & données",
    icon: <IconBriefcase size={40} />,
    color: C.violetLight,
    items: ["Contrats de travail", "Fiches de poste", "Pièces d'identité", "RIB", "Attestations"],
  },
  {
    at: 10.2,
    title: "Paie & travail",
    icon: <span style={{ fontSize: 40, fontWeight: 800, lineHeight: 1 }}>€</span>,
    color: C.bleu,
    items: ["Bulletins de paie", "Déclarations sociales", "Relevés d'heures", "Notes de frais", "Arrêts maladie"],
  },
  {
    at: 11.6,
    title: "Parcours & santé",
    icon: <Heart />,
    color: C.beige,
    items: ["Entretiens annuels", "Attestations de formation", "Visites médicales", "Prévoyance", "Accidents du travail"],
  },
];

const Col: React.FC<{ c: (typeof COLS)[number]; i: number }> = ({ c, i }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = interpolate(frame, [c.at * fps, (c.at + 0.9) * fps], [0, 1], { ...clamp, easing: EASE });
  const q = useExit(OUT, 0.5);
  return (
    <div style={{ position: "absolute", left: SAFE_L + i * (CW + 22), top: 300, width: CW, perspective: 1200 }}>
      <div
        style={{
          borderRadius: 26,
          padding: "24px 26px",
          opacity: p * (1 - q),
          transform: `rotateX(${(1 - p) * -50}deg) translateY(${(1 - p) * 30}px)`,
          transformOrigin: "50% 100%",
          border: `1.5px solid ${c.color}77`,
          background: `linear-gradient(180deg, ${c.color}1a, rgba(255,255,255,0.02)), rgba(12,10,18,0.86)`,
        }}
      >
        <div style={{ color: c.color, height: 44, display: "flex", alignItems: "center" }}>{c.icon}</div>
        <div style={{ marginTop: 14, fontSize: 28, fontWeight: 800 }}>{c.title}</div>
        <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
          {c.items.map((it, j) => (
            <Reveal key={it} at={c.at + 0.4 + j * 0.12} y={6}>
              <div style={{ fontSize: 21, color: C.fg2, fontWeight: 500 }}>· {it}</div>
            </Reveal>
          ))}
        </div>
      </div>
    </div>
  );
};

export const Hr: React.FC = () => {
  const grave = useEnter(17.4, 0.5);
  return (
    <AbsoluteFill style={{ ...baseText }}>
      <div style={{ position: "absolute", left: 160, top: 110 }}>
        <Reveal at={0.2} out={OUT}>
          <Eyebrow>Concrètement, pour vous Nathalie</Eyebrow>
        </Reveal>
        <RiseLines
          at={0.4}
          out={OUT}
          style={{ marginTop: 16, fontSize: 58, fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1.04 }}
          lines={[
            <span key="t">
              3 catégories de <GradText>documents RH</GradText>
            </span>,
          ]}
        />
      </div>
      {COLS.map((c, i) => (
        <Col key={c.title} c={c} i={i} />
      ))}
      <Reveal at={12.2} out={OUT} y={14} style={{ position: "absolute", left: SAFE_L, top: 720, width: 1200 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            padding: "18px 26px",
            borderRadius: 22,
            border: `1.5px solid rgba(251,194,173,${0.4 + grave * 0.4})`,
            background: `rgba(251,194,173,${0.08 + grave * 0.08})`,
            fontSize: 27,
            fontWeight: 700,
          }}
        >
          <IconAlert size={32} color={C.beige} />
          <span>
            Envoyer un document réel (une vraie fiche de paie) à une IA ={" "}
            <span style={{ color: C.beige }}>violation grave du RGPD</span>.
          </span>
        </div>
      </Reveal>
      <Reveal at={19.1} out={OUT} style={{ position: "absolute", left: SAFE_L, top: 830, width: 1200 }}>
        <div style={{ fontSize: 25, color: C.fg2, fontWeight: 500 }}>
          → Dans la prochaine leçon : <span style={{ color: C.fg, fontWeight: 700 }}>traiter ces informations en toute sécurité</span>.
        </div>
      </Reveal>
    </AbsoluteFill>
  );
};
