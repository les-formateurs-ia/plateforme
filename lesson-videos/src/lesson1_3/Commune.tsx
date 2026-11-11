import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import manifestJson from "../generated/lesson1_3-commune.json";
import { Glass, Reveal, baseText, useExit } from "../components/ui";
import { IconBan, IconClock, IconCompass, IconFileText, IconKey, IconLock, IconNote, IconSearch, IconShield, IconSparkle, IconTable, IconUser, IconZap } from "../components/icons";
import { C, EASE, GRAD, clamp } from "../theme";
import { CueCards, CueSteps, NameBanner, SceneTitle, ToolLogo } from "../rs6776/kit";
import { LessonVideo, type SceneRender } from "../rs6776/LessonVideo";
import { cue, type Manifest } from "../rs6776/timeline";
import { TOOLS } from "../rs6776/tools";

// Leçon 1.3 « Installer et configurer les outils IA » — vidéo commune.
// Script : docs/formation-rs6776/lecon-1.3/script-video-commune.md
// Aucun prix, aucune date, aucune version de système à l'écran.

export const manifest = manifestJson as unknown as Manifest;

const tool = (id: string) => TOOLS.find((t) => t.id === id)!;

const Pill: React.FC<{ at: number; out: number; top: number; children: React.ReactNode }> = ({ at, out, top, children }) => (
  <Reveal at={at} out={out} style={{ position: "absolute", left: 0, right: 0, top, display: "flex", justifyContent: "center" }}>
    <div style={{ ...baseText, padding: "22px 40px", borderRadius: 999, backgroundImage: GRAD.iris, color: C.ink, fontSize: 32, fontWeight: 700 }}>{children}</div>
  </Reveal>
);

const Objective: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="Objectif de la leçon" before="Des outils" accent="prêts à l'emploi" out={out} />
    <CueCards out={out} top={380} height={280} cards={[
      { at: cue(s, "choisir", 1, 3), title: "Choisir un accès autorisé", icon: <IconShield size={38} />, tint: C.violet },
      { at: cue(s, "configurer", 1, 5), title: "Configurer avant le premier prompt", icon: <IconLock size={38} />, tint: C.bleu },
      { at: cue(s, "orienter", 1, 7), title: "Repérer l'interface", icon: <IconCompass size={38} />, tint: C.bleuVert },
    ]} />
    <Pill at={cue(s, "exercice", 1, 10)} out={out} top={740}>Exercice 1 de l'écrit : un outil accessible et justifié par tâche</Pill>
  </>
);

const NotByPrinciple: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="Premier réflexe" before="Pas un compte" accent="par principe" out={out} />
    <Reveal at={cue(s, "principe", 1, 3)} out={out} style={{ position: "absolute", left: 120, top: 330 }}>
      <div style={{ ...baseText, fontSize: 36, fontWeight: 700, color: C.beige, textDecoration: "line-through", textDecorationThickness: 4 }}>Un compte sur chaque outil</div>
    </Reveal>
    <CueCards out={out} top={420} height={250} cards={[
      { at: cue(s, "politique", 1, 9), title: "La politique de la structure", icon: <IconShield size={34} />, tint: C.violet },
      { at: cue(s, "type", 1, 12), title: "Le type de données", icon: <IconLock size={34} />, tint: C.bleu },
      { at: cue(s, "autorisée", 1, 14), title: "L'offre autorisée", icon: <IconKey size={34} />, tint: C.bleuVert },
      { at: cue(s, "administre", 1, 16), title: "Qui administre l'accès", icon: <IconUser size={34} />, tint: C.beige },
    ]} />
    <Pill at={cue(s, "officielle", 1, 20)} out={out} top={760}>Toujours la page officielle de l'éditeur</Pill>
  </>
);

