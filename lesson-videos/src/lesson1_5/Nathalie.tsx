import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import manifestJson from "../generated/lesson1_5-nathalie.json";
import { Glass, Reveal, baseText, useExit } from "../components/ui";
import { IconAlert, IconCheck, IconClock, IconFileX, IconSearch } from "../components/icons";
import { C, EASE, GRAD, clamp } from "../theme";
import { CueCards, CueSteps, NameBanner, SceneTitle } from "../rs6776/kit";
import { LessonVideo, type SceneRender } from "../rs6776/LessonVideo";
import { cue, type Manifest } from "../rs6776/timeline";

// Leçon 1.5 — vidéo personnalisée de Nathalie (supports de formation SIRH).
// Script : docs/formation-rs6776/lecon-1.5/script-video-nathalie.md

export const manifest = manifestJson as unknown as Manifest;

// Capture SIRH stylisée : nom et montant visibles, puis remplacés par une démonstration fictive.
const Capture: SceneRender = (s, out) => <CaptureInner out={out} markAt={cue(s, "nom", 1, 6)} swapAt={cue(s, "fictive", 1, 18)} cacheAt={cue(s, "cache", 1, 21)} />;

const CaptureInner: React.FC<{ out: number; markAt: number; swapAt: number; cacheAt: number }> = ({ out, markAt, swapAt, cacheAt }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const q = useExit(out);
  const mark = interpolate(frame, [markAt * fps, (markAt + 0.5) * fps], [0, 1], { ...clamp, easing: EASE });
  const swap = interpolate(frame, [swapAt * fps, (swapAt + 0.6) * fps], [0, 1], { ...clamp, easing: EASE });
  const field = (label: string, real: string) => (
    <div style={{ display: "flex", alignItems: "center", gap: 20, marginTop: 18, fontSize: 32 }}>
      <span style={{ width: 260, color: C.fg3 }}>{label}</span>
      <span style={{ position: "relative", padding: "6px 16px", borderRadius: 10, background: `${C.beige}${mark > 0 && swap < 1 ? "33" : "00"}`, borderBottom: `3px solid ${swap < 0.5 ? C.beige : C.bleuVert}` }}>
        <span style={{ opacity: 1 - swap }}>{real}</span>
        <span style={{ position: "absolute", left: 16, opacity: swap, color: C.bleuVert, fontWeight: 600 }}>Profil de démonstration</span>
      </span>
    </div>
  );
  return (
    <>
      <SceneTitle eyebrow="Vos captures d'écran" before="Une capture" accent="de démonstration fictive" out={out} />
      <div style={{ ...baseText, position: "absolute", left: 120, top: 340, width: 1100, opacity: 1 - q }}>
        <Glass glow={swap > 0.5 ? C.bleuVert : C.beige} style={{ padding: "34px 40px", borderRadius: 28 }}>
          <div style={{ fontSize: 22, letterSpacing: "0.14em", textTransform: "uppercase", color: C.fg3, fontWeight: 600 }}>Logiciel SIRH · exemple fictif</div>
          <div style={{ marginTop: 8, fontSize: 40, fontWeight: 700 }}>Gestion des congés</div>
          {field("Salarié", "Nom Prénom (exemple)")}
          {field("Montant du bulletin", "0 000,00 € (exemple)")}
        </Glass>
      </div>
      <Reveal at={cacheAt} out={out} style={{ position: "absolute", left: 1290, top: 360, width: 510 }}>
        <Glass glow={C.beige} style={{ ...baseText, padding: "28px 32px", borderRadius: 26 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 30, fontWeight: 700, color: C.beige }}><IconAlert size={32} color={C.beige} />Un cache visuel</div>
          <div style={{ marginTop: 10, fontSize: 26, color: C.fg2 }}>peut être réversible, ou laisser d'autres identifiants.</div>
        </Glass>
      </Reveal>
    </>
  );
};

