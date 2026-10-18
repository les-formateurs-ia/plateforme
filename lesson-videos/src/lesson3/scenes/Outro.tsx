import React from "react";
import { AbsoluteFill } from "remotion";
import { IconAward, IconCalendar, IconCheck, IconSparkle, IconTarget } from "../../components/icons";
import { Eyebrow, Glass, GradText, Reveal, RiseLines, baseText } from "../../components/ui";
import { C, GRAD, SAFE_L } from "../../theme";

// 158,6 → fin (195,1 s). Temps locaux = temps audio − 158,6.
const END = 36.5;
const A_OUT = 6.4;
const B_OUT = 13.4;

const PILLARS = ["Anonymiser", "Restreindre l'accès", "Relire"];
const MEET = [
  { at: 32.6, label: "Faire le point" },
  { at: 33.7, label: "Poser vos questions" },
  { at: 35.4, label: "Aborder la suite en confiance" },
];

const Pill: React.FC<{ at: number; out: number; children: React.ReactNode }> = ({ at, out, children }) => (
  <Reveal at={at} out={out} y={10}>
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        padding: "8px 18px 8px 10px",
        borderRadius: 999,
        border: `1px solid ${C.hairline2}`,
        background: "rgba(255,255,255,0.04)",
        fontSize: 23,
        fontWeight: 600,
        whiteSpace: "nowrap",
      }}
    >
      <span style={{ width: 28, height: 28, borderRadius: 99, display: "grid", placeItems: "center", backgroundImage: GRAD.bleu }}>
        <IconCheck size={17} color="#0b1a16" />
      </span>
      {children}
    </div>
  </Reveal>
);

export const Outro: React.FC = () => (
  <AbsoluteFill style={{ ...baseText }}>
    {/* A — félicitations */}
    <div style={{ position: "absolute", left: SAFE_L, top: 250, width: 760 }}>
      <RiseLines
        at={0.2}
        out={A_OUT}
        style={{ fontSize: 104, fontWeight: 800, letterSpacing: "-0.05em", lineHeight: 1 }}
        lines={[<GradText key="f">Félicitations !</GradText>]}
      />
      <Reveal at={3.0} out={A_OUT} style={{ marginTop: 26 }}>
        <div style={{ fontSize: 32, color: C.fg, fontWeight: 600, lineHeight: 1.3 }}>
          Vous avez toutes les cartes en main pour utiliser l'IA en toute sécurité.
        </div>
      </Reveal>
      <div style={{ marginTop: 28, display: "flex", gap: 12 }}>
        {PILLARS.map((p, i) => (
          <Pill key={p} at={3.6 + i * 0.2} out={A_OUT}>
            {p}
          </Pill>
        ))}
      </div>
    </div>

    {/* B — prochain module */}
    <div style={{ position: "absolute", left: SAFE_L, top: 260, width: 760 }}>
      <Reveal at={6.8} out={B_OUT}>
        <Eyebrow>Dans le prochain module</Eyebrow>
      </Reveal>
      <RiseLines
        at={9.3}
        out={B_OUT}
        style={{ marginTop: 26, fontSize: 82, fontWeight: 800, letterSpacing: "-0.045em", lineHeight: 1 }}
        lines={["Dompter", <GradText key="p">les prompts</GradText>]}
      />
      <Reveal at={11.2} out={B_OUT} style={{ marginTop: 26 }}>
        <div style={{ fontSize: 30, color: C.fg2, fontWeight: 500 }}>pour générer un contenu percutant, adapté à vos besoins.</div>
      </Reveal>
    </div>

    {/* C — la première mission, puis le rendez-vous formateur */}
    <div style={{ position: "absolute", left: SAFE_L, top: 190, width: 780 }}>
      <RiseLines
        at={13.7}
        out={END - 0.6}
        style={{ fontSize: 60, fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1.04 }}
        lines={[
          <span key="m">
            Place à votre <GradText>première mission IA</GradText>
          </span>,
        ]}
      />
      <Reveal at={17.4} out={END - 0.6} y={20} style={{ marginTop: 26 }}>
        <Glass glow={C.violet} style={{ padding: "24px 28px", borderRadius: 26, display: "flex", gap: 22, alignItems: "center" }}>
          <div style={{ flex: "none", width: 84, height: 84, borderRadius: 24, display: "grid", placeItems: "center", backgroundImage: GRAD.violet }}>
            <IconTarget size={44} color="#140d1f" />
          </div>
          <div>
            <div style={{ fontSize: 32, fontWeight: 800 }}>Mission IA n° 1</div>
            <Reveal at={18.4} y={6}>
              <div style={{ fontSize: 23, color: C.fg2, fontWeight: 500, marginTop: 4 }}>Présentée en détail dans la prochaine leçon</div>
            </Reveal>
            <div style={{ marginTop: 12, display: "flex", gap: 18, fontSize: 22, fontWeight: 700 }}>
              <Reveal at={20.6} y={6}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8, color: C.violetLight }}>
                  <IconSparkle size={20} /> Valider vos acquis
                </span>
              </Reveal>
              <Reveal at={24.6} y={6}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8, color: C.bleuVert }}>
                  <IconAward size={20} /> Préparer la certification
                </span>
              </Reveal>
            </div>
          </div>
        </Glass>
      </Reveal>
      <Reveal at={26.5} out={END - 0.6} style={{ marginTop: 34 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 28, fontWeight: 700 }}>
          <span style={{ color: C.bleu, display: "flex" }}>
            <IconCalendar size={30} />
          </span>
          Mission accomplie ? Prenez rendez-vous avec votre formateur.
        </div>
      </Reveal>
      <div style={{ marginTop: 18, display: "flex", gap: 10, flexWrap: "wrap" }}>
        {MEET.map((m) => (
          <Pill key={m.label} at={m.at} out={END - 0.6}>
            {m.label}
          </Pill>
        ))}
      </div>
    </div>
  </AbsoluteFill>
);
