import React from "react";
import manifestJson from "../generated/lesson1_4-commune.json";
import { Glass, Reveal, baseText } from "../components/ui";
import { IconAlert, IconBriefcase, IconEye, IconLock, IconScan, IconSearch, IconShield, IconTarget, IconUser } from "../components/icons";
import { C, GRAD } from "../theme";
import { CueCards, CueSteps, NameBanner, SceneTitle } from "../rs6776/kit";
import { LessonVideo, type SceneRender } from "../rs6776/LessonVideo";
import { cue, type Manifest } from "../rs6776/timeline";

// Leçon 1.4 « Reconnaître les informations à protéger » — vidéo commune.
// Script : docs/formation-rs6776/lecon-1.4/script-video-commune.md

export const manifest = manifestJson as unknown as Manifest;

const Pill: React.FC<{ at: number; out: number; top: number; children: React.ReactNode }> = ({ at, out, top, children }) => (
  <Reveal at={at} out={out} style={{ position: "absolute", left: 0, right: 0, top, display: "flex", justifyContent: "center" }}>
    <div style={{ ...baseText, padding: "22px 40px", borderRadius: 999, backgroundImage: GRAD.iris, color: C.ink, fontSize: 32, fontWeight: 700 }}>{children}</div>
  </Reveal>
);

const Chip: React.FC<{ at: number; out: number; tint: string; children: React.ReactNode }> = ({ at, out, tint, children }) => (
  <Reveal at={at} out={out}>
    <div style={{ ...baseText, padding: "14px 26px", borderRadius: 999, fontSize: 30, fontWeight: 600, background: `${tint}1f`, border: `1px solid ${tint}88` }}>{children}</div>
  </Reveal>
);

const Objective: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="Objectif de la leçon" before="Savoir ce qui" accent="mérite protection" out={out} />
    <CueCards out={out} top={380} height={280} cards={[
      { at: cue(s, "nature", 1, 3), title: "La nature de l'information", icon: <IconSearch size={38} />, tint: C.violet },
      { at: cue(s, "juridique", 1, 7), title: "Le sens juridique de « sensible »", icon: <IconShield size={38} />, tint: C.bleu },
      { at: cue(s, "provenance", 1, 9), title: "Sa provenance : interne ou externe", icon: <IconEye size={38} />, tint: C.bleuVert },
    ]} />
    <Pill at={cue(s, "exercice", 1, 12)} out={out} top={740}>Exercice 3 de l'écrit : la confidentialité des données</Pill>
  </>
);

const Families: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="Informations à protéger" before="Trois familles" accent="qui se cumulent" out={out} />
    <CueCards out={out} top={340} height={360} cards={[
      { at: cue(s, "personnelle", 1, 8), title: "Donnée personnelle", text: "Identifie ou permet d'identifier une personne : nom, coordonnées, santé, rémunération.", icon: <IconUser size={36} />, tint: C.violet },
      { at: cue(s, "confidentielle", 1, 15), title: "Information confidentielle", text: "Couverte par un engagement de discrétion : contrat en négociation, dossier client.", icon: <IconLock size={36} />, tint: C.beige },
      { at: cue(s, "stratégique", 1, 24), title: "Information stratégique", text: "La position d'une structure : chiffres non publiés, méthode interne, projet non annoncé.", icon: <IconTarget size={36} />, tint: C.bleu },
    ]} />
    <Pill at={cue(s, "cumulent", 1, 32)} out={out} top={760}>Compte rendu d'entretien annuel : personnel et confidentiel</Pill>
  </>
);

