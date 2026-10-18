import { Audio } from "@remotion/media";
import React from "react";
import { AbsoluteFill, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Backdrop } from "../components/Backdrop";
import { Chrome } from "../components/Chrome";
import { ParticleField } from "../components/ParticleField";
import { C } from "../theme";
import { CHAPTERS, DURATION_S, SCENES, SFX, cameraAt, warmthAt } from "./timeline";
import { Account } from "./scenes/Account";
import { Hub } from "./scenes/Hub";
import { Interface } from "./scenes/Interface";
import { Intro } from "./scenes/Intro";
import { Outro } from "./scenes/Outro";
import { PromptBar } from "./scenes/PromptBar";

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

export const Lesson4: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  return (
    <AbsoluteFill style={{ background: C.ink }}>
      <Backdrop hue={warmthAt()} />
      <ParticleField cam={cameraAt(t)} />

      <At k="intro">
        <Intro />
      </At>
      <At k="account">
        <Account />
      </At>
      <At k="ui">
        <Interface />
      </At>
      <At k="prompt">
        <PromptBar />
      </At>
      <At k="hub">
        <Hub />
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
