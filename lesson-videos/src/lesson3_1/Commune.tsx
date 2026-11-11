import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import manifestJson from "../generated/lesson3_1-commune.json";
import { Glass, Reveal, baseText } from "../components/ui";
import { IconAlert, IconBrain, IconEye, IconFileText, IconFilm, IconHeadphones, IconImage, IconListChecks, IconSearch, IconShield, IconTarget } from "../components/icons";
import { C, EASE, GRAD, clamp } from "../theme";
import { CueCards, CueSteps, NameBanner, SceneTitle, ToolLogo } from "../rs6776/kit";
import { LessonVideo, type SceneRender } from "../rs6776/LessonVideo";
import { cue, type Manifest } from "../rs6776/timeline";
import { TOOLS } from "../rs6776/tools";

// Leçon 3.1 « Produire des contenus inclusifs » — vidéo commune.
// Script : docs/formation-rs6776/lecon-3.1/script-video-commune.md

export const manifest = manifestJson as unknown as Manifest;

/* ---------- briques locales ---------- */

const Pill: React.FC<{ at: number; out: number; top: number; children: React.ReactNode; tone?: "iris" | "alert" }> = ({ at, out, top, children, tone = "iris" }) => (
  <Reveal at={at} out={out} style={{ position: "absolute", left: 0, right: 0, top, display: "flex", justifyContent: "center" }}>
    <div style={{ ...baseText, padding: "20px 40px", borderRadius: 999, fontSize: 32, fontWeight: 700, color: C.ink, backgroundImage: tone === "iris" ? GRAD.iris : undefined, background: tone === "alert" ? C.beige : undefined }}>{children}</div>
  </Reveal>
);

/* ---------- scènes ---------- */

const sc2: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="Objectif de la leçon" before="Trois familles" accent="de besoins" out={out} />
    <CueCards out={out} top={360} height={300} cards={[
      { at: cue(s, "visuels", 1, 5), title: "Visuel", text: "Ne pas voir, ou mal voir", icon: <IconEye size={40} />, tint: C.bleu },
      { at: cue(s, "auditifs", 1, 6), title: "Auditif", text: "Ne pas entendre, ou mal entendre", icon: <IconHeadphones size={40} />, tint: C.beige },
      { at: cue(s, "cognitifs", 1, 7), title: "Cognitif", text: "Difficultés de compréhension", icon: <IconBrain size={40} />, tint: C.bleuVert },
    ]} />
    <Pill at={cue(s, "quatre", 1, 18)} out={out} top={760}>Exercice 4 de l'écrit : une note interne accessible</Pill>
  </>
);

const sc3: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="Le cadre" before="Une obligation," accent="pas une option" out={out} />
    <CueCards out={out} top={340} height={430} cards={[
      { at: cue(s, "loi", 1, 4), kicker: "France", title: "Loi du 11 février 2005", text: "Article 47 : services de communication au public en ligne", icon: <IconShield size={36} />, tint: C.violet },
      { at: cue(s, "r-g-a-a", 1, 12), kicker: "Référentiel", title: "RGAA", text: "Construit à partir des WCAG, la référence internationale", icon: <IconListChecks size={36} />, tint: C.bleu },
      { at: cue(s, "européen", 1, 22), kicker: "Union européenne", title: "Acte européen sur l'accessibilité", text: "Des catégories précises de produits et de services", icon: <IconTarget size={36} />, tint: C.bleuVert },
    ]} />
    <Pill at={cue(s, "obstacle", 1, 32)} out={out} top={760}>Obstacle réel → équivalent utilisable, sans appauvrir</Pill>
  </>
);

const AltRules: React.FC<{ rules: { at: number; tag: string; text: string; tint: string }[]; out: number; top: number }> = ({ rules, out, top }) => (
  <div style={{ ...baseText, position: "absolute", left: 120, right: 120, top, display: "flex", flexDirection: "column", gap: 18 }}>
    {rules.map((r) => (
      <Reveal key={r.tag} at={r.at} out={out}>
        <div style={{ display: "flex", alignItems: "center", gap: 26, padding: "18px 28px", borderRadius: 22, border: `1px solid ${r.tint}55`, background: `${r.tint}12` }}>
          <span style={{ minWidth: 260, fontSize: 30, fontWeight: 800, color: r.tint }}>{r.tag}</span>
          <span style={{ fontSize: 32, fontWeight: 600 }}>{r.text}</span>
        </div>
      </Reveal>
    ))}
  </div>
);