const Sensitive: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="Le vocabulaire juridique" before="« Sensible »," accent="au sens de l'article 9" out={out} />
    <div style={{ position: "absolute", left: 120, top: 340, width: 1080, display: "flex", flexWrap: "wrap", gap: 16 }}>
      <Chip at={cue(s, "origine", 1, 8)} out={out} tint={C.violet}>Origine raciale ou ethnique</Chip>
      <Chip at={cue(s, "opinions", 1, 10)} out={out} tint={C.violet}>Opinions politiques</Chip>
      <Chip at={cue(s, "convictions", 1, 11)} out={out} tint={C.violet}>Convictions religieuses ou philosophiques</Chip>
      <Chip at={cue(s, "appartenance", 1, 13)} out={out} tint={C.violet}>Appartenance syndicale</Chip>
      <Chip at={cue(s, "génétiques", 1, 15)} out={out} tint={C.violet}>Données génétiques ou biométriques</Chip>
      <Chip at={cue(s, "santé", 1, 17)} out={out} tint={C.violet}>Santé</Chip>
      <Chip at={cue(s, "vie", 1, 18)} out={out} tint={C.violet}>Vie ou orientation sexuelle</Chip>
    </div>
    <Reveal at={cue(s, "tarif", 1, 21)} out={out} style={{ position: "absolute", left: 1260, top: 340, width: 540 }}>
      <Glass glow={C.beige} style={{ ...baseText, padding: "30px 34px", borderRadius: 26 }}>
        <div style={{ fontSize: 34, fontWeight: 700, textDecoration: "line-through", textDecorationColor: C.beige }}>Un tarif, un secret d'affaires</div>
        <div style={{ marginTop: 12, fontSize: 26, color: C.fg2 }}>À protéger, mais pas « sensible » au sens de l'article 9.</div>
      </Glass>
    </Reveal>
    <Reveal at={cue(s, "croisement", 1, 26)} out={out} style={{ position: "absolute", left: 120, right: 120, top: 760 }}>
      <div style={{ ...baseText, display: "flex", alignItems: "center", gap: 16, fontSize: 32, fontWeight: 600 }}>
        <IconScan size={36} color={C.bleu} />Prénom seul : personne · prénom + date de naissance + salaire + santé : quelqu'un
      </div>
    </Reveal>
  </>
);

