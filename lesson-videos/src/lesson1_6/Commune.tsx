import React from "react";
import manifestJson from "../generated/lesson1_6-commune.json";
import { Glass, Reveal, baseText } from "../components/ui";
import { IconAlert, IconCalendar, IconCheck, IconClock, IconListChecks, IconNote, IconShield, IconTarget, IconTrendUp, IconUser, IconX } from "../components/icons";
import { C, GRAD } from "../theme";
import { CueCards, CueSteps, NameBanner, SceneTitle } from "../rs6776/kit";
import { LessonVideo, type SceneRender } from "../rs6776/LessonVideo";
import { cue, type Manifest } from "../rs6776/timeline";

// Leçon 1.6 « Élaborer son plan d'actions IA » — vidéo commune (dernière leçon du module 1).
// Script : docs/formation-rs6776/lecon-1.6/script-video-commune.md

export const manifest = manifestJson as unknown as Manifest;

const Pill: React.FC<{ at: number; out: number; top: number; children: React.ReactNode }> = ({ at, out, top, children }) => (
  <Reveal at={at} out={out} style={{ position: "absolute", left: 0, right: 0, top, display: "flex", justifyContent: "center" }}>
    <div style={{ ...baseText, padding: "22px 40px", borderRadius: 999, backgroundImage: GRAD.iris, color: C.ink, fontSize: 32, fontWeight: 700 }}>{children}</div>
  </Reveal>
);

const Objective: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="Objectif de la leçon" before="Un plan d'actions" accent="concret" out={out} />
    <CueCards out={out} top={380} height={240} cards={[
      { at: cue(s, "écrit", 1, 4), title: "Écrit", icon: <IconNote size={38} />, tint: C.violet },
      { at: cue(s, "priorisé", 1, 5), title: "Priorisé", icon: <IconListChecks size={38} />, tint: C.bleu },
      { at: cue(s, "mesurable", 1, 6), title: "Mesurable", icon: <IconTarget size={38} />, tint: C.bleuVert },
    ]} />
    <Pill at={cue(s, "exercice", 1, 9)} out={out} top={720}>Exercice 1 de l'écrit : tâche, fréquence, outil, justification, budget</Pill>
  </>
);

const Columns: SceneRender = (s, out) => {
  const cols = [
    { at: cue(s, "cible", 1, 5), label: "Tâche cible" },
    { at: cue(s, "fréquence", 1, 7), label: "Fréquence" },
    { at: cue(s, "choisi", 1, 12), label: "Outil choisi" },
    { at: cue(s, "justification", 1, 15), label: "Justification" },
    { at: cue(s, "budget", 1, 17), label: "Budget éventuel" },
    { at: cue(s, "délai", 1, 26), label: "Délai de mise en œuvre" },
  ];
  return (
    <>
      <SceneTitle eyebrow="La structure du plan" before="Six colonnes," accent="toujours dans le même ordre" out={out} />
      <div style={{ ...baseText, position: "absolute", left: 120, right: 120, top: 380, display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 14 }}>
        {cols.map((c, i) => (
          <Reveal key={c.label} at={c.at} out={out}>
            <div style={{ height: 300, borderRadius: 22, padding: "24px 20px", background: "rgba(255,255,255,0.05)", border: `1px solid ${C.hairline2}` }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: [C.violet, C.bleu, C.bleuVert, C.violetLight, C.beige, C.bleu][i] }}>{i + 1}</div>
              <div style={{ marginTop: 8, fontSize: 30, fontWeight: 700, lineHeight: 1.1 }}>{c.label}</div>
            </div>
          </Reveal>
        ))}
      </div>
      <Pill at={cue(s, "ligne", 1, 30)} out={out} top={760}>Une ligne incomplète n'est pas encore prête</Pill>
    </>
  );
};

const Pilot: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="Piloter le plan" before="Deux repères" accent="en plus" out={out} />
    <CueCards out={out} top={340} height={200} cards={[
      { at: cue(s, "valide", 1, 4), title: "Valideur", icon: <IconUser size={34} />, tint: C.violet },
      { at: cue(s, "critère", 1, 6), title: "Critère de réussite", icon: <IconTarget size={34} />, tint: C.bleuVert },
    ]} />
    <Reveal at={cue(s, "exemple", 1, 10)} out={out} style={{ position: "absolute", left: 120, right: 120, top: 600 }}>
      <Glass glow={C.bleuVert} style={{ ...baseText, padding: "28px 38px", borderRadius: 26, display: "flex", alignItems: "center", gap: 40, fontSize: 34, fontWeight: 600 }}>
        <span style={{ fontSize: 22, letterSpacing: "0.14em", textTransform: "uppercase", color: C.fg3 }}>Exemple du cours</span>
        <span style={{ display: "flex", alignItems: "center", gap: 10 }}><IconClock size={32} />Aujourd'hui 45 min</span>
        <span style={{ display: "flex", alignItems: "center", gap: 10, color: C.bleuVert }}><IconTarget size={32} color={C.bleuVert} />Cible 25 min</span>
        <span style={{ display: "flex", alignItems: "center", gap: 10 }}><IconCheck size={32} />Zéro erreur sur 3 essais</span>
      </Glass>
    </Reveal>
    <Reveal at={cue(s, "l'indicateur", 1, 22)} out={out} style={{ position: "absolute", left: 0, right: 0, top: 800, display: "flex", justifyContent: "center" }}>
      <div style={{ ...baseText, fontSize: 30, color: C.fg2 }}>Poursuivre · corriger · arrêter</div>
    </Reveal>
  </>
);