const sc4: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="Premier besoin" before="Le handicap" accent="visuel" out={out} />
    <div style={{ ...baseText, position: "absolute", left: 120, right: 120, top: 340, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28 }}>
      {[
        { at: cue(s, "lecteur", 1, 4), t: "Ne voit pas", d: "Lecteur d'écran, repères par les titres" },
        { at: cue(s, "malvoyante", 1, 7), t: "Voit mal", d: "Contraste suffisant, texte agrandissable" },
      ].map((c) => (
        <Reveal key={c.t} at={c.at} out={out}>
          <Glass glow={C.bleu} style={{ padding: "26px 34px", borderRadius: 24 }}>
            <div style={{ fontSize: 38, fontWeight: 700 }}>{c.t}</div>
            <div style={{ marginTop: 8, fontSize: 28, color: C.fg2 }}>{c.d}</div>
          </Glass>
        </Reveal>
      ))}
    </div>
    <AltRules out={out} top={560} rules={[
      { at: cue(s, "décorative", 1, 12), tag: "Décorative", text: "Alternative vide", tint: C.fg2 },
      { at: cue(s, "informative", 1, 15), tag: "Informative", text: "Sa fonction, jamais le nom du fichier", tint: C.bleu },
      { at: cue(s, "graphique", 1, 20), tag: "Complexe", text: "Description détaillée ou tableau dans la page", tint: C.violet },
    ]} />
    <Reveal at={cue(s, "contraste", 2, 28)} out={out} style={{ position: "absolute", right: 120, top: 920 }}>
      <div style={{ ...baseText, display: "flex", alignItems: "center", gap: 12, fontSize: 28, color: C.fg2 }}><IconSearch size={30} />Contraste : un outil dédié, pas l'œil</div>
    </Reveal>
  </>
);

const TOOL_LINES: Record<string, [string, string]> = {
  chatgpt: ["chatgpt", "Décrit une image · intégré à Be My Eyes"],
  claude: ["claude", "Studio : accepte une image jointe"],
  gemini: ["gemini", "Décrit un visuel dans Google Workspace"],
  copilot: ["word", "Vérificateur d'accessibilité de Word et PowerPoint"],
  firefly: ["firefly", "Décrit le visuel qu'il vient de générer"],
};

const sc5: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="Les outils" before="Un premier" accent="texte alternatif" out={out} top={110} />
    <div style={{ ...baseText, position: "absolute", left: 120, right: 120, top: 290, display: "flex", flexDirection: "column", gap: 16 }}>
      {TOOLS.map((t, i) => (
        <Reveal key={t.id} at={cue(s, TOOL_LINES[t.id][0], 1, 3 + i * 5)} out={out}>
          <div style={{ display: "flex", alignItems: "center", gap: 28, padding: "12px 24px", borderRadius: 22, border: `1px solid ${t.accent}55`, background: `${t.accent}10` }}>
            <ToolLogo src={t.logo} size={76} glow={t.accent} />
            <span style={{ minWidth: 220, fontSize: 36, fontWeight: 800 }}>{t.name}</span>
            <span style={{ fontSize: 30, color: C.fg2, fontWeight: 500 }}>{TOOL_LINES[t.id][1]}</span>
          </div>
        </Reveal>
      ))}
    </div>
    <Pill at={cue(s, "brouillon", 1, 28)} out={out} top={940} tone="alert">Toujours un brouillon : vous relisez, vous corrigez</Pill>
  </>
);

