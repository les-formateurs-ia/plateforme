import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Send, Sparkles, RotateCcw, Target } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { GCard } from "@/app/components/common/GCard";
import { GT } from "@/app/components/common/GT";
import { VBtn, ShimBtn } from "@/app/components/common/Buttons";
import {
  startReversePromptSession, submitReversePromptAttempt,
  type ReversePromptSession, type ReversePromptAttempt,
} from "@/app/lib/reversePrompting";

const RED = "#f87171";

export function ReversePromptingPage() {
  const th = useTh();
  const navigate = useNavigate();

  const [session, setSession] = useState<ReversePromptSession | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [attempts, setAttempts] = useState<ReversePromptAttempt[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const startNewSession = () => {
    setLoadingSession(true);
    setSessionError(null);
    setAttempts([]);
    setPrompt("");
    startReversePromptSession()
      .then(setSession)
      .catch((err) => setSessionError(err instanceof Error ? err.message : "Impossible de générer l'image cible."))
      .finally(() => setLoadingSession(false));
  };

  useEffect(() => { startNewSession(); }, []);

  const handleSubmit = async () => {
    if (!prompt.trim() || !session || submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const attempt = await submitReversePromptAttempt(session.id, prompt.trim());
      setAttempts((prev) => [...prev, attempt]);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Erreur lors de la génération.");
    } finally {
      setSubmitting(false);
    }
  };

  const lastAttempt = attempts[attempts.length - 1] ?? null;

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <button onClick={() => navigate("/practice2")} className="flex items-center gap-1.5 text-sm mb-2 transition-colors hover:opacity-70" style={{ color: th.fg3 }}>
            <ArrowLeft className="w-4 h-4" />Exercez-vous 2 !
          </button>
          <h2 className="text-2xl font-black flex items-center gap-2" style={{ fontFamily: "'Funnel Display',sans-serif" }}><Target className="w-5 h-5" /><GT>Rétro-ingénierie</GT></h2>
          <p className="text-sm mt-0.5" style={{ color: th.fg3 }}>Devine le prompt qui a généré cette image, et compare ton résultat.</p>
        </div>
        <VBtn sm onClick={startNewSession} disabled={loadingSession}><span className="flex items-center gap-1.5"><RotateCcw className="w-3.5 h-3.5" />Nouvel essai</span></VBtn>
      </div>

      {loadingSession && <GCard><div className="p-8 text-center text-sm flex items-center justify-center gap-2" style={{ color: th.fg3 }}><Sparkles className="w-4 h-4 animate-pulse" />Génération de l'image cible…</div></GCard>}
      {!loadingSession && sessionError && <GCard><div className="p-6 text-sm" style={{ color: RED }}>{sessionError}</div></GCard>}

      {!loadingSession && !sessionError && session && (
        <>
          <GCard glow><div className="p-5 space-y-3">
            <h3 className="text-xs font-black uppercase tracking-widest" style={{ color: th.navAC }}>Image cible</h3>
            <img src={session.targetImageUrl ?? undefined} className="w-full rounded-xl bg-black mx-auto" style={{ maxWidth: 480, aspectRatio: "1/1", objectFit: "cover" }} />
          </div></GCard>

          <GCard><div className="p-6 space-y-4">
            <label className="text-sm font-bold block" style={{ color: th.fg }}>Ton prompt</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              placeholder="Décris ce que tu vois pour tenter de reproduire l'image…"
              className="w-full rounded-xl px-4 py-3 text-sm g-input resize-y"
              style={{ minHeight: 100 }}
            />
            {submitError && <p className="text-xs" style={{ color: RED }}>{submitError}</p>}
            <ShimBtn onClick={handleSubmit} disabled={!prompt.trim() || submitting}>
              <span className="flex items-center gap-2">
                {submitting ? <><Sparkles className="w-4 h-4 animate-pulse" />Génération en cours…</> : <><Send className="w-4 h-4" />Tester mon prompt</>}
              </span>
            </ShimBtn>
          </div></GCard>

          {lastAttempt && (
            <GCard><div className="p-6 space-y-4">
              <h3 className="text-sm font-black" style={{ color: th.fg }}>Comparaison — tentative n°{lastAttempt.attemptNumber}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="text-xs font-bold" style={{ color: th.fg3 }}>Image cible</div>
                  <img src={session.targetImageUrl ?? undefined} className="w-full rounded-xl bg-black" style={{ aspectRatio: "1/1", objectFit: "cover" }} />
                </div>
                <div className="space-y-2">
                  <div className="text-xs font-bold" style={{ color: th.navAC }}>Ton résultat</div>
                  <img src={lastAttempt.imageUrl ?? undefined} className="w-full rounded-xl bg-black" style={{ aspectRatio: "1/1", objectFit: "cover" }} />
                </div>
              </div>
            </div></GCard>
          )}

          {attempts.length > 1 && (
            <GCard><div className="p-5 space-y-3">
              <h3 className="text-xs font-black uppercase tracking-widest" style={{ color: th.navAC }}>Tentatives précédentes</h3>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {attempts.slice(0, -1).map((a) => (
                  <img key={a.id} src={a.imageUrl ?? undefined} title={a.promptText} className="w-full rounded-lg bg-black" style={{ aspectRatio: "1/1", objectFit: "cover" }} />
                ))}
              </div>
            </div></GCard>
          )}
        </>
      )}
    </div>
  );
}