const Justify: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="La colonne justification" before="Une justification" accent="qui tient" out={out} />
    <Reveal at={cue(s, "pratique", 1, 6)} out={out} style={{ position: "absolute", left: 120, top: 340, width: 620 }}>
      <Glass glow={C.beige} style={{ ...baseText, padding: "30px 34px", borderRadius: 26, height: 400, borderColor: `${C.beige}77` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 24, color: C.beige, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}><IconX size={28} color={C.beige} />Ne tient pas</div>
        <div style={{ marginTop: 20, fontSize: 38, fontWeight: 700, lineHeight: 1.2 }}>« Cet outil est pratique et fera gagner du temps. »</div>
      </Glass>
    </Reveal>
    <CueSteps out={out} left={820} top={360} width={980} size={36} steps={[
      { at: cue(s, "estimé", 1, 18), text: "Gain estimé · 20 à 30 min par occurrence" },
      { at: cue(s, "risque", 2, 24), text: "Risque · faible, aucune donnée confidentielle" },
      { at: cue(s, "raison", 1, 30), text: "Pourquoi cet outil · déjà utilisé tous les jours" },
    ]} />
  </>
);

const Prioritize: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="Prioriser" before="Une à trois tâches" accent="pour commencer" out={out} />
    <CueCards out={out} cols={4} top={340} height={230} cards={[
      { at: cue(s, "l'impact", 1, 8), title: "Impact attendu", icon: <IconTrendUp size={32} />, tint: C.violet },
      { at: cue(s, "l'effort", 1, 9), title: "Effort de mise en place", icon: <IconCalendar size={32} />, tint: C.bleu },
      { at: cue(s, "niveau", 1, 11), title: "Niveau de risque", icon: <IconAlert size={32} />, tint: C.beige },
      { at: cue(s, "facilité", 1, 12), title: "Facilité de contrôle", icon: <IconCheck size={32} />, tint: C.bleuVert },
    ]} />
    <Reveal at={cue(s, "prioritaire", 1, 15)} out={out} style={{ position: "absolute", left: 120, right: 120, top: 640 }}>
      <div style={{ ...baseText, fontSize: 32, fontWeight: 600, display: "flex", alignItems: "center", gap: 14 }}><IconShield size={34} color={C.bleuVert} />Autorisée, testable sur un périmètre limité, avec un critère d'arrêt</div>
    </Reveal>
    <Reveal at={cue(s, "élevé", 1, 24)} out={out} style={{ position: "absolute", left: 120, right: 120, top: 740 }}>
      <div style={{ ...baseText, fontSize: 32, fontWeight: 600, display: "flex", alignItems: "center", gap: 14, color: C.fg2 }}><IconAlert size={34} color={C.beige} />Fort impact, risque élevé : sur la liste, après les tâches plus sûres</div>
    </Reveal>
  </>
);

const Obstacles: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="Avant de démarrer" before="Trois obstacles" accent="à anticiper" out={out} />
    <CueCards out={out} top={360} height={320} cards={[
      { at: cue(s, "d'apprentissage", 1, 3), title: "Temps d'apprentissage", text: "Quelques essais, prévus dans le délai.", icon: <IconClock size={36} />, tint: C.violet },
      { at: cue(s, "validation", 1, 9), title: "Validation nécessaire", text: "Préparée avant, pas après.", icon: <IconShield size={36} />, tint: C.bleu },
      { at: cue(s, "budget", 1, 16), title: "Budget éventuel", text: "Confirmé avant de démarrer.", icon: <IconAlert size={36} />, tint: C.beige },
    ]} />
  </>
);

