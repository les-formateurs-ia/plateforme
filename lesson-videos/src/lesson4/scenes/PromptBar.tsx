import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { Cursor } from "../../components/Cursor";
import {
  IconBrain,
  IconCheck,
  IconFileText,
  IconFilm,
  IconImage,
  IconListChecks,
  IconSparkle,
  IconTable,
  IconZap,
} from "../../components/icons";
import { Eyebrow, GradText, Reveal, RiseLines, baseText, useEnter } from "../../components/ui";
import { C, EASE, GRAD, clamp } from "../../theme";
import { CONTENT_Y, WIN, Window, useSpot } from "../Window";

// 154,8 → 239 s. Temps locaux = temps audio − 154,8.
const OUT = 83.65;
const RAIL = 70;
const BAR = { x: 140, y: 170, w: 990, h: 76 }; // coordonnées dans la fenêtre
const PROMPT = "Rédige un mail de relance pour un client, ton cordial";
const PLUS_OPEN = [21.1, 45.0];
const MODEL_OPEN = [49.4, 999];

const PLUS_ITEMS = [
  { label: "Importer des fichiers", icon: <IconFileText size={20} />, spot: [26.6, 32.6] },
  { label: "Ajouter depuis Drive", icon: <IconTable size={20} />, spot: [32.8, 39.6] },
  { label: "Plus d'importations ›", icon: <IconListChecks size={20} />, spot: [0, 0] },
  { label: "Créer une image", icon: <IconImage size={20} />, spot: [40.0, 45.0] },
  { label: "Créer une vidéo", icon: <IconFilm size={20} />, spot: [40.5, 45.0] },
  { label: "Plus d'outils ›", icon: <IconSparkle size={20} />, spot: [41.3, 45.0] },
] as const;
const MODELS = [
  { name: "3.6 Flash", sub: "Aide polyvalente", spot: [54.3, 73.0] },
  { name: "3.6 Raisonnement", sub: "Résout des problèmes complexes", spot: [0, 0] },
  { name: "3.1 Pro", sub: "Raisonnement avancé", spot: [73.2, 999] },
] as const;

const Menu: React.FC<{ open: readonly number[]; x: number; w: number; children: React.ReactNode }> = ({ open, x, w, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const p = interpolate(t, [open[0], open[0] + 0.35, open[1], open[1] + 0.3], [0, 1, 1, 0], { ...clamp, easing: EASE });
  if (p <= 0) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: BAR.y + BAR.h + 14,
        width: w,
        padding: 8,
        borderRadius: 18,
        background: "#1A1922",
        border: `1px solid ${C.hairline2}`,
        boxShadow: "0 30px 60px -20px rgba(0,0,0,0.8)",
        opacity: p,
        transformOrigin: "top left",
        scale: String(0.94 + 0.06 * p),
        translate: `0px ${(1 - p) * -8}px`,
      }}
    >
      {children}
    </div>
  );
};

const MenuRow: React.FC<{ spot: readonly number[]; children: React.ReactNode; tall?: boolean }> = ({ spot, children, tall }) => {
  const s = useSpot(spot[0], spot[1]);
  return (
    <div
      style={{
        height: tall ? 74 : 46,
        borderRadius: 12,
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "0 14px",
        background: `rgba(181,141,224,${s * 0.25})`,
        boxShadow: `inset 0 0 0 1px rgba(219,172,240,${s * 0.7})`,
        color: s > 0.3 ? "#fff" : C.fg2,
        fontSize: 19,
        fontWeight: 600,
      }}
    >
      {children}
    </div>
  );
};

