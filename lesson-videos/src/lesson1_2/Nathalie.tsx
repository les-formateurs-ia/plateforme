import React from "react";
import manifestJson from "../generated/lesson1_2-nathalie.json";
import { Glass, Reveal, baseText } from "../components/ui";
import { IconAlert, IconCheck, IconClock, IconFileText, IconLock, IconMail, IconUser } from "../components/icons";
import { C, GRAD } from "../theme";
import { CueSteps, NameBanner, SceneTitle } from "../rs6776/kit";
import { LessonVideo, type SceneRender } from "../rs6776/LessonVideo";
import { cue, type Manifest } from "../rs6776/timeline";

// Leçon 1.2 — vidéo personnalisée de Nathalie (consultante SIRH).
// Script : docs/formation-rs6776/lecon-1.2/script-video-nathalie.md
// Temps hebdomadaires : ceux des tâches pré-remplies de son Playground.

export const manifest = manifestJson as unknown as Manifest;

type Row = { at: number; text: string; icon: React.ReactNode; tint?: string };

// Une tâche de Nathalie : bloc titre + temps, badge de profil, puis les points dits à l'oral.
const TaskBoard: React.FC<{ out: number; title: string; hours: string; icon: React.ReactNode; badge: { at: number; label: string; tint: string }; rows: Row[] }> = ({ out, title, hours, icon, badge, rows }) => (
  <>
    <Reveal at={0.4} out={out} style={{ position: "absolute", left: 120, right: 120, top: 330 }}>
      <Glass glow={badge.tint} style={{ ...baseText, padding: "34px 44px", borderRadius: 30, display: "flex", alignItems: "center", gap: 30 }}>
        <div style={{ width: 90, height: 90, borderRadius: 24, display: "grid", placeItems: "center", background: `${badge.tint}26`, border: `1px solid ${badge.tint}66` }}>{icon}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 50, fontWeight: 800, letterSpacing: "-0.03em" }}>{title}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 6, fontSize: 30, color: C.fg2 }}><IconClock size={30} />{hours}</div>
        </div>
        <Reveal at={badge.at} out={out}>
          <div style={{ padding: "16px 30px", borderRadius: 999, background: `${badge.tint}33`, border: `2px solid ${badge.tint}`, fontSize: 32, fontWeight: 800 }}>{badge.label}</div>
        </Reveal>
      </Glass>
    </Reveal>
    <div style={{ ...baseText, position: "absolute", left: 160, right: 160, top: 560, display: "flex", flexDirection: "column", gap: 20 }}>
      {rows.map((r) => (
        <Reveal key={r.text} at={r.at} out={out}>
          <div style={{ display: "flex", alignItems: "center", gap: 20, fontSize: 36, fontWeight: 600 }}><span style={{ color: r.tint ?? C.bleuVert }}>{r.icon}</span>{r.text}</div>
        </Reveal>
      ))}
    </div>
  </>
);

const Reports: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="Votre premier candidat" before="Vos comptes rendus :" accent="votre quick win" out={out} top={130} />
    <TaskBoard out={out} title="Comptes rendus de réunion" hours="6 h par semaine" icon={<IconFileText size={46} />}
      badge={{ at: cue(s, "quick", 1, 22), label: "Quick win", tint: C.bleuVert }}
      rows={[
        { at: cue(s, "structure", 1, 6), text: "Structure connue, matière tirée de vos notes", icon: <IconCheck size={34} /> },
        { at: cue(s, "testez-le", 1, 12), text: "Trois essais sur notes fictives, relecture comprise", icon: <IconCheck size={34} /> },
        { at: cue(s, "mails", 1, 26), text: "Vos mails clients : déjà un réflexe avec ChatGPT", icon: <IconMail size={34} />, tint: C.bleu },
      ]} />
  </>
);

const Offers: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="Votre deuxième candidat" before="Vos offres d'emploi :" accent="presque un quick win" out={out} top={130} />
    <TaskBoard out={out} title="Offres d'emploi" hours="3 h par semaine" icon={<IconFileText size={46} />}
      badge={{ at: cue(s, "presque", 1, 12), label: "Presque un quick win", tint: C.bleu }}
      rows={[
        { at: cue(s, "brief", 1, 4), text: "Le brief du client fournit la matière", icon: <IconCheck size={34} /> },
        { at: cue(s, "intitulé", 1, 8), text: "Intitulé, missions, profil, modalités", icon: <IconCheck size={34} /> },
        { at: cue(s, "rémunération", 1, 15), text: "Rémunération et avantages : à vérifier avant envoi", icon: <IconAlert size={34} color={C.beige} />, tint: C.beige },
      ]} />
  </>
);

const Setup: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="Votre tâche la plus lourde" before="Le paramétrage :" accent="un projet à cadrer" out={out} top={130} />
    <TaskBoard out={out} title="Paramétrage et connexion" hours="10 h par semaine" icon={<IconLock size={46} />}
      badge={{ at: cue(s, "projet", 1, 26), label: "Projet à cadrer", tint: C.violet }}
      rows={[
        { at: cue(s, "accès", 1, 9), text: "Ni vos accès, ni d'action seule dans le système", icon: <IconLock size={34} color={C.beige} />, tint: C.beige },
        { at: cue(s, "checklist", 1, 20), text: "Checklist, cas de test, guide utilisateur · données fictives", icon: <IconCheck size={34} /> },
        { at: cue(s, "formation", 1, 31), text: "La formation des utilisateurs reste la vôtre", icon: <IconUser size={34} />, tint: C.violet },
      ]} />
  </>
);

const YourTurn: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="À vous" before="Votre" accent="cartographie" out={out} top={130} />
    <CueSteps out={out} top={330} steps={[
      { at: cue(s, "cinq", 1, 2), text: "Playground : cinq situations SIRH" },
      { at: cue(s, "commencer", 1, 6), text: "Par lequel commencer ?" },
      { at: cue(s, "cartographie", 1, 10), text: "Ma cartographie et ma première action" },
      { at: cue(s, "téléchargez", 1, 16), text: "Télécharger mes réponses" },
    ]} />
    <Reveal at={cue(s, "exercice", 1, 19)} out={out} style={{ position: "absolute", left: 700, top: 820 }}>
      <div style={{ ...baseText, padding: "18px 32px", borderRadius: 999, backgroundImage: GRAD.iris, color: C.ink, fontSize: 28, fontWeight: 700 }}>Pour l'exercice 1 et la leçon 1.3</div>
    </Reveal>
  </>
);

const Banner: SceneRender = () => <NameBanner />;

export const Lesson12Nathalie: React.FC = () => (
  <LessonVideo
    manifest={manifest}
    chapters={[
      { label: "Vos tâches", sceneIds: ["1", "2", "3", "4"] },
      { label: "À vous", sceneIds: ["5"] },
    ]}
    render={{
      "1:over": Banner,
      "2": Reports,
      "3": Offers,
      "4": Setup,
      "5": YourTurn,
    }}
  />
);
