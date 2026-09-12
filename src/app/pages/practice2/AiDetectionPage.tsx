import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Check, X, ScanEye, ArrowRight } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { GCard } from "@/app/components/common/GCard";
import { GT } from "@/app/components/common/GT";
import { ShimBtn, VBtn } from "@/app/components/common/Buttons";
import { listAiDetectionImagesForStudent, submitAiDetectionGuess, type AiDetectionImage } from "@/app/lib/aiDetectionImages";

const RED = "#f87171";
const GREEN = "#6adeb1";

interface Feedback { correct: boolean; isAi: boolean; explanation: string }

export function AiDetectionPage() {
  const th = useTh();
  const navigate = useNavigate();

  const [images, setImages] = useState<AiDetectionImage[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [guessing, setGuessing] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  useEffect(() => {
    listAiDetectionImagesForStudent()
      .then(setImages)
      .catch((err) => setLoadError(err instanceof Error ? err.message : "Impossible de charger la galerie."))
      .finally(() => setLoading(false));
  }, []);

  const current = images[index];

  const handleGuess = async (guessedIsAi: boolean) => {
    if (!current || guessing || feedback) return;
    setGuessing(true);
    try {
      const result = await submitAiDetectionGuess(current.id, guessedIsAi);
      setFeedback(result);
      setScore((s) => ({ correct: s.correct + (result.correct ? 1 : 0), total: s.total + 1 }));
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Erreur lors de l'envoi de ta réponse.");
    } finally {
      setGuessing(false);
    }
  };

  const handleNext = () => {
    setFeedback(null);
    setIndex((i) => i + 1);
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <button onClick={() => navigate("/practice2")} className="flex items-center gap-1.5 text-sm mb-2 transition-colors hover:opacity-70" style={{ color: th.fg3 }}>
            <ArrowLeft className="w-4 h-4" />Exercez-vous 2 !
          </button>
          <h2 className="text-2xl font-black flex items-center gap-2" style={{ fontFamily: "'Funnel Display',sans-serif" }}><ScanEye className="w-5 h-5" /><GT>Détection Image IA</GT></h2>
          <p className="text-sm mt-0.5" style={{ color: th.fg3 }}>Réelle ou générée par IA ? Regarde bien avant de répondre.</p>
        </div>
        {score.total > 0 && (
          <div className="px-4 py-2 rounded-xl text-sm font-black shrink-0" style={{ background: th.inputBg, border: `1px solid ${th.inputB}`, color: th.fg }}>
            {score.correct} / {score.total}
          </div>
        )}
      </div>

      {loading && <GCard><div className="p-8 text-center text-sm" style={{ color: th.fg3 }}>Chargement…</div></GCard>}
      {!loading && loadError && <GCard><div className="p-6 text-sm" style={{ color: RED }}>{loadError}</div></GCard>}
      {!loading && !loadError && images.length === 0 && (
        <GCard><div className="p-8 text-center text-sm" style={{ color: th.fg3 }}>Aucune image dans la galerie pour le moment — reviens plus tard.</div></GCard>
      )}

      {!loading && !loadError && current && (
        <GCard glow><div className="p-6 space-y-5">
          <div className="text-xs font-bold" style={{ color: th.fg3 }}>Image {index + 1} / {images.length}</div>
          <img src={current.imageUrl} className="w-full rounded-xl bg-black mx-auto" style={{ maxWidth: 480, aspectRatio: "1/1", objectFit: "cover" }} />

          {!feedback && (
            <div className="flex items-center gap-3 justify-center flex-wrap">
              <VBtn onClick={() => handleGuess(false)} disabled={guessing}><span className="flex items-center gap-1.5">Réelle</span></VBtn>
              <ShimBtn onClick={() => handleGuess(true)} disabled={guessing}><span className="flex items-center gap-1.5">Générée par IA</span></ShimBtn>
            </div>
          )}

          {feedback && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-bold" style={{ background: feedback.correct ? "rgba(106,222,177,0.1)" : "rgba(248,113,113,0.1)", border: `1px solid ${feedback.correct ? GREEN : RED}40`, color: feedback.correct ? GREEN : RED }}>
                {feedback.correct ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                {feedback.correct ? "Bonne réponse !" : `Raté — cette image est ${feedback.isAi ? "générée par IA" : "réelle"}.`}
              </div>
              {feedback.isAi && (
                <div className="rounded-xl p-4 text-sm leading-relaxed" style={{ background: th.inputBg, border: `1px solid ${th.inputB}`, color: th.fg2 }}>
                  {feedback.explanation}
                </div>
              )}
              {index < images.length - 1
                ? <ShimBtn onClick={handleNext}><span className="flex items-center gap-2">Image suivante<ArrowRight className="w-4 h-4" /></span></ShimBtn>
                : <p className="text-sm font-bold" style={{ color: th.fg }}>C'était la dernière image de la galerie — bravo !</p>}
            </div>
          )}
        </div></GCard>
      )}
    </div>
  );
}
