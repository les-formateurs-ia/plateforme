import React from "react";
import manifestJson from "../generated/lesson3_2-nathalie.json";
import { Glass, Reveal, baseText } from "../components/ui";
import { IconAlert, IconCheck, IconFileText, IconSearch } from "../components/icons";
import { C, GRAD } from "../theme";
import { CueSteps, NameBanner, SceneTitle } from "../rs6776/kit";
import { LessonVideo, type SceneRender } from "../rs6776/LessonVideo";
import { cue, type Manifest } from "../rs6776/timeline";

// Leçon 3.2 — vidéo personnalisée de Nathalie (consultante SIRH).
// Script : docs/formation-rs6776/lecon-3.2/script-video-nathalie.md

export const manifest = manifestJson as unknown as Manifest;

const Fictif: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ fontSize: 22, letterSpacing: "0.14em", textTransform: "uppercase", color: C.fg3, fontWeight: 600 }}>{children} · exemple fictif</div>
);

const sc2: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="L'option de notation" before="Un usage" accent="à haut risque" out={out} />
    <Reveal at={cue(s, "option", 1, 3)} out={out} style={{ position: "absolute", left: 120, top: 350, width: 900 }}>
      <Glass glow={C.beige} style={{ ...baseText, padding: "32px 38px", borderRadius: 28 }}>
        <Fictif>Logiciel de recrutement · réglages</Fictif>
        <div style={{ marginTop: 20, display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 34, fontWeight: 700 }}>
          Option : notation IA des candidatures
          <span style={{ width: 96, height: 52, borderRadius: 99, background: C.beige, position: "relative" }}><span style={{ position: "absolute", right: 6, top: 6, width: 40, height: 40, borderRadius: 99, background: C.ink }} /></span>
        </div>
        <Reveal at={cue(s, "haut", 1, 8)} out={out}>
          <div style={{ marginTop: 22, display: "inline-flex", alignItems: "center", gap: 12, padding: "12px 24px", borderRadius: 999, background: `${C.beige}26`, border: `1px solid ${C.beige}`, color: C.beige, fontSize: 28, fontWeight: 800 }}><IconAlert size={28} color={C.beige} />Haut risque · à qualifier</div>
        </Reveal>
      </Glass>
    </Reveal>
    <div style={{ ...baseText, position: "absolute", left: 1100, right: 120, top: 360, display: "flex", flexDirection: "column", gap: 18 }}>
      {[["finalité", "Finalité prévue"], ["fonctionnement", "Fonctionnement réel"], ["fournisseur", "Fournisseur ou déployeur ?"], ["six", "Puis l'article 6"]].map(([w, l], i) => (
        <Reveal key={l} at={cue(s, w, 1, 11 + i * 2)} out={out}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "18px 24px", borderRadius: 20, border: `1px solid ${C.hairline2}`, fontSize: 30, fontWeight: 600 }}><IconSearch size={28} />{l}</div>
        </Reveal>
      ))}
    </div>
  </>
);

const sc3: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="Le seuil de rejet" before="Deux analyses" accent="qui se croisent" out={out} />
    <div style={{ ...baseText, position: "absolute", left: 120, right: 120, top: 350, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28 }}>
      <Reveal at={cue(s, "rejet", 1, 2)} out={out}>
        <Glass glow={C.beige} style={{ padding: "32px 38px", borderRadius: 26, height: 330 }}>
          <Fictif>À corriger</Fictif>
          <div style={{ marginTop: 16, fontSize: 36, fontWeight: 800 }}>Note sous le seuil → rejet sans relecture</div>
          <div style={{ marginTop: 16, fontSize: 27, color: C.fg2 }}>Supervision effective (IA Act) et article 22 du RGPD à analyser</div>
        </Glass>
      </Reveal>
      <Reveal at={cue(s, "alternative", 1, 18)} out={out}>
        <Glass glow={C.bleuVert} style={{ padding: "32px 38px", borderRadius: 26, height: 330 }}>
          <Fictif>À proposer</Fictif>
          <div style={{ marginTop: 16, fontSize: 36, fontWeight: 800 }}>Le score trie l'affichage</div>
          <div style={{ marginTop: 16, fontSize: 27, color: C.fg2 }}>Le recruteur examine chaque CV avant toute décision</div>
        </Glass>
      </Reveal>
    </div>
    <Reveal at={cue(s, "garanties", 1, 12)} out={out} style={{ position: "absolute", left: 120, right: 120, top: 740 }}>
      <div style={{ ...baseText, fontSize: 30, color: C.fg2 }}>Si l'article 22 s'applique : exception mobilisée, garanties, intervention humaine, contestation.</div>
    </Reveal>
  </>
);

