import { useEffect, useRef } from "react";
import { Mic, Phone, PhoneOff } from "lucide-react";
import { NeuralField, type NeuralFieldHandle } from "@/app/components/particles/NeuralField";
import { cx } from "@/app/lib/cx";

type Status = "idle" | "connecting" | "connected";
type Mode = "listening" | "speaking";

// Onglet « Agent » d'une leçon : appel vocal avec l'agent IA. Sur fond noir,
// le réseau de la marque réagit à la conversation (il s'active quand l'élève
// parle, s'emballe quand l'agent répond) autour d'un orbe au dégradé iris qui
// tourne, respire et ondule selon l'état. Parole en push-to-talk : bouton à
// maintenir, ou barre d'espace.
export function LessonVoiceAgent({ status, mode, ptt, error, onStart, onEnd, onPttStart, onPttStop }: {
  status: Status; mode: Mode; ptt: boolean; error: string | null;
  onStart: () => void; onEnd: () => void; onPttStart: () => void; onPttStop: () => void;
}) {
  const field = useRef<NeuralFieldHandle>(null);
  const speaking = status === "connected" && mode === "speaking";

  // Le réseau suit la conversation : l'élève parle → activité modérée,
  // l'agent répond → forte activité.
  useEffect(() => {
    if (!speaking && !ptt) return;
    const id = window.setInterval(() => field.current?.excite(speaking ? 0.35 : 0.18), 300);
    return () => window.clearInterval(id);
  }, [speaking, ptt]);

  // Barre d'espace maintenue = parler (hors champs de saisie).
  useEffect(() => {
    if (status !== "connected") return;
    const typing = (t: EventTarget | null) => t instanceof HTMLElement && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
    const down = (e: KeyboardEvent) => { if (e.code === "Space" && !e.repeat && !typing(e.target)) { e.preventDefault(); onPttStart(); } };
    const up = (e: KeyboardEvent) => { if (e.code === "Space" && !typing(e.target)) { e.preventDefault(); onPttStop(); } };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, [status, onPttStart, onPttStop]);

  const title = status === "connecting" ? "Connexion à ton agent…"
    : status === "connected" ? (speaking ? "Ton agent te répond" : ptt ? "Je t'écoute…" : "À toi de parler")
    : "Discute de la leçon à voix haute";
  const hint = status === "connected"
    ? (speaking ? "Écoute la réponse, puis reprends la parole quand tu veux." : "Maintiens le micro, ou la barre d'espace, pendant que tu parles.")
    : status === "connecting" ? "Autorise l'accès au micro si ton navigateur le demande."
    : "Pose tes questions, fais-toi expliquer une notion ou entraîne-toi à reformuler : ton agent connaît le cours.";

  return (
    <div className="relative overflow-hidden rounded-[10px] bg-black text-white flex flex-col items-center justify-center gap-8 px-6 py-12 mb-5" style={{ minHeight: "min(74vh, 640px)" }}>
      <NeuralField ref={field} dark density={4.2} band={1} active={status === "connecting"} />
      <div aria-hidden className="absolute inset-0" style={{ background: "radial-gradient(ellipse 48% 62% at 50% 55%, rgba(0,0,0,0.82) 35%, transparent 80%)" }} />

      {/* Orbe : dégradé iris qui tourne ; respire au repos, ondule quand l'agent parle. */}
      <div className={cx("voice-orb relative w-[168px] h-[168px] sm:w-[200px] sm:h-[200px]", `voice-orb--${status === "connected" ? (speaking ? "speaking" : ptt ? "listening" : "ready") : status}`)} aria-hidden>
        {speaking && <><span className="voice-ripple" /><span className="voice-ripple" style={{ animationDelay: "0.7s" }} /></>}
        <span className="voice-orb__glow" />
        <span className="voice-orb__core" />
      </div>

      <div className="relative text-center max-w-md" role="status" aria-live="polite">
        <p className="eyebrow text-white/55">Agent vocal</p>
        <p className="mt-3 text-[1.6rem] sm:text-[2rem] font-extrabold leading-tight tracking-[-0.03em]">{title}</p>
        <p className="mt-3 text-[15px] text-white/60 leading-relaxed">{hint}</p>
        {error && <p className="mt-3 text-sm text-[#fbc2ad]">{error}</p>}
      </div>

      <div className="relative flex flex-col items-center gap-4">
        {status !== "connected" ? (
          <button type="button" onClick={onStart} disabled={status === "connecting"}
            className="sweep inline-flex items-center gap-2.5 min-h-[52px] px-7 rounded-[2px] bg-white text-black text-base font-semibold disabled:opacity-60">
            <Phone className="w-4 h-4" />{status === "connecting" ? "Connexion…" : "Démarrer l'appel"}
          </button>
        ) : (
          <>
            <button type="button"
              onPointerDown={(e) => { e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId); onPttStart(); }}
              onPointerUp={onPttStop} onPointerCancel={onPttStop}
              aria-pressed={ptt} aria-label="Maintenir pour parler"
              className={cx("voice-ptt relative w-[84px] h-[84px] rounded-full flex items-center justify-center select-none touch-none transition-transform duration-150", ptt && "scale-95")}
              style={{ background: ptt ? "var(--grad-iris)" : "#fff", color: "#000" }}>
              {ptt && <span className="voice-ptt__ring" aria-hidden />}
              <Mic className="w-7 h-7" />
            </button>
            <p className="text-sm text-white/60">{ptt ? "Relâche pour envoyer" : "Maintiens pour parler · ou la barre d'espace"}</p>
            <button type="button" onClick={onEnd} className="mt-1 inline-flex items-center gap-2 min-h-10 px-4 rounded-[2px] text-sm font-semibold border border-[#e5484d]/60 text-[#ff8a8d] hover-fine:bg-[#e5484d] hover-fine:text-white transition-colors">
              <PhoneOff className="w-4 h-4" />Raccrocher
            </button>
          </>
        )}
      </div>
    </div>
  );
}
