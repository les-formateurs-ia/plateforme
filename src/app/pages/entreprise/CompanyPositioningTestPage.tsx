import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ClipboardList, Award, Trophy, SearchX } from "lucide-react";
import { useAuth } from "@/app/state/auth-context";
import { isStaff } from "@/app/lib/permissions";
import { HueProvider, PageHero, ChoiceButton, LetterBadge, CompletionPanel, HueButton, EmptyState, Loading, type Hue } from "@/app/components/entreprise/EntrepriseKit";
import { QuestionStepper } from "@/app/components/entreprise/QuestionStepper";
import {
  getPositioningTestForTaking, submitPositioningAttempt, QUIZ_KIND_LABEL,
  type PositioningQuestionForStudent, type CompanyQuizKind,
} from "@/app/lib/entreprise/companyPositioning";

export function CompanyPositioningTestPage() {
  const navigate = useNavigate();
  const { user, companyId, role } = useAuth();
  // Un membre du staff n'a pas de companyId sur son propre profil : s'il
  // atteint cette page (aperçu depuis CompanyPreviewPage), on calcule le
  // score localement sans écrire en base — la RLS (same_company()) refuserait
  // de toute façon l'insert pour un compte staff.
  const isPreview = isStaff(role) && !companyId;
  const { testId } = useParams<{ testId: string }>();

  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<CompanyQuizKind>("positioning");
  const [questions, setQuestions] = useState<PositioningQuestionForStudent[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!testId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const result = await getPositioningTestForTaking(testId);
        if (cancelled) return;
        setTitle(result.title);
        setKind(result.kind);
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

  const style: { hue: Hue; Icon: typeof Award } = kind === "validation" ? { hue: "amber", Icon: Award } : { hue: "blue", Icon: ClipboardList };
  const goBack = () => (window.history.state?.idx > 0 ? navigate(-1) : navigate("/"));
  const question = questions[current];

  return (
    <HueProvider hue={style.hue}>
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-6">
        <PageHero back={{ label: "Retour", onClick: goBack }} eyebrow={QUIZ_KIND_LABEL[kind].singular} title={title || QUIZ_KIND_LABEL[kind].singular}
          desc={score === null && questions.length ? `${questions.length} question${questions.length > 1 ? "s" : ""} · une seule réponse par question · une seule tentative` : undefined} Icon={style.Icon} />

        {loading && <Loading />}

        {!loading && score !== null && (
          <CompletionPanel Icon={Trophy} title="Quiz terminé" big={`${score}%`}
            message={isPreview ? "Aperçu — réponses non enregistrées." : "Tes réponses sont enregistrées. Merci !"}>
            <HueButton onClick={goBack}>Revenir à mon espace</HueButton>
          </CompletionPanel>
        )}

        {!loading && score === null && !questions.length && <EmptyState Icon={SearchX} title="Ce quiz ne contient pas encore de question" />}

        {!loading && score === null && question && (
          <QuestionStepper index={current} total={questions.length} answered={questions.map((q) => !!answers[q.id])} onJump={setCurrent}
            question={question.question} hint="Une seule bonne réponse."
            canNext={current === questions.length - 1 ? allAnswered : !!answers[question.id]}
            submitting={submitting} submitLabel="Valider mes réponses" onSubmit={() => void handleSubmit()}>
            <div className="grid sm:grid-cols-2 gap-3">
              {question.options.map((o, i) => {
                const active = answers[question.id] === o.id;
                return (
                  <ChoiceButton key={o.id} big active={active} onClick={() => select(question.id, o.id)}
                    indicator={<LetterBadge letter={String.fromCharCode(65 + i)} active={active} />}>
                    {o.label}
                  </ChoiceButton>
                );
              })}
            </div>
          </QuestionStepper>
        )}
      </div>
    </HueProvider>
  );
}
