import React from "react";
import manifestJson from "../generated/lesson1_5-commune.json";
import { Glass, Reveal, baseText } from "../components/ui";
import { IconAlert, IconBan, IconCheck, IconClock, IconEye, IconFileX, IconKey, IconSearch, IconShield, IconSparkle, IconUser } from "../components/icons";
import { C, GRAD } from "../theme";
import { CueCards, CueSteps, NameBanner, SceneTitle } from "../rs6776/kit";
import { LessonVideo, type SceneRender } from "../rs6776/LessonVideo";
import { cue, type Manifest } from "../rs6776/timeline";

// Leçon 1.5 « Sécuriser son usage de l'IA » — vidéo commune.
// Script : docs/formation-rs6776/lecon-1.5/script-video-commune.md

export const manifest = manifestJson as unknown as Manifest;

const Pill: React.FC<{ at: number; out: number; top: number; children: React.ReactNode }> = ({ at, out, top, children }) => (
  <Reveal at={at} out={out} style={{ position: "absolute", left: 0, right: 0, top, display: "flex", justifyContent: "center" }}>
    <div style={{ ...baseText, padding: "22px 40px", borderRadius: 999, backgroundImage: GRAD.iris, color: C.ink, fontSize: 32, fontWeight: 700 }}>{children}</div>
  </Reveal>
);

const Objective: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="Objectif de la leçon" before="Quatre réflexes" accent="complémentaires" out={out} />
    <CueCards out={out} cols={4} top={360} height={290} cards={[
      { at: cue(s, "supprimer", 1, 3), title: "Supprimer l'inutile", icon: <IconFileX size={34} />, tint: C.violet },
      { at: cue(s, "distinguer", 1, 5), title: "Anonymiser ou pseudonymiser", icon: <IconUser size={34} />, tint: C.bleu },
      { at: cue(s, "cadre", 1, 8), title: "Un cadre autorisé, des accès limités", icon: <IconShield size={34} />, tint: C.bleuVert },
      { at: cue(s, "sortie", 1, 11), title: "Vérifier la sortie", icon: <IconSearch size={34} />, tint: C.beige },
    ]} />
    <Pill at={cue(s, "exercice", 1, 14)} out={out} top={740}>Exercice 3 de l'écrit : corriger et justifier</Pill>
  </>
);

const Necessary: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="La première question" before="Est-ce" accent="nécessaire ?" out={out} />
    <CueCards out={out} top={360} height={320} cards={[
      { at: cue(s, "retirez-la", 1, 7), title: "Inutile", text: "Retirez-la.", icon: <IconFileX size={36} />, tint: C.beige },
      { at: cue(s, "utile", 1, 9), title: "Utile", text: "Réduisez sa précision, ou remplacez les identifiants.", icon: <IconCheck size={36} />, tint: C.bleuVert },
      { at: cue(s, "réintégrez-les", 1, 14), title: "Vraies informations", text: "Réintégrées hors de l'outil, avec une nouvelle validation.", icon: <IconShield size={36} />, tint: C.violet },
    ]} />
  </>
);

