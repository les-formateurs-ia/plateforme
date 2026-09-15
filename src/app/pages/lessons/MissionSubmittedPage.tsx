// Écran affiché juste après la validation d'une leçon "Mission" (cf.
// LessonPage.tsx handleValidateMission) : félicite l'élève pour la fin du
// module et l'invite à prendre rendez-vous avec son formateur pour faire
// valider sa mission, ou à reprendre le parcours.
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { PartyPopper, CalendarPlus, ChevronLeft } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { Background } from "@/app/components/common/Background";
import { VBtn, ShimBtn } from "@/app/components/common/Buttons";
import { getLessonDetail, type LessonDetail } from "@/app/lib/learning";

export function MissionSubmittedPage() {
  const th = useTh();
  const navigate = useNavigate();
  const { lessonId } = useParams<{ lessonId: string }>();
  const [lesson, setLesson] = useState<LessonDetail | null>(null);

  useEffect(() => {
    if (!lessonId) return;
    let cancelled = false;
    (async () => {
      try {
        const detail = await getLessonDetail(lessonId);
        if (!cancelled) setLesson(detail);
      } catch (err) {
        console.error(err);
      }
    })();
    return () => { cancelled = true; };
  }, [lessonId]);

  return (
    <div className="relative flex h-screen items-center justify-center p-4" style={{ background: th.bg, fontFamily: "'Funnel Display',sans-serif" }}>
      <Background />
      <div className="relative z-10 max-w-md w-full rounded-2xl p-8 text-center" style={{ background: th.card, border: `1px solid ${th.sep}` }}>
        <PartyPopper className="w-10 h-10 mx-auto mb-4 text-[#6adeb1]" />
        <h1 className="text-xl font-black mb-2" style={{ color: th.fg }}>Bravo, mission envoyée !</h1>
        <p className="text-sm leading-relaxed mb-1" style={{ color: th.fg2 }}>
          Tu viens de terminer le module {lesson ? <strong>"{lesson.sectionTitle}"</strong> : ""}.
        </p>
        <p className="text-sm leading-relaxed mb-6" style={{ color: th.fg2 }}>
          Ton formateur va recevoir ton travail. Prends rendez-vous avec lui pour qu'il valide ta mission, puis passe au module suivant.
        </p>
        <div className="flex flex-col gap-2.5">
          <ShimBtn onClick={() => navigate("/calendar")}>
            <span className="flex items-center justify-center gap-2"><CalendarPlus className="w-4 h-4" />Prendre rendez-vous avec mon formateur</span>
          </ShimBtn>
          <VBtn onClick={() => navigate("/lessons")}>
            <span className="flex items-center justify-center gap-2"><ChevronLeft className="w-4 h-4" />Retour à mes leçons</span>
          </VBtn>
        </div>
      </div>
    </div>
  );
}