const SubtitleBar: React.FC<{ at: number; out: number }> = ({ at, out }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = interpolate(frame, [at * fps, (at + 1.2) * fps], [0, 1], { ...clamp, easing: EASE });
  return (
    <Reveal at={at} out={out} style={{ position: "absolute", left: 120, top: 360, width: 900 }}>
      <Glass glow={C.beige} style={{ ...baseText, height: 360, borderRadius: 28, overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", color: C.fg3 }}><IconFilm size={110} /></div>
        <div style={{ position: "absolute", left: 40, right: 40, bottom: 34, padding: "12px 20px", borderRadius: 12, background: "rgba(0,0,0,0.65)", fontSize: 28, fontWeight: 600, clipPath: `inset(0 ${100 - p * 100}% 0 0)` }}>[Musique] Bienvenue dans l'équipe…</div>
        <div style={{ position: "absolute", left: 40, top: 26, fontSize: 20, letterSpacing: "0.14em", textTransform: "uppercase", color: C.fg3 }}>Illustration · exemple fictif</div>
      </Glass>
    </Reveal>
  );
};

const sc6: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="Deuxième besoin" before="Le handicap" accent="auditif" out={out} />
    <SubtitleBar at={cue(s, "sous-titres", 1, 5)} out={out} />
    <Reveal at={cue(s, "transcription", 1, 9)} out={out} style={{ position: "absolute", left: 1080, top: 360, width: 720 }}>
      <Glass glow={C.bleu} style={{ ...baseText, padding: "28px 34px", borderRadius: 24, display: "flex", alignItems: "center", gap: 20 }}>
        <IconFileText size={40} />
        <span style={{ fontSize: 34, fontWeight: 700 }}>Transcription</span>
      </Glass>
    </Reveal>
    <Reveal at={cue(s, "relus", 1, 22)} out={out} style={{ position: "absolute", left: 1080, top: 520, width: 720 }}>
      <div style={{ ...baseText, display: "flex", alignItems: "center", gap: 14, fontSize: 30, fontWeight: 700, color: C.beige }}><IconSearch size={34} color={C.beige} />Relus avant publication</div>
    </Reveal>
    <div style={{ ...baseText, position: "absolute", left: 1080, top: 600, width: 720, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
      {[["noms", "Noms propres"], ["sigles", "Sigles"], ["locuteurs", "Locuteurs"], ["sons", "Sons utiles"]].map(([w, l], i) => (
        <Reveal key={l} at={cue(s, w, w === "sons" ? 2 : 1, 23 + i)} out={out}>
          <div style={{ padding: "14px 20px", borderRadius: 16, border: `1px solid ${C.beige}66`, background: `${C.beige}14`, fontSize: 28, fontWeight: 600 }}>{l}</div>
        </Reveal>
      ))}
    </div>
  </>
);

const sc7: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="Troisième besoin" before="Le handicap cognitif :" accent="la méthode FALC" out={out} />
    <CueSteps out={out} left={120} top={340} width={820} size={34} steps={[
      { at: cue(s, "idée", 1, 6), text: "Une idée par phrase" },
      { at: cue(s, "vocabulaire", 1, 8), text: "Un vocabulaire courant" },
      { at: cue(s, "voix", 1, 10), text: "Phrases courtes, voix active" },
      { at: cue(s, "aérée", 1, 12), text: "Une mise en page aérée" },
    ]} />
    <Reveal at={cue(s, "participation", 1, 15)} out={out} style={{ position: "absolute", left: 1020, top: 340, width: 780 }}>
      <div style={{ ...baseText, padding: "30px 36px", borderRadius: 26, backgroundImage: GRAD.iris, color: C.ink }}>
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>Ce qui fait le FALC</div>
        <div style={{ marginTop: 10, fontSize: 36, fontWeight: 800, lineHeight: 1.15 }}>Des personnes en situation de handicap intellectuel rédigent et relisent</div>
      </div>
    </Reveal>
    <Reveal at={cue(s, "clair", 1, 20)} out={out} style={{ position: "absolute", left: 1020, top: 610, width: 780 }}>
      <div style={{ ...baseText, fontSize: 30, color: C.fg2 }}>Sans elles : du <b style={{ color: C.fg }}>langage clair</b>, pas du FALC.</div>
    </Reveal>
    <Reveal at={cue(s, "simplifier", 1, 23)} out={out} style={{ position: "absolute", left: 1020, top: 700, width: 780 }}>
      <Glass glow={C.beige} style={{ ...baseText, padding: "22px 28px", borderRadius: 22 }}>
        <div style={{ fontSize: 30, fontWeight: 700, fontFamily: "ui-monospace, Menlo, monospace" }}>› Simplifie ce texte.</div>
        <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 10, fontSize: 24, color: C.beige, fontWeight: 700 }}><IconAlert size={24} color={C.beige} />Risque : un délai ou une condition supprimé</div>
      </Glass>
    </Reveal>
  </>
);

