import React from "react";
import manifestJson from "../generated/lesson2_2-commune.json";
import { Reveal, baseText } from "../components/ui";
import { IconRepeat, IconFileText, IconListChecks } from "../components/icons";
import { C, GRAD } from "../theme";
import { CueCards, CueSteps, NameBanner, SceneTitle } from "../rs6776/kit";
import { LessonVideo, type SceneRender } from "../rs6776/LessonVideo";
import { cue, type Manifest } from "../rs6776/timeline";
import { Chips, IrisBanner, LogoRow, Mention, Note, PromptBox, PromptBuild, RevealTable, TwoCols } from "../lesson2_common/blocks";

// Leçon 2.2 « Prompts avancés : méthode pour les tâches complexes » — vidéo commune.
// Script : docs/formation-rs6776/lecon-2.2/script-video-commune.md

export const manifest = manifestJson as unknown as Manifest;
const scene = (id: string) => manifest.scenes.find((x) => x.id === id)!;

const Objective: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="L'objectif de la leçon" before="Cinq gestes pour" accent="les tâches complexes" out={out} />
    <Chips out={out} top={440} size={42} items={[
      { at: cue(s, "découper", 1, 4), label: "Découper" },
      { at: cue(s, "corriger", 1, 7), label: "Corriger" },
      { at: cue(s, "calibrer", 1, 10), label: "Calibrer" },
      { at: cue(s, "relire", 1, 12), label: "Relire" },
      { at: cue(s, "réutiliser", 1, 14), label: "Réutiliser" },
    ]} />
    <IrisBanner at={cue(s, "deuxième", 1, 18)} out={out} top={720} text="Écrit · exercice 2 · des contenus plus complexes" />
  </>
);

const Dilution: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="Le symptôme" before="La dilution" accent="des instructions" out={out} />
    <CueCards out={out} top={370} height={260} cards={[
      { at: cue(s, "approfondir", 1, 6), title: "Rien d'approfondi", text: "Une réponse qui touche à tout", tint: C.beige },
      { at: cue(s, "interchangeables", 1, 9), title: "Phrases interchangeables", text: "Dans chaque section", tint: C.violet },
      { at: cue(s, "relancer", 1, 12), title: "Tout relancer", text: "Pour corriger un seul passage", tint: C.bleu },
    ]} />
    <Note at={cue(s, "dilution", 1, 16)} out={out} top={700} tone="info" text="Pas un manque de compétence du modèle" />
    <Note at={cue(s, "court", 1, 21)} out={out} top={820} tone="ok" text="Livrable court : un prompt unique peut suffire" />
  </>
);

const Chaining: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="La méthode" before="Enchaîner" accent="des demandes ciblées" out={out} />
    <CueCards out={out} top={370} height={300} cards={[
      { at: cue(s, "plan", 1, 4), kicker: "Étape 1", title: "Cadrer le plan", text: "Sections, ordre, contenu. Rien n'est rédigé.", icon: <IconListChecks size={36} />, tint: C.bleu },
      { at: cue(s, "section", 1, 12), kicker: "Étape 2", title: "Section par section", text: "En rappelant plan, sources, contraintes.", icon: <IconFileText size={36} />, tint: C.beige },
      { at: cue(s, "relecture", 1, 22), kicker: "Étape 3", title: "Relire et harmoniser", text: "Ton, répétitions, vocabulaire.", icon: <IconRepeat size={36} />, tint: C.bleuVert },
    ]} />
    <Note at={cue(s, "l'historique", 1, 17)} out={out} top={720} tone="info" text="L'historique visible ne garantit pas que chaque détail sera repris" />
    <IrisBanner at={cue(s, "chaining", 1, 28)} out={out} top={840} text="Le prompt chaining" />
  </>
);

const Iterate: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="Itérer" before="Corriger" accent="un seul élément" out={out} top={100} />
    <PromptBox at={cue(s, "rédige", 1, 6)} out={out} top={260} size={30} label="Avant" text="Rédige une annonce pour présenter le nouveau logiciel interne aux salariés." />
    <Note at={cue(s, "diagnostic", 1, 12)} out={out} top={460} tone="alert" text="Élément manquant : le contexte" />
    <PromptBuild out={out} top={570} size={30} rows={[
      { at: cue(s, "ligne", 1, 14), tag: "+ Contexte", text: "Remplace un outil utilisé depuis huit ans ; crainte de perdre les données saisies" },
    ]} />
    <Note at={cue(s, "promettre", 1, 22)} out={out} top={700} tone="ok" text="L'annonce reconnaît la crainte, sans promesse non sourcée" />
    <Note at={cue(s, "propre", 1, 32)} out={out} top={830} tone="info" text="Contexte erroné dans le fil : repartir d'un échange propre" />
    <Mention text="Exemple du cours" out={out} />
  </>
);

