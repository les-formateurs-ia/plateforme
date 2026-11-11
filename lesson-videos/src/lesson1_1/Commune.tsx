import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import manifestJson from "../generated/lesson1_1-commune.json";
import { Glass, GradText, Reveal, baseText, useExit } from "../components/ui";
import { IconAlert, IconCheck, IconClock, IconFileText, IconRepeat, IconSearch, IconSparkle, IconTarget, IconText, IconImage, IconWave, IconShield } from "../components/icons";
import { C, EASE, GRAD, clamp } from "../theme";
import { CueCards, CueSteps, NameBanner, SceneTitle, ToolLogo } from "../rs6776/kit";
import { LessonVideo, type SceneRender } from "../rs6776/LessonVideo";
import { cue, type Manifest } from "../rs6776/timeline";
import { TOOLS } from "../rs6776/tools";
import { ToolCard } from "../rs6776/ToolCard";

// Leçon 1.1 « Comprendre l'IA générative et ses usages » — vidéo commune.
// Script : docs/formation-rs6776/lecon-1.1/script-video-commune.md

export const manifest = manifestJson as unknown as Manifest;

/* ---------- scènes propres à la leçon ---------- */

const Tabs: SceneRender = (s, out) => {
  const tabs = [
    { label: "Vidéo", at: cue(s, "vidéo", 1, 1) },
    { label: "Fiche de révision", at: cue(s, "fiche", 1, 2.5) },
    { label: "Playground", at: cue(s, "playground", 1, 4.5) },
    { label: "Quiz", at: cue(s, "quiz", 1, 6) },
  ];
  return (
    <>
      <SceneTitle eyebrow="Le déroulé d'une leçon" before="Toujours le" accent="même schéma" out={out} />
      <TabsRow tabs={tabs} out={out} />
      <Reveal at={cue(s, "soixante-quinze", 1, 8)} out={out} style={{ position: "absolute", left: 0, right: 0, top: 640, display: "flex", justifyContent: "center" }}>
        <Glass glow={C.bleuVert} style={{ ...baseText, padding: "30px 56px", borderRadius: 999, display: "flex", alignItems: "center", gap: 28 }}>
          <span style={{ fontSize: 92, fontWeight: 800, letterSpacing: "-0.04em" }}><GradText>75 %</GradText></span>
          <span style={{ fontSize: 32, color: C.fg2, fontWeight: 500, maxWidth: 520, lineHeight: 1.2 }}>de bonnes réponses au quiz pour débloquer la leçon suivante</span>
        </Glass>
      </Reveal>
    </>
  );
};

const TabsRow: React.FC<{ tabs: { label: string; at: number }[]; out: number }> = ({ tabs, out }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const q = useExit(out);
  return (
    <div style={{ ...baseText, position: "absolute", top: 400, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 22, opacity: 1 - q }}>
      {tabs.map((tab, i) => {
        const p = interpolate(frame, [tab.at * fps, (tab.at + 0.6) * fps], [0, 1], { ...clamp, easing: EASE });
        const on = t >= tab.at && (tabs[i + 1] ? t < tabs[i + 1].at : true);
        return (
          <div key={tab.label} style={{ padding: "26px 44px", borderRadius: 22, fontSize: 38, fontWeight: 700, letterSpacing: "-0.02em", opacity: 0.25 + 0.75 * p, color: on ? C.ink : C.fg, backgroundImage: on ? GRAD.iris : undefined, background: on ? undefined : "rgba(255,255,255,0.05)", border: `1px solid ${on ? "transparent" : C.hairline2}`, scale: String(on ? 1.06 : 1), boxShadow: on ? `0 30px 80px -30px ${C.violet}` : "none" }}>
            {tab.label}
          </div>
        );
      })}
    </div>
  );
};

