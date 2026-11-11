import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import manifestJson from "../generated/lesson3_2-commune.json";
import { Glass, Reveal, baseText } from "../components/ui";
import { IconAlert, IconAward, IconCalendar, IconFileText, IconLock, IconSearch, IconShield, IconTarget, IconUser } from "../components/icons";
import { C, EASE, GRAD, clamp } from "../theme";
import { CueCards, CueSteps, NameBanner, SceneTitle } from "../rs6776/kit";
import { LessonVideo, type SceneRender } from "../rs6776/LessonVideo";
import { cue, type Manifest } from "../rs6776/timeline";

// Leçon 3.2 « Cadre légal : IA Act, RGPD et veille » — vidéo commune.
// Script : docs/formation-rs6776/lecon-3.2/script-video-commune.md
// Aucune échéance réglementaire n'est affichée : la frise de la scène 7 est une illustration.

export const manifest = manifestJson as unknown as Manifest;

const Pill: React.FC<{ at: number; out: number; top: number; children: React.ReactNode }> = ({ at, out, top, children }) => (
  <Reveal at={at} out={out} style={{ position: "absolute", left: 0, right: 0, top, display: "flex", justifyContent: "center" }}>
    <div style={{ ...baseText, padding: "20px 40px", borderRadius: 999, fontSize: 32, fontWeight: 700, color: C.ink, backgroundImage: GRAD.iris }}>{children}</div>
  </Reveal>
);

const sc2: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="Objectif de la leçon" before="Quatre gestes" accent="à maîtriser" out={out} />
    <CueCards out={out} cols={4} top={360} height={290} cards={[
      { at: cue(s, "qualifier", 1, 3), kicker: "IA Act", title: "Qualifier un usage", icon: <IconTarget size={34} />, tint: C.violet },
      { at: cue(s, "r-g-p-d", 1, 7), kicker: "RGPD", title: "L'articuler", icon: <IconShield size={34} />, tint: C.bleu },
      { at: cue(s, "distinguer", 1, 9), kicker: "Décision", title: "Supervision ou automatisation", icon: <IconUser size={34} />, tint: C.bleuVert },
      { at: cue(s, "documenter", 1, 13), kicker: "Veille", title: "Sources officielles datées", icon: <IconCalendar size={34} />, tint: C.beige },
    ]} />
    <Pill at={cue(s, "six", 1, 16)} out={out} top={760}>Exercice 6 de l'écrit : directives réglementaires et éthique</Pill>
  </>
);

const sc3: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="Le règlement européen sur l'IA" before="Une régulation" accent="par les risques" out={out} />
    <CueCards out={out} top={350} height={230} cards={[
      { at: cue(s, "systèmes", 1, 4), title: "Systèmes et modèles d'IA", tint: C.violet },
      { at: cue(s, "fournissent", 1, 6), title: "Fournisseurs et déployeurs", tint: C.bleu },
      { at: cue(s, "usages", 1, 8), title: "Certains usages", tint: C.bleuVert },
    ]} />
    <Reveal at={cue(s, "fonction", 1, 12)} out={out} style={{ position: "absolute", left: 120, right: 120, top: 640 }}>
      <div style={{ ...baseText, display: "flex", gap: 18, alignItems: "center", flexWrap: "wrap", fontSize: 32, fontWeight: 600 }}>
        <span style={{ color: C.fg3 }}>Les obligations dépendent de :</span>
        {[["fonction", "la fonction"], ["finalité", "la finalité prévue"], ["contexte", "le contexte"], ["risque", "le risque pour les personnes"]].map(([w, l], i) => (
          <Reveal key={l} at={cue(s, w, 1, 12 + i * 1.5)} out={out}>
            <span style={{ padding: "10px 22px", borderRadius: 999, border: `1px solid ${C.hairline2}`, background: "rgba(255,255,255,0.05)" }}>{l}</span>
          </Reveal>
        ))}
      </div>
    </Reveal>
    <Reveal at={cue(s, "pédagogique", 1, 22)} out={out} style={{ position: "absolute", left: 120, top: 790 }}>
      <div style={{ ...baseText, fontSize: 28, color: C.fg2 }}>Une grille en quatre niveaux : un repère, pas le texte.</div>
    </Reveal>
  </>
);

const LEVELS = [
  { w: "interdites", name: "Inacceptable", ex: "Reconnaissance des émotions au travail", tint: "rgba(255,255,255,0.45)", width: 1000 },
  { w: "haut", name: "Haut risque", ex: "Tri de candidatures", tint: C.beige, width: 1180 },
  { w: "transparence", name: "Transparence spécifique", ex: "Agent conversationnel, deepfake diffusé", tint: C.bleuVert, width: 1360 },
  { w: "faible", name: "Faible ou minimal", ex: "Brouillon d'e-mail interne", tint: C.bleu, width: 1540 },
];

