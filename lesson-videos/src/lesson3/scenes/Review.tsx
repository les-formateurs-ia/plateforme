import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { IconAlert, IconCheck, IconClock, IconSearch, IconSend, IconSparkle } from "../../components/icons";
import { Eyebrow, Glass, GradText, Reveal, RiseLines, baseText, useEnter } from "../../components/ui";
import { C, EASE, GRAD, SAFE_L, clamp } from "../../theme";

// 113,4 → 135,4 s. Temps locaux = temps audio − 113,4.
// Relecture du prompt avant envoi : un balayage repère une donnée oubliée.
const OUT = 21.45;
const SCAN_FROM = 10.8;
const SCAN_TO = 13.6;
const FOUND = 12.4;
const REMOVED = 13.8;
const READY = 14.2;

const Leak: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const spot = interpolate(frame, [FOUND * fps, (FOUND + 0.4) * fps], [0, 1], clamp);
  const gone = interpolate(frame, [REMOVED * fps, (REMOVED + 0.5) * fps], [0, 1], { ...clamp, easing: EASE });
  if (gone > 0.5) {
    return <span style={{ padding: "1px 8px", borderRadius: 6, background: "rgba(106,222,177,0.18)", color: C.bleuVert, fontWeight: 700 }}>[supprimé]</span>;
  }
  return (
    <span
      style={{
        position: "relative",
        padding: "1px 4px",
        borderRadius: 6,
        background: `rgba(251,194,173,${spot * 0.3})`,
        color: spot > 0.5 ? C.fg : C.fg2,
        fontWeight: spot > 0.5 ? 700 : 500,
        opacity: 1 - gone * 1.6,
      }}
    >
      marie.dupont@entreprise.fr
      <span
        style={{
          position: "absolute",
          left: 0,
          top: -34,
          whiteSpace: "nowrap",
          fontSize: 16,
          fontWeight: 700,
          color: C.beige,
          opacity: spot,
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <IconAlert size={16} color={C.beige} /> Donnée confidentielle
      </span>
    </span>
  );
};

const PromptCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const scan = interpolate(frame, [SCAN_FROM * fps, SCAN_TO * fps], [0, 1], { ...clamp, easing: EASE });
  const scanOn = interpolate(frame, [SCAN_FROM * fps, (SCAN_FROM + 0.3) * fps, (SCAN_TO - 0.2) * fps, SCAN_TO * fps], [0, 1, 1, 0], clamp);
  const ready = useEnter(READY, 0.6);
  return (
    <Reveal at={9.0} out={OUT} y={24} style={{ position: "absolute", left: SAFE_L, top: 380, width: 690 }}>
      <Glass glow={C.violet} style={{ padding: "26px 30px", borderRadius: 26, overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 21, fontWeight: 700 }}>
          <span style={{ width: 36, height: 36, borderRadius: 11, display: "grid", placeItems: "center", backgroundImage: GRAD.violet }}>
            <IconSparkle size={20} color="#140d1f" />
          </span>
          Votre prompt, avant envoi
        </div>
        <div style={{ position: "relative", marginTop: 22, fontSize: 24, lineHeight: 1.65, color: C.fg2, fontWeight: 500 }}>
          Rédige la synthèse de l'entretien annuel de <span style={{ color: C.fg, fontWeight: 600 }}>Salarié A</span> : objectifs
          atteints 4/5, axe de progrès : la prise de parole. Ton bienveillant, 10 lignes maximum. Envoie-la à <Leak />.
          {/* balayage : bande lumineuse façon scanner (pas un trait, qui se lirait comme un barré) */}
          <div
            style={{
              position: "absolute",
              left: -30,
              right: -30,
              top: `calc(${scan * 100}% - 56px)`,
              height: 60,
              background: `linear-gradient(180deg, transparent, rgba(120,213,226,0.16))`,
              borderBottom: `2px solid ${C.bleu}`,
              boxShadow: `0 10px 30px -6px ${C.bleu}`,
              opacity: scanOn,
            }}
          />
        </div>
        <div style={{ marginTop: 26, display: "flex", justifyContent: "flex-end" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              padding: "12px 22px",
              borderRadius: 999,
              fontSize: 22,
              fontWeight: 700,
              color: ready > 0.5 ? "#140d1f" : C.fg3,
              background: ready > 0.5 ? undefined : "rgba(255,255,255,0.06)",
              backgroundImage: ready > 0.5 ? GRAD.violet : undefined,
              scale: String(1 + Math.sin(Math.PI * ready) * 0.06),
            }}
          >
            <IconSend size={22} color={ready > 0.5 ? "#140d1f" : C.fg3} /> Envoyer
          </div>
        </div>
      </Glass>
    </Reveal>
  );
};