const Definition: SceneRender = (s, out) => {
  const outputsAt = cue(s, "contenu", 1, 4);
  return (
    <>
      <SceneTitle eyebrow="Définition" before="L'IA générative" accent="crée du contenu" out={out} />
      <Reveal at={cue(s, "instruction", 1, 6)} out={out} style={{ position: "absolute", left: 120, top: 400, width: 760 }}>
        <Glass glow={C.violet} style={{ ...baseText, padding: "34px 40px", borderRadius: 26 }}>
          <div style={{ fontSize: 22, letterSpacing: "0.14em", textTransform: "uppercase", color: C.fg3, fontWeight: 600 }}>Le prompt</div>
          <Typewriter text="Reformule ce texte avec un ton professionnel" at={cue(s, "prompt", 1, 8)} />
        </Glass>
      </Reveal>
      <Reveal at={outputsAt} out={out} style={{ position: "absolute", left: 940, top: 360, width: 860 }}>
        <div style={{ ...baseText, display: "flex", flexDirection: "column", gap: 20 }}>
          {[["Texte", <IconText key="t" size={40} />, C.bleuVert], ["Image", <IconImage key="i" size={40} />, C.bleu], ["Audio", <IconWave key="a" size={40} />, C.violet]].map(([l, ic, c], i) => (
            <Reveal key={l as string} at={outputsAt + 0.25 * i} out={out}>
              <Glass glow={c as string} style={{ padding: "22px 30px", borderRadius: 22, display: "flex", alignItems: "center", gap: 24 }}>
                <span style={{ color: c as string }}>{ic}</span>
                <span style={{ fontSize: 40, fontWeight: 700 }}>{l as string}</span>
                <span style={{ marginLeft: "auto", fontSize: 24, color: C.fg3 }}>contenu nouveau</span>
              </Glass>
            </Reveal>
          ))}
        </div>
      </Reveal>
      <Reveal at={cue(s, "logiciel", 1, 14)} out={out} style={{ position: "absolute", left: 120, right: 120, top: 800 }}>
        <div style={{ ...baseText, display: "flex", gap: 28, fontSize: 30, fontWeight: 600 }}>
          <div style={{ flex: 1, padding: "22px 30px", borderRadius: 20, border: `1px solid ${C.hairline2}`, color: C.fg2 }}>Logiciel classique : même procédure, même résultat</div>
          <div style={{ flex: 1, padding: "22px 30px", borderRadius: 20, backgroundImage: GRAD.iris, color: C.ink }}>IA générative : une réponse construite à chaque fois</div>
        </div>
      </Reveal>
    </>
  );
};

const Typewriter: React.FC<{ text: string; at: number }> = ({ text, at }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const n = Math.max(0, Math.floor((frame / fps - at) * 28));
  return (
    <div style={{ marginTop: 14, fontSize: 38, fontWeight: 600, lineHeight: 1.2, fontFamily: "ui-monospace, Menlo, monospace" }}>
      › {text.slice(0, n)}<span style={{ opacity: Math.floor(frame / 15) % 2 ? 1 : 0 }}>▍</span>
    </div>
  );
};

const PREDICT = [
  { w: "Le", c: [["Le", 41], ["Votre", 33], ["Ce", 26]] },
  { w: "compte-rendu", c: [["compte-rendu", 46], ["rapport", 31], ["document", 23]] },
  { w: "vous", c: [["vous", 52], ["sera", 30], ["est", 18]] },
  { w: "sera", c: [["sera", 61], ["est", 24], ["a", 15]] },
  { w: "transmis", c: [["transmis", 55], ["envoyé", 32], ["remis", 13]] },
  { w: "après", c: [["dans", 36], ["après", 34], ["cette", 30]] },
  { w: "validation.", c: [["validation.", 58], ["relecture.", 27], ["signature.", 15]] },
] as const;

const Prediction: SceneRender = (s, out) => <PredictionInner start={cue(s, "morceau", 1, 3)} fluide={cue(s, "fluide", 1, 10)} out={out} />;

