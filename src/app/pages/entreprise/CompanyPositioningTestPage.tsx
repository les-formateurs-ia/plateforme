import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { useAuth } from "@/app/state/auth-context";
import { isStaff } from "@/app/lib/permissions";
import { GCard } from "@/app/components/common/GCard";
import { GT } from "@/app/components/common/GT";
import { ShimBtn } from "@/app/components/common/Buttons";
import { getPositioningTestForTaking, submitPositioningAttempt, type PositioningQuestionForStudent } from "@/app/lib/entreprise/companyPositioning";

export function CompanyPositioningTestPage() {
  const th = useTh();
  const navigate = useNavigate();
  const { user, companyId, role } = useAuth();
  // Un membre du staff n'a pas de companyId sur son propre profil : s'il
  // atteint cette page (aperçu depuis CompanyPreviewPage), on calcule le
  // score localement sans écrire en base — la RLS (same_company()) refuserait
  // de toute façon l'insert pour un compte staff.
  const isPreview = isStaff(role) && !companyId;
  const { testId } = useParams<{ testId: string }>();

  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState<PositioningQuestionForStudent[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [score, setScore] = useState<number | null>(null);

  useEffect(() => {
    if (!testId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const result = await getPositioningTestForTaking(testId);
        if (cancelled) return;
        setTitle(result.title);
        setQuestions(result.questions);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [testId]);

  const select = (questionId: string, optionId: string) => setAnswers((prev) => ({ ...prev, [questionId]: optionId }));

  const handleSubmit = async () => {
    if (!user || !testId || submitting) return;
    setSubmitting(true);
    try {
      const payload = questions.map((q) => {
        const selectedOptionId = answers[q.id];
        const correct = q.options.find((o) => o.id === selectedOptionId)?.isCorrect ?? false;
        return { questionId: q.id, selectedOptionId, correct };
      });
      if (isPreview) {
        setScore(payload.length ? Math.round((payload.filter((a) => a.correct).length / payload.length) * 100) : 0);
        return;
      }
      if (!companyId) return;
      const result = await submitPositioningAttempt(testId, companyId, user.id, payload);
      setScore(result);
    } finally {
      setSubmitting(false);
    }
  };

  const allAnswered = questions.length > 0 && questions.every((q) => answers[q.id]);

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-6">
      <button onClick={() => navigate("/")} className="flex items-center gap-1.5 text-sm transition-colors hover:opacity-70" style={{ color: th.fg3 }}>
        <ArrowLeft className="w-4 h-4" />Retour
      </button>
      <h2 className="text-2xl font-black" style={{ fontFamily: "'Funnel Display',sans-serif" }}><GT>{title || "Test de positionnement"}</GT></h2>

      {loading && <p className="text-sm" style={{ color: th.fg3 }}>Chargement…</p>}

      {!loading && score !== null && (
        <GCard glow accent className="p-8 text-center">
          <CheckCircle2 className="w-10 h-10 mx-auto mb-3" style={{ color: "#6adeb1" }} />
          <div className="text-2xl font-black" style={{ color: th.fg }}>{score}%</div>
          <p className="text-sm mt-1" style={{ color: th.fg3 }}>{isPreview ? "Aperçu — réponses non enregistrées." : "Réponses enregistrées. Merci !"}</p>
        </GCard>
      )}

      {!loading && score === null && (
        <div className="space-y-4">
          {questions.map((q, i) => (
            <GCard key={q.id} className="p-5">
              <div className="text-sm font-semibold mb-3" style={{ color: th.fg }}>{i + 1}. {q.question}</div>
              <div className="space-y-2">
                {q.options.map((o) => {
                  const active = answers[q.id] === o.id;
                  return (
                    <button key={o.id} onClick={() => select(q.id, o.id)}
                      className="w-full text-left px-4 py-2.5 rounded-xl text-sm transition-all"
                      style={active
                        ? { background: `linear-gradient(135deg,${th.grad1},${th.grad2})`, color: "#fff", fontWeight: 700 }
                        : { background: th.inputBg, border: `1px solid ${th.inputB}`, color: th.fg2 }}>
                      {o.label}
                    </button>
                  );
                })}
              </div>
            </GCard>
          ))}
          {!!questions.length && (
            <ShimBtn onClick={handleSubmit} disabled={!allAnswered || submitting}>{submitting ? "Envoi..." : "Valider mes réponses"}</ShimBtn>
          )}
        </div>
      )}
    </div>
  );
}