const Accounts: SceneRender = (s, out) => {
  const rows = [
    { id: "chatgpt", at: cue(s, "chatgpt", 1, 3), text: "Compte OpenAI, ou Google, Microsoft, Apple, ou accès de l'organisation" },
    { id: "claude", at: cue(s, "claude", 1, 12), text: "Déjà accessible dans le Studio de la plateforme" },
    { id: "gemini", at: cue(s, "gemini", 1, 17), text: "Un compte Google, personnel ou professionnel" },
    { id: "copilot", at: cue(s, "copilot", 1, 22), text: "Usage limité sans connexion, puis compte personnel ou professionnel" },
    { id: "firefly", at: cue(s, "firefly", 1, 30), text: "Un identifiant Adobe" },
  ];
  return (
    <>
      <SceneTitle eyebrow="Quel compte pour quel outil" before="Cinq outils," accent="cinq logiques d'accès" out={out} top={110} />
      <div style={{ ...baseText, position: "absolute", left: 120, right: 120, top: 290, display: "flex", flexDirection: "column", gap: 18 }}>
        {rows.map((r) => {
          const t = tool(r.id);
          return (
            <Reveal key={r.id} at={r.at} out={out}>
              <div style={{ display: "flex", alignItems: "center", gap: 28, padding: "14px 26px", borderRadius: 24, border: `1px solid ${t.accent}55`, background: `${t.accent}12` }}>
                <ToolLogo src={t.logo} size={84} glow={t.accent} />
                <div style={{ width: 230, fontSize: 40, fontWeight: 800, letterSpacing: "-0.03em" }}>{t.name}</div>
                <div style={{ fontSize: 30, color: C.fg2, fontWeight: 500 }}>{r.text}</div>
              </div>
            </Reveal>
          );
        })}
      </div>
    </>
  );
};

const OneFrame: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="Un compte, un cadre" before="Deux règles" accent="qui ne se discutent pas" out={out} />
    <CueCards out={out} top={360} height={280} cards={[
      { at: cue(s, "google", 1, 1), title: "Connexion Google, Microsoft ou Apple", text: "Un mot de passe de moins, mais un accès relié au compte choisi.", icon: <IconKey size={36} />, tint: C.bleu },
      { at: cue(s, "jamais", 1, 9), title: "Jamais le compte d'un client pour un autre", icon: <IconBan size={36} />, tint: C.beige },
      { at: cue(s, "contourner", 1, 15), title: "Pas de compte personnel de contournement", icon: <IconBan size={36} />, tint: C.beige },
    ]} />
    <Pill at={cue(s, "logo", 1, 19)} out={out} top={720}>Copilot : le compte actif, l'offre et les sources, pas le logo</Pill>
    <Reveal at={cue(s, "retiré", 1, 26)} out={out} style={{ position: "absolute", left: 0, right: 0, top: 840, display: "flex", justifyContent: "center" }}>
      <div style={{ ...baseText, fontSize: 28, color: C.fg2, display: "flex", alignItems: "center", gap: 12 }}><IconClock size={30} />Un accès professionnel se retire en fin de mission</div>
    </Reveal>
  </>
);

const Setup: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="Avant le premier prompt" before="Quatre réglages" accent="minimum" out={out} />
    <CueSteps out={out} left={120} top={350} width={1100} size={40} steps={[
      { at: cue(s, "double", 1, 5), text: "Double authentification" },
      { at: cue(s, "unique", 1, 9), text: "Mot de passe unique, dans un gestionnaire" },
      { at: cue(s, "contrôles", 1, 13), text: "Contrôles de données et historique" },
      { at: cue(s, "fictives", 1, 17), text: "Premier essai avec des données fictives" },
    ]} />
    <Reveal at={cue(s, "notez", 1, 20)} out={out} style={{ position: "absolute", left: 1280, top: 350, width: 520 }}>
      <Glass glow={C.violet} style={{ ...baseText, padding: "30px 34px", borderRadius: 26 }}>
        <div style={{ fontSize: 22, letterSpacing: "0.14em", textTransform: "uppercase", color: C.fg3, fontWeight: 600 }}>Pour votre plan d'actions</div>
        {["Outil", "Offre", "Propriétaire du compte", "Date de vérification"].map((l) => (
          <div key={l} style={{ marginTop: 16, fontSize: 32, fontWeight: 600, display: "flex", alignItems: "center", gap: 12 }}><IconFileText size={28} color={C.violet} />{l}</div>
        ))}
      </Glass>
    </Reveal>
  </>
);

