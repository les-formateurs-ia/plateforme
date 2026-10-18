import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import {
  IconCheck,
  IconFileText,
  IconListChecks,
  IconMail,
  IconNote,
  IconRepeat,
  IconSparkle,
  IconTable,
  IconX,
} from "../../components/icons";
import { Eyebrow, GradText, Reveal, RiseLines, baseText, useEnter, useExit } from "../../components/ui";
import { C, EASE, GRAD, SAFE_L, clamp } from "../../theme";

// 79,4 → 127,6 s. Temps locaux = temps audio − 79,4.
// Les trois caractéristiques d'une tâche idéale pour l'IA, en accordéon :
// la carte dont parle la voix off s'ouvre, les autres se replient.
const OUT = 47.65;
const ROW_X = SAFE_L;
const ROW_W = 1920 - 96 - SAFE_L;
const GAP = 12;
const MIN_W = 282;
const TOP = 300;
const HEIGHT = 590;

// instants clés (locaux) : ouverture de chaque carte, puis récapitulatif
const OPEN = [4.08, 19.2, 32.9];
const SUMMARY = 44.36;
const T = [OPEN[0], OPEN[0] + 0.8, OPEN[1], OPEN[1] + 0.8, OPEN[2], OPEN[2] + 0.8, SUMMARY, SUMMARY + 0.8];
const third = 1 / 3;
const WEIGHTS = [
  [third, 1, 1, 0, 0, 0, 0, third],
  [third, 0, 0, 1, 1, 0, 0, third],
  [third, 0, 0, 0, 0, 1, 1, third],
];

type Card = {
  n: string;
  title: string;
  subtitle: string;
  short: string;
  text: string;
  color: string;
  icon: React.ReactNode;
};
const CARDS: Card[] = [
  {
    n: "01",
    title: "Répétitive",
    subtitle: "Fréquente et prévisible",
    short: "Revient souvent, selon une structure prévisible",
    text: "C'est une tâche réalisée fréquemment selon une structure prévisible. Pour la repérer, notez vos activités pendant une semaine afin de cibler celles qui reviennent systématiquement au quotidien.",
    color: C.violetLight,
    icon: <IconRepeat size={30} />,
  },
  {
    n: "02",
    title: "Logique",
    subtitle: "Sans jugement critique",
    short: "De la méthode, pas de décision stratégique",
    text: "C'est une tâche qui demande uniquement de la méthode et de la rigueur opérationnelle. Elle ne nécessite aucune prise de décision stratégique, ni négociation ou réflexion complexe.",
    color: C.bleu,
    icon: <IconListChecks size={30} />,
  },
  {
    n: "03",
    title: "Documentée",
    subtitle: "Entrée claire → sortie définie",
    short: "Des données en entrée, un livrable précis en sortie",
    text: "C'est une tâche qui part d'informations d'entrée structurées (mails, notes, documents) pour générer un livrable précis en sortie. Le processus de transformation entre l'entrée et la sortie est clairement défini.",
    color: C.bleuVert,
    icon: <IconFileText size={30} />,
  },
];

// --- mini-visuels -----------------------------------------------------------

const DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven"];
const WEEK = [
  { label: "Comptes rendus", days: [1, 1, 1, 1, 1], repeat: true },
  { label: "Réponses aux mails", days: [1, 1, 1, 1, 1], repeat: true },
  { label: "Point d'équipe", days: [1, 0, 0, 1, 0], repeat: false },
  { label: "Devis client", days: [0, 0, 1, 0, 0], repeat: false },
];
const WeekLog: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const hl = useEnter(17.2, 0.8);
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "190px repeat(5, 1fr)", gap: 6, fontSize: 17, color: C.fg3, fontWeight: 600 }}>
        <span />
        {DAYS.map((d) => (
          <span key={d} style={{ textAlign: "center" }}>
            {d}
          </span>
        ))}
      </div>
      {WEEK.map((row, r) => (
        <div key={row.label} style={{ display: "grid", gridTemplateColumns: "190px repeat(5, 1fr)", gap: 6, marginTop: 6, alignItems: "center" }}>
          <span style={{ fontSize: 18, fontWeight: 600, color: row.repeat && hl > 0.5 ? C.fg : C.fg2, whiteSpace: "nowrap" }}>{row.label}</span>
          {row.days.map((on, d) => {
            const p = interpolate(frame, [(10.9 + (r * 5 + d) * 0.06) * fps, (11.3 + (r * 5 + d) * 0.06) * fps], [0, 1], clamp);
            return (
              <div
                key={d}
                style={{
                  height: 24,
                  borderRadius: 7,
                  opacity: p,
                  scale: String(0.7 + 0.3 * p),
                  background: on
                    ? row.repeat
                      ? `rgba(219,172,240,${0.35 + hl * 0.55})`
                      : "rgba(255,255,255,0.22)"
                    : "rgba(255,255,255,0.05)",
                  boxShadow: on && row.repeat && hl > 0 ? `0 0 ${hl * 16}px ${C.violet}` : "none",
                }}
              />
            );
          })}
        </div>
      ))}
      <div style={{ marginTop: 12, fontSize: 19, fontWeight: 700, color: C.violetLight, opacity: hl, translate: `0px ${(1 - hl) * 6}px` }}>
        ↻ Revient chaque jour → candidate idéale
      </div>
    </div>
  );
};

