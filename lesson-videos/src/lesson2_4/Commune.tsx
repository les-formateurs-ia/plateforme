import React from "react";
import manifestJson from "../generated/lesson2_4-commune.json";
import { Reveal, baseText } from "../components/ui";
import { IconEye, IconLock, IconScan, IconShield, IconUser, IconFileText, IconAward, IconFrame } from "../components/icons";
import { C, GRAD } from "../theme";
import { CueCards, CueSteps, NameBanner, SceneTitle } from "../rs6776/kit";
import { LessonVideo, type SceneRender } from "../rs6776/LessonVideo";
import { cue, type Manifest } from "../rs6776/timeline";
import { Chips, IrisBanner, LogoRow, Mention, Note, PromptBuild, TwoCols } from "../lesson2_common/blocks";

// Leçon 2.4 « Créer des contenus visuels » — vidéo commune.
// Script : docs/formation-rs6776/lecon-2.4/script-video-commune.md

export const manifest = manifestJson as unknown as Manifest;
const scene = (id: string) => manifest.scenes.find((x) => x.id === id)!;

const Objective: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="L'objectif de la leçon" before="Du besoin" accent="au visuel diffusable" out={out} top={110} />
    <Chips out={out} top={310} size={38} items={[
      { at: cue(s, "cadrer", 1, 3), label: "Cadrer" },
      { at: cue(s, "choisir", 1, 4), label: "Choisir l'environnement" },
      { at: cue(s, "rédiger", 1, 6), label: "Un prompt testable" },
      { at: cue(s, "contrôler", 1, 7), label: "Contrôler avant diffusion" },
    ]} />
    <IrisBanner at={cue(s, "deuxième", 1, 10)} out={out} top={500} text="Écrit · exercice 2 · un visuel à produire, dans le Studio" />
    <LogoRow out={out} top={640} size={90} items={[
      { at: cue(s, "copilot", 1, 22), id: "copilot", caption: "Exemple du cours" },
      { at: cue(s, "firefly", 1, 23), id: "firefly", caption: "Exemple du cours" },
    ]} />
  </>
);

const Questions: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="Avant le premier prompt" before="Six" accent="questions" out={out} top={110} />
    <CueCards out={out} cols={3} top={290} height={190} cards={[
      { at: cue(s, "verra", 1, 3), title: "Public", icon: <IconUser size={32} />, tint: C.bleu },
      { at: cue(s, "données", 1, 5), title: "Données et références", icon: <IconFileText size={32} />, tint: C.bleu },
      { at: cue(s, "charte", 1, 8), title: "Charte et contraintes", icon: <IconFrame size={32} />, tint: C.bleu },
      { at: cue(s, "droits", 1, 11), title: "Droits", icon: <IconShield size={32} />, tint: C.bleu },
      { at: cue(s, "trace", 1, 14), title: "Traçabilité", icon: <IconScan size={32} />, tint: C.bleu },
      { at: cue(s, "validera", 1, 16), title: "Valideur", icon: <IconAward size={32} />, tint: C.bleu },
    ]} />
    <Note at={cue(s, "fictif", 1, 20)} out={out} top={830} text="Pas autorisé : rien à importer, un cas fictif" />
  </>
);

const Env: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="Choisir" before="Un environnement," accent="pas un meilleur outil" out={out} top={110} />
    <TwoCols out={out} top={280} height={360}
      left={{ at: cue(s, "copilot", 1, 4), title: "Copilot", text: "Écosystème Microsoft, besoin rapide, environnement approuvé", tint: tintOf("copilot"), logo: "copilot" }}
      right={{ at: cue(s, "firefly", 1, 12), title: "Firefly", text: "Flux de production Adobe, génération et retouche", tint: tintOf("firefly"), logo: "firefly" }} />
    <Note at={cue(s, "quotas", 1, 20)} out={out} top={690} tone="info" text="Capacités, quotas, protections : selon l'offre réellement utilisée" />
    <Note at={cue(s, "plateforme", 1, 25)} out={out} top={800} tone="info" text="Hors plateforme : accès de l'organisation ou site officiel" />
    <Note at={cue(s, "multifacteur", 1, 32)} out={out} top={910} tone="ok" size={26} text="Pas de compte en plus par réflexe · authentification multifacteur" />
  </>
);

