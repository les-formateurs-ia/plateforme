import { useState } from "react";
import { Trophy, CheckCircle, Lock, Award, Sparkles, Sun, Moon } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { useProfile } from "@/app/state/profile-context";
import { GCard } from "@/app/components/common/GCard";
import { CircleProgress } from "@/app/components/common/CircleProgress";
import { ShimBtn } from "@/app/components/common/Buttons";
import { cx } from "@/app/lib/cx";
import { CERT_CHAPTERS, BADGES } from "@/app/data/mock";

export function ProfilePage() {
  const th = useTh();
  const { profile } = useProfile();
  const name = profile.name || "Alex Dubois";
  const [tab, setTab] = useState<"overview" | "badges" | "settings">("overview");

  return (
    <div className="flex-1 overflow-y-auto px-8 py-6 space-y-5">
      <GCard glow>
        <div className="p-6 flex items-center gap-6">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-black shrink-0" style={{ background: "linear-gradient(135deg,#7C3AED,#DDAEEA)", color: "#08060F" }}>{name[0]}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-xl font-black" style={{ fontFamily: "'Funnel Display',sans-serif", color: th.fg }}>{name}</h2>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: "rgba(155,93,229,0.1)", color: th.navAC, border: "1px solid rgba(155,93,229,0.25)" }}>Apprenant IA Pro</span>
            </div>
            <p className="text-sm mb-3" style={{ color: th.fg3 }}>{profile.profession || "Chef de projet digital"} · En formation depuis août 2026</p>
            <div className="flex items-center gap-6">
              {[{ val: "13", sub: "Leçons" }, { val: "47", sub: "Prompts" }, { val: "4h32", sub: "Pratique" }, { val: "67%", sub: "Certif." }].map(({ val, sub }) => (
                <div key={sub} className="text-center"><div className="text-lg font-black" style={{ fontFamily: "'Funnel Display',sans-serif", color: th.navAC }}>{val}</div><div className="text-[10px]" style={{ color: th.fg3 }}>{sub}</div></div>
              ))}
            </div>
          </div>
          <div className="relative shrink-0">
            <CircleProgress pct={67} size={80} />
            <div className="absolute inset-0 flex items-center justify-center flex-col">
              <span className="text-base font-black" style={{ color: th.fg }}>67%</span>
              <span className="text-[8px]" style={{ color: th.fg3 }}>certif.</span>
            </div>
          </div>
        </div>
      </GCard>

      <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ background: th.isDark ? "rgba(255,255,255,0.04)" : "rgba(155,93,229,0.06)", border: `1px solid ${th.sep}` }}>
        {(["overview", "badges", "settings"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className="px-5 py-2 rounded-lg text-sm font-semibold transition-all"
            style={tab === t ? { background: th.isDark ? "rgba(155,93,229,0.14)" : "rgba(255,255,255,0.8)", color: th.navAC, border: `1px solid rgba(155,93,229,0.25)` } : { color: th.fg3, background: "transparent", border: "1px solid transparent" }}>
            {t === "overview" ? "Vue d'ensemble" : t === "badges" ? "Badges" : "Préférences"}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="grid grid-cols-2 gap-5">
          <GCard><div className="p-5">
            <div className="flex items-center gap-2 mb-4"><Trophy className="w-4 h-4 text-amber-400" /><span className="text-sm font-black" style={{ color: th.fg }}>Progression certification</span></div>
            <div className="space-y-3">
              {CERT_CHAPTERS.map(({ title, pct, done, active }) => (
                <div key={title}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0" style={{ background: done ? "rgba(74,222,128,0.15)" : active ? "rgba(155,93,229,0.12)" : "transparent", border: `1px solid ${done ? "rgba(74,222,128,0.4)" : active ? "rgba(155,93,229,0.3)" : th.sep}` }}>
                        {done ? <CheckCircle className="w-2.5 h-2.5 text-green-400" /> : active ? <div className="w-1.5 h-1.5 rounded-full" style={{ background: th.navAC }} /> : <Lock className="w-2 h-2" style={{ color: th.fg3 }} />}
                      </div>
                      <span className="text-xs" style={{ color: done ? "rgba(74,222,128,0.8)" : active ? th.navAC : th.fg3 }}>{title}</span>
                    </div>
                    <span className="text-xs font-bold" style={{ color: done ? "#4ADE80" : active ? th.navAC : th.fg3 }}>{pct}%</span>
                  </div>
                  <div className="h-1 rounded-full overflow-hidden" style={{ background: th.isDark ? "rgba(255,255,255,0.05)" : "rgba(155,93,229,0.08)" }}><div className="h-full rounded-full" style={{ width: `${pct}%`, background: done ? "linear-gradient(90deg,#16A34A,#4ADE80)" : active ? "linear-gradient(90deg,#9B5DE5,#DDAEEA)" : "transparent" }} /></div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${th.sep}` }}>
              <ShimBtn sm><span className="flex items-center gap-2"><Award className="w-4 h-4" />S'entraîner pour la soutenance</span></ShimBtn>
            </div>
          </div></GCard>

          <GCard><div className="p-5">
            <div className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: th.fg3 }}>Activité — 4 semaines</div>
            <div className="flex items-end gap-1 h-16">
              {[4, 7, 3, 8, 5, 6, 2, 9, 6, 7, 4, 5, 8, 6, 3, 7, 8, 5, 6, 9, 7, 4, 6, 8, 5, 7, 9, 6].map((h, i) => (
                <div key={i} className="flex-1 rounded-sm" style={{ height: `${h * 10}%`, background: i === 27 ? "linear-gradient(to top,#9B5DE5,#DDAEEA)" : "rgba(155,93,229,0.25)", opacity: i > 24 ? 1 : 0.5 }} />
              ))}
            </div>
          </div></GCard>
        </div>
      )}

      {tab === "badges" && (
        <div className="grid grid-cols-3 gap-4">
          {BADGES.map(({ emoji, label, done }) => (
            <GCard key={label}><div className={cx("p-5 text-center", !done && "opacity-40")}>
              <span className={cx("text-4xl block mb-3", !done && "grayscale")}>{emoji}</span>
              <div className="text-sm font-bold mb-1" style={{ color: done ? th.fg : th.fg3 }}>{label}</div>
              {done ? <span className="text-[10px] font-bold text-green-500">Obtenu ✓</span> : <span className="text-[10px] flex items-center justify-center gap-1" style={{ color: th.fg3 }}><Lock className="w-3 h-3" />Non débloqué</span>}
            </div></GCard>
          ))}
        </div>
      )}

      {tab === "settings" && (
        <div className="space-y-5 max-w-xl">
          {/* Theme toggle */}
          <GCard><div className="p-5 flex items-center justify-between">
            <div>
              <div className="text-sm font-bold mb-0.5" style={{ color: th.fg }}>Thème de l'interface</div>
              <div className="text-xs" style={{ color: th.fg3 }}>{th.isDark ? "Mode sombre activé — ambiance dark glass" : "Mode clair activé — interface lumineuse"}</div>
            </div>
            <button onClick={th.toggleTheme} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
              style={{ background: th.isDark ? "rgba(255,255,255,0.08)" : "rgba(155,93,229,0.1)", border: `1px solid ${th.sep}`, color: th.fg }}>
              {th.isDark ? <><Sun className="w-4 h-4 text-amber-400" />Passer en mode clair</> : <><Moon className="w-4 h-4" style={{ color: th.navAC }} />Passer en mode sombre</>}
            </button>
          </div></GCard>

          {/* Info fields */}
          <div className="grid grid-cols-2 gap-4">
            {[["Prénom", profile.name || "Alex"], ["Âge", "28 ans"], ["Profession", profile.profession || "Chef de projet"], ["Email", "alex@example.com"]].map(([label, val]) => (
              <div key={label}>
                <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: th.fg3 }}>{label}</label>
                <div className="w-full rounded-xl px-4 py-3 text-sm flex items-center justify-between" style={{ background: th.inputBg, border: `1px solid ${th.inputB}` }}>
                  <span style={{ color: th.fg2 }}>{val}</span>
                  <button className="text-xs transition-colors hover:opacity-70" style={{ color: th.navAC }}>Modifier</button>
                </div>
              </div>
            ))}
          </div>

          {/* Objectif professionnel */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: th.fg3 }}>Objectif professionnel</label>
            <div className="w-full rounded-xl px-4 py-3 text-sm" style={{ background: th.inputBg, border: `1px solid ${th.inputB}`, color: th.fg2, lineHeight: 1.7, minHeight: 80 }}>
              {profile.goalFinal || profile.goal || <span style={{ color: th.fg3 }}>Non renseigné — complète ton profil lors de l'onboarding.</span>}
            </div>
            {profile.goalFinal && profile.goalFinal !== profile.goal && (
              <p className="text-[10px] mt-1.5 flex items-center gap-1" style={{ color: th.navAC }}><Sparkles className="w-3 h-3" />Reformulé par l'IA lors de l'inscription</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
