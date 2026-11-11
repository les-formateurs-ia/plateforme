import React from "react";
import manifestJson from "../generated/lesson2_4-nathalie.json";
import { C } from "../theme";
import { CueSteps, NameBanner, SceneTitle } from "../rs6776/kit";
import { LessonVideo, type SceneRender } from "../rs6776/LessonVideo";
import { cue, type Manifest } from "../rs6776/timeline";
import { Chips, Mention, Note, PromptBuild, TwoCols } from "../lesson2_common/blocks";

// Leçon 2.4 — vidéo personnalisée de Nathalie (consultante SIRH).
// Script : docs/formation-rs6776/lecon-2.4/script-video-nathalie.md

export const manifest = manifestJson as unknown as Manifest;

const Brief: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="La page de garde" before="D'abord," accent="un mini-brief" out={out} />
    <Chips out={out} top={380} size={34} items={[
      { at: cue(s, "s'adresse", 1, 3), label: "Public du guide", tint: C.bleu },
      { at: cue(s, "diffusé", 1, 5), label: "Lieu de diffusion", tint: C.bleu },
      { at: cue(s, "couleurs", 1, 7), label: "Couleurs, dimensions, zones de texte", tint: C.bleu },
      { at: cue(s, "logos", 1, 11), label: "Références et logos autorisés ?", tint: C.bleu },
      { at: cue(s, "valide", 1, 13), label: "Valideur côté client", tint: C.bleu },
    ]} />
    <Note at={cue(s, "confirmer", 1, 16)} out={out} top={700} text="Une réponse manque : point à confirmer, avant tout import réel" />
    <Note at={cue(s, "fictif", 1, 21)} out={out} top={820} tone="info" text="Outil ou références non autorisés : un cas fictif" />
  </>
);

const WhichTool: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="Quel outil, selon le client" before="L'environnement" accent="tranche" out={out} />
    <TwoCols out={out} top={360} height={360}
      left={{ at: cue(s, "copilot", 1, 9), title: "Client sous Microsoft", text: "Environnement approuvé, exploration rapide : Copilot peut convenir", tint: C.violet, logo: "copilot" }}
      right={{ at: cue(s, "firefly", 1, 15), title: "Flux Adobe exigé", text: "Fichier retouchable, provenance : une offre Firefly approuvée", tint: C.violetLight, logo: "firefly" }} />
    <Note at={cue(s, "conditions", 1, 20)} out={out} top={790} tone="info" text="Dans les deux cas : conditions du compte, données admises, droits sur chaque référence" />
  </>
);

const Prompt: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="Votre prompt" before="En sept" accent="lignes" out={out} top={100} />
    <PromptBuild out={out} top={260} size={30} gap={14} rows={[
      { at: cue(s, "managers", 1, 3), tag: "Finalité", text: "Illustration sobre pour un guide de managers" },
      { at: cue(s, "isométrique", 1, 5), tag: "Sujet", text: "Scène d'atelier en vue isométrique" },
      { at: cue(s, "personnages", 1, 7), tag: "Personnes", text: "Divers, sans visage identifiable" },
      { at: cue(s, "palette", 1, 9), tag: "Marque", text: "La palette du client" },
      { at: cue(s, "titre", 1, 11), tag: "Composition", text: "Une zone vide pour le titre" },
      { at: cue(s, "neuvièmes", 1, 13), tag: "Format", text: "16:9" },
      { at: cue(s, "logo", 1, 15), tag: "Exclusions", text: "Sans logo, sans texte, sans imiter un artiste" },
    ]} />
    <Note at={cue(s, "variantes", 1, 20)} out={out} top={900} tone="ok" text="Trois variantes, jugées sur les mêmes critères" />
    <Mention text="Exemple fictif" out={out} />
  </>
);

const Grid: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="Choisir et finaliser" before="Une grille," accent="puis la validation" out={out} />
    <Chips out={out} top={370} size={32} items={[
      { at: cue(s, "public", 1, 4), label: "Public" },
      { at: cue(s, "charte", 1, 5), label: "Charte" },
      { at: cue(s, "composition", 1, 6), label: "Composition" },
      { at: cue(s, "anomalies", 1, 7), label: "Anomalies" },
      { at: cue(s, "stéréotypes", 1, 8), label: "Stéréotypes, marques" },
      { at: cue(s, "lisibilité", 1, 9), label: "Lisibilité au format final" },
      { at: cue(s, "accessibilité", 1, 11), label: "Accessibilité" },
    ]} />
    <Note at={cue(s, "alternatif", 1, 14)} out={out} top={640} tone="ok" text="Titre et texte alternatif dans l'outil de mise en page, pas dans l'image" />
    <Note at={cue(s, "illisible", 1, 18)} out={out} top={760} text="Séduisante mais illisible au format final : pas un livrable" />
    <Note at={cue(s, "client", 1, 22)} out={out} top={880} tone="info" text="Validation par le client" />
  </>
);

export const Lesson24Nathalie: React.FC = () => (
  <LessonVideo
    manifest={manifest}
    chapters={[
      { label: "Cadrer", sceneIds: ["1", "2", "3"] },
      { label: "Produire", sceneIds: ["4", "5"] },
      { label: "À vous", sceneIds: ["6"] },
    ]}
    render={{
      "1:over": () => <NameBanner />,
      "2": Brief,
      "3": WhichTool,
      "4": Prompt,
      "5": Grid,
      "6": (s, out) => (
        <>
          <SceneTitle eyebrow="À vous" before="Dans" accent="le Playground" out={out} top={130} />
          <CueSteps out={out} top={330} size={34} steps={[
            { at: cue(s, "clients", 1, 3), text: "Choisir l'outil pour cinq clients fictifs" },
            { at: cue(s, "auditez", 1, 5), text: "Auditer une production" },
            { at: cue(s, "variantes", 1, 8), text: "Créer trois variantes de la page de garde" },
            { at: cue(s, "gardez", 1, 12), text: "Garder brief, prompt, variantes, export, grille" },
          ]} />
          <Mention text="Cas du Playground fictifs" out={out} />
        </>
      ),
    }}
  />
);