const Tag: React.FC<{ at: number; ok: boolean; children: React.ReactNode }> = ({ at, ok, children }) => (
  <Reveal at={at} y={10}>
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        padding: "9px 18px 9px 10px",
        borderRadius: 999,
        border: `1px solid ${ok ? "rgba(106,222,177,0.5)" : "rgba(251,194,173,0.5)"}`,
        background: ok ? "rgba(106,222,177,0.1)" : "rgba(251,194,173,0.08)",
        fontSize: 21,
        fontWeight: 700,
        whiteSpace: "nowrap",
      }}
    >
      <span style={{ width: 28, height: 28, borderRadius: 99, display: "grid", placeItems: "center", background: ok ? C.bleuVert : C.beige }}>
        {ok ? <IconCheck size={18} color="#140d1f" /> : <IconX size={18} color="#140d1f" />}
      </span>
      {children}
    </div>
  </Reveal>
);
const LogicTags: React.FC = () => (
  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: C.fg3 }}>Demande</div>
      <Tag at={23.0} ok>
        Méthode
      </Tag>
      <Tag at={23.6} ok>
        Rigueur
      </Tag>
    </div>
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: C.fg3 }}>Ne demande pas</div>
      <Tag at={25.3} ok={false}>
        Négociation
      </Tag>
      <Tag at={27.1} ok={false}>
        Décision stratégique
      </Tag>
    </div>
  </div>
);

const Chip: React.FC<{ at: number; icon: React.ReactNode; children: React.ReactNode; out?: boolean }> = ({ at, icon, children, out }) => (
  <Reveal at={at} y={8}>
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "7px 14px 7px 10px",
        borderRadius: 12,
        border: `1px solid ${out ? "rgba(106,222,177,0.55)" : C.hairline2}`,
        background: out ? "rgba(106,222,177,0.12)" : "rgba(255,255,255,0.05)",
        fontSize: 19,
        fontWeight: 600,
        whiteSpace: "nowrap",
        color: out ? C.fg : C.fg2,
      }}
    >
      <span style={{ display: "flex", color: out ? C.bleuVert : C.fg3 }}>{icon}</span>
      {children}
    </div>
  </Reveal>
);
const Flow: React.FC = () => {
  const arrow = useEnter(38.8, 0.8);
  return (
    <div style={{ display: "grid", gridTemplateColumns: "auto 64px 1fr", alignItems: "center", gap: 14 }}>
      <div>
        <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: C.fg3, marginBottom: 8 }}>Entrée</div>
        <div style={{ display: "grid", gridTemplateColumns: "auto auto", gap: 8, justifyContent: "start" }}>
          <Chip at={35.7} icon={<IconNote size={18} />}>Notes</Chip>
          <Chip at={36.3} icon={<IconFileText size={18} />}>Document</Chip>
          <Chip at={37.4} icon={<IconMail size={18} />}>Mail</Chip>
          <Chip at={37.9} icon={<IconTable size={18} />}>Tableau</Chip>
        </div>
      </div>
      <div style={{ display: "grid", placeItems: "center", opacity: arrow }}>
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: 99,
            display: "grid",
            placeItems: "center",
            backgroundImage: GRAD.violet,
            scale: String(0.7 + 0.3 * arrow),
          }}
        >
          <IconSparkle size={26} color="#140d1f" />
        </div>
        <div style={{ marginTop: 6, fontSize: 26, color: C.violetLight }}>→</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-start" }}>
        <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: C.fg3 }}>Sortie</div>
        <Chip at={41.8} icon={<IconFileText size={18} />} out>
          Compte rendu
        </Chip>
        <Chip at={42.9} icon={<IconListChecks size={18} />} out>
          Synthèse
        </Chip>
      </div>
    </div>
  );
};

const VISUALS = [<WeekLog key="w" />, <LogicTags key="l" />, <Flow key="f" />];

// --- carte ------------------------------------------------------------------

