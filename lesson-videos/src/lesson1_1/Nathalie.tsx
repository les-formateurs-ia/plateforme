import React from "react";
import manifestJson from "../generated/lesson1_1-nathalie.json";
import { Glass, Reveal, baseText } from "../components/ui";
import { IconAlert, IconCheck, IconFeather, IconFileText, IconLock, IconMail } from "../components/icons";
import { C, GRAD } from "../theme";
import { CueCards, CueSteps, NameBanner, SceneTitle, ToolLogo } from "../rs6776/kit";
import { LessonVideo, type SceneRender } from "../rs6776/LessonVideo";
import { cue, type Manifest } from "../rs6776/timeline";
import { TOOLS } from "../rs6776/tools";

// Leçon 1.1 — vidéo personnalisée de Nathalie (consultante SIRH).
// Script : docs/formation-rs6776/lecon-1.1/script-video-nathalie.md

export const manifest = manifestJson as unknown as Manifest;

const logo = (id: string) => TOOLS.find((t) => t.id === id)!;

const Offer: SceneRender = (s, out) => {
  const marks = [
    { at: cue(s, "rémunération", 1, 3), label: "Rémunération : 45 000 € + prime annuelle", note: "non fournie" },
    { at: cue(s, "fonctionnalité", 1, 8), label: "Le logiciel trie automatiquement les CV", note: "à vérifier" },
    { at: cue(s, "critère", 1, 14), label: "Profil jeune et dynamique", note: "discriminant" },
  ];
  return (
    <>
      <SceneTitle eyebrow="Ce que vous vérifiez" before="Tout ce qu'il" accent="ajoute de lui-même" out={out} />
      <Reveal at={0.4} out={out} style={{ position: "absolute", left: 120, top: 380, width: 1680 }}>
        <Glass glow={C.beige} style={{ ...baseText, padding: "40px 48px", borderRadius: 28 }}>
          <div style={{ fontSize: 24, letterSpacing: "0.14em", textTransform: "uppercase", color: C.fg3, fontWeight: 600 }}>Offre d'emploi générée · exemple fictif</div>
          <div style={{ marginTop: 10, fontSize: 42, fontWeight: 700 }}>Chargé de recrutement (H/F) · CDI · Lyon</div>
          <div style={{ marginTop: 22, display: "flex", flexDirection: "column", gap: 16 }}>
            {marks.map((m) => (
              <Reveal key={m.label} at={m.at} out={out}>
                <div style={{ display: "flex", alignItems: "center", gap: 20, fontSize: 32 }}>
                  <span style={{ padding: "6px 16px", borderRadius: 12, background: `${C.beige}33`, borderBottom: `3px solid ${C.beige}` }}>{m.label}</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 24, color: C.beige, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}><IconAlert size={26} color={C.beige} />{m.note}</span>
                </div>
              </Reveal>
            ))}
          </div>
        </Glass>
      </Reveal>
    </>
  );
};