const PredictionInner: React.FC<{ start: number; fluide: number; out: number }> = ({ start, fluide, out }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const step = 0.95;
  const n = Math.max(0, Math.min(PREDICT.length, Math.floor((t - start) / step) + 1));
  const cur = PREDICT[Math.min(n, PREDICT.length - 1)];
  const q = useExit(out);
  const tints = [C.violet, C.bleu, C.bleuVert, C.beige, C.violetLight];
  return (
    <AbsoluteFill style={{ ...baseText, opacity: 1 - q }}>
      <SceneTitle eyebrow="Comment elle répond" before="Morceau par morceau," accent="la suite probable" out={out} />
      <div style={{ position: "absolute", left: 120, right: 120, top: 380, fontSize: 64, fontWeight: 700, letterSpacing: "-0.03em", display: "flex", flexWrap: "wrap", gap: "10px 18px" }}>
        {PREDICT.slice(0, n).map((p, i) => (
          <span key={i} style={{ padding: "4px 16px", borderRadius: 16, background: `${tints[i % 5]}33` }}>{p.w}</span>
        ))}
        {n < PREDICT.length && <span style={{ width: 8, height: 70, background: C.fg, opacity: Math.floor(frame / 15) % 2 ? 1 : 0.2 }} />}
      </div>
      {n < PREDICT.length && t > start && (
        <div style={{ position: "absolute", left: 120, top: 560, width: 820 }}>
          <div style={{ fontSize: 22, letterSpacing: "0.14em", textTransform: "uppercase", color: C.fg3, fontWeight: 600, marginBottom: 16 }}>Prochain mot · illustration</div>
          {cur.c.map(([w, p], i) => (
            <div key={w} style={{ display: "grid", gridTemplateColumns: "260px 1fr 90px", alignItems: "center", gap: 20, marginBottom: 14, fontSize: 32 }}>
              <span style={{ color: i === 0 ? C.fg : C.fg2 }}>{w}</span>
              <span style={{ height: 14, borderRadius: 14, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
                <span style={{ display: "block", height: "100%", width: `${p}%`, borderRadius: 14, backgroundImage: i === 0 ? GRAD.iris : undefined, background: i === 0 ? undefined : C.fg3 }} />
              </span>
              <span style={{ color: C.fg3, textAlign: "right" }}>{p} %</span>
            </div>
          ))}
        </div>
      )}
      <Reveal at={fluide} out={out} style={{ position: "absolute", right: 120, top: 600 }}>
        <Glass glow={C.beige} style={{ padding: "36px 46px", borderRadius: 28, maxWidth: 680 }}>
          <div style={{ fontSize: 46, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.1 }}>Fluide <span style={{ color: C.beige }}>≠</span> exact</div>
          <div style={{ marginTop: 12, fontSize: 28, color: C.fg2 }}>Elle prédit, elle ne vérifie pas.</div>
        </Glass>
      </Reveal>
    </AbsoluteFill>
  );
};

const Notions: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="Trois notions" before="Ce qui explique" accent="son comportement" out={out} />
    <CueCards out={out} cards={[
      { at: cue(s, "tokens", 1, 3), title: "Tokens", text: "Des fragments de texte. Ils mesurent la longueur d'un échange, et parfois son coût.", icon: <IconFileText size={40} />, tint: C.bleuVert },
      { at: cue(s, "fenêtre", 1, 10), title: "Fenêtre de contexte", text: "Une quantité de texte limitée. Rappelez l'essentiel avant une tâche importante.", icon: <IconSearch size={40} />, tint: C.bleu },
      { at: cue(s, "variabilité", 1, 20), title: "Variabilité", text: "Même prompt, autre réponse. Régénérer n'est pas corriger.", icon: <IconRepeat size={40} />, tint: C.violet },
    ]} />
  </>
);

const Hallucination: SceneRender = (s, out) => {
  const stampAt = cue(s, "hallucination", 1, 3);
  return (
    <>
      <SceneTitle eyebrow="La limite principale" before="L'" accent="hallucination" out={out} />
      <Reveal at={stampAt} out={out} style={{ position: "absolute", left: 120, top: 380, width: 1000 }}>
        <Glass glow={C.beige} style={{ ...baseText, padding: "34px 40px", borderRadius: 26 }}>
          <div style={{ fontSize: 26, color: C.fg3 }}>« Date du prochain comité de pilotage ? »</div>
          <div style={{ marginTop: 14, fontSize: 40, fontWeight: 700 }}>« Le 3 avril à 10 h, en visioconférence. »</div>
          <Stamp at={cue(s, "plausible", 1, stampAt + 2)} />
        </Glass>
      </Reveal>
      <CueCards out={out} top={700} height={250} cards={[
        { at: cue(s, "transformer", 1, 14), title: "Fiable", text: "Transformer un texte que vous fournissez", icon: <IconCheck size={36} />, tint: C.bleuVert },
        { at: cue(s, "vérifiez", 1, 22), title: "À vérifier", text: "Tout fait que vous ne lui avez pas donné", icon: <IconAlert size={36} />, tint: C.beige },
      ]} />
    </>
  );
};

const Stamp: React.FC<{ at: number }> = ({ at }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = interpolate(frame, [at * fps, (at + 0.35) * fps], [0, 1], { ...clamp, easing: EASE });
  return (
    <div style={{ position: "absolute", right: 34, top: -26, padding: "10px 24px", borderRadius: 999, background: C.beige, color: C.ink, fontWeight: 800, fontSize: 26, letterSpacing: "0.1em", textTransform: "uppercase", opacity: p, scale: String(1.6 - 0.6 * p), rotate: "-6deg" }}>Inventé</div>
  );
};

const ToolsIntro: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="Panorama" before="Cinq outils" accent="de référence" out={out} />
    <div style={{ ...baseText, position: "absolute", left: 0, right: 0, top: 430, display: "flex", justifyContent: "center", gap: 64 }}>
      {TOOLS.map((t) => (
        <Reveal key={t.id} at={cue(s, t.name, 1, 4)} out={out}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 22 }}>
            <ToolLogo src={t.logo} size={150} glow={t.accent} />
            <div style={{ fontSize: 36, fontWeight: 700 }}>{t.name}</div>
            <div style={{ fontSize: 22, color: ["chatgpt", "claude", "gemini"].includes(t.id) ? C.bleuVert : C.fg3, fontWeight: 600 }}>{["chatgpt", "claude", "gemini"].includes(t.id) ? "Dans le Studio" : "Sur son site"}</div>
          </div>
        </Reveal>
      ))}
    </div>
  </>
);

