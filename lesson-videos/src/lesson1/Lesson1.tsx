import { Audio } from "@remotion/media";
import React from "react";
import { AbsoluteFill, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Backdrop } from "../components/Backdrop";
import { ParticleField } from "../components/ParticleField";
import { C } from "../theme";
import { Chrome } from "../components/Chrome";
import { CHAPTERS, DURATION_S, SCENES, SFX, TOOL_ROWS, cameraAt, warmthAt } from "./timeline";
import { ToolScene } from "./ToolScene";
import { ChapterTitle } from "./scenes/ChapterTitle";
import { Create } from "./scenes/Create";
import { Hallucination } from "./scenes/Hallucination";
import { Intro } from "./scenes/Intro";
import { Layers } from "./scenes/Layers";
import { Llm } from "./scenes/Llm";
import { NextToken } from "./scenes/NextToken";
import { Outro } from "./scenes/Outro";
import { Transformer } from "./scenes/Transformer";

type Key = keyof typeof SCENES;

const At: React.FC<{ k: Key; children: React.ReactNode }> = ({ k, children }) => {
  const { fps } = useVideoConfig();
  const [from, to] = SCENES[k];
  return (
    <Sequence name={k} from={Math.round(from * fps)} durationInFrames={Math.round((to - from) * fps)}>
      {children}
    </Sequence>
  );
};

// Durée d'une scène moins le temps de sa sortie (0,5 s).
const outOf = (k: Key) => SCENES[k][1] - SCENES[k][0] - 0.55;


export const Lesson1: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  return (
    <AbsoluteFill style={{ background: C.ink }}>
      <Backdrop hue={warmthAt(t)} />
      <ParticleField cam={cameraAt(t)} />

      <At k="intro">
        <Intro />
      </At>
      <At k="ch1">
        <ChapterTitle num={1} before="Situer" accent="l'IA générative" subtitle="dans le grand paysage informatique" subtitleAt={1.6} out={outOf("ch1")} />
      </At>
      <At k="layers">
        <Layers />
      </At>
      <At k="create">
        <Create />
      </At>
      <At k="ch2">
        <ChapterTitle num={2} before="Comment ça" accent="fonctionne ?" out={outOf("ch2")} />
      </At>
      <At k="llm">
        <Llm />
      </At>
      <At k="transformer">
        <Transformer />
      </At>
      <At k="nextToken">
        <NextToken />
      </At>
      <At k="ch3">
        <ChapterTitle
          num={3}
          before="Les"
          accent="limites"
          subtitle="Un calcul de probabilité, pas une compréhension du réel"
          subtitleAt={3.4}
          out={outOf("ch3")}
        />
      </At>
      <At k="halluc">
        <Hallucination />
      </At>
      <At k="ch4">
        <ChapterTitle num={4} before="Panorama" accent="des outils" out={outOf("ch4")} ring />
      </At>
      {(["chatgpt", "claude", "gemini", "copilot", "firefly"] as const).map((id) => (
        <At key={id} k={id}>
          <ToolScene toolId={id} rowsAt={TOOL_ROWS[id]} out={outOf(id)} />
        </At>
      ))}
      <At k="outro">
        <Outro />
      </At>

      <Chrome chapters={CHAPTERS} duration={DURATION_S} />
      {SFX.map((s, i) => (
        <Sequence key={i} name={`sfx ${s.src}`} from={Math.round(s.at * fps)} durationInFrames={2 * fps}>
          <Audio src={staticFile(s.src)} volume={s.volume} />
        </Sequence>
      ))}

    </AbsoluteFill>
  );
};
