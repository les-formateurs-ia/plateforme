import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { IconAlert, IconCheck, IconFileText } from "../../components/icons";
import { Eyebrow, Glass, GradText, Reveal, RiseLines, baseText } from "../../components/ui";
import { C, EASE, clamp } from "../../theme";

// 47,2 → 78 s. Temps locaux = temps audio − 47,2.
// Exemple d'origine (compte rendu d'entretien) caviardé en direct : d'abord le
// nom seul — insuffisant — puis toutes les informations qui permettent de
// recouper l'identité.
const OUT = 30.25;

type Tok = { text: string; repl: string; at: number };
type Part = string | Tok;
const P = (text: string, repl: string, at: number): Tok => ({ text, repl, at });

const PARAS: Part[][] = [
  [
    "L'entretien annuel s'est tenu avec Mme ",
    P("Élodie MARTIN", "XXXX", 17.0),
    ", née le ",
    P("14 mai 1988 à Lyon", "XX/XX/XXXX", 19.6),
    ", domiciliée au ",
    P("45, rue des Lilas, Boulogne", "XXXX", 19.9),
    ". Joignable au ",
    P("06 12 34 56 78", "06 XX XX XX XX", 20.2),
    " ou via ",
    P("elodie.martin88@gmail.com", "X@GMAIL.COM", 20.5),
    ", n° de Sécurité sociale ",
    P("2 88 05 69 003 142 85", "X XX XX XX XXX", 20.8),
    ".",
  ],
  [
    "Cheffe de projet marketing depuis ",
    P("le 1er mars 2019", "X années", 21.1),
    " chez ",
    P("Duval & Associés", "la société XXX", 21.4),
    " (SIRET ",
    P("451 892 301 00012", "XXX", 21.7),
    ").",
  ],
  [
    "Rémunération brute : ",
    P("3 850 €", "XXXX €", 22.0),
    ", versée sur l'IBAN ",
    P("FR76 3000 4018 2500 1234", "FR76 0000 0000", 22.3),
    ". Mme ",
    P("MARTIN", "XXX", 17.2),
    " a deux enfants à charge.",
  ],
];

const Redact: React.FC<{ tok: Tok }> = ({ tok }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const r = interpolate(frame, [tok.at * fps, (tok.at + 0.55) * fps], [0, 1], { ...clamp, easing: EASE });
  // repérage (surlignage beige) un peu avant le caviardage
  const spot = interpolate(frame, [(tok.at - 0.5) * fps, tok.at * fps], [0, 1], clamp);
  if (r < 0.5) {
    return (
      <span
        style={{
          backgroundImage: "linear-gradient(90deg, rgba(251,194,173,0.35), rgba(251,194,173,0.35))",
          backgroundRepeat: "no-repeat",
          backgroundSize: `${Math.max(spot, r * 2) * 100}% 100%`,
          borderRadius: 6,
          padding: "1px 3px",
          color: C.fg,
          fontWeight: 600,
        }}
      >
        {tok.text}
      </span>
    );
  }
  return (
    <span
      style={{
        borderRadius: 6,
        padding: "1px 6px",
        background: `rgba(181,141,224,${0.2 + (r - 0.5)})`,
        color: "#fff",
        fontWeight: 700,
        letterSpacing: "0.02em",
        opacity: 0.4 + (r - 0.5) * 1.2,
      }}
    >
      {tok.repl}
    </span>
  );
};

