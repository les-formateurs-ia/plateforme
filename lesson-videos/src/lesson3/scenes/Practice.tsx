import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { IconCalendar, IconLock, IconSearch, IconUser } from "../../components/icons";
import { Eyebrow, Glass, GradText, Reveal, RiseLines, baseText } from "../../components/ui";
import { C, EASE, SAFE_L, clamp } from "../../theme";

// 135,2 → 158,8 s. Temps locaux = temps audio − 135,2.
// La voix off s'adresse à Nathalie : exemple concret d'anonymisation RH.
const OUT = 23.05;

const REFLEXES = [
  { label: "Anonymiser", icon: <IconUser size={24} />, color: C.violetLight },
  { label: "Restreindre l'accès", icon: <IconLock size={24} />, color: C.bleu },
  { label: "Relire avant d'envoyer", icon: <IconSearch size={24} />, color: C.bleuVert },
];
const CASES = [
  { at: 12.6, label: "Préparer un entretien" },
  { at: 13.8, label: "Une formation" },
  { at: 15.6, label: "Une demande de congé" },
];

// segment qui se transforme : texte d'origine → version anonymisée
const Swap: React.FC<{ at: number; from: string; to: string | null }> = ({ at, from, to }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = interpolate(frame, [at * fps, (at + 0.6) * fps], [0, 1], { ...clamp, easing: EASE });
  if (p < 0.5) {
    return (
      <span style={{ color: C.fg, fontWeight: 600, background: `rgba(251,194,173,${0.12 + p * 0.4})`, borderRadius: 6, padding: "1px 5px" }}>
        {from}
      </span>
    );
  }
  if (to === null) {
    return <span style={{ color: C.fg3, textDecoration: "line-through", opacity: 1.6 - p }}>{from}</span>;
  }
  return <span style={{ color: "#fff", fontWeight: 700, background: "rgba(106,222,177,0.25)", borderRadius: 6, padding: "1px 6px" }}>{to}</span>;
};

export const Practice: React.FC = () => (
  <AbsoluteFill style={{ ...baseText }}>
    <div style={{ position: "absolute", left: 160, top: 130, width: 1100 }}>
      <Reveal at={0.25} out={OUT}>
        <Eyebrow>Pour vous, Nathalie</Eyebrow>
      </Reveal>
      <RiseLines
        at={0.5}
        out={OUT}
        style={{ marginTop: 18, fontSize: 60, fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1.04 }}
        lines={[
          <span key="t">
            Sécurisez la création <GradText>de vos formations</GradText>
          </span>,
        ]}
      />
      <div style={{ marginTop: 30, display: "flex", gap: 12 }}>
        {REFLEXES.map((r, i) => (
          <Reveal key={r.label} at={8.0 + i * 0.2} out={OUT} y={12}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 20px 10px 14px",
                borderRadius: 999,
                border: `1px solid ${r.color}66`,
                background: `${r.color}14`,
                fontSize: 25,
                fontWeight: 700,
              }}
            >
              <span style={{ color: r.color, display: "flex" }}>{r.icon}</span>
              {r.label}
            </div>
          </Reveal>
        ))}
      </div>
    </div>

    <div style={{ position: "absolute", left: SAFE_L, top: 470, width: 1200 }}>
      <Reveal at={10.1} out={OUT}>
        <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: C.fg3 }}>
          Par exemple, si l'IA vous aide à…
        </div>
      </Reveal>
      <div style={{ marginTop: 14, display: "flex", gap: 12 }}>
        {CASES.map((c) => (
          <Reveal key={c.label} at={c.at} out={OUT} y={10}>
            <div
              style={{
                padding: "10px 20px",
                borderRadius: 16,
                border: `1px solid ${C.hairline2}`,
                background: "rgba(255,255,255,0.05)",
                fontSize: 25,
                fontWeight: 600,
              }}
            >
              {c.label}
            </div>
          </Reveal>
        ))}
      </div>

      <Reveal at={16.5} out={OUT} y={20} style={{ marginTop: 30, width: 1120 }}>
        <Glass glow={C.bleuVert} style={{ padding: "24px 30px", borderRadius: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 20, fontWeight: 700, color: C.fg3, letterSpacing: "0.06em", textTransform: "uppercase" }}>
            <IconCalendar size={22} /> Demande de congé — dans votre prompt
          </div>
          <div style={{ marginTop: 14, fontSize: 28, lineHeight: 1.6, color: C.fg2, fontWeight: 500 }}>
            Rédige la réponse à la demande de congé de <Swap at={18.8} from="Marie Dupont" to="Salarié A" /> (
            <Swap at={20.4} from="matricule 48213" to={null} />, <Swap at={21.9} from="12 rue des Acacias, Lille" to={null} />) pour la semaine 32.
          </div>
        </Glass>
      </Reveal>
    </div>
  </AbsoluteFill>
);
