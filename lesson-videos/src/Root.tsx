import { Composition } from "remotion";
import { Lesson1 } from "./lesson1/Lesson1";
import { DURATION_S } from "./lesson1/timeline";
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
        defaultProps={{ guide: false }}
      />
      {/* Contrôle : zone avatar visible + voix d'origine (ne pas livrer). */}
      <Composition
        id="Lecon1-IA-generative-controle"
        component={Lesson1}
        durationInFrames={Math.ceil(DURATION_S * FPS)}
        fps={FPS}
        width={W}
        height={H}
        defaultProps={{ guide: true }}
      />
    </>
  );
};
