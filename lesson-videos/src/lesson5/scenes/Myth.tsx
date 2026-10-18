import React from "react";
import { AbsoluteFill } from "remotion";
import { IconAlert, IconBrain, IconSearch, IconTarget, IconX } from "../../components/icons";
import { Eyebrow, Glass, GradText, Reveal, RiseLines, baseText, useEnter } from "../../components/ui";
import { C, GRAD, SAFE_L } from "../../theme";

// 20,5 → 54,5 s. Temps locaux = temps audio − 20,5.
const OUT = 33.45;
const A_OUT = 9.9;
const B_OUT = 19.9;

const Wrong: React.FC<{ at: number; strikeAt: number; icon: React.ReactNode; children: React.ReactNode }> = ({ at, strikeAt, icon, children }) => {
  const s = useEnter(strikeAt, 0.5);
  return (
    <Reveal at={at} out={A_OUT} y={16}>
      <Glass glow={C.beige} style={{ width: 350, padding: "26px 26px", borderRadius: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: C.fg2, display: "flex" }}>{icon}</span>
          <span
            style={{ width: 40, height: 40, borderRadius: 99, display: "grid", placeItems: "center", background: C.beige, opacity: s, scale: String(0.6 + 0.4 * s) }}
          >
            <IconX size={22} color="#140d1f" />
          </span>
        </div>
        <div style={{ marginTop: 18, fontSize: 28, fontWeight: 700, lineHeight: 1.25, position: "relative", color: s > 0.5 ? C.fg2 : C.fg }}>
          {children}
        </div>
      </Glass>
    </Reveal>
  );
};

const Step: React.FC<{ at: number; title: string; warm?: boolean }> = ({ at, title, warm }) => (
  <Reveal at={at} out={B_OUT} y={16}>
    <div
      style={{
        width: 330,
        padding: "22px 24px",
        borderRadius: 22,
        border: `1px solid ${warm ? "rgba(251,194,173,0.55)" : C.hairline2}`,
        background: warm ? "rgba(251,194,173,0.1)" : "rgba(255,255,255,0.04)",
        fontSize: 26,
        fontWeight: 700,
        lineHeight: 1.25,
        color: warm ? C.beige : C.fg,
      }}
    >
      {title}
    </div>
  </Reveal>
);

const Arrow: React.FC<{ at: number }> = ({ at }) => (
  <Reveal at={at} out={B_OUT} y={0}>
    <div style={{ fontSize: 34, color: C.fg3, padding: "0 6px" }}>→</div>
  </Reveal>
);

export const Myth: React.FC = () => (
  <AbsoluteFill style={{ ...baseText }}>
    {/* A — l'IA n'est ni un moteur de recherche, ni un humain qui devine */}
    <div style={{ position: "absolute", left: SAFE_L, top: 200, width: 1200 }}>
      <Reveal at={0.2} out={A_OUT}>
        <Eyebrow color={C.beige}>Une erreur fréquente</Eyebrow>
      </Reveal>
      <Reveal at={0.4} out={A_OUT} style={{ marginTop: 22 }}>
        <div style={{ fontSize: 34, fontWeight: 600, color: C.fg2 }}>Aborder l'IA comme…</div>
      </Reveal>
      <div style={{ marginTop: 26, display: "flex", gap: 22 }}>
        <Wrong at={2.7} strikeAt={6.2} icon={<IconSearch size={36} />}>
          …un moteur de recherche classique
        </Wrong>
        <Wrong at={4.5} strikeAt={6.6} icon={<IconBrain size={36} />}>
          …un humain qui devine vos intentions
        </Wrong>
      </div>
      <RiseLines
        at={7.2}
        out={A_OUT}
        style={{ marginTop: 40, fontSize: 52, fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1.05 }}
        lines={[
          <span key="p">
            Un modèle de langage <GradText grad={GRAD.beige}>ne lit pas dans vos pensées.</GradText>
          </span>,
        ]}
      />
    </div>

    {/* B — consigne vague → l'IA invente */}
    <div style={{ position: "absolute", left: SAFE_L, top: 260, width: 1200 }}>
      <Reveal at={10.1} out={B_OUT}>
        <div style={{ fontSize: 40, fontWeight: 800, letterSpacing: "-0.03em" }}>Quand la consigne est vague…</div>
      </Reveal>
      <div style={{ marginTop: 40, display: "flex", alignItems: "center", gap: 10 }}>
        <Step at={11.2} title="Une consigne vague ou incomplète" />
        <Arrow at={12.9} />
        <Step at={13.2} title="L'IA invente tout ce qui manque" warm />
        <Arrow at={17.6} />
        <Step at={17.9} title="Résultat imprévisible ou hors sujet" warm />
      </div>
      <Reveal at={18.0} out={B_OUT} style={{ marginTop: 34 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 25, color: C.beige, fontWeight: 600 }}>
          <IconAlert size={26} color={C.beige} /> Ce que vous ne précisez pas, l'IA le devine… à sa façon.
        </div>
      </Reveal>
    </div>

    {/* C — définition */}
    <div style={{ position: "absolute", left: SAFE_L, top: 220, width: 1150 }}>
      <Reveal at={20.1} out={OUT}>
        <Eyebrow>Définition</Eyebrow>
      </Reveal>
      <RiseLines
        at={20.3}
        out={OUT}
        style={{ marginTop: 24, fontSize: 70, fontWeight: 800, letterSpacing: "-0.045em", lineHeight: 1.02 }}
        lines={[<GradText key="p">Le prompt engineering</GradText>]}
      />
      <Reveal at={21.6} out={OUT} style={{ marginTop: 24 }}>
        <div style={{ fontSize: 32, color: C.fg2, fontWeight: 500 }}>= l'art de donner à l'IA des instructions…</div>
      </Reveal>
      <div style={{ marginTop: 22, display: "flex", gap: 14 }}>
        {[
          { at: 24.4, l: "claires", c: C.violetLight },
          { at: 25.2, l: "structurées", c: C.bleu },
          { at: 26.2, l: "efficaces", c: C.bleuVert },
        ].map((a) => (
          <Reveal key={a.l} at={a.at} out={OUT} y={12} scaleFrom={0.9}>
            <div style={{ padding: "12px 26px", borderRadius: 999, border: `1px solid ${a.c}88`, background: `${a.c}18`, fontSize: 34, fontWeight: 800, color: a.c }}>
              {a.l}
            </div>
          </Reveal>
        ))}
      </div>
      <Reveal at={30.2} out={OUT} style={{ marginTop: 36 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 30, fontWeight: 700 }}>
          <span style={{ color: C.bleuVert, display: "flex" }}>
            <IconTarget size={34} />
          </span>
          pour obtenir le résultat voulu, <span style={{ color: C.bleuVert }}>du premier coup</span>.
        </div>
      </Reveal>
    </div>
  </AbsoluteFill>
);
