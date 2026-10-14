import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { IconAlert, IconShield, IconSparkle } from "../../components/icons";
import { Eyebrow, GradText, Glass, Reveal, RiseLines, baseText } from "../../components/ui";
import { C, EASE, GRAD, clamp } from "../../theme";

// 181,5 → 203,7 s. Temps locaux = temps audio − 181,5.
const OUT = 21.6;
const A_OUT = 15.2;

// Réponse d'IA volontairement fausse (exemple fictif), avec les passages
// inventés que la voix off énumère : faits, chiffres, lois, références.
type Seg = { s: string; tag?: string; at?: number };
const ANSWER: Seg[] = [
  { s: "D'après l'étude " },
  { s: "Durand & Marchal (2021)", tag: "Référence inventée", at: 10.36 },
  { s: ", " },
  { s: "73 %", tag: "Chiffre inventé", at: 9.0 },
  { s: " des PME françaises " },
  { s: "ont adopté l'IA dès 2019", tag: "Fait inventé", at: 8.4 },
  { s: ", comme l'impose la " },
  { s: "loi n° 2020-1147", tag: "Loi inventée", at: 9.8 },
  { s: "." },
];
const TYPE_FROM = 5.4;
const TYPE_TO = 8.1;

const Answer: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const total = ANSWER.reduce((n, s) => n + s.s.length, 0);
  let budget = Math.floor(interpolate(frame, [TYPE_FROM * fps, TYPE_TO * fps], [0, total], clamp));
  return (
    <div style={{ fontSize: 34, lineHeight: 1.55, fontWeight: 500, color: C.fg }}>
      {ANSWER.map((seg, i) => {
        const shown = seg.s.slice(0, Math.max(0, budget));
        budget -= seg.s.length;
        if (!seg.tag) return <span key={i}>{shown}</span>;
        const h = interpolate(frame, [seg.at! * fps, (seg.at! + 0.5) * fps], [0, 1], { ...clamp, easing: EASE });
        return (
          <span
            key={i}
            style={{
              backgroundImage: `linear-gradient(90deg, rgba(251,194,173,0.32), rgba(251,194,173,0.32))`,
              backgroundRepeat: "no-repeat",
              backgroundSize: `${h * 100}% 100%`,
              borderRadius: 8,
              padding: "0 4px",
              margin: "0 -4px",
              textDecoration: h > 0.5 ? "underline wavy" : "none",
              textDecorationColor: C.beige,
              textUnderlineOffset: 8,
            }}
          >
            {shown}
          </span>
        );
      })}
    </div>
  );
};