const TOOL_CUES: Record<string, [string, string, string, string]> = {
  chatgpt: ["brille", "assistants", "web", "gratuite"],
  claude: ["excelle", "analyser", "rigueur", "gratuit"],
  gemini: ["force", "idéal", "intégration", "gratuite"],
  copilot: ["atout", "rédiger", "Teams", "gratuitement"],
  firefly: ["génère", "ajouter", "intégré", "gratuit"],
};

const toolScene = (id: string): SceneRender => (s, out) => {
  const d = s.duration;
  const fb = [1.2, d * 0.3, d * 0.55, d * 0.75];
  const rows = TOOL_CUES[id].map((w, i) => cue(s, w, 1, fb[i]));
  // l'ordre d'apparition suit les lignes de la fiche, jamais en arrière
  for (let i = 1; i < rows.length; i++) rows[i] = Math.max(rows[i], rows[i - 1] + 0.6);
  rows[0] = Math.min(rows[0], 1.6);
  return <ToolCard toolId={id} rowsAt={rows} out={out} />;
};

const Choose: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="Comment choisir" before="Pas un classement :" accent="un contexte" out={out} />
    <CueCards out={out} top={380} height={300} cards={[
      { at: cue(s, "besoin", 1, 3), title: "Votre besoin", icon: <IconTarget size={36} />, tint: C.violet },
      { at: cue(s, "environnement", 1, 5), title: "L'environnement en place", icon: <IconSparkle size={36} />, tint: C.bleu },
      { at: cue(s, "autorise", 1, 8), title: "Ce que l'entreprise autorise", icon: <IconShield size={36} />, tint: C.bleuVert },
    ]} />
    <Reveal at={cue(s, "exercice", 1, 15)} out={out} style={{ position: "absolute", left: 0, right: 0, top: 760, display: "flex", justifyContent: "center" }}>
      <div style={{ ...baseText, padding: "22px 40px", borderRadius: 999, backgroundImage: GRAD.iris, color: C.ink, fontSize: 32, fontWeight: 700 }}>Exercice 1 de l'écrit : justifier chaque outil et chiffrer son budget</div>
    </Reveal>
  </>
);

