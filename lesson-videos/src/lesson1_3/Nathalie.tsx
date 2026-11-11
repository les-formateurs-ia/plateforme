import React from "react";
import manifestJson from "../generated/lesson1_3-nathalie.json";
import { Glass, Reveal, baseText } from "../components/ui";
import { IconAlert, IconBriefcase, IconCheck, IconClock, IconKey, IconLock, IconSearch } from "../components/icons";
import { C, GRAD } from "../theme";
import { CueCards, CueSteps, NameBanner, SceneTitle, ToolLogo } from "../rs6776/kit";
import { LessonVideo, type SceneRender } from "../rs6776/LessonVideo";
import { cue, type Manifest } from "../rs6776/timeline";
import { TOOLS } from "../rs6776/tools";

// Leçon 1.3 — vidéo personnalisée de Nathalie (consultante SIRH).
// Script : docs/formation-rs6776/lecon-1.3/script-video-nathalie.md

export const manifest = manifestJson as unknown as Manifest;

const copilot = TOOLS.find((t) => t.id === "copilot")!;

const AccessMap: SceneRender = (s, out) => {
  const spaces = [
    { title: "Votre activité", tint: C.violet, at: cue(s, "activité", 1, 5) },
    { title: "Client A", tint: C.bleu, at: cue(s, "séparé", 1, 7) },
    { title: "Client B", tint: C.bleuVert, at: cue(s, "séparé", 1, 7) + 0.4 },
  ];
  const lines = [
    { label: "Outil autorisé", at: cue(s, "l'outil", 1, 10) },
    { label: "Offre", at: cue(s, "l'offre", 1, 11) },
    { label: "Propriétaire du compte", at: cue(s, "propriétaire", 1, 12) },
    { label: "Données admises", at: cue(s, "données", 1, 13) },
  ];
  return (
    <>
      <SceneTitle eyebrow="Votre carte d'accès" before="Un espace" accent="par client" out={out} />
      <div style={{ ...baseText, position: "absolute", left: 120, right: 120, top: 350, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 28 }}>
        {spaces.map((sp) => (
          <Reveal key={sp.title} at={sp.at} out={out}>
            <Glass glow={sp.tint} style={{ padding: "30px 32px", borderRadius: 28, height: 420, borderColor: `${sp.tint}66` }}>
              <div style={{ fontSize: 38, fontWeight: 800, letterSpacing: "-0.02em", color: sp.tint }}>{sp.title}</div>
              <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 14 }}>
                {lines.map((l) => (
                  <Reveal key={l.label} at={l.at} out={out}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 28, color: C.fg2 }}><IconCheck size={26} color={sp.tint} />{l.label}</div>
                  </Reveal>
                ))}
              </div>
            </Glass>
          </Reveal>
        ))}
      </div>
      <Reveal at={cue(s, "inconnue", 1, 16)} out={out} style={{ position: "absolute", left: 0, right: 0, top: 820, display: "flex", justifyContent: "center" }}>
        <div style={{ ...baseText, padding: "18px 34px", borderRadius: 999, backgroundImage: GRAD.iris, color: C.ink, fontSize: 30, fontWeight: 700 }}>Une case inconnue = une question à poser au client</div>
      </Reveal>
    </>
  );
};

const ClientAccess: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="Le client vous ouvre son accès" before="Son outil," accent="pour sa mission" out={out} />
    <Reveal at={cue(s, "365", 1, 3)} out={out} style={{ position: "absolute", left: 120, right: 120, top: 360 }}>
      <Glass glow={copilot.accent} style={{ ...baseText, padding: "32px 40px", borderRadius: 28, display: "flex", alignItems: "center", gap: 30 }}>
        <ToolLogo src={copilot.logo} size={110} glow={copilot.accent} />
        <div>
          <div style={{ fontSize: 26, color: C.fg3, fontWeight: 600 }}>Client sous Microsoft 365</div>
          <div style={{ fontSize: 46, fontWeight: 800, letterSpacing: "-0.03em" }}>Copilot inclus</div>
        </div>
      </Glass>
    </Reveal>
    <CueCards out={out} top={590} height={230} cards={[
      { at: cue(s, "utilisez", 1, 6), title: "Cet accès, pour cette mission seulement", icon: <IconCheck size={34} />, tint: C.bleuVert },
      { at: cue(s, "bloque", 1, 11), title: "Un outil bloqué ne se contourne pas", icon: <IconLock size={34} />, tint: C.beige },
      { at: cue(s, "vérifier", 1, 16), title: "Accès coupé : vérifier auprès du client", icon: <IconAlert size={34} />, tint: C.bleu },
    ]} />
  </>
);

const OwnAccounts: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="Vos propres comptes" before="Protéger" accent="la chaîne d'accès" out={out} />
    <CueCards out={out} cols={2} top={350} height={210} cards={[
      { at: cue(s, "permissions", 1, 8), title: "Connexion Google ou Microsoft", text: "Lire les permissions, savoir révoquer.", icon: <IconKey size={32} />, tint: C.bleu },
      { at: cue(s, "gestionnaire", 1, 16), title: "Un mot de passe par compte", text: "Dans un gestionnaire, jamais celui d'un client.", icon: <IconLock size={32} />, tint: C.violet },
      { at: cue(s, "profil", 1, 24), title: "Le profil actif", text: "Vérifié avant chaque session client.", icon: <IconSearch size={32} />, tint: C.bleuVert },
      { at: cue(s, "retrait", 1, 30), title: "Fin de mission", text: "Demander le retrait de vos droits.", icon: <IconClock size={32} />, tint: C.beige },
    ]} />
  </>
);

const YourTurn: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="À vous" before="Votre" accent="tableau de bord des comptes" out={out} top={130} />
    <CueSteps out={out} top={330} steps={[
      { at: cue(s, "situations", 1, 2), text: "Quel compte, pour quelle situation ?" },
      { at: cue(s, "réflexes", 1, 5), text: "Est-ce déjà le bon réflexe ?" },
      { at: cue(s, "tableau", 1, 8), text: "Mon tableau de bord des comptes" },
      { at: cue(s, "téléchargez", 1, 16), text: "Télécharger mon suivi" },
    ]} />
    <Reveal at={cue(s, "retenu", 1, 13)} out={out} style={{ position: "absolute", left: 700, top: 820 }}>
      <div style={{ ...baseText, display: "flex", alignItems: "center", gap: 14, fontSize: 28, color: C.fg2 }}><IconBriefcase size={30} />« Non retenu » est une décision valable</div>
    </Reveal>
  </>
);

const Banner: SceneRender = () => <NameBanner />;

export const Lesson13Nathalie: React.FC = () => (
  <LessonVideo
    manifest={manifest}
    chapters={[
      { label: "Vos accès", sceneIds: ["1", "2", "3", "4"] },
      { label: "À vous", sceneIds: ["5"] },
    ]}
    render={{
      "1:over": Banner,
      "2": AccessMap,
      "3": ClientAccess,
      "4": OwnAccounts,
      "5": YourTurn,
    }}
  />
);