const CHECKS = [
  { at: 11.2, label: "Aucun nom, aucun prénom" },
  { at: 12.4, label: "Aucune adresse e-mail", fixAt: REMOVED + 0.2 },
  { at: 13.0, label: "Aucun numéro (tél., matricule…)" },
  { at: 13.4, label: "Aucune donnée financière" },
];
const Check: React.FC<{ at: number; label: string; fixAt?: number }> = ({ at, label, fixAt }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const warn = fixAt !== undefined && t < fixAt;
  return (
    <Reveal at={at} out={OUT} y={10}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 25, fontWeight: 600 }}>
        <span
          style={{
            width: 34,
            height: 34,
            borderRadius: 99,
            display: "grid",
            placeItems: "center",
            background: warn ? C.beige : C.bleuVert,
          }}
        >
          {warn ? <IconAlert size={20} color="#140d1f" /> : <IconCheck size={20} color="#0b1a16" />}
        </span>
        <span style={{ color: warn ? C.beige : C.fg }}>{label}</span>
      </div>
    </Reveal>
  );
};

export const Review: React.FC = () => (
  <AbsoluteFill style={{ ...baseText }}>
    <div style={{ position: "absolute", left: 160, top: 130, width: 1400 }}>
      <Reveal at={0.2} out={OUT}>
        <Eyebrow color={C.bleuVert}>Pilier 3</Eyebrow>
      </Reveal>
      <RiseLines
        at={0.4}
        out={OUT}
        style={{ marginTop: 18, fontSize: 60, fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1.04 }}
        lines={[
          <span key="r">
            La <GradText>revue manuelle</GradText>
          </span>,
        ]}
      />
      <Reveal at={5.4} out={OUT} style={{ marginTop: 14 }}>
        <div style={{ fontSize: 27, color: C.fg2, fontWeight: 500 }}>
          Même après avoir anonymisé et cadré la requête : <span style={{ color: C.fg, fontWeight: 700 }}>votre dernier atout.</span>
        </div>
      </Reveal>
    </div>

    <PromptCard />

    <div style={{ position: "absolute", left: 1360, top: 390, width: 460 }}>
      <Reveal at={10.6} out={OUT}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 22, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: C.fg3 }}>
          <IconSearch size={24} /> Je vérifie
        </div>
      </Reveal>
      <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 16 }}>
        {CHECKS.map((c) => (
          <Check key={c.label} {...c} />
        ))}
      </div>
      <Reveal at={15.6} out={OUT} y={12} style={{ marginTop: 36 }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 12,
            padding: "12px 22px 12px 14px",
            borderRadius: 999,
            border: "1px solid rgba(120,213,226,0.5)",
            background: "rgba(120,213,226,0.1)",
            fontSize: 24,
            fontWeight: 700,
          }}
        >
          <IconClock size={24} color={C.bleu} /> Quelques secondes
        </div>
      </Reveal>
      <Reveal at={19.6} out={OUT} y={10} style={{ marginTop: 16 }}>
        <div style={{ fontSize: 26, fontWeight: 700 }}>
          → <GradText>zéro risque inutile</GradText>
        </div>
      </Reveal>
    </div>
  </AbsoluteFill>
);
