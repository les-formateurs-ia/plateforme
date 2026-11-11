import React from "react";
import manifestJson from "../generated/lesson2_3-commune.json";
import { Reveal, baseText } from "../components/ui";
import { IconFileText, IconSearch, IconShield } from "../components/icons";
import { C, GRAD } from "../theme";
import { CueCards, CueSteps, NameBanner, SceneTitle } from "../rs6776/kit";
import { LessonVideo, type SceneRender } from "../rs6776/LessonVideo";
import { cue, type Manifest } from "../rs6776/timeline";
import { Chips, IrisBanner, LogoRow, Mention, Note, PromptBox, RevealTable, TwoCols } from "../lesson2_common/blocks";

// Leçon 2.3 « Rédaction assistée par IA » — vidéo commune.
// Script : docs/formation-rs6776/lecon-2.3/script-video-commune.md

export const manifest = manifestJson as unknown as Manifest;
const scene = (id: string) => manifest.scenes.find((x) => x.id === id)!;

const Objective: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="L'objectif de la leçon" before="Rédiger," accent="et pouvoir le défendre" out={out} top={110} />
    <CueCards out={out} top={300} height={220} cards={[
      { at: cue(s, "choisir", 1, 4), title: "Choisir un environnement autorisé", icon: <IconShield size={34} />, tint: C.bleu },
      { at: cue(s, "évaluer", 1, 7), title: "Évaluer un assistant préconfiguré", icon: <IconSearch size={34} />, tint: C.beige },
      { at: cue(s, "transformer", 1, 9), title: "Produire un compte-rendu vérifiable", icon: <IconFileText size={34} />, tint: C.bleuVert },
    ]} />
    <IrisBanner at={cue(s, "deuxième", 1, 14)} out={out} top={570} text="Écrit · exercice 2 · un contenu que vous pouvez défendre" />
    <LogoRow out={out} top={690} size={90} items={[
      { at: cue(s, "chatgpt", 1, 20), id: "chatgpt" },
      { at: cue(s, "gemini", 1, 21), id: "gemini" },
    ]} />
    <Note at={cue(s, "firefly", 1, 26)} out={out} top={950} tone="info" size={24} text="Claude et Copilot : module 1 · Firefly : leçon 2.4, les visuels" />
  </>
);

const Compare: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="Pour rédiger" before="Un environnement," accent="pas un classement" out={out} top={100} />
    <RevealTable out={out} top={260} size={28} cols="360px 1fr 1fr" headAt={cue(s, "chatgpt", 1, 1)} headers={["Critère", "ChatGPT", "Gemini"]} rows={[
      { at: cue(s, "résumer", 1, 5), cells: ["Rédaction, résumé", "Solide", "Solide"] },
      { at: cue(s, "bureautique", 1, 20), cells: ["Intégration bureautique", "Import et export selon l'offre", "Docs, Sheets, Gmail selon l'offre Workspace"] },
      { at: cue(s, "projects", 1, 29), cells: ["Personnalisation", "Projects et GPT", "Gems"] },
    ]} />
    <Note at={cue(s, "représentatif", 1, 14)} out={out} top={700} tone="ok" text="Un essai sur un cas représentatif plutôt qu'un classement" />
    <Note at={cue(s, "proposition", 1, 33)} out={out} top={820} text="Le texte généré reste une proposition : chiffres, noms, décisions, omissions" />
  </>
);

const Modes: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="Le sélecteur de mode" before="Rapide" accent="ou approfondi" out={out} />
    <TwoCols out={out} top={370} height={300}
      left={{ at: cue(s, "rapide", 1, 5), title: "Mode rapide", text: "Une tâche courante : reformuler une phrase", tint: C.bleu }}
      right={{ at: cue(s, "approfondi", 1, 10), title: "Mode approfondi", text: "Une demande qui croise plusieurs contraintes", tint: C.violet }} />
    <Note at={cue(s, "nom", 1, 15)} out={out} top={730} tone="info" text="Son nom et sa place changent : retenez son existence" />
    <Note at={cue(s, "contrôlez", 1, 19)} out={out} top={850} text="Aucun mode ne garantit un texte exact" />
  </>
);

const Assistants: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="Projects et assistants" before="Pratique," accent="pas une garantie" out={out} />
    <TwoCols out={out} top={360} height={360}
      left={{ at: cue(s, "project", 1, 1), title: "Project", text: "Ni confidentialité garantie, ni accès séparés : membres, partages, fichiers, données", tint: C.beige }}
      right={{ at: cue(s, "store", 1, 14), title: "GPT Store", text: "Référencé ne veut pas dire validé : éditeur, connexions, données reçues, test fictif", tint: C.beige }} />
    <Note at={cue(s, "officielle", 1, 30)} out={out} top={790} tone="info" text="Créer, publier, utiliser : selon l'offre et les réglages administrateur" />
  </>
);

const BeforeRec: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="Passons à l'oral" before="Avant" accent="d'enregistrer" out={out} />
    <Chips out={out} top={400} size={36} items={[
      { at: cue(s, "finalité", 1, 14), label: "Finalité" },
      { at: cue(s, "l'information", 1, 15), label: "Information des participants" },
      { at: cue(s, "autorisées", 1, 17), label: "Personnes autorisées" },
      { at: cue(s, "stockage", 1, 18), label: "Lieu de stockage" },
      { at: cue(s, "durée", 1, 19), label: "Durée de conservation" },
    ]} />
    <Note at={cue(s, "discrètement", 1, 9)} out={out} top={690} text="Enregistrer discrètement « parce que l'outil le permet » : jamais" />
    <Note at={cue(s, "local", 1, 22)} out={out} top={810} tone="info" text="« Local » se vérifie aussi : envoi secondaire, sauvegardes, suppression" />
  </>
);

