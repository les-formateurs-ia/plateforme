import React from "react";
import manifestJson from "../generated/lesson2_1-commune.json";
import { Glass, GradText, Reveal, baseText } from "../components/ui";
import { IconBrain, IconFileText, IconTarget, IconSearch, IconListChecks } from "../components/icons";
import { C, GRAD } from "../theme";
import { CueCards, CueSteps, NameBanner, SceneTitle } from "../rs6776/kit";
import { LessonVideo, type SceneRender } from "../rs6776/LessonVideo";
import { cue, type Manifest } from "../rs6776/timeline";
import { Chips, IrisBanner, Mention, Note, PromptBox, PromptBuild, RevealTable, TwoCols } from "../lesson2_common/blocks";

// Leçon 2.1 « Les bases du prompt engineering » — vidéo commune.
// Script : docs/formation-rs6776/lecon-2.1/script-video-commune.md

export const manifest = manifestJson as unknown as Manifest;
const scene = (id: string) => manifest.scenes.find((x) => x.id === id)!;

const Objective: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="L'objectif de la leçon" before="Le prompt engineering," accent="une méthode" out={out} />
    <Chips out={out} top={420} items={[
      { at: cue(s, "besoin", 1, 3), label: "Besoin" },
      { at: cue(s, "données", 1, 4), label: "Données utiles" },
      { at: cue(s, "contraintes", 1, 5), label: "Contraintes" },
      { at: cue(s, "critères", 1, 6), label: "Critères de contrôle" },
    ]} />
    <Reveal at={cue(s, "structure", 1, 14)} out={out} style={{ position: "absolute", left: 0, right: 0, top: 600, display: "flex", justifyContent: "center" }}>
      <div style={{ ...baseText, fontSize: 40, fontWeight: 700, color: C.fg2 }}>Une structure en <GradText>cinq éléments</GradText></div>
    </Reveal>
    <IrisBanner at={cue(s, "deuxième", 1, 17)} out={out} text="Écrit · exercice 2 · vos prompts évalués" />
  </>
);

const Vague: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="Un prompt vague" before="Une demande," accent="trois résultats" out={out} top={110} />
    <PromptBox at={0.5} out={out} top={290} text="Écris un message pour informer l'équipe du changement." />
    <CueCards out={out} top={520} height={250} cards={[
      { at: cue(s, "mail", 1, 9), kicker: "Interprétation A", title: "Changement d'horaires", text: "Formel, long", tint: C.bleu },
      { at: cue(s, "message", 2, 12), kicker: "Interprétation B", title: "Nouvel outil", text: "Informel, court", tint: C.beige },
      { at: cue(s, "note", 1, 15), kicker: "Interprétation C", title: "Réorganisation", text: "Très officiel", tint: C.bleuVert },
    ]} />
    <Note at={cue(s, "devine", 1, 22)} out={out} top={830} tone="info" text="Le modèle comble les vides avec le plus probable, pas avec votre contexte" />
    <Mention text="Exemples du cours" out={out} />
  </>
);

const Five: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="La structure" before="Cinq questions" accent="distinctes" out={out} />
    <CueCards out={out} cols={5} top={380} height={440} cards={[
      { at: cue(s, "rôle", 1, 3), title: "Rôle", text: "Quelle posture ? Aucune qualification réelle.", icon: <IconBrain size={36} /> },
      { at: cue(s, "cible", 1, 12), title: "Cible", text: "Pour qui ? Le plus souvent oubliée.", icon: <IconTarget size={36} /> },
      { at: cue(s, "l'objectif", 1, 22), title: "Objectif", text: "Pour accomplir quoi, de façon vérifiable ?", icon: <IconListChecks size={36} /> },
      { at: cue(s, "contexte", 1, 26), title: "Contexte", text: "Ce qui change la réponse, pas tout ce que vous savez.", icon: <IconSearch size={36} /> },
      { at: cue(s, "format", 1, 31), title: "Format", text: "Structure, longueur, registre. Souvent le plus rentable.", icon: <IconFileText size={36} /> },
    ]} />
  </>
);

const Rebuild: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="Exemple du cours" before="Le même besoin," accent="reconstruit" out={out} top={100} />
    <PromptBox at={0.5} out={out} top={270} size={30} label="Avant" struck={cue(s, "reconstruit", 1, 7)} text="Rédige quelque chose sur les réflexes de cybersécurité pour les nouveaux employés." />
    <PromptBuild out={out} top={480} size={31} rows={[
      { at: cue(s, "formateur", 1, 9), tag: "Rôle", text: "Formateur en sécurité informatique" },
      { at: cue(s, "s'adresse", 1, 12), tag: "Cible", text: "Nouveaux employés jamais formés" },
      { at: cue(s, "rédige", 2, 15), tag: "Objectif", text: "Cinq réflexes dès le premier jour" },
      { at: cue(s, "l'entreprise", 1, 18), tag: "Contexte", text: "Une tentative de phishing récente" },
      { at: cue(s, "présente", 1, 21), tag: "Format", text: "Liste à puces, une phrase par réflexe, ton rassurant" },
    ]} />
    <Note at={cue(s, "explicites", 1, 27)} out={out} top={920} tone="ok" text="Cinq décisions explicites : un brouillon plus facile à évaluer" />
  </>
);

