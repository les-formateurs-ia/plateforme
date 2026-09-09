import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, CheckCircle2, Star } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { useAuth } from "@/app/state/auth-context";
import { GCard } from "@/app/components/common/GCard";
import { GT } from "@/app/components/common/GT";
import { ShimBtn } from "@/app/components/common/Buttons";
import { cx } from "@/app/lib/cx";
import {
  getSatisfactionTestForTaking, submitSatisfactionResponse,
  type SatisfactionQuestionForStudent, type SatisfactionAnswer,
} from "@/app/lib/entreprise/companySatisfaction";

export function CompanySatisfactionTestPage() {
  const th = useTh();
  const navigate = useNavigate();
  const { user, companyId } = useAuth();
  const { testId } = useParams<{ testId: string }>();

  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState<SatisfactionQuestionForStudent[]>([]);
  const [answers, setAnswers] = useState<Record<string, string | number>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!testId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const result = await getSatisfactionTestForTaking(testId);
        if (cancelled) return;
        setTitle(result.title);
        setQuestions(result.questions);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [testId]);

  const setAnswer = (questionId: string, value: string | number) => setAnswers((prev) => ({ ...prev, [questionId]: value }));

  const handleSubmit = async () => {
    if (!user || !companyId || !testId || submitting) return;
    setSubmitting(true);
    try {
      const payload: SatisfactionAnswer[] = questions.map((q) => ({ questionId: q.id, type: q.type, value: answers[q.id] ?? "" }));
      await submitSatisfactionResponse(testId, companyId, user.id, payload);
      setDone(true);
    } finally {
      setSubmitting(false);
    }
  };

  const allAnswered = questions.length > 0 && questions.every((q) => {
    const v = answers[q.id];
    return v !== undefined && v !== "";
  });

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-6">
      <button onClick={() => navigate("/")} className="flex items-center gap-1.5 text-sm transition-colors hover:opacity-70" style={{ color: th.fg3 }}>
        <ArrowLeft className="w-4 h-4" />Retour
      </button>
      <h2 className="text-2xl font-black" style={{ fontFamily: "'Funnel Display',sans-serif" }}><GT>{title || "Test de satisfaction"}</GT></h2>

      {loading && <p className="text-sm" style={{ color: th.fg3 }}>Chargement…</p>}

      {!loading && done && (
        <GCard glow accent className="p-8 text-center">
          <CheckCircle2 className="w-10 h-10 mx-auto mb-3" style={{ color: "#6adeb1" }} />
          <p className="text-sm" style={{ color: th.fg3 }}>Merci pour ton retour !</p>
        </GCard>
      )}

      {!loading && !done && (
        <div className="space-y-4">
          {questions.map((q, i) => (
            <GCard key={q.id} className="p-5">
              <div className="text-sm font-semibold mb-3" style={{ color: th.fg }}>{i + 1}. {q.question}</div>

              {q.type === "qcm" && (
                <div className="space-y-2">
                  {q.options.map((o) => {
                    const active = answers[q.id] === o.id;
                    return (
                      <button key={o.id} onClick={() => setAnswer(q.id, o.id)}
                        className="w-full text-left px-4 py-2.5 rounded-xl text-sm transition-all"
                        style={active
                          ? { background: `linear-gradient(135deg,${th.grad1},${th.grad2})`, color: "#fff", fontWeight: 700 }
                          : { background: th.inputBg, border: `1px solid ${th.inputB}`, color: th.fg2 }}>
                        {o.label}
                      </button>
                    );
                  })}
                </div>
              )}

              {q.type === "rating" && (
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} onClick={() => setAnswer(q.id, n)} className="p-1">
                      <Star className={cx("w-7 h-7 transition-colors")} style={{ color: (answers[q.id] as number) >= n ? "#fbbf24" : th.fg3, fill: (answers[q.id] as number) >= n ? "#fbbf24" : "none" }} />
                    </button>
                  ))}
                </div>
              )}

              {q.type === "text" && (
                <textarea
                  value={(answers[q.id] as string) ?? ""}
                  onChange={(e) => setAnswer(q.id, e.target.value)}
                  rows={3}
                  placeholder="Ta réponse..."
                  className="w-full rounded-xl px-4 py-2.5 text-sm g-input resize-none"
                />
              )}
            </GCard>
          ))}
          {!!questions.length && (
            <ShimBtn onClick={handleSubmit} disabled={!allAnswered || submitting}>{submitting ? "Envoi..." : "Envoyer mes réponses"}</ShimBtn>
          )}
        </div>
      )}
    </div>
  );
}