const Chip: React.FC<{ at: number; color?: string; children: React.ReactNode }> = ({ at, color = C.violetLight, children }) => (
  <Reveal at={at} y={8}>
    <div
      style={{
        display: "inline-flex",
        padding: "6px 14px",
        borderRadius: 999,
        border: `1px solid ${color}66`,
        background: `${color}18`,
        fontSize: 19,
        fontWeight: 700,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </div>
  </Reveal>
);

const Panel: React.FC<{ x: number; w: number; from: number; to: number; children: React.ReactNode }> = ({ x, w, from, to, children }) => (
  <Reveal at={from} out={to} y={14} style={{ position: "absolute", left: x, top: BAR.y + BAR.h + 24, width: w }}>
    {children}
  </Reveal>
);

export const PromptBar: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const barSpot = useSpot(3.4, 19.6);
  const n = Math.floor(interpolate(frame, [9.8 * fps, 12.8 * fps], [0, PROMPT.length], clamp));
  const caret = t > 9.4 && t < 20 && Math.floor(t * 2) % 2 === 0;
  const flashSpot = useSpot(47.6, 50.0);
  const byDefault = useEnter(72.4, 0.6);

  const plus = { x: WIN.x + BAR.x + 36, y: CONTENT_Y + BAR.y + 38 };
  const flash = { x: WIN.x + BAR.x + BAR.w - 92, y: CONTENT_Y + BAR.y + 38 };
  const row = (i: number) => ({ x: WIN.x + BAR.x + 160, y: CONTENT_Y + BAR.y + BAR.h + 22 + 8 + i * 46 + 23 });
  const mrow = (i: number) => ({ x: WIN.x + BAR.x + BAR.w - 220, y: CONTENT_Y + BAR.y + BAR.h + 22 + 8 + i * 74 + 37 });

  return (
    <AbsoluteFill style={{ ...baseText }}>
      <div style={{ position: "absolute", left: 160, top: 100 }}>
        <Reveal at={0.2} out={OUT}>
          <Eyebrow color={C.bleuVert}>Étape 3</Eyebrow>
        </Reveal>
        <RiseLines
          at={0.4}
          out={OUT}
          style={{ marginTop: 14, fontSize: 56, fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1.04 }}
          lines={[
            <span key="t">
              La <GradText>barre de saisie</GradText>
            </span>,
          ]}
        />
      </div>

      <Window url="gemini.google.com/app" out={OUT} enterAt={0}>
        {/* rail replié */}
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: RAIL, borderRight: `1px solid ${C.hairline}`, background: "rgba(255,255,255,0.02)" }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} style={{ position: "absolute", left: 23, top: 24 + i * 46, width: 24, height: 24, borderRadius: 7, background: "rgba(255,255,255,0.09)" }} />
          ))}
        </div>
        <div
          style={{
            position: "absolute",
            left: RAIL,
            right: 0,
            top: 92,
            textAlign: "center",
            fontSize: 36,
            fontWeight: 600,
            backgroundImage: "linear-gradient(90deg, #8ab4f8, #c58af9)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          Posez vos questions, Les Formateurs !
        </div>
        <div
          style={{
            position: "absolute",
            left: BAR.x,
            top: BAR.y,
            width: BAR.w,
            height: BAR.h,
            borderRadius: 999,
            background: "rgba(255,255,255,0.06)",
            border: `1.5px solid rgba(219,172,240,${0.12 + barSpot * 0.6})`,
            boxShadow: `0 0 0 ${barSpot * 6}px rgba(181,141,224,0.12)`,
            display: "flex",
            alignItems: "center",
            padding: "0 22px",
            gap: 16,
            fontSize: 21,
          }}
        >
          <span style={{ fontSize: 30, color: C.fg2, width: 28, textAlign: "center" }}>+</span>
          <span style={{ flex: 1, color: n > 0 ? C.fg : C.fg3 }}>
            {n > 0 ? PROMPT.slice(0, n) : "Demander à Gemini"}
            <span style={{ opacity: caret ? 1 : 0, color: C.violetLight }}>|</span>
          </span>
          <span
            style={{
              padding: "7px 16px",
              borderRadius: 999,
              background: `rgba(255,255,255,${0.08 + flashSpot * 0.1})`,
              boxShadow: `inset 0 0 0 1px rgba(219,172,240,${flashSpot * 0.7})`,
              color: C.fg2,
              fontSize: 18,
              fontWeight: 600,
            }}
          >
            Flash ▾
          </span>
        </div>

        {/* explication : la barre */}
        <Panel x={BAR.x} w={BAR.w} from={3.6} to={19.8}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 30, fontWeight: 800 }}>Le cœur de l'interface</div>
            <div style={{ marginTop: 8, fontSize: 23, color: C.fg2, fontWeight: 500 }}>C'est ici que vous rédigez vos demandes : vos prompts.</div>
            <Reveal at={14.0} y={8} style={{ marginTop: 22 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "10px 18px", borderRadius: 999, border: "1px solid rgba(106,222,177,0.5)", background: "rgba(106,222,177,0.1)", fontSize: 21, fontWeight: 700 }}>
                <IconCheck size={20} color={C.bleuVert} /> Bien rédiger vos prompts : on vous l'apprend dans cette formation
              </div>
            </Reveal>
          </div>
        </Panel>

        {/* bouton + */}
        <Menu open={PLUS_OPEN} x={BAR.x} w={360}>
          {PLUS_ITEMS.map((it) => (
            <MenuRow key={it.label} spot={it.spot}>
              <span style={{ display: "flex", color: C.fg3 }}>{it.icon}</span>
              {it.label}
            </MenuRow>
          ))}
        </Menu>
        <Panel x={BAR.x + 400} w={BAR.w - 400} from={21.4} to={45.0}>
          <div style={{ fontSize: 28, fontWeight: 800 }}>
            Le bouton <GradText>+</GradText> : les outils de l'IA
          </div>
          <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12, fontSize: 22, color: C.fg2, fontWeight: 500 }}>
            <Reveal at={26.6} y={8}>→ Importer des fichiers à analyser, ajouter des images</Reveal>
            <Reveal at={32.8} y={8}>→ Retravailler vos documents Google Drive</Reveal>
            <Reveal at={40.0} y={8}>→ Générer une image, une vidéo, une présentation…</Reveal>
          </div>
        </Panel>

        {/* sélecteur de modèle */}
        <Menu open={MODEL_OPEN} x={BAR.x + BAR.w - 400} w={400}>
          {MODELS.map((m, i) => (
            <MenuRow key={m.name} spot={m.spot} tall>
              <span style={{ width: 22, display: "flex", color: C.bleuVert }}>{i === 0 ? <IconCheck size={20} /> : null}</span>
              <span style={{ display: "flex", flexDirection: "column" }}>
                <span>{m.name}</span>
                <span style={{ fontSize: 16, color: C.fg3, fontWeight: 500 }}>{m.sub}</span>
              </span>
            </MenuRow>
          ))}
        </Menu>
        <Panel x={BAR.x} w={BAR.w - 440} from={48.8} to={54.0}>
          <div style={{ fontSize: 28, fontWeight: 800 }}>
            Le <GradText>sélecteur de modèle</GradText>
          </div>
          <div style={{ marginTop: 10, fontSize: 22, color: C.fg2, fontWeight: 500, lineHeight: 1.4 }}>
            Il influence la qualité de la réponse : choisissez le modèle le plus pertinent pour votre demande.
          </div>
        </Panel>
        <Panel x={BAR.x} w={BAR.w - 440} from={54.3} to={OUT}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ width: 38, height: 38, borderRadius: 12, display: "grid", placeItems: "center", backgroundImage: GRAD.bleu }}>
              <IconZap size={22} color="#0b1a16" />
            </span>
            <span style={{ fontSize: 26, fontWeight: 800 }}>Flash · rapide</span>
            <span
              style={{
                marginLeft: 8,
                padding: "4px 12px",
                borderRadius: 999,
                background: C.bleuVert,
                color: "#0b1a16",
                fontSize: 17,
                fontWeight: 800,
                opacity: byDefault,
                scale: String(0.8 + 0.2 * byDefault),
              }}
            >
              Par défaut
            </span>
          </div>
          <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 8 }}>
            <Chip at={58.4} color={C.bleu}>Réponses rapides</Chip>
            <Chip at={60.8} color={C.bleu}>Rédaction</Chip>
            <Chip at={61.6} color={C.bleu}>Correction</Chip>
            <Chip at={64.2} color={C.bleu}>Créativité</Chip>
          </div>
          <Reveal at={65.2} y={8} style={{ marginTop: 10 }}>
            <div style={{ fontSize: 19, color: C.fg2, fontWeight: 500 }}>Suffit pour la plupart des demandes, consomme peu de ressources.</div>
          </Reveal>
          <Reveal at={73.2} y={10} style={{ marginTop: 22 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ width: 38, height: 38, borderRadius: 12, display: "grid", placeItems: "center", backgroundImage: GRAD.violet }}>
                <IconBrain size={22} color="#140d1f" />
              </span>
              <span style={{ fontSize: 26, fontWeight: 800 }}>Pro · puissant</span>
            </div>
            <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 8 }}>
              <Chip at={74.6}>Raisonnements complexes</Chip>
              <Chip at={76.5}>Données techniques</Chip>
            </div>
          </Reveal>
        </Panel>
      </Window>

      <Cursor
        from={19.6}
        to={OUT}
        keys={[
          { t: 19.6, x: WIN.x + 640, y: CONTENT_Y + 420 },
          { t: 20.7, ...plus },
          { t: 21.0, ...plus, click: true },
          { t: 26.2, ...plus },
          { t: 26.8, ...row(0) },
          { t: 32.5, ...row(0) },
          { t: 33.1, ...row(1) },
          { t: 39.7, ...row(1) },
          { t: 40.3, ...row(3) },
          { t: 40.8, ...row(4) },
          { t: 41.5, ...row(5) },
          { t: 46.0, ...row(5) },
          { t: 48.8, ...flash },
          { t: 49.2, ...flash, click: true },
          { t: 53.8, ...flash },
          { t: 54.6, ...mrow(0) },
          { t: 72.8, ...mrow(0) },
          { t: 73.6, ...mrow(2) },
          { t: OUT, ...mrow(2) },
        ]}
      />
    </AbsoluteFill>
  );
};
