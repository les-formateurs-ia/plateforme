// Vue d'ensemble d'un élève (progression + score moyen par formation active),
// injectée dans les prompts de l'Agent unifié pour qu'il porte une
// appréciation sur l'ensemble du parcours et pas seulement la leçon/le
// projet en cours. Même logique N+1 simple que useAllCourseProgress côté
// client (volumes faibles par élève), juste rejouée côté serveur.
export interface CourseOverview {
  instanceId: string;
  name: string;
  completedLessons: number;
  totalLessons: number;
  averageQuizScore: number | null;
}

export async function buildStudentOverview(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  userId: string,
): Promise<{ text: string; courses: CourseOverview[] }> {
  const { data: instances } = await supabase
    .from("formation_instances")
    .select("id, name")
    .eq("user_id", userId)
    .eq("status", "active")
    .eq("is_preview", false);

  const courses: CourseOverview[] = [];
  for (const instance of instances ?? []) {
    const { data: sections } = await supabase
      .from("instance_sections").select("id").eq("instance_id", instance.id);
    const sectionIds = (sections ?? []).map((s: { id: string }) => s.id);

    let lessonIds: string[] = [];
    if (sectionIds.length > 0) {
      const { data: lessons } = await supabase
        .from("instance_lessons").select("id").in("section_id", sectionIds);
      lessonIds = (lessons ?? []).map((l: { id: string }) => l.id);
    }

    let completedLessons = 0;
    let averageQuizScore: number | null = null;
    if (lessonIds.length > 0) {
      const { data: progress } = await supabase
        .from("lesson_progress").select("status, best_quiz_score")
        .eq("user_id", userId).in("lesson_id", lessonIds);
      const rows = progress ?? [];
      completedLessons = rows.filter((p: { status: string }) => p.status === "completed").length;
      const scores = rows
        .map((p: { best_quiz_score: number | null }) => p.best_quiz_score)
        .filter((s: number | null): s is number => s != null);
      averageQuizScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
    }

    courses.push({ instanceId: instance.id, name: instance.name, completedLessons, totalLessons: lessonIds.length, averageQuizScore });
  }

  const text = courses.length === 0
    ? "Aucune formation active pour le moment."
    : courses
        .map((c) => `- ${c.name} : ${c.completedLessons}/${c.totalLessons} leçons terminées${c.averageQuizScore != null ? `, score quiz moyen ${c.averageQuizScore}%` : ""}`)
        .join("\n");

  return { text, courses };
}
