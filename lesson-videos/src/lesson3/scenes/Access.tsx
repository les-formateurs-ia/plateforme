import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { IconBan, IconFileX, IconFrame, IconKey, IconUser } from "../../components/icons";
import { Eyebrow, Glass, GradText, Reveal, RiseLines, baseText, useExit } from "../../components/ui";
import { C, EASE, GRAD, SAFE_L, clamp } from "../../theme";

// 77,8 → 113,6 s. Temps locaux = temps audio − 77,8.
const OUT = 35.25;
const A_OUT = 13.8; // fin de la démonstration du moindre privilège

// Panneau de droits : seuls ceux utiles à la mission restent actifs.
const PERMS = [
  { label: "Documents du projet en cours", keep: true },
  { label: "Données RH de l'équipe", keep: false },
  { label: "Fichier clients complet", keep: false },
  { label: "Comptabilité", keep: false },
  { label: "Administration des comptes", keep: false },
];

const Toggle: React.FC<{ on: number }> = ({ on }) => (
  <div
    style={{
      width: 62,
      height: 34,
      borderRadius: 99,
      padding: 4,
      background: on > 0.5 ? C.bleuVert : "rgba(255,255,255,0.14)",
    }}
  >
    <div style={{ width: 26, height: 26, borderRadius: 99, background: "#fff", translate: `${on * 28}px 0px` }} />
  </div>
);

const Permissions: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <Reveal at={4.0} out={A_OUT} y={24} style={{ position: "absolute", left: SAFE_L, top: 370, width: 640 }}>
      <Glass glow={C.bleu} style={{ padding: "26px 30px", borderRadius: 26 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 52, height: 52, borderRadius: 99, display: "grid", placeItems: "center", backgroundImage: GRAD.bleu }}>
            <IconUser size={28} color="#0b1a16" />
          </div>
          <div>
            <div style={{ fontSize: 25, fontWeight: 700 }}>Collaborateur · Mission marketing</div>
            <div style={{ fontSize: 19, color: C.fg3, fontWeight: 600 }}>Droits d'accès</div>
          </div>
        </div>
        <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 10 }}>
          {PERMS.map((p, i) => {
            const off = p.keep ? 0 : interpolate(frame, [(10.6 + i * 0.35) * fps, (10.9 + i * 0.35) * fps], [0, 1], { ...clamp, easing: EASE });
            const on = 1 - off;
            return (
              <div
                key={p.label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 16px",
                  borderRadius: 14,
                  background: p.keep ? "rgba(106,222,177,0.1)" : `rgba(255,255,255,${0.03 + on * 0.03})`,
                  border: `1px solid ${p.keep ? "rgba(106,222,177,0.4)" : C.hairline}`,
                }}
              >
                <span style={{ fontSize: 22, fontWeight: 600, color: on > 0.5 ? C.fg : C.fg3 }}>{p.label}</span>
                <Toggle on={on} />
              </div>
            );
          })}
        </div>
      </Glass>
    </Reveal>
  );
};

type Rule = { at: number; title: string; sub: string; extra?: { at: number; text: string }; icon: React.ReactNode; badge?: string; color: string };
const RULES: Rule[] = [
  { at: 16.7, title: "Identité dédiée", sub: "Compte professionnel exclusif", extra: { at: 19.4, text: "plutôt qu'un compte personnel" }, icon: null, badge: "PRO", color: C.violetLight },
  { at: 20.5, title: "Périmètre ciblé", sub: "Droits restreints au besoin réel", icon: <IconFrame size={46} />, color: C.bleu },
  { at: 24.7, title: "Révocation nette", sub: "Clôture immédiate en fin de projet", icon: <IconFileX size={46} />, color: C.bleuVert },
  { at: 29.1, title: "Barrière IA", sub: "Interdiction sur les IA publiques", extra: { at: 32.8, text: "aucune donnée sensible dans les IA grand public" }, icon: <IconBan size={46} />, color: C.beige },
];
const CARD_W = 286;
const CARD_GAP = 20;

