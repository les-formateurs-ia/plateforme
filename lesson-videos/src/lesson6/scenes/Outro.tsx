import React from "react";
import { AbsoluteFill } from "remotion";
import { IconCode, IconHeadphones, IconShield, IconWave } from "../../components/icons";
import { Eyebrow, GradText, Reveal, RiseLines, baseText } from "../../components/ui";
import { C, SAFE_L } from "../../theme";

// 208,9 → fin (238,47 s). Temps locaux = temps audio − 208,9.
const END = 29.57;
const A_OUT = 6.9;

const QUESTIONS = [
  { at: 12.1, n: "1", q: "Permet-elle d'identifier quelqu'un ?", color: C.violetLight },
  { at: 14.1, n: "2", q: "Est-elle sensible ou confidentielle ?", color: C.beige },
  { at: 17.0, n: "3", q: "Ai-je le droit de la partager ?", color: C.bleuVert },
];
const TABS = [
  { label: "Podcast", icon: <IconHeadphones size={24} /> },
  { label: "Playground", icon: <IconCode size={24} /> },
  { label: "Agent", icon: <IconWave size={24} /> },
];

export const Outro: React.FC = () => (
  <AbsoluteFill style={{ ...baseText }}>
    {/* A — le cadre légal */}
    <div style={{ position: "absolute", left: SAFE_L, top: 260, width: 760 }}>
      <Reveal at={0.2} out={A_OUT}>
        <Eyebrow color={C.bleuVert}>En résumé</Eyebrow>
      </Reveal>
      <RiseLines
        at={0.4}
        out={A_OUT}
        style={{ marginTop: 26, fontSize: 56, fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1.06 }}
        lines={["En France, des lois et", <GradText key="o">des organismes veillent</GradText>, "au respect de vos données."]}
      />
    </div>

    {/* B — les 3 questions */}
    <div style={{ position: "absolute", left: SAFE_L, top: 200, width: 800 }}>
      <Reveal at={7.1} out={END - 0.6}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 22, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: C.bleuVert }}>
          <IconShield size={24} color={C.bleuVert} /> Avant d'injecter une information dans une IA
        </div>
      </Reveal>
      <RiseLines
        at={7.3}
        out={END - 0.6}
        style={{ marginTop: 18, fontSize: 52, fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1.06 }}
        lines={[
          <span key="q">
            Posez-vous <GradText>3 questions</GradText>
          </span>,
        ]}
      />
      <div style={{ marginTop: 28, display: "flex", flexDirection: "column", gap: 14 }}>
        {QUESTIONS.map((q) => (
          <Reveal key={q.n} at={q.at} out={END - 0.6} y={14}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 18,
                padding: "16px 22px",
                borderRadius: 20,
                border: `1px solid ${q.color}66`,
                background: `linear-gradient(90deg, ${q.color}18, rgba(255,255,255,0.02)), rgba(12,10,18,0.8)`,
              }}
            >
              <span style={{ width: 42, height: 42, borderRadius: 99, display: "grid", placeItems: "center", background: q.color, color: "#140d1f", fontSize: 21, fontWeight: 800 }}>{q.n}</span>
              <span style={{ fontSize: 29, fontWeight: 700 }}>{q.q}</span>
            </div>
          </Reveal>
        ))}
      </div>
      <Reveal at={19.3} out={END - 0.6} style={{ marginTop: 28 }}>
        <div style={{ fontSize: 24, color: C.fg2, fontWeight: 500 }}>
          → Prochaine leçon : <span style={{ color: C.fg, fontWeight: 700 }}>configurer vos outils et vos demandes en toute sécurité</span>.
        </div>
      </Reveal>
      <Reveal at={25.1} out={END - 0.6} style={{ marginTop: 22 }}>
        <div style={{ display: "inline-flex", gap: 8, padding: 8, borderRadius: 20, border: `1px solid ${C.hairline2}`, background: "rgba(255,255,255,0.04)" }}>
          {TABS.map((t) => (
            <div key={t.label} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 18px", borderRadius: 14, fontSize: 23, fontWeight: 600, background: "rgba(181,141,224,0.14)" }}>
              <span style={{ color: C.violetLight, display: "flex" }}>{t.icon}</span>
              {t.label}
            </div>
          ))}
        </div>
      </Reveal>
    </div>
  </AbsoluteFill>
);

