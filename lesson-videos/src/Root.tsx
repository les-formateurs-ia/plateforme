import { Composition } from "remotion";
import { Lesson1 } from "./lesson1/Lesson1";
import { DURATION_S } from "./lesson1/timeline";
import { Lesson2 } from "./lesson2/Lesson2";
import { DURATION_S as DURATION_L2 } from "./lesson2/timeline";
import { Lesson3 } from "./lesson3/Lesson3";
import { DURATION_S as DURATION_L3 } from "./lesson3/timeline";
import { Lesson4 } from "./lesson4/Lesson4";
import { DURATION_S as DURATION_L4 } from "./lesson4/timeline";
import { Lesson5 } from "./lesson5/Lesson5";
import { DURATION_S as DURATION_L5 } from "./lesson5/timeline";
import { Lesson6 } from "./lesson6/Lesson6";
import { DURATION_S as DURATION_L6 } from "./lesson6/timeline";
import { FPS, H, W } from "./theme";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* Durée identique à la source (370,33 s) pour y reposer avatar + voix. */}
      <Composition
        id="Lecon1-IA-generative"
        component={Lesson1}
        durationInFrames={Math.ceil(DURATION_S * FPS)}
        fps={FPS}
        width={W}
        height={H}
      />
      <Composition
        id="Lecon2-Analyser-son-poste"
        component={Lesson2}
        durationInFrames={Math.ceil(DURATION_L2 * FPS)}
        fps={FPS}
        width={W}
        height={H}
      />
      <Composition
        id="Lecon3-Securiser-son-usage"
        component={Lesson3}
        durationInFrames={Math.ceil(DURATION_L3 * FPS)}
        fps={FPS}
        width={W}
        height={H}
      />
      <Composition
        id="Lecon4-Installer-configurer"
        component={Lesson4}
        durationInFrames={Math.ceil(DURATION_L4 * FPS)}
        fps={FPS}
        width={W}
        height={H}
      />
      <Composition
        id="Lecon5-Bases-prompt-engineering"
        component={Lesson5}
        durationInFrames={Math.ceil(DURATION_L5 * FPS)}
        fps={FPS}
        width={W}
        height={H}
      />
      <Composition
        id="Lecon6-Securite-gestion-donnees"
        component={Lesson6}
        durationInFrames={Math.ceil(DURATION_L6 * FPS)}
        fps={FPS}
        width={W}
        height={H}
      />
    </>
  );
};
