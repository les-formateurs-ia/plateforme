import { Audio } from "@remotion/media";
import React from "react";
import { AbsoluteFill, Sequence, staticFile, useVideoConfig } from "remotion";
import { Backdrop } from "../components/Backdrop";
import { Chrome, type Chapter } from "../components/Chrome";
import { ParticleField, type FieldCamera } from "../components/ParticleField";
import { C } from "../theme";
import { AvatarFull, AvatarPip } from "./kit";
import { buildTimeline, type Manifest, type TimedScene } from "./timeline";

// Squelette commun des vidéos RS6776 : fond et particules de la marque, voix off
// scène par scène, Raul plein cadre ou en médaillon selon le script, habillage
// de chaque scène fourni par `render`, barre de progression par chapitre.

export type SceneRender = (s: TimedScene, out: number) => React.ReactNode;

const FIELD: FieldCamera = { cx: 1100, cy: 540, radius: 520, yaw: 0, pitch: 0.28, opacity: 0.42, warmth: 0, energy: 0.06, scatter: 1, spin: 0.05 };

export function lessonDuration(m: Manifest) {
  return buildTimeline(m).duration;
}

export const LessonVideo: React.FC<{
  manifest: Manifest;
  chapters: { label: string; sceneIds: string[] }[];
  render: Record<string, SceneRender>;
  shrinkAt?: Record<string, number>; // scènes plein cadre où Raul se décale pour laisser place à un contenu
}> = ({ manifest, chapters, render, shrinkAt = {} }) => {
  const { fps } = useVideoConfig();
  const { scenes, duration, byId } = buildTimeline(manifest);
  const chapterList: Chapter[] = chapters.map((c, i) => {
    const first = byId[c.sceneIds[0]];
    const next = chapters[i + 1] ? byId[chapters[i + 1].sceneIds[0]] : null;
    return { id: c.label, label: c.label, from: i === 0 ? 0 : first.from - 0.2, to: next ? next.from - 0.2 : duration + 0.01 };
  });

  return (
    <AbsoluteFill style={{ background: C.ink }}>
      <Backdrop hue={0} />
      <ParticleField cam={FIELD} />

      {scenes.map((s) => {
        const from = Math.round(s.from * fps);
        const len = Math.round((s.duration + 0.5) * fps);
        const out = s.duration - 0.15; // instant de sortie de l'habillage, temps local
        return (
          <Sequence key={s.id} name={`scène ${s.id}`} from={from} durationInFrames={len}>
            {render[s.id]?.(s, out)}
            {s.avatar === "full" && <AvatarFull src={s.avatarVideo} dur={s.duration} shrinkAt={shrinkAt[s.id]} />}
            {s.avatar === "full" && render[`${s.id}:over`]?.(s, out)}
            {s.avatar === "pip" && <AvatarPip src={s.avatarVideo} dur={s.duration} />}
            <Audio src={staticFile(s.audio)} />
          </Sequence>
        );
      })}

      <Chrome chapters={chapterList} duration={duration} />
    </AbsoluteFill>
  );
};
