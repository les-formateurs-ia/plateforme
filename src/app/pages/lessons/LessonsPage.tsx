import { useState } from "react";
import { useNavigate } from "react-router";
import { Lock, ChevronDown, CheckCircle, Play } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { GCard } from "@/app/components/common/GCard";
import { GT } from "@/app/components/common/GT";
import { VBtn } from "@/app/components/common/Buttons";
import { cx } from "@/app/lib/cx";
import { MODULES, M2_LESSONS } from "@/app/data/mock";

export function LessonsPage() {
  const th = useTh();
  const navigate = useNavigate();
  const goLesson = () => navigate("/lesson/6");
  const [openMod, setOpenMod] = useState(2);
  return (
    <div className="flex-1 overflow-y-auto px-8 py-6">
      <div className="mb-6 flex items-start justify-between">
        <div><h2 className="text-2xl font-black" style={{ fontFamily: "'Funnel Display',sans-serif" }}><GT>Mes leçons</GT></h2><p className="text-sm mt-0.5" style={{ color: th.fg3 }}>5 modules · 29 leçons · Certification IA Pro</p></div>
      </div>

      <GCard className="mb-6"><div className="p-5 flex items-center gap-8">
        {[{ val: "13", sub: "Leçons terminées" }, { val: "87%", sub: "Taux de réussite" }, { val: "4h32", sub: "Temps de pratique" }].map(({ val, sub }) => (
          <div key={sub} className="text-center">
            <div className="text-xl font-black mb-0.5" style={{ fontFamily: "'Funnel Display',sans-serif" }}><GT>{val}</GT></div>
            <div className="text-xs" style={{ color: th.fg3 }}>{sub}</div>
          </div>
        ))}
        <div className="flex-1 ml-4">
          <div className="flex justify-between text-xs mb-1.5" style={{ color: th.fg3 }}><span>Progression globale</span><span>67%</span></div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: th.isDark ? "rgba(255,255,255,0.06)" : "rgba(155,93,229,0.1)" }}>
            <div className="h-full rounded-full" style={{ width: "67%", background: "linear-gradient(90deg,#7C3AED,#DDAEEA)" }} />
          </div>
        </div>
      </div></GCard>

      <div className="space-y-3">
        {MODULES.map(mod => {
          const open = openMod === mod.id;
          const pct = mod.total > 0 ? Math.round((mod.done / mod.total) * 100) : 0;
          const SC = { complete: { bg: "rgba(74,222,128,0.1)", text: "#4ADE80", border: "rgba(74,222,128,0.25)", label: "Validé ✓" }, active: { bg: "rgba(155,93,229,0.1)", text: "#9B5DE5", border: "rgba(155,93,229,0.3)", label: "En cours" }, locked: { bg: "transparent", text: th.fg3, border: th.sep, label: "Verrouillé" } };
          const sc = SC[mod.status as keyof typeof SC];
          return (
            <GCard key={mod.id}>
              <button className="w-full text-left" onClick={() => setOpenMod(open ? 0 : mod.id)}>
                <div className="px-5 py-4 flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0" style={{ background: sc.bg, border: `1px solid ${sc.border}` }}>
                    {mod.status === "locked" ? <Lock className="w-4 h-4" style={{ color: th.fg3 }} /> : mod.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold" style={{ color: mod.status === "locked" ? th.fg3 : th.fg }}>{mod.title}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0" style={{ background: sc.bg, color: sc.text, border: `1px solid ${sc.border}` }}>{sc.label}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs" style={{ color: th.fg3 }}>{mod.done}/{mod.total} leçons</span>
                      {mod.status !== "locked" && (
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-1 rounded-full overflow-hidden" style={{ background: th.isDark ? "rgba(255,255,255,0.06)" : "rgba(155,93,229,0.1)" }}>
                            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: mod.status === "complete" ? "linear-gradient(90deg,#16A34A,#4ADE80)" : "linear-gradient(90deg,#9B5DE5,#DDAEEA)" }} />
                          </div>
                          <span className="text-[10px] font-bold" style={{ color: sc.text }}>{pct}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <ChevronDown className="w-4 h-4 shrink-0 transition-transform" style={{ color: th.fg3, transform: open ? "rotate(180deg)" : "none" }} />
                </div>
              </button>
              {open && mod.id === 2 && (
                <div style={{ borderTop: `1px solid ${th.sep}` }}>
                  {M2_LESSONS.map((lesson, i) => (
                    <div key={lesson.id} className={cx("flex items-center gap-4 px-5 py-3 transition-colors", lesson.current && "cursor-pointer hover:opacity-80")}
                      onClick={() => lesson.current && goLesson()}
                      style={i < M2_LESSONS.length - 1 ? { borderBottom: `1px solid ${th.sep}` } : {}}>
                      <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: lesson.done ? "rgba(74,222,128,0.12)" : lesson.current ? "rgba(155,93,229,0.12)" : "transparent", border: `1px solid ${lesson.done ? "rgba(74,222,128,0.3)" : lesson.current ? "rgba(155,93,229,0.35)" : th.sep}` }}>
                        {lesson.done ? <CheckCircle className="w-3.5 h-3.5 text-green-400" /> : lesson.current ? <Play className="w-3 h-3 ml-0.5" style={{ color: th.navAC }} /> : <span className="text-[10px] font-mono" style={{ color: th.fg3 }}>{lesson.id}</span>}
                      </div>
                      <span className="flex-1 text-sm truncate" style={{ color: lesson.done ? "rgba(74,222,128,0.7)" : lesson.current ? th.navAC : th.fg3 }}>{lesson.title}</span>
                      {lesson.current && <span className="text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0" style={{ background: "rgba(155,93,229,0.1)", color: th.navAC, border: "1px solid rgba(155,93,229,0.25)" }}>En cours</span>}
                      <span className="text-xs font-mono shrink-0" style={{ color: th.fg3 }}>{lesson.dur}</span>
                    </div>
                  ))}
                  <div className="px-5 py-3" style={{ borderTop: `1px solid ${th.sep}` }}>
                    <VBtn onClick={goLesson} sm><span className="flex items-center gap-2"><Play className="w-3.5 h-3.5" />Reprendre le module</span></VBtn>
                  </div>
                </div>
              )}
              {open && mod.status === "complete" && (
                <div className="px-5 py-4 text-sm text-center text-green-400/70" style={{ borderTop: `1px solid ${th.sep}` }}><CheckCircle className="w-5 h-5 mx-auto mb-1.5 text-green-400" />Toutes les leçons validées · Score : 94%</div>
              )}
            </GCard>
          );
        })}
      </div>
    </div>
  );
}
