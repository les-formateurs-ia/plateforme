import React from "react";
import manifestJson from "../generated/lesson2_2-nathalie.json";
import { IconAlert, IconListChecks, IconFileText, IconRepeat } from "../components/icons";
import { C } from "../theme";
import { CueCards, CueSteps, NameBanner, SceneTitle } from "../rs6776/kit";
import { LessonVideo, type SceneRender } from "../rs6776/LessonVideo";
import { cue, type Manifest } from "../rs6776/timeline";
import { Mention, Note, PromptBox, PromptBuild, TwoCols } from "../lesson2_common/blocks";

// Leçon 2.2 — vidéo personnalisée de Nathalie (consultante SIRH).
// Script : docs/formation-rs6776/lecon-2.2/script-video-nathalie.md

export const manifest = manifestJson as unknown as Manifest;

const Risk: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="Votre risque principal" before="Tout demander" accent="d'un coup" out={out} />
    <PromptBox at={cue(s, "plan", 1, 2)} out={out} top={350} size={32} label="Un seul prompt" text="Le plan + le contenu de chaque module + la mise en forme" />
    <CueCards out={out} top={560} height={220} cards={[
      { at: cue(s, "architecture", 1, 10), title: "Architecture validée trop tard", icon: <IconAlert size={34} />, tint: C.beige },
      { at: cue(s, "fonctionnalité", 1, 12), title: "Fonctionnalité du logiciel inventée", icon: <IconAlert size={34} />, tint: C.beige },
    ]} />
    <Note at={cue(s, "concurrencent", 1, 18)} out={out} top={860} tone="info" text="Ce sont les instructions qui se concurrencent" />
  </>
);

const Chain: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="Votre chaîne" before="Module" accent="par module" out={out} />
    <CueCards out={out} top={370} height={320} cards={[
      { at: cue(s, "d'abord", 1, 3), kicker: "1", title: "Plan des modules", text: "Validé avant d'écrire une ligne", icon: <IconListChecks size={36} />, tint: C.bleu },
      { at: cue(s, "ensuite", 1, 12), kicker: "2", title: "Un module à la fois", text: "Plan, sources et contraintes rappelés", icon: <IconFileText size={36} />, tint: C.beige },
      { at: cue(s, "enfin", 1, 17), kicker: "3", title: "Relecture globale", text: "Puis votre contrôle écran par écran", icon: <IconRepeat size={36} />, tint: C.bleuVert },
    ]} />
    <Note at={cue(s, "travers", 1, 9)} out={out} top={760} tone="ok" text="Corriger un plan coûte bien moins cher qu'un module rédigé" />
  </>
);

const Fix: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="Corriger" before="Sans mélanger" accent="les clients" out={out} />
    <PromptBuild out={out} top={380} size={32} rows={[
      { at: cue(s, "ajoutez", 1, 5), tag: "+ Format", text: "Une action par ligne : la seule précision ajoutée" },
    ]} />
    <Note at={cue(s, "validés", 1, 10)} out={out} top={540} tone="ok" text="Les passages déjà validés sont conservés" />
    <Note at={cue(s, "client", 1, 14)} out={out} top={680} tone="alert" text="Hypothèse fausse ou contexte d'un autre client : repartir d'un espace propre" />
  </>
);

const Examples: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="Calibrer et réutiliser" before="Vos exemples," accent="votre espace" out={out} />
    <TwoCols out={out} top={370} height={320}
      left={{ at: cue(s, "extraits", 1, 4), title: "Deux extraits validés", text: "Nettoyés de toute information client", tint: C.violet }}
      right={{ at: cue(s, "configurez", 1, 9), title: "Un espace réutilisable", text: "Plan en modules numérotés, un objectif d'apprentissage chacun ; niveau absent : poser la question", tint: C.bleuVert }} />
    <Note at={cue(s, "cloisonnement", 1, 22)} out={out} top={760} text="Un espace distinct ne garantit pas le cloisonnement : membres, fichiers, mémoire" />
    <Mention text="Exemples fictifs ou nettoyés" out={out} />
  </>
);

export const Lesson22Nathalie: React.FC = () => (
  <LessonVideo
    manifest={manifest}
    chapters={[
      { label: "Votre support", sceneIds: ["1", "2", "3"] },
      { label: "Corriger, calibrer", sceneIds: ["4", "5"] },
      { label: "À vous", sceneIds: ["6"] },
    ]}
    render={{
      "1:over": () => <NameBanner />,
      "2": Risk,
      "3": Chain,
      "4": Fix,
      "5": Examples,
      "6": (s, out) => (
        <>
          <SceneTitle eyebrow="À vous" before="Trois choses" accent="à faire maintenant" out={out} top={130} />
          <CueSteps out={out} top={330} steps={[
            { at: cue(s, "playground", 1, 1), text: "Playground : diagnostiquer, enchaîner, rédiger" },
            { at: cue(s, "preuves", 1, 11), text: "Garder trois preuves : plan, section sourcée, checklist" },
            { at: cue(s, "consigne", 2, 17), text: "Conserver votre consigne pour le formateur" },
          ]} />
          <Mention text="Cas du Playground fictifs" out={out} />
        </>
      ),
    }}
  />
);