const Chain: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="La méthode" before="Six étapes," accent="une chaîne maîtrisée" out={out} />
    <Chips out={out} top={400} size={36} items={[
      { at: cue(s, "cadrer", 1, 3), label: "1 · Cadrer", tint: C.bleuVert },
      { at: cue(s, "enregistrer", 1, 4), label: "2 · Enregistrer le nécessaire", tint: C.bleuVert },
      { at: cue(s, "transcrire", 1, 7), label: "3 · Transcrire, outil approuvé", tint: C.bleuVert },
      { at: cue(s, "contrôler", 1, 12), label: "4 · Contrôler la fidélité", tint: C.bleuVert },
      { at: cue(s, "minimiser", 1, 19), label: "5 · Minimiser et protéger", tint: C.bleuVert },
      { at: cue(s, "rédiger", 1, 27), label: "6 · Rédiger, vérifier, valider", tint: C.bleuVert },
    ]} />
    <Note at={cue(s, "l'inventer", 1, 17)} out={out} top={700} tone="ok" text="L'inaudible se signale, il ne s'invente pas" />
    <Note at={cue(s, "pseudonymisation", 1, 23)} out={out} top={820} text="Une pseudonymisation n'est pas une anonymisation" />
  </>
);

const Report: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="La dernière étape" before="Un compte-rendu" accent="vérifiable" out={out} top={100} />
    <PromptBox at={cue(s, "n'invente", 1, 8)} out={out} top={250} size={28} label="Contrainte du prompt" text="À partir de la seule transcription : n'invente aucune décision, personne, date ni action ; indique « à confirmer »." />
    <RevealTable out={out} top={480} size={26} headAt={cue(s, "tableau", 1, 16)} headers={["Action", "Responsable", "Échéance", "Statut", "Repère source"]} rows={[
      { at: cue(s, "responsable", 1, 18), cells: ["Action citée", "à confirmer", "à confirmer", "à confirmer", "repère temporel"] },
    ]} />
    <Note at={cue(s, "piste", 1, 24)} out={out} top={760} tone="ok" text="Chaque ligne doit se retrouver dans la source" />
    <Note at={cue(s, "absente", 1, 31)} out={out} top={880} text="Responsable ou échéance absente : corriger avant validation" />
    <Mention text="Exemple fictif" out={out} />
  </>
);

const YourTurn: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="À vous" before="Passez à" accent="la pratique" out={out} top={130} />
    <CueSteps out={out} top={330} steps={[
      { at: cue(s, "playground", 1, 2), text: "Playground : les exercices de la leçon" },
      { at: cue(s, "studio", 1, 5), text: "Studio : la même consigne à ChatGPT, puis à Gemini" },
      { at: cue(s, "polyvalent", 1, 18), text: "Battle Ground : gamme Polyvalent, défi « Rédaction »" },
    ]} />
    <Note at={cue(s, "seul", 1, 12)} out={out} left={700} right={120} top={680} tone="info" size={28} text="Le Studio : seul outil ouvert pendant l'écrit" />
  </>
);

const Recap: SceneRender = (s, out) => (
  <div style={{ position: "absolute", left: 1120, top: 220, width: 700 }}>
    <Reveal at={cue(s, "retenez", 1, 0.5) + 0.6} out={out}>
      <div style={{ ...baseText, fontSize: 24, letterSpacing: "0.14em", textTransform: "uppercase", color: C.fg3, fontWeight: 600, marginBottom: 26 }}>À retenir</div>
    </Reveal>
    <CueSteps out={out} left={0} top={70} width={700} size={34} steps={[
      { at: cue(s, "l'environnement", 1, 3), text: "L'environnement autorisé choisit l'outil" },
      { at: cue(s, "assistant", 1, 7), text: "Un assistant se vérifie avant usage" },
      { at: cue(s, "chaîne", 1, 11), text: "De l'enregistrement à la validation humaine" },
    ]} />
    <Reveal at={cue(s, "quiz", 1, 15)} out={out} style={{ position: "absolute", top: 520, left: 0 }}>
      <div style={{ ...baseText, padding: "20px 34px", borderRadius: 999, backgroundImage: GRAD.iris, color: C.ink, fontSize: 30, fontWeight: 700 }}>Quiz, puis leçon 2.4 : les visuels</div>
    </Reveal>
  </div>
);

export const Lesson23Commune: React.FC = () => (
  <LessonVideo
    manifest={manifest}
    chapters={[
      { label: "Introduction", sceneIds: ["1", "2"] },
      { label: "Choisir son outil", sceneIds: ["3", "4", "5"] },
      { label: "De l'oral à l'écrit", sceneIds: ["6", "7", "8"] },
      { label: "À vous", sceneIds: ["9", "10"] },
    ]}
    shrinkAt={{ "10": cue(scene("10"), "retenez", 1, 0.5) + 0.2 }}
    render={{
      "1:over": () => <NameBanner />,
      "2": Objective,
      "3": Compare,
      "4": Modes,
      "5": Assistants,
      "6": BeforeRec,
      "7": Chain,
      "8": Report,
      "9": YourTurn,
      "10:over": Recap,
    }}
  />
);