const YourTurn: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="À vous" before="Passez à" accent="la pratique" out={out} top={130} />
    <CueSteps out={out} top={330} steps={[
      { at: cue(s, "playground", 1, 2), text: "Playground : voir, comparer, associer" },
      { at: cue(s, "studio", 1, 10), text: "Studio : une question, trois assistants" },
      { at: cue(s, "battle", 1, 16), text: "Battle Ground : gamme Rapide, défi « Piège »" },
    ]} />
    <Reveal at={cue(s, "copilot", 1, 22)} out={out} style={{ position: "absolute", left: 790, top: 760 }}>
      <div style={{ ...baseText, display: "flex", alignItems: "center", gap: 14, fontSize: 28, color: C.fg2 }}><IconClock size={30} />Copilot et Firefly : sur leur site, à la leçon 1.3</div>
    </Reveal>
  </>
);

const Recap: SceneRender = (s, out) => (
  <div style={{ position: "absolute", left: 1120, top: 220, width: 700 }}>
    <Reveal at={cue(s, "retenez", 1, 0.5) + 0.6} out={out}>
      <div style={{ ...baseText, fontSize: 24, letterSpacing: "0.14em", textTransform: "uppercase", color: C.fg3, fontWeight: 600, marginBottom: 26 }}>À retenir</div>
    </Reveal>
    <CueSteps out={out} left={0} top={70} width={700} size={34} steps={[
      { at: cue(s, "prédit", 1, 3), text: "Elle prédit, elle ne vérifie pas" },
      { at: cue(s, "tokens", 1, 6), text: "Tokens, contexte, variabilité" },
      { at: cue(s, "choix", 1, 10), text: "Le contexte choisit l'outil" },
    ]} />
    <Reveal at={cue(s, "quiz", 1, 14)} out={out} style={{ position: "absolute", top: 520, left: 0 }}>
      <div style={{ ...baseText, padding: "20px 34px", borderRadius: 999, backgroundImage: GRAD.iris, color: C.ink, fontSize: 30, fontWeight: 700 }}>Quiz, puis leçon 1.2 : analyser votre poste</div>
    </Reveal>
  </div>
);

export const Lesson11Commune: React.FC = () => (
  <LessonVideo
    manifest={manifest}
    chapters={[
      { label: "Bienvenue", sceneIds: ["1", "2", "3", "4"] },
      { label: "Comprendre", sceneIds: ["5", "6", "7", "8"] },
      { label: "Les outils", sceneIds: ["9", "9a", "9b", "9c", "9d", "9e", "9f"] },
      { label: "À vous", sceneIds: ["10", "11"] },
    ]}
    shrinkAt={{ "11": cue(manifest.scenes.find((x) => x.id === "11")!, "retenez", 1, 0.5) + 0.2 }}
    render={{
      "1:over": () => <NameBanner />,
      "2": (s, out) => (
        <>
          <SceneTitle eyebrow="La formation" before="Trois modules," accent="une certification" out={out} />
          <CueCards out={out} cols={4} height={260} top={400} cards={[
            { at: cue(s, "comprendre", 1, 2), kicker: "Module 1", title: "Comprendre et planifier", tint: C.violet },
            { at: cue(s, "rédiger", 1, 5), kicker: "Module 2", title: "Prompts et contenus", tint: C.bleu },
            { at: cue(s, "accessibles", 1, 8), kicker: "Module 3", title: "Accessible et conforme", tint: C.bleuVert },
            { at: cue(s, "certification", 1, 10), kicker: "RS6776", title: "Écrit + soutenance orale", tint: C.beige },
          ]} />
        </>
      ),
      "3": Tabs,
      "5": Definition,
      "6": Prediction,
      "7": Notions,
      "8": Hallucination,
      "9": ToolsIntro,
      "9a": toolScene("chatgpt"),
      "9b": toolScene("claude"),
      "9c": toolScene("gemini"),
      "9d": toolScene("copilot"),
      "9e": toolScene("firefly"),
      "9f": Choose,
      "10": YourTurn,
      "11:over": Recap,
    }}
  />
);
