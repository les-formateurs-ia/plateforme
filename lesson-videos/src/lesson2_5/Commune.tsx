import React from "react";
import manifestJson from "../generated/lesson2_5-commune.json";
import { Reveal, baseText } from "../components/ui";
import { C, GRAD } from "../theme";
import { CueCards, CueSteps, NameBanner, SceneTitle } from "../rs6776/kit";
import { LessonVideo, type SceneRender } from "../rs6776/LessonVideo";
import { cue, type Manifest } from "../rs6776/timeline";
import { Chips, IrisBanner, Mention, Note, PromptBuild, TwoCols } from "../lesson2_common/blocks";

// Leçon 2.5 « Optimiser les contenus générés » — vidéo commune.
// Script : docs/formation-rs6776/lecon-2.5/script-video-commune.md

export const manifest = manifestJson as unknown as Manifest;
const scene = (id: string) => manifest.scenes.find((x) => x.id === id)!;

const Objective: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="L'objectif de la leçon" before="Du premier jet" accent="à la version contrôlée" out={out} />
    <Chips out={out} top={400} size={38} items={[
      { at: cue(s, "fond", 1, 4), label: "Vérifier le fond" },
      { at: cue(s, "critères", 1, 6), label: "Critères d'acceptation" },
      { at: cue(s, "cibler", 1, 8), label: "Cibler les changements" },
      { at: cue(s, "comparer", 1, 9), label: "Comparer" },
      { at: cue(s, "trace", 1, 11), label: "Tracer" },
    ]} />
    <Note at={cue(s, "angles", 1, 14)} out={out} top={620} tone="info" text="Cinq angles pratiques pour diagnostiquer" />
    <IrisBanner at={cue(s, "cinquième", 1, 18)} out={out} top={760} size={30} text="Écrit · exercice 5 · un prompt d'optimisation complet et un contenu optimisé" />
  </>
);

const Substance: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="Premier réflexe" before="Le fond" accent="d'abord" out={out} />
    <Chips out={out} top={380} size={34} items={[
      { at: cue(s, "faits", 1, 4), label: "Faits" },
      { at: cue(s, "chiffres", 1, 5), label: "Chiffres" },
      { at: cue(s, "noms", 1, 5.5), label: "Noms" },
      { at: cue(s, "omissions", 1, 6), label: "Omissions" },
      { at: cue(s, "raisonnement", 1, 6.5), label: "Raisonnement" },
      { at: cue(s, "confidentialité", 1, 7.5), label: "Confidentialité" },
      { at: cue(s, "droits", 1, 8), label: "Droits" },
    ]} />
    <Note at={cue(s, "s'embellit", 1, 11)} out={out} top={640} text="Un texte faux se corrige depuis une source identifiée" />
    <Note at={cue(s, "fluidité", 1, 15)} out={out} top={760} tone="info" text="La fluidité n'est pas une validation" />
    <Mention text="Exemple fictif" out={out} />
  </>
);

const Paths: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="Deux chemins" before="Corriger" accent="ou repartir" out={out} />
    <TwoCols out={out} top={360} height={300}
      left={{ at: cue(s, "ciblée", 1, 1), title: "Correction ciblée", text: "Préserve les passages déjà validés", tint: C.bleuVert }}
      right={{ at: cue(s, "nouvel", 1, 12), title: "Nouvel échange propre", text: "Contexte qui dérive, consignes contradictoires, base fragile", tint: C.beige }} />
    <Chips out={out} top={740} size={32} items={[
      { at: cue(s, "départ", 2, 16), label: "Version de départ", tint: C.bleu },
      { at: cue(s, "consigne", 1, 17), label: "Consigne de correction", tint: C.bleu },
      { at: cue(s, "obtenue", 1, 18), label: "Version obtenue", tint: C.bleu },
    ]} />
  </>
);

const Angles: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="Diagnostiquer" before="Cinq angles" accent="qui se recouvrent" out={out} top={110} />
    <CueCards out={out} cols={5} top={290} height={360} cards={[
      { at: cue(s, "contrainte", 1, 3), title: "Contrainte", text: "« Pas plus de 100 mots »", tint: C.violet },
      { at: cue(s, "contexte", 1, 8), title: "Contexte et sources", text: "« Cite la section de la politique validée »", tint: C.bleu },
      { at: cue(s, "style", 1, 13), title: "Style", text: "« Passe au tutoiement »", tint: C.bleuVert },
      { at: cue(s, "format", 1, 16), title: "Format", text: "« Ajoute des sous-titres »", tint: C.beige },
      { at: cue(s, "l'accessibilité", 1, 20), title: "Accessibilité", text: "« Une idée par phrase »", tint: C.violetLight },
    ]} />
    <Note at={cue(s, "recouvrent", 1, 32)} out={out} top={710} tone="info" text="Une phrase plus courte : style et accessibilité à la fois" />
    <Note at={cue(s, "observables", 1, 38)} out={out} top={830} tone="ok" text="« Améliore ça » devient des critères observables" />
  </>
);