const RuleCard: React.FC<{ r: Rule; i: number }> = ({ r, i }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const p = interpolate(frame, [r.at * fps, (r.at + 0.9) * fps], [0, 1], { ...clamp, easing: EASE });
  const q = useExit(OUT, 0.5);
  const next = RULES[i + 1]?.at ?? OUT;
  const active = interpolate(t, [r.at, r.at + 0.5, next, next + 0.5], [0, 1, 1, 0], clamp);
  return (
    <div style={{ position: "absolute", left: SAFE_L + i * (CARD_W + CARD_GAP), top: 400, width: CARD_W, perspective: 1200 }}>
      <div
        style={{
          height: 430,
          borderRadius: 28,
          padding: "30px 24px",
          transform: `rotateY(${(1 - p) * -80}deg) translateZ(${active * 24}px)`,
          transformOrigin: "left center",
          opacity: p * (1 - q),
          background: `linear-gradient(180deg, ${r.color}${active > 0.3 ? "22" : "10"}, rgba(255,255,255,0.02)), rgba(12,10,18,0.85)`,
          border: `1.5px solid ${active > 0.3 ? `${r.color}aa` : C.hairline2}`,
          boxShadow: `0 30px 70px -40px ${r.color}`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: 110,
            height: 110,
            borderRadius: 30,
            display: "grid",
            placeItems: "center",
            background: r.badge ? "#fff" : `${r.color}22`,
            border: r.badge ? "none" : `1px solid ${r.color}66`,
            color: r.color,
          }}
        >
          {r.badge ? <span style={{ fontSize: 44, fontWeight: 800, color: "#2a1d3d", letterSpacing: "-0.02em" }}>{r.badge}</span> : r.icon}
        </div>
        <div style={{ marginTop: 26, fontSize: 32, fontWeight: 800, letterSpacing: "-0.02em" }}>{r.title}</div>
        <div style={{ marginTop: 10, fontSize: 22, fontWeight: 600, color: r.color, lineHeight: 1.3 }}>{r.sub}</div>
        {r.extra ? (
          <Reveal at={r.extra.at} y={8} style={{ marginTop: 16 }}>
            <div style={{ fontSize: 20, color: C.fg2, fontWeight: 500, lineHeight: 1.35 }}>→ {r.extra.text}</div>
          </Reveal>
        ) : null}
      </div>
    </div>
  );
};

export const Access: React.FC = () => (
  <AbsoluteFill style={{ ...baseText }}>
    <div style={{ position: "absolute", left: 160, top: 130, width: 1300 }}>
      <Reveal at={0.2} out={OUT}>
        <Eyebrow color={C.bleu}>Pilier 2</Eyebrow>
      </Reveal>
      <RiseLines
        at={0.4}
        out={OUT}
        style={{ marginTop: 18, fontSize: 60, fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1.04 }}
        lines={[
          <span key="a">
            <GradText>Restreindre</GradText> l'accès
          </span>,
        ]}
      />
      <Reveal at={14.0} out={OUT} style={{ marginTop: 14 }}>
        <div style={{ fontSize: 27, color: C.fg2, fontWeight: 500 }}>En pratique, quatre règles :</div>
      </Reveal>
    </div>

    <Permissions />

    {/* le moindre privilège */}
    <div style={{ position: "absolute", left: 1320, top: 390, width: 500 }}>
      <Reveal at={6.2} out={A_OUT}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 22, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: C.bleu }}>
          <IconKey size={26} /> Le principe
        </div>
      </Reveal>
      <Reveal at={6.4} out={A_OUT} style={{ marginTop: 12 }}>
        <div style={{ fontSize: 52, fontWeight: 800, letterSpacing: "-0.035em", lineHeight: 1.02 }}>
          Le moindre <GradText>privilège</GradText>
        </div>
      </Reveal>
      <Reveal at={10.6} out={A_OUT} style={{ marginTop: 22 }}>
        <div style={{ fontSize: 28, fontWeight: 500, color: C.fg, lineHeight: 1.35 }}>
          Ne donner à chaque collaborateur que les droits <span style={{ color: C.bleuVert, fontWeight: 700 }}>strictement nécessaires</span> à sa mission.
        </div>
      </Reveal>
    </div>

    {RULES.map((r, i) => (
      <RuleCard key={r.title} r={r} i={i} />
    ))}
  </AbsoluteFill>
);
