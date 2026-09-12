import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Send, Sparkles, AlertTriangle, Swords } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { useAuth } from "@/app/state/auth-context";
import { GCard } from "@/app/components/common/GCard";
import { GT } from "@/app/components/common/GT";
import { ShimBtn } from "@/app/components/common/Buttons";
import { MarkdownText } from "@/app/components/common/MarkdownText";
import {
  ALLOWED_BATTLE_MODELS, runBattleGround, listMyBattleGroundAttempts,
  type BattleProvider, type BattleGroundAttempt,
} from "@/app/lib/battleGround";

const RED = "#f87171";

export function BattleGroundPage() {
  const th = useTh();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [prompt, setPrompt] = useState("");
  const [selected, setSelected] = useState<BattleProvider[]>(["gemini", "openai"]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [current, setCurrent] = useState<BattleGroundAttempt | null>(null);
  const [history, setHistory] = useState<BattleGroundAttempt[]>([]);

  useEffect(() => {
    if (!user) return;
    listMyBattleGroundAttempts(user.id).then(setHistory).catch(() => {});
  }, [user]);

  const toggleModel = (id: BattleProvider) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((m) => m !== id);
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  };

  const handleSubmit = async () => {
    if (!prompt.trim() || selected.length < 2 || submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const attempt = await runBattleGround(prompt.trim(), selected);
      setCurrent(attempt);
      setHistory((prev) => [attempt, ...prev]);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Erreur lors de la comparaison.");
    } finally {
      setSubmitting(false);
    }
  };

  const modelLabel = (id: BattleProvider) => ALLOWED_BATTLE_MODELS.find((m) => m.id === id)?.label ?? id;

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-6">
      <div>
        <button onClick={() => navigate("/practice2")} className="flex items-center gap-1.5 text-sm mb-2 transition-colors hover:opacity-70" style={{ color: th.fg3 }}>
          <ArrowLeft className="w-4 h-4" />Exercez-vous 2 !
        </button>
        <h2 className="text-2xl font-black flex items-center gap-2" style={{ fontFamily: "'Funnel Display',sans-serif" }}><Swords className="w-5 h-5" /><GT>Battle Ground</GT></h2>
        <p className="text-sm mt-0.5" style={{ color: th.fg3 }}>Un seul prompt, plusieurs IA — compare leurs réponses côte à côte.</p>
      </div>

      <GCard><div className="p-6 space-y-4">
        <label className="text-sm font-bold block" style={{ color: th.fg }}>Ton prompt</label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={5}
          placeholder="Ex : Explique la différence entre le machine learning et le deep learning en 3 phrases."
          className="w-full rounded-xl px-4 py-3 text-sm g-input resize-y"
          style={{ minHeight: 110 }}
        />
        <div>
          <div className="text-xs font-bold mb-2" style={{ color: th.fg3 }}>Modèles à comparer (2 à 3)</div>
          <div className="flex flex-wrap gap-2">
            {ALLOWED_BATTLE_MODELS.map(({ id, label }) => {
              const active = selected.includes(id);
              return (
                <button key={id} type="button" onClick={() => toggleModel(id)} disabled={submitting}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
                  style={active
                    ? { background: `linear-gradient(135deg,${th.grad1},${th.grad2})`, color: "#fff" }
                    : { background: th.inputBg, border: `1px solid ${th.inputB}`, color: th.fg3 }}>
                  {label}
                </button>
              );
            })}
          </div>
        </div>
        {submitError && <p className="text-xs" style={{ color: RED }}>{submitError}</p>}
        <ShimBtn onClick={handleSubmit} disabled={!prompt.trim() || selected.length < 2 || submitting}>
          <span className="flex items-center gap-2">
            {submitting ? <><Sparkles className="w-4 h-4 animate-pulse" />Comparaison en cours…</> : <><Send className="w-4 h-4" />Comparer</>}
          </span>
        </ShimBtn>
      </div></GCard>

      {current && (
        <div>
          <h3 className="text-sm font-bold mb-3" style={{ color: th.fg }}>Résultats</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" style={{ gridTemplateColumns: `repeat(${current.responses.length}, minmax(0, 1fr))` }}>
            {current.responses.map((r) => (
              <GCard key={r.provider}>
                <div className="p-5 space-y-3">
                  <div className="text-xs font-black uppercase tracking-widest" style={{ color: th.navAC }}>{modelLabel(r.provider)}</div>
                  {r.error
                    ? <div className="flex items-start gap-2 text-xs" style={{ color: RED }}><AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />{r.error}</div>
                    : <MarkdownText>{r.text ?? ""}</MarkdownText>}
                  {!r.error && <div className="text-[10px]" style={{ color: th.fg3 }}>{r.latencyMs} ms</div>}
                </div>
              </GCard>
            ))}
          </div>
        </div>
      )}

      {history.length > 0 && (
        <GCard><div className="p-5 space-y-3">
          <h3 className="text-xs font-black uppercase tracking-widest" style={{ color: th.navAC }}>Tes tentatives précédentes</h3>
          <div className="space-y-2">
            {history.slice(0, 8).map((h) => (
              <button key={h.id} onClick={() => setCurrent(h)}
                className="w-full text-left px-4 py-2.5 rounded-xl text-xs transition-colors hover:opacity-80"
                style={{ background: th.inputBg, border: `1px solid ${th.inputB}`, color: th.fg2 }}>
                {h.promptText.length > 90 ? `${h.promptText.slice(0, 90)}…` : h.promptText}
              </button>
            ))}
          </div>
        </div></GCard>
      )}
    </div>
  );
}
