import { supabase } from "@/app/lib/supabase/client";

const LESSON_VIDEO_MARKER = "/object/public/lesson-videos/";

// lesson.video_url ne pointe vers le bucket storage "lesson-videos" que
// lorsque la vidéo a été uploadée depuis l'éditeur de leçon — un lien externe
// (YouTube, etc.) ne matche pas ce marqueur et n'est jamais touché.
function lessonVideoPath(videoUrl: string | null | undefined): string | null {
  if (!videoUrl) return null;
  const idx = videoUrl.indexOf(LESSON_VIDEO_MARKER);
  return idx === -1 ? null : videoUrl.slice(idx + LESSON_VIDEO_MARKER.length);
}

// Best-effort : à appeler après tout remplacement/suppression d'une leçon (ou
// de son module/formation/instance) pour éviter les fichiers orphelins dans
// le bucket storage.
export async function deleteLessonVideoFiles(videoUrls: (string | null | undefined)[]): Promise<void> {
  const paths = videoUrls.map(lessonVideoPath).filter((p): p is string => !!p);
  if (!paths.length) return;
  await supabase.storage.from("lesson-videos").remove(paths);
}