const PromptTemplate: React.FC<{ lines: { at: number; label: string; hint: string }[]; out: number }> = ({ lines, out }) => (
  <Reveal at={0.4} out={out} style={{ position: "absolute", left: 120, right: 120, top: 330 }}>
    <Glass glow={C.violet} style={{ ...baseText, padding: "30px 40px", borderRadius: 28 }}>
      <div style={{ fontSize: 22, letterSpacing: "0.14em", textTransform: "uppercase", color: C.fg3, fontWeight: 600, marginBottom: 14 }}>Gabarit du cours</div>
      {lines.map((l) => (
        <Reveal key={l.label} at={l.at} out={out}>
          <div style={{ display: "flex", gap: 20, fontSize: 32, lineHeight: 1.5, fontFamily: "ui-monospace, Menlo, monospace" }}>
            <span style={{ color: C.violetLight, fontWeight: 700 }}>{l.label} :</span>
            <span style={{ color: C.fg2 }}>{l.hint}</span>
          </div>
        </Reveal>
      ))}
    </Glass>
  </Reveal>
);

const sc8: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="Le prompt" before="Écrire" accent="la contrainte" out={out} top={130} />
    <PromptTemplate out={out} lines={[
      { at: cue(s, "adapter", 1, 9), label: "Contenu à adapter", hint: "[le contenu, son usage]" },
      { at: cue(s, "public", 1, 11), label: "Public et besoin", hint: "[lecteur d'écran, daltonisme…]" },
      { at: cue(s, "précise", 1, 13), label: "Contrainte", hint: "[titres, texte alternatif, une idée par phrase…]" },
      { at: cue(s, "conserver", 1, 15), label: "Conserve", hint: "[informations obligatoires]" },
      { at: cue(s, "résultat", 1, 17), label: "Résultat attendu", hint: "[contenu adapté + points à valider]" },
    ]} />
    <Pill at={cue(s, "contrôle", 1, 21)} out={out} top={830}>Après génération : comparer à la source, tester le support</Pill>
  </>
);

const sc9: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="À vous" before="Passez à" accent="la pratique" out={out} top={130} />
    <CueSteps out={out} top={330} steps={[
      { at: cue(s, "playground", 1, 2), text: "Playground de la leçon : appliquer la méthode" },
      { at: cue(s, "audio", 1, 12), text: "Studio : « Du texte à l'audio »" },
      { at: cue(s, "chat", 1, 19), text: "Studio : un chat, une image, un texte alternatif" },
    ]} />
    <Reveal at={cue(s, "gemini", 1, 24)} out={out} style={{ position: "absolute", left: 700, top: 720 }}>
      <div style={{ ...baseText, display: "flex", alignItems: "center", gap: 14, fontSize: 28, color: C.fg2 }}><IconImage size={30} />Budget IA : la synthèse vocale est décomptée, le chat Gemini non</div>
    </Reveal>
  </>
);

const Recap: SceneRender = (s, out) => (
  <div style={{ position: "absolute", left: 1120, top: 220, width: 700 }}>
    <Reveal at={cue(s, "retenez", 1, 0.5) + 0.6} out={out}>
      <div style={{ ...baseText, fontSize: 24, letterSpacing: "0.14em", textTransform: "uppercase", color: C.fg3, fontWeight: 600, marginBottom: 26 }}>À retenir</div>
    </Reveal>
    <CueSteps out={out} left={0} top={70} width={700} size={34} steps={[
      { at: cue(s, "partez", 1, 2), text: "Partir du besoin réel" },
      { at: cue(s, "écrivez", 1, 5), text: "Écrire la contrainte dans le prompt" },
      { at: cue(s, "contrôlez", 1, 9), text: "Contrôler et tester" },
    ]} />
    <Reveal at={cue(s, "quiz", 1, 12)} out={out} style={{ position: "absolute", top: 520, left: 0 }}>
      <div style={{ ...baseText, padding: "20px 34px", borderRadius: 999, backgroundImage: GRAD.iris, color: C.ink, fontSize: 30, fontWeight: 700 }}>Quiz, puis leçon 3.2 : le cadre légal</div>
    </Reveal>
  </div>
);

export const Lesson31Commune: React.FC = () => (
  <LessonVideo
    manifest={manifest}
    chapters={[
      { label: "Bienvenue", sceneIds: ["1", "2", "3"] },
      { label: "Trois besoins", sceneIds: ["4", "5", "6", "7"] },
      { label: "Le prompt", sceneIds: ["8"] },
      { label: "À vous", sceneIds: ["9", "10"] },
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
      "8": sc8,
      "9": sc9,
      "10:over": Recap,
    }}
  />
);
