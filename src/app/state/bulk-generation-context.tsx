// Génération groupée des mindmaps de référence d'un cours (déclenchée à la
// publication, cf. AdminCourseEditorPage) — vit au-dessus de BrowserRouter
// pour survivre à la navigation : l'admin peut quitter l'éditeur pendant que
// ça tourne, la barre de progression (MainLayout, au-dessus de "Modifier les
// formations") reste affichée jusqu'à la fin.
import { createContext, useContext, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { requestTemplateMindmapGeneration } from "@/app/lib/mindmaps";
import { updateFormationStatus } from "@/app/lib/formations";

interface BulkGenerationState {
  running: boolean;
  courseId: string | null;
  courseName: string;
  done: number;
  total: number;
}

interface BulkGenerationContextValue extends BulkGenerationState {
  startCourseMindmapGeneration: (courseId: string, courseName: string, lessonIds: string[]) => void;
}

const IDLE_STATE: BulkGenerationState = { running: false, courseId: null, courseName: "", done: 0, total: 0 };

const BulkGenerationContext = createContext<BulkGenerationContextValue>({
  ...IDLE_STATE,
  startCourseMindmapGeneration: () => {},
});

export const useBulkGeneration = () => useContext(BulkGenerationContext);

export function BulkGenerationProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<BulkGenerationState>(IDLE_STATE);
  // Un seul job à la fois — un second déclenchement pendant qu'un premier
  // tourne serait de toute façon confus pour la barre de progression.
  const runningRef = useRef(false);

  const startCourseMindmapGeneration = (courseId: string, courseName: string, lessonIds: string[]) => {
    if (runningRef.current) return;
    runningRef.current = true;
    setState({ running: true, courseId, courseName, done: 0, total: lessonIds.length });

    (async () => {
      let failures = 0;
      for (let i = 0; i < lessonIds.length; i++) {
        try {
          await requestTemplateMindmapGeneration(lessonIds[i]);
        } catch (err) {
          console.error(err);
          failures++;
        }
        setState((s) => ({ ...s, done: i + 1 }));
      }

      try {
        await updateFormationStatus(courseId, "published");
      } catch (err) {
        console.error(err);
        toast.error("Formation générée mais impossible de la marquer publiée — réessaie depuis l'éditeur.");
      }

      if (failures > 0) {
        toast.warning(`Formation publiée — ${lessonIds.length - failures}/${lessonIds.length} mindmaps générées (${failures} échec${failures > 1 ? "s" : ""}, régénérables une par une depuis chaque leçon).`);
      } else if (lessonIds.length > 0) {
        toast.success(`Formation publiée — mindmap générée pour ${lessonIds.length === 1 ? "l'unique leçon" : `les ${lessonIds.length} leçons`}.`);
      }

      // Laisse la barre à 100% un instant plutôt que de la faire disparaître
      // d'un coup, pour que la fin soit visible.
      await new Promise((resolve) => setTimeout(resolve, 1200));
      runningRef.current = false;
      setState(IDLE_STATE);
    })();
  };

  return (
    <BulkGenerationContext.Provider value={{ ...state, startCourseMindmapGeneration }}>
      {children}
    </BulkGenerationContext.Provider>
  );
}
