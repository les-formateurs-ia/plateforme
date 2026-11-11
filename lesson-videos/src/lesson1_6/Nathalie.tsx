import React from "react";
import manifestJson from "../generated/lesson1_6-nathalie.json";
import { Glass, Reveal, baseText } from "../components/ui";
import { IconAlert, IconCheck, IconFileText, IconMail } from "../components/icons";
import { C } from "../theme";
import { CueSteps, NameBanner, SceneTitle } from "../rs6776/kit";
import { LessonVideo, type SceneRender } from "../rs6776/LessonVideo";
import { cue, type Manifest } from "../rs6776/timeline";

// Leçon 1.6 — vidéo personnalisée de Nathalie (consultante SIRH).
// Script : docs/formation-rs6776/lecon-1.6/script-video-nathalie.md
// Lignes du plan : hypothèses pré-remplies de son Playground.

export const manifest = manifestJson as unknown as Manifest;

type Cell = { at: number; label: string; value: string; warn?: boolean };

// Une ligne du plan : la tâche en tête, puis les colonnes qui se remplissent au fil de la voix.
const PlanLine: React.FC<{ out: number; title: string; meta: string; icon: React.ReactNode; tint: string; cells: Cell[] }> = ({ out, title, meta, icon, tint, cells }) => (
  <>
    <Reveal at={0.4} out={out} style={{ position: "absolute", left: 120, right: 120, top: 320 }}>
      <Glass glow={tint} style={{ ...baseText, padding: "26px 36px", borderRadius: 26, display: "flex", alignItems: "center", gap: 24 }}>
        <div style={{ width: 76, height: 76, borderRadius: 20, display: "grid", placeItems: "center", background: `${tint}26`, border: `1px solid ${tint}66` }}>{icon}</div>
        <div style={{ fontSize: 46, fontWeight: 800, letterSpacing: "-0.03em" }}>{title}</div>
        <div style={{ marginLeft: "auto", fontSize: 30, color: C.fg2 }}>{meta}</div>
      </Glass>
    </Reveal>
    <div style={{ ...baseText, position: "absolute", left: 120, right: 120, top: 500, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
      {cells.map((c) => (
        <Reveal key={c.label} at={c.at} out={out}>
          <div style={{ padding: "20px 26px", borderRadius: 20, background: c.warn ? `${C.beige}14` : "rgba(255,255,255,0.05)", border: `1px solid ${c.warn ? `${C.beige}88` : C.hairline2}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 22, letterSpacing: "0.12em", textTransform: "uppercase", color: c.warn ? C.beige : C.fg3, fontWeight: 700 }}>{c.warn && <IconAlert size={24} color={C.beige} />}{c.label}</div>
            <div style={{ marginTop: 6, fontSize: 32, fontWeight: 600 }}>{c.value}</div>
          </div>
        </Reveal>
      ))}
    </div>
  </>
);

const Reports: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="Première ligne" before="Vos" accent="comptes rendus" out={out} top={120} />
    <PlanLine out={out} title="Comptes rendus de réunion" meta="6 h / semaine · hebdomadaire" icon={<IconFileText size={40} />} tint={C.bleuVert} cells={[
      { at: cue(s, "l'outil", 1, 8), label: "Outil", value: "Celui que vous utilisez, à confirmer" },
      { at: cue(s, "l'hypothèse", 1, 14), label: "Justification", value: "Hypothèse : 20 min par occurrence, 3 essais fictifs" },
      { at: cue(s, "budget", 1, 20), label: "Budget", value: "À confirmer : offre, période, utilisateurs" },
      { at: cue(s, "valideuse", 1, 25), label: "Valideuse et critère", value: "Vous · zéro erreur de décision, date, montant" },
    ]} />
  </>
);

const Mails: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="Deuxième ligne" before="Vos" accent="mails clients" out={out} top={120} />
    <PlanLine out={out} title="Mails clients" meta="4 h / semaine · hebdomadaire" icon={<IconMail size={40} />} tint={C.bleu} cells={[
      { at: cue(s, "structure", 1, 6), label: "Pourquoi", value: "Une structure qui se prête à l'outil" },
      { at: cue(s, "vigilance", 1, 10), label: "Vigilance", value: "Sens, engagements, destinataires, informations du client", warn: true },
      { at: cue(s, "critère", 1, 17), label: "Critère", value: "Temps réduit, aucun engagement ni donnée ajoutés" },
    ]} />
  </>
);

const Offers: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="Troisième ligne" before="Vos" accent="offres d'emploi" out={out} top={120} />
    <PlanLine out={out} title="Offres d'emploi" meta="À chaque nouveau poste" icon={<IconFileText size={40} />} tint={C.violet} cells={[
      { at: cue(s, "brief", 1, 6), label: "Matière", value: "Le brief du client, une structure connue" },
      { at: cue(s, "confirme", 1, 11), label: "Outil", value: "À confirmer avec le client" },
      { at: cue(s, "valideur", 1, 14), label: "Valideur", value: "Vous, puis le client si nécessaire" },
      { at: cue(s, "inventé", 1, 19), label: "Critère", value: "Aucun critère inventé ou discriminatoire, chiffres exacts" },
    ]} />
  </>
);

const Reflexes: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="Votre activité multi-clients" before="Quatre" accent="réflexes" out={out} />
    <CueSteps out={out} left={120} top={360} width={1680} size={40} steps={[
      { at: cue(s, "six", 1, 3), text: "Deux ou trois tâches pour commencer, pas six" },
      { at: cue(s, "l'accord", 1, 8), text: "L'accord du client avant de changer" },
      { at: cue(s, "abonnement", 1, 14), text: "Le coût d'un abonnement, vérifié avant" },
      { at: cue(s, "reprenez", 1, 19), text: "Un plan par client, jamais celui d'un autre" },
    ]} />
  </>
);

const YourTurn: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="À vous" before="Votre" accent="plan d'actions IA" out={out} top={130} />
    <CueSteps out={out} top={330} steps={[
      { at: cue(s, "classez", 1, 2), text: "Mails, articles, formation : à classer" },
      { at: cue(s, "ajustez", 1, 9), text: "Ajuster les trois lignes du plan" },
      { at: cue(s, "téléchargez", 1, 15), text: "Télécharger mon plan" },
      { at: cue(s, "mission", 1, 19), text: "Mission de fin de module" },
    ]} />
    <Reveal at={cue(s, "prix", 1, 12)} out={out} style={{ position: "absolute", left: 700, top: 820 }}>
      <div style={{ ...baseText, display: "flex", alignItems: "center", gap: 14, fontSize: 28, color: C.fg2 }}><IconCheck size={30} />Un prix non vérifié reste « à confirmer »</div>
    </Reveal>
  </>
);

const Banner: SceneRender = () => <NameBanner />;

export const Lesson16Nathalie: React.FC = () => (
  <LessonVideo
    manifest={manifest}
    chapters={[
      { label: "Votre plan", sceneIds: ["1", "2", "3", "4"] },
      { label: "Vos réflexes", sceneIds: ["5"] },
      { label: "À vous", sceneIds: ["6"] },
    ]}
    render={{
      "1:over": Banner,
      "2": Reports,
      "3": Mails,
      "4": Offers,
      "5": Reflexes,
      "6": YourTurn,
    }}
  />
);
