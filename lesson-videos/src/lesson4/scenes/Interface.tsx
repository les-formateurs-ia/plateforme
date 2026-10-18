import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Cursor } from "../../components/Cursor";
import {
  IconClock,
  IconFeather,
  IconFilm,
  IconImage,
  IconKey,
  IconSearch,
  IconSparkle,
  IconTable,
} from "../../components/icons";
import { Eyebrow, GradText, Reveal, RiseLines, baseText } from "../../components/ui";
import { C, GRAD, clamp } from "../../theme";
import { CONTENT_Y, WIN, Window, useSpot } from "../Window";

// 70,8 → 155 s. Temps locaux = temps audio − 70,8.
// L'interface principale de Gemini, zone par zone.
const OUT = 83.65;
const SIDE_W = 260;

type Item = { id: string; label: string; icon: React.ReactNode; y: number };
const ITEMS: Item[] = [
  { id: "new", label: "Nouvelle discussion", icon: <IconFeather size={20} />, y: 20 },
  { id: "search", label: "Rechercher", icon: <IconSearch size={20} />, y: 68 },
  { id: "images", label: "Images", icon: <IconImage size={20} />, y: 128 },
  { id: "videos", label: "Vidéos", icon: <IconFilm size={20} />, y: 176 },
  { id: "lib", label: "Bibliothèque", icon: <IconTable size={20} />, y: 224 },
  { id: "gems", label: "Gems", icon: <IconSparkle size={20} />, y: 272 },
];
const HISTORY = ["Synthèse réunion d'équipe", "Mail de relance client", "Idées de posts LinkedIn"];
const HIST_Y = 360;

// fenêtres de mise en avant (temps locaux)
const SPOT = {
  side: [14.8, 19.6],
  new: [19.6, 27.2],
  media: [27.2, 28.6],
  images: [28.6, 35.2],
  videos: [35.2, 42.6],
  gems: [42.6, 58.0],
  history: [58.0, 70.8],
  search: [65.6, 70.8],
  settings: [70.8, 83.6],
} as const;

const SideItem: React.FC<{ it: Item; spot: number }> = ({ it, spot }) => (
  <div
    style={{
      position: "absolute",
      left: 12,
      top: it.y,
      width: SIDE_W - 24,
      height: 42,
      borderRadius: 12,
      display: "flex",
      alignItems: "center",
      gap: 14,
      padding: "0 14px",
      fontSize: 18,
      fontWeight: 600,
      whiteSpace: "nowrap",
      color: spot > 0.3 ? "#fff" : C.fg2,
      background: `rgba(181,141,224,${spot * 0.28})`,
      boxShadow: `inset 0 0 0 1px rgba(219,172,240,${spot * 0.7})`,
    }}
  >
    <span style={{ display: "flex", color: spot > 0.3 ? C.violetLight : C.fg3 }}>{it.icon}</span>
    {it.label}
  </div>
);

const Callout: React.FC<{ from: number; to: number; num?: string; title: string; children?: React.ReactNode }> = ({ from, to, num, title, children }) => (
  <Reveal at={from} out={to} y={16} style={{ position: "absolute", left: SIDE_W + 40, right: 40, top: 300 }}>
    <div
      style={{
        padding: "22px 26px",
        borderRadius: 22,
        border: "1px solid rgba(219,172,240,0.35)",
        background: "linear-gradient(180deg, rgba(181,141,224,0.16), rgba(181,141,224,0.04)), rgba(12,10,18,0.85)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {num ? (
          <span style={{ width: 34, height: 34, borderRadius: 99, display: "grid", placeItems: "center", backgroundImage: GRAD.violet, color: "#140d1f", fontSize: 18, fontWeight: 800 }}>
            {num}
          </span>
        ) : null}
        <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em" }}>{title}</div>
      </div>
      {children ? <div style={{ marginTop: 12, fontSize: 22, color: C.fg2, fontWeight: 500, lineHeight: 1.4 }}>{children}</div> : null}
    </div>
  </Reveal>
);

const Mini: React.FC<{ at: number; children: React.ReactNode }> = ({ at, children }) => (
  <Reveal at={at} y={8}>
    <div style={{ display: "inline-flex", padding: "6px 14px", borderRadius: 999, background: "rgba(255,255,255,0.07)", border: `1px solid ${C.hairline2}`, fontSize: 19, fontWeight: 600, color: C.fg, whiteSpace: "nowrap" }}>
      {children}
    </div>
  </Reveal>
);