const AnonPseudo: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="Un piège fréquent" before="Anonymiser" accent="ou pseudonymiser" out={out} />
    <Reveal at={cue(s, "personne", 1, 2)} out={out} style={{ position: "absolute", left: 120, top: 320 }}>
      <div style={{ ...baseText, padding: "12px 26px", borderRadius: 999, background: `${C.beige}26`, border: `1px solid ${C.beige}`, fontSize: 30, fontWeight: 700 }}>« Personne A » ne suffit pas toujours</div>
    </Reveal>
    <div style={{ ...baseText, position: "absolute", left: 120, right: 120, top: 420, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
      <Reveal at={cue(s, "l'anonymisation", 1, 7)} out={out}>
        <Glass glow={C.bleuVert} style={{ padding: "32px 38px", borderRadius: 28, height: 300 }}>
          <div style={{ fontSize: 44, fontWeight: 800, color: C.bleuVert }}>Anonymisation</div>
          <div style={{ marginTop: 12, fontSize: 30, color: C.fg2 }}>Le lien avec la personne est supprimé de façon irréversible.</div>
        </Glass>
      </Reveal>
      <Reveal at={cue(s, "pseudonymisation", 1, 14)} out={out}>
        <Glass glow={C.beige} style={{ padding: "32px 38px", borderRadius: 28, height: 300 }}>
          <div style={{ fontSize: 44, fontWeight: 800, color: C.beige }}>Pseudonymisation</div>
          <div style={{ marginTop: 12, fontSize: 30, color: C.fg2 }}>Une correspondance reste conservée : la donnée reste personnelle.</div>
        </Glass>
      </Reveal>
    </div>
    <Pill at={cue(s, "finalité", 1, 32)} out={out} top={790}>Ni l'un ni l'autre n'autorise seul l'envoi : finalité, offre, réglages, politique</Pill>
  </>
);

const Corrected: SceneRender = (s, out) => {
  const rows = [
    { at: cue(s, "retirés", 1, 9), text: "Nom, adresse mail, entreprise", verdict: "Retirés", tint: C.beige },
    { at: cue(s, "retiré", 1, 14), text: "IBAN", verdict: "Retiré entièrement", tint: C.beige },
    { at: cue(s, "catégorie", 1, 22), text: "Montant exact", verdict: "Niveau intermédiaire", tint: C.bleu },
    { at: cue(s, "menace", 1, 26), text: "Menace de résiliation", verdict: "Conservée, généralisée", tint: C.bleuVert },
  ];
  return (
    <>
      <SceneTitle eyebrow="Exemple fictif du cours" before="Un prompt corrigé," accent="information par information" out={out} />
      <Reveal at={cue(s, "réclamation", 1, 1)} out={out} style={{ position: "absolute", left: 120, top: 320, width: 640 }}>
        <Glass glow={C.violet} style={{ ...baseText, padding: "30px 34px", borderRadius: 26 }}>
          <div style={{ fontSize: 22, letterSpacing: "0.14em", textTransform: "uppercase", color: C.fg3, fontWeight: 600 }}>Réclamation client</div>
          <div style={{ marginTop: 12, fontSize: 30, color: C.fg2, lineHeight: 1.35 }}>Répondre avec empathie et proposer un geste commercial, pour un retard de livraison.</div>
        </Glass>
      </Reveal>
      <div style={{ ...baseText, position: "absolute", left: 820, right: 120, top: 320, display: "flex", flexDirection: "column", gap: 16 }}>
        {rows.map((r) => (
          <Reveal key={r.text} at={r.at} out={out}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, padding: "20px 26px", borderRadius: 20, background: `${r.tint}16`, border: `1px solid ${r.tint}66` }}>
              <span style={{ fontSize: 32, fontWeight: 600 }}>{r.text}</span>
              <span style={{ fontSize: 26, fontWeight: 800, color: r.tint, textTransform: "uppercase", letterSpacing: "0.06em" }}>{r.verdict}</span>
            </div>
          </Reveal>
        ))}
      </div>
      <Pill at={cue(s, "corriger", 1, 32)} out={out} top={800}>Retirer l'inutile, généraliser l'utile, justifier</Pill>
    </>
  );
};

const LeastPrivilege: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="Protéger en amont" before="Le" accent="moindre privilège" out={out} />
    <CueCards out={out} cols={2} top={340} height={190} cards={[
      { at: cue(s, "distinct", 1, 12), title: "Compte professionnel distinct", icon: <IconUser size={32} />, tint: C.violet },
      { at: cue(s, "autorisations", 1, 16), title: "Autorisations par outil ou par mission", icon: <IconKey size={32} />, tint: C.bleu },
      { at: cue(s, "révoqués", 1, 20), title: "Accès révoqués en fin de mission", icon: <IconClock size={32} />, tint: C.bleuVert },
      { at: cue(s, "interdites", 1, 26), title: "Catégories interdites de saisie", icon: <IconBan size={32} />, tint: C.beige },
    ]} />
  </>
);

const Exclusion: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="Services grand public non approuvés" before="La liste" accent="d'exclusion" out={out} />
    <div style={{ position: "absolute", left: 120, right: 120, top: 360, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22 }}>
      {[
        { at: cue(s, "secrets", 1, 5), text: "Secrets d'authentification" },
        { at: cue(s, "clés", 1, 7), text: "Clés et mots de passe" },
        { at: cue(s, "bancaires", 1, 9), text: "Coordonnées bancaires réelles" },
        { at: cue(s, "dossiers", 1, 11), text: "Dossiers de santé" },
        { at: cue(s, "professionnel", 1, 14), text: "Informations sous secret professionnel" },
      ].map((r) => (
        <Reveal key={r.text} at={r.at} out={out}>
          <div style={{ ...baseText, display: "flex", alignItems: "center", gap: 18, padding: "22px 28px", borderRadius: 22, background: `${C.beige}16`, border: `1px solid ${C.beige}66`, fontSize: 34, fontWeight: 600 }}><IconBan size={34} color={C.beige} />{r.text}</div>
        </Reveal>
      ))}
    </div>
    <Pill at={cue(s, "jamais", 1, 22)} out={out} top={800}>Un secret d'accès réel n'est jamais fourni au modèle</Pill>
  </>
);

