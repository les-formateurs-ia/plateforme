import { ChevronLeft, ChevronRight, Video, CheckCircle, Trophy, Calendar, Award } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { GCard } from "@/app/components/common/GCard";
import { GT } from "@/app/components/common/GT";
import { ShimBtn } from "@/app/components/common/Buttons";
import { CAL_EVENTS } from "@/app/data/mock";

export function CalendarPage() {
  const th = useTh();
  const DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
  const DATES = [10, 11, 12, 13, 14, 15, 16];
  const TODAY = 1;
  const TC: { [k: string]: { bg: string; text: string } } = {
    review: { bg: "rgba(96,165,250,0.12)", text: "#60A5FA" },
    expert: { bg: "rgba(155,93,229,0.12)", text: "#9B5DE5" },
    quiz: { bg: "rgba(245,158,11,0.12)", text: "#F59E0B" },
    practice: { bg: "rgba(74,222,128,0.12)", text: "#4ADE80" },
  };

  return (
    <div className="flex-1 overflow-y-auto px-8 py-6 space-y-5">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-black" style={{ fontFamily: "'Funnel Display',sans-serif" }}><GT>Planning</GT></h2><p className="text-sm mt-0.5" style={{ color: th.fg3 }}>Semaine du 10 — 16 août 2026</p></div>
        <div className="flex items-center gap-2">
          <button className="px-3 py-2 rounded-xl text-sm" style={{ background: th.inputBg, border: `1px solid ${th.inputB}`, color: th.fg2 }}><ChevronLeft className="w-4 h-4" /></button>
          <button className="px-4 py-2 rounded-xl text-sm" style={{ background: th.inputBg, border: `1px solid ${th.inputB}`, color: th.fg2 }}>Aujourd'hui</button>
          <button className="px-3 py-2 rounded-xl text-sm" style={{ background: th.inputBg, border: `1px solid ${th.inputB}`, color: th.fg2 }}><ChevronRight className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 space-y-4">
          <GCard>
            <div className="grid grid-cols-7" style={{ borderBottom: `1px solid ${th.sep}` }}>
              {DAYS.map((d, i) => (
                <div key={d} className="px-2 py-3 text-center">
                  <div className="text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: th.fg3 }}>{d}</div>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-black mx-auto"
                    style={i === TODAY ? { background: "linear-gradient(135deg,#9B5DE5,#DDAEEA)", color: "#08060F", boxShadow: "0 0 20px rgba(155,93,229,0.4)" } : { color: th.fg2 }}>{DATES[i]}</div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2 p-3" style={{ minHeight: 140 }}>
              {DAYS.map((_, di) => (
                <div key={di} className="space-y-1.5">
                  {CAL_EVENTS.filter(e => e.col === di).map(ev => {
                    const tc = TC[ev.type];
                    return (
                      <div key={ev.label} className="rounded-lg px-2 py-2 cursor-pointer hover:opacity-80 transition-opacity" style={{ background: tc.bg, border: `1px solid ${tc.text}25` }}>
                        <div className="text-[10px] font-bold leading-tight" style={{ color: tc.text }}>{ev.label}</div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </GCard>

          <GCard><div className="p-5 flex items-center gap-5">
            <div className="text-center shrink-0">
              <div className="text-4xl font-black" style={{ fontFamily: "'Funnel Display',sans-serif", background: "linear-gradient(135deg,#F59E0B,#DDAEEA)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>33</div>
              <div className="text-xs" style={{ color: th.fg3 }}>jours restants</div>
            </div>
            <div style={{ width: 1, height: 48, background: th.sep }} />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1"><Trophy className="w-4 h-4 text-amber-400" /><span className="text-sm font-black" style={{ color: th.fg }}>Soutenance de certification</span></div>
              <p className="text-xs mb-3" style={{ color: th.fg3 }}>15 mars 2026 · En ligne · Jury de 2 experts</p>
              <ShimBtn sm><span className="flex items-center gap-2"><Award className="w-4 h-4" />S'entraîner pour la soutenance</span></ShimBtn>
            </div>
          </div></GCard>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl p-5" style={{ background: th.isDark ? "linear-gradient(135deg,rgba(155,93,229,0.18),rgba(221,174,234,0.08))" : "linear-gradient(135deg,rgba(155,93,229,0.1),rgba(221,174,234,0.04))", border: "1px solid rgba(155,93,229,0.28)" }}>
            <Video className="w-5 h-5 mb-3" style={{ color: th.navAC }} />
            <div className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: th.navAC }}>Session Expert IA</div>
            <h4 className="text-sm font-black mb-2" style={{ color: th.fg }}>Planifie un échange 1:1 avec un expert certifié</h4>
            <p className="text-xs leading-relaxed mb-3" style={{ color: th.fg3 }}>Pose tes questions, débloques tes situations et prépare ta certification.</p>
            <div className="flex items-center gap-2 text-xs mb-4" style={{ color: th.fg3 }}><CheckCircle className="w-3.5 h-3.5 shrink-0" style={{ color: th.navAC }} />1 appel par semaine inclus</div>
            <ShimBtn full sm><span className="flex items-center justify-center gap-2"><Calendar className="w-4 h-4" />Réserver ma session</span></ShimBtn>
          </div>

          <GCard><div className="p-5">
            <div className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: th.fg3 }}>Cette semaine</div>
            {[
              { emoji: "📋", label: "Révision Leçon 1", type: "review" },
              { emoji: "🎥", label: "Session Expert IA", type: "expert" },
              { emoji: "🧠", label: "Quiz Module 2", type: "quiz" },
              { emoji: "💻", label: "Pratique Sandbox", type: "practice" },
              { emoji: "🔁", label: "Révision espacée J+14", type: "review" },
            ].map(({ emoji, label, type }) => {
              const tc = TC[type];
              return (
                <div key={label} className="flex items-center gap-3 py-2.5" style={{ borderBottom: `1px solid ${th.sep}` }}>
                  <span className="text-base shrink-0">{emoji}</span>
                  <div className="text-xs font-medium" style={{ color: tc.text }}>{label}</div>
                </div>
              );
            })}
          </div></GCard>
        </div>
      </div>
    </div>
  );
}