const tintOf = (id: string) => (id === "copilot" ? C.violet : C.violetLight);

const Rights: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="Les droits d'usage" before="Positionnement," accent="contrat, contrôle" out={out} top={110} />
    <CueCards out={out} top={280} height={230} cards={[
      { at: cue(s, "positionnement", 1, 7), title: "Positionnement de l'éditeur", text: "Réduit certains risques, sans autorisation universelle", tint: C.beige },
      { at: cue(s, "conditions", 1, 16), title: "Conditions de l'offre", text: "Produit, offre, territoire, type de sortie", tint: C.beige },
      { at: cue(s, "responsable", 1, 22), title: "Vos entrées", text: "Vous en restez responsable", icon: <IconLock size={32} />, tint: C.beige },
    ]} />
    <Chips out={out} top={580} size={30} items={[
      { at: cue(s, "logos", 1, 24), label: "Logos", tint: C.beige },
      { at: cue(s, "photographies", 1, 25), label: "Photographies", tint: C.beige },
      { at: cue(s, "marques", 1, 26), label: "Marques", tint: C.beige },
      { at: cue(s, "personnelles", 1, 27), label: "Données personnelles", tint: C.beige },
      { at: cue(s, "créations", 1, 28), label: "Créations de tiers", tint: C.beige },
    ]} />
    <Note at={cue(s, "régularise", 1, 31)} out={out} top={800} text="Le choix d'un éditeur ne régularise pas une entrée non autorisée" />
  </>
);

const Provenance: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="Provenance" before="Content Credentials :" accent="une piste, pas une preuve" out={out} top={110} />
    <TwoCols out={out} top={280} height={260}
      left={{ at: cue(s, "credentials", 1, 2), title: "Standard C2PA", text: "L'outil utilisé et certaines étapes de l'historique", tint: C.bleu }}
      right={{ at: cue(s, "capture", 1, 12), title: "Peut disparaître", text: "Capture d'écran, conversion. Ni véracité, ni tous les droits", tint: C.beige }} />
    <Chips out={out} top={610} size={30} items={[
      { at: cue(s, "brief", 1, 22), label: "Brief", tint: C.bleuVert },
      { at: cue(s, "références", 1, 23), label: "Références et autorisations", tint: C.bleuVert },
      { at: cue(s, "prompt", 1, 25), label: "Prompt", tint: C.bleuVert },
      { at: cue(s, "l'export", 1, 26), label: "Export original", tint: C.bleuVert },
      { at: cue(s, "contrôles", 1, 27), label: "Contrôles", tint: C.bleuVert },
      { at: cue(s, "valideur", 1, 29), label: "Date, version, valideur", tint: C.bleuVert },
    ]} />
    <Reveal at={cue(s, "dossier", 1, 21)} out={out} style={{ position: "absolute", left: 0, right: 0, top: 560, textAlign: "center" }}>
      <div style={{ ...baseText, fontSize: 22, letterSpacing: "0.14em", textTransform: "uppercase", color: C.fg3, fontWeight: 600 }}>Le dossier de preuve</div>
    </Reveal>
  </>
);

const VisualPrompt: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="Un prompt visuel" before="Testable," accent="ligne par ligne" out={out} top={100} />
    <PromptBuild out={out} top={260} size={29} gap={14} rows={[
      { at: cue(s, "garde", 1, 9), tag: "Finalité", text: "Page de garde d'un guide pour des managers" },
      { at: cue(s, "atelier", 1, 12), tag: "Sujet", text: "Illustration sobre d'un atelier collaboratif" },
      { at: cue(s, "isométrique", 1, 14), tag: "Composition", text: "Vue isométrique, zone vide en haut pour le titre" },
      { at: cue(s, "personnages", 1, 16), tag: "Personnes", text: "Divers, sans visage identifiable" },
      { at: cue(s, "palette", 1, 18), tag: "Marque", text: "Palette bleu nuit et vert d'eau" },
      { at: cue(s, "neuvièmes", 1, 22), tag: "Format", text: "Paysage 16:9" },
      { at: cue(s, "logo", 1, 24), tag: "Exclusions", text: "Sans logo, sans texte intégré, sans imiter un artiste" },
    ]} />
    <Mention text="Exemple du cours" out={out} />
  </>
);

