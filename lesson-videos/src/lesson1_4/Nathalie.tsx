import React from "react";
import manifestJson from "../generated/lesson1_4-nathalie.json";
import { Glass, Reveal, baseText } from "../components/ui";
import { IconBan, IconBriefcase, IconCheck, IconEye, IconLock, IconUser } from "../components/icons";
import { C, GRAD } from "../theme";
import { CueCards, CueSteps, NameBanner, SceneTitle } from "../rs6776/kit";
import { LessonVideo, type SceneRender } from "../rs6776/LessonVideo";
import { cue, type Manifest } from "../rs6776/timeline";

// Leçon 1.4 — vidéo personnalisée de Nathalie (consultante SIRH, indépendante, plusieurs clients).
// Script : docs/formation-rs6776/lecon-1.4/script-video-nathalie.md

export const manifest = manifestJson as unknown as Manifest;

const Side: React.FC<{ at: number; out: number; title: string; text: string; tint: string; icon: React.ReactNode }> = ({ at, out, title, text, tint, icon }) => (
  <Reveal at={at} out={out}>
    <Glass glow={tint} style={{ ...baseText, padding: "32px 38px", borderRadius: 28, height: 300, borderColor: `${tint}66` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, color: tint }}>{icon}<span style={{ fontSize: 42, fontWeight: 800, color: C.fg }}>{title}</span></div>
      <div style={{ marginTop: 16, fontSize: 30, color: C.fg2, lineHeight: 1.3 }}>{text}</div>
    </Glass>
  </Reveal>
);

const YourSide: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="Votre point de vue" before="Votre activité," accent="et chaque client" out={out} />
    <div style={{ position: "absolute", left: 120, right: 120, top: 350, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
      <Side at={cue(s, "interne", 1, 2)} out={out} title="Interne, pour vous" text="Votre propre activité : vos tarifs, votre méthode, votre liste de clients." tint={C.violet} icon={<IconBriefcase size={40} />} />
      <Side at={cue(s, "externe", 1, 9)} out={out} title="Externe, pour vous" text="Tout le reste, même ce qu'un client considère comme interne chez lui." tint={C.bleu} icon={<IconUser size={40} />} />
    </div>
    <Reveal at={cue(s, "l'organigramme", 1, 14)} out={out} style={{ position: "absolute", left: 0, right: 0, top: 740, display: "flex", justifyContent: "center" }}>
      <div style={{ ...baseText, padding: "18px 34px", borderRadius: 999, background: `${C.bleu}26`, border: `1px solid ${C.bleu}`, fontSize: 30, fontWeight: 700 }}>Organigramme d'un client pour un paramétrage : externe, à protéger</div>
    </Reveal>
  </>
);

const Training: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="Pendant vos formations" before="L'écran de démonstration" accent="compte aussi" out={out} />
    <Reveal at={cue(s, "fiche", 1, 4)} out={out} style={{ position: "absolute", left: 120, top: 340, width: 820 }}>
      <Glass glow={C.beige} style={{ ...baseText, padding: "30px 36px", borderRadius: 26 }}>
        <div style={{ fontSize: 22, letterSpacing: "0.14em", textTransform: "uppercase", color: C.fg3, fontWeight: 600 }}>Fiche salarié · exemple fictif</div>
        {["Nom et prénom", "Date de naissance", "Rémunération"].map((l) => (
          <div key={l} style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 16, fontSize: 30 }}>
            <span style={{ color: C.fg2, width: 300 }}>{l}</span>
            <span style={{ flex: 1, height: 26, borderRadius: 8, background: `${C.beige}55`, filter: "blur(3px)" }} />
          </div>
        ))}
      </Glass>
    </Reveal>
    <CueCards out={out} cols={1} left={1020} right={120} top={340} height={150} cards={[
      { at: cue(s, "client", 1, 9), title: "Pour le client : interne", icon: <IconEye size={30} />, tint: C.violet },
      { at: cue(s, "vous", 2, 12), title: "Pour vous : externe, à protéger", icon: <IconLock size={30} />, tint: C.beige },
    ]} />
    <Reveal at={cue(s, "test", 1, 20)} out={out} style={{ position: "absolute", left: 0, right: 0, top: 760, display: "flex", justifyContent: "center" }}>
      <div style={{ ...baseText, padding: "20px 38px", borderRadius: 999, backgroundImage: GRAD.iris, color: C.ink, fontSize: 32, fontWeight: 700, display: "flex", alignItems: "center", gap: 12 }}><IconCheck size={32} color={C.ink} />Environnement de test, profils fictifs</div>
    </Reveal>
  </>
);