const Pitfall: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="Le piège" before="Cible et objectif :" accent="deux décisions" out={out} />
    <TwoCols out={out} top={370} height={300}
      left={{ at: cue(s, "fusionner", 1, 4), title: "Une tâche en creux", text: "« Aide-moi à rédiger quelque chose » : deux inconnues à deviner", tint: C.beige }}
      right={{ at: cue(s, "séparées", 1, 10), title: "Cible + Objectif", text: "Une phrase courte chacune, mais séparées", tint: C.bleuVert }} />
    <Note at={cue(s, "type", 1, 14)} out={out} top={720} tone="info" text="Une tâche qui revient : un prompt type, seul le contexte change" />
    <Note at={cue(s, "collègue", 1, 19)} out={out} top={840} tone="info" text="Le test : un collègue sans contexte pourrait-il le suivre à la lettre ?" />
  </>
);

const Check: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="Après génération" before="Adapté, conforme," accent="puis vérifié" out={out} />
    <TwoCols out={out} top={370} height={270}
      left={{ at: cue(s, "adapté", 1, 6), title: "Adapté", text: "Le fond répond-il à la cible et au contexte ?", tint: C.bleuVert }}
      right={{ at: cue(s, "conforme", 1, 10), title: "Conforme", text: "La forme est-elle celle demandée ?", tint: C.bleu }} />
    <Note at={cue(s, "second", 1, 15)} out={out} top={700} text="Second contrôle : faits, chiffres, dates, omissions, biais, confidentialité" />
    <Note at={cue(s, "faux", 1, 21)} out={out} top={820} tone="alert" text="Un texte peut respecter le format et rester faux" />
  </>
);

const Platform: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="Sur la plateforme" before="Les repères des" accent="Exercices prompts" out={out} top={110} />
    <Reveal at={cue(s, "vingt", 1, 3)} out={out} style={{ position: "absolute", right: 120, top: 120 }}>
      <Glass glow={C.bleuVert} style={{ ...baseText, padding: "18px 34px", borderRadius: 999, fontSize: 44, fontWeight: 800 }}><GradText>/ 20</GradText></Glass>
    </Reveal>
    <Chips out={out} top={300} size={34} items={[
      { at: cue(s, "rôle", 1, 8), label: "Rôle" },
      { at: cue(s, "contexte", 1, 8.5), label: "Contexte" },
      { at: cue(s, "tâche", 1, 9), label: "Tâche" },
      { at: cue(s, "format", 1, 9.5), label: "Format" },
      { at: cue(s, "ton", 1, 10), label: "Ton & public" },
      { at: cue(s, "contraintes", 1, 11), label: "Contraintes" },
    ]} />
    <RevealTable out={out} top={470} left={300} right={300} size={32} headAt={cue(s, "découpées", 1, 13)} cols="1fr 80px 1fr" headers={["Repère de l'atelier", "", "Élément du cours"]} rows={[
      { at: cue(s, "correspond", 1, 15), cells: ["Tâche", "→", "Objectif"] },
      { at: cue(s, "reprend", 1, 17), cells: ["Ton & public", "→", "Cible"] },
      { at: cue(s, "complètent", 1, 19), cells: ["Contraintes", "→", "Format"] },
    ]} />
    <Note at={cue(s, "mot-clé", 1, 22)} out={out} top={900} tone="info" text="Un repère allumé = un mot-clé détecté, pas une décision prise" />
  </>
);

const YourTurn: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="À vous" before="Passez à" accent="la pratique" out={out} top={130} />
    <CueSteps out={out} top={340} steps={[
      { at: cue(s, "playground", 1, 2), text: "Playground : repérer, reconstruire, vérifier" },
      { at: cue(s, "exercices", 1, 9), text: "Exercices prompts : faire noter, puis améliorer" },
    ]} />
    <Note at={cue(s, "budget", 1, 17)} out={out} left={700} right={120} top={640} tone="ok" text="Correction des Exercices : hors budget IA" />
  </>
);

const Recap: SceneRender = (s, out) => (
  <div style={{ position: "absolute", left: 1120, top: 220, width: 700 }}>
    <Reveal at={cue(s, "retenez", 1, 0.5) + 0.6} out={out}>
      <div style={{ ...baseText, fontSize: 24, letterSpacing: "0.14em", textTransform: "uppercase", color: C.fg3, fontWeight: 600, marginBottom: 26 }}>À retenir</div>
    </Reveal>
    <CueSteps out={out} left={0} top={70} width={700} size={34} steps={[
      { at: cue(s, "vague", 1, 3), text: "Un prompt vague laisse deviner" },
      { at: cue(s, "cinq", 1, 6), text: "Rôle, Cible, Objectif, Contexte, Format" },
      { at: cue(s, "vérifie", 1, 11), text: "Adapté, conforme, puis vérifié" },
    ]} />
    <Reveal at={cue(s, "quiz", 1, 14)} out={out} style={{ position: "absolute", top: 520, left: 0 }}>
      <div style={{ ...baseText, padding: "20px 34px", borderRadius: 999, backgroundImage: GRAD.iris, color: C.ink, fontSize: 30, fontWeight: 700 }}>Quiz, puis leçon 2.2 : les tâches complexes</div>
    </Reveal>
  </div>
);

export const Lesson21Commune: React.FC = () => (
  <LessonVideo
    manifest={manifest}
    chapters={[
      { label: "Introduction", sceneIds: ["1", "2"] },
      { label: "La structure", sceneIds: ["3", "4", "5", "6"] },
      { label: "Vérifier", sceneIds: ["7"] },
      { label: "À vous", sceneIds: ["8", "9", "10"] },
    ]}
    shrinkAt={{ "10": cue(scene("10"), "retenez", 1, 0.5) + 0.2 }}
    render={{
      "1:over": () => <NameBanner />,
      "2": Objective,
      "3": Vague,
      "4": Five,
      "5": Rebuild,
      "6": Pitfall,
      "7": Check,
      "8": Platform,
      "9": YourTurn,
      "10:over": Recap,
    }}
  />
);