const sc4: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="Repère pédagogique" before="La grille" accent="en quatre niveaux" out={out} top={110} />
    <div style={{ ...baseText, position: "absolute", left: 0, right: 0, top: 290, display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
      {LEVELS.map((l) => (
        <Reveal key={l.name} at={cue(s, l.w, 1, 2)} out={out}>
          <div style={{ width: l.width, padding: "20px 34px", borderRadius: 20, border: `1px solid ${l.tint}`, background: `linear-gradient(90deg, ${l.tint}30, ${l.tint}10)`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 36, fontWeight: 800 }}>{l.name}</span>
            <span style={{ fontSize: 28, color: C.fg2, fontWeight: 500 }}>{l.ex}</span>
          </div>
        </Reveal>
      ))}
    </div>
    <Reveal at={cue(s, "attention", 1, 28)} out={out} style={{ position: "absolute", left: 0, right: 0, top: 830, display: "flex", justifyContent: "center" }}>
      <div style={{ ...baseText, display: "flex", alignItems: "center", gap: 14, fontSize: 30, fontWeight: 700, color: C.beige }}><IconAlert size={32} color={C.beige} />RGPD, droit du travail, propriété intellectuelle : toujours applicables</div>
    </Reveal>
  </>
);

const PRINCIPLES: [string, string][] = [
  ["licéité", "Licéité, loyauté, transparence"],
  ["finalités", "Finalités limitées"],
  ["minimisation", "Minimisation"],
  ["exactitude", "Exactitude"],
  ["conservation", "Conservation limitée"],
  ["intégrité", "Intégrité et confidentialité"],
  ["responsabilité", "Responsabilité"],
];

const sc5: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="Le RGPD, toujours là" before="Sept principes," accent="une grille de lecture" out={out} />
    <div style={{ ...baseText, position: "absolute", left: 120, right: 120, top: 360, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 22 }}>
      {PRINCIPLES.map(([w, l], i) => (
        <Reveal key={l} at={cue(s, w, 1, 4 + i * 3)} out={out}>
          <Glass glow={[C.violet, C.bleu, C.bleuVert, C.beige][i % 4]} style={{ padding: "26px 28px", borderRadius: 22, height: 170 }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: C.fg3 }}>{i + 1}</div>
            <div style={{ marginTop: 8, fontSize: 32, fontWeight: 700, lineHeight: 1.12 }}>{l}</div>
          </Glass>
        </Reveal>
      ))}
    </div>
    <Reveal at={cue(s, "démontrer", 1, 26)} out={out} style={{ position: "absolute", left: 120, top: 780 }}>
      <div style={{ ...baseText, fontSize: 30, color: C.fg2 }}>C'est votre organisation qui démontre sa conformité, pas l'éditeur de l'outil.</div>
    </Reveal>
  </>
);

const sc6: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="Un outil qui note des CV · exemple fictif" before="Deux analyses," accent="séparées puis articulées" out={out} />
    <div style={{ ...baseText, position: "absolute", left: 120, right: 120, top: 360, display: "grid", gridTemplateColumns: "1fr 260px 1fr", gap: 28, alignItems: "center" }}>
      <Reveal at={cue(s, "act", 1, 5)} out={out}>
        <Glass glow={C.beige} style={{ padding: "30px 34px", borderRadius: 26, height: 300 }}>
          <div style={{ fontSize: 22, letterSpacing: "0.14em", textTransform: "uppercase", color: C.beige, fontWeight: 700 }}>IA Act</div>
          <div style={{ marginTop: 10, fontSize: 36, fontWeight: 800 }}>Supervision humaine effective</div>
          <div style={{ marginTop: 12, fontSize: 27, color: C.fg2 }}>Comprendre les limites, pouvoir ignorer ou inverser la sortie</div>
        </Glass>
      </Reveal>
      <Reveal at={0.6} out={out}>
        <div style={{ display: "grid", placeItems: "center" }}>
          <div style={{ width: 170, height: 210, borderRadius: 24, background: "rgba(255,255,255,0.06)", border: `1px solid ${C.hairline2}`, display: "grid", placeItems: "center", color: C.fg2 }}><IconFileText size={80} /></div>
          <div style={{ marginTop: 14, fontSize: 26, fontWeight: 700, color: C.fg2 }}>CV noté</div>
        </div>
      </Reveal>
      <Reveal at={cue(s, "vingt-deux", 1, 18)} out={out}>
        <Glass glow={C.bleu} style={{ padding: "30px 34px", borderRadius: 26, height: 300 }}>
          <div style={{ fontSize: 22, letterSpacing: "0.14em", textTransform: "uppercase", color: C.bleu, fontWeight: 700 }}>RGPD · article 22</div>
          <div style={{ marginTop: 10, fontSize: 36, fontWeight: 800 }}>Décision exclusivement automatisée</div>
          <div style={{ marginTop: 12, fontSize: 27, color: C.fg2 }}>Effet significatif : exceptions et garanties</div>
        </Glass>
      </Reveal>
    </div>
    <Reveal at={cue(s, "humain", 1, 24)} out={out} style={{ position: "absolute", left: 120, right: 120, top: 720 }}>
      <div style={{ ...baseText, display: "flex", alignItems: "center", gap: 14, fontSize: 30, fontWeight: 600, color: C.fg2 }}><IconUser size={32} />Ouvrir le dossier ne suffit pas : l'intervention doit pouvoir changer la décision</div>
    </Reveal>
    <Reveal at={cue(s, "pertinentes", 1, 30)} out={out} style={{ position: "absolute", left: 120, right: 120, top: 800 }}>
      <div style={{ ...baseText, display: "flex", alignItems: "center", gap: 14, fontSize: 30, fontWeight: 600, color: C.fg2 }}><IconLock size={32} />Et aussi : données pertinentes pour le poste, chaque note vérifiée</div>
    </Reveal>
  </>
);