const Indicators: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="Mesurer la réussite" before="Trois indicateurs" accent="suffisent" out={out} />
    <CueCards out={out} top={340} height={230} cards={[
      { at: cue(s, "gagné", 1, 6), title: "Temps gagné", icon: <IconClock size={34} />, tint: C.violet },
      { at: cue(s, "qualité", 1, 10), title: "Qualité, une fois relue", icon: <IconCheck size={34} />, tint: C.bleu },
      { at: cue(s, "satisfaction", 1, 13), title: "Satisfaction", icon: <IconUser size={34} />, tint: C.bleuVert },
    ]} />
    <Reveal at={cue(s, "multipliez-le", 1, 20)} out={out} style={{ position: "absolute", left: 0, right: 0, top: 650, display: "flex", justifyContent: "center" }}>
      <Glass glow={C.violet} style={{ ...baseText, padding: "26px 40px", borderRadius: 26, fontSize: 38, fontWeight: 700 }}>Temps gagné × taux horaire de référence</Glass>
    </Reveal>
    <Reveal at={cue(s, "estimation", 1, 24)} out={out} style={{ position: "absolute", left: 0, right: 0, top: 810, display: "flex", justifyContent: "center" }}>
      <div style={{ ...baseText, fontSize: 30, color: C.fg2 }}>Une estimation pour comparer bénéfice et coût, pas une facturation</div>
    </Reveal>
  </>
);

const Living: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="Un plan vivant" before="Relire," accent="ajuster, partager" out={out} />
    <CueSteps out={out} left={120} top={360} width={1680} size={38} steps={[
      { at: cue(s, "retirée", 1, 6), text: "Une tâche sans le bénéfice attendu : revue ou retirée" },
      { at: cue(s, "revenir", 1, 12), text: "Une tâche écartée pour son risque : peut revenir" },
      { at: cue(s, "documenté", 1, 16), text: "Un gain documenté : prompt, vérification, temps gagné" },
    ]} />
    <Pill at={cue(s, "bibliothèque", 1, 24)} out={out} top={780}>Le début d'une bibliothèque de prompts</Pill>
  </>
);

const YourTurn: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="À vous" before="Passez à" accent="la pratique" out={out} top={130} />
    <CueSteps out={out} top={330} steps={[
      { at: cue(s, "playground", 1, 2), text: "Playground : votre plan d'actions" },
      { at: cue(s, "hub", 1, 8), text: "Hub IA : gratuit, freemium ou payant" },
      { at: cue(s, "rendez-vous", 1, 20), text: "Après la mission : Rendez-vous formateur" },
    ]} />
    <Reveal at={cue(s, "tarif", 1, 15)} out={out} style={{ position: "absolute", left: 790, top: 760 }}>
      <div style={{ ...baseText, display: "flex", alignItems: "center", gap: 14, fontSize: 28, color: C.fg2 }}><IconAlert size={30} />Tarif : toujours la page officielle</div>
    </Reveal>
  </>
);

const Recap: SceneRender = (s, out) => (
  <div style={{ position: "absolute", left: 1120, top: 220, width: 700 }}>
    <Reveal at={cue(s, "retenez", 1, 0.5) + 0.6} out={out}>
      <div style={{ ...baseText, fontSize: 24, letterSpacing: "0.14em", textTransform: "uppercase", color: C.fg3, fontWeight: 600, marginBottom: 26 }}>À retenir</div>
    </Reveal>
    <CueSteps out={out} left={0} top={70} width={700} size={34} steps={[
      { at: cue(s, "colonnes", 1, 3), text: "Six colonnes, plus valideur et critère" },
      { at: cue(s, "justification", 1, 7), text: "Justifier : gain, risque, outil" },
      { at: cue(s, "commencer", 1, 11), text: "Une à trois tâches pour commencer" },
    ]} />
    <Reveal at={cue(s, "mission", 1, 16)} out={out} style={{ position: "absolute", top: 520, left: 0 }}>
      <div style={{ ...baseText, padding: "20px 34px", borderRadius: 999, backgroundImage: GRAD.iris, color: C.ink, fontSize: 30, fontWeight: 700 }}>Mission IA : stratégie et confidentialité</div>
    </Reveal>
  </div>
);

const Banner: SceneRender = () => <NameBanner />;

export const Lesson16Commune: React.FC = () => (
  <LessonVideo
    manifest={manifest}
    chapters={[
      { label: "Le plan", sceneIds: ["1", "2", "3", "4"] },
      { label: "Justifier, prioriser", sceneIds: ["5", "6", "7"] },
      { label: "Mesurer", sceneIds: ["8", "9"] },
      { label: "À vous", sceneIds: ["10", "11"] },
    ]}
    shrinkAt={{ "11": cue(manifest.scenes.find((x) => x.id === "11")!, "retenez", 1, 0.5) + 0.2 }}
    render={{
      "1:over": Banner,
      "2": Objective,
      "3": Columns,
      "4": Pilot,
      "5": Justify,
      "6": Prioritize,
      "7": Obstacles,
      "8": Indicators,
      "9": Living,
      "10": YourTurn,
      "11:over": Recap,
    }}
  />
);
