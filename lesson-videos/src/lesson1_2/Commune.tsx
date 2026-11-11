import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import manifestJson from "../generated/lesson1_2-commune.json";
import { Glass, Reveal, baseText, useExit } from "../components/ui";
import { IconAlert, IconCalendar, IconCheck, IconClock, IconEye, IconLock, IconRepeat, IconSearch, IconSparkle, IconTarget, IconTrendUp, IconX } from "../components/icons";
import { C, EASE, GRAD, clamp } from "../theme";
import { CueCards, CueSteps, NameBanner, SceneTitle } from "../rs6776/kit";
import { LessonVideo, type SceneRender } from "../rs6776/LessonVideo";
import { cue, type Manifest } from "../rs6776/timeline";

// Leçon 1.2 « Analyser son poste et identifier les tâches automatisables » — vidéo commune.
// Script : docs/formation-rs6776/lecon-1.2/script-video-commune.md

export const manifest = manifestJson as unknown as Manifest;

/* ---------- briques locales ---------- */

const Pill: React.FC<{ at: number; out: number; top: number; children: React.ReactNode }> = ({ at, out, top, children }) => (
  <Reveal at={at} out={out} style={{ position: "absolute", left: 0, right: 0, top, display: "flex", justifyContent: "center" }}>
    <div style={{ ...baseText, padding: "22px 40px", borderRadius: 999, backgroundImage: GRAD.iris, color: C.ink, fontSize: 32, fontWeight: 700 }}>{children}</div>
  </Reveal>
);

/* ---------- scènes ---------- */

const Objective: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="Objectif de la leçon" before="Du réflexe" accent="à la méthode" out={out} />
    <CueCards out={out} top={380} height={280} cards={[
      { at: cue(s, "repérer", 1, 3), title: "Repérer vos tâches candidates", icon: <IconSearch size={38} />, tint: C.violet },
      { at: cue(s, "reconnaître", 1, 5), title: "Reconnaître un quick win", icon: <IconSparkle size={38} />, tint: C.bleuVert },
    ]} />
    <Pill at={cue(s, "exercice", 1, 8)} out={out} top={740}>Exercice 1 de l'écrit : le tableau des tâches à optimiser</Pill>
  </>
);

const Pitfalls: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="Sans méthode" before="Deux pièges" accent="symétriques" out={out} />
    <CueCards out={out} top={360} height={300} cards={[
      { at: cue(s, "premier", 1, 2), title: "Disperser l'effort", text: "Essayer partout, sans rien de mesurable.", icon: <IconAlert size={38} />, tint: C.beige },
      { at: cue(s, "second", 1, 9), title: "Oublier les tâches routinières", text: "De bons candidats passent inaperçus.", icon: <IconEye size={38} />, tint: C.beige },
    ]} />
    <Pill at={cue(s, "méthode", 2, 15)} out={out} top={740}>Une courte liste de candidats, classés par priorité</Pill>
  </>
);

const Method: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="Repérer vos candidats" before="La méthode en" accent="quatre étapes" out={out} />
    <CueSteps out={out} left={120} top={360} width={1680} size={42} steps={[
      { at: cue(s, "listez", 1, 3), text: "Lister · toutes les tâches récurrentes d'une semaine type" },
      { at: cue(s, "chronométrez-les", 1, 9), text: "Chronométrer · un ordre de grandeur par semaine" },
      { at: cue(s, "évaluez", 1, 15), text: "Évaluer la répétitivité · même structure chaque semaine" },
      { at: cue(s, "croisez", 1, 21), text: "Croiser avec la faisabilité · texte, image ou synthèse" },
    ]} />
    <Reveal at={cue(s, "jugement", 1, 34)} out={out} style={{ position: "absolute", left: 120, top: 820 }}>
      <div style={{ ...baseText, display: "flex", alignItems: "center", gap: 14, fontSize: 30, color: C.beige, fontWeight: 600 }}><IconX size={32} color={C.beige} />Jugement, négociation, décision : restent de votre ressort</div>
    </Reveal>
  </>
);

const Criteria: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="Départager" before="Quatre critères pour" accent="démarrer" out={out} />
    <CueCards out={out} top={360} height={260} cards={[
      { at: cue(s, "attendu", 1, 3), title: "Impact", icon: <IconTrendUp size={36} />, tint: C.violet },
      { at: cue(s, "répétitivité", 1, 4), title: "Répétitivité", icon: <IconRepeat size={36} />, tint: C.bleu },
      { at: cue(s, "qualité", 1, 5), title: "Qualité mesurable", icon: <IconCheck size={36} />, tint: C.bleuVert },
      { at: cue(s, "informations", 1, 6), title: "Informations à protéger", icon: <IconLock size={36} />, tint: C.beige },
    ]} />
    <Reveal at={cue(s, "politique", 1, 16)} out={out} style={{ position: "absolute", left: 120, right: 120, top: 700 }}>
      <Glass glow={C.beige} style={{ ...baseText, padding: "28px 38px", borderRadius: 26, display: "flex", alignItems: "center", gap: 24 }}>
        <IconLock size={40} color={C.beige} />
        <div>
          <div style={{ fontSize: 34, fontWeight: 700 }}>Politique de votre structure d'abord</div>
          <div style={{ fontSize: 26, color: C.fg2, marginTop: 6 }}>Outil et compte autorisés, réglages vérifiés. Remplacer un nom par un code ne suffit pas toujours.</div>
        </div>
      </Glass>
    </Reveal>
  </>
);