// Interface générique : chaque repère s'allume au mot qui le nomme.
const Interface: SceneRender = (s, out) => (
  <InterfaceInner out={out} marks={{
    saisie: cue(s, "saisie", 1, 4),
    nouvelle: cue(s, "nouvelle", 1, 7),
    historique: cue(s, "historique", 1, 10),
    joindre: cue(s, "joindre", 1, 12),
    mode: cue(s, "sélecteur", 1, 15),
  }} />
);

const InterfaceInner: React.FC<{ out: number; marks: Record<"saisie" | "nouvelle" | "historique" | "joindre" | "mode", number> }> = ({ out, marks }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const q = useExit(out);
  const on = (k: keyof typeof marks) => interpolate(frame, [marks[k] * fps, (marks[k] + 0.5) * fps], [0, 1], { ...clamp, easing: EASE });
  const ring = (k: keyof typeof marks, tint: string): React.CSSProperties => ({ boxShadow: on(k) > 0 ? `0 0 0 ${3 * on(k)}px ${tint}, 0 0 60px -10px ${tint}` : "none", opacity: 0.35 + 0.65 * on(k) });
  const label = (k: keyof typeof marks, text: string, style: React.CSSProperties) => (
    <div style={{ position: "absolute", fontSize: 28, fontWeight: 700, color: C.fg, opacity: on(k), ...style }}>{text}</div>
  );
  return (
    <>
      <SceneTitle eyebrow="Les repères de l'interface" before="Les mêmes commandes," accent="partout" out={out} />
      <div style={{ ...baseText, position: "absolute", left: 260, top: 330, width: 1400, height: 600, opacity: 1 - q }}>
        <Glass style={{ position: "absolute", inset: 0, borderRadius: 30 }} />
        <div style={{ position: "absolute", left: 30, top: 30, width: 300, bottom: 30, borderRadius: 20, background: "rgba(255,255,255,0.04)" }}>
          <div style={{ margin: 18, padding: "16px 18px", borderRadius: 14, background: "rgba(255,255,255,0.08)", fontSize: 26, fontWeight: 600, ...ring("nouvelle", C.bleu) }}>+ Nouvelle conversation</div>
          <div style={{ margin: "26px 18px 0", borderRadius: 14, padding: 14, ...ring("historique", C.violet) }}>
            {["Conversation d'hier", "Conversation de mardi"].map((c) => <div key={c} style={{ fontSize: 22, color: C.fg2, padding: "8px 4px" }}>{c}</div>)}
          </div>
        </div>
        <div style={{ position: "absolute", left: 370, right: 30, bottom: 40, height: 96, borderRadius: 22, background: "rgba(255,255,255,0.07)", display: "flex", alignItems: "center", gap: 20, padding: "0 24px", ...ring("saisie", C.bleuVert) }}>
          <div style={{ width: 54, height: 54, borderRadius: 14, display: "grid", placeItems: "center", background: "rgba(255,255,255,0.08)", fontSize: 34, ...ring("joindre", C.beige) }}>＋</div>
          <div style={{ flex: 1, fontSize: 28, color: C.fg3 }}>Écrivez votre message…</div>
          <div style={{ padding: "10px 20px", borderRadius: 999, fontSize: 24, fontWeight: 700, background: on("mode") > 0 ? undefined : "rgba(255,255,255,0.08)", backgroundImage: on("mode") > 0 ? GRAD.iris : undefined, color: on("mode") > 0 ? C.ink : C.fg2, ...ring("mode", C.violetLight) }}>Mode ▾</div>
        </div>
        {label("saisie", "Zone de saisie", { left: 380, bottom: 150 })}
        {label("nouvelle", "Nouvelle conversation", { left: 360, top: 46 })}
        {label("historique", "Historique", { left: 360, top: 150 })}
        {label("joindre", "Joindre un fichier", { left: 700, bottom: 150 })}
        {t >= marks.mode && label("mode", "Rapide ou approfondi : choisissez", { right: 40, bottom: 150 })}
      </div>
    </>
  );
};

