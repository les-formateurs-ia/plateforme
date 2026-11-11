import React from "react";
import manifestJson from "../generated/lesson3_1-nathalie.json";
import { Glass, Reveal, baseText } from "../components/ui";
import { IconAlert, IconCheck, IconFilm, IconImage, IconSend, IconUser } from "../components/icons";
import { C, GRAD } from "../theme";
import { CueCards, CueSteps, NameBanner, SceneTitle } from "../rs6776/kit";
import { LessonVideo, type SceneRender } from "../rs6776/LessonVideo";
import { cue, type Manifest } from "../rs6776/timeline";

// Leçon 3.1 — vidéo personnalisée de Nathalie (consultante SIRH).
// Script : docs/formation-rs6776/lecon-3.1/script-video-nathalie.md

export const manifest = manifestJson as unknown as Manifest;

const Fictif: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ fontSize: 22, letterSpacing: "0.14em", textTransform: "uppercase", color: C.fg3, fontWeight: 600 }}>{children} · exemple fictif</div>
);

const sc2: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="Les visuels de l'offre" before="D'abord," accent="le rôle du visuel" out={out} />
    <CueCards out={out} top={340} height={250} cards={[
      { at: cue(s, "décoratif", 1, 6), title: "Décoratif", text: "Alternative vide", icon: <IconImage size={34} />, tint: C.fg2 },
      { at: cue(s, "informatif", 1, 7), title: "Informatif", text: "Ce qu'il apporte au candidat", icon: <IconImage size={34} />, tint: C.bleu },
      { at: cue(s, "complexe", 1, 8), title: "Complexe", text: "Ex. organigramme : + description ou équivalent structuré", icon: <IconImage size={34} />, tint: C.violet },
    ]} />
    <Reveal at={cue(s, "bouton", 1, 18)} out={out} style={{ position: "absolute", left: 120, right: 120, top: 660 }}>
      <Glass glow={C.bleu} style={{ ...baseText, padding: "28px 36px", borderRadius: 26, display: "flex", alignItems: "center", gap: 34 }}>
        <div style={{ width: 96, height: 96, borderRadius: 24, display: "grid", placeItems: "center", background: `${C.bleu}26`, border: `1px solid ${C.bleu}66` }}><IconSend size={44} /></div>
        <div>
          <Fictif>Espace candidature</Fictif>
          <div style={{ marginTop: 8, fontSize: 34, fontWeight: 700 }}>Bouton icône seule → lecteur d'écran : « bouton »</div>
          <Reveal at={cue(s, "associé", 1, 22)} out={out}>
            <div style={{ marginTop: 8, fontSize: 32, fontWeight: 700, color: C.bleuVert }}>Texte associé : « Postuler à cette offre »</div>
          </Reveal>
        </div>
      </Glass>
    </Reveal>
  </>
);

const sc3: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="Le texte de l'offre" before="Une mission" accent="par phrase" out={out} />
    <div style={{ ...baseText, position: "absolute", left: 120, right: 120, top: 340, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28 }}>
      <Reveal at={cue(s, "écosystème", 1, 3)} out={out}>
        <Glass glow={C.beige} style={{ padding: "32px 38px", borderRadius: 26, height: 400 }}>
          <Fictif>Avant</Fictif>
          <div style={{ marginTop: 18, fontSize: 32, lineHeight: 1.4, color: C.fg2 }}>
            Vous évoluerez dans un <span style={{ color: C.beige, fontWeight: 700, borderBottom: `3px solid ${C.beige}` }}>écosystème collaboratif</span>, au sein d'un <span style={{ color: C.beige, fontWeight: 700, borderBottom: `3px solid ${C.beige}` }}>environnement dynamique et multitâche</span>.
          </div>
          <div style={{ marginTop: 18, display: "flex", alignItems: "center", gap: 10, fontSize: 24, color: C.beige, fontWeight: 700 }}><IconAlert size={24} color={C.beige} />Aucune tâche décrite</div>
        </Glass>
      </Reveal>
      <Reveal at={cue(s, "mission", 1, 13)} out={out}>
        <Glass glow={C.bleuVert} style={{ padding: "32px 38px", borderRadius: 26, height: 400 }}>
          <Fictif>Après</Fictif>
          <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 14, fontSize: 30, fontWeight: 600 }}>
            {["[Mission 1, une phrase concrète]", "[Mission 2, une phrase concrète]", "[Mission 3, une phrase concrète]"].map((m) => (
              <div key={m} style={{ display: "flex", alignItems: "center", gap: 14 }}><IconCheck size={28} color={C.bleuVert} />{m}</div>
            ))}
          </div>
        </Glass>
      </Reveal>
    </div>
    <Reveal at={cue(s, "signalez", 1, 19)} out={out} style={{ position: "absolute", left: 0, right: 0, top: 800, display: "flex", justifyContent: "center" }}>
      <div style={{ ...baseText, padding: "20px 38px", borderRadius: 999, backgroundImage: GRAD.iris, color: C.ink, fontSize: 30, fontWeight: 700 }}>Information manquante : la signaler, pas l'inventer</div>
    </Reveal>
  </>
);