// Repère gain × difficulté : les quatre zones s'allument au mot qui les nomme.
const Matrix: SceneRender = (s, out) => (
  <MatrixInner out={out} axesAt={cue(s, "difficulté", 1, 3)} zones={[
    { at: cue(s, "quick", 1, 14), label: "Quick win", sub: "Fort gain · faible difficulté", tint: C.bleuVert, col: 0, row: 0 },
    { at: cue(s, "projet", 1, 20), label: "Projet à planifier", sub: "Fort gain · difficulté élevée", tint: C.violet, col: 1, row: 0 },
    { at: cue(s, "amélioration", 1, 24), label: "Amélioration mineure", sub: "Faible gain · faible difficulté", tint: C.bleu, col: 0, row: 1 },
    { at: cue(s, "écarter", 1, 28), label: "À écarter pour l'instant", sub: "Faible gain · difficulté élevée", tint: C.beige, col: 1, row: 1 },
  ]} />
);

const MatrixInner: React.FC<{ out: number; axesAt: number; zones: { at: number; label: string; sub: string; tint: string; col: number; row: number }[] }> = ({ out, axesAt, zones }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const q = useExit(out);
  const ax = interpolate(frame, [axesAt * fps, (axesAt + 0.9) * fps], [0, 1], { ...clamp, easing: EASE });
  const L = 420, T = 330, W = 1200, H = 600;
  return (
    <>
      <SceneTitle eyebrow="Le quick win" before="Gain" accent="× difficulté" out={out} />
      <div style={{ ...baseText, position: "absolute", left: L, top: T, width: W, height: H, opacity: 1 - q }}>
        <div style={{ position: "absolute", left: 0, top: 0, width: 4, height: H * ax, background: C.fg2, borderRadius: 4 }} />
        <div style={{ position: "absolute", left: 0, top: H - 4, width: W * ax, height: 4, background: C.fg2, borderRadius: 4 }} />
        <div style={{ position: "absolute", left: -300, top: 10, width: 270, textAlign: "right", fontSize: 28, color: C.fg2, fontWeight: 600, opacity: ax }}>↑ Gain de temps</div>
        <div style={{ position: "absolute", right: 0, top: H + 18, fontSize: 28, color: C.fg2, fontWeight: 600, opacity: ax }}>Difficulté de mise en place →</div>
        {zones.map((z) => {
          const p = interpolate(frame, [z.at * fps, (z.at + 0.7) * fps], [0, 1], { ...clamp, easing: EASE });
          const next = Math.min(out, ...zones.filter((x) => x.at > z.at).map((x) => x.at));
          const active = t >= z.at && t < next;
          return (
            <div key={z.label} style={{ position: "absolute", left: 30 + z.col * (W / 2), top: 10 + z.row * (H / 2), width: W / 2 - 50, height: H / 2 - 40, borderRadius: 28, padding: "30px 34px", background: `${z.tint}${active ? "33" : "1c"}`, border: `1px solid ${z.tint}${active ? "aa" : "55"}`, opacity: p, scale: String(0.96 + 0.04 * p) }}>
              <div style={{ fontSize: 44, fontWeight: 800, letterSpacing: "-0.03em" }}>{z.label}</div>
              <div style={{ marginTop: 10, fontSize: 26, color: C.fg2 }}>{z.sub}</div>
            </div>
          );
        })}
      </div>
    </>
  );
};

