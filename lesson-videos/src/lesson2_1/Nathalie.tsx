import React from "react";
import manifestJson from "../generated/lesson2_1-nathalie.json";
import { C } from "../theme";
import { CueCards, CueSteps, NameBanner, SceneTitle } from "../rs6776/kit";
import { LessonVideo, type SceneRender } from "../rs6776/LessonVideo";
import { cue, type Manifest } from "../rs6776/timeline";
import { Chips, Mention, Note, PromptBox, PromptBuild, TwoCols } from "../lesson2_common/blocks";

// Leçon 2.1 — vidéo personnalisée de Nathalie (consultante SIRH).
// Script : docs/formation-rs6776/lecon-2.1/script-video-nathalie.md

export const manifest = manifestJson as unknown as Manifest;

const Missing: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="Le prompt écrit entre deux rendez-vous" before="Ça a l'air" accent="suffisant" out={out} />
    <PromptBox at={cue(s, "explique", 1, 2)} out={out} top={360} size={40} text="Explique comment poser un congé dans le logiciel RH." />
    <Chips out={out} top={620} size={34} items={[
      { at: cue(s, "rôle", 1, 7), label: "Rôle manquant", tint: C.beige },
      { at: cue(s, "cible", 1, 8), label: "Cible manquante", tint: C.beige },
      { at: cue(s, "contexte", 1, 9), label: "Contexte manquant", tint: C.beige },
      { at: cue(s, "format", 1, 11), label: "Format manquant", tint: C.beige },
    ]} />
    <Note at={cue(s, "générique", 1, 13)} out={out} top={820} text="Une réponse générique, presque entièrement à reprendre" />
  </>
);

const Rebuild: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="Le même besoin" before="En cinq" accent="décisions" out={out} />
    <PromptBuild out={out} top={360} size={32} gap={22} rows={[
      { at: cue(s, "rédacteur", 1, 3), tag: "Rôle", text: "Rédacteur de supports de formation SIRH", why: "registre et expertise" },
      { at: cue(s, "s'adresse", 1, 7), tag: "Cible", text: "Salariés qui découvrent l'outil", why: "vocabulaire, détail" },
      { at: cue(s, "rédige", 1, 11), tag: "Objectif", text: "Du premier clic à la confirmation", why: "ni plus ni moins" },
      { at: cue(s, "parcours", 1, 15), tag: "Contexte", text: "Le parcours exact, écran par écran", why: "aucune étape inventée" },
      { at: cue(s, "présente", 1, 20), tag: "Format", text: "Liste numérotée, une action par étape", why: "pas de reprise" },
    ]} />
    <Note at={cue(s, "brute", 1, 25)} out={out} top={880} tone="ok" text="Chaque ligne répond à une question laissée ouverte" />
  </>
);

const Template: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="Un prompt type" before="D'un client" accent="à l'autre" out={out} />
    <CueCards out={out} top={370} height={300} cards={[
      { at: cue(s, "rôle", 1, 3), kicker: "Stable", title: "Rôle, Cible, Format", text: "Presque identiques d'un client à l'autre", tint: C.bleu },
      { at: cue(s, "l'objectif", 1, 8), kicker: "Varie un peu", title: "Objectif", text: "Selon la tâche exacte", tint: C.beige },
      { at: cue(s, "change", 1, 11), kicker: "Change à chaque client", title: "Contexte", text: "Logiciel, module, parcours à l'écran", tint: C.bleuVert },
    ]} />
    <Note at={cue(s, "cloisonnez", 1, 16)} out={out} top={730} tone="info" text="Vos données restent cloisonnées entre clients : le prompt type ne porte que sur la structure" />
    <Note at={cue(s, "squelette", 1, 22)} out={out} top={850} tone="ok" text="La prochaine fois : partir de ce squelette" />
  </>
);

const Check: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="Avant de diffuser" before="Adapté" accent="et conforme" out={out} />
    <TwoCols out={out} top={370} height={270}
      left={{ at: cue(s, "adapté", 1, 3), title: "Adapté", text: "Un salarié débutant peut-il suivre le texte seul ?", tint: C.bleuVert }}
      right={{ at: cue(s, "conforme", 1, 7), title: "Conforme", text: "Une seule action par étape, comme demandé ?", tint: C.bleu }} />
    <Note at={cue(s, "comparez", 1, 11)} out={out} top={700} text="Comparer au parcours réel du client : étape oubliée ou inventée" />
    <Note at={cue(s, "erreur", 1, 16)} out={out} top={820} text="Respecter chaque consigne n'empêche pas une erreur" />
  </>
);

export const Lesson21Nathalie: React.FC = () => (
  <LessonVideo
    manifest={manifest}
    chapters={[
      { label: "Votre support", sceneIds: ["1", "2", "3"] },
      { label: "Réutiliser, vérifier", sceneIds: ["4", "5"] },
      { label: "À vous", sceneIds: ["6"] },
    ]}
    render={{
      "1:over": () => <NameBanner />,
      "2": Missing,
      "3": Rebuild,
      "4": Template,
      "5": Check,
      "6": (s, out) => (
        <>
          <SceneTitle eyebrow="À vous" before="Trois choses" accent="à faire maintenant" out={out} top={130} />
          <CueSteps out={out} top={330} steps={[
            { at: cue(s, "playground", 1, 1), text: "Playground : repérer, reconstruire, juger" },
            { at: cue(s, "mission", 1, 10), text: "Exercices prompts : mission « Offre d'emploi »" },
            { at: cue(s, "correcteur", 1, 13), text: "Tout écrire dans le prompt : rien d'autre n'est lu" },
          ]} />
          <Mention text="Cas du Playground fictifs" out={out} />
        </>
      ),
    }}
  />
);