const Sort: SceneRender = (s, out) => {
  const rows = [
    { at: cue(s, "sécurité", 1, 3), text: "Numéro de sécurité sociale", verdict: "Retiré", tint: C.beige },
    { at: cue(s, "module", 1, 8), text: "Nom du module, gestion des congés", verdict: "Gardé", tint: C.bleuVert },
    { at: cue(s, "capture", 1, 14), text: "Nom d'un salarié dans la capture", verdict: "Retiré", tint: C.beige },
    { at: cue(s, "paragraphe", 1, 18), text: "Nom du client dans un paragraphe générique", verdict: "Retiré", tint: C.beige },
  ];
  return (
    <>
      <SceneTitle eyebrow="Faites le tri" before="Information" accent="par information" out={out} />
      <div style={{ ...baseText, position: "absolute", left: 120, right: 120, top: 340, display: "flex", flexDirection: "column", gap: 18 }}>
        {rows.map((r) => (
          <Reveal key={r.text} at={r.at} out={out}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "22px 30px", borderRadius: 22, background: `${r.tint}16`, border: `1px solid ${r.tint}66` }}>
              <span style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 34, fontWeight: 600 }}>{r.verdict === "Gardé" ? <IconCheck size={34} color={r.tint} /> : <IconFileX size={34} color={r.tint} />}{r.text}</span>
              <span style={{ fontSize: 28, fontWeight: 800, color: r.tint, textTransform: "uppercase", letterSpacing: "0.08em" }}>{r.verdict}</span>
            </div>
          </Reveal>
        ))}
      </div>
    </>
  );
};

const Separate: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="Plusieurs SIRH, plusieurs clients" before="Une conversation" accent="par client" out={out} />
    <div style={{ position: "absolute", left: 220, right: 220, top: 340, display: "grid", gridTemplateColumns: "1fr 40px 1fr", gap: 40 }}>
      <Reveal at={cue(s, "gardez", 1, 3)} out={out}><Glass glow={C.bleu} style={{ ...baseText, height: 220, borderRadius: 28, display: "grid", placeItems: "center", fontSize: 44, fontWeight: 800 }}>Espace client A</Glass></Reveal>
      <Reveal at={cue(s, "distincte", 1, 5)} out={out}><div style={{ height: 220, width: 8, margin: "0 auto", borderRadius: 8, backgroundImage: GRAD.iris }} /></Reveal>
      <Reveal at={cue(s, "chacun", 1, 6)} out={out}><Glass glow={C.bleuVert} style={{ ...baseText, height: 220, borderRadius: 28, display: "grid", placeItems: "center", fontSize: 44, fontWeight: 800 }}>Espace client B</Glass></Reveal>
    </div>
    <CueCards out={out} cols={2} top={620} height={150} cards={[
      { at: cue(s, "fichiers", 1, 10), title: "Fichiers joints, mémoire, historique", icon: <IconSearch size={30} />, tint: C.violet },
      { at: cue(s, "termine", 1, 15), title: "Fin de mission : compte du client abandonné", icon: <IconClock size={30} />, tint: C.beige },
    ]} />
  </>
);

const Review: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="Votre contrôle final" before="Relisez" accent="chaque support" out={out} />
    <CueCards out={out} top={360} height={260} cards={[
      { at: cue(s, "réglage", 1, 4), title: "Un réglage absent de la version du client", icon: <IconAlert size={36} />, tint: C.beige },
      { at: cue(s, "réintroduire", 1, 9), title: "Un nom réel revenu", icon: <IconAlert size={36} />, tint: C.beige },
    ]} />
    <Reveal at={cue(s, "seule", 1, 13)} out={out} style={{ position: "absolute", left: 0, right: 0, top: 720, display: "flex", justifyContent: "center" }}>
      <div style={{ ...baseText, padding: "18px 34px", borderRadius: 999, backgroundImage: GRAD.iris, color: C.ink, fontSize: 30, fontWeight: 700 }}>Vous seule connaissez la configuration réelle</div>
    </Reveal>
  </>
);

const YourTurn: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="À vous" before="Corriger" accent="et justifier" out={out} top={130} />
    <CueSteps out={out} top={330} steps={[
      { at: cue(s, "trierez", 1, 2), text: "Retirer, anonymiser ou garder ?" },
      { at: cue(s, "réflexes", 1, 6), text: "Est-ce déjà le bon réflexe ?" },
      { at: cue(s, "corriger", 1, 10), text: "Corriger et justifier un prompt" },
      { at: cue(s, "corrigé", 1, 16), text: "Comparer au corrigé indicatif" },
    ]} />
  </>
);

const Banner: SceneRender = () => <NameBanner />;

export const Lesson15Nathalie: React.FC = () => (
  <LessonVideo
    manifest={manifest}
    chapters={[
      { label: "Vos supports", sceneIds: ["1", "2", "3"] },
      { label: "Cloisonner, relire", sceneIds: ["4", "5"] },
      { label: "À vous", sceneIds: ["6"] },
    ]}
    render={{
      "1:over": Banner,
      "2": Capture,
      "3": Sort,
      "4": Separate,
      "5": Review,
      "6": YourTurn,
    }}
  />
);
