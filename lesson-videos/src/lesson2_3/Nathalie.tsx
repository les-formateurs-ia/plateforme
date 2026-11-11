import React from "react";
import manifestJson from "../generated/lesson2_3-nathalie.json";
import { Glass, Reveal, baseText } from "../components/ui";
import { IconZap, IconSearch, IconUser, IconFileText } from "../components/icons";
import { C } from "../theme";
import { CueCards, CueSteps, NameBanner, SceneTitle } from "../rs6776/kit";
import { LessonVideo, type SceneRender } from "../rs6776/LessonVideo";
import { cue, type Manifest } from "../rs6776/timeline";
import { Chips, Mention, Note, RevealTable, TwoCols } from "../lesson2_common/blocks";

// Leçon 2.3 — vidéo personnalisée de Nathalie (consultante SIRH).
// Script : docs/formation-rs6776/lecon-2.3/script-video-nathalie.md

export const manifest = manifestJson as unknown as Manifest;

const Guide: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="Le guide coécrit" before="L'environnement du client" accent="décide" out={out} />
    <Note at={cue(s, "classement", 1, 6)} out={out} top={330} tone="info" text="Pas un classement : l'environnement du client" />
    <TwoCols out={out} top={450} height={270}
      left={{ at: cue(s, "docs", 1, 10), title: "Document partagé", text: "Gemini activé et autorisé dans Google Docs : la coédition simplifiée", tint: C.bleu, logo: "gemini" }}
      right={{ at: cue(s, "project", 1, 17), title: "Travail récurrent", text: "Un Project pour vos instructions et références", tint: C.violet }} />
    <Note at={cue(s, "cloisonne", 1, 22)} out={out} top={790} text="Un Project ne cloisonne pas vos clients : membres, partage, fichiers, données" />
  </>
);

const Assistant: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="L'assistant qui promet" before="Avant de lui confier" accent="un guide" out={out} />
    <CueCards out={out} cols={4} top={380} height={260} cards={[
      { at: cue(s, "publie", 1, 8), title: "Éditeur", icon: <IconUser size={34} />, tint: C.beige },
      { at: cue(s, "connexions", 1, 10), title: "Connexions", icon: <IconZap size={34} />, tint: C.beige },
      { at: cue(s, "données", 1, 12), title: "Données reçues", icon: <IconSearch size={34} />, tint: C.beige },
      { at: cue(s, "fictif", 1, 16), title: "Extrait fictif d'abord", icon: <IconFileText size={34} />, tint: C.bleuVert },
    ]} />
    <Note at={cue(s, "référencé", 1, 5)} out={out} top={720} text="Référencé dans un catalogue public n'est pas autorisé" />
  </>
);

const Session: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="La session enregistrée" before="La première" accent="question" out={out} />
    <Reveal at={cue(s, "permis", 1, 5)} out={out} style={{ position: "absolute", left: 0, right: 0, top: 360, display: "flex", justifyContent: "center" }}>
      <Glass glow={C.bleuVert} style={{ ...baseText, padding: "30px 56px", borderRadius: 30, fontSize: 52, fontWeight: 800, letterSpacing: "-0.03em" }}>L'enregistrement est-il permis ?</Glass>
    </Reveal>
    <Note at={cue(s, "rgpd", 1, 8)} out={out} top={560} tone="info" text="RGPD et CNIL : un réflexe que vous avez déjà, appliqué dès le départ" />
    <Note at={cue(s, "paie", 1, 16)} out={out} top={680} text="Cas de paie réels évoqués ? Cadrer encore plus strictement" />
    <Note at={cue(s, "doute", 1, 21)} out={out} top={800} tone="ok" text="En cas de doute : la transcription fictive fournie" />
  </>
);

const Report: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="Du texte au compte-rendu" before="Une source," accent="un repère par ligne" out={out} top={110} />
    <Chips out={out} top={290} size={32} items={[
      { at: cue(s, "approuvé", 1, 4), label: "Outil approuvé", tint: C.bleuVert },
      { at: cue(s, "réécoutez", 1, 6), label: "Réécoute", tint: C.bleuVert },
      { at: cue(s, "retirez", 1, 10), label: "Minimisation", tint: C.bleuVert },
      { at: cue(s, "clé", 1, 13), label: "Clé à part", tint: C.bleuVert },
    ]} />
    <RevealTable out={out} top={470} size={26} headAt={cue(s, "brouillon", 1, 15)} headers={["Décision", "Action", "Responsable", "Échéance", "Statut", "Repère source"]} rows={[
      { at: cue(s, "repère", 1, 20), cells: ["Décision citée", "Action citée", "à confirmer", "à confirmer", "à confirmer", "repère temporel"] },
    ]} />
    <Note at={cue(s, "valider", 1, 25)} out={out} top={760} tone="ok" text="Revenir à la source, puis faire valider" />
    <Mention text="Exemple fictif" out={out} />
  </>
);

export const Lesson23Nathalie: React.FC = () => (
  <LessonVideo
    manifest={manifest}
    chapters={[
      { label: "Le guide", sceneIds: ["1", "2", "3"] },
      { label: "Le compte-rendu", sceneIds: ["4", "5"] },
      { label: "À vous", sceneIds: ["6"] },
    ]}
    render={{
      "1:over": () => <NameBanner />,
      "2": Guide,
      "3": Assistant,
      "4": Session,
      "5": Report,
      "6": (s, out) => (
        <>
          <SceneTitle eyebrow="À vous" before="Dans" accent="le Playground" out={out} top={130} />
          <CueSteps out={out} top={330} size={34} steps={[
            { at: cue(s, "situations", 1, 4), text: "Choisir l'outil ou la méthode : cinq situations" },
            { at: cue(s, "affirmations", 1, 7), text: "Vrai ou faux : cinq affirmations" },
            { at: cue(s, "minimiser", 1, 11), text: "Minimiser une transcription fictive" },
            { at: cue(s, "conservez", 1, 15), text: "Garder cadrage, prompt, brouillon annoté, version validée" },
          ]} />
          <Mention text="Cas du Playground fictifs" out={out} />
        </>
      ),
    }}
  />
);
