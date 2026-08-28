// Agrège le contenu de référence des leçons accessibles à l'appelant (RLS
// lessons_read_enrolled s'applique via le client authentifié passé par le
// caller) pour l'injecter comme "règles de la formation" dans un prompt
// d'évaluation IA. Partagé par evaluate-prompt-exercise et
// evaluate-media-exercise — même logique, deux exercices différents.
export const MAX_LESSON_CHARS = 6000;
export const MAX_COURSE_CONTEXT_CHARS = 120000;

export function truncate(text: string, max: number): string {
  return text.length > max ? text.slice(0, max) + "\n[...contenu tronqué...]" : text;
}

export function buildCourseContext(lessons: { title: string; reference_content: string | null }[]): string {
  const withContent = lessons.filter((l) => l.reference_content?.trim());
  if (withContent.length === 0) return "";
  const joined = withContent
    .map((l) => `--- Leçon : ${l.title} ---\n${truncate(l.reference_content!.trim(), MAX_LESSON_CHARS)}`)
    .join("\n\n");
  return truncate(joined, MAX_COURSE_CONTEXT_CHARS);
}