const sc4: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="Les réglages par défaut" before="Les lire" accent="avant de livrer" out={out} top={130} />
    <CueSteps out={out} left={120} top={320} width={1100} size={36} steps={[
      { at: cue(s, "données", 1, 5), text: "Seulement les données utiles au poste" },
      { at: cue(s, "durée", 1, 8), text: "Une durée de conservation fixée" },
      { at: cue(s, "candidats", 1, 12), text: "Candidats informés, intervention humaine possible" },
      { at: cue(s, "biais", 1, 16), text: "Biais recherchés" },
    ]} />
    <Reveal at={cue(s, "congé", 1, 20)} out={out} style={{ position: "absolute", left: 1260, top: 330, width: 540 }}>
      <Glass glow={C.beige} style={{ ...baseText, padding: "26px 30px", borderRadius: 24 }}>
        <Fictif>Playground</Fictif>
        <div style={{ marginTop: 12, fontSize: 28, fontWeight: 600, lineHeight: 1.3 }}>Un commentaire généré sur un congé parental</div>
        <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 10, fontSize: 24, color: C.beige, fontWeight: 700 }}><IconAlert size={24} color={C.beige} />Biais discriminant</div>
      </Glass>
    </Reveal>
  </>
);

const sc5: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="Votre trace de veille" before="Une recommandation" accent="vérifiable" out={out} />
    <Reveal at={cue(s, "recommandation", 1, 1)} out={out} style={{ position: "absolute", left: 120, top: 350, width: 980 }}>
      <Glass glow={C.violet} style={{ ...baseText, padding: "32px 40px", borderRadius: 28 }}>
        <Fictif>Note au client</Fictif>
        {[["source", "Source officielle"], ["lien", "Lien"], ["consultation", "Date de consultation"], ["version", "Version et statut"]].map(([w, l], i) => (
          <Reveal key={l} at={cue(s, w, 1, 4 + i * 1.5)} out={out}>
            <div style={{ display: "flex", alignItems: "center", gap: 18, marginTop: 14, fontSize: 32, fontWeight: 600 }}>
              <IconCheck size={28} color={C.bleuVert} /><span style={{ minWidth: 380 }}>{l}</span><span style={{ flex: 1, height: 2, background: C.hairline2 }} />
            </div>
          </Reveal>
        ))}
      </Glass>
    </Reveal>
    <div style={{ ...baseText, position: "absolute", left: 1160, right: 120, top: 360, display: "flex", flexDirection: "column", gap: 22 }}>
      <Reveal at={cue(s, "échéances", 1, 12)} out={out}>
        <div style={{ padding: "22px 26px", borderRadius: 22, border: `1px solid ${C.beige}66`, background: `${C.beige}14`, fontSize: 28, fontWeight: 600 }}>Les échéances peuvent bouger : revérifier avant d'activer</div>
      </Reveal>
      <Reveal at={cue(s, "brouillon", 1, 18)} out={out}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "22px 26px", borderRadius: 22, border: `1px solid ${C.hairline2}`, fontSize: 28, fontWeight: 600 }}><IconFileText size={30} />L'IA : un brouillon. La conclusion : la vôtre.</div>
      </Reveal>
    </div>
  </>
);

const sc6: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="À vous" before="Votre" accent="Playground" out={out} top={130} />
    <CueSteps out={out} top={330} steps={[
      { at: cue(s, "tarnaud", 1, 2), text: "Tarnaud Logistique, entreprise fictive" },
      { at: cue(s, "qualifierez", 1, 6), text: "Options, paramétrages, bon prompt" },
      { at: cue(s, "configuration", 1, 10), text: "Une configuration à corriger, à remettre" },
    ]} />
    <Reveal at={cue(s, "mission", 1, 12)} out={out} style={{ position: "absolute", left: 700, top: 720 }}>
      <div style={{ ...baseText, padding: "18px 32px", borderRadius: 999, backgroundImage: GRAD.iris, color: C.ink, fontSize: 28, fontWeight: 700 }}>Ensuite : la mission finale</div>
    </Reveal>
  </>
);

export const Lesson32Nathalie: React.FC = () => (
  <LessonVideo
    manifest={manifest}
    chapters={[
      { label: "Vos paramétrages", sceneIds: ["1", "2", "3", "4"] },
      { label: "Votre veille", sceneIds: ["5"] },
      { label: "À vous", sceneIds: ["6"] },
    ]}
    render={{
      "1:over": () => <NameBanner />,
      "2": sc2,
      "3": sc3,
      "4": sc4,
      "5": sc5,
      "6": sc6,
    }}
  />
);