const CardView: React.FC<{ i: number; x: number; w: number; a: number }> = ({ i, x, w, a }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const c = CARDS[i];
  const shown = interpolate(frame, [(2.3 + i * 0.12) * fps, (3.2 + i * 0.12) * fps], [0, 1], { ...clamp, easing: EASE });
  const q = useExit(OUT, 0.5);
  const revealed = t >= OPEN[i];
  const titleIn = useEnter(OPEN[i], 0.6);
  const expanded = interpolate(a, [0.55, 0.95], [0, 1], clamp);
  const collapsed = interpolate(a, [0.4, 0.6], [1, 0], clamp);
  const done = useEnter(SUMMARY + 0.2, 0.6);
  const activeBorder = interpolate(a, [0.34, 1], [0, 1], clamp);

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: TOP,
        width: w,
        height: HEIGHT,
        borderRadius: 30,
        overflow: "hidden",
        opacity: shown * (1 - q),
        translate: `0px ${(1 - shown) * 30}px`,
        background: `linear-gradient(180deg, rgba(255,255,255,${0.05 + activeBorder * 0.04}), rgba(255,255,255,0.02)), rgba(12,10,18,0.82)`,
        border: `1.5px solid ${revealed && activeBorder > 0.2 ? `${c.color}aa` : C.hairline2}`,
        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.1), 0 30px 80px -40px ${c.color}${revealed ? "aa" : "00"}`,
      }}
    >
      {/* halo de couleur */}
      <div
        style={{
          position: "absolute",
          width: 600,
          height: 600,
          left: -260,
          top: -320,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${c.color}30, transparent 65%)`,
          opacity: revealed ? 0.4 + activeBorder * 0.6 : 0,
        }}
      />

      {/* état replié */}
      <div style={{ position: "absolute", left: 30, top: 32, width: 222, opacity: collapsed }}>
        <div style={{ fontSize: 60, fontWeight: 800, letterSpacing: "-0.04em", color: revealed ? c.color : C.fg3, lineHeight: 1 }}>{c.n}</div>
        <div style={{ marginTop: 26, opacity: revealed ? titleIn : 1 }}>
          {revealed ? (
            <>
              <div style={{ color: c.color, display: "flex" }}>{c.icon}</div>
              <div style={{ marginTop: 14, fontSize: 36, fontWeight: 800, letterSpacing: "-0.02em" }}>{c.title}</div>
              <div style={{ marginTop: 12, fontSize: 21, color: C.fg2, fontWeight: 500, lineHeight: 1.35 }}>{c.short}</div>
            </>
          ) : (
            <div style={{ fontSize: 24, color: C.fg3, fontWeight: 600 }}>Caractéristique {i + 1}</div>
          )}
        </div>
      </div>
      {/* validé (récapitulatif) */}
      <div
        style={{
          position: "absolute",
          right: 28,
          top: 30,
          width: 56,
          height: 56,
          borderRadius: 99,
          display: "grid",
          placeItems: "center",
          backgroundImage: GRAD.bleu,
          opacity: done,
          scale: String(0.6 + 0.4 * done),
        }}
      >
        <IconCheck size={32} color="#0b1a16" />
      </div>

      {/* état ouvert */}
      <div style={{ position: "absolute", left: 36, top: 32, width: 548, opacity: expanded }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ fontSize: 26, fontWeight: 800, color: c.color }}>{c.n}</div>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 16,
              display: "grid",
              placeItems: "center",
              border: `1px solid ${c.color}66`,
              background: `${c.color}1a`,
              color: c.color,
            }}
          >
            {c.icon}
          </div>
        </div>
        <div style={{ marginTop: 18, fontSize: 50, fontWeight: 800, letterSpacing: "-0.035em", lineHeight: 1 }}>{c.title}</div>
        <Reveal at={OPEN[i] + 1.0} y={8} style={{ marginTop: 10 }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: c.color }}>{c.subtitle}</div>
        </Reveal>
        <Reveal at={OPEN[i] + 1.6} y={10} style={{ marginTop: 16 }}>
          <div style={{ fontSize: 20, color: C.fg2, fontWeight: 500, lineHeight: 1.4 }}>{c.text}</div>
        </Reveal>
        <div style={{ marginTop: 22 }}>{VISUALS[i]}</div>
      </div>
    </div>
  );
};

export const Criteria: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const weights = WEIGHTS.map((v) => interpolate(t, T, v, { ...clamp, easing: EASE }));
  const flex = ROW_W - GAP * 2 - MIN_W * 3;
  let x = ROW_X;
  const layout = weights.map((a) => {
    const w = MIN_W + a * flex;
    const r = { x, w, a };
    x += w + GAP;
    return r;
  });

  return (
    <AbsoluteFill style={{ ...baseText }}>
      <div style={{ position: "absolute", left: 160, top: 140 }}>
        <Reveal at={0.2} out={OUT}>
          <Eyebrow>Concrètement, au travail</Eyebrow>
        </Reveal>
        <RiseLines
          at={0.4}
          out={OUT}
          style={{ marginTop: 18, fontSize: 60, fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1 }}
          lines={[
            <span key="t">
              Une tâche idéale pour l'IA : <GradText>3 caractéristiques</GradText>
            </span>,
          ]}
        />
      </div>

      {layout.map((l, i) => (
        <CardView key={i} i={i} x={l.x} w={l.w} a={l.a} />
      ))}

      <Reveal at={SUMMARY + 0.6} out={OUT} style={{ position: "absolute", left: ROW_X, width: ROW_W, top: TOP + HEIGHT + 30, textAlign: "center" }}>
        <div style={{ fontSize: 32, fontWeight: 700 }}>
          Les 3 cases sont cochées → <GradText>l'IA peut optimiser cette tâche</GradText>
        </div>
      </Reveal>
    </AbsoluteFill>
  );
};