const sc4: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="L'espace candidature" before="Votre rôle" accent="de paramétrage" out={out} />
    <CueCards out={out} top={360} height={360} cards={[
      { at: cue(s, "vidéo", 1, 3), kicker: "Page carrières", title: "Vidéo de présentation", text: "Sous-titres et transcription", icon: <IconFilm size={38} />, tint: C.beige },
      { at: cue(s, "téléphonique", 1, 9), kicker: "Processus", title: "Entretien par téléphone seulement", text: "Alternative écrite ou visio sous-titrée, annoncée dans l'offre", icon: <IconUser size={38} />, tint: C.violet },
    ]} />
  </>
);

const sc5: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="Avant publication" before="Une checklist," accent="pas une impression" out={out} top={130} />
    <CueSteps out={out} left={120} top={320} width={1000} size={36} steps={[
      { at: cue(s, "visuel", 1, 4), text: "Rôle de chaque visuel traité" },
      { at: cue(s, "information", 1, 7), text: "Chaque information conservée" },
      { at: cue(s, "idée", 1, 10), text: "Une idée par phrase" },
      { at: cue(s, "support", 1, 12), text: "Test dans le support final" },
    ]} />
    <Reveal at={cue(s, "prompt", 1, 20)} out={out} style={{ position: "absolute", left: 1180, top: 330, width: 620 }}>
      <Glass glow={C.violet} style={{ ...baseText, padding: "28px 32px", borderRadius: 24 }}>
        <div style={{ fontSize: 22, letterSpacing: "0.14em", textTransform: "uppercase", color: C.fg3, fontWeight: 600 }}>Dans le prompt</div>
        <div style={{ marginTop: 12, fontSize: 30, fontWeight: 600, lineHeight: 1.45 }}>Public · obstacle · règle · à conserver</div>
        <div style={{ marginTop: 12, fontSize: 26, color: C.fg2 }}>Puis : comparer à l'offre source</div>
      </Glass>
    </Reveal>
  </>
);

const sc6: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="À vous" before="Votre" accent="Playground" out={out} top={130} />
    <CueSteps out={out} top={330} steps={[
      { at: cue(s, "brivelune", 1, 2), text: "Brivelune Distribution, enseigne fictive" },
      { at: cue(s, "repérerez", 1, 6), text: "Besoin, correction, prompt complet" },
      { at: cue(s, "adapterez", 1, 10), text: "Un extrait d'offre, à remettre au formateur" },
    ]} />
    <Reveal at={cue(s, "quatre", 1, 13)} out={out} style={{ position: "absolute", left: 700, top: 720 }}>
      <div style={{ ...baseText, padding: "18px 32px", borderRadius: 999, backgroundImage: GRAD.iris, color: C.ink, fontSize: 28, fontWeight: 700 }}>Le même geste qu'à l'exercice 4 de l'écrit</div>
    </Reveal>
  </>
);

export const Lesson31Nathalie: React.FC = () => (
  <LessonVideo
    manifest={manifest}
    chapters={[
      { label: "Vos offres", sceneIds: ["1", "2", "3"] },
      { label: "Votre paramétrage", sceneIds: ["4", "5"] },
      { label: "À vous", sceneIds: ["6"] },
    ]}
    render={{
      "1:over": () => <NameBanner />,
      "2": sc2,
      "3": sc3,
      "4": sc4,
      "5": sc5,
      "6": sc6,
    }}
  />
);