const Control: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="Après génération" before="Comparer, retoucher," accent="ou ne pas générer" out={out} top={110} />
    <Chips out={out} top={300} size={32} items={[
      { at: cue(s, "détails", 1, 6), label: "Détails incohérents" },
      { at: cue(s, "stéréotypes", 1, 7), label: "Stéréotypes" },
      { at: cue(s, "symboles", 1, 8), label: "Symboles et marques" },
      { at: cue(s, "lisibilité", 1, 10), label: "Lisibilité" },
      { at: cue(s, "dimensions", 1, 11), label: "Dimensions" },
    ]} />
    <Note at={cue(s, "variantes", 1, 1)} out={out} top={500} tone="info" text="Plusieurs variantes, une grille préparée, puis la retouche" />
    <Note at={cue(s, "alternatif", 1, 14)} out={out} top={620} tone="ok" text="Titre final et texte alternatif : dans un outil adapté" />
    <Note at={cue(s, "diagramme", 1, 24)} out={out} top={740} tone="alert" text="Organigramme, procédure, graphique chiffré : outil de diagramme et source vérifiée" />
    <Reveal at={cue(s, "séduisante", 1, 16)} out={out} style={{ position: "absolute", right: 120, top: 870 }}>
      <div style={{ ...baseText, display: "flex", alignItems: "center", gap: 12, fontSize: 26, color: C.fg2 }}><IconEye size={28} />Séduisante mais illisible : pas un livrable</div>
    </Reveal>
  </>
);

const YourTurn: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="À vous" before="Passez à" accent="la pratique" out={out} top={130} />
    <CueSteps out={out} top={320} size={34} steps={[
      { at: cue(s, "playground", 1, 2), text: "Playground : les exercices de la leçon" },
      { at: cue(s, "créer", 1, 5), text: "Studio : « Créer vos images »" },
      { at: cue(s, "l'atelier", 1, 10), text: "Exercices : « Images & vidéos », avant et après" },
      { at: cue(s, "rétro-ingénierie", 1, 15), text: "Rétro-ingénierie : retrouver le prompt" },
    ]} />
    <Note at={cue(s, "budget", 1, 19)} out={out} left={700} right={120} top={760} tone="alert" size={26} text="Les générations consomment votre budget IA" />
  </>
);

const Recap: SceneRender = (s, out) => (
  <div style={{ position: "absolute", left: 1120, top: 220, width: 700 }}>
    <Reveal at={cue(s, "retenez", 1, 0.5) + 0.6} out={out}>
      <div style={{ ...baseText, fontSize: 24, letterSpacing: "0.14em", textTransform: "uppercase", color: C.fg3, fontWeight: 600, marginBottom: 26 }}>À retenir</div>
    </Reveal>
    <CueSteps out={out} left={0} top={70} width={700} size={34} steps={[
      { at: cue(s, "autoriser", 1, 3), text: "Autoriser et cadrer avant de générer" },
      { at: cue(s, "dossier", 1, 8), text: "Un visuel se justifie par son dossier" },
      { at: cue(s, "schéma", 1, 12), text: "Un schéma, quand la précision prime" },
    ]} />
    <Reveal at={cue(s, "quiz", 1, 15)} out={out} style={{ position: "absolute", top: 520, left: 0 }}>
      <div style={{ ...baseText, padding: "20px 34px", borderRadius: 999, backgroundImage: GRAD.iris, color: C.ink, fontSize: 30, fontWeight: 700 }}>Quiz, puis leçon 2.5 : améliorer un résultat</div>
    </Reveal>
  </div>
);

export const Lesson24Commune: React.FC = () => (
  <LessonVideo
    manifest={manifest}
    chapters={[
      { label: "Introduction", sceneIds: ["1", "2"] },
      { label: "Cadrer et choisir", sceneIds: ["3", "4", "5", "6"] },
      { label: "Produire et contrôler", sceneIds: ["7", "8"] },
      { label: "À vous", sceneIds: ["9", "10"] },
    ]}
    shrinkAt={{ "10": cue(scene("10"), "retenez", 1, 0.5) + 0.2 }}
    render={{
      "1:over": () => <NameBanner />,
      "2": Objective,
      "3": Questions,
      "4": Env,
      "5": Rights,
      "6": Provenance,
      "7": VisualPrompt,
      "8": Control,
      "9": YourTurn,
      "10:over": Recap,
    }}
  />
);