const Provenance: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="Deuxième question" before="D'où vient" accent="l'information ?" out={out} />
    <div style={{ ...baseText, position: "absolute", left: 120, right: 120, top: 350, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
      <Reveal at={cue(s, "interne", 1, 4)} out={out}>
        <Glass glow={C.violet} style={{ padding: "32px 38px", borderRadius: 28, height: 280 }}>
          <div style={{ fontSize: 44, fontWeight: 800, color: C.violet }}>Interne</div>
          <div style={{ marginTop: 10, fontSize: 30, color: C.fg2 }}>Votre structure : stratégie, finances, personnel.</div>
          <div style={{ marginTop: 18, fontSize: 26, color: C.fg3 }}>Une fuite affaiblit d'abord la structure.</div>
        </Glass>
      </Reveal>
      <Reveal at={cue(s, "externe", 1, 10)} out={out}>
        <Glass glow={C.bleu} style={{ padding: "32px 38px", borderRadius: 28, height: 280 }}>
          <div style={{ fontSize: 44, fontWeight: 800, color: C.bleu }}>Externe</div>
          <div style={{ marginTop: 10, fontSize: 30, color: C.fg2 }}>Un tiers : client, prospect, candidat, fournisseur.</div>
          <div style={{ marginTop: 18, fontSize: 26, color: C.fg3 }}>Une fuite engage aussi votre responsabilité.</div>
        </Glass>
      </Reveal>
    </div>
    <div style={{ position: "absolute", left: 120, right: 120, top: 700, display: "flex", justifyContent: "center", gap: 18 }}>
      <Chip at={cue(s, "nature", 1, 26)} out={out} tint={C.violetLight}>Nature</Chip>
      <Chip at={cue(s, "provenance", 1, 27)} out={out} tint={C.violetLight}>Provenance</Chip>
      <Chip at={cue(s, "finalité", 1, 28)} out={out} tint={C.violetLight}>Finalité</Chip>
      <Chip at={cue(s, "destinataires", 1, 29)} out={out} tint={C.violetLight}>Destinataires</Chip>
    </div>
    <Reveal at={cue(s, "réutilisable", 1, 23)} out={out} style={{ position: "absolute", left: 0, right: 0, top: 820, display: "flex", justifyContent: "center" }}>
      <div style={{ ...baseText, fontSize: 30, color: C.beige, fontWeight: 700 }}>Interne ne veut pas dire librement réutilisable</div>
    </Reveal>
  </>
);

const Sentence: SceneRender = (s, out) => {
  const tags = [
    { at: cue(s, "julien", 2, 16), text: "Julien Blanc · arrêt médical", kind: "Personnelle · interne", tint: C.violet },
    { at: cue(s, "sophie", 2, 20), text: "Le salaire de Sophie Roux", kind: "Personnelle · interne", tint: C.violet },
    { at: cue(s, "client", 2, 24), text: "Client Meranto · montant du contrat", kind: "Confidentielle · externe", tint: C.bleu },
  ];
  return (
    <>
      <SceneTitle eyebrow="Une phrase, trois informations" before="Lire" accent="élément par élément" out={out} />
      <Reveal at={0.6} out={out} style={{ position: "absolute", left: 120, right: 120, top: 330 }}>
        <Glass glow={C.violet} style={{ ...baseText, padding: "28px 36px", borderRadius: 26 }}>
          <div style={{ fontSize: 22, letterSpacing: "0.14em", textTransform: "uppercase", color: C.fg3, fontWeight: 600 }}>Exemple fictif du cours</div>
          <div style={{ marginTop: 12, fontSize: 30, lineHeight: 1.35, color: C.fg2 }}>« Informer l'équipe que Julien Blanc, en arrêt pour raisons médicales, sera remplacé par Sophie Roux, dont le salaire vient d'être revalorisé, sur les dossiers du client Meranto… »</div>
        </Glass>
      </Reveal>
      <div style={{ ...baseText, position: "absolute", left: 120, right: 120, top: 600, display: "flex", flexDirection: "column", gap: 16 }}>
        {tags.map((t) => (
          <Reveal key={t.text} at={t.at} out={out}>
            <div style={{ display: "flex", alignItems: "center", gap: 22, fontSize: 34, fontWeight: 600 }}>
              <span style={{ padding: "6px 18px", borderRadius: 12, background: `${t.tint}33`, borderBottom: `3px solid ${t.tint}` }}>{t.text}</span>
              <span style={{ fontSize: 26, color: t.tint, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>{t.kind}</span>
            </div>
          </Reveal>
        ))}
      </div>
    </>
  );
};

const Risks: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="Les risques concrets" before="Rarement un piratage," accent="souvent un oubli" out={out} />
    <CueCards out={out} cols={4} top={350} height={250} cards={[
      { at: cue(s, "inadvertance", 1, 4), title: "Fuite vers l'extérieur", icon: <IconAlert size={34} />, tint: C.beige },
      { at: cue(s, "rompu", 1, 7), title: "Engagement rompu", icon: <IconLock size={34} />, tint: C.beige },
      { at: cue(s, "exposée", 1, 10), title: "Exposition disproportionnée", icon: <IconEye size={34} />, tint: C.beige },
      { at: cue(s, "confiance", 1, 14), title: "Perte de confiance", icon: <IconBriefcase size={34} />, tint: C.beige },
    ]} />
    <Pill at={cue(s, "canal", 1, 17)} out={out} top={680}>Un outil d'IA : un canal de plus à évaluer</Pill>
    <Reveal at={cue(s, "saisie", 1, 27)} out={out} style={{ position: "absolute", left: 0, right: 0, top: 800, display: "flex", justifyContent: "center" }}>
      <div style={{ ...baseText, fontSize: 30, color: C.fg2 }}>Identifier · minimiser · vérifier l'outil, l'offre, les réglages, l'autorisation</div>
    </Reveal>
  </>
);

const Fragments: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="Lire par fragments" before="La règle" accent="la plus protectrice" out={out} />
    <Reveal at={cue(s, "document", 1, 1)} out={out} style={{ position: "absolute", left: 120, top: 340, width: 760 }}>
      <Glass style={{ ...baseText, padding: "28px 34px", borderRadius: 26, display: "flex", flexDirection: "column", gap: 14 }}>
        {[["Contenu public", C.bleuVert], ["Interne banal", C.bleu], ["Donnée personnelle", C.violet], ["Tarif confidentiel", C.beige]].map(([l, c]) => (
          <div key={l} style={{ padding: "14px 20px", borderRadius: 14, background: `${c}1c`, borderLeft: `6px solid ${c}`, fontSize: 30, fontWeight: 600 }}>{l}</div>
        ))}
      </Glass>
    </Reveal>
    <CueSteps out={out} left={960} top={350} width={860} size={34} steps={[
      { at: cue(s, "identifie-t-il", 1, 14), text: "Identifie-t-il quelqu'un ?" },
      { at: cue(s, "couvert", 1, 16), text: "Est-il couvert par la discrétion ?" },
      { at: cue(s, "appartient-il", 1, 18), text: "À qui appartient-il ?" },
    ]} />
    <Pill at={cue(s, "protectrice", 1, 20)} out={out} top={800}>Appliquez la règle la plus protectrice</Pill>
  </>
);

const YourTurn: SceneRender = (s, out) => (
  <>
    <SceneTitle eyebrow="À vous" before="Passez à" accent="la pratique" out={out} top={130} />
    <CueSteps out={out} top={330} steps={[
      { at: cue(s, "playground", 1, 2), text: "Playground : repérer les informations à protéger" },
      { at: cue(s, "mini-jeux", 1, 8), text: "Mini-jeux du cours : lire par fragments" },
      { at: cue(s, "crash", 1, 14), text: "Copilote : « Crash test 2 min »" },
    ]} />
  </>
);

const Recap: SceneRender = (s, out) => (
  <div style={{ position: "absolute", left: 1120, top: 220, width: 700 }}>
    <Reveal at={cue(s, "retenez", 1, 0.5) + 0.6} out={out}>
      <div style={{ ...baseText, fontSize: 24, letterSpacing: "0.14em", textTransform: "uppercase", color: C.fg3, fontWeight: 600, marginBottom: 26 }}>À retenir</div>
    </Reveal>
    <CueSteps out={out} left={0} top={70} width={700} size={34} steps={[
      { at: cue(s, "familles", 1, 3), text: "Personnelle, confidentielle, stratégique" },
      { at: cue(s, "sensible", 1, 7), text: "Sensible : l'article 9, pas plus" },
      { at: cue(s, "provenance", 1, 10), text: "Interne ou externe, fragment par fragment" },
    ]} />
    <Reveal at={cue(s, "quiz", 1, 14)} out={out} style={{ position: "absolute", top: 520, left: 0 }}>
      <div style={{ ...baseText, padding: "20px 34px", borderRadius: 999, backgroundImage: GRAD.iris, color: C.ink, fontSize: 30, fontWeight: 700 }}>Quiz, puis leçon 1.5 : les protéger</div>
    </Reveal>
  </div>
);

const Banner: SceneRender = () => <NameBanner />;

export const Lesson14Commune: React.FC = () => (
  <LessonVideo
    manifest={manifest}
    chapters={[
      { label: "Ce qu'on protège", sceneIds: ["1", "2", "3", "4"] },
      { label: "Provenance", sceneIds: ["5", "6"] },
      { label: "Risques", sceneIds: ["7", "8"] },
      { label: "À vous", sceneIds: ["9", "10"] },
    ]}
    shrinkAt={{ "10": cue(manifest.scenes.find((x) => x.id === "10")!, "retenez", 1, 0.5) + 0.2 }}
    render={{
      "1:over": Banner,
      "2": Objective,
      "3": Families,
      "4": Sensitive,
      "5": Provenance,
      "6": Sentence,
      "7": Risks,
      "8": Fragments,
      "9": YourTurn,
      "10:over": Recap,
    }}
  />
);