const MovingDate: React.FC<{ at: number; out: number }> = ({ at, out }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const strike = interpolate(frame, [(at + 1) * fps, (at + 1.6) * fps], [0, 1], { ...clamp, easing: EASE });
  const move = interpolate(frame, [(at + 2) * fps, (at + 3.2) * fps], [0, 1], { ...clamp, easing: EASE });
  return (
    <Reveal at={at} out={out} style={{ position: "absolute", left: 120, right: 120, top: 330, height: 200 }}>
      <div style={{ ...baseText, position: "absolute", left: 0, right: 0, top: 96, height: 4, borderRadius: 4, background: C.hairline2 }} />
      <div style={{ ...baseText, position: "absolute", left: 360, top: 40, padding: "14px 26px", borderRadius: 16, border: `1px solid ${C.hairline2}`, fontSize: 30, fontWeight: 700, color: C.fg3 }}>
        Échéance
        <div style={{ position: "absolute", left: 14, right: 14, top: "50%", height: 3, background: C.beige, transformOrigin: "left", scale: `${strike} 1` }} />
      </div>
      <div style={{ ...baseText, position: "absolute", left: 360 + move * 700, top: 40, padding: "14px 26px", borderRadius: 16, backgroundImage: GRAD.iris, color: C.ink, fontSize: 30, fontWeight: 800, opacity: move }}>Nouvelle échéance</div>
      <div style={{ ...baseText, position: "absolute", left: 0, top: 150, fontSize: 22, letterSpacing: "0.14em", textTransform: "uppercase", color: C.fg3, fontWeight: 600 }}>Illustration · une date peut changer</div>
    </Reveal>
  );
};

const sc7: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="La veille réglementaire" before="Une date" accent="se revérifie" out={out} top={110} />
    <MovingDate at={cue(s, "date", 1, 4)} out={out} />
    <CueCards out={out} cols={4} top={600} height={260} cards={[
      { at: cue(s, "cnil", 1, 18), title: "CNIL", text: "RGPD et IA", tint: C.violet },
      { at: cue(s, "eur-lex", 1, 20), title: "EUR-Lex", text: "Texte européen consolidé", tint: C.bleu },
      { at: cue(s, "légifrance", 1, 22), title: "Légifrance", text: "Droit français", tint: C.bleuVert },
      { at: cue(s, "bureau", 1, 24), title: "Bureau de l'IA", text: "Commission européenne", tint: C.beige },
    ]} />
  </>
);

const sc7a: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="Tracer sa vérification" before="Une IA n'est pas" accent="une source juridique" out={out} />
    <Reveal at={cue(s, "lien", 1, 2)} out={out} style={{ position: "absolute", left: 120, top: 360, width: 760 }}>
      <Glass glow={C.violet} style={{ ...baseText, padding: "30px 38px", borderRadius: 26 }}>
        <div style={{ fontSize: 22, letterSpacing: "0.14em", textTransform: "uppercase", color: C.fg3, fontWeight: 600, marginBottom: 16 }}>Pour chaque règle</div>
        {[["lien", "Lien"], ["consultation", "Date de consultation"], ["version", "Version du texte"], ["statut", "Statut"]].map(([w, l], i) => (
          <Reveal key={l} at={cue(s, w, 1, 2 + i)} out={out}>
            <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 34, fontWeight: 600, padding: "10px 0", borderBottom: `1px solid ${C.hairline}` }}><IconSearch size={30} />{l}</div>
          </Reveal>
        ))}
      </Glass>
    </Reveal>
    <div style={{ ...baseText, position: "absolute", left: 960, right: 120, top: 360, display: "flex", flexDirection: "column", gap: 18 }}>
      {[["ancienne", "Version ancienne"], ["proposition", "Proposition prise pour un texte en vigueur"], ["citer", "Article mal cité"], ["omettre", "Exception oubliée"]].map(([w, l], i) => (
        <Reveal key={l} at={cue(s, w, 1, 12 + i * 1.5)} out={out}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "18px 26px", borderRadius: 20, border: `1px solid ${C.beige}66`, background: `${C.beige}14`, fontSize: 30, fontWeight: 600 }}><IconAlert size={28} color={C.beige} />{l}</div>
        </Reveal>
      ))}
    </div>
    <Pill at={cue(s, "primaire", 1, 20)} out={out} top={860}>Vérifiez toujours dans la source primaire</Pill>
  </>
);