const Compare: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="Deux analyses" before="Vague ou" accent="mesurable" out={out} />
    <div style={{ ...baseText, position: "absolute", left: 120, right: 120, top: 360, display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 32 }}>
      <Reveal at={cue(s, "mauvaise", 1, 2)} out={out}>
        <Glass glow={C.beige} style={{ padding: "36px 40px", borderRadius: 28, height: 470, borderColor: `${C.beige}77` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 24, color: C.beige, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}><IconX size={28} color={C.beige} />Trop vague</div>
          <div style={{ marginTop: 22, fontSize: 40, fontWeight: 700, lineHeight: 1.15 }}>« L'IA pour tout mon travail »</div>
          <div style={{ marginTop: 18, fontSize: 28, color: C.fg2 }}>Rien n'est priorisé.</div>
        </Glass>
      </Reveal>
      <Reveal at={cue(s, "bonne", 1, 7)} out={out}>
        <Glass glow={C.bleuVert} style={{ padding: "36px 40px", borderRadius: 28, height: 470, borderColor: `${C.bleuVert}77` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 24, color: C.bleuVert, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}><IconCheck size={28} color={C.bleuVert} />Précise et mesurable</div>
          <div style={{ marginTop: 22, display: "flex", flexDirection: "column", gap: 16 }}>
            {[
              { at: cue(s, "heures", 1, 10), text: "Comptes rendus · deux heures par semaine", icon: <IconClock size={32} /> },
              { at: cue(s, "occurrences", 1, 14), text: "Trois essais sur des notes fictives", icon: <IconRepeat size={32} /> },
              { at: cue(s, "compare", 1, 18), text: "Temps total et erreurs comparés", icon: <IconTarget size={32} /> },
            ].map((r) => (
              <Reveal key={r.text} at={r.at} out={out}>
                <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 34, fontWeight: 600 }}><span style={{ color: C.bleuVert }}>{r.icon}</span>{r.text}</div>
              </Reveal>
            ))}
          </div>
        </Glass>
      </Reveal>
    </div>
  </>
);

const Errors: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="Erreurs fréquentes" before="Quatre pièges" accent="à éviter" out={out} />
    <CueCards out={out} cols={2} top={340} height={190} cards={[
      { at: cue(s, "classique", 1, 3), title: "Macro ≠ IA générative", icon: <IconAlert size={32} />, tint: C.beige },
      { at: cue(s, "tout", 1, 10), title: "Tout optimiser d'un coup", icon: <IconAlert size={32} />, tint: C.beige },
      { at: cue(s, "volume", 1, 15), title: "Volume ≠ quick win", icon: <IconAlert size={32} />, tint: C.beige },
      { at: cue(s, "confidentielles", 1, 23), title: "Données confidentielles oubliées", icon: <IconLock size={32} />, tint: C.beige },
    ]} />
    <Pill at={cue(s, "forcez", 1, 27)} out={out} top={830}>Aucun candidat ? Préparez d'abord le cadre</Pill>
  </>
);

const YourTurn: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="À vous" before="Passez à" accent="la pratique" out={out} top={130} />
    <CueSteps out={out} top={330} steps={[
      { at: cue(s, "playground", 1, 2), text: "Playground : quick win ou pas, puis votre cartographie" },
      { at: cue(s, "agent", 1, 11), text: "Mon Agent IA : « Comment utiliser l'IA dans mon métier ? »" },
      { at: cue(s, "gardez", 1, 19), text: "Gardez votre cartographie pour l'exercice 1" },
    ]} />
  </>
);

const Recap: SceneRender = (s, out) => (
  <div style={{ position: "absolute", left: 1120, top: 220, width: 700 }}>
    <Reveal at={cue(s, "retenez", 1, 0.5) + 0.6} out={out}>
      <div style={{ ...baseText, fontSize: 24, letterSpacing: "0.14em", textTransform: "uppercase", color: C.fg3, fontWeight: 600, marginBottom: 26 }}>À retenir</div>
    </Reveal>
    <CueSteps out={out} left={0} top={70} width={700} size={34} steps={[
      { at: cue(s, "étapes", 1, 3), text: "Lister, chronométrer, répétitivité, faisabilité" },
      { at: cue(s, "dimensions", 1, 6), text: "Gain × difficulté : quatre profils" },
      { at: cue(s, "essai", 1, 11), text: "Un quick win se mesure" },
    ]} />
    <Reveal at={cue(s, "quiz", 1, 15)} out={out} style={{ position: "absolute", top: 520, left: 0 }}>
      <div style={{ ...baseText, padding: "20px 34px", borderRadius: 999, backgroundImage: GRAD.iris, color: C.ink, fontSize: 30, fontWeight: 700, display: "flex", alignItems: "center", gap: 12 }}><IconCalendar size={30} color={C.ink} />Quiz, puis leçon 1.3 : vos outils</div>
    </Reveal>
  </div>
);

const Banner: SceneRender = () => <NameBanner />;

export const Lesson12Commune: React.FC = () => (
  <LessonVideo
    manifest={manifest}
    chapters={[
      { label: "Par où commencer", sceneIds: ["1", "2", "3"] },
      { label: "La méthode", sceneIds: ["4", "5"] },
      { label: "Le quick win", sceneIds: ["6", "7", "8"] },
      { label: "À vous", sceneIds: ["9", "10"] },
    ]}
    shrinkAt={{ "10": cue(manifest.scenes.find((x) => x.id === "10")!, "retenez", 1, 0.5) + 0.2 }}
    render={{
      "1:over": Banner,
      "2": Objective,
      "3": Pitfalls,
      "4": Method,
      "5": Criteria,
      "6": Matrix,
      "7": Compare,
      "8": Errors,
      "9": YourTurn,
      "10:over": Recap,
    }}
  />
);
