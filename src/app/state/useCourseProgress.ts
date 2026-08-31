import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/app/state/auth-context";
import {
  getMyInstances, getCourseOutline, getLessonProgressMap, computeLessonStates, flattenLessons,
  type CourseOutline, type LessonWithState,
} from "@/app/lib/learning";

export interface CourseProgress {
  loading: boolean;
  error: string | null;
  outline: CourseOutline | null;
  lessonStates: LessonWithState[];
  refresh: () => void;
}

// Charge une formation (duplicata attribué à l'élève) + sa progression leçon
// par leçon. Sans argument : la formation active la plus récemment attribuée
// (un élève peut en avoir plusieurs en parallèle) — utilisé par LessonsPage et
// le dashboard. Avec `instanceId` : cette formation précise, peu importe
// laquelle est la plus récente — utilisé par LessonPage, pour que l'accès à
// une leçon dépende du duplicata auquel ELLE appartient.
export function useCourseProgress(instanceId?: string): CourseProgress {
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
        const resolvedInstanceId = instanceId ?? (await getMyInstances(user.id))[0]?.id ?? null;
        if (!resolvedInstanceId) {
          if (!cancelled) { setOutline(null); setLessonStates([]); }
          return;
        }
        const outlineData = await getCourseOutline(resolvedInstanceId);
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
  }, [user, instanceId, refreshToken]);

  const refresh = useCallback(() => setRefreshToken((t) => t + 1), []);

  return { loading, error, outline, lessonStates, refresh };
}
