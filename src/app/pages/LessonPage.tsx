import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  ChevronRight, ChevronLeft, Mic, Send,
  Sparkles, MessageSquare, CheckCircle, X,
  Lightbulb, Pause, Monitor, AlignLeft,
  Network, RotateCcw, Volume2, Maximize2,
  Play, Brain, Zap,
} from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { useProfile } from "@/app/state/profile-context";
import { Background } from "@/app/components/common/Background";
import { GCard } from "@/app/components/common/GCard";
import { VBtn } from "@/app/components/common/Buttons";
import { cx } from "@/app/lib/cx";
import { QUIZ_Q, AI_RESPONSES, DEFAULT_AI } from "@/app/data/mock";
import type { ChatMsg } from "@/app/types";

export function LessonPage() {
  const th = useTh();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const goBack = () => navigate("/");
  type LTab = "video" | "transcript" | "mindmap";
  const [tab, setTab] = useState<LTab>("video");
  const [playing, setPlaying] = useState(false);
  const [quizSel, setQuizSel] = useState<number | null>(null);
  const [showExpl, setShowExpl] = useState(false);
  const [msgs, setMsgs] = useState<ChatMsg[]>([{ role: "ai", text: DEFAULT_AI }]);
  const [chatIn, setChatIn] = useState("");
  const [typing, setTyping] = useState(false);
  const [voice, setVoice] = useState(false);
  const chatEnd = useRef<HTMLDivElement>(null);
  const firstName = profile.name.split(" ")[0] || "Alex";

  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, typing]);

  const sendMsg = (text: string) => {
    if (!text.trim()) return;
    setMsgs(m => [...m, { role: "user", text: text.trim() }]);
    setChatIn(""); setTyping(true);
    setTimeout(() => { const lc = text.toLowerCase(); const hit = AI_RESPONSES.find(r => r.kw.some(k => lc.includes(k))); setTyping(false); setMsgs(m => [...m, { role: "ai", text: hit?.text ?? DEFAULT_AI }]); }, 900);
  };

  const TABS: { id: LTab; Icon: typeof Monitor; label: string }[] = [
    { id: "video", Icon: Monitor, label: "Vidéo" }, { id: "transcript", Icon: AlignLeft, label: "Transcription" }, { id: "mindmap", Icon: Network, label: "Mindmap" },
  ];

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: th.bg, fontFamily: "'Inter',sans-serif" }}>
      <Background />
      <div className="relative z-10 shrink-0 flex items-center justify-between px-6 py-3" style={{ borderBottom: `1px solid ${th.sep}`, background: th.topbar, backdropFilter: "blur(24px)" }}>
        <div className="flex items-center gap-4">
          <button onClick={goBack} className="flex items-center gap-1.5 text-sm transition-colors hover:opacity-70" style={{ color: th.fg3 }}><ChevronLeft className="w-4 h-4" />Dashboard</button>
          <div className="w-px h-4" style={{ background: th.sep }} />
          <span className="text-xs" style={{ color: th.fg3 }}>Module 2</span><span className="text-xs mx-1" style={{ color: th.fg3 }}>›</span><span className="text-xs font-medium" style={{ color: th.fg }}>Maîtriser le Prompt Engineering</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 text-xs" style={{ color: th.fg3 }}>
            Progression
            <div className="w-28 h-1.5 rounded-full overflow-hidden" style={{ background: th.isDark ? "rgba(255,255,255,0.07)" : "rgba(155,93,229,0.1)" }}>
              <div className="h-full rounded-full" style={{ width: "64%", background: "linear-gradient(90deg,#7C3AED,#DDAEEA)" }} />
            </div>
            <span className="font-bold" style={{ color: th.navAC }}>64%</span>
          </div>
          <VBtn sm>Leçon suivante <ChevronRight className="inline w-4 h-4" /></VBtn>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative z-10">
        <div className="flex-1 min-w-0 overflow-y-auto">
          <div className="relative" style={{ paddingBottom: "40%", background: "#060410" }}>
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute inset-0" style={{ background: "linear-gradient(135deg,#0d0522,#1a0b3c 45%,#08060F)" }} />
              <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 28% 55%,rgba(155,93,229,0.25),transparent 55%)" }} />
              {tab === "video" && <div className="absolute inset-0 flex items-center justify-center"><button onClick={() => setPlaying(p => !p)} className="w-16 h-16 rounded-full flex items-center justify-center border border-white/15 hover:scale-110 transition-transform" style={{ background: "rgba(255,255,255,0.08)", backdropFilter: "blur(20px)", boxShadow: "0 0 40px rgba(155,93,229,0.3)" }}>{playing ? <Pause className="w-6 h-6 text-white" /> : <Play className="w-6 h-6 text-white ml-1" />}</button></div>}
              {tab === "transcript" && (
                <div className="absolute inset-0 overflow-y-auto p-6" style={{ background: "rgba(8,6,15,0.8)", backdropFilter: "blur(8px)" }}>
                  <div className="max-w-xl mx-auto space-y-3">
                    {[{ t: "00:00", txt: "Introduction au prompt engineering et à la formule fondamentale.", hi: false }, { t: "01:24", txt: "Rôle + Contexte + Tâche + Format — ce framework peut tripler la qualité de vos résultats.", hi: true }, { t: "03:52", txt: "Exemple : 'Tu es expert en vente SaaS. Rédige un email de 120 mots pour relancer un prospect…'", hi: false }, { t: "07:10", txt: "La température contrôle la créativité. Basse = précision, haute = créativité.", hi: true }].map(({ t, txt, hi }) => (
                      <div key={t} className={cx("flex gap-3 p-3 rounded-xl", hi && "border")} style={hi ? { background: "rgba(155,93,229,0.07)", borderColor: "rgba(155,93,229,0.2)" } : {}}>
                        <span className="text-[10px] text-white/30 font-mono shrink-0 pt-0.5">{t}</span>
                        <p className={cx("text-sm leading-relaxed", hi ? "text-white/80" : "text-white/40")}>{txt}</p>
                        {hi && <Lightbulb className="w-3.5 h-3.5 text-violet-400/50 shrink-0 mt-0.5" />}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {tab === "mindmap" && (
                <div className="absolute inset-0 flex items-center justify-center p-6" style={{ background: "rgba(8,6,15,0.8)", backdropFilter: "blur(8px)" }}>
                  <svg viewBox="0 0 520 300" className="w-full max-w-xl">
                    <ellipse cx="260" cy="150" rx="78" ry="34" fill="rgba(155,93,229,0.15)" stroke="rgba(221,174,234,0.6)" strokeWidth="1.5" />
                    <text x="260" y="155" textAnchor="middle" fill="#DDAEEA" fontSize="11" fontWeight="800">Prompt Engineering</text>
                    {[{ cx: 80, cy: 75, label: "Rôle", color: "#60A5FA", lx: 185, ly: 127 }, { cx: 80, cy: 225, label: "Contexte", color: "#4ADE80", lx: 187, ly: 170 }, { cx: 440, cy: 75, label: "Tâche", color: "#F59E0B", lx: 333, ly: 127 }, { cx: 440, cy: 225, label: "Format", color: "#F472B6", lx: 335, ly: 170 }].map(({ cx: ccx, cy, label, color, lx, ly }) => (
                      <g key={label}><line x1={lx} y1={ly} x2={ccx} y2={cy} stroke={color} strokeWidth="1" strokeOpacity="0.35" strokeDasharray="4 3" /><ellipse cx={ccx} cy={cy} rx="48" ry="24" fill={`${color}15`} stroke={color} strokeWidth="1" strokeOpacity="0.55" /><text x={ccx} y={cy + 4} textAnchor="middle" fill={color} fontSize="10" fontWeight="700">{label}</text></g>
                    ))}
                  </svg>
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 px-5 pb-4" style={{ background: "linear-gradient(to top,rgba(8,6,15,0.9),transparent)" }}>
                <div className="flex items-center justify-between mb-2"><span className="text-xs text-white/40">Maîtriser le Prompt Engineering</span><div className="flex items-center gap-3 text-white/40">{[Volume2, Maximize2].map((Icon, i) => <button key={i}><Icon className="w-4 h-4" /></button>)}</div></div>
                <div className="h-1 rounded-full cursor-pointer overflow-hidden mb-1" style={{ background: "rgba(255,255,255,0.1)" }}><div className="h-full rounded-full" style={{ width: "38%", background: "linear-gradient(90deg,#7C3AED,#DDAEEA)" }} /></div>
                <div className="flex justify-between text-[10px] text-white/25 font-mono"><span>8:47</span><span>23:00</span></div>
              </div>
            </div>
          </div>

          <div className="flex shrink-0" style={{ background: th.topbar, backdropFilter: "blur(20px)", borderBottom: `1px solid ${th.sep}` }}>
            {TABS.map(({ id, Icon, label }) => (
              <button key={id} onClick={() => setTab(id)} className="flex items-center gap-2 px-5 py-3 text-sm font-semibold transition-all border-b-2 -mb-px"
                style={{ borderColor: tab === id ? th.navAC : "transparent", color: tab === id ? th.navAC : th.fg3 }}>
                <Icon className="w-3.5 h-3.5" />{label}
              </button>
            ))}
          </div>

          <div className="p-6 space-y-5">
            <GCard><div className="p-5">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(155,93,229,0.1)", border: "1px solid rgba(155,93,229,0.2)" }}><Brain className="w-4 h-4" style={{ color: th.navAC }} /></div>
                <span className="text-sm font-black" style={{ color: th.fg }}>Quiz Adaptatif IA</span>
                <span className="ml-auto text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: "rgba(155,93,229,0.06)", color: th.navAC, border: "1px solid rgba(155,93,229,0.15)" }}>Généré en direct</span>
              </div>
              <p className="text-sm font-semibold mb-4" style={{ color: th.fg }}>{QUIZ_Q.question}</p>
              <div className="space-y-2 mb-4">
                {QUIZ_Q.options.map((opt, i) => {
                  let bg = th.isDark ? "rgba(255,255,255,0.03)" : th.inputBg, border = th.inputB, color = th.fg2;
                  if (quizSel !== null) { if (i === QUIZ_Q.correct) { bg = "rgba(74,222,128,0.1)"; border = "rgba(74,222,128,0.35)"; color = "#4ADE80"; } else if (i === quizSel) { bg = "rgba(248,113,113,0.1)"; border = "rgba(248,113,113,0.35)"; color = "#F87171"; } else { bg = "transparent"; border = th.sep; color = th.fg3; } }
                  return (
                    <button key={i} onClick={() => { if (quizSel === null) { setQuizSel(i); setShowExpl(true); } }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-left transition-all"
                      style={{ background: bg, border: `1px solid ${border}`, color }}>
                      <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ background: th.isDark ? "rgba(255,255,255,0.06)" : "rgba(155,93,229,0.06)" }}>
                        {quizSel !== null && i === QUIZ_Q.correct ? <CheckCircle className="w-4 h-4 text-green-400" /> : quizSel !== null && i === quizSel ? <X className="w-4 h-4 text-red-400" /> : String.fromCharCode(65 + i)}
                      </span>{opt}
                    </button>
                  );
                })}
              </div>
              {showExpl && <div className="rounded-xl p-4" style={{ background: "rgba(96,165,250,0.07)", border: "1px solid rgba(96,165,250,0.2)" }}>
                <div className="flex items-center gap-1.5 mb-2 text-xs font-bold text-blue-400"><Lightbulb className="w-3.5 h-3.5" />Explication IA</div>
                <p className="text-xs leading-relaxed" style={{ color: th.fg2 }}>{QUIZ_Q.explanation}</p>
                <button onClick={() => { setQuizSel(null); setShowExpl(false); }} className="mt-3 flex items-center gap-1.5 text-xs font-semibold transition-opacity hover:opacity-70" style={{ color: th.navAC }}><RotateCcw className="w-3 h-3" />Nouvelle question</button>
              </div>}
            </div></GCard>
          </div>
        </div>

        {/* Copilot */}
        <div className="w-80 shrink-0 flex flex-col" style={{ borderLeft: `1px solid ${th.sep}`, background: th.sidebar, backdropFilter: "blur(24px)" }}>
          <div className="shrink-0 px-4 py-4" style={{ borderBottom: `1px solid ${th.sep}` }}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#9B5DE5,#DDAEEA)" }}><Sparkles className="w-4 h-4" style={{ color: "#08060F" }} /></div>
              <div><div className="text-sm font-black" style={{ color: th.fg }}>Copilote IA</div><div className="text-[10px]" style={{ color: th.fg3 }}>Tuteur activé</div></div>
              <div className="ml-auto flex items-center gap-1.5 text-[10px] text-green-500 font-bold"><div className="w-1.5 h-1.5 rounded-full bg-green-500" style={{ animation: "dot-blink 2s ease-in-out infinite" }} />En ligne</div>
            </div>
            <div className="rounded-xl px-3 py-2.5" style={{ background: "rgba(155,93,229,0.07)", border: "1px solid rgba(155,93,229,0.15)" }}>
              <p className="text-[11px] leading-relaxed" style={{ color: th.navAC }}>💡 <strong>Pour {firstName} :</strong> Chaque concept → applique-le immédiatement en pratique.</p>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {msgs.map((m, i) => (
              <div key={i} className={cx("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                {m.role === "ai" && <div className="w-6 h-6 rounded-full flex items-center justify-center mr-2 mt-0.5 shrink-0" style={{ background: "linear-gradient(135deg,#9B5DE5,#DDAEEA)" }}><Sparkles className="w-3 h-3" style={{ color: "#08060F" }} /></div>}
                <div className="max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-line"
                  style={m.role === "user" ? { background: "linear-gradient(135deg,#7C3AED,#DDAEEA)", color: "#08060F", fontWeight: 600, borderRadius: "16px 16px 4px 16px" } : { background: th.isDark ? "rgba(255,255,255,0.05)" : "rgba(155,93,229,0.06)", border: `1px solid ${th.sep}`, color: th.fg2, borderRadius: "16px 16px 16px 4px" }}>
                  {m.text}
                </div>
              </div>
            ))}
            {typing && <div className="flex"><div className="w-6 h-6 rounded-full flex items-center justify-center mr-2 shrink-0" style={{ background: "linear-gradient(135deg,#9B5DE5,#DDAEEA)" }}><Sparkles className="w-3 h-3" style={{ color: "#08060F" }} /></div><div className="px-4 py-3 rounded-2xl flex gap-1 items-center" style={{ background: th.isDark ? "rgba(255,255,255,0.05)" : "rgba(155,93,229,0.06)", border: `1px solid ${th.sep}` }}>{[0, 1, 2].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: "rgba(155,93,229,0.6)", animation: `bounce-dot 1.2s ease-in-out ${i * 0.15}s infinite` }} />)}</div></div>}
            <div ref={chatEnd} />
          </div>
          <div className="px-4 py-3 shrink-0" style={{ borderTop: `1px solid ${th.sep}` }}>
            <div className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: th.fg3 }}>Actions rapides</div>
            {[{ Icon: MessageSquare, label: "Reformule simplement", cmd: "reformule simplement" }, { Icon: Lightbulb, label: "Exemple pour mon métier", cmd: "exemple concret métier" }, { Icon: Zap, label: "Crash test 2 min", cmd: "crash test" }].map(({ Icon, label, cmd }) => (
              <button key={label} onClick={() => sendMsg(cmd)} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs text-left mb-1.5 transition-opacity hover:opacity-70" style={{ background: th.isDark ? "rgba(255,255,255,0.025)" : "rgba(155,93,229,0.05)", border: `1px solid ${th.sep}`, color: th.fg2 }}>
                <Icon className="w-3.5 h-3.5 shrink-0" style={{ color: th.navAC }} />{label}
              </button>
            ))}
          </div>
          <div className="px-4 pb-4 pt-1 shrink-0">
            <div className="flex gap-2">
              <input value={chatIn} onChange={e => setChatIn(e.target.value)} onKeyDown={e => e.key === "Enter" && !typing && sendMsg(chatIn)} placeholder="Pose ta question…" className="flex-1 rounded-xl px-3 py-2.5 text-sm g-input" />
              <button onClick={() => setVoice(v => !v)} className="w-10 h-10 rounded-xl flex items-center justify-center transition-all shrink-0" style={voice ? { background: "linear-gradient(135deg,#9B5DE5,#DDAEEA)" } : { background: th.inputBg, border: `1px solid ${th.inputB}` }}>
                <Mic className="w-4 h-4" style={{ color: voice ? "#08060F" : th.fg3 }} />
              </button>
              <button onClick={() => sendMsg(chatIn)} disabled={!chatIn.trim() || typing} className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 disabled:opacity-30" style={{ background: "linear-gradient(135deg,#9B5DE5,#DDAEEA)" }}>
                <Send className="w-4 h-4" style={{ color: "#08060F" }} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