const FewShot: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="Calibrer" before="Montrer plutôt" accent="que décrire" out={out} />
    <TwoCols out={out} top={370} height={300}
      left={{ at: cue(s, "zero-shot", 1, 9), title: "Zero-shot", text: "Aucun exemple : le modèle interprète seul le niveau attendu", tint: C.violet }}
      right={{ at: cue(s, "few-shot", 1, 7), title: "Few-shot", text: "Un ou deux exemples : longueur, formalité, structure transmises", tint: C.bleuVert }} />
    <Note at={cue(s, "autorisés", 1, 20)} out={out} top={730} tone="alert" text="Exemples autorisés, fictifs ou nettoyés" />
    <Note at={cue(s, "imiter", 1, 23)} out={out} top={850} tone="info" text="Dire ce qu'il faut imiter, et ce qu'il ne faut pas reproduire" />
  </>
);

const Critique: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="Relire un prompt" before="Les signaux" accent="d'alerte" out={out} top={110} />
    <RevealTable out={out} top={290} size={30} cols="260px 1fr" headers={["Élément", "Signal d'alerte"]} rows={[
      { at: cue(s, "posture", 1, 6), cells: ["Rôle", "Aucune posture donnée, ton neutre par défaut"] },
      { at: cue(s, "débutant", 1, 8), cells: ["Cible", "Conviendrait à un débutant comme à un expert"] },
      { at: cue(s, "meilleur", 1, 11), cells: ["Objectif", "« Meilleur », sans dire selon quoi"] },
      { at: cue(s, "l'auteur", 1, 14), cells: ["Contexte", "Dépend d'une information connue du seul auteur"] },
      { at: cue(s, "inutilisable", 1, 17), cells: ["Format", "Juste sur le fond, inutilisable tel quel"] },
    ]} />
    <Note at={cue(s, "perfection", 1, 21)} out={out} top={900} tone="ok" text="Cinq réponses positives éliminent la plupart des causes d'échec" />
  </>
);

const Space: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="Réutiliser" before="Un espace" accent="configuré" out={out} top={100} />
    <PromptBox at={cue(s, "écrivez-y", 1, 6)} out={out} top={250} size={28} label="Espace de réglages · exemple du cours" text="Structure toujours ta proposition en cinq blocs ; s'il en manque un, pose la question avant de rédiger." />
    <LogoRow out={out} top={480} size={100} items={[
      { at: cue(s, "chatgpt", 1, 14), id: "chatgpt", caption: "Instructions personnalisées, Projects" },
      { at: cue(s, "claude", 1, 17), id: "claude", caption: "Projects" },
      { at: cue(s, "gemini", 1, 19), id: "gemini", caption: "Gems" },
    ]} />
    <Note at={cue(s, "dispense", 1, 25)} out={out} top={830} text="Contrôler membres, fichiers, mémoire et liens de partage" />
    <Note at={cue(s, "copie", 1, 31)} out={out} top={940} tone="info" size={26} text="Garder une copie datée de vos instructions" />
  </>
);

const YourTurn: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="À vous" before="Passez à" accent="la pratique" out={out} top={130} />
    <CueSteps out={out} top={330} steps={[
      { at: cue(s, "playground", 1, 2), text: "Playground : diagnostiquer, enchaîner, configurer" },
      { at: cue(s, "améliorer", 1, 9), text: "Exercices prompts : « Améliorer ce prompt »" },
      { at: cue(s, "expert", 1, 15), text: "Battle Ground : un défi de la gamme Expert" },
    ]} />
  </>
);

const Recap: SceneRender = (s, out) => (
  <div style={{ position: "absolute", left: 1120, top: 220, width: 700 }}>
    <Reveal at={cue(s, "retenez", 1, 0.5) + 0.6} out={out}>
      <div style={{ ...baseText, fontSize: 24, letterSpacing: "0.14em", textTransform: "uppercase", color: C.fg3, fontWeight: 600, marginBottom: 26 }}>À retenir</div>
    </Reveal>
    <CueSteps out={out} left={0} top={70} width={700} size={34} steps={[
      { at: cue(s, "découpe", 1, 3), text: "Découper pour contrôler" },
      { at: cue(s, "corrige", 1, 6), text: "Corriger un seul élément à la fois" },
      { at: cue(s, "exemples", 1, 9), text: "Calibrer, puis réutiliser la méthode" },
    ]} />
    <Reveal at={cue(s, "quiz", 1, 14)} out={out} style={{ position: "absolute", top: 520, left: 0 }}>
      <div style={{ ...baseText, padding: "20px 34px", borderRadius: 999, backgroundImage: GRAD.iris, color: C.ink, fontSize: 30, fontWeight: 700 }}>Quiz, puis leçon 2.3 : les écrits professionnels</div>
    </Reveal>
  </div>
);

export const Lesson22Commune: React.FC = () => (
  <LessonVideo
    manifest={manifest}
    chapters={[
      { label: "Introduction", sceneIds: ["1", "2"] },
      { label: "Découper, corriger", sceneIds: ["3", "4", "5"] },
      { label: "Calibrer, réutiliser", sceneIds: ["6", "7", "8"] },
      { label: "À vous", sceneIds: ["9", "10"] },
    ]}
    shrinkAt={{ "10": cue(scene("10"), "retenez", 1, 0.5) + 0.2 }}
    render={{
      "1:over": () => <NameBanner />,
      "2": Objective,
      "3": Dilution,
      "4": Chaining,
      "5": Iterate,
      "6": FewShot,
      "7": Critique,
      "8": Space,
      "9": YourTurn,
      "10:over": Recap,
    }}
  />
);