const OwnInfo: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="Dans l'autre sens" before="Vos informations" accent="à protéger aussi" out={out} />
    <CueCards out={out} top={360} height={250} cards={[
      { at: cue(s, "tarifs", 1, 3), title: "Vos tarifs", text: "Un tarif journalier pas encore communiqué à un prospect.", icon: <IconLock size={34} />, tint: C.violet },
      { at: cue(s, "méthode", 1, 4), title: "Votre méthode", icon: <IconBriefcase size={34} />, tint: C.bleu },
      { at: cue(s, "liste", 1, 5), title: "Votre liste de clients", icon: <IconUser size={34} />, tint: C.bleuVert },
    ]} />
    <Reveal at={cue(s, "commerciales", 1, 10)} out={out} style={{ position: "absolute", left: 0, right: 0, top: 700, display: "flex", justifyContent: "center" }}>
      <div style={{ ...baseText, fontSize: 32, fontWeight: 600, color: C.fg2 }}>Pas sensibles au sens du RGPD · informations commerciales à protéger</div>
    </Reveal>
  </>
);

const Partition: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="Le réflexe" before="Un client," accent="un échange" out={out} />
    <div style={{ position: "absolute", left: 220, right: 220, top: 360, display: "grid", gridTemplateColumns: "1fr 40px 1fr", gap: 40, alignItems: "stretch" }}>
      <Reveal at={cue(s, "client", 1, 6)} out={out}><Glass glow={C.bleu} style={{ ...baseText, height: 280, borderRadius: 28, display: "grid", placeItems: "center", fontSize: 50, fontWeight: 800 }}>Client A</Glass></Reveal>
      <Reveal at={cue(s, "jamais", 1, 3)} out={out}><div style={{ height: 280, width: 8, margin: "0 auto", borderRadius: 8, backgroundImage: GRAD.iris }} /></Reveal>
      <Reveal at={cue(s, "autre", 1, 9)} out={out}><Glass glow={C.bleuVert} style={{ ...baseText, height: 280, borderRadius: 28, display: "grid", placeItems: "center", fontSize: 50, fontWeight: 800 }}>Client B</Glass></Reveal>
    </div>
    <Reveal at={cue(s, "même", 2, 18)} out={out} style={{ position: "absolute", left: 0, right: 0, top: 720, display: "flex", justifyContent: "center" }}>
      <div style={{ ...baseText, display: "flex", alignItems: "center", gap: 14, fontSize: 32, fontWeight: 700, color: C.beige }}><IconBan size={34} color={C.beige} />Une même conversation pour deux clients : pas encore le bon réflexe</div>
    </Reveal>
  </>
);

const YourTurn: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="À vous" before="Classer" accent="de votre point de vue" out={out} top={130} />
    <CueSteps out={out} top={330} steps={[
      { at: cue(s, "playground", 1, 2), text: "Playground : à protéger, et pour qui ?" },
      { at: cue(s, "réflexes", 1, 10), text: "Est-ce déjà le bon réflexe ?" },
      { at: cue(s, "prochaine", 1, 18), text: "Leçon 1.5 : les méthodes pour protéger" },
    ]} />
  </>
);

const Banner: SceneRender = () => <NameBanner />;

export const Lesson14Nathalie: React.FC = () => (
  <LessonVideo
    manifest={manifest}
    chapters={[
      { label: "Votre position", sceneIds: ["1", "2", "3", "4"] },
      { label: "Cloisonner", sceneIds: ["5"] },
      { label: "À vous", sceneIds: ["6"] },
    ]}
    render={{
      "1:over": Banner,
      "2": YourSide,
      "3": Training,
      "4": OwnInfo,
      "5": Partition,
      "6": YourTurn,
    }}
  />
);
