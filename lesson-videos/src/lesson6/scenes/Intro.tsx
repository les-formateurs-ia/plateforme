import React from "react";
import { AbsoluteFill } from "remotion";
import { IconAlert, IconBriefcase, IconCheck, IconLock, IconShield, IconUser, IconX } from "../../components/icons";
import { Eyebrow, Glass, GradText, Reveal, RiseLines, baseText, useEnter } from "../../components/ui";
import { C, GRAD, SAFE_L } from "../../theme";

// 0 → 36,2 s. Rappel, idées reçues, puis les catégories de données.
const A_OUT = 6.9;
const B_OUT = 30.9;
const C_OUT = 35.6;

const Done: React.FC<{ at: number; children: React.ReactNode }> = ({ at, children }) => (
  <Reveal at={at} out={A_OUT} y={12}>
    <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 31, fontWeight: 600 }}>
      <span style={{ flex: "none", width: 36, height: 36, borderRadius: 99, display: "grid", placeItems: "center", backgroundImage: GRAD.bleu }}>
        <IconCheck size={21} color="#0b1a16" />
      </span>
      {children}
    </div>
  </Reveal>
);

const Myth: React.FC<{ at: number; children: React.ReactNode }> = ({ at, children }) => {
  const wrong = useEnter(22.3, 0.5);
  return (
    <Reveal at={at} out={B_OUT} y={14}>
      <Glass glow={C.beige} style={{ padding: "18px 22px", borderRadius: 20, display: "flex", alignItems: "center", gap: 16 }}>
        <span
          style={{ flex: "none", width: 36, height: 36, borderRadius: 99, display: "grid", placeItems: "center", background: wrong > 0.5 ? C.beige : "rgba(255,255,255,0.1)" }}
        >
          {wrong > 0.5 ? <IconX size={20} color="#140d1f" /> : <span style={{ fontSize: 20, fontWeight: 800, color: C.fg2 }}>?</span>}
        </span>
        <span style={{ fontSize: 26, fontWeight: 600, color: wrong > 0.5 ? C.fg2 : C.fg, lineHeight: 1.3 }}>{children}</span>
      </Glass>
    </Reveal>
  );
};

const CATS = [
  { label: "Confidentielles", sub: "entreprise", icon: <IconBriefcase size={28} />, color: C.violetLight },
  { label: "Personnelles", sub: "particuliers", icon: <IconUser size={28} />, color: C.bleu },
  { label: "Sensibles", sub: "ultra protégées", icon: <IconLock size={28} />, color: C.beige },
];

export const Intro: React.FC = () => (
  <AbsoluteFill style={{ ...baseText }}>
    {/* A — rappel */}
    <div style={{ position: "absolute", left: SAFE_L, top: 260, width: 740 }}>
      <Reveal at={0.2} out={A_OUT}>
        <Eyebrow>Vous savez désormais…</Eyebrow>
      </Reveal>
      <div style={{ marginTop: 32, display: "flex", flexDirection: "column", gap: 18 }}>
        <Done at={1.6}>Ce qu'est une IA</Done>
        <Done at={3.2}>Ce qu'elle peut faire pour vous</Done>
        <Done at={5.0}>Comment créer votre compte</Done>
      </div>
    </div>

    {/* B — la sécurité des données, idées reçues */}
    <div style={{ position: "absolute", left: SAFE_L, top: 200, width: 740 }}>
      <Reveal at={7.1} out={B_OUT}>
        <Eyebrow color={C.beige}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
            <IconShield size={22} color={C.beige} /> Une notion cruciale, souvent négligée
          </span>
        </Eyebrow>
      </Reveal>
      <RiseLines
        at={12.6}
        out={B_OUT}
        style={{ marginTop: 26, fontSize: 66, fontWeight: 800, letterSpacing: "-0.045em", lineHeight: 1.02 }}
        lines={["La sécurité", <GradText key="d">des données</GradText>]}
      />
      <div style={{ marginTop: 32, display: "flex", flexDirection: "column", gap: 12 }}>
        <Myth at={14.8}>Une donnée confidentielle = un secret d'entreprise ?</Myth>
        <Myth at={19.0}>Une donnée personnelle = juste un nom et un prénom ?</Myth>
      </div>
      <Reveal at={24.6} out={B_OUT} style={{ marginTop: 22 }}>
        <div style={{ fontSize: 26, fontWeight: 700 }}>
          En réalité, c'est <span style={{ color: C.violetLight }}>bien plus strict</span>.
        </div>
      </Reveal>
      <Reveal at={27.8} out={B_OUT} style={{ marginTop: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 26, fontWeight: 700, color: C.beige }}>
          <IconAlert size={26} color={C.beige} /> Avec l'IA, la moindre imprudence = une fuite majeure.
        </div>
      </Reveal>
    </div>

    {/* C — ce que l'on manipule au quotidien */}
    <div style={{ position: "absolute", left: SAFE_L, top: 250, width: 760 }}>
      <Reveal at={31.3} out={C_OUT}>
        <div style={{ fontSize: 44, fontWeight: 800, letterSpacing: "-0.035em", lineHeight: 1.1 }}>
          Ce que l'on manipule <GradText>au quotidien</GradText>
        </div>
      </Reveal>
      <div style={{ marginTop: 34, display: "flex", gap: 16 }}>
        {CATS.map((c, i) => (
          <Reveal key={c.label} at={32.2 + i * 0.3} out={C_OUT} y={16}>
            <div
              style={{
                width: 232,
                padding: "22px 22px",
                borderRadius: 22,
                border: `1px solid ${c.color}77`,
                background: `linear-gradient(180deg, ${c.color}1c, rgba(255,255,255,0.02)), rgba(12,10,18,0.85)`,
              }}
            >
              <div style={{ color: c.color, display: "flex" }}>{c.icon}</div>
              <div style={{ marginTop: 14, fontSize: 28, fontWeight: 800 }}>{c.label}</div>
              <div style={{ marginTop: 4, fontSize: 20, color: C.fg3, fontWeight: 600 }}>{c.sub}</div>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  </AbsoluteFill>
);
