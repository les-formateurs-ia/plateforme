import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/app/state/auth-context";
import {
  getMyInstances, getCourseOutline, getLessonProgressMap, computeLessonStates, flattenLessons,
  type CourseOutline, type LessonWithState, type MyInstance,
} from "@/app/lib/learning";

export interface CourseProgressEntry {
  instance: MyInstance;
  outline: CourseOutline;
  lessonStates: LessonWithState[];
}

export interface AllCourseProgress {
  loading: boolean;
  error: string | null;
  courses: CourseProgressEntry[];
  refresh: () => void;
}

// Charge TOUTES les formations actives d'un élève avec leur progression
// respective, en une fois — pour "Mes leçons", où chaque formation doit
// s'afficher comme un conteneur indépendant repliable plutôt qu'une seule
// formation sélectionnée à la fois. Cf. useCourseProgress, gardé tel quel
// pour Dashboard/LessonPage qui ne raisonnent que sur UNE formation précise.
export function useAllCourseProgress(): AllCourseProgress {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [courses, setCourses] = useState<CourseProgressEntry[]>([]);
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const instances = await getMyInstances(user.id);
        const outlines = await Promise.all(instances.map((i) => getCourseOutline(i.id)));
        const allLessons = outlines.flatMap((o) => (o ? flattenLessons(o) : []));
        const progress = await getLessonProgressMap(user.id, allLessons.map((l) => l.id));
        if (cancelled) return;
        const entries: CourseProgressEntry[] = instances.reduce<CourseProgressEntry[]>((acc, instance, i) => {
          const outline = outlines[i];
          if (outline) acc.push({ instance, outline, lessonStates: computeLessonStates(flattenLessons(outline), progress) });
          return acc;
        }, []);
        setCourses(entries);
      } catch (err) {
        console.error(err);
        if (!cancelled) setError("Impossible de charger vos formations.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user, refreshToken]);

  const refresh = useCallback(() => setRefreshToken((t) => t + 1), []);

  return { loading, error, courses, refresh };
}
