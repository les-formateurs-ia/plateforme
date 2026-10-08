import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Clock, Target, Award, CheckCircle, Lock, Play, Percent } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { useAuth } from "@/app/state/auth-context";
import { useProfile } from "@/app/state/profile-context";
import { GCard } from "@/app/components/common/GCard";
import { GT } from "@/app/components/common/GT";
import { ShimBtn } from "@/app/components/common/Buttons";
import { CircleProgress } from "@/app/components/common/CircleProgress";
import { VSelect } from "@/app/components/common/Select";
import { useCourseProgress } from "@/app/state/useCourseProgress";
import { useMyInstances } from "@/app/state/useMyInstances";
import { getAllBadges, getEarnedBadgeIds, formatDuration, isLessonCompleted, type BadgeRow } from "@/app/lib/learning";
import { AiUsagePanel } from "@/app/pages/dashboard/AiUsagePanel";
import { HomeOverview } from "@/app/pages/dashboard/HomeOverview";
import { frenchDate, greeting } from "@/app/lib/journey";

export function DashboardPage() {
  const th = useTh();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile } = useProfile();
  const { instances, selectedId, setSelectedId } = useMyInstances();
  const course = useCourseProgress(selectedId ?? undefined);
  const firstName = profile.name.split(" ")[0] || "Alex";
  const [tab, setTab] = useState<"overview" | "usage">("overview");

  const [badges, setBadges] = useState<BadgeRow[]>([]);
  const [earnedIds, setEarnedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const [all, earned] = await Promise.all([getAllBadges(), getEarnedBadgeIds(user.id)]);
        if (cancelled) return;
        setBadges(all);
        setEarnedIds(earned);
      } catch (err) {
        console.error(err);
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  const totalLessons = course.lessonStates.length;
  const completedLessons = course.lessonStates.filter(isLessonCompleted).length;
  const completionPct = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
  const totalTimeSeconds = course.lessonStates.reduce((sum, s) => sum + (s.progress?.timeSpentSeconds ?? 0), 0);
  const scores = course.lessonStates.map((s) => s.progress?.bestQuizScore).filter((s): s is number => s != null);
  const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;

  const nextLesson = course.lessonStates.find((s) => s.state === "available");
  const nextSection = course.outline?.sections.find((sec) => sec.lessons.some((l) => l.id === nextLesson?.lesson.id));
  const nextLessonIndex = nextSection ? nextSection.lessons.findIndex((l) => l.id === nextLesson?.lesson.id) : -1;

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8 space-y-8">
      <div className="flex items-end justify-between gap-4 flex-wrap fade-up">
        <div>
          <p className="eyebrow first-letter:uppercase" style={{ color: th.fg3 }}>{frenchDate()}</p>
          <h1 className="mt-2 text-[2rem] sm:text-[2.6rem] leading-[1.02] font-black" style={{ color: th.fg }}>
            {greeting()} <GT>{firstName}</GT>
          </h1>
          <p className="text-[15px] sm:text-base mt-3 leading-relaxed max-w-2xl" style={{ color: th.fg2 }}>
            {totalLessons === 0 ? "Voici ton espace de formation." : completedLessons === totalLessons
              ? "Toutes tes leçons sont validées : direction la certification."
              : `${completedLessons} leçon${completedLessons > 1 ? "s" : ""} validée${completedLessons > 1 ? "s" : ""} sur ${totalLessons}. Encore ${totalLessons - completedLessons} avant la certification.`}
          </p>
        </div>
        {tab === "overview" && instances.length > 1 && (
          <div className="w-full sm:w-96 max-w-full shrink-0">
            <VSelect
              sm
              value={selectedId ?? instances[0].id}
              onValueChange={setSelectedId}
              options={instances.map((i) => ({ value: i.id, label: i.name }))}
            />
          </div>
        )}
      </div>

      <div role="tablist" className="flex flex-wrap gap-x-7" style={{ borderBottom: `1px solid ${th.sep}` }}>
        {(["overview", "usage"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} role="tab" aria-selected={tab === t} className="tab-link shrink-0 pt-1 pb-3 text-[15px] transition-colors"
            style={{ color: tab === t ? th.fg : th.fg3 }}>
            {t === "overview" ? "Vue d'ensemble" : "Mon utilisation IA"}
          </button>
        ))}
      </div>

      {tab === "usage" && <AiUsagePanel />}

      {tab === "overview" && (course.loading ? (
        <div className="space-y-6" aria-busy="true" aria-label="Chargement">
          <div className="h-[300px] rounded-[10px] bg-black/90 animate-pulse" />
          <div className="h-24 rounded-[10px] animate-pulse" style={{ background: th.navA }} />
        </div>
      ) : !course.outline ? (
        <GCard><div className="p-10 text-center">
          <p className="text-lg font-black mb-1" style={{ color: th.fg }}>Aucune formation en cours</p>
          <p className="text-sm" style={{ color: th.fg2 }}>Ton formateur t'inscrira bientôt à une formation. En attendant, tu peux déjà explorer le Studio.</p>
        </div></GCard>
      ) : (
        <HomeOverview outline={course.outline} states={course.lessonStates} badges={badges} earnedIds={earnedIds} />
      ))}
    </div>
  );
}