const Advanced: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="Fonctionnalités avancées" before="Ce que" accent="ces boutons permettent" out={out} top={120} />
    <CueCards out={out} cols={3} top={300} height={190} cards={[
      { at: cue(s, "assistants", 1, 3), title: "Assistants personnalisés", icon: <IconSparkle size={32} />, tint: C.violet },
      { at: cue(s, "documentaire", 1, 8), title: "Espace documentaire", icon: <IconNote size={32} />, tint: C.bleu },
      { at: cue(s, "projets", 1, 13), title: "Projets", icon: <IconTable size={32} />, tint: C.bleuVert },
      { at: cue(s, "canvas", 1, 18), title: "Canvas", icon: <IconFileText size={32} />, tint: C.violetLight },
      { at: cue(s, "recherche", 1, 22), title: "Recherche approfondie", icon: <IconSearch size={32} />, tint: C.bleu },
      { at: cue(s, "connecteurs", 1, 27), title: "Connecteurs", icon: <IconZap size={32} />, tint: C.beige },
    ]} />
    <Pill at={cue(s, "attention", 1, 34)} out={out} top={760}>Avant d'activer un connecteur : la politique de la structure</Pill>
  </>
);

const YourTurn: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="À vous" before="Passez à" accent="la pratique" out={out} top={130} />
    <CueSteps out={out} top={330} steps={[
      { at: cue(s, "playground", 1, 2), text: "Playground" },
      { at: cue(s, "hub", 1, 5), text: "Hub IA : « Découvrir la fiche »" },
      { at: cue(s, "studio", 1, 13), text: "Studio : ChatGPT, Claude, Gemini" },
    ]} />
    <Reveal at={cue(s, "firefly", 1, 24)} out={out} style={{ position: "absolute", left: 790, top: 760 }}>
      <div style={{ ...baseText, display: "flex", alignItems: "center", gap: 14, fontSize: 28, color: C.fg2 }}><IconClock size={30} />Copilot et Firefly : sur leur site officiel</div>
    </Reveal>
  </>
);

const Recap: SceneRender = (s, out) => (
  <div style={{ position: "absolute", left: 1120, top: 220, width: 700 }}>
    <Reveal at={cue(s, "retenez", 1, 0.5) + 0.6} out={out}>
      <div style={{ ...baseText, fontSize: 24, letterSpacing: "0.14em", textTransform: "uppercase", color: C.fg3, fontWeight: 600, marginBottom: 26 }}>À retenir</div>
    </Reveal>
    <CueSteps out={out} left={0} top={70} width={700} size={34} steps={[
      { at: cue(s, "utile", 1, 3), text: "Un outil utile et autorisé, pas cinq comptes" },
      { at: cue(s, "sécurisez", 1, 6), text: "Sécuriser avant le premier prompt" },
      { at: cue(s, "cherchez", 1, 9), text: "Repérer le sélecteur de mode" },
    ]} />
    <Reveal at={cue(s, "quiz", 1, 13)} out={out} style={{ position: "absolute", top: 520, left: 0 }}>
      <div style={{ ...baseText, padding: "20px 34px", borderRadius: 999, backgroundImage: GRAD.iris, color: C.ink, fontSize: 30, fontWeight: 700 }}>Quiz, puis leçon 1.4 : ce qu'on n'y met jamais</div>
    </Reveal>
  </div>
);

const Banner: SceneRender = () => <NameBanner />;

export const Lesson13Commune: React.FC = () => (
  <LessonVideo
    manifest={manifest}
    chapters={[
      { label: "Les bons outils", sceneIds: ["1", "2", "3"] },
      { label: "Les comptes", sceneIds: ["4", "5", "6"] },
      { label: "L'interface", sceneIds: ["7", "8"] },
      { label: "À vous", sceneIds: ["9", "10"] },
    ]}
    shrinkAt={{ "10": cue(manifest.scenes.find((x) => x.id === "10")!, "retenez", 1, 0.5) + 0.2 }}
    render={{
      "1:over": Banner,
      "2": Objective,
      "3": NotByPrinciple,
      "4": Accounts,
      "5": OneFrame,
      "6": Setup,
      "7": Interface,
      "8": Advanced,
      "9": YourTurn,
      "10:over": Recap,
    }}
  />
);