const ByClient: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="Le bon outil" before="Selon" accent="l'environnement du client" out={out} />
    <div style={{ ...baseText, position: "absolute", left: 120, right: 120, top: 380, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28 }}>
      {[
        { at: cue(s, "workspace", 1, 4), env: "Client sous Google Workspace", tool: logo("gemini") },
        { at: cue(s, "365", 1, 9), env: "Client sous Microsoft 365", tool: logo("copilot") },
      ].map((c) => (
        <Reveal key={c.env} at={c.at} out={out}>
          <Glass glow={c.tool.accent} style={{ padding: "34px 40px", borderRadius: 28, display: "flex", alignItems: "center", gap: 30 }}>
            <ToolLogo src={c.tool.logo} size={110} glow={c.tool.accent} />
            <div>
              <div style={{ fontSize: 26, color: C.fg3, fontWeight: 600 }}>{c.env}</div>
              <div style={{ fontSize: 48, fontWeight: 800, letterSpacing: "-0.03em" }}>{c.tool.name}</div>
            </div>
          </Glass>
        </Reveal>
      ))}
    </div>
    <div style={{ ...baseText, position: "absolute", left: 120, right: 120, top: 640, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28 }}>
      {[
        { at: cue(s, "sinon", 1, 13), label: "Sinon : ChatGPT, s'il est autorisé", tool: logo("chatgpt") },
        { at: cue(s, "analyser", 1, 17), label: "Long document à analyser : Claude", tool: logo("claude") },
      ].map((c) => (
        <Reveal key={c.label} at={c.at} out={out}>
          <div style={{ display: "flex", alignItems: "center", gap: 22, padding: "20px 28px", borderRadius: 22, border: `1px solid ${c.tool.accent}66`, background: `${c.tool.accent}14` }}>
            <ToolLogo src={c.tool.logo} size={70} glow={c.tool.accent} />
            <span style={{ fontSize: 32, fontWeight: 600 }}>{c.label}</span>
          </div>
        </Reveal>
      ))}
    </div>
  </>
);

export const Lesson11Nathalie: React.FC = () => (
  <LessonVideo
    manifest={manifest}
    chapters={[
      { label: "Votre quotidien", sceneIds: ["1", "2", "3", "4"] },
      { label: "Le bon outil", sceneIds: ["5"] },
      { label: "À vous", sceneIds: ["6"] },
    ]}
    render={{
      "1:over": () => <NameBanner />,
      "2": (s, out) => (
        <>
          <SceneTitle eyebrow="Ce qu'il fait bien" before="Transformer" accent="la matière que vous fournissez" out={out} />
          <CueCards out={out} cards={[
            { at: cue(s, "mail", 1, 5), title: "Reformuler un mail client", icon: <IconMail size={38} />, tint: C.bleuVert },
            { at: cue(s, "offre", 1, 8), title: "Structurer une offre à partir de la fiche de poste", icon: <IconFileText size={38} />, tint: C.bleu },
            { at: cue(s, "support", 1, 12), title: "Adapter un support de formation", icon: <IconFeather size={38} />, tint: C.violet },
          ]} />
        </>
      ),
      "3": Offer,
      "4": (s, out) => (
        <>
          <SceneTitle eyebrow="Hors de son rôle" before="Pour l'instant," accent="pas de données personnelles" out={out} />
          <CueCards out={out} height={300} cards={[
            { at: cue(s, "candidats", 1, 4), title: "Données de candidats ou de salariés", icon: <IconLock size={38} />, tint: C.beige },
            { at: cue(s, "internes", 1, 6), title: "Informations internes des clients", icon: <IconLock size={38} />, tint: C.violet },
            { at: cue(s, "leçons", 1, 10), title: "Méthodes aux leçons 1.4 et 1.5", icon: <IconCheck size={38} />, tint: C.bleuVert },
          ]} />
        </>
      ),
      "5": ByClient,
      "6": (s, out) => (
        <>
          <SceneTitle eyebrow="À vous" before="Trois choses" accent="à faire maintenant" out={out} top={130} />
          <CueSteps out={out} top={330} steps={[
            { at: cue(s, "playground", 1, 1), text: "Playground : les situations d'une consultante SIRH" },
            { at: cue(s, "copilote", 1, 10), text: "Copilote : « Exemple pour mon métier »" },
            { at: cue(s, "notez", 1, 16), text: "Notez trois tâches pour la leçon 1.2" },
          ]} />
          <Reveal at={cue(s, "ensemble", 1, 20)} out={out} style={{ position: "absolute", left: 790, top: 760 }}>
            <div style={{ ...baseText, padding: "18px 32px", borderRadius: 999, backgroundImage: GRAD.iris, color: C.ink, fontSize: 28, fontWeight: 700 }}>On en fera l'analyse ensemble</div>
          </Reveal>
        </>
      ),
    }}
  />
);