const Template: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="Le gabarit" before="Un prompt d'optimisation" accent="complet" out={out} top={100} />
    <PromptBuild out={out} top={250} size={29} gap={13} rows={[
      { at: cue(s, "version", 1, 4), tag: "Version", text: "Le contenu à corriger, version identifiée" },
      { at: cue(s, "besoin", 1, 6), tag: "Besoin", text: "L'usage réel et le public" },
      { at: cue(s, "sources", 1, 8), tag: "Sources", text: "Les sources de vérité ; ne rien inventer" },
      { at: cue(s, "conserver", 1, 10), tag: "Conserve", text: "Les éléments déjà vérifiés" },
      { at: cue(s, "modifier", 1, 12), tag: "Modifie", text: "Les changements précis" },
      { at: cue(s, "critères", 1, 13), tag: "Critères", text: "Exactitude, longueur, structure, termes, accessibilité" },
      { at: cue(s, "résultat", 1, 15), tag: "Résultat", text: "Version, relevé des changements, points à confirmer" },
    ]} />
    <Note at={cue(s, "comptez", 1, 24)} out={out} top={890} tone="ok" text="Compter · revenir à la source · faire tester par le public" />
  </>
);

const Worked: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="Exemple du cours" before="Vulgariser" accent="un texte technique" out={out} top={110} />
    <Note at={cue(s, "soixante", 1, 6)} out={out} top={280} tone="info" text="Pour des novices · une notification · 60 mots maximum" />
    <TwoCols out={out} top={400} height={340}
      left={{ at: cue(s, "technique", 1, 4), title: "Avant", text: "Chiffré sur l'appareil de l'expéditeur, déchiffré sur celui du destinataire… implémentation, gestion des clés", tint: C.violet }}
      right={{ at: cue(s, "enveloppe", 1, 22), title: "Après", text: "Une enveloppe fermée avant l'envoi, que seuls les appareils des participants savent normalement ouvrir", tint: C.bleuVert }} />
    <Note at={cue(s, "réserves", 1, 30)} out={out} top={800} tone="ok" text="Style · contrainte · fond préservé, réserves visibles" />
    <Mention text="Exemple du cours" out={out} />
  </>
);

const Tension: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="Quand les exigences se contredisent" before="Protéger," accent="puis arbitrer" out={out} top={110} />
    <Note at={cue(s, "incompatibles", 1, 2)} out={out} top={280} text="« Ajouter une règle » + « même longueur exacte »" />
    <CueSteps out={out} left={300} width={1300} top={410} size={32} steps={[
      { at: cue(s, "l'exactitude", 1, 9), text: "Exactitude, sécurité, légalité, informations indispensables" },
      { at: cue(s, "finalité", 1, 14), text: "Finalité et besoins d'accès du public" },
      { at: cue(s, "compatibles", 1, 18), text: "Contraintes compatibles" },
      { at: cue(s, "style", 1, 19), text: "Le style, en dernier" },
    ]} />
    <Note at={cue(s, "arbitrage", 1, 24)} out={out} top={800} tone="info" text="Demander un arbitrage : longueur négociée ou lien complémentaire" />
    <Note at={cue(s, "l'esthétique", 1, 36)} out={out} top={910} tone="ok" size={26} text="S'arrêter quand une itération ne change plus que l'esthétique" />
  </>
);

const YourTurn: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="À vous" before="Passez à" accent="la pratique" out={out} top={130} />
    <CueSteps out={out} top={330} steps={[
      { at: cue(s, "playground", 1, 2), text: "Playground : les exercices de la leçon" },
      { at: cue(s, "tentatives", 1, 7), text: "Exercices prompts : comparer les tentatives" },
      { at: cue(s, "studio", 1, 13), text: "Studio : une conversation d'optimisation" },
    ]} />
    <Note at={cue(s, "gemini", 1, 18)} out={out} left={700} right={120} top={680} tone="ok" size={28} text="Le chat Gemini : hors budget IA" />
  </>
);

const Recap: SceneRender = (s, out) => (
  <div style={{ position: "absolute", left: 1120, top: 220, width: 700 }}>
    <Reveal at={cue(s, "retenez", 1, 0.5) + 0.6} out={out}>
      <div style={{ ...baseText, fontSize: 24, letterSpacing: "0.14em", textTransform: "uppercase", color: C.fg3, fontWeight: 600, marginBottom: 26 }}>À retenir</div>
    </Reveal>
    <CueSteps out={out} left={0} top={70} width={700} size={34} steps={[
      { at: cue(s, "fond", 1, 3), text: "Le fond avant la forme" },
      { at: cue(s, "observables", 1, 6), text: "Des critères observables" },
      { at: cue(s, "comparaison", 1, 10), text: "Comparer et tracer chaque version" },
    ]} />
    <Reveal at={cue(s, "mission", 1, 17)} out={out} style={{ position: "absolute", top: 520, left: 0 }}>
      <div style={{ ...baseText, padding: "20px 34px", borderRadius: 999, backgroundImage: GRAD.iris, color: C.ink, fontSize: 28, fontWeight: 700 }}>Quiz, puis « Mission IA : contenu et optimisation »</div>
    </Reveal>
  </div>
);

export const Lesson25Commune: React.FC = () => (
  <LessonVideo
    manifest={manifest}
    chapters={[
      { label: "Introduction", sceneIds: ["1", "2"] },
      { label: "Diagnostiquer", sceneIds: ["3", "4", "5"] },
      { label: "Corriger, arbitrer", sceneIds: ["6", "7", "8"] },
      { label: "À vous", sceneIds: ["9", "10"] },
    ]}
    shrinkAt={{ "10": cue(scene("10"), "retenez", 1, 0.5) + 0.2 }}
    render={{
      "1:over": () => <NameBanner />,
      "2": Objective,
      "3": Substance,
      "4": Paths,
      "5": Angles,
      "6": Template,
      "7": Worked,
      "8": Tension,
      "9": YourTurn,
      "10:over": Recap,
    }}
  />
);