export const Interface: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const s = {
    side: useSpot(...SPOT.side),
    new: useSpot(...SPOT.new),
    media: useSpot(...SPOT.media),
    images: useSpot(...SPOT.images),
    videos: useSpot(...SPOT.videos),
    gems: useSpot(...SPOT.gems),
    history: useSpot(...SPOT.history),
    search: useSpot(...SPOT.search),
    settings: useSpot(...SPOT.settings),
  };
  const spotOf = (id: string) =>
    id === "new" ? s.new : id === "images" ? Math.max(s.images, s.media) : id === "videos" ? Math.max(s.videos, s.media) : id === "lib" ? s.media : id === "gems" ? s.gems : id === "search" ? s.search : 0;
  const clean = interpolate(t, [5.2, 5.8, 12.0, 12.6], [0, 1, 1, 0], clamp);

  const item = (id: string) => {
    const it = ITEMS.find((i) => i.id === id)!;
    return { x: WIN.x + 150, y: CONTENT_Y + it.y + 21 };
  };
  const hist = { x: WIN.x + 150, y: CONTENT_Y + HIST_Y + 60 };
  const gear = { x: WIN.x + SIDE_W - 34, y: WIN.y + WIN.h - 34 };

  return (
    <AbsoluteFill style={{ ...baseText }}>
      <div style={{ position: "absolute", left: 160, top: 100 }}>
        <Reveal at={0.2} out={OUT}>
          <Eyebrow>Étape 2</Eyebrow>
        </Reveal>
        <RiseLines
          at={0.4}
          out={OUT}
          style={{ marginTop: 14, fontSize: 56, fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1.04 }}
          lines={[
            <span key="t">
              Prendre en main <GradText>l'interface</GradText>
            </span>,
          ]}
        />
      </div>

      <Window url="gemini.google.com/app" out={OUT} enterAt={0}>
        {/* menu latéral */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: SIDE_W,
            background: "rgba(255,255,255,0.025)",
            borderRight: `1px solid ${C.hairline}`,
            boxShadow: `inset 0 0 0 2px rgba(219,172,240,${s.side * 0.8})`,
          }}
        >
          {ITEMS.map((it) => (
            <SideItem key={it.id} it={it} spot={spotOf(it.id)} />
          ))}
          <div style={{ position: "absolute", left: 26, top: HIST_Y - 26, fontSize: 15, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: C.fg3 }}>
            Récentes
          </div>
          <div
            style={{
              position: "absolute",
              left: 12,
              top: HIST_Y,
              width: SIDE_W - 24,
              borderRadius: 12,
              padding: "6px 0",
              background: `rgba(181,141,224,${s.history * 0.2})`,
              boxShadow: `inset 0 0 0 1px rgba(219,172,240,${s.history * 0.7})`,
            }}
          >
            {HISTORY.map((h) => (
              <div key={h} style={{ padding: "7px 14px", fontSize: 17, color: s.history > 0.3 ? C.fg : C.fg3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {h}
              </div>
            ))}
          </div>
          <div style={{ position: "absolute", left: 26, bottom: 62, display: "flex", alignItems: "center", gap: 12, fontSize: 18, color: C.fg3, fontWeight: 600 }}>
            <IconClock size={18} /> Activité
          </div>
          <div style={{ position: "absolute", left: 14, right: 14, bottom: 12, height: 42, display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ width: 30, height: 30, borderRadius: 99, backgroundImage: GRAD.violet }} />
            <span style={{ fontSize: 16, fontWeight: 600, color: C.fg2, flex: 1 }}>Les Formateurs IA · Pro</span>
            <span
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                display: "grid",
                placeItems: "center",
                color: s.settings > 0.3 ? "#140d1f" : C.fg2,
                background: s.settings > 0.3 ? C.violetLight : "rgba(255,255,255,0.06)",
              }}
            >
              <IconKey size={18} />
            </span>
          </div>
        </div>

        {/* zone principale */}
        <div
          style={{
            position: "absolute",
            left: SIDE_W,
            right: 0,
            top: 120,
            textAlign: "center",
            fontSize: 38,
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
            left: SIDE_W + 90,
            right: 90,
            top: 190,
            height: 64,
            borderRadius: 999,
            background: "rgba(255,255,255,0.06)",
            border: `1px solid ${C.hairline2}`,
            display: "flex",
            alignItems: "center",
            padding: "0 22px",
            gap: 16,
            fontSize: 20,
            color: C.fg3,
          }}
        >
          <span style={{ fontSize: 26 }}>+</span>
          <span style={{ flex: 1 }}>Demander à Gemini</span>
          <span style={{ padding: "6px 14px", borderRadius: 999, background: "rgba(255,255,255,0.08)", color: C.fg2, fontSize: 17 }}>Flash ▾</span>
        </div>
        <div style={{ position: "absolute", left: SIDE_W + 12, bottom: 16, display: "flex", alignItems: "center", gap: 8, opacity: 0.6 }}>
          <Img src={staticFile("tools/gemini.png")} style={{ width: 18, height: 18 }} />
          <span style={{ fontSize: 14, color: C.fg3 }}>Gemini</span>
        </div>

        {/* explications */}
        <Callout from={5.2} to={12.4} title="Une interface épurée">
          Pour vous concentrer sur vos échanges avec l'IA.
        </Callout>
        <Callout from={12.6} to={19.4} num="1" title="Le menu latéral, à gauche" />
        <Callout from={19.6} to={27.0} num="2" title="Nouvelle discussion">
          Pour commencer un nouvel échange.
        </Callout>
        <Callout from={27.2} to={42.4} num="3" title="Les raccourcis médias">
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Reveal at={28.6} y={8}>
              <span style={{ color: C.fg, fontWeight: 700 }}>Images</span> — création visuelle et vos visuels générés.
            </Reveal>
            <Reveal at={35.2} y={8}>
              <span style={{ color: C.fg, fontWeight: 700 }}>Vidéos</span> — génération et traitement de contenu animé.
            </Reveal>
          </div>
        </Callout>
        <Callout from={42.6} to={57.8} num="4" title="Vos Gems">
          <Reveal at={45.8} y={8}>
            Un <span style={{ color: C.fg, fontWeight: 700 }}>assistant sur mesure</span>, dédié à une tâche précise.
          </Reveal>
          <Reveal at={52.3} y={8} style={{ marginTop: 8 }}>
            Il garde vos consignes <span style={{ color: C.bleuVert, fontWeight: 700 }}>en mémoire</span> : plus besoin de tout réexpliquer.
          </Reveal>
        </Callout>
        <Callout from={58.0} to={70.6} num="5" title="L'historique">
          Retrouvez vos échanges à tout moment :
          <div style={{ marginTop: 10, display: "flex", gap: 10 }}>
            <Mini at={65.6}>par date</Mini>
            <Mini at={67.8}>par recherche textuelle</Mini>
          </div>
        </Callout>
        <Callout from={70.8} to={OUT} num="6" title="Les paramètres, en bas à gauche">
          Personnalisez votre expérience :
          <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 10 }}>
            <Mini at={76.9}>Abonnement</Mini>
            <Mini at={78.4}>Données personnelles</Mini>
            <Mini at={80.6}>Suppression auto de l'historique</Mini>
            <Mini at={82.0}>Autorisations</Mini>
          </div>
        </Callout>
        <div style={{ position: "absolute", inset: 0, opacity: clean, pointerEvents: "none", boxShadow: "inset 0 0 0 2px rgba(219,172,240,0.5)", borderRadius: 0 }} />
      </Window>

      <Cursor
        from={18.8}
        to={OUT}
        keys={[
          { t: 18.8, x: WIN.x + 700, y: CONTENT_Y + 330 },
          { t: 20.0, ...item("new") },
          { t: 20.4, ...item("new"), click: true },
          { t: 28.2, ...item("new") },
          { t: 28.8, ...item("images") },
          { t: 34.9, ...item("images") },
          { t: 35.5, ...item("videos") },
          { t: 42.4, ...item("videos") },
          { t: 43.0, ...item("gems") },
          { t: 57.8, ...item("gems") },
          { t: 58.5, ...hist },
          { t: 65.2, ...hist },
          { t: 65.9, ...item("search") },
          { t: 70.4, ...item("search") },
          { t: 70.8, ...gear },
          { t: 71.1, ...gear, click: true },
          { t: OUT, ...gear },
        ]}
      />
    </AbsoluteFill>
  );
};
