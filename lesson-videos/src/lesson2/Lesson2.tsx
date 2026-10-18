import { Audio } from "@remotion/media";
import React from "react";
import { AbsoluteFill, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Backdrop } from "../components/Backdrop";
import { Chrome } from "../components/Chrome";
import { ParticleField } from "../components/ParticleField";
import { ChapterTitle } from "../lesson1/scenes/ChapterTitle";
import { C } from "../theme";
import { CHAPTERS, DURATION_S, SCENES, SFX, cameraAt, warmthAt } from "./timeline";
import { Criteria } from "./scenes/Criteria";
import { Intro } from "./scenes/Intro";
import { Matrix } from "./scenes/Matrix";
import { Outro } from "./scenes/Outro";

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

export const Lesson2: React.FC = () => {
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
      <At k="matrix">
        <Matrix />
      </At>
      <At k="howTitle">
        <ChapterTitle
          num={2}
          eyebrow="Concrètement"
          before="Comment repérer"
          accent="ces tâches ?"
          out={SCENES.howTitle[1] - SCENES.howTitle[0] - 0.55}
        />
      </At>
      <At k="criteria">
        <Criteria />
      </At>
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