const Rule: React.FC<{ at: number; verdictAt: number; ok: boolean; title: string; sub: string }> = ({ at, verdictAt, ok, title, sub }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const v = interpolate(frame, [verdictAt * fps, (verdictAt + 0.5) * fps], [0, 1], { ...clamp, easing: EASE });
  const col = ok ? C.bleuVert : C.beige;
  return (
    <Reveal at={at} out={OUT} y={14}>
      <div
        style={{
          padding: "20px 22px",
          borderRadius: 22,
          border: `1px solid ${v > 0.3 ? `${col}77` : C.hairline2}`,
          background: v > 0.3 ? `${col}12` : "rgba(255,255,255,0.03)",
          display: "flex",
          gap: 16,
          alignItems: "flex-start",
        }}
      >
        <div
          style={{
            flex: "none",
            width: 40,
            height: 40,
            borderRadius: 99,
            display: "grid",
            placeItems: "center",
            background: v > 0.3 ? col : "rgba(255,255,255,0.08)",
            scale: String(0.8 + 0.2 * v),
          }}
        >
          {ok ? <IconCheck size={22} color="#0b1a16" /> : <IconAlert size={22} color={v > 0.3 ? "#140d1f" : C.fg3} />}
        </div>
        <div>
          <div style={{ fontSize: 27, fontWeight: 700 }}>{title}</div>
          <div style={{ marginTop: 4, fontSize: 21, color: C.fg2, fontWeight: 500, lineHeight: 1.35 }}>{sub}</div>
          <div style={{ marginTop: 8, fontSize: 19, fontWeight: 700, color: col, opacity: v }}>
            {ok ? "Indispensable" : "Insuffisant à lui seul"}
          </div>
        </div>
      </div>
    </Reveal>
  );
};

const CHIPS = [
  { at: 25.3, label: "Noms" },
  { at: 25.8, label: "Prénoms" },
  { at: 26.5, label: "Matricules" },
  { at: 27.3, label: "E-mails" },
  { at: 28.2, label: "Toute info identifiante" },
];

export const Anonymise: React.FC = () => (
  <AbsoluteFill style={{ ...baseText }}>
    <div style={{ position: "absolute", left: 160, top: 130, width: 1200 }}>
      <Reveal at={0.2} out={OUT}>
        <Eyebrow>Pilier 1</Eyebrow>
      </Reveal>
      <RiseLines
        at={0.4}
        out={OUT}
        style={{ marginTop: 18, fontSize: 60, fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1.04 }}
        lines={[
          <span key="a">
            <GradText>Anonymiser</GradText> vos données
          </span>,
        ]}
      />
      <Reveal at={5.2} out={OUT} style={{ marginTop: 14 }}>
        <div style={{ fontSize: 27, color: C.fg2, fontWeight: 500 }}>
          = supprimer <span style={{ color: C.fg, fontWeight: 700 }}>définitivement</span> tout moyen d'identifier une personne.
        </div>
      </Reveal>
    </div>

    <Reveal at={10.9} out={OUT} y={24} style={{ position: "absolute", left: 620, top: 360, width: 690 }}>
      <Glass glow={C.violet} style={{ padding: "26px 32px 30px", borderRadius: 26 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 20, fontWeight: 700, color: C.fg2 }}>
          <IconFileText size={24} /> Compte rendu d'entretien — exemple
        </div>
        <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 14, fontSize: 21, lineHeight: 1.62, color: C.fg2, fontWeight: 500 }}>
          {PARAS.map((para, i) => (
            <div key={i}>{para.map((part, j) => (typeof part === "string" ? <span key={j}>{part}</span> : <Redact key={j} tok={part} />))}</div>
          ))}
        </div>
      </Glass>
    </Reveal>

    <div style={{ position: "absolute", left: 1350, top: 360, width: 470, display: "flex", flexDirection: "column", gap: 16 }}>
      <Rule at={13.4} verdictAt={17.6} ok={false} title="Masquer le nom" sub="Il ne suffit pas de cacher l'identité principale." />
      <Rule at={19.3} verdictAt={22.6} ok title="Supprimer les recoupements" sub="Date de naissance, adresse, téléphone… permettent d'isoler la personne." />
      <Reveal at={24.1} out={OUT} style={{ marginTop: 6 }}>
        <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: C.fg3 }}>Retirez</div>
      </Reveal>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
        {CHIPS.map((c) => (
          <Reveal key={c.label} at={c.at} out={OUT} y={10}>
            <div
              style={{
                padding: "8px 16px",
                borderRadius: 999,
                border: "1px solid rgba(219,172,240,0.45)",
                background: "rgba(181,141,224,0.12)",
                fontSize: 22,
                fontWeight: 700,
                whiteSpace: "nowrap",
              }}
            >
              {c.label}
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  </AbsoluteFill>
);
