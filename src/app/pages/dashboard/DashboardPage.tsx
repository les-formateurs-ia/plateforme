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
import { getAllBadges, getEarnedBadgeIds, formatDuration, type BadgeRow } from "@/app/lib/learning";

export function DashboardPage() {
  const th = useTh();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile } = useProfile();
  const { instances, selectedId, setSelectedId } = useMyInstances();
  const course = useCourseProgress(selectedId ?? undefined);
  const firstName = profile.name.split(" ")[0] || "Alex";

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
  const completedLessons = course.lessonStates.filter((s) => s.state === "completed").length;
  const completionPct = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
  const totalTimeSeconds = course.lessonStates.reduce((sum, s) => sum + (s.progress?.timeSpentSeconds ?? 0), 0);
  const scores = course.lessonStates.map((s) => s.progress?.bestQuizScore).filter((s): s is number => s != null);
  const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;

  const nextLesson = course.lessonStates.find((s) => s.state === "available");
  const nextSection = course.outline?.sections.find((sec) => sec.lessons.some((l) => l.id === nextLesson?.lesson.id));
  const nextLessonIndex = nextSection ? nextSection.lessons.findIndex((l) => l.id === nextLesson?.lesson.id) : -1;

  const KPIS = [
    { Icon: Clock, val: formatDuration(totalTimeSeconds), unit: "", sub: "Temps d'apprentissage", accent: "#78d5e2", glow: "rgba(106,222,177,0.15)" },
    { Icon: Target, val: String(completionPct), unit: "%", sub: "Complétion parcours", accent: "#6adeb1", glow: "rgba(106,222,177,0.15)" },
    { Icon: CheckCircle, val: String(completedLessons), unit: `/${totalLessons}`, sub: "Leçons terminées", accent: "#dbacf0", glow: "rgba(181,141,224,0.15)" },
    { Icon: Percent, val: avgScore != null ? String(avgScore) : "—", unit: avgScore != null ? "%" : "", sub: "Score moyen aux quiz", accent: "#fbc2ad", glow: "rgba(251,194,173,0.15)" },
  ];

  if (course.loading) {
    return <div className="flex-1 flex items-center justify-center"><span className="text-sm" style={{ color: th.fg3 }}>Chargement…</span></div>;
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-black mb-0.5 capitalize" style={{ fontFamily: "'Funnel Display',sans-serif" }}><GT>Bienvenue {firstName} 👋</GT></h2>
          <p className="text-sm" style={{ color: th.fg3 }}>Tes statistiques et ta progression en temps réel</p>
        </div>
        {instances.length > 1 && (
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

      {!course.outline ? (
        <GCard><div className="p-8 text-center">
          <p className="text-sm font-semibold mb-1" style={{ color: th.fg }}>Aucune formation en cours</p>
          <p className="text-xs" style={{ color: th.fg3 }}>Vous n'êtes inscrit·e à aucune formation pour le moment.</p>
        </div></GCard>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {KPIS.map(({ Icon, val, unit, sub, accent, glow }) => (
              <GCard key={sub}><div className="p-5">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: glow, border: `1px solid ${accent}25` }}><Icon className="w-5 h-5" style={{ color: accent }} /></div>
                <div className="flex items-baseline gap-1 mb-0.5"><span className="text-2xl font-black" style={{ fontFamily: "'Funnel Display',sans-serif", color: th.fg }}>{val}</span><span className="text-sm font-semibold" style={{ color: accent }}>{unit}</span></div>
                <div className="text-xs" style={{ color: th.fg3 }}>{sub}</div>
              </div></GCard>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 space-y-5">
              <GCard glow><div className="p-6">
                <div className="flex items-start gap-6 flex-wrap sm:flex-nowrap">
                  <div className="relative shrink-0">
                    <CircleProgress pct={completionPct} size={92} />
                    <div className="absolute inset-0 flex items-center justify-center flex-col">
                      <span className="text-xl font-black" style={{ fontFamily: "'Funnel Display',sans-serif", color: th.fg }}>{completionPct}%</span>
                      <span className="text-[9px] uppercase tracking-wider" style={{ color: th.fg3 }}>parcours</span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1"><Award className="w-4 h-4" style={{ color: th.navAC }} /><span className="text-sm font-black" style={{ color: th.fg }}>{nextLesson ? nextLesson.lesson.title : course.outline.instanceName}</span></div>
                    <p className="text-xs mb-4" style={{ color: th.fg3 }}>
                      {nextSection ? `${nextSection.title} · ` : ""}
                      {nextLessonIndex >= 0 ? `Leçon ${nextLessonIndex + 1} sur ${nextSection?.lessons.length} · ` : ""}
                      {completedLessons} leçon{completedLessons > 1 ? "s" : ""} validée{completedLessons > 1 ? "s" : ""} sur {totalLessons}.
                    </p>
                    <div className="space-y-2.5">
                      {course.outline.sections.map((section) => {
                        const sectionStates = section.lessons.map((l) => course.lessonStates.find((s) => s.lesson.id === l.id));
                        const done = sectionStates.filter((s) => s?.state === "completed").length;
                        const active = sectionStates.some((s) => s?.state === "available");
                        const pct = section.lessons.length > 0 ? Math.round((done / section.lessons.length) * 100) : 0;
                        const allDone = section.lessons.length > 0 && done === section.lessons.length;
                        return (
                          <div key={section.id} className="flex items-center gap-3">
                            <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: allDone ? "rgba(106,222,177,0.15)" : active ? "rgba(181,141,224,0.12)" : "rgba(181,141,224,0.04)", border: `1px solid ${allDone ? "rgba(106,222,177,0.4)" : active ? "rgba(181,141,224,0.3)" : th.sep}` }}>
                              {allDone ? <CheckCircle className="w-3 h-3 text-[#6adeb1]" /> : active ? <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#b58de0" }} /> : <Lock className="w-2.5 h-2.5" style={{ color: th.fg3 }} />}
                            </div>
                            <span className="text-xs flex-1 truncate" style={{ color: allDone ? "rgba(106,222,177,0.8)" : active ? th.navAC : th.fg3 }}>{section.title}</span>
                            {allDone && <span className="text-[10px] font-bold text-[#6adeb1] shrink-0">100%</span>}
                            {!allDone && active && (
                              <div className="flex items-center gap-2 shrink-0">
                                <div className="w-16 h-1 rounded-full overflow-hidden" style={{ background: th.isDark ? "rgba(255,255,255,0.06)" : "rgba(181,141,224,0.1)" }}>
                                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "linear-gradient(90deg,#b58de0,#dbacf0)" }} />
                                </div>
                                <span className="text-[10px] font-bold" style={{ color: th.navAC }}>{pct}%</span>
                              </div>
                            )}
                            {!allDone && !active && <span className="text-[10px] shrink-0" style={{ color: th.fg3 }}>Verrouillé</span>}
                          </div>
                        );
                      })}
                    </div>
                    {nextLesson && (
                      <div className="mt-5 pt-4" style={{ borderTop: `1px solid ${th.sep}` }}>
                        <ShimBtn onClick={() => navigate(`/lesson/${nextLesson.lesson.id}`)} sm><span className="flex items-center gap-2"><Play className="w-4 h-4" />Continuer la leçon</span></ShimBtn>
                      </div>
                    )}
                  </div>
                </div>
              </div></GCard>
            </div>

            <div className="space-y-4">
              <GCard><div className="p-5">
                <div className="flex items-center gap-2 mb-4"><Award className="w-4 h-4" style={{ color: th.navAC }} /><span className="text-sm font-bold" style={{ color: th.fg }}>Badges obtenus</span></div>
                <div className="space-y-2">
                  {badges.filter((b) => earnedIds.has(b.id)).map((b) => (
                    <div key={b.id} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl" style={{ background: th.inputBg, border: `1px solid ${th.sep}` }}>
                      <span className="text-lg">{b.icon}</span><span className="text-xs font-medium" style={{ color: th.fg2 }}>{b.name}</span>
                    </div>
                  ))}
                  {badges.filter((b) => earnedIds.has(b.id)).length === 0 && (
                    <p className="text-xs" style={{ color: th.fg3 }}>Aucun badge obtenu pour le moment.</p>
                  )}
                  {badges.length > earnedIds.size && (
                    <p className="text-xs mt-2" style={{ color: th.fg3 }}>{badges.length - earnedIds.size} badge{badges.length - earnedIds.size > 1 ? "s" : ""} restant{badges.length - earnedIds.size > 1 ? "s" : ""} à débloquer.</p>
                  )}
                </div>
              </div></GCard>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
