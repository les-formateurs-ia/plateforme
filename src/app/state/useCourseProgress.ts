import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/app/state/auth-context";
import {
  getActiveFormationId, getCourseOutline, getLessonProgressMap, computeLessonStates, flattenLessons,
  type CourseOutline, type LessonWithState,
} from "@/app/lib/learning";

export interface CourseProgress {
  loading: boolean;
  error: string | null;
  outline: CourseOutline | null;
  lessonStates: LessonWithState[];
  refresh: () => void;
}

// Charge une formation + la progression de l'élève leçon par leçon.
// Sans argument : la formation "active" (première inscription) — utilisé par
// LessonsPage et le dashboard. Avec `formationId` : cette formation précise,
// peu importe laquelle est "active" — utilisé par LessonPage, pour que
// l'accès à une leçon dépende du cours auquel ELLE appartient, pas d'une
// autre formation dans laquelle l'utilisateur serait par ailleurs inscrit.
export function useCourseProgress(formationId?: string): CourseProgress {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [outline, setOutline] = useState<CourseOutline | null>(null);
  const [lessonStates, setLessonStates] = useState<LessonWithState[]>([]);
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const resolvedFormationId = formationId ?? (await getActiveFormationId(user.id));
        if (!resolvedFormationId) {
          if (!cancelled) { setOutline(null); setLessonStates([]); }
          return;
        }
        const outlineData = await getCourseOutline(resolvedFormationId);
        if (!outlineData) {
          if (!cancelled) { setOutline(null); setLessonStates([]); }
          return;
        }
        const lessons = flattenLessons(outlineData);
        const progress = await getLessonProgressMap(user.id, lessons.map((l) => l.id));
        if (cancelled) return;
        setOutline(outlineData);
        setLessonStates(computeLessonStates(lessons, progress));
      } catch (err) {
        console.error(err);
        if (!cancelled) setError("Impossible de charger votre progression.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user, formationId, refreshToken]);

  const refresh = useCallback(() => setRefreshToken((t) => t + 1), []);

  return { loading, error, outline, lessonStates, refresh };
}
