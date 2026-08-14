import { useNavigate } from "react-router";
import { Clock, Target, Brain, Trophy, CheckCircle, Lock, Award } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from "recharts";
import { useTh } from "@/app/theme/theme";
import { GCard } from "@/app/components/common/GCard";
import { GT } from "@/app/components/common/GT";
import { ShimBtn } from "@/app/components/common/Buttons";
import { CircleProgress } from "@/app/components/common/CircleProgress";
import { MemTip } from "@/app/components/common/ChartTooltip";
import { MEMORY_DATA, SKILLS, BADGES, CERT_CHAPTERS } from "@/app/data/mock";

export function DashboardPage() {
  const th = useTh();
  const navigate = useNavigate();
  const goLesson = () => navigate("/lesson/6");
  const KPIS = [
    { Icon: Clock, val: "4h 32", unit: "", sub: "Apprentissage / sem.", accent: "#60A5FA", glow: "rgba(96,165,250,0.15)" },
    { Icon: Target, val: "67", unit: "%", sub: "Complétion parcours", accent: "#4ADE80", glow: "rgba(74,222,128,0.15)" },
    { Icon: Brain, val: "82", unit: "/100", sub: "Indice de maîtrise", accent: "#9B5DE5", glow: "rgba(155,93,229,0.15)" },
    { Icon: Trophy, val: "67", unit: "%", sub: "Avancée certification", accent: "#F59E0B", glow: "rgba(245,158,11,0.15)" },
  ];
  return (
    <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
      <div>
        <h2 className="text-2xl font-black mb-0.5" style={{ fontFamily: "'Funnel Display',sans-serif" }}><GT>Mon tableau de bord</GT></h2>
        <p className="text-sm" style={{ color: th.fg3 }}>Tes statistiques et ta progression en temps réel</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {KPIS.map(({ Icon, val, unit, sub, accent, glow }) => (
          <GCard key={sub}><div className="p-5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: glow, border: `1px solid ${accent}25` }}><Icon className="w-5 h-5" style={{ color: accent }} /></div>
            <div className="flex items-baseline gap-1 mb-0.5"><span className="text-2xl font-black" style={{ fontFamily: "'Funnel Display',sans-serif", color: th.fg }}>{val}</span><span className="text-sm font-semibold" style={{ color: accent }}>{unit}</span></div>
            <div className="text-xs" style={{ color: th.fg3 }}>{sub}</div>
          </div></GCard>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 space-y-5">
          <GCard glow><div className="p-6">
            <div className="flex items-start gap-6">
              <div className="relative shrink-0">
                <CircleProgress pct={67} size={92} />
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <span className="text-xl font-black" style={{ fontFamily: "'Funnel Display',sans-serif", color: th.fg }}>67%</span>
                  <span className="text-[9px] uppercase tracking-wider" style={{ color: th.fg3 }}>certif.</span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1"><Trophy className="w-4 h-4 text-amber-400" /><span className="text-sm font-black" style={{ color: th.fg }}>Certification IA Pro</span><span className="text-[10px] px-2 py-0.5 rounded-full font-bold ml-auto" style={{ background: "rgba(245,158,11,0.12)", color: "#F59E0B", border: "1px solid rgba(245,158,11,0.25)" }}>15 mars 2026</span></div>
                <p className="text-xs mb-4" style={{ color: th.fg3 }}>Continue à ce rythme — tu seras prêt·e 3 semaines avant la soutenance.</p>
                <div className="space-y-2.5">
                  {CERT_CHAPTERS.map(({ title, pct, done, active }) => (
                    <div key={title} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: done ? "rgba(74,222,128,0.15)" : active ? "rgba(155,93,229,0.12)" : "rgba(155,93,229,0.04)", border: `1px solid ${done ? "rgba(74,222,128,0.4)" : active ? "rgba(155,93,229,0.3)" : th.sep}` }}>
                        {done ? <CheckCircle className="w-3 h-3 text-green-400" /> : active ? <div className="w-1.5 h-1.5 rounded-full bg-violet-400" /> : <Lock className="w-2.5 h-2.5" style={{ color: th.fg3 }} />}
                      </div>
                      <span className="text-xs flex-1 truncate" style={{ color: done ? "rgba(74,222,128,0.8)" : active ? th.navAC : th.fg3 }}>{title}</span>
                      {done && <span className="text-[10px] font-bold text-green-400 shrink-0">100%</span>}
                      {active && (
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="w-16 h-1 rounded-full overflow-hidden" style={{ background: th.isDark ? "rgba(255,255,255,0.06)" : "rgba(155,93,229,0.1)" }}>
                            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "linear-gradient(90deg,#9B5DE5,#DDAEEA)" }} />
                          </div>
                          <span className="text-[10px] font-bold" style={{ color: th.navAC }}>{pct}%</span>
                        </div>
                      )}
                      {!done && !active && <span className="text-[10px] shrink-0" style={{ color: th.fg3 }}>Verrouillé</span>}
                    </div>
                  ))}
                </div>
                <div className="mt-5 pt-4" style={{ borderTop: `1px solid ${th.sep}` }}>
                  <ShimBtn onClick={goLesson} sm><span className="flex items-center gap-2"><Award className="w-4 h-4" />S'entraîner pour la soutenance</span></ShimBtn>
                </div>
              </div>
            </div>
          </div></GCard>

          <GCard><div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div><h3 className="text-sm font-black mb-0.5" style={{ color: th.fg }}>Courbe de mémoire & révisions IA</h3><p className="text-xs" style={{ color: th.fg3 }}>L'IA planifie tes répétitions pour ne rien oublier</p></div>
              <div className="flex gap-4 text-xs" style={{ color: th.fg3 }}>
                <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-0.5 rounded" style={{ background: "#9B5DE5" }} />Avec IA</span>
                <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-0.5 rounded bg-orange-400/60" />Sans révision</span>
              </div>
            </div>
            <div style={{ height: 160 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={MEMORY_DATA} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={th.sep} vertical={false} />
                  <XAxis dataKey="t" tick={{ fill: th.fg3, fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: th.fg3, fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 100]} tickFormatter={v => `${v}%`} />
                  <Tooltip content={<MemTip />} />
                  <Area type="monotone" dataKey="decay" stroke="#FB923C" strokeWidth={1.5} strokeDasharray="4 3" fill="rgba(251,146,60,0.08)" dot={false} />
                  <Area type="monotone" dataKey="ai" stroke="#9B5DE5" strokeWidth={2.5} fill="rgba(155,93,229,0.12)" dot={{ fill: "#9B5DE5", r: 3, strokeWidth: 0 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div></GCard>
        </div>

        <div className="space-y-4">
          <GCard><div className="p-5">
            <div className="flex items-center gap-2 mb-4"><Brain className="w-4 h-4" style={{ color: th.navAC }} /><span className="text-sm font-bold" style={{ color: th.fg }}>Profil de compétences</span></div>
            <div className="space-y-3">
              {SKILLS.map(({ label, pct, strong }) => (
                <div key={label}>
                  <div className="flex justify-between items-center mb-1"><span className="text-xs" style={{ color: th.fg2 }}>{label}</span><span className="text-xs font-black" style={{ color: strong ? "#4ADE80" : "#F59E0B" }}>{pct}%</span></div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: th.isDark ? "rgba(255,255,255,0.05)" : "rgba(155,93,229,0.08)" }}>
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: strong ? "linear-gradient(90deg,#16A34A,#4ADE80)" : "linear-gradient(90deg,#B45309,#F59E0B)" }} />
                  </div>
                </div>
              ))}
            </div>
          </div></GCard>

          <GCard><div className="p-5">
            <div className="flex items-center gap-2 mb-4"><Award className="w-4 h-4" style={{ color: th.navAC }} /><span className="text-sm font-bold" style={{ color: th.fg }}>Badges obtenus</span></div>
            <div className="space-y-2">
              {BADGES.filter(b => b.done).map(({ emoji, label }) => (
                <div key={label} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl" style={{ background: "rgba(155,93,229,0.06)", border: `1px solid rgba(155,93,229,0.15)` }}>
                  <span className="text-lg">{emoji}</span><span className="text-xs font-medium" style={{ color: th.fg2 }}>{label}</span>
                </div>
              ))}
              <p className="text-xs mt-2" style={{ color: th.fg3 }}>3 badges restants à débloquer</p>
            </div>
          </div></GCard>
        </div>
      </div>
    </div>
  );
}
