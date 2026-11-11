import React from "react";
import manifestJson from "../generated/lesson2_5-nathalie.json";
import { C } from "../theme";
import { CueCards, CueSteps, NameBanner, SceneTitle } from "../rs6776/kit";
import { LessonVideo, type SceneRender } from "../rs6776/LessonVideo";
import { cue, type Manifest } from "../rs6776/timeline";
import { Chips, Mention, Note, PromptBuild, TwoCols } from "../lesson2_common/blocks";

// Leçon 2.5 — vidéo personnalisée de Nathalie (consultante SIRH).
// Script : docs/formation-rs6776/lecon-2.5/script-video-nathalie.md

export const manifest = manifestJson as unknown as Manifest;

const Source: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="Avant le ton" before="La source validée" accent="d'abord" out={out} top={110} />
    <TwoCols out={out} top={280} height={190}
      left={{ at: cue(s, "validée", 1, 2), title: "Source validée", tint: C.bleuVert }}
      right={{ at: cue(s, "comparez-lui", 1, 5), title: "Version à corriger", tint: C.beige }} />
    <Chips out={out} top={540} size={32} items={[
      { at: cue(s, "étapes", 1, 7), label: "Étapes" },
      { at: cue(s, "ordre", 1, 8), label: "Ordre" },
      { at: cue(s, "règles", 1, 9), label: "Règles" },
      { at: cue(s, "délais", 1, 9.5), label: "Délais" },
      { at: cue(s, "termes", 1, 10), label: "Termes d'écran" },
      { at: cue(s, "usage", 1, 11), label: "Public et usage" },
    ]} />
    <Note at={cue(s, "erreurs", 1, 17)} out={out} top={800} text="Erreur de fond : la corriger avant de toucher au ton" />
    <Mention text="Exemple fictif" out={out} />
  </>
);

const Angles: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="Les cinq angles" before="Appliqués" accent="à votre guide" out={out} top={110} />
    <CueCards out={out} cols={5} top={290} height={340} cards={[
      { at: cue(s, "contrainte", 1, 6), title: "Contrainte", text: "Trois actions", tint: C.violet },
      { at: cue(s, "contexte", 1, 10), title: "Contexte et sources", text: "La règle de la politique validée", tint: C.bleu },
      { at: cue(s, "format", 1, 13), title: "Format", text: "Une check-list", tint: C.beige },
      { at: cue(s, "style", 1, 15), title: "Style", text: "Le vocabulaire", tint: C.bleuVert },
      { at: cue(s, "l'accessibilité", 1, 19), title: "Accessibilité", text: "Intitulés et ordre explicites", tint: C.violetLight },
    ]} />
    <Note at={cue(s, "vérifier", 1, 23)} out={out} top={710} tone="ok" text="Pas d'étiquette exclusive : des critères vérifiables" />
  </>
);

const Prompt: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="Votre prompt" before="Pour" accent="le manager" out={out} top={100} />
    <PromptBuild out={out} top={260} size={30} gap={14} rows={[
      { at: cue(s, "version", 1, 2), tag: "Version", text: "Le guide validé" },
      { at: cue(s, "manager", 1, 4), tag: "Public", text: "Un manager qui valide une demande" },
      { at: cue(s, "source", 1, 6), tag: "Source", text: "La source de vérité" },
      { at: cue(s, "conserver", 1, 8), tag: "Conserve", text: "Les trois actions et leur ordre" },
      { at: cue(s, "remplacer", 1, 11), tag: "Modifie", text: "Un terme défini, une action par ligne, une limite de mots" },
      { at: cue(s, "d'inventer", 1, 15), tag: "Interdit", text: "N'invente rien ; signale l'impossible" },
      { at: cue(s, "relevé", 1, 19), tag: "Sortie", text: "Un relevé des changements, vérifié par vous" },
    ]} />
    <Mention text="Exemple fictif" out={out} />
  </>
);

const Conflict: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="Le conflit" before="Règle ajoutée," accent="même longueur ?" out={out} top={110} />
    <Note at={cue(s, "quarante-huit", 1, 5)} out={out} top={280} text="Ajouter la règle des 48 heures + garder exactement la même longueur" />
    <TwoCols out={out} top={420} height={260}
      left={{ at: cue(s, "supérieure", 1, 15), title: "Longueur supérieure", text: "La règle validée est protégée", tint: C.bleuVert }}
      right={{ at: cue(s, "renvoi", 1, 17), title: "Renvoi vers une explication", text: "Le texte court reste court", tint: C.bleu }} />
    <Note at={cue(s, "commanditaire", 1, 22)} out={out} top={760} tone="info" text="L'IA formule les options, le commanditaire choisit" />
    <Mention text="Politique fictive du Playground" out={out} />
  </>
);

export const Lesson25Nathalie: React.FC = () => (
  <LessonVideo
    manifest={manifest}
    chapters={[
      { label: "Votre guide", sceneIds: ["1", "2", "3"] },
      { label: "Prompt et arbitrage", sceneIds: ["4", "5"] },
      { label: "À vous", sceneIds: ["6"] },
    ]}
    render={{
      "1:over": () => <NameBanner />,
      "2": Source,
      "3": Angles,
      "4": Prompt,
      "5": Conflict,
      "6": (s, out) => (
        <>
          <SceneTitle eyebrow="À vous" before="Dans" accent="le Playground" out={out} top={130} />
          <CueSteps out={out} top={330} size={34} steps={[
            { at: cue(s, "publics", 1, 4), text: "Un même guide fictif, trois publics" },
            { at: cue(s, "complet", 1, 9), text: "Juger les versions, repérer le prompt complet" },
            { at: cue(s, "arrivant", 1, 12), text: "Optimiser un message pour un nouvel arrivant" },
            { at: cue(s, "gardez", 1, 16), text: "Garder source, prompt, version, relevé, vérification" },
          ]} />
          <Mention text="Cas du Playground fictifs" out={out} />
        </>
      ),
    }}
  />
);