const Review: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="Le dernier filet" before="La revue" accent="manuelle" out={out} />
    <CueCards out={out} top={360} height={260} cards={[
      { at: cue(s, "réapparaître", 1, 8), title: "Une donnée qui réapparaît", icon: <IconEye size={36} />, tint: C.beige },
      { at: cue(s, "inventé", 1, 11), title: "Un détail inventé", icon: <IconAlert size={36} />, tint: C.beige },
      { at: cue(s, "ton", 1, 14), title: "Un ton inadapté", icon: <IconSparkle size={36} />, tint: C.beige },
    ]} />
    <Reveal at={cue(s, "revue", 1, 20)} out={out} style={{ position: "absolute", left: 0, right: 0, top: 720, display: "flex", justifyContent: "center" }}>
      <div style={{ ...baseText, fontSize: 32, color: C.fg2 }}>Le prompt corrigé réduit le risque · la relecture vérifie ce qui sort</div>
    </Reveal>
  </>
);

const YourTurn: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="À vous" before="Passez à" accent="la pratique" out={out} top={130} />
    <CueSteps out={out} top={330} steps={[
      { at: cue(s, "playground", 1, 2), text: "Playground : anonymiser, corriger, justifier" },
      { at: cue(s, "gemini", 1, 8), text: "Studio : Gemini, avec un texte anonymisé" },
      { at: cue(s, "relisez", 1, 16), text: "Relire la réponse" },
    ]} />
    <Reveal at={cue(s, "budget", 1, 10)} out={out} style={{ position: "absolute", left: 790, top: 760 }}>
      <div style={{ ...baseText, display: "flex", alignItems: "center", gap: 14, fontSize: 28, color: C.fg2 }}><IconCheck size={30} />Le chat Gemini ne consomme pas le budget IA</div>
    </Reveal>
  </>
);

const Recap: SceneRender = (s, out) => (
  <div style={{ position: "absolute", left: 1120, top: 220, width: 700 }}>
    <Reveal at={cue(s, "retenez", 1, 0.5) + 0.6} out={out}>
      <div style={{ ...baseText, fontSize: 24, letterSpacing: "0.14em", textTransform: "uppercase", color: C.fg3, fontWeight: 600, marginBottom: 26 }}>À retenir</div>
    </Reveal>
    <CueSteps out={out} left={0} top={70} width={700} size={34} steps={[
      { at: cue(s, "retirez", 1, 3), text: "Retirer l'inutile, généraliser l'utile" },
      { at: cue(s, "pseudonyme", 1, 6), text: "Pseudonyme n'est pas anonyme" },
      { at: cue(s, "privilège", 1, 9), text: "Moindre privilège et relecture" },
    ]} />
    <Reveal at={cue(s, "quiz", 1, 14)} out={out} style={{ position: "absolute", top: 520, left: 0 }}>
      <div style={{ ...baseText, padding: "20px 34px", borderRadius: 999, backgroundImage: GRAD.iris, color: C.ink, fontSize: 30, fontWeight: 700 }}>Quiz, puis leçon 1.6 : votre plan d'actions</div>
    </Reveal>
  </div>
);

const Banner: SceneRender = () => <NameBanner />;

export const Lesson15Commune: React.FC = () => (
  <LessonVideo
    manifest={manifest}
    chapters={[
      { label: "Quatre réflexes", sceneIds: ["1", "2", "3"] },
      { label: "Anonymiser", sceneIds: ["4", "5"] },
      { label: "Accès et relecture", sceneIds: ["6", "7", "8"] },
      { label: "À vous", sceneIds: ["9", "10"] },
    ]}
    shrinkAt={{ "10": cue(manifest.scenes.find((x) => x.id === "10")!, "retenez", 1, 0.5) + 0.2 }}
    render={{
      "1:over": Banner,
      "2": Objective,
      "3": Necessary,
      "4": AnonPseudo,
      "5": Corrected,
      "6": LeastPrivilege,
      "7": Exclusion,
      "8": Review,
      "9": YourTurn,
      "10:over": Recap,
    }}
  />
);