const sc8: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="À vous" before="Passez à" accent="la pratique" out={out} top={130} />
    <CueSteps out={out} top={330} steps={[
      { at: cue(s, "playground", 1, 2), text: "Playground : qualifier des cas concrets" },
      { at: cue(s, "hub", 1, 6), text: "Hub IA : « Rechercher & veiller »" },
      { at: cue(s, "agent", 1, 15), text: "Mon Agent IA : se faire interroger" },
    ]} />
    <Reveal at={cue(s, "studio", 1, 12)} out={out} style={{ position: "absolute", left: 700, top: 720 }}>
      <div style={{ ...baseText, display: "flex", alignItems: "center", gap: 14, fontSize: 28, color: C.fg2 }}><IconSearch size={30} />Chats du Studio : pas de recherche web</div>
    </Reveal>
  </>
);

const sc9: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="La suite" before="Mission finale," accent="puis certification" out={out} />
    <CueCards out={out} cols={4} top={350} height={380} cards={[
      { at: cue(s, "mission", 1, 2), kicker: "Mission finale", title: "Conformité et accessibilité", text: "Un contenu inclusif, un contenu généré à corriger", icon: <IconShield size={34} />, tint: C.violet },
      { at: cue(s, "écrit", 1, 13), kicker: "Écrit", title: "6 cas pratiques", text: "En 10 jours", icon: <IconFileText size={34} />, tint: C.bleu },
      { at: cue(s, "studio", 1, 17), kicker: "Pendant l'écrit", title: "Le Studio seul", text: "Ses chats et ses images", icon: <IconSearch size={34} />, tint: C.bleuVert },
      { at: cue(s, "soutenance", 1, 21), kicker: "Oral", title: "Soutenance", text: "Environ 20 minutes", icon: <IconAward size={34} />, tint: C.beige },
    ]} />
  </>
);

const Recap: SceneRender = (s, out) => (
  <div style={{ position: "absolute", left: 1120, top: 220, width: 700 }}>
    <Reveal at={cue(s, "retenez", 1, 0.5) + 0.6} out={out}>
      <div style={{ ...baseText, fontSize: 24, letterSpacing: "0.14em", textTransform: "uppercase", color: C.fg3, fontWeight: 600, marginBottom: 26 }}>À retenir</div>
    </Reveal>
    <CueSteps out={out} left={0} top={70} width={700} size={34} steps={[
      { at: cue(s, "qualifiez", 1, 2), text: "Qualifier le risque" },
      { at: cue(s, "analysez", 1, 5), text: "Analyser le RGPD à part" },
      { at: cue(s, "vérifiez", 1, 8), text: "Vérifier la version la plus récente" },
    ]} />
    <Reveal at={cue(s, "méthode", 1, 13)} out={out} style={{ position: "absolute", top: 520, left: 0 }}>
      <div style={{ ...baseText, padding: "20px 34px", borderRadius: 999, backgroundImage: GRAD.iris, color: C.ink, fontSize: 30, fontWeight: 700 }}>Quiz, mission finale, certification</div>
    </Reveal>
  </div>
);

export const Lesson32Commune: React.FC = () => (
  <LessonVideo
    manifest={manifest}
    chapters={[
      { label: "Bienvenue", sceneIds: ["1", "2"] },
      { label: "IA Act et RGPD", sceneIds: ["3", "4", "5", "6"] },
      { label: "La veille", sceneIds: ["7", "7a"] },
      { label: "À vous", sceneIds: ["8", "9", "10"] },
    ]}
    shrinkAt={{ "10": cue(manifest.scenes.find((x) => x.id === "10")!, "retenez", 1, 0.5) + 0.2 }}
    render={{
      "1:over": () => <NameBanner />,
      "2": sc2,
      "3": sc3,
      "4": sc4,
      "5": sc5,
      "6": sc6,
      "7": sc7,
      "7a": sc7a,
      "8": sc8,
      "9": sc9,
      "10:over": Recap,
    }}
  />
);
