import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Lock, ChevronDown, CheckCircle, Play, Clock } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { GCard } from "@/app/components/common/GCard";
import { GT } from "@/app/components/common/GT";
import { VBtn } from "@/app/components/common/Buttons";
import { cx } from "@/app/lib/cx";
import { formatDuration, type LessonWithState } from "@/app/lib/learning";
import { useCourseProgress } from "@/app/state/useCourseProgress";

type SectionStatus = "complete" | "active" | "locked";

export function LessonsPage() {
  const th = useTh();
  const navigate = useNavigate();
  const { loading, error: errorMsg, outline, lessonStates } = useCourseProgress();
  const [openSection, setOpenSection] = useState<string | null>(null);

  useEffect(() => {
    if (!outline || openSection) return;
    const firstOpenable = outline.sections.find((s) => s.lessons.some((l) => lessonStates.find((st) => st.lesson.id === l.id)?.state !== "locked"));
    setOpenSection(firstOpenable?.id ?? outline.sections[0]?.id ?? null);
  }, [outline, lessonStates, openSection]);

  const stateFor = (lessonId: string) => lessonStates.find((s) => s.lesson.id === lessonId);
  const totalLessons = lessonStates.length;
  const completedLessons = lessonStates.filter((s) => s.state === "completed").length;
  const overallPct = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
  const totalTimeSeconds = lessonStates.reduce((sum, s) => sum + (s.progress?.timeSpentSeconds ?? 0), 0);
  const scores = lessonStates.map((s) => s.progress?.bestQuizScore).filter((s): s is number => s != null);
  const successRate = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;

  const goLesson = (lessonId: string) => navigate(`/lesson/${lessonId}`);

  if (loading) {
    return <div className="flex-1 flex items-center justify-center"><span className="text-sm" style={{ color: th.fg3 }}>Chargement de vos leçons…</span></div>;
  }

  if (errorMsg) {
    return <div className="flex-1 flex items-center justify-center"><span className="text-sm text-red-400">{errorMsg}</span></div>;
  }

  if (!outline) {
    return (
      <div className="flex-1 flex items-center justify-center px-8">
        <GCard><div className="p-8 text-center max-w-sm">
          <p className="text-sm font-semibold mb-1" style={{ color: th.fg }}>Aucune formation en cours</p>
          <p className="text-xs" style={{ color: th.fg3 }}>Vous n'êtes inscrit·e à aucune formation pour le moment. Contactez votre administrateur.</p>
        </div></GCard>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-8 py-6">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-black" style={{ fontFamily: "'Funnel Display',sans-serif" }}><GT>Mes leçons</GT></h2>
          <p className="text-sm mt-0.5" style={{ color: th.fg3 }}>{outline.formationName} · {outline.sections.length} modules · {totalLessons} leçons</p>
        </div>
      </div>

      <GCard className="mb-6"><div className="p-5 flex items-center gap-8">
        {[
          { val: String(completedLessons), sub: "Leçons terminées" },
          { val: successRate != null ? `${successRate}%` : "—", sub: "Taux de réussite" },
          { val: formatDuration(totalTimeSeconds), sub: "Temps de pratique" },
        ].map(({ val, sub }) => (
          <div key={sub} className="text-center">
            <div className="text-xl font-black mb-0.5" style={{ fontFamily: "'Funnel Display',sans-serif" }}><GT>{val}</GT></div>
            <div className="text-xs" style={{ color: th.fg3 }}>{sub}</div>
          </div>
        ))}
        <div className="flex-1 ml-4">
          <div className="flex justify-between text-xs mb-1.5" style={{ color: th.fg3 }}><span>Progression globale</span><span>{overallPct}%</span></div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: th.isDark ? "rgba(255,255,255,0.06)" : "rgba(155,93,229,0.1)" }}>
            <div className="h-full rounded-full" style={{ width: `${overallPct}%`, background: "linear-gradient(90deg,#7C3AED,#DDAEEA)" }} />
          </div>
        </div>
      </div></GCard>

      <div className="space-y-3">
        {outline.sections.map((mod) => {
          const modStates = mod.lessons.map((l) => stateFor(l.id)).filter((s): s is LessonWithState => !!s);
          const done = modStates.filter((s) => s.state === "completed").length;
          const total = mod.lessons.length;
          const status: SectionStatus = total === 0 ? "locked" : done === total ? "complete" : modStates.some((s) => s.state !== "locked") ? "active" : "locked";
          const pct = total > 0 ? Math.round((done / total) * 100) : 0;
          const open = openSection === mod.id;
          const SC = {
            complete: { bg: "rgba(74,222,128,0.1)", text: "#4ADE80", border: "rgba(74,222,128,0.25)", label: "Validé ✓" },
            active: { bg: "rgba(155,93,229,0.1)", text: "#9B5DE5", border: "rgba(155,93,229,0.3)", label: "En cours" },
            locked: { bg: "transparent", text: th.fg3, border: th.sep, label: "Verrouillé" },
          };
          const sc = SC[status];
          const nextLesson = modStates.find((s) => s.state === "available");
          return (
            <GCard key={mod.id}>
              <button className="w-full text-left" onClick={() => setOpenSection(open ? null : mod.id)}>
                <div className="px-5 py-4 flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0" style={{ background: sc.bg, border: `1px solid ${sc.border}` }}>
                    {status === "locked" ? <Lock className="w-4 h-4" style={{ color: th.fg3 }} /> : status === "complete" ? <CheckCircle className="w-5 h-5 text-green-400" /> : <Play className="w-4 h-4" style={{ color: th.navAC }} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold" style={{ color: status === "locked" ? th.fg3 : th.fg }}>{mod.title}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0" style={{ background: sc.bg, color: sc.text, border: `1px solid ${sc.border}` }}>{sc.label}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs" style={{ color: th.fg3 }}>{done}/{total} leçons</span>
                      {status !== "locked" && total > 0 && (
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-1 rounded-full overflow-hidden" style={{ background: th.isDark ? "rgba(255,255,255,0.06)" : "rgba(155,93,229,0.1)" }}>
                            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: status === "complete" ? "linear-gradient(90deg,#16A34A,#4ADE80)" : "linear-gradient(90deg,#9B5DE5,#DDAEEA)" }} />
                          </div>
                          <span className="text-[10px] font-bold" style={{ color: sc.text }}>{pct}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <ChevronDown className="w-4 h-4 shrink-0 transition-transform" style={{ color: th.fg3, transform: open ? "rotate(180deg)" : "none" }} />
                </div>
              </button>
              {open && (
                <div style={{ borderTop: `1px solid ${th.sep}` }}>
                  {mod.lessons.length === 0 && (
                    <div className="px-5 py-4 text-xs" style={{ color: th.fg3 }}>Aucune leçon dans ce module pour le moment.</div>
                  )}
                  {mod.lessons.map((lesson, i) => {
                    const s = stateFor(lesson.id);
                    const state = s?.state ?? "locked";
                    const clickable = state !== "locked";
                    return (
                      <div key={lesson.id} className={cx("flex items-center gap-4 px-5 py-3 transition-colors", clickable && "cursor-pointer hover:opacity-80")}
                        onClick={() => clickable && goLesson(lesson.id)}
                        style={i < mod.lessons.length - 1 ? { borderBottom: `1px solid ${th.sep}` } : {}}>
                        <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: state === "completed" ? "rgba(74,222,128,0.12)" : state === "available" ? "rgba(155,93,229,0.12)" : "transparent", border: `1px solid ${state === "completed" ? "rgba(74,222,128,0.3)" : state === "available" ? "rgba(155,93,229,0.35)" : th.sep}` }}>
                          {state === "completed" ? <CheckCircle className="w-3.5 h-3.5 text-green-400" /> : state === "available" ? <Play className="w-3 h-3 ml-0.5" style={{ color: th.navAC }} /> : <Lock className="w-3 h-3" style={{ color: th.fg3 }} />}
                        </div>
                        <span className="flex-1 text-sm truncate" style={{ color: state === "completed" ? "rgba(74,222,128,0.7)" : state === "available" ? th.navAC : th.fg3 }}>{lesson.title}</span>
                        {state === "available" && <span className="text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0" style={{ background: "rgba(155,93,229,0.1)", color: th.navAC, border: "1px solid rgba(155,93,229,0.25)" }}>En cours</span>}
                        <span className="text-xs font-mono shrink-0 flex items-center gap-1" style={{ color: th.fg3 }}>
                          {lesson.durationMinutes ? <><Clock className="w-3 h-3" />{lesson.durationMinutes}min</> : "—"}
                        </span>
                      </div>
                    );
                  })}
                  {nextLesson && (
                    <div className="px-5 py-3" style={{ borderTop: `1px solid ${th.sep}` }}>
                      <VBtn onClick={() => goLesson(nextLesson.lesson.id)} sm><span className="flex items-center gap-2"><Play className="w-3.5 h-3.5" />Reprendre le module</span></VBtn>
                    </div>
                  )}
                </div>
              )}
            </GCard>
          );
        })}
      </div>
    </div>
  );
}