export const Hallucination: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const conf = interpolate(frame, [14.3 * fps, 15.0 * fps], [0, 1], { ...clamp, easing: EASE });
  const tags = ANSWER.filter((s) => s.tag).sort((a, b) => a.at! - b.at!);

  return (
    <AbsoluteFill style={{ ...baseText }}>
      {/* A — définition + exemple */}
      <div style={{ position: "absolute", left: 160, top: 160, width: 740 }}>
        <Reveal at={0.3} out={A_OUT}>
          <Eyebrow color={C.beige}>Limite n° 1</Eyebrow>
        </Reveal>
        <RiseLines
          at={1.7}
          out={A_OUT}
          style={{ marginTop: 24, fontSize: 100, fontWeight: 800, letterSpacing: "-0.045em", lineHeight: 1 }}
          lines={[<GradText key="h" grad={GRAD.beige}>Hallucination</GradText>]}
        />
        <Reveal at={2.4} out={A_OUT} style={{ marginTop: 22 }}>
          <div style={{ fontSize: 33, lineHeight: 1.32, fontWeight: 500, color: C.fg }}>
            Génération de faits, chiffres ou références entièrement inventés, mais rédigés avec assurance.
          </div>
        </Reveal>
        <Reveal at={3.6} out={A_OUT} style={{ marginTop: 26 }}>
          <div style={{ display: "flex", gap: 16, alignItems: "flex-start", fontSize: 26, color: C.fg2, fontWeight: 500, lineHeight: 1.4 }}>
            <span style={{ color: C.beige, flex: "none", marginTop: 2 }}>
              <IconAlert size={30} />
            </span>
            Le modèle cherche toujours à produire le texte le plus fluide possible… quitte à inventer.
          </div>
        </Reveal>
      </div>

      <Reveal at={4.2} out={A_OUT} style={{ position: "absolute", left: 990, top: 210, width: 770 }}>
        <Glass glow={C.beige} style={{ padding: "34px 38px 38px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: C.fg3 }}>
              Exemple fictif
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {[0, 1, 2].map((i) => (
                <span key={i} style={{ width: 10, height: 10, borderRadius: 9, background: "rgba(255,255,255,0.18)" }} />
              ))}
            </div>
          </div>
          <Reveal at={4.6} y={10} style={{ marginTop: 26, display: "flex", justifyContent: "flex-end" }}>
            <div
              style={{
                padding: "16px 24px",
                borderRadius: "24px 24px 6px 24px",
                background: "rgba(255,255,255,0.09)",
                fontSize: 30,
                fontWeight: 500,
              }}
            >
              Quelle part des PME utilise l'IA ?
            </div>
          </Reveal>
          <Reveal at={5.2} y={10} style={{ marginTop: 22, display: "flex", gap: 18 }}>
            <div
              style={{
                flex: "none",
                width: 52,
                height: 52,
                borderRadius: 16,
                display: "grid",
                placeItems: "center",
                backgroundImage: GRAD.violet,
              }}
            >
              <IconSparkle size={28} color="#140d1f" />
            </div>
            <Answer />
          </Reveal>
          <div style={{ marginTop: 28, display: "flex", flexWrap: "wrap", gap: 12 }}>
            {tags.map((s) => (
              <Reveal key={s.tag} at={s.at!} y={10}>
                <div
                  style={{
                    padding: "8px 16px",
                    borderRadius: 999,
                    border: "1px solid rgba(251,194,173,0.5)",
                    background: "rgba(251,194,173,0.1)",
                    color: C.beige,
                    fontSize: 22,
                    fontWeight: 700,
                  }}
                >
                  {s.tag}
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal at={14.2} y={10} style={{ marginTop: 28 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
              <div style={{ fontSize: 24, fontWeight: 600, color: C.fg2, width: 220 }}>Ton employé</div>
              <div style={{ flex: 1, height: 12, borderRadius: 8, background: "rgba(255,255,255,0.08)" }}>
                <div style={{ width: `${conf * 98}%`, height: "100%", borderRadius: 8, backgroundImage: GRAD.beige }} />
              </div>
              <div style={{ fontSize: 24, fontWeight: 700, color: C.beige, width: 210, textAlign: "right" }}>
                très convaincant
              </div>
            </div>
          </Reveal>
        </Glass>
      </Reveal>

      {/* B — la règle absolue */}
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", textAlign: "center", paddingLeft: 380 }}>
        <div style={{ marginTop: -60 }}>
          <Reveal at={15.4} out={OUT}>
            <div style={{ display: "inline-flex" }}>
              <Eyebrow color={C.bleuVert}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
                  <IconShield size={26} color={C.bleuVert} /> Règle absolue
                </span>
              </Eyebrow>
            </div>
          </Reveal>
          <RiseLines
            at={17.9}
            out={OUT}
            stagger={0.12}
            style={{ marginTop: 40, fontSize: 90, fontWeight: 800, letterSpacing: "-0.045em", lineHeight: 1.02 }}
            lines={[
              "L'IA ne remplace jamais",
              <span key="v">
                votre <GradText grad={GRAD.bleu}>vérification</GradText> factuelle.
              </span>,
            ]}
          />
          <Reveal at={19.6} out={OUT} style={{ marginTop: 40 }}>
            <div style={{ fontSize: 32, color: C.fg2, fontWeight: 500 }}>
              Faits, chiffres, lois, sources : vérifiez toujours.
            </div>
          </Reveal>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
