import { Audio } from "@remotion/media";
import React from "react";
import { AbsoluteFill, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Backdrop } from "../components/Backdrop";
import { Chrome } from "../components/Chrome";
import { ParticleField } from "../components/ParticleField";
import { C } from "../theme";
import { CHAPTERS, DURATION_S, SCENES, SFX, cameraAt, warmthAt } from "./timeline";
import { Intro } from "./scenes/Intro";
import { Myth } from "./scenes/Myth";
import { Nathalie } from "./scenes/Nathalie";
import { Outro } from "./scenes/Outro";
import { Pillars } from "./scenes/Pillars";
import { Rebuild } from "./scenes/Rebuild";
import { Vague } from "./scenes/Vague";
import { Verify } from "./scenes/Verify";

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

export const Lesson5: React.FC = () => {
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
      <At k="myth">
        <Myth />
      </At>
      <At k="vague">
        <Vague />
      </At>
      <At k="pillars">
        <Pillars />
      </At>
      <At k="rebuild">
        <Rebuild />
      </At>
      <At k="verify">
        <Verify />
      </At>
      <At k="nathalie">
        <Nathalie />
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
